import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart } from "../charts/lineChart";
import { ApplicationContext } from "../../applicationContext";
import { PhaseOutSchedule } from "../../data/gameData";
import { mdgPlan } from "../../generated/dataMdg";
import {
  fullPhaseOut,
  transitionSeries,
  transitionSummary,
  USEFUL_ENERGY_FACTOR,
} from "../../data/energyTransition";
import { energyData } from "../../generated/energyData";
import { SourcesNote } from "../ui/sourcesNote";
import "./transition.css";

type ScenarioKey = "mine" | "mdg" | "full";

const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: "mine", label: "Min plan" },
  { key: "mdg", label: "MDGs plan" },
  { key: "full", label: "Full utfasing innen 2035" },
];

/**
 * The energy transition page: shows what happens to the energy when oil is
 * phased out, and how much renewable electricity it takes to replace it.
 *
 * The key message is the waste heat argument: only ~35% of the energy in oil
 * becomes useful work, so the renewable replacement is far smaller than the
 * fossil energy it replaces. The chart makes this visible by drawing both on
 * the same TWh axis.
 */
export function TransitionRoute() {
  const { phaseOut } = useContext(ApplicationContext);
  const hasOwnPlan = Object.keys(phaseOut).length > 0;
  const [scenario, setScenario] = useState<ScenarioKey>(
    hasOwnPlan ? "mine" : "mdg",
  );

  const schedule: PhaseOutSchedule = useMemo(() => {
    if (scenario === "mine") return phaseOut;
    if (scenario === "mdg") return mdgPlan;
    return fullPhaseOut("2035");
  }, [scenario, phaseOut]);

  const series = useMemo(() => transitionSeries(schedule), [schedule]);
  const summary = useMemo(() => transitionSummary(schedule), [schedule]);
  const baseline2025 = series[0]?.baselineTwh ?? 0;

  return (
    <div className="transition-page">
      <h2>🔋 Fra svart til grønn energi</h2>
      <div className="transition-intro">
        Hva skjer egentlig med energien når oljen fases ut? Mindre enn du skulle
        tro – og her er hvorfor.
      </div>

      <div className="transition-steps">
        <div className="transition-step">
          <div className="step-emoji">🛢️</div>
          <h4>Sokkelen er en energigigant</h4>
          <div>
            Norske olje- og gassfelt produserer rundt{" "}
            <strong>{baseline2025.toLocaleString("nb-NO")} TWh</strong> energi i
            året. Nesten alt eksporteres. Til sammenligning bruker hele Norge{" "}
            {energyData.electricity.consumptionTwh.toLocaleString("nb-NO")} TWh
            strøm i året.
          </div>
        </div>
        <div className="transition-step">
          <div className="step-emoji">🔥</div>
          <h4>To tredjedeler går opp i røyk</h4>
          <div>
            Når olje og gass brennes i motorer og kraftverk, blir bare rundt{" "}
            <strong>35 %</strong> til nyttig energi – bevegelse, varme, strøm.
            Resten forsvinner som spillvarme ut i lufta.
          </div>
        </div>
        <div className="transition-step">
          <div className="step-emoji">🌬️</div>
          <h4>Derfor er erstatningen overkommelig</h4>
          <div>
            Strøm fra vind og sol brukes nesten uten tap. Hver TWh fossil energi
            kan derfor erstattes av bare{" "}
            <strong>~{USEFUL_ENERGY_FACTOR.toLocaleString("nb-NO")} TWh</strong>{" "}
            fornybar strøm – med samme nytte for samfunnet.
          </div>
        </div>
      </div>

      <div className="transition-scenarios">
        <span>Vis scenario:</span>
        {SCENARIOS.map(({ key, label }) => (
          <button
            key={key}
            className={scenario === key ? "active" : ""}
            disabled={key === "mine" && !hasOwnPlan}
            title={
              key === "mine" && !hasOwnPlan
                ? "Du har ikke faset ut noen felter ennå"
                : undefined
            }
            onClick={() => setScenario(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="transition-chart">
        <TransitionChart series={series} />
      </div>

      <h3>Slik ser regnestykket ut i 2040</h3>
      <div className="stat-tiles">
        <div className="stat-tile">
          <div className="emoji">🛢️</div>
          <div className="value">
            {summary.phasedOutTwh.toLocaleString("nb-NO")} TWh
          </div>
          <div>
            fossil energi fases ut per år ({summary.phasedOutPercent} % av
            sokkelen)
          </div>
        </div>
        <div className="stat-tile highlight">
          <div className="emoji">⚡</div>
          <div className="value">
            {summary.replacementTwh.toLocaleString("nb-NO")} TWh
          </div>
          <div>
            ren strøm er nok til å erstatte nytten av alt sammen – de andre{" "}
            {100 - Math.round(USEFUL_ENERGY_FACTOR * 100)} % av fossilenergien
            var spillvarme som ingen fikk glede av
          </div>
        </div>
        <div className="stat-tile">
          <div className="emoji">🌬️</div>
          <div className="value">
            {summary.turbines.toLocaleString("nb-NO")}
          </div>
          <div>moderne havvindturbiner (15 MW) kan produsere den strømmen</div>
        </div>
        <div className="stat-tile">
          <div className="emoji">🏠</div>
          <div className="value">
            {(summary.households / 1_000_000).toLocaleString("nb-NO", {
              maximumFractionDigits: 1,
            })}{" "}
            mill.
          </div>
          <div>husholdninger i Norge og Europa kan få strømmen sin derfra</div>
        </div>
      </div>

      <h3>Norge selger allerede energi til Europa – bare i feil form</h3>
      <div className="transition-steps">
        <div className="transition-step">
          <div className="step-emoji">🔌</div>
          <h4>Strøm er allerede eksportvare</h4>
          <div>
            Det siste året eksporterte Norge{" "}
            <strong>
              {energyData.electricity.exportTwh.toLocaleString("nb-NO")} TWh
            </strong>{" "}
            strøm – i {energyData.trade.year} var krafteksporten verdt{" "}
            <strong>
              {energyData.trade.exportValueBnNok.toLocaleString("nb-NO")}{" "}
              milliarder kroner
            </strong>
            . Utfasing betyr ikke å slutte å selge energi til Europa – det betyr
            å bytte produkt.
          </div>
        </div>
        <div className="transition-step">
          <div className="step-emoji">🌬️</div>
          <h4>Er det realistisk? Sammenlign med i dag</h4>
          <div>
            Norsk vindkraft produserer allerede{" "}
            <strong>
              {energyData.electricity.windProductionTwh.toLocaleString("nb-NO")}{" "}
              TWh
            </strong>{" "}
            i året. Erstatningsbehovet i dette scenarioet (
            {summary.replacementTwh.toLocaleString("nb-NO")} TWh) tilsvarer{" "}
            <strong>
              {(
                Math.round(
                  (summary.replacementTwh /
                    energyData.electricity.windProductionTwh) *
                    10,
                ) / 10
              ).toLocaleString("nb-NO")}{" "}
              ganger
            </strong>{" "}
            dagens norske vindkraftproduksjon – fordelt over 15 år.
          </div>
        </div>
        <div className="transition-step">
          <div className="step-emoji">⚖️</div>
          <h4>Vi har allerede overskudd</h4>
          <div>
            Norge produserer{" "}
            {energyData.electricity.productionTwh.toLocaleString("nb-NO")} TWh
            strøm og bruker{" "}
            {energyData.electricity.consumptionTwh.toLocaleString("nb-NO")} TWh.
            Og oljeutvinningen bruker selv{" "}
            <strong>
              {energyData.electricity.oilGasConsumptionTwh.toLocaleString(
                "nb-NO",
              )}{" "}
              TWh strøm
            </strong>{" "}
            i året – mot{" "}
            {energyData.electricity.windProductionTwh.toLocaleString("nb-NO")}{" "}
            TWh fra all norsk vindkraft. Den strømmen frigjøres når feltene
            stenges.
          </div>
        </div>
      </div>

      {/* Pengespørsmålet eies av /kostnad — her lenker vi dit i stedet for
          å gjenta hele regnestykket (siden var 7 skjermer lang) */}
      <div className="transition-economy-link">
        💰 <strong>Hva med pengene?</strong> Tapte inntekter, fondet og hva
        omstillingen koster – <Link to="/kostnad">se hele regnestykket</Link>.
      </div>

      <SourcesNote />
    </div>
  );
}

/**
 * Area chart on a single TWh axis: fossil energy under the chosen scenario,
 * the do-nothing baseline as a dashed reference line, and the renewable
 * replacement need as a (visibly small) green area.
 */
function TransitionChart({
  series,
}: {
  series: ReturnType<typeof transitionSeries>;
}) {
  // Palette validated for CVD and contrast against the app's light (#e0ffb2)
  // and dark (#133600) surfaces; the colors live as CSS variables on
  // .transition-chart so light/dark switching stays in CSS
  return (
    <LineChart
      title="Fossil energi ut – fornybar erstatning inn (TWh per år)"
      xLabel="År"
      yLabel="TWh per år"
      tooltipLabel={(s, point) =>
        `${s.label}: ${Math.round(point.y).toLocaleString("nb-NO")} TWh`
      }
      series={[
        {
          label: "Fossil energi med planen",
          color: "var(--transition-fossil)",
          fill: "var(--transition-fossil)",
          fillOpacity: 0.4,
          showPoints: false,
          points: series.map((s) => ({ x: Number(s.year), y: s.planTwh })),
        },
        {
          label: "Uten tiltak",
          color: "var(--transition-referanse)",
          dashed: true,
          showPoints: false,
          points: series.map((s) => ({ x: Number(s.year), y: s.baselineTwh })),
        },
        {
          label: "Fornybar strøm som gir samme nytte",
          color: "var(--transition-fornybar)",
          fill: "var(--transition-fornybar)",
          fillOpacity: 0.6,
          showPoints: false,
          points: series.map((s) => ({
            x: Number(s.year),
            y: s.replacementTwh,
          })),
        },
      ]}
    />
  );
}
