import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { eur } from "./format";

const dateAujourdhui = () =>
  new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

// Les polices standards de jsPDF (Helvetica...) ne savent pas afficher les
// espaces fines insécables utilisées par le formatage monétaire fr-FR
// (U+202F entre les milliers, U+00A0 avant le symbole €) : elles s'affichent
// comme un caractère illisible. On les remplace par une espace normale,
// uniquement pour le rendu PDF. Construites via String.fromCharCode plutôt
// qu'un littéral, pour ne jamais dépendre d'un caractère spécial recopié
// tel quel (fragile selon l'éditeur/l'encodage).
const NARROW_NBSP = String.fromCharCode(0x202f);
const NBSP = String.fromCharCode(0x00a0);
const eurPdf = (v) => eur(v).split(NARROW_NBSP).join(" ").split(NBSP).join(" ");

// Palette reprise des accents utilisés à l'écran, pour une cohérence
// visuelle entre l'application et l'export PDF.
const COLORS = {
  primary: [29, 78, 216], // #1D4ED8 bleu
  slate: [100, 116, 139], // #64748B gris
  amber: [180, 83, 9], // #B45309 ambre
  dark: [16, 24, 40], // #101828 marine
  green: [5, 150, 105], // #059669
  red: [220, 38, 38], // #DC2626
};

// Styles communs à tous les tableaux : bordures visibles entre chaque ligne
// et alternance de fond plus contrastée, pour faciliter la lecture. Le texte
// des en-têtes est explicitement forcé en blanc (chaque en-tête a un fond
// coloré foncé) : sans ça, la couleur de texte sombre définie ci-dessous
// pour le corps du tableau s'appliquerait aussi aux en-têtes et deviendrait
// illisible sur fond foncé.
const tableStyle = {
  theme: "grid",
  styles: { fontSize: 9, textColor: [30, 41, 59], lineColor: [148, 163, 184], lineWidth: 0.1 },
  alternateRowStyles: { fillColor: [241, 245, 249] },
};
const headStyleBase = { textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 };

const slug = (s) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "simulation";

// Bandeau coloré pleine largeur en haut de page, avec un titre en blanc et
// un sous-titre optionnel — habillage visuel commun à toutes les pages.
function dessinerBandeau(doc, titre, sousTitre, color) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const hauteur = sousTitre ? 26 : 18;
  doc.setFillColor(...color);
  doc.rect(0, 0, pageWidth, hauteur, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(titre, 14, sousTitre ? 14 : 12);
  if (sousTitre) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(sousTitre, 14, 21);
  }
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  return hauteur;
}

// Bandeau de statut (rentable ou non), reprenant le message et la couleur
// affichés à l'écran, pour donner le verdict en un coup d'œil dès la
// première page.
function dessinerStatut(doc, y, rentable) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const color = rentable ? COLORS.green : COLORS.red;
  doc.setFillColor(...color);
  doc.rect(0, y, pageWidth, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    rentable
      ? "Cash-flow net positif : le projet s'autofinance, impôt inclus."
      : "Cash-flow net négatif : le projet ne couvre pas ses charges une fois l'impôt payé.",
    14,
    y + 8
  );
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  return y + 12;
}

// Capture le graphique (SVG recharts) affiché à l'écran sous forme d'image
// JPEG, pour l'intégrer dans le PDF. Rasterise directement le <svg> via le
// navigateur (sérialisation + <img> + <canvas>) plutôt que par une
// librairie type html2canvas : celle-ci approxime le rendu HTML/CSS et ne
// gère pas correctement les dégradés SVG (linearGradient) utilisés par nos
// graphiques, ce qui produisait un cadre vide sans les courbes. Cette
// méthode s'appuie sur le moteur de rendu SVG natif du navigateur, donc
// fidèle au pixel près. Retourne null si le graphique n'est pas disponible
// (composant pas encore monté, ref manquante, pas de <svg> trouvé...).
async function capturerGraphique(element) {
  const svg = element?.querySelector("svg");
  if (!svg) return null;

  const width = parseFloat(svg.getAttribute("width")) || svg.clientWidth;
  const height = parseFloat(svg.getAttribute("height")) || svg.clientHeight;
  if (!width || !height) return null;

  let svgString = new XMLSerializer().serializeToString(svg);
  if (!svgString.includes("xmlns=")) {
    svgString = svgString.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Échec du chargement du graphique en image"));
      image.src = url;
    });

    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return { dataUrl: canvas.toDataURL("image/jpeg", 0.92), width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Dessine une légende simple (carré de couleur + libellé) sous le titre
// d'un graphique — recharts affiche sa légende en HTML à côté du <svg>, qui
// n'est donc pas inclus dans l'image rasterisée ci-dessus.
function dessinerLegende(doc, x, y, series) {
  doc.setFontSize(9);
  let curX = x;
  series.forEach(({ nom, couleur }) => {
    doc.setFillColor(...couleur);
    doc.rect(curX, y - 3, 3, 3, "F");
    doc.setTextColor(30, 41, 59);
    doc.text(nom, curX + 5, y);
    curX += 5 + doc.getTextWidth(nom) + 8;
  });
}

// Cellule de tableau mise en valeur : texte en gras et en couleur, pour
// faire ressortir les chiffres clés au milieu des lignes neutres.
const accent = (valeur, couleur) => ({ content: valeur, styles: { textColor: couleur, fontStyle: "bold" } });

// Génère et télécharge un extrait PDF de la simulation Laverie en cours :
// nom donné par l'utilisateur, date, résultats clés, deux graphiques
// (capturés depuis l'écran), paramètres saisis et projection annuelle
// complète.
export async function exporterLaveriePdf({ nomSimulation, projet, resultats, charts }) {
  const titre = nomSimulation?.trim() ? nomSimulation.trim() : "Simulation sans titre";
  const rentable = resultats.a1.cashflowNet > 0;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  let y = dessinerBandeau(
    doc,
    titre,
    `Simulateur de rentabilité - Laverie - Exporté le ${dateAujourdhui()}`,
    COLORS.primary
  );
  y = dessinerStatut(doc, y, rentable);

  autoTable(doc, {
    ...tableStyle,
    startY: y + 6,
    head: [["Résultats clés (année 1)", "Valeur"]],
    body: [
      ["Investissement total (HT)", accent(eurPdf(resultats.inv), COLORS.primary)],
      ["Dont frais d'acquisition", eurPdf(resultats.fraisAcquisition)],
      ["Emprunt", eurPdf(resultats.capitalEmprunte)],
      ["Mensualité du prêt", eurPdf(resultats.mensu)],
      ["EBE annuel", accent(eurPdf(resultats.a1.ebe), COLORS.amber)],
      ["Résultat net", eurPdf(resultats.a1.resultatNet)],
      ["Dont impôt sur les sociétés", eurPdf(resultats.a1.impotSociete)],
      ["Cash-flow net après impôt", accent(eurPdf(resultats.a1.cashflowNet), rentable ? COLORS.green : COLORS.red)],
      ["Rentabilité économique", `${resultats.rentaEco.toFixed(1)} %`],
      ["Rentabilité sur apport (nette)", accent(`${resultats.rentaApport.toFixed(1)} %`, COLORS.primary)],
      ["Seuil de rentabilité (CA minimum HT)", eurPdf(resultats.seuilCA)],
      ["Délai de récupération", resultats.delai ? `${resultats.delai.toFixed(1)} ans` : "—"],
    ],
    headStyles: { ...headStyleBase, fillColor: COLORS.primary },
  });

  // Graphiques : capturés depuis l'écran (là où ils sont déjà rendus), puis
  // insérés chacun sur sa propre page avec un bandeau assorti à leur couleur.
  const [imgTresorerie, imgCaCharges] = await Promise.all([
    capturerGraphique(charts?.tresorerie),
    capturerGraphique(charts?.caCharges),
  ]);

  const ajouterGraphique = (img, titreGraphique, color, series) => {
    if (!img) return;
    doc.addPage();
    const yBandeau = dessinerBandeau(doc, titreGraphique, null, color);
    dessinerLegende(doc, margin, yBandeau + 6, series);
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (img.height / img.width) * imgWidth;
    doc.addImage(img.dataUrl, "JPEG", margin, yBandeau + 10, imgWidth, imgHeight);
  };

  ajouterGraphique(
    imgTresorerie,
    "Trésorerie cumulée après impôt, et bénéfice net par année",
    rentable ? COLORS.green : COLORS.red,
    [
      { nom: "Trésorerie cumulée (nette)", couleur: rentable ? COLORS.green : COLORS.red },
      { nom: "Bénéfice net (année)", couleur: COLORS.amber },
    ]
  );
  ajouterGraphique(
    imgCaCharges,
    "Chiffre d'affaires et charges — projection sur la durée",
    COLORS.primary,
    [
      { nom: "Chiffre d'affaires (paliers de prix)", couleur: COLORS.primary },
      { nom: "Charges + crédit-bail", couleur: COLORS.amber },
    ]
  );

  doc.addPage();
  y = dessinerBandeau(doc, "Paramètres de la simulation", null, COLORS.slate);
  autoTable(doc, {
    ...tableStyle,
    startY: y + 8,
    head: [["Achat, frais d'acquisition et financement", "Valeur"]],
    body: [
      ["Prix du fonds de commerce (HT)", eurPdf(projet.fonds)],
      ["Prix des murs (hors frais de notaire)", eurPdf(projet.murs)],
      ["Travaux (TTC)", eurPdf(projet.travaux)],
      ["Droits d'enregistrement (fonds)", eurPdf(resultats.droits)],
      ["Frais d'avocat", eurPdf(projet.fraisAvocat)],
      ["Frais de notaire (murs)", eurPdf(projet.fraisNotaireMurs)],
      ["Commission d'intermédiaire", eurPdf(projet.commissionIntermediaire)],
      ["Audit d'acquisition", eurPdf(projet.auditAcquisition)],
      ["Frais de dossier bancaire", eurPdf(projet.fraisDossierBancaire)],
      ["Garantie bancaire (caution)", eurPdf(projet.fraisGarantieBancaire)],
      ["Greffe et formalités", eurPdf(projet.fraisFormalites)],
      ["Apport", eurPdf(projet.apport)],
      ["Taux du prêt", `${projet.taux} %`],
      ["Durée du prêt", `${projet.duree} ans`],
      ["Durée de la simulation", `${projet.dureeSimulation} ans`],
      ...(projet.creditBailActif ? [
        ["Crédit-bail — loyer annuel", eurPdf(projet.loyerCreditBailAnnuel)],
        ["Crédit-bail — durée restante", `${projet.dureeCreditBail} mois`],
        ["Crédit-bail — valeur de l'option d'achat", eurPdf(projet.valeurOptionAchat)],
      ] : []),
    ],
    headStyles: { ...headStyleBase, fillColor: COLORS.slate },
  });

  autoTable(doc, {
    ...tableStyle,
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Exploitation (année 1) et amortissements", "Valeur"]],
    body: [
      ["Chiffre d'affaires (HT)", eurPdf(projet.chiffreAffaires)],
      ["Prix moyen par lavage", `${projet.prixMoyenLavage.toFixed(2)} €`],
      ["Hausse de prix par palier", `+${projet.augmentationPrixLavage.toFixed(2)} € tous les ${projet.frequenceAugmentationPrix} ans`],
      ["Loyer annuel (HT)", eurPdf(projet.loyer)],
      ["Eau (HT, année 1)", eurPdf(projet.eau)],
      ["Gaz (HT, année 1)", eurPdf(projet.gaz)],
      ["Électricité (HT, année 1)", eurPdf(projet.electricite)],
      ["Hausse annuelle de l'énergie", `${projet.augmentationEnergieAnnuelle} %`],
      ["Assurance (prime annuelle)", eurPdf(projet.assurance)],
      ["CFE", eurPdf(projet.cfe)],
      ["Entretien / maintenance (HT)", eurPdf(projet.entretien)],
      ["Durée d'amortissement", `${projet.dureeAmortissement} ans`],
      ["Dotation annuelle aux amortissements", eurPdf(projet.dotationsAmortissement)],
    ],
    headStyles: { ...headStyleBase, fillColor: COLORS.amber },
  });

  if (doc.lastAutoTable.finalY > 230) doc.addPage();
  const projectionStartY = doc.lastAutoTable.finalY > 230 ? 20 : doc.lastAutoTable.finalY + 8;

  autoTable(doc, {
    ...tableStyle,
    startY: projectionStartY,
    head: [["Année", "CA", "Charges", "EBE", "Intérêts", "IS", "Résultat net", "Cash-flow net", "Trésorerie cumulée"]],
    body: resultats.data.filter((d) => d.annee > 0).map((d) => [
      d.annee,
      eurPdf(d.ca), eurPdf(d.chargesExploitation), eurPdf(d.ebe), eurPdf(d.interetsEmprunt),
      eurPdf(d.impotSociete), eurPdf(d.resultatNet),
      accent(eurPdf(d.cashflowNet), d.cashflowNet >= 0 ? COLORS.green : COLORS.red),
      eurPdf(d.cashCumule),
    ]),
    headStyles: { ...headStyleBase, fillColor: COLORS.dark },
    styles: { ...tableStyle.styles, fontSize: 8 },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      "Simulation à titre pédagogique, ceci n'est pas un conseil en investissement.",
      margin,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 8,
      { align: "right" }
    );
  }

  doc.save(`${slug(titre)}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
