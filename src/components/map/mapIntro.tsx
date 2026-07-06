import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { gameData } from "../../data/gameData";
import { goalCutPercent } from "../../data/gameGoal";

/**
 * The panel leading the map page: the mission, the running tally, the three
 * worst remaining fields (so the page helps you decide, not just look), and
 * the primary CTA into the field selector. The map below/beside is the
 * supporting visual.
 */
export function MapIntro() {
  const { year, phaseOut, getCurrentRound, getEndOfTermYear } =
    useContext(ApplicationContext);
  const navigate = useNavigate();
  const gameEnded = year === "2040";
  const retired = Object.keys(phaseOut).length;
  const total = gameData.allFields.length;

  // The three worst remaining fields, by the same size + inefficiency score
  // as the field selector's recommended sort
  const worst = useMemo(() => {
    const rows = Object.keys(gameData.data)
      .filter((f) => !(f in phaseOut))
      .map((f) => {
        const d = gameData.data[f]?.[year];
        return {
          field: f,
          emission: d?.emission?.value ?? 0,
          intensity: d?.emissionIntensity?.value ?? 0,
        };
      });
    const maxEmission = Math.max(1, ...rows.map((r) => r.emission));
    const maxIntensity = Math.max(1, ...rows.map((r) => r.intensity));
    return rows
      .map((r) => ({
        ...r,
        score: r.emission / maxEmission + r.intensity / maxIntensity,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [phaseOut, year]);

  return (
    <div
      style={{
        padding: "0.75rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <h2 style={{ margin: 0 }}>Norsk sokkel – {total} felter</h2>

      <div
        style={{
          border: "1px solid currentColor",
          borderRadius: "0.5rem",
          padding: "0.5rem 0.75rem",
        }}
      >
        🎯 <strong>Målet ditt:</strong> kutt utslippene minst{" "}
        {goalCutPercent()} % innen 2040 – like mye som MDG-planen.{" "}
        <strong>{retired}</strong> av {total} felter har fått sluttdato.
      </div>

      {gameEnded ? (
        <>
          <div>
            🏁 Reisen er fullført. Kartet viser sluttresultatet – grå felter er
            avviklet.
          </div>
          <div>
            <button
              style={{ fontSize: "1.1em" }}
              onClick={() => navigate("/summary")}
            >
              🏆 Se resultatet
            </button>
          </div>
        </>
      ) : (
        <>
          {worst.length > 0 && (
            <div>
              <strong>🔥 Verstingene som er igjen:</strong>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  marginTop: "0.35rem",
                }}
              >
                {worst.map((row) => (
                  <div
                    key={row.field}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      fontSize: "0.95em",
                    }}
                  >
                    <span>
                      <strong>{row.field}</strong>
                    </span>
                    <span style={{ whiteSpace: "nowrap" }}>
                      🌫️ {Math.round(row.emission / 1000).toLocaleString(
                        "nb-NO",
                      )}{" "}
                      kt/år · {Math.round(row.intensity)} kg/fat
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <button
              style={{ fontSize: "1.1em", backgroundColor: "#a5e34d" }}
              onClick={() => navigate("/phaseout")}
            >
              ✏️ Velg felter for {year}–{getEndOfTermYear()} (
              {getCurrentRound()}. periode)
            </button>
          </div>

          <div style={{ fontSize: "0.9em", opacity: 0.85 }}>
            Kartet: <span style={{ color: "#c0392b" }}>rødt</span> = i drift,
            grått = avviklet. Trykk på et felt for nøkkeltall. Du styrer fire
            stortingsperioder frem til 2040 – følg målet i statuslinjen øverst.
          </div>
        </>
      )}
    </div>
  );
}
