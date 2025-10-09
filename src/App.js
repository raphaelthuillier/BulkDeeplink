import React, { useEffect, useReducer } from "react";
import Select from "react-select";
import "./styles.css";

const initialState = {
  programs: [],
  loading: true,
  selectedProgram: null,
  partid: "",
  sourceText: "",
  trackedText: "",
};

function reducer(state, action) {
  return { ...state, [action.type]: action.payload };
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ---- Charger la liste des programmes ----
  useEffect(() => {
    let mounted = true;
    const API_URL =
      "https://webhook.time1.io/webhook/080de059-8676-4214-88dd-40e930782d34";

    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur HTTP " + res.status);
        return res.json();
      })
      .then((json) => {
        const programsArray = Array.isArray(json)
          ? json
          : Array.isArray(json.programs)
          ? json.programs
          : [];
        if (mounted) dispatch({ type: "programs", payload: programsArray });
      })
      .catch((err) => {
        console.error("Erreur JSON:", err);
        alert("⚠️ Impossible de charger les programmes.");
      })
      .finally(() => {
        if (mounted) dispatch({ type: "loading", payload: false });
      });

    return () => (mounted = false);
  }, []);

  // ---- Remplacement automatique des liens ----
  const buildTrackedText = () => {
    if (!state.selectedProgram || !state.partid.trim()) {
      alert("⚠️ Sélectionnez un annonceur et un PartID.");
      return;
    }

    const progid = state.selectedProgram.id;
    const partid = state.partid.trim();
    const text = state.sourceText;

    if (!text.trim()) {
      alert("⚠️ Entrez un texte contenant au moins un lien.");
      return;
    }

    const urlRegex = /(https?:\/\/[^\s<>"']+\.[^\s<>"']+)(?![^<]*>)/gi;
    const tracked = text.replace(urlRegex, (url) => {
      const encoded = encodeURIComponent(url);
      return `https://tracking.publicidees.com/clic.php?progid=${progid}&partid=${partid}&dpl=${encoded}`;
    });

    dispatch({ type: "trackedText", payload: tracked });
  };

  const copyTrackedText = () => {
    if (!state.trackedText) return alert("Aucun texte généré à copier.");
    navigator.clipboard.writeText(state.trackedText);
    alert("✅ Texte copié !");
  };

  if (state.loading)
    return (
      <p style={{ textAlign: "center" }}>⏳ Chargement des programmes...</p>
    );

  // ---- Interface complète ----
  return (
    <>
      {/* Barre supérieure */}
      <div className="top-bar">
        <h1>🔗 Remplacement des liens trackés</h1>
        <div></div>
      </div>

      {/* Zone principale : deux panneaux */}
      <div className="app-layout">
        {/* Colonne gauche : texte source */}
        <div className="panel">
          <h2>📝 Texte source</h2>

          <label>Annonceur :</label>
          <Select
            classNamePrefix="react-select"
            options={state.programs.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
            onChange={(o) => {
              const prog = state.programs.find((p) => p.id === o.value);
              dispatch({ type: "selectedProgram", payload: prog });
            }}
            placeholder="🔍 Sélectionner un annonceur..."
          />

          <label>ProgID :</label>
          <input
            type="text"
            readOnly
            value={state.selectedProgram ? state.selectedProgram.id : ""}
          />

          <label>PartID :</label>
          <input
            type="text"
            placeholder="ex : 2"
            value={state.partid}
            onChange={(e) =>
              dispatch({ type: "partid", payload: e.target.value })
            }
          />

          <label>Texte source :</label>
          <textarea
            rows={12}
            value={state.sourceText}
            onChange={(e) =>
              dispatch({ type: "sourceText", payload: e.target.value })
            }
            placeholder={
              "Collez ici votre texte contenant des liens à remplacer.\n\nExemple :\nDécouvrez nos offres sur https://www.fnac.com ou https://www.auchan.fr."
            }
          />

          <div style={{ marginTop: "10px" }}>
            <button className="action" onClick={buildTrackedText}>
              🎯 Générer texte tracké
            </button>
            <button className="action secondary" onClick={copyTrackedText}>
              📋 Copier le texte final
            </button>
          </div>
        </div>

        {/* Colonne droite : texte final */}
        <div className="panel">
          <h2>✅ Texte final</h2>
          <textarea
            rows={20}
            readOnly
            value={state.trackedText}
            placeholder="Le texte tracké apparaîtra ici après génération."
          />
        </div>
      </div>
    </>
  );
}
