import { useState } from "react";
import EpargneSimulator from "./simulators/EpargneSimulator";
import LaverieSimulator from "./simulators/LaverieSimulator";

const TABS = [
  { id: "laverie", label: "Laverie", eyebrow: "RENTABILITÉ · LAVERIE AUTOMATIQUE", title: "Investissement dans une laverie" },
  { id: "epargne", label: "Épargne", eyebrow: "SIMULATEUR · INTÉRÊTS COMPOSÉS", title: "Rentabilité d'investissement" },
];

export default function App() {
  const [tab, setTab] = useState("laverie");
  const current = TABS.find((t) => t.id === tab);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.eyebrow}>{current.eyebrow}</div>
          <h1 style={styles.h1}>{current.title}</h1>

          <nav style={styles.tabs}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  ...styles.tabBtn,
                  ...(tab === t.id ? styles.tabBtnActive : null),
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </header>

        <div style={{ display: tab === "laverie" ? "block" : "none" }}>
          <LaverieSimulator />
        </div>
        <div style={{ display: tab === "epargne" ? "block" : "none" }}>
          <EpargneSimulator />
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F5F6F8",
    fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
    color: "#101828",
    padding: "32px 16px",
  },
  container: { maxWidth: 1180, margin: "0 auto" },
  header: { marginBottom: 28 },
  eyebrow: {
    fontSize: 11, letterSpacing: "0.14em", fontWeight: 700,
    color: "#1D4ED8", marginBottom: 8,
  },
  h1: { fontSize: 34, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" },
  tabs: { display: "flex", gap: 8, marginTop: 20 },
  tabBtn: {
    fontSize: 14, fontWeight: 600, color: "#475569",
    background: "#E2E8F0", border: "none", borderRadius: 999,
    padding: "8px 18px", cursor: "pointer",
  },
  tabBtnActive: {
    color: "#FFFFFF", background: "#1D4ED8",
  },
};
