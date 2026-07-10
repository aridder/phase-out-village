import React, { useContext, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { ApplicationContext } from "../../applicationContext";
import { PhaseOutSchedule } from "../../data/gameData";
import { mdgPlan } from "../../generated/dataMdg";
import {
  fullPhaseOut,
  transitionSeries,
  transitionSummary,
  USEFUL_ENERGY_FACTOR,
} from "../../data/energyTransition";
import { usePrefersDarkMode } from "../../hooks/usePrefersDarkMode";
import { energyData } from "../../generated/energyData";
import {
  DEFENSE_BUDGET_BN_NOK,
  economySummary,
  FUND_WITHDRAWAL_BN_NOK,
  SEAFOOD_EXPORT_BN_NOK,
  STATE_BUDGET_BN_NOK,
  STATE_NET_CASH_FLOW_BN_NOK,
} from "../../data/petroleumEconomy";
import { SourcesNote } from "../ui/sourcesNote";
import "./transition.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
);

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
      <div style={{ fontSize: "1.1em" }}>
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
      <div className="transition-stats">
        <div className="transition-stat">
          <div className="emoji">🛢️</div>
          <div className="value">
            {summary.phasedOutTwh.toLocaleString("nb-NO")} TWh
          </div>
          <div>
            fossil energi fases ut per år ({summary.phasedOutPercent} % av
            sokkelen)
          </div>
        </div>
        <div className="transition-stat highlight">
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
        <div className="transition-stat">
          <div className="emoji">🌬️</div>
          <div className="value">
            {summary.turbines.toLocaleString("nb-NO")}
          </div>
          <div>moderne havvindturbiner (15 MW) kan produsere den strømmen</div>
        </div>
        <div className="transition-stat">
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
            i året – nesten like mye som all norsk vindkraft produserer. Den
            strømmen frigjøres når feltene stenges.
          </div>
        </div>
      </div>

      <EconomySection schedule={schedule} />

      <SourcesNote />
    </div>
  );
}

/**
 * The money story for the chosen scenario: what the plan costs in annual
 * export value and state petroleum revenue by 2040 (at today's prices), what
 * that means per inhabitant, and how much of it disappears from natural
 * decline regardless of any plan.
 */
function EconomySection({ schedule }: { schedule: PhaseOutSchedule }) {
  const economy = useMemo(() => economySummary(schedule), [schedule]);
  const naturalPercent = Math.round(economy.naturalDeclineShare * 100);
  const planPercent = Math.round(economy.planShare * 100);

  return (
    <>
      <h3>💰 Hva med pengene?</h3>
      <div className="transition-steps">
        <div className="transition-step">
          <div className="step-emoji">🛢️</div>
          <h4>Dette tjener Norge i dag</h4>
          <div>
            Olje- og gasseksporten var verdt{" "}
            <strong>
              {economy.petroleumExportValueBnNok.toLocaleString("nb-NO")}{" "}
              milliarder kroner
            </strong>{" "}
            i {energyData.trade.year}. Av dette fikk staten{" "}
            <strong>
              {economy.stateRevenueBnNok.toLocaleString("nb-NO")} milliarder
            </strong>{" "}
            gjennom skatter, eierandeler og utbytte.
          </div>
        </div>
        <div className="transition-step">
          <div className="step-emoji">📉</div>
          <h4>Det meste forsvinner uansett</h4>
          <div>
            Feltene tømmes: uten noen plan faller produksjonen med{" "}
            <strong>~{naturalPercent} %</strong> innen 2040 i spillets
            fremskrivning. Den inntekten må erstattes uansett hva vi mener om
            utfasing – spørsmålet er om vi begynner å bygge nytt nå eller
            venter.
          </div>
        </div>
        <div className="transition-step">
          <div className="step-emoji">🏦</div>
          <h4>Pengene går i fondet – ikke rett i lommeboka</h4>
          <div>
            Statens oljeinntekter settes i Oljefondet, og budsjettet bruker bare
            avkastningen (~
            {FUND_WITHDRAWAL_BN_NOK.toLocaleString("nb-NO")} mrd i året).
            Utfasing bremser altså sparingen – dagens velferd betales i økende
            grad av fondet som allerede er spart opp.
          </div>
        </div>
      </div>

      {planPercent > 0 && (
        <>
          <h3>Regningen for planen i dette scenarioet</h3>
          <div className="transition-stats">
            <div className="transition-stat">
              <div className="emoji">📤</div>
              <div className="value">
                {economy.lostExportValueBnNok.toLocaleString("nb-NO")} mrd
              </div>
              <div>
                kroner i årlige eksportinntekter borte i 2040 (utover naturlig
                nedgang, dagens priser)
              </div>
            </div>
            <div className="transition-stat highlight">
              <div className="emoji">🏛️</div>
              <div className="value">
                {economy.lostStateRevenueBnNok.toLocaleString("nb-NO")} mrd
              </div>
              <div>
                kroner mindre i sparing til Oljefondet per år – ca.{" "}
                {economy.perCapitaKr.toLocaleString("nb-NO")} kr per innbygger
              </div>
            </div>
            <div className="transition-stat">
              <div className="emoji">🐟</div>
              <div className="value">
                {economy.seafoodMultiple.toLocaleString("nb-NO")} ×
              </div>
              <div>
                sjømateksporten ({SEAFOOD_EXPORT_BN_NOK} mrd) – så mye nytt
                eksportnæringsliv trengs for samme kjøpekraft
              </div>
            </div>
            <div className="transition-stat">
              <div className="emoji">🏦</div>
              <div className="value">{economy.fundWithdrawalPercent} %</div>
              <div>
                av dagens årlige uttak fra Oljefondet – fondet er bufferen som
                gjør omstillingen mulig
              </div>
            </div>
            <div className="transition-stat">
              <div className="emoji">🧾</div>
              <div className="value">
                {economy.cumulativeLostStateRevenueBnNok.toLocaleString(
                  "nb-NO",
                )}{" "}
                mrd
              </div>
              <div>
                samlet for hele perioden 2025–2040 – det tilsvarer{" "}
                {economy.stateBudgetMultiple.toLocaleString("nb-NO")}{" "}
                statsbudsjett ({STATE_BUDGET_BN_NOK.toLocaleString("nb-NO")}{" "}
                mrd)
              </div>
            </div>
            <div className="transition-stat">
              <div className="emoji">🎖️</div>
              <div className="value">
                {economy.defenseBudgetMultiple.toLocaleString("nb-NO")} ×
              </div>
              <div>
                forsvarsbudsjettet ({DEFENSE_BUDGET_BN_NOK} mrd) – årstapet i
                2040 målt i noe staten faktisk bruker penger på
              </div>
            </div>
          </div>
          <div>
            Dette er innsatsen omstillingen krever: planen i dette scenarioet
            fjerner de siste <strong>{planPercent} %</strong> av dagens
            produksjon innen 2040. Erstatningen finnes i det grønne feltet i
            grafen over – kraft til nye eksportnæringer som havvind, hydrogen,
            batterier og prosessindustri – og i fondet som er bygget opp nettopp
            for denne overgangen.
          </div>
        </>
      )}
    </>
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
  const isDarkMode = usePrefersDarkMode();
  const textColor = isDarkMode ? "#fff" : "#000";
  // Palette validated for CVD and contrast against the app's light (#e0ffb2)
  // and dark (#133600) surfaces
  const fossilColor = isDarkMode ? "#4a8fd6" : "#2e6bc4";
  const renewableColor = isDarkMode ? "#6aa832" : "#347103";
  const referenceColor = isDarkMode ? "#bbb" : "#666";

  return (
    <Line
      options={{
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, labels: { color: textColor } },
          title: {
            display: true,
            text: "Fossil energi ut – fornybar erstatning inn (TWh per år)",
            color: textColor,
            padding: { bottom: 20 },
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${Math.round(context.parsed.y ?? 0).toLocaleString("nb-NO")} TWh`,
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "År", color: textColor },
            ticks: { color: textColor },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "TWh per år", color: textColor },
            ticks: {
              color: textColor,
              callback: (value) => Number(value).toLocaleString("nb-NO"),
            },
          },
        },
      }}
      data={{
        labels: series.map((s) => s.year),
        datasets: [
          {
            label: "Fossil energi med planen",
            data: series.map((s) => s.planTwh),
            borderColor: fossilColor,
            backgroundColor: `${fossilColor}66`,
            fill: true,
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 12,
          },
          {
            label: "Uten tiltak",
            data: series.map((s) => s.baselineTwh),
            borderColor: referenceColor,
            borderDash: [6, 6],
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            pointHitRadius: 12,
          },
          {
            label: "Fornybar strøm som gir samme nytte",
            data: series.map((s) => s.replacementTwh),
            borderColor: renewableColor,
            backgroundColor: `${renewableColor}99`,
            fill: true,
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 12,
          },
        ],
      }}
    />
  );
}
