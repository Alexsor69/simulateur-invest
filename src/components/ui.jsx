import { eur } from "../utils/format";

export function Slider({ label, value, setValue, min, max, step, unit, format, info, hint, reference }) {
  const hasReference = reference != null && max > min;
  const referencePct = hasReference
    ? Math.min(100, Math.max(0, ((reference - min) / (max - min)) * 100))
    : null;

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <label style={styles.sliderLabel}>
          {label}
          {info && <span title={info} style={styles.infoIcon}> ⓘ</span>}
        </label>
        <span style={styles.sliderValue}>
          {format ? format(value) : value} {unit}
        </span>
      </div>
      {hint && <div style={styles.hint}>{hint}</div>}
      <div style={{ position: "relative" }}>
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => setValue(parseFloat(e.target.value))}
          style={styles.range}
        />
        {hasReference && (
          <div
            title={`Valeur de référence : ${format ? format(reference) : reference}${unit ? " " + unit : ""}`}
            style={{ ...styles.referenceMark, left: `${referencePct}%` }}
          />
        )}
      </div>
    </div>
  );
}

// Ligne d'information en lecture seule (ex. un montant calculé automatiquement,
// non modifiable par curseur), avec le même habillage visuel qu'un Slider.
export function InfoLine({ label, value, hint, info }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={styles.sliderLabel}>
          {label}
          {info && <span title={info} style={styles.infoIcon}> ⓘ</span>}
        </span>
        <span style={styles.sliderValue}>{value}</span>
      </div>
      {hint && <div style={styles.hint}>{hint}</div>}
    </div>
  );
}

export function Kpi({ label, value, sub, accent, info }) {
  return (
    <div style={{ ...styles.kpi, borderTop: `3px solid ${accent}` }}>
      <div style={styles.kpiLabel}>
        {label}
        {info && <span title={info} style={styles.infoIcon}> ⓘ</span>}
      </div>
      <div style={{ ...styles.kpiValue, color: accent }}>{value}</div>
      {sub && <div style={styles.kpiSub}>{sub}</div>}
    </div>
  );
}

export function CustomTooltip({ active, payload, label, labelPrefix = "Année" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{labelPrefix} {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.stroke || p.fill, fontSize: 13, marginBottom: 2 }}>
          {p.name} : <b>{eur(p.value)}</b>
        </div>
      ))}
    </div>
  );
}

export const styles = {
  sliderLabel: { fontSize: 13, color: "#475569" },
  sliderValue: {
    fontSize: 13, fontWeight: 700, color: "#101828",
    fontVariantNumeric: "tabular-nums",
  },
  range: { width: "100%", accentColor: "#1D4ED8", cursor: "pointer" },
  referenceMark: {
    position: "absolute", top: "50%", width: 2, height: 14,
    background: "#94A3B8", borderRadius: 1, pointerEvents: "none",
    transform: "translate(-1px, -50%)",
  },
  infoIcon: { color: "#94A3B8", cursor: "help", fontSize: 12 },
  hint: { fontSize: 11, color: "#94A3B8", marginBottom: 6 },
  kpi: {
    background: "#FFFFFF", borderRadius: 12, padding: "16px 18px",
    boxShadow: "0 1px 3px rgba(16,24,40,0.08)",
  },
  kpiLabel: {
    fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
    color: "#94A3B8", fontWeight: 600, marginBottom: 6,
  },
  kpiValue: {
    fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em",
    fontVariantNumeric: "tabular-nums",
  },
  kpiSub: { fontSize: 12, color: "#64748B", marginTop: 4 },
  tooltip: {
    background: "#101828", color: "#F8FAFC", padding: "10px 14px",
    borderRadius: 10, fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  },
};
