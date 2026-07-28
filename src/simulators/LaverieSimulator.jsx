import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { eur } from "../utils/format";
import { usePersistedState } from "../utils/usePersistedState";
import { exporterLaverieCsv } from "../utils/exportCsv";
import { Slider, Kpi, InfoLine, CustomTooltip } from "../components/ui";
import {
  exempleDefaut,
  droitsEnregistrementFonds,
  totalFraisAcquisition,
  investissement,
  emprunt,
  mensualite,
  rentabiliteEconomique,
  rentabiliteApport,
  seuilRentabiliteCA,
  delaiRecuperation,
  anneeUn,
  projectionAnnuelle,
} from "./laverieCalculs";

const prix2 = (v) => v.toFixed(2);
const STORAGE_KEY = "simulateur-invest:laverie";
const defaultState = { ...exempleDefaut, nomSimulation: "" };

export default function LaverieSimulator() {
  const [projet, setProjet] = usePersistedState(STORAGE_KEY, defaultState);

  const set = (champ) => (valeur) => setProjet((p) => ({ ...p, [champ]: valeur }));
  const { nomSimulation } = projet;

  const droits = droitsEnregistrementFonds(projet.fonds);
  const fraisAcquisition = totalFraisAcquisition(projet);
  const inv = investissement(projet);
  const capitalEmprunte = emprunt(projet);
  const mensu = mensualite(projet);
  const rentaEco = rentabiliteEconomique(projet);
  const rentaApport = rentabiliteApport(projet);
  const seuilCA = seuilRentabiliteCA(projet);
  const delai = delaiRecuperation(projet);
  const a1 = anneeUn(projet);
  const data = projectionAnnuelle(projet);

  const nombreLavages = projet.prixMoyenLavage > 0 ? projet.chiffreAffaires / projet.prixMoyenLavage : 0;

  const margeCA = projet.chiffreAffaires - seuilCA;
  const rentable = a1.cashflowNet > 0;

  const resultats = { droits, fraisAcquisition, inv, capitalEmprunte, mensu, rentaEco, rentaApport, seuilCA, delai, a1, data };

  function resetExemple() {
    setProjet((p) => ({ ...exempleDefaut, nomSimulation: p.nomSimulation }));
  }

  return (
    <div style={styles.layout}>
      {/* Panneau de paramètres */}
      <aside style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Achat</h2>
          <button type="button" style={styles.resetBtn} onClick={resetExemple}>
            Cas exemple
          </button>
        </div>
        <Slider label="Prix du fonds de commerce (HT)" value={projet.fonds} setValue={set("fonds")}
          min={0} max={600000} step={5000} format={eur} reference={exempleDefaut.fonds}
          info="Prix de cession du fonds (clientèle, matériel, droit au bail). Soumis aux droits d'enregistrement (~3 à 5 % à la charge de l'acquéreur au-delà de 23 000 €), pas à la TVA." />
        <Slider label="Prix des murs (hors frais de notaire)" value={projet.murs} setValue={set("murs")}
          min={0} max={400000} step={5000} format={eur} reference={exempleDefaut.murs}
          info="Prix d'achat du local si vous achetez aussi les murs (immobilier). Les frais de notaire sont à ajouter ci-dessous." />
        <Slider label="Travaux (TTC)" value={projet.travaux} setValue={set("travaux")}
          min={0} max={100000} step={1000} format={eur} reference={exempleDefaut.travaux}
          info="Montant TTC réellement décaissé pour les travaux de rénovation/installation." />

        <h2 style={{ ...styles.panelTitle, marginTop: 28 }}>Frais d'acquisition</h2>
        <InfoLine label="Droits d'enregistrement (fonds)" value={eur(droits)}
          info="Droits dus par l'acquéreur sur le prix du fonds de commerce (art. 719 du CGI) : 0 % jusqu'à 23 000 €, 3 % de 23 000 € à 200 000 €, 5 % au-delà. Barème légal, non négociable — calculé automatiquement."
          hint="calculé automatiquement selon le barème légal" />
        <Slider label="Frais d'avocat (fonds de commerce)" value={projet.fraisAvocat} setValue={set("fraisAvocat")}
          min={0} max={20000} step={500} format={eur} reference={exempleDefaut.fraisAvocat}
          info="Honoraires d'avocat pour la rédaction/négociation du protocole de cession, la garantie d'actif et de passif, la clause de non-concurrence, et la due diligence juridique du fonds."
          hint={`repère usuel : ${eur(projet.fonds * 0.01)} – ${eur(projet.fonds * 0.03)} (1-3 % du prix du fonds), ou forfait selon la complexité`} />
        <Slider label="Frais de notaire (murs)" value={projet.fraisNotaireMurs} setValue={set("fraisNotaireMurs")}
          min={0} max={40000} step={500} format={eur} reference={exempleDefaut.fraisNotaireMurs}
          info="Frais de notaire pour l'acquisition des murs. Sans objet si vous n'achetez pas les murs."
          hint={`repère usuel si murs > 0 : ${eur(projet.murs * 0.07)} – ${eur(projet.murs * 0.08)} (7-8 % du prix des murs, "ancien")`} />
        <Slider label="Commission d'intermédiaire" value={projet.commissionIntermediaire} setValue={set("commissionIntermediaire")}
          min={0} max={30000} step={500} format={eur} reference={exempleDefaut.commissionIntermediaire}
          info="Commission de l'agence ou de l'intermédiaire de cession. Souvent payée par le vendeur — à vérifier dans le mandat."
          hint={`si à votre charge : ${eur(projet.fonds * 0.05)} – ${eur(projet.fonds * 0.1)} (5-10 % du prix du fonds)`} />
        <Slider label="Audit d'acquisition (expert-comptable)" value={projet.auditAcquisition} setValue={set("auditAcquisition")}
          min={0} max={10000} step={250} format={eur} reference={exempleDefaut.auditAcquisition}
          info="Honoraires d'expert-comptable pour la revue des comptes et le prévisionnel du dossier de cession."
          hint="repère usuel : 1 500 € – 5 000 € selon la taille du dossier" />
        <Slider label="Frais de dossier bancaire" value={projet.fraisDossierBancaire} setValue={set("fraisDossierBancaire")}
          min={0} max={10000} step={100} format={eur} reference={exempleDefaut.fraisDossierBancaire}
          info="Frais facturés par la banque pour la mise en place du prêt professionnel."
          hint={`repère usuel : ${eur(capitalEmprunte * 0.01)} – ${eur(capitalEmprunte * 0.02)} (1-2 % du montant emprunté)`} />
        <Slider label="Garantie bancaire (caution)" value={projet.fraisGarantieBancaire} setValue={set("fraisGarantieBancaire")}
          min={0} max={15000} step={250} format={eur} reference={exempleDefaut.fraisGarantieBancaire}
          info="Coût de la garantie exigée par la banque (société de caution mutuelle, Bpifrance Garantie, hypothèque si murs)."
          hint={`repère usuel : ${eur(capitalEmprunte * 0.02)} – ${eur(capitalEmprunte * 0.03)} (2-3 % du montant emprunté)`} />
        <Slider label="Greffe et formalités" value={projet.fraisFormalites} setValue={set("fraisFormalites")}
          min={0} max={3000} step={50} format={eur} reference={exempleDefaut.fraisFormalites}
          info="Immatriculation, publication d'annonce légale (JAL), formalités de transfert du fonds."
          hint="repère usuel : 300 € – 1 000 €" />

        <h2 style={{ ...styles.panelTitle, marginTop: 28 }}>Amortissements comptables</h2>
        <Slider label="Durée d'amortissement" value={projet.dureeAmortissement} setValue={set("dureeAmortissement")}
          min={1} max={15} step={1} unit="ans" reference={exempleDefaut.dureeAmortissement}
          info="Durée sur laquelle les travaux et agencements sont amortis comptablement (linéaire). Passé ce délai, la dotation retombe à 0." />
        <Slider label="Dotation annuelle aux amortissements" value={projet.dotationsAmortissement} setValue={set("dotationsAmortissement")}
          min={0} max={20000} step={100} format={eur} reference={exempleDefaut.dotationsAmortissement}
          info="Charge comptable non décaissée qui réduit le résultat imposable mais pas la trésorerie (elle est réintégrée dans le calcul du cash-flow net)."
          hint={`repère usuel : travaux / durée d'amortissement, soit ≈ ${eur(projet.travaux / (projet.dureeAmortissement || 1))}`} />

        <h2 style={{ ...styles.panelTitle, marginTop: 28 }}>Crédit-bail (matériel)</h2>
        <label style={styles.toggleRow}>
          <input type="checkbox" checked={projet.creditBailActif}
            onChange={(e) => set("creditBailActif")(e.target.checked)} />
          <span style={{ marginLeft: 8 }}>Financer le matériel en crédit-bail</span>
        </label>
        {projet.creditBailActif && (
          <>
            <Slider label="Loyer de crédit-bail annuel" value={projet.loyerCreditBailAnnuel} setValue={set("loyerCreditBailAnnuel")}
              min={0} max={20000} step={250} format={eur} reference={exempleDefaut.loyerCreditBailAnnuel}
              info="Redevance annuelle de crédit-bail sur les machines à laver / séchoirs. Charge d'exploitation entièrement déductible, distincte de l'emprunt bancaire." />
            <Slider label="Durée du contrat" value={projet.dureeCreditBail} setValue={set("dureeCreditBail")}
              min={1} max={10} step={1} unit="ans" reference={exempleDefaut.dureeCreditBail}
              info="Durée du contrat de crédit-bail. Le loyer s'arrête à l'échéance." />
            <Slider label="Valeur de l'option d'achat" value={projet.valeurOptionAchat} setValue={set("valeurOptionAchat")}
              min={0} max={10000} step={100} format={eur} reference={exempleDefaut.valeurOptionAchat}
              info="Montant à payer en une fois à l'échéance du contrat si vous levez l'option d'achat pour devenir propriétaire du matériel (souvent une valeur symbolique)."
              hint="repère usuel : 1 à 5 % de la valeur du matériel" />
          </>
        )}

        <h2 style={{ ...styles.panelTitle, marginTop: 28 }}>Financement (emprunt bancaire)</h2>
        <Slider label="Apport" value={projet.apport} setValue={set("apport")}
          min={0} max={inv || 100000} step={1000} format={eur} reference={exempleDefaut.apport}
          info="Capital personnel apporté, non emprunté."
          hint={`repère usuel : ${eur(inv * 0.2)} – ${eur(inv * 0.3)} (20-30 % de l'investissement total)`} />
        <Slider label="Taux du prêt (hors assurance emprunteur)" value={projet.taux} setValue={set("taux")}
          min={0} max={8} step={0.1} unit="%" reference={exempleDefaut.taux}
          info="Taux d'intérêt annuel du crédit professionnel, hors assurance emprunteur et frais de dossier."
          hint="ordre de grandeur indicatif : 3 à 5 % pour un prêt professionnel (à vérifier, variable selon période et profil)" />
        <Slider label="Durée du prêt" value={projet.duree} setValue={set("duree")}
          min={1} max={25} step={1} unit="ans" reference={exempleDefaut.duree}
          info="Durée du prêt professionnel. Détermine aussi la durée des projections (courbes)."
          hint="usuel : 7 ans pour un fonds de commerce seul ; jusqu'à 10-12 ans avec du matériel lourd ; 15-20 ans si les murs sont inclus" />

        <h2 style={{ ...styles.panelTitle, marginTop: 28 }}>Exploitation (année 1, HT sauf mention)</h2>
        <Slider label="Chiffre d'affaires (HT)" value={projet.chiffreAffaires} setValue={set("chiffreAffaires")}
          min={0} max={300000} step={2000} format={eur} reference={exempleDefaut.chiffreAffaires}
          info="Chiffre d'affaires annuel hors taxes de l'année 1. Utilisez le CA réel du dossier de cession, pas une moyenne du secteur." />
        <Slider label="Prix moyen par lavage" value={projet.prixMoyenLavage} setValue={set("prixMoyenLavage")}
          min={2} max={15} step={0.1} unit="€" format={prix2} reference={exempleDefaut.prixMoyenLavage}
          info="Prix moyen encaissé par cycle de lavage, tous types de machines confondus. Sert à convertir le CA en nombre de lavages, pour projeter une hausse de CA pilotée par le prix plutôt que par le volume." />
        <InfoLine label="Nombre de lavages / an (implicite)" value={`${Math.round(nombreLavages).toLocaleString("fr-FR")}`}
          hint="CA ÷ prix moyen par lavage — supposé constant sur toute la durée (seul le prix augmente)" />
        <Slider label="Hausse de prix par palier" value={projet.augmentationPrixLavage} setValue={set("augmentationPrixLavage")}
          min={0} max={1} step={0.05} unit="€" format={prix2} reference={exempleDefaut.augmentationPrixLavage}
          info="Montant de la hausse de prix appliquée par lavage à chaque palier (non linéaire : le CA progresse par sauts, pas en continu)."
          hint="ordre de grandeur usuel : +0,20 à 0,30 € par palier" />
        <Slider label="Fréquence de la hausse" value={projet.frequenceAugmentationPrix} setValue={set("frequenceAugmentationPrix")}
          min={1} max={5} step={1} unit="ans" reference={exempleDefaut.frequenceAugmentationPrix}
          info="Tous les combien d'années le prix par lavage augmente d'un palier." />

        <Slider label="Loyer annuel (HT)" value={projet.loyer} setValue={set("loyer")}
          min={0} max={40000} step={500} format={eur} reference={exempleDefaut.loyer}
          info="Loyer du bail commercial, hors taxes." />
        <Slider label="Eau (HT, année 1)" value={projet.eau} setValue={set("eau")}
          min={0} max={20000} step={500} format={eur} reference={exempleDefaut.eau} />
        <Slider label="Gaz (HT, année 1)" value={projet.gaz} setValue={set("gaz")}
          min={0} max={20000} step={500} format={eur} reference={exempleDefaut.gaz} />
        <Slider label="Électricité (HT, année 1)" value={projet.electricite} setValue={set("electricite")}
          min={0} max={15000} step={250} format={eur} reference={exempleDefaut.electricite} />
        <Slider label="Hausse annuelle de l'énergie" value={projet.augmentationEnergieAnnuelle} setValue={set("augmentationEnergieAnnuelle")}
          min={0} max={10} step={0.5} unit="%" reference={exempleDefaut.augmentationEnergieAnnuelle}
          info="Inflation annuelle composée appliquée à eau + gaz + électricité (contrairement au CA, qui progresse par paliers de prix)."
          hint="ordre de grandeur observé ces dernières années : 3 à 5 %/an, très variable" />
        <Slider label="Assurance (prime annuelle)" value={projet.assurance} setValue={set("assurance")}
          min={0} max={5000} step={100} format={eur} reference={exempleDefaut.assurance}
          info="Prime annuelle d'assurance multirisque professionnelle. Non soumise à la TVA." />
        <Slider label="CFE" value={projet.cfe} setValue={set("cfe")}
          min={0} max={5000} step={100} format={eur} reference={exempleDefaut.cfe}
          info="Cotisation Foncière des Entreprises : impôt local annuel. Non soumis à la TVA." />
        <Slider label="Entretien / maintenance (HT)" value={projet.entretien} setValue={set("entretien")}
          min={0} max={10000} step={200} format={eur} reference={exempleDefaut.entretien}
          info="Contrat de maintenance des machines, pièces d'usure, petites réparations." />
      </aside>

      {/* Résultats */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.exportBar}>
          <div style={styles.exportField}>
            <label style={styles.exportLabel} htmlFor="nomSimulation">Nom de la simulation</label>
            <input
              id="nomSimulation"
              type="text"
              placeholder="ex. Mon dossier - hypothèse haute"
              value={nomSimulation}
              onChange={(e) => set("nomSimulation")(e.target.value)}
              style={styles.exportInput}
            />
          </div>
          <div style={styles.exportBtns}>
            <button type="button" style={styles.exportBtn}
              onClick={async () => {
                const { exporterLaveriePdf } = await import("../utils/exportPdf");
                exporterLaveriePdf({ nomSimulation, projet, resultats });
              }}>
              Exporter en PDF
            </button>
            <button type="button" style={styles.exportBtn}
              onClick={() => exporterLaverieCsv({ nomSimulation, projet, resultats })}>
              Exporter en Excel (.csv)
            </button>
          </div>
        </div>
        <p style={styles.exportNote}>
          Le nom sert à identifier l'export (PDF/Excel) ; la date du jour y est ajoutée
          automatiquement. Vos réglages sont conservés automatiquement sur cet appareil d'une
          session à l'autre.
        </p>

        <p style={styles.intro}>
          Analyse de rentabilité d'une laverie automatique, impôt sur les sociétés inclus, pour
          obtenir le <b>cash-flow net réellement disponible</b>. Sauf mention contraire, les
          montants sont exprimés <b>hors taxes (HT)</b>. Valeurs pré-remplies avec le dossier{" "}
          <b>{exempleDefaut.nom}</b> à titre d'exemple ; passez la souris sur les ⓘ pour le détail de
          chaque poste. Le repère <span style={styles.legendMark} /> sur chaque curseur indique
          la valeur du dossier {exempleDefaut.nom} — utile pour mesurer l'écart avec vos propres
          hypothèses.
        </p>

        <div style={{ ...styles.banner, borderLeftColor: rentable ? "#059669" : "#DC2626" }}>
          <div style={{ fontWeight: 700, color: rentable ? "#059669" : "#DC2626" }}>
            {rentable
              ? "Cash-flow net positif : le projet s'autofinance, impôt inclus, avec ces hypothèses."
              : "Cash-flow net négatif : le projet ne couvre pas ses charges une fois l'impôt payé."}
          </div>
          <div style={styles.bannerSub}>
            Seuil de rentabilité (CA minimum HT, après impôt) : <b>{eur(seuilCA)}</b>
            {" · "}Marge par rapport au CA actuel : <b style={{ color: margeCA >= 0 ? "#059669" : "#DC2626" }}>
              {margeCA >= 0 ? "+" : ""}{eur(margeCA)}
            </b>
          </div>
        </div>

        <div style={styles.kpiGrid}>
          <Kpi label="Investissement total (HT)" value={eur(inv)}
            sub="fonds + murs + travaux + frais d'acquisition" accent="#1D4ED8" />
          <Kpi label="Dont frais d'acquisition" value={eur(fraisAcquisition)}
            sub="droits d'enregistrement, avocat, notaire, banque…" accent="#64748B" />
          <Kpi label="Emprunt" value={eur(capitalEmprunte)}
            sub={`investissement − apport (${eur(projet.apport)})`} accent="#64748B" />
          <Kpi label="Mensualité du prêt" value={eur(mensu)}
            sub={`sur ${projet.duree} ans à ${projet.taux.toFixed(1)} %`} accent="#64748B" />
          <Kpi label="Intérêts d'emprunt (année 1)" value={eur(a1.interetsEmprunt)}
            sub="part déductible de la mensualité, décroît chaque année" accent="#64748B" />
          <Kpi label="Charges + crédit-bail (année 1)" value={eur(a1.chargesExploitation)}
            sub="loyer, fluides, assurance, CFE, entretien, crédit-bail" accent="#64748B" />
          <Kpi label="EBE annuel (année 1)" value={eur(a1.ebe)}
            sub="CA (HT) − charges − crédit-bail" accent="#B45309"
            info="Excédent Brut d'Exploitation : résultat avant intérêts, amortissements et impôt sur les bénéfices." />
          <Kpi label="Résultat net (année 1)" value={eur(a1.resultatNet)}
            sub={`dont IS : ${eur(a1.impotSociete)}`} accent="#B45309"
            info="EBE − intérêts d'emprunt − dotation aux amortissements − impôt sur les sociétés (barème PME : 15 % jusqu'à 42 500 €, 25 % au-delà)." />
          <Kpi label="Cash-flow net après impôt (année 1)" value={eur(a1.cashflowNet)}
            sub="résultat net + amortissements − capital remboursé" accent={rentable ? "#059669" : "#DC2626"}
            info="Trésorerie réellement disponible : on réintègre la dotation aux amortissements (charge non décaissée) et on retire le capital remboursé sur l'emprunt (décaissé mais non déductible)." />
          <Kpi label="Rentabilité économique" value={`${rentaEco.toFixed(1)} %`}
            sub="EBE / investissement total" accent="#1D4ED8"
            info="Performance du bien indépendamment de son financement et de la fiscalité (utile pour comparer deux dossiers entre eux)." />
          <Kpi label="Rentabilité sur apport (nette)" value={`${rentaApport.toFixed(1)} %`}
            sub="cash-flow net / apport" accent="#1D4ED8"
            info="Rendement du capital réellement engagé par vous, après impôt, effet de levier de l'emprunt inclus." />
          <Kpi label="Délai de récupération" value={delai ? `${delai.toFixed(1)} ans` : "—"}
            sub="apport / cash-flow net (année 1)" accent="#B45309" />
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Trésorerie cumulée après impôt, et bénéfice net par année</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={rentable ? "#059669" : "#DC2626"} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={rentable ? "#059669" : "#DC2626"} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="annee" tick={{ fontSize: 12, fill: "#64748B" }}
                label={{ value: "Années", position: "insideBottomRight", offset: -2, fontSize: 12, fill: "#94A3B8" }} />
              <YAxis yAxisId="cumule" tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)} k€` : `${v} €`)}
                tick={{ fontSize: 12, fill: "#64748B" }} width={64} />
              <YAxis yAxisId="net" orientation="right"
                tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)} k€` : `${v} €`)}
                tick={{ fontSize: 12, fill: "#B45309" }} width={64} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <ReferenceLine yAxisId="cumule" y={0} stroke="#94A3B8" strokeDasharray="4 4" />
              <Area yAxisId="cumule" type="monotone" dataKey="cashCumule" name="Trésorerie cumulée (nette)"
                stroke={rentable ? "#059669" : "#DC2626"} strokeWidth={2.5} fill="url(#gCash)" />
              <Area yAxisId="net" type="monotone" dataKey="resultatNet" name="Bénéfice net (année)"
                stroke="#B45309" strokeWidth={2} fill="none" strokeDasharray="6 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Chiffre d'affaires et charges — projection sur la durée</h3>
          <p style={styles.chartNote}>
            Le CA progresse par paliers (hausse de {prix2(projet.augmentationPrixLavage)} € par
            lavage tous les {projet.frequenceAugmentationPrix} an{projet.frequenceAugmentationPrix > 1 ? "s" : ""}),
            les charges augmentent en continu avec l'inflation de l'énergie
            ({projet.augmentationEnergieAnnuelle} %/an).
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gCA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1D4ED8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="annee" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)} k€` : `${v} €`)}
                tick={{ fontSize: 12, fill: "#64748B" }} width={64} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Area type="stepAfter" dataKey="ca" name="Chiffre d'affaires (paliers de prix)"
                stroke="#1D4ED8" strokeWidth={2.5} fill="url(#gCA)" />
              <Area type="monotone" dataKey="chargesExploitation" name="Charges + crédit-bail"
                stroke="#B45309" strokeWidth={2} fill="none" strokeDasharray="6 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Amortissement du prêt — capital restant dû</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gCapital" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#64748B" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#64748B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="annee" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)} k€` : `${v} €`)}
                tick={{ fontSize: 12, fill: "#64748B" }} width={64} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="capitalRestant" name="Capital restant dû"
                stroke="#64748B" strokeWidth={2.5} fill="url(#gCapital)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p style={styles.disclaimer}>
          Simulation à titre pédagogique. Montants HT sauf assurance et CFE (non soumises à la
          TVA). L'impôt est calculé selon le barème PME de l'IS (15 % jusqu'à 42 500 € de
          bénéfice, 25 % au-delà), sans report de déficit ni cotisations/rémunération du
          dirigeant — à affiner avec votre expert-comptable selon votre statut réel (IS, IR,
          micro-entreprise…). Le volume de lavages est supposé constant (seul le prix évolue),
          et l'énergie est le seul poste indexé sur l'inflation. Seuls les droits d'enregistrement
          sont calculés selon un barème légal ; tous les autres repères de valeurs usuelles sont
          des ordres de grandeur indicatifs à confirmer avec votre banque, votre expert-comptable,
          votre avocat ou l'intermédiaire de la cession. Ceci n'est pas un conseil en
          investissement.
        </p>
      </main>
    </div>
  );
}

const styles = {
  layout: { display: "flex", gap: 24, flexWrap: "wrap" },
  panel: {
    background: "#FFFFFF", borderRadius: 14, padding: 24,
    boxShadow: "0 1px 3px rgba(16,24,40,0.08)",
    width: 320, flexShrink: 0, alignSelf: "flex-start",
  },
  panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  panelTitle: { fontSize: 15, fontWeight: 700, margin: "0 0 18px", color: "#101828" },
  resetBtn: {
    fontSize: 11, fontWeight: 700, color: "#1D4ED8", background: "#EFF4FF",
    border: "none", borderRadius: 999, padding: "4px 10px", cursor: "pointer",
  },
  toggleRow: {
    display: "flex", alignItems: "center", fontSize: 13,
    color: "#475569", marginBottom: 16, cursor: "pointer",
  },
  exportBar: {
    display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end",
    background: "#FFFFFF", borderRadius: 14, padding: "16px 20px", marginBottom: 8,
    boxShadow: "0 1px 3px rgba(16,24,40,0.08)",
  },
  exportField: { flex: 1, minWidth: 220 },
  exportLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 },
  exportInput: {
    width: "100%", fontSize: 14, padding: "8px 10px", borderRadius: 8,
    border: "1px solid #E2E8F0", color: "#101828", boxSizing: "border-box",
  },
  exportBtns: { display: "flex", gap: 8 },
  exportBtn: {
    fontSize: 13, fontWeight: 700, color: "#1D4ED8", background: "#EFF4FF",
    border: "none", borderRadius: 8, padding: "9px 14px", cursor: "pointer", whiteSpace: "nowrap",
  },
  exportNote: { fontSize: 12, color: "#94A3B8", margin: "0 0 16px" },
  intro: { color: "#475569", fontSize: 14, marginTop: 0, marginBottom: 16, maxWidth: 720 },
  legendMark: {
    display: "inline-block", width: 2, height: 12, background: "#94A3B8",
    verticalAlign: "middle", margin: "0 2px", borderRadius: 1,
  },
  banner: {
    background: "#FFFFFF", borderRadius: 12, borderLeft: "4px solid",
    padding: "14px 18px", marginBottom: 20, boxShadow: "0 1px 3px rgba(16,24,40,0.08)",
  },
  bannerSub: { fontSize: 13, color: "#475569", marginTop: 4 },
  kpiGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14, marginBottom: 20,
  },
  chartCard: {
    background: "#FFFFFF", borderRadius: 14, padding: "20px 20px 8px",
    boxShadow: "0 1px 3px rgba(16,24,40,0.08)", marginBottom: 20,
  },
  chartTitle: { fontSize: 14, fontWeight: 700, color: "#101828", margin: "0 0 6px" },
  chartNote: { fontSize: 12, color: "#94A3B8", margin: "0 0 12px" },
  disclaimer: { fontSize: 12, color: "#94A3B8", marginTop: 4, lineHeight: 1.5 },
};
