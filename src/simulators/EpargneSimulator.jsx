import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { eur } from "../utils/format";
import { usePersistedState } from "../utils/usePersistedState";
import { Slider, Kpi, CustomTooltip } from "../components/ui";

const STORAGE_KEY = "simulateur-invest:epargne";
const defaultState = {
  capitalInitial: 10000,
  versementMensuel: 300,
  tauxAnnuel: 7,
  fraisAnnuels: 0.5,
  dureeAnnees: 20,
  inflation: 2,
  afficherReel: true,
};

// ---------- Moteur de calcul ----------
function simulate({ capitalInitial, versementMensuel, tauxAnnuel, fraisAnnuels, dureeAnnees, inflation }) {
  const tauxNet = (tauxAnnuel - fraisAnnuels) / 100;
  const tauxMensuel = Math.pow(1 + tauxNet, 1 / 12) - 1;
  const inflMensuelle = Math.pow(1 + inflation / 100, 1 / 12) - 1;

  let valeur = capitalInitial;
  let investi = capitalInitial;
  let deflateur = 1;
  const points = [{ annee: 0, valeur, investi, valeurReelle: valeur, interets: 0 }];

  for (let mois = 1; mois <= dureeAnnees * 12; mois++) {
    valeur = valeur * (1 + tauxMensuel) + versementMensuel;
    investi += versementMensuel;
    deflateur *= 1 + inflMensuelle;
    if (mois % 12 === 0) {
      points.push({
        annee: mois / 12,
        valeur: Math.round(valeur),
        investi: Math.round(investi),
        valeurReelle: Math.round(valeur / deflateur),
        interets: Math.round(valeur - investi),
      });
    }
  }
  return points;
}

// ---------- Composant ----------
export default function EpargneSimulator() {
  const [etat, setEtat] = usePersistedState(STORAGE_KEY, defaultState);
  const {
    capitalInitial, versementMensuel, tauxAnnuel,
    fraisAnnuels, dureeAnnees, inflation, afficherReel,
  } = etat;
  const set = (champ) => (valeur) => setEtat((e) => ({ ...e, [champ]: valeur }));

  const data = useMemo(
    () => simulate({ capitalInitial, versementMensuel, tauxAnnuel, fraisAnnuels, dureeAnnees, inflation }),
    [capitalInitial, versementMensuel, tauxAnnuel, fraisAnnuels, dureeAnnees, inflation]
  );

  const final = data[data.length - 1];
  const multiplicateur = final.investi > 0 ? (final.valeur / final.investi).toFixed(2) : "—";
  const tauxNetAffiche = (tauxAnnuel - fraisAnnuels).toFixed(2);

  return (
    <div style={styles.layout}>
      {/* Panneau de paramètres */}
      <aside style={styles.panel}>
        <h2 style={styles.panelTitle}>Paramètres</h2>
        <Slider label="Capital initial" value={capitalInitial} setValue={set("capitalInitial")}
          min={0} max={200000} step={1000} format={eur} />
        <Slider label="Versement mensuel" value={versementMensuel} setValue={set("versementMensuel")}
          min={0} max={3000} step={50} format={eur} />
        <Slider label="Rendement annuel brut" value={tauxAnnuel} setValue={set("tauxAnnuel")}
          min={0} max={15} step={0.1} unit="%" />
        <Slider label="Frais annuels" value={fraisAnnuels} setValue={set("fraisAnnuels")}
          min={0} max={3} step={0.05} unit="%" />
        <Slider label="Durée" value={dureeAnnees} setValue={set("dureeAnnees")}
          min={1} max={40} step={1} unit="ans" />
        <Slider label="Inflation annuelle" value={inflation} setValue={set("inflation")}
          min={0} max={6} step={0.1} unit="%" />

        <label style={styles.toggleRow}>
          <input
            type="checkbox"
            checked={afficherReel}
            onChange={(e) => set("afficherReel")(e.target.checked)}
          />
          <span style={{ marginLeft: 8 }}>Afficher la valeur réelle (corrigée de l'inflation)</span>
        </label>
      </aside>

      {/* Résultats */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <p style={styles.intro}>
          Projection à taux constant, capitalisation mensuelle, frais et inflation inclus.
          Rendement net utilisé : <b>{tauxNetAffiche} % / an</b>.
        </p>

        <div style={styles.kpiGrid}>
          <Kpi label="Valeur finale" value={eur(final.valeur)}
            sub={`dans ${dureeAnnees} ans`} accent="#1D4ED8" />
          <Kpi label="Total investi" value={eur(final.investi)}
            sub={`${eur(capitalInitial)} + versements`} accent="#64748B" />
          <Kpi label="Gains (intérêts)" value={eur(final.interets)}
            sub={`× ${multiplicateur} le capital investi`} accent="#059669" />
          <Kpi label="Valeur réelle" value={eur(final.valeurReelle)}
            sub={`pouvoir d'achat d'aujourd'hui`} accent="#B45309" />
        </div>

        <div style={styles.chartCard}>
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1D4ED8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#64748B" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#64748B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="annee" tick={{ fontSize: 12, fill: "#64748B" }}
                label={{ value: "Années", position: "insideBottomRight", offset: -2, fontSize: 12, fill: "#94A3B8" }} />
              <YAxis tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)} k€` : `${v} €`)}
                tick={{ fontSize: 12, fill: "#64748B" }} width={64} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Area type="monotone" dataKey="investi" name="Capital investi"
                stroke="#64748B" strokeWidth={2} fill="url(#gInv)" />
              <Area type="monotone" dataKey="valeur" name="Valeur du portefeuille"
                stroke="#1D4ED8" strokeWidth={2.5} fill="url(#gVal)" />
              {afficherReel && (
                <Area type="monotone" dataKey="valeurReelle" name="Valeur réelle (inflation)"
                  stroke="#B45309" strokeWidth={2} strokeDasharray="6 4" fill="none" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p style={styles.disclaimer}>
          Simulation à titre pédagogique : rendement supposé constant, sans fiscalité ni volatilité.
          Les performances passées ne préjugent pas des performances futures. Ceci n'est pas un conseil en investissement.
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
  panelTitle: { fontSize: 15, fontWeight: 700, margin: "0 0 18px", color: "#101828" },
  toggleRow: {
    display: "flex", alignItems: "center", fontSize: 13,
    color: "#475569", marginTop: 8, cursor: "pointer",
  },
  intro: { color: "#475569", fontSize: 14, marginTop: 0, marginBottom: 16, maxWidth: 640 },
  kpiGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14, marginBottom: 20,
  },
  chartCard: {
    background: "#FFFFFF", borderRadius: 14, padding: "20px 12px 8px",
    boxShadow: "0 1px 3px rgba(16,24,40,0.08)",
  },
  disclaimer: { fontSize: 12, color: "#94A3B8", marginTop: 16, lineHeight: 1.5 },
};
