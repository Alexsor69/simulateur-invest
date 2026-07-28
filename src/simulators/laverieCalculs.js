// Cas d'exemple par défaut, générique et fictif — sert uniquement à illustrer
// le fonctionnement du simulateur. Vos propres chiffres (saisis via les
// curseurs) ne sont jamais commités ici : ils restent uniquement dans le
// localStorage de votre navigateur.
export const exempleDefaut = {
  nom: "Dossier exemple",

  fonds: 200000,
  murs: 0,
  travaux: 20000,

  // Frais d'acquisition (hors droits d'enregistrement, calculés automatiquement).
  fraisAvocat: 3000,
  fraisNotaireMurs: 0,
  commissionIntermediaire: 0,
  auditAcquisition: 1500,
  fraisDossierBancaire: 1000,
  fraisGarantieBancaire: 2000,
  fraisFormalites: 500,

  apport: 40000,
  taux: 4,
  duree: 10,

  // Chiffre d'affaires de départ (année 1) et hypothèse de hausse de prix.
  chiffreAffaires: 100000,
  prixMoyenLavage: 5,
  augmentationPrixLavage: 0.2,
  frequenceAugmentationPrix: 2,

  eau: 7000,
  gaz: 6000,
  electricite: 4500,
  loyer: 9000,
  assurance: 1200,
  cfe: 1000,
  entretien: 2500,
  augmentationEnergieAnnuelle: 3,

  // Dotations aux amortissements comptables (travaux, agencements, matériel).
  // Charge non décaissée qui réduit le bénéfice imposable mais pas la trésorerie.
  dureeAmortissement: 7,
  dotationsAmortissement: 2800,

  // Crédit-bail (leasing) sur le matériel, désactivé par défaut.
  creditBailActif: false,
  loyerCreditBailAnnuel: 4000,
  dureeCreditBail: 5,
  valeurOptionAchat: 1000,
};

// Droits d'enregistrement dus par l'acquéreur sur le prix du fonds de commerce
// (barème légal, art. 719 CGI) : 0 % jusqu'à 23 000 €, 3 % de 23 000 € à
// 200 000 €, 5 % au-delà. Non négociable, donc calculé automatiquement plutôt
// que saisi manuellement.
export function droitsEnregistrementFonds(prixFonds) {
  if (prixFonds <= 0) return 0;
  const tranche2 = Math.max(0, Math.min(prixFonds, 200000) - 23000) * 0.03;
  const tranche3 = Math.max(0, prixFonds - 200000) * 0.05;
  return tranche2 + tranche3;
}

// Somme de tous les frais liés à l'opération d'acquisition (hors prix du fonds,
// des murs et des travaux eux-mêmes) : droits d'enregistrement, avocat, notaire
// (si murs), intermédiaire/agence de cession, audit d'acquisition, frais
// bancaires (dossier + garantie), formalités d'immatriculation.
export function totalFraisAcquisition(p) {
  return (
    droitsEnregistrementFonds(p.fonds) +
    p.fraisAvocat +
    p.fraisNotaireMurs +
    p.commissionIntermediaire +
    p.auditAcquisition +
    p.fraisDossierBancaire +
    p.fraisGarantieBancaire +
    p.fraisFormalites
  );
}

export function investissement(p) {
  return p.fonds + p.murs + p.travaux + totalFraisAcquisition(p);
}

export function emprunt(p) {
  return investissement(p) - p.apport;
}

// Mensualité d'un prêt amortissable classique à taux et mensualités constants.
export function mensualite(p) {
  const capital = emprunt(p);
  if (capital <= 0) return 0;

  const t = p.taux / 100 / 12;
  const n = p.duree * 12;

  if (t === 0) return capital / n;
  return (capital * t) / (1 - Math.pow(1 + t, -n));
}

// Échéancier annuel du prêt : part d'intérêts et part de capital remboursées
// chaque année, et capital restant dû en fin d'année. Nécessaire car seuls les
// intérêts sont déductibles du résultat imposable (le capital remboursé n'est
// pas une charge comptable, juste une sortie de trésorerie).
export function amortissementPret(p) {
  const capitalInitial = emprunt(p);
  const tauxMensuel = p.taux / 100 / 12;
  const mensu = mensualite(p);

  let capitalRestant = capitalInitial;
  const schedule = [];

  for (let annee = 1; annee <= p.duree; annee++) {
    let interets = 0;
    let capitalRembourse = 0;

    for (let mois = 0; mois < 12; mois++) {
      if (capitalRestant <= 0) break;
      const interetsMois = capitalRestant * tauxMensuel;
      let capitalMois = mensu - interetsMois;
      if (capitalMois > capitalRestant) capitalMois = capitalRestant;
      capitalRestant -= capitalMois;
      interets += interetsMois;
      capitalRembourse += capitalMois;
    }

    schedule.push({ annee, interets, capitalRembourse, capitalRestant: Math.max(0, capitalRestant) });
  }
  return schedule;
}

// Toutes les valeurs saisies (loyer, fluides, entretien) sont hors taxes (HT) ; assurance
// et CFE ne sont pas soumises à la TVA et s'entendent donc déjà en montant net à payer.
// Base année 1, avant application de l'inflation énergie (voir chargesExploitationAnnuelle).
export function chargesAnnuelles(p) {
  return p.loyer + p.eau + p.gaz + p.electricite + p.assurance + p.cfe + p.entretien;
}

// Chiffre d'affaires HT de l'année N, en tenant compte des hausses de prix par
// palier (non linéaire) : le volume de lavages est supposé constant (fixé par
// la capacité de la laverie), seul le prix moyen par lavage augmente d'un
// palier fixe tous les N ans.
export function chiffreAffairesAnnuel(p, annee) {
  if (p.prixMoyenLavage <= 0) return p.chiffreAffaires;
  const nombreLavages = p.chiffreAffaires / p.prixMoyenLavage;
  const freq = Math.max(1, p.frequenceAugmentationPrix);
  const paliers = Math.floor((annee - 1) / freq);
  const prixAnnee = p.prixMoyenLavage + paliers * p.augmentationPrixLavage;
  return nombreLavages * prixAnnee;
}

// Coût annuel de l'eau + gaz + électricité de l'année N, avec une inflation
// annuelle composée (contrairement au CA, qui progresse par paliers).
export function chargesEnergieAnnuelle(p, annee) {
  const base = p.eau + p.gaz + p.electricite;
  return base * Math.pow(1 + p.augmentationEnergieAnnuelle / 100, annee - 1);
}

// Charges d'exploitation de l'année N (hors crédit-bail, compté séparément) :
// loyer + assurance + CFE + entretien (constants) + énergie (indexée).
export function chargesExploitationAnnuelle(p, annee) {
  return p.loyer + p.assurance + p.cfe + p.entretien + chargesEnergieAnnuelle(p, annee);
}

// Loyer de crédit-bail de l'année N (0 si non activé ou contrat terminé).
export function loyerCreditBailAnnee(p, annee) {
  if (!p.creditBailActif) return 0;
  return annee <= p.dureeCreditBail ? p.loyerCreditBailAnnuel : 0;
}

// Levée d'option d'achat en fin de crédit-bail : sortie de trésorerie ponctuelle
// l'année où le contrat se termine (le matériel devient alors la propriété de
// l'exploitant).
export function achatOptionCreditBailAnnee(p, annee) {
  if (!p.creditBailActif) return 0;
  return annee === p.dureeCreditBail ? p.valeurOptionAchat : 0;
}

// Dotation aux amortissements comptables de l'année N (0 une fois le bien
// entièrement amorti).
export function dotationAmortissementAnnee(p, annee) {
  if (p.dureeAmortissement <= 0) return 0;
  return annee <= p.dureeAmortissement ? p.dotationsAmortissement : 0;
}

// Excédent brut d'exploitation (HT) de l'année 1 : CA - charges d'exploitation
// - loyer de crédit-bail (hors remboursement d'emprunt et hors impôts).
export function ebe(p) {
  return chiffreAffairesAnnuel(p, 1) - chargesExploitationAnnuelle(p, 1) - loyerCreditBailAnnee(p, 1);
}

// Rentabilité économique : EBE (année 1) rapporté à l'investissement total.
export function rentabiliteEconomique(p) {
  const inv = investissement(p);
  return inv === 0 ? 0 : (ebe(p) / inv) * 100;
}

// Impôt sur les sociétés, barème PME : 15 % jusqu'à 42 500 € de bénéfice
// imposable, 25 % au-delà. Pas d'impôt (et pas de remboursement) sur un
// résultat négatif — simplification qui ignore le report de déficits.
const IS_SEUIL_REDUIT = 42500;
const IS_TAUX_REDUIT = 0.15;
const IS_TAUX_NORMAL = 0.25;

export function calculIS(resultatImposable) {
  const base = Math.max(0, resultatImposable);
  if (base <= IS_SEUIL_REDUIT) return base * IS_TAUX_REDUIT;
  return IS_SEUIL_REDUIT * IS_TAUX_REDUIT + (base - IS_SEUIL_REDUIT) * IS_TAUX_NORMAL;
}

// Calcule toutes les grandeurs d'une année donnée : CA, charges, EBE, part
// d'intérêts/capital du prêt, dotation aux amortissements, résultat imposable,
// IS, résultat net, et cash-flow net réellement disponible (= résultat net +
// dotation aux amortissements [charge non décaissée] - capital remboursé
// [décaissé mais non comptabilisé en charge] - éventuelle levée d'option de
// crédit-bail).
function calculAnnee(p, annee, pretAnnee) {
  const ca = chiffreAffairesAnnuel(p, annee);
  const chargesExploit = chargesExploitationAnnuelle(p, annee);
  const loyerCB = loyerCreditBailAnnee(p, annee);
  const ebeAnnee = ca - chargesExploit - loyerCB;

  const interets = pretAnnee?.interets ?? 0;
  const capitalRembourse = pretAnnee?.capitalRembourse ?? 0;
  const capitalRestant = pretAnnee?.capitalRestant ?? 0;
  const dotation = dotationAmortissementAnnee(p, annee);

  const resultatAvantImpot = ebeAnnee - interets - dotation;
  const impotSociete = calculIS(resultatAvantImpot);
  const resultatNet = resultatAvantImpot - impotSociete;

  const achatOption = achatOptionCreditBailAnnee(p, annee);
  const cashflowNet = resultatNet + dotation - capitalRembourse - achatOption;

  return {
    annee, ca, chargesExploitation: chargesExploit + loyerCB, loyerCreditBail: loyerCB,
    ebe: ebeAnnee, interetsEmprunt: interets, capitalRembourse, capitalRestant,
    dotation, resultatAvantImpot, impotSociete, resultatNet, achatOptionCreditBail: achatOption,
    cashflowNet,
  };
}

// Détail complet de l'année 1 (utilisé pour les KPIs de synthèse).
export function anneeUn(p) {
  const pret = amortissementPret(p);
  return calculAnnee(p, 1, pret[0]);
}

// Cash-flow net disponible de l'année 1, après impôt sur les sociétés, capital
// remboursé et amortissements. C'est la trésorerie réellement dégagée par le
// projet, à comparer à l'apport pour juger de sa rentabilité réelle.
export function cashflowNetAnnee1(p) {
  return anneeUn(p).cashflowNet;
}

// Rentabilité sur capital réellement engagé : cash-flow net (après impôt) de
// l'année 1 rapporté à l'apport.
export function rentabiliteApport(p) {
  return p.apport === 0 ? 0 : (cashflowNetAnnee1(p) / p.apport) * 100;
}

// Délai de récupération de l'apport, en années (null si le cash-flow net de
// l'année 1 n'est pas positif). Approximation qui suppose ce cash-flow net
// constant ; en réalité il évolue (cf. projectionAnnuelle) avec la baisse des
// intérêts, la hausse de prix et l'inflation énergie.
export function delaiRecuperation(p) {
  const cf = cashflowNetAnnee1(p);
  if (cf <= 0) return null;
  return p.apport / cf;
}

// Chiffre d'affaires minimum (année 1) pour que le cash-flow net après impôt
// soit nul : c'est la vraie condition de viabilité du projet, impôt inclus.
// Le résultat imposable étant une fonction linéaire par morceaux du CA (à
// cause des paliers du barème d'IS), on calcule le seuil bloc par bloc et on
// retient le premier qui est cohérent avec l'hypothèse de départ.
export function seuilRentabiliteCA(p) {
  const pret = amortissementPret(p)[0] || { interets: 0, capitalRembourse: 0 };
  const loyerCB = loyerCreditBailAnnee(p, 1);
  const dotation = dotationAmortissementAnnee(p, 1);
  const coutsFixes = p.loyer + p.assurance + p.cfe + p.entretien + chargesEnergieAnnuelle(p, 1) + loyerCB
    + pret.interets + dotation;

  // Bloc 1 : résultat imposable nul ou négatif (pas d'impôt).
  let resultatImposable = pret.capitalRembourse - dotation;
  if (resultatImposable <= 0) return coutsFixes + resultatImposable;

  // Bloc 2 : dans la tranche à 15 %.
  resultatImposable = (pret.capitalRembourse - dotation) / (1 - IS_TAUX_REDUIT);
  if (resultatImposable <= IS_SEUIL_REDUIT) return coutsFixes + resultatImposable;

  // Bloc 3 : au-delà, dans la tranche à 25 %.
  const compensationBloc3 = IS_SEUIL_REDUIT * (IS_TAUX_NORMAL - IS_TAUX_REDUIT);
  resultatImposable = (pret.capitalRembourse - dotation - compensationBloc3) / (1 - IS_TAUX_NORMAL);
  return coutsFixes + resultatImposable;
}

// Projection année par année sur toute la durée du prêt : CA (paliers de
// prix), charges (énergie indexée), crédit-bail, amortissement du prêt,
// impôt sur les sociétés, cash-flow net et trésorerie cumulée. Base de tous
// les graphiques du simulateur.
export function projectionAnnuelle(p) {
  const schedulePret = amortissementPret(p);
  let cumul = -p.apport;
  const points = [{ annee: 0, cashCumule: Math.round(cumul), resultatNet: 0 }];

  for (let annee = 1; annee <= p.duree; annee++) {
    const row = calculAnnee(p, annee, schedulePret[annee - 1]);
    cumul += row.cashflowNet;

    points.push({
      annee,
      ca: Math.round(row.ca),
      chargesExploitation: Math.round(row.chargesExploitation),
      loyerCreditBail: Math.round(row.loyerCreditBail),
      ebe: Math.round(row.ebe),
      interetsEmprunt: Math.round(row.interetsEmprunt),
      capitalRembourse: Math.round(row.capitalRembourse),
      capitalRestant: Math.round(row.capitalRestant),
      impotSociete: Math.round(row.impotSociete),
      resultatNet: Math.round(row.resultatNet),
      cashflowNet: Math.round(row.cashflowNet),
      cashCumule: Math.round(cumul),
    });
  }
  return points;
}
