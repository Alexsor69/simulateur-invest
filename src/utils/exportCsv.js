// Génère et télécharge un extrait CSV (ouvrable directement dans Excel/LibreOffice)
// de la simulation Laverie en cours : nom, date, paramètres, résultats clés et
// projection annuelle complète.

const dateAujourdhui = () => new Date().toLocaleDateString("fr-FR");
const num = (v) => Math.round(v);

function ligne(cellules) {
  return cellules
    .map((c) => {
      const v = c == null ? "" : String(c);
      return /[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    })
    .join(";");
}

const slug = (s) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "simulation";

export function exporterLaverieCsv({ nomSimulation, projet, resultats }) {
  const titre = nomSimulation?.trim() ? nomSimulation.trim() : "Simulation sans titre";
  const lignes = [];

  lignes.push(ligne(["Simulateur de rentabilité - Laverie"]));
  lignes.push(ligne(["Nom de la simulation", titre]));
  lignes.push(ligne(["Date d'export", dateAujourdhui()]));
  lignes.push(ligne([]));

  lignes.push(ligne(["Résultats clés (année 1)", "Valeur"]));
  lignes.push(ligne(["Investissement total (HT)", num(resultats.inv)]));
  lignes.push(ligne(["Dont frais d'acquisition", num(resultats.fraisAcquisition)]));
  lignes.push(ligne(["Emprunt", num(resultats.capitalEmprunte)]));
  lignes.push(ligne(["Mensualité du prêt", num(resultats.mensu)]));
  lignes.push(ligne(["EBE annuel", num(resultats.a1.ebe)]));
  lignes.push(ligne(["Résultat net", num(resultats.a1.resultatNet)]));
  lignes.push(ligne(["Dont impôt sur les sociétés", num(resultats.a1.impotSociete)]));
  lignes.push(ligne(["Cash-flow net après impôt", num(resultats.a1.cashflowNet)]));
  lignes.push(ligne(["Rentabilité économique (%)", resultats.rentaEco.toFixed(2)]));
  lignes.push(ligne(["Rentabilité sur apport nette (%)", resultats.rentaApport.toFixed(2)]));
  lignes.push(ligne(["Seuil de rentabilité CA minimum (HT)", num(resultats.seuilCA)]));
  lignes.push(ligne(["Délai de récupération (années)", resultats.delai ? resultats.delai.toFixed(2) : ""]));
  lignes.push(ligne([]));

  lignes.push(ligne(["Paramètres", "Valeur"]));
  const parametres = [
    ["Prix du fonds de commerce (HT)", projet.fonds],
    ["Prix des murs (hors frais de notaire)", projet.murs],
    ["Travaux (TTC)", projet.travaux],
    ["Droits d'enregistrement (fonds)", num(resultats.droits)],
    ["Frais d'avocat", projet.fraisAvocat],
    ["Frais de notaire (murs)", projet.fraisNotaireMurs],
    ["Commission d'intermédiaire", projet.commissionIntermediaire],
    ["Audit d'acquisition", projet.auditAcquisition],
    ["Frais de dossier bancaire", projet.fraisDossierBancaire],
    ["Garantie bancaire (caution)", projet.fraisGarantieBancaire],
    ["Greffe et formalités", projet.fraisFormalites],
    ["Durée d'amortissement (ans)", projet.dureeAmortissement],
    ["Dotation annuelle aux amortissements", projet.dotationsAmortissement],
    ["Crédit-bail actif", projet.creditBailActif ? "oui" : "non"],
    ["Crédit-bail - loyer annuel", projet.loyerCreditBailAnnuel],
    ["Crédit-bail - durée restante (mois)", projet.dureeCreditBail],
    ["Crédit-bail - valeur option d'achat", projet.valeurOptionAchat],
    ["Apport", projet.apport],
    ["Taux du prêt (%)", projet.taux],
    ["Durée du prêt (ans)", projet.duree],
    ["Durée de la simulation (ans)", projet.dureeSimulation],
    ["Chiffre d'affaires (HT, année 1)", projet.chiffreAffaires],
    ["Prix moyen par lavage", projet.prixMoyenLavage],
    ["Hausse de prix par palier", projet.augmentationPrixLavage],
    ["Fréquence de la hausse (ans)", projet.frequenceAugmentationPrix],
    ["Loyer annuel (HT)", projet.loyer],
    ["Eau (HT, année 1)", projet.eau],
    ["Gaz (HT, année 1)", projet.gaz],
    ["Électricité (HT, année 1)", projet.electricite],
    ["Hausse annuelle de l'énergie (%)", projet.augmentationEnergieAnnuelle],
    ["Assurance (prime annuelle)", projet.assurance],
    ["CFE", projet.cfe],
    ["Entretien / maintenance (HT)", projet.entretien],
  ];
  parametres.forEach(([label, valeur]) => lignes.push(ligne([label, valeur])));
  lignes.push(ligne([]));

  lignes.push(ligne([
    "Année", "Chiffre d'affaires", "Charges + crédit-bail", "EBE", "Intérêts d'emprunt",
    "Capital remboursé", "Capital restant dû", "Impôt sur les sociétés", "Résultat net",
    "Cash-flow net", "Trésorerie cumulée",
  ]));
  resultats.data
    .filter((d) => d.annee > 0)
    .forEach((d) => {
      lignes.push(ligne([
        d.annee, d.ca, d.chargesExploitation, d.ebe, d.interetsEmprunt,
        d.capitalRembourse, d.capitalRestant, d.impotSociete, d.resultatNet,
        d.cashflowNet, d.cashCumule,
      ]));
    });

  const csv = "﻿" + lignes.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(titre)}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
