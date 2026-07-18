import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { gameData, periodLabel } from "../../data/gameData";
import { goalCutPercent } from "../../data/gameGoal";
import "./mapIntro.css";

/**
 * The panel leading the map page: the mission, the running tally, the three
 * worst remaining fields (so the page helps you decide, not just look), and
 * the primary CTA into the field selector. The map below/beside is the
 * supporting visual.
 */
export function MapIntro() {
  const { year, phaseOut, getCurrentRound } = useContext(ApplicationContext);
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
    <div className="map-intro">
      <h2>Norsk sokkel – {total} felter</h2>

      <div className="goal-box">
        🎯 <strong>Oppdraget:</strong> kutt utslippene minst {goalCutPercent()}{" "}
        % innen 2040. <strong>{retired}</strong> av {total} felter har fått
        sluttdato.
      </div>

      {gameEnded ? (
        <>
          <div>
            🏁 Historien er ferdig. Kartet viser sluttresultatet – grå felter er
            avviklet.
          </div>
          {/* cta-row skjules på mobil — footeren har samme handling */}
          <div className="cta-row">
            <button className="cta" onClick={() => navigate("/summary")}>
              🏆 Se resultatet
            </button>
          </div>
        </>
      ) : (
        <>
          {worst.length > 0 && (
            <div>
              <strong>🔥 Verstingene som er igjen:</strong>
              <div className="worst-list">
                {worst.map((row) => (
                  <div key={row.field} className="worst-row">
                    <span>
                      <strong>{row.field}</strong>
                    </span>
                    <span className="figures">
                      🏭{" "}
                      {Math.round(row.emission / 1000).toLocaleString("nb-NO")}{" "}
                      kt/år · {Math.round(row.intensity)} kg/fat
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* cta-row skjules på mobil — footerens primærknapp gjør jobben */}
          <div className="cta-row">
            <button
              className="cta primary"
              onClick={() => navigate("/phaseout")}
            >
              ✏️ Velg felter for {periodLabel(getCurrentRound())} (
              {getCurrentRound()}. periode)
            </button>
          </div>

          <div className="legend">
            Kartet: <span className="in-operation">rødt</span> = i drift,{" "}
            <span className="selected-field">blått</span> = valgt felt, grått =
            avviklet. Trykk på et felt for nøkkeltall.
          </div>
        </>
      )}
    </div>
  );
}
