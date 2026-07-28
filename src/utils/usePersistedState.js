import { useEffect, useState } from "react";

// État React persisté dans localStorage sous forme de JSON, restauré au
// prochain chargement de la page (même après fermeture du navigateur).
// Fusionne avec `defaultValue` pour rester robuste si de nouveaux champs
// sont ajoutés à une version ultérieure du simulateur.
export function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      const parsed = JSON.parse(stored);
      return typeof defaultValue === "object" && defaultValue !== null && !Array.isArray(defaultValue)
        ? { ...defaultValue, ...parsed }
        : parsed;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Stockage indisponible (mode privé, quota atteint...) : on continue
      // sans persistance plutôt que de bloquer l'application.
    }
  }, [key, state]);

  return [state, setState];
}
