import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { eur } from "./format";

const dateAujourdhui = () =>
  new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

// Les polices standards de jsPDF (Helvetica...) ne savent pas afficher les
// espaces fines insécables utilisées par le formatage monétaire fr-FR
// (U+202F entre les milliers, U+00A0 avant le symbole €) : elles s'affichent
// comme un caractère illisible. On les remplace par une espace normale,
// uniquement pour le rendu PDF.
const eurPdf = (v) => eur(v).replace(/[  ]/g, " ");

// Styles communs à tous les tableaux : bordures visibles entre chaque ligne
// et alternance de fond plus contrastée, pour faciliter la lecture. Le texte
// des en-têtes est explicitement forcé en blanc (chaque en-tête a un fond
// coloré foncé) : sans ça, la couleur de texte sombre définie ci-dessous
// pour le corps du tableau s'appliquerait aussi aux en-têtes et deviendrait
// illisible sur fond foncé.
const tableStyle = {
  theme: "grid",
  styles: { fontSize: 9, textColor: [30, 41, 59], lineColor: [148, 163, 184], lineWidth: 0.1 },
  alternateRowStyles: { fillColor: [226, 232, 240] },
};
const headStyleBase = { textColor: [255, 255, 255], fontStyle: "bold" };

const slug = (s) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "simulation";

// Capture un graphique affiché à l'écran (élément DOM) sous forme d'image
// JPEG, pour l'intégrer dans le PDF. Retourne null si l'élément n'est pas
// disponible (composant pas encore monté, ref manquante...). JPEG à qualité
// 0.92 plutôt que PNG : le fond blanc et les aplats de couleur des
// graphiques compressent nettement mieux, pour un PDF final plus léger.
async function capturerGraphique(element) {
  if (!element) return null;
  const canvas = await html2canvas(element, { scale: 1.5, backgroundColor: "#ffffff", logging: false });
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.92), width: canvas.width, height: canvas.height };
}

// Génère et télécharge un extrait PDF de la simulation Laverie en cours :
// nom donné par l'utilisateur, date, résultats clés, deux graphiques
// (capturés depuis l'écran), paramètres saisis et projection annuelle
// complète.
export async function exporterLaveriePdf({ nomSimulation, projet, resultats, charts }) {
  const titre = nomSimulation?.trim() ? nomSimulation.trim() : "Simulation sans titre";
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFontSize(16);
  doc.text(titre, margin, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Simulateur de rentabilité - Laverie - Exporte le ${dateAujourdhui()}`, margin, 25);

  autoTable(doc, {
    ...tableStyle,
    startY: 32,
    head: [["Résultats clés (année 1)", "Valeur"]],
    body: [
      ["Investissement total (HT)", eurPdf(resultats.inv)],
      ["Dont frais d'acquisition", eurPdf(resultats.fraisAcquisition)],
      ["Emprunt", eurPdf(resultats.capitalEmprunte)],
      ["Mensualité du prêt", eurPdf(resultats.mensu)],
      ["EBE annuel", eurPdf(resultats.a1.ebe)],
      ["Résultat net", eurPdf(resultats.a1.resultatNet)],
      ["Dont impôt sur les sociétés", eurPdf(resultats.a1.impotSociete)],
      ["Cash-flow net après impôt", eurPdf(resultats.a1.cashflowNet)],
      ["Rentabilité économique", `${resultats.rentaEco.toFixed(1)} %`],
      ["Rentabilité sur apport (nette)", `${resultats.rentaApport.toFixed(1)} %`],
      ["Seuil de rentabilité (CA minimum HT)", eurPdf(resultats.seuilCA)],
      ["Délai de récupération", resultats.delai ? `${resultats.delai.toFixed(1)} ans` : "—"],
    ],
    headStyles: { ...headStyleBase, fillColor: [29, 78, 216] },
  });

  // Graphiques : capturés depuis l'écran (là où ils sont déjà rendus), puis
  // insérés chacun sur sa propre page.
  const [imgTresorerie, imgCaCharges] = await Promise.all([
    capturerGraphique(charts?.tresorerie),
    capturerGraphique(charts?.caCharges),
  ]);

  const ajouterGraphique = (img, titreGraphique) => {
    if (!img) return;
    doc.addPage();
    doc.setFontSize(12);
    doc.setTextColor(16, 24, 40);
    doc.text(titreGraphique, margin, 18);
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (img.height / img.width) * imgWidth;
    doc.addImage(img.dataUrl, "JPEG", margin, 24, imgWidth, imgHeight);
  };

  ajouterGraphique(imgTresorerie, "Trésorerie cumulée après impôt, et bénéfice net par année");
  ajouterGraphique(imgCaCharges, "Chiffre d'affaires et charges — projection sur la durée");

  doc.addPage();
  autoTable(doc, {
    ...tableStyle,
    startY: 20,
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
        ["Crédit-bail — durée du contrat", `${projet.dureeCreditBail} ans`],
        ["Crédit-bail — valeur de l'option d'achat", eurPdf(projet.valeurOptionAchat)],
      ] : []),
    ],
    headStyles: { ...headStyleBase, fillColor: [100, 116, 139] },
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
    headStyles: { ...headStyleBase, fillColor: [180, 83, 9] },
  });

  autoTable(doc, {
    ...tableStyle,
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Année", "CA", "Charges", "EBE", "Intérêts", "IS", "Résultat net", "Cash-flow net", "Trésorerie cumulée"]],
    body: resultats.data.filter((d) => d.annee > 0).map((d) => [
      d.annee,
      eurPdf(d.ca), eurPdf(d.chargesExploitation), eurPdf(d.ebe), eurPdf(d.interetsEmprunt),
      eurPdf(d.impotSociete), eurPdf(d.resultatNet), eurPdf(d.cashflowNet), eurPdf(d.cashCumule),
    ]),
    headStyles: { ...headStyleBase, fillColor: [16, 24, 40] },
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
  }

  doc.save(`${slug(titre)}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
