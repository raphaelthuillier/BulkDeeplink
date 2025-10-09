import React, { useEffect, useReducer, useState } from "react";
import Select from "react-select";
import "./styles.css";

const initialState = {
  programs: [],
  loading: true,
  selectedProgram: null,
  comid: "",
  rawUrls: "",
  trackedUrls: [],
};

function reducer(state, action) {
  return { ...state, [action.type]: action.payload };
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ---- Charger JSON depuis le webhook n8n ----
  useEffect(() => {
    let mounted = true;
    const API_URL =
      "https://webhook.time1.io/webhook/080de059-8676-4214-88dd-40e930782d34";

    async function fetchPrograms() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Erreur chargement JSON distant");
        const json = await response.json();
        const programsArray = Array.isArray(json)
          ? json
          : Array.isArray(json.programs)
          ? json.programs
          : [];
        if (mounted)
          dispatch({ type: "programs", payload: programsArray });
      } catch (err) {
        console.error("❌ Erreur webhook programs:", err);
      } finally {
        if (mounted) dispatch({ type: "loading", payload: false });
      }
    }

    fetchPrograms();
    return () => (mounted = false);
  }, []);

  if (state.loading) return <p>⏳ Chargement des programmes...</p>;

  // ---- Génération des URLs trackées ----
  const buildTrackedUrls = () => {
    if (!state.selectedProgram || !state.comid.trim()) {
      alert("⚠️ Sélectionnez un annonceur et renseignez un COMID.");
      return;
    }

    const progid = state.selectedProgram.id;
    const comid = state.comid.trim();

    const lines = state.rawUrls
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const results = lines.map((line) => {
      let name = "";
      let url = line;
      if (line.includes("|")) {
        const parts = line.split("|");
        name = parts[0].trim();
        url = parts[1].trim();
      }
      const encoded = encodeURIComponent(url);
      const tracked = `https://tracking.publicidees.com/clic.php?progid=${progid}&partid=${comid}&dpl=${encoded}`;
      return { name, url, tracked };
    });

    dispatch({ type: "trackedUrls", payload: results });
  };

  const copyToClipboard = () => {
    if (!state.trackedUrls.length) return alert("Aucune URL à copier.");
    const text = state.trackedUrls
      .map(
        (u) =>
          (u.name ? `${u.name} | ` : "") +
          u.tracked
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    alert("✅ Liens copiés !");
  };

  return (
    <div className="app simple">
      <div className="config-panel">
        <h2>🔗 Générateur d’URLs Trackées</h2>

        <div className="config-row">
          <div className="config-col">
            <label>Annonceur :</label>
            <Select
              classNamePrefix="react-select"
              options={
                Array.isArray(state.programs)
                  ? state.programs.map((prog) => ({
                      value: prog.id,
                      label: prog.name,
                    }))
                  : []
              }
              onChange={(option) => {
                const prog = state.programs.find(
                  (p) => p.id === option.value
                );
                dispatch({ type: "selectedProgram", payload: prog });
              }}
              placeholder="🔍 Sélectionner un annonceur..."
              isSearchable
            />
          </div>
          <div className="config-col">
            <label>ProgID :</label>
            <input
              type="text"
              className="styled-input"
              readOnly
              value={state.selectedProgram ? state.selectedProgram.id : ""}
            />
          </div>
          <div className="config-col">
            <label>ComID :</label>
            <input
              type="text"
              className="styled-input"
              placeholder="ex : 2"
              value={state.comid}
              onChange={(e) =>
                dispatch({ type: "comid", payload: e.target.value })
              }
            />
          </div>
        </div>

        <div className="config-row">
          <div className="config-col">
            <label>Liste d’URLs (une par ligne ou “Nom | URL”) :</label>
            <textarea
              className="code-editor"
              rows="8"
              placeholder={`ex :
https://www.auchan.fr/
Promo rentrée | https://www.fnac.com/`}
              value={state.rawUrls}
              onChange={(e) =>
                dispatch({ type: "rawUrls", payload: e.target.value })
              }
            />
          </div>
        </div>

        <div className="bottom-actions">
          <button onClick={buildTrackedUrls}>🎯 Générer les liens</button>
          <button onClick={copyToClipboard}>📋 Copier les liens</button>
        </div>

        {state.trackedUrls.length > 0 && (
          <div className="results">
            <h3>Résultats :</h3>
            <ul>
              {state.trackedUrls.map((u, i) => (
                <li key={i} style={{ marginBottom: "8px" }}>
                  {u.name && <strong>{u.name} :</strong>}{" "}
                  <a
                    href={u.tracked}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#E85D1F" }}
                  >
                    {u.tracked}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
