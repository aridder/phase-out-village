import React, { useContext, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import {
  gameData,
  PhaseOutSchedule,
  totalProduction,
} from "../../data/gameData";
import { mdgPlan } from "../../generated/dataMdg";
import { cumulativeEmissions } from "../../analysis/fieldStats";
import { scheduledShare } from "../../analysis/periodAnalysis";
import { economySummary } from "../../data/petroleumEconomy";
import {
  transitionSummary,
  usefulEnergyScenarios,
  DEFAULT_USEFUL_ENERGY_SCENARIO,
} from "../../data/energyTransition";
import { planForEndYear } from "../../data/simplePlan";
import { periods } from "../../data/periods";
import { alternatives, plannedVsUnplanned } from "../../data/alternatives";
import { shelfToday } from "../../data/norwayToday";
import { OIL_FUND_BN_NOK } from "../../data/norwayFacts";
import { emissionEquivalents } from "../../analysis/emissionEquivalents";
import { Icon } from "../ui/icons";
import { Illustration } from "../ui/illustrations";
import { SourcesNote } from "../ui/sourcesNote";
import "../today/today.css";
import "./verdict.css";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

/**
 * ACT 3 — the reckoning.
 *
 * The old ending handed out a grade from A+ to F, a trophy or a
 * "nesten i mål", and measured the player against one party's plan. That
 * is a scoring screen for an argument, not a result for a simulation, and
 * it undid the even-handedness of everything before it.
 *
 * This one states what the plan did, what it cost, and where it sits among
 * four reference plans — including doing nothing at all. Then it answers
 * the question the player will actually have ("so what replaces it?"),
 * with the limits of each option stated, and closes on the one claim the
 * data does support: that a scheduled decline is worth more than an
 * unscheduled one, whatever end date you prefer.
 */
export function VerdictRoute() {
  useDocumentTitle("Oppgjøret");
  const { phaseOut, restart, year } = useContext(ApplicationContext);
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(DEFAULT_USEFUL_ENERGY_SCENARIO);

  const shelf = shelfToday();

  const references = useMemo(() => {
    const baseline = cumulativeEmissions({});
    const cut = (plan: PhaseOutSchedule) =>
      ((baseline - cumulativeEmissions(plan)) / baseline) * 100;
    return {
      baseline,
      rows: [
        { key: "none", label: "Ingen vedtak", cut: 0, own: false },
        { key: "mine", label: "Din plan", cut: cut(phaseOut), own: true },
        { key: "mdg", label: "MDGs plan", cut: cut(mdgPlan), own: false },
        {
          // A real ramp-down finishing in 2035, not "everything runs flat
          // out until 2035 and then stops" — the latter cuts LESS than most
          // player plans, which made the reference row nonsense
          key: "full",
          label: "Full utfasing innen 2035",
          cut: cut(planForEndYear(2035)),
          own: false,
        },
      ].sort((a, b) => a.cut - b.cut),
    };
  }, [phaseOut]);

  const mine = references.rows.find((r) => r.own)!;
  const avoidedTonnes = useMemo(
    () => cumulativeEmissions({}) - cumulativeEmissions(phaseOut),
    [phaseOut],
  );
  const economy = useMemo(() => economySummary(phaseOut), [phaseOut]);
  const energy = useMemo(
    () => transitionSummary(phaseOut, scenario.factor),
    [phaseOut, scenario],
  );
  const equivalents = useMemo(
    () => emissionEquivalents(avoidedTonnes),
    [avoidedTonnes],
  );
  const share = useMemo(() => scheduledShare(phaseOut), [phaseOut]);
  const lastPeriod = periods[periods.length - 1];

  /**
   * What is still pumping in 2040 with no decided end date — the actual
   * inheritance, and what the fourth period's brief promises to answer.
   *
   * NOT "100 % minus the share with an end date". A field that emptied
   * itself before 2037 is in scheduledShare's 2025 denominator but cannot
   * be selected in the fourth period, so that complement counts depleted
   * fields as something handed over. Close everything the last period
   * offers and the share stops at 98,1 %, while what actually carries into
   * the next decade is 0.
   */
  const runningIn2040 = useMemo(
    () =>
      totalProduction(phaseOut, ["2040"])["2040"]?.totalProduction?.value ?? 0,
    [phaseOut],
  );

  // Reaching the finale mid-game (deep link, curiosity) is not a finale
  if (year !== "2040") return <Navigate to="/map" replace />;

  const fieldsClosed = Object.keys(phaseOut).length;
  const fieldsTotal = gameData.allFields.length;
  const maxCut = Math.max(...references.rows.map((r) => r.cut), 1);
  const perCapitaMonthly = Math.round(economy.perCapitaKr / 12 / 10) * 10;

  return (
    <article className="verdict-page">
      <header className="verdict-hero">
        <div className="kicker">Del 3 av 3 · 2040</div>
        <h1>Oppgjøret</h1>
        <p className="verdict-lead">
          Femten år er gått. Dette er hva planen din gjorde – og hva den kostet.
        </p>
      </header>

      {/* ------------------------------------------------------ 1. The result */}
      <section className="verdict-section">
        <h2>Planen din, i tall</h2>
        <div className="stats has-lead">
          <div className="lead">
            <p className="num">
              {(avoidedTonnes / 1_000_000).toLocaleString("nb-NO", {
                maximumFractionDigits: 0,
              })}{" "}
              <small className="unit">mill. tonn CO₂</small>
            </p>
            <p className="label">
              unngått i alt 2025–2040 – et kutt på{" "}
              {mine.cut.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} %
              av de samlede utslippene
            </p>
          </div>
          <div>
            <p className="num">
              {fieldsClosed}{" "}
              <small className="unit">av {fieldsTotal} felt</small>
            </p>
            <p className="label">fikk en vedtatt sluttdato</p>
          </div>
          <div>
            <p className="num">
              {Math.round(share * 100)} <small className="unit">%</small>
            </p>
            <p className="label">
              av produksjonen, målt i 2025-nivå, har fått en sluttdato
            </p>
          </div>
          <div>
            <p className="num">
              {energy.phasedOutTwh.toLocaleString("nb-NO")}{" "}
              <small className="unit">TWh</small>
            </p>
            <p className="label">
              fossil energi er ute av produksjon i 2040 som følge av planen
            </p>
          </div>
        </div>

        {/* Briefen for siste periode lover «Det du måles på: Sokkelen med
            sluttdato», og spillet svarte aldri på det: fjerde periode går
            rett hit, uten perioderapport. Tallet sto her hele tiden – det
            manglet bare en setning som sa hva det var. Navn og årstall
            hentes fra periods.ts, så løftet og svaret ikke kan skli fra
            hverandre. */}
        <p className="verdict-note">
          «{lastPeriod.measure.name}» var måltallet for {lastPeriod.label}, den
          siste perioden du styrte: {Math.round(share * 100)} % av produksjonen
          har en dato.{" "}
          {runningIn2040 > 0.005 ? (
            <>
              {runningIn2040.toLocaleString("nb-NO", {
                maximumFractionDigits: 1,
              })}{" "}
              mill. Sm³ o.e. går fortsatt i 2040, uten at du har bestemt når det
              skal ta slutt.
            </>
          ) : (
            <>
              Ingenting går videre inn i tiåret etter uten en vedtatt sluttdato.
            </>
          )}
        </p>

        {equivalents.length > 0 && (
          <p className="verdict-note">
            Til sammenligning tilsvarer kuttet{" "}
            {equivalents
              .slice(0, 2)
              .map((e) => `${e.amount} ${e.label}`)
              .join(", eller ")}
            .
          </p>
        )}
      </section>

      {/* -------------------------------------------------- 2. Against others */}
      <section className="verdict-section">
        <h2>Din plan ved siden av tre andre</h2>
        <p className="verdict-body">
          Ingen av disse er fasiten. De er fire ulike svar på det samme
          spørsmålet, målt på samlede utslipp fra sokkelen 2025–2040.
        </p>
        <div className="compare">
          {references.rows.map((row) => (
            <div
              key={row.key}
              className={row.own ? "compare-row own" : "compare-row"}
            >
              <span className="compare-label">{row.label}</span>
              <span className="compare-track">
                <span
                  className="fill"
                  style={{ width: `${(row.cut / maxCut) * 100}%` }}
                />
              </span>
              <span className="compare-value">
                −
                {row.cut.toLocaleString("nb-NO", {
                  maximumFractionDigits: 0,
                })}{" "}
                %
              </span>
            </div>
          ))}
        </div>
        <p className="verdict-note">
          Merk at «ingen vedtak» ikke betyr uendret utslipp: de årlige
          utslippene faller 43 % fram til 2040 helt av seg selv, fordi feltene
          tømmes. Søylene her måler kuttet i de <em>samlede</em> utslippene over
          hele perioden, som er det en plan faktisk kan påvirke.
        </p>
      </section>

      {/* ------------------------------------------------------------ 3. Cost */}
      <section className="verdict-section">
        <h2>Regningen</h2>
        <div className="stats">
          <div>
            <p className="num">
              {economy.cumulativeLostStateRevenueBnNok.toLocaleString("nb-NO")}{" "}
              <small className="unit">mrd kr</small>
            </p>
            <p className="label">
              mindre til staten over hele perioden, i dagens priser
            </p>
          </div>
          <div>
            <p className="num">
              {economy.stateBudgetMultiple.toLocaleString("nb-NO")}{" "}
              <small className="unit">statsbudsjett</small>
            </p>
            <p className="label">
              er det samme beløpet, fordelt over femten år
            </p>
          </div>
          <div>
            <p className="num">
              {perCapitaMonthly.toLocaleString("nb-NO")}{" "}
              <small className="unit">kr</small>
            </p>
            <p className="label">per innbygger per måned i 2040</p>
          </div>
          <div>
            <p className="num">
              {OIL_FUND_BN_NOK.toLocaleString("nb-NO")}{" "}
              <small className="unit">mrd kr</small>
            </p>
            <p className="label">står i Oljefondet til sammenligning</p>
          </div>
        </div>
        <p className="verdict-note">
          Slik virker det: petroleumsinntektene går til Oljefondet, ikke rett
          inn i statsbudsjettet. Et mindre fond kuttes derfor ikke fra neste års
          velferd – det gir mindre handlingsrom over tid, fordi staten bruker en
          andel av fondet hvert år. Og{" "}
          {Math.round((1 - shelf.remainingIn2040) * 100)} % av inntektsfallet
          kommer uansett, fordi feltene tømmes. Tallene over er bare det planen
          din legger til.
        </p>
      </section>

      {/* ---------------------------------------------------- 4. Alternatives */}
      <section className="verdict-section">
        <h2>Hva skal erstatte energien?</h2>
        <p className="verdict-body">
          Sokkelen leverte {shelf.energyTwh.toLocaleString("nb-NO")} TWh energi
          i året da du begynte. Hvor mye ren strøm som må til for å gi samme
          nytte, avhenger helt av hva den fossile energien brukes til – så du
          får velge antakelsen selv.
        </p>

        <div
          className="scenario-picker"
          role="group"
          aria-label="Antakelse om bruk"
        >
          {usefulEnergyScenarios.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={scenario.key === option.key}
              className={scenario.key === option.key ? "active" : ""}
              onClick={() => setScenario(option)}
            >
              {option.label}
              <span className="scenario-factor">
                {Math.round(option.factor * 100)} % nyttig
              </span>
            </button>
          ))}
        </div>

        <div className="stats">
          <div>
            <p className="num">
              {energy.replacementTwh.toLocaleString("nb-NO")}{" "}
              <small className="unit">TWh</small>
            </p>
            <p className="label">
              ren strøm i året gir samme nytte som det planen din faset ut
            </p>
          </div>
          <div>
            <p className="num">{energy.turbines.toLocaleString("nb-NO")}</p>
            <p className="label">
              havvindturbiner på 15 MW ville produsert den strømmen
            </p>
          </div>
        </div>

        <div className="alternatives">
          {alternatives().map((alternative) => (
            <article key={alternative.name} className="alternative">
              <div className="alternative-mark">
                {alternative.illustration ? (
                  <Illustration name={alternative.illustration} size={40} />
                ) : (
                  alternative.icon && <Icon name={alternative.icon} size={20} />
                )}
              </div>
              <div>
                <h3>{alternative.name}</h3>
                <p className="num alternative-value">
                  {alternative.value}{" "}
                  <small className="unit">{alternative.unit}</small>
                </p>
                <p>{alternative.text}</p>
                <p className="alternative-limit">
                  <strong>Men:</strong> {alternative.limit}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- 5. The closing case */}
      <section className="verdict-section closing">
        <h2>Det som faktisk står på spill</h2>
        <p className="verdict-body">
          Ingenting i dette spillet avgjør om Norge bør fase ut oljen. Det er et
          politisk spørsmål, og folk med de samme tallene foran seg konkluderer
          ulikt.
        </p>
        <p className="verdict-body">
          Men én ting følger av tallene selv:{" "}
          <strong>
            sokkelen går ned uansett, og en styrt nedgang er verdt mer enn en
            ustyrt.
          </strong>{" "}
          Her er hvorfor.
        </p>

        {/* Dette ER sammenlignbare data, og hører hjemme i en tabell —
            før var det fire kort som hver inneholdt to kort til */}
        <table className="planned-table">
          <thead>
            <tr>
              <th scope="col">Spørsmålet</th>
              <th scope="col">Med plan</th>
              <th scope="col">Uten plan</th>
            </tr>
          </thead>
          <tbody>
            {plannedVsUnplanned.map((item) => (
              <tr key={item.title}>
                <th scope="row">
                  <Icon name={item.icon} size={16} muted />
                  {item.title}
                </th>
                <td>{item.planned}</td>
                <td>{item.unplanned}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="verdict-close">
          Feltene stenger uansett. Forskjellen mellom en plan og ingen plan er
          at planen kan ta de dyreste fatene først, og at de som lever av
          sokkelen får vite når – i stedet for å få vite det når oljeprisen
          allerede har bestemt det.
        </p>
      </section>

      <div className="verdict-actions">
        <button className="primary" onClick={restart}>
          Prøv en annen rekkefølge
        </button>
        <button onClick={() => navigate("/map")}>Se planen på kartet</button>
        <button onClick={() => navigate("/norge")}>Tilbake til tallene</button>
        <button onClick={() => navigate("/kostnad")}>Regn på kostnaden</button>
      </div>

      <SourcesNote />
    </article>
  );
}
