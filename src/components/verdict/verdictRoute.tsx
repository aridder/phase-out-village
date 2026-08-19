import React, { useContext, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { gameData, PhaseOutSchedule } from "../../data/gameData";
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
import { alternatives, plannedVsUnplanned } from "../../data/alternatives";
import { shelfToday } from "../../data/norwayToday";
import { OIL_FUND_BN_NOK } from "../../data/norwayFacts";
import { emissionEquivalents } from "../../analysis/emissionEquivalents";
import { SourcesNote } from "../ui/sourcesNote";
import "../today/today.css";
import "./verdict.css";

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

  // Reaching the finale mid-game (deep link, curiosity) is not a finale
  if (year !== "2040") return <Navigate to="/map" replace />;

  const fieldsClosed = Object.keys(phaseOut).length;
  const fieldsTotal = gameData.allFields.length;
  const maxCut = Math.max(...references.rows.map((r) => r.cut), 1);
  const perCapitaMonthly = Math.round(economy.perCapitaKr / 12 / 10) * 10;

  return (
    <article className="verdict-page">
      <header className="verdict-hero">
        <div className="verdict-act">Del 3 av 3 · 2040</div>
        <h1>Oppgjøret</h1>
        <p className="verdict-lead">
          Femten år er gått. Dette er hva planen din gjorde – og hva den kostet.
        </p>
      </header>

      {/* ------------------------------------------------------ 1. The result */}
      <section className="verdict-section">
        <h2>Planen din, i tall</h2>
        <div className="verdict-figures">
          <div className="figure highlight">
            <div className="figure-value">
              {(avoidedTonnes / 1_000_000).toLocaleString("nb-NO", {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="figure-unit">mill. tonn CO₂</div>
            <div className="figure-label">
              unngått i alt 2025–2040 – et kutt på{" "}
              {mine.cut.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} %
              av de samlede utslippene
            </div>
          </div>
          <div className="figure">
            <div className="figure-value">
              {fieldsClosed} av {fieldsTotal}
            </div>
            <div className="figure-unit">felt</div>
            <div className="figure-label">fikk en vedtatt sluttdato</div>
          </div>
          <div className="figure">
            <div className="figure-value">{Math.round(share * 100)} %</div>
            <div className="figure-unit">av produksjonen</div>
            <div className="figure-label">
              målt i 2025-nivå, har fått en sluttdato
            </div>
          </div>
          <div className="figure">
            <div className="figure-value">
              {energy.phasedOutTwh.toLocaleString("nb-NO")}
            </div>
            <div className="figure-unit">TWh fossil energi</div>
            <div className="figure-label">
              er ute av produksjon i 2040 som følge av planen
            </div>
          </div>
        </div>

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
        <div className="verdict-figures">
          <div className="figure">
            <div className="figure-value">
              {economy.cumulativeLostStateRevenueBnNok.toLocaleString("nb-NO")}
            </div>
            <div className="figure-unit">mrd kr</div>
            <div className="figure-label">
              mindre til staten over hele perioden, i dagens priser
            </div>
          </div>
          <div className="figure">
            <div className="figure-value">
              {economy.stateBudgetMultiple.toLocaleString("nb-NO")}
            </div>
            <div className="figure-unit">statsbudsjett</div>
            <div className="figure-label">
              er det samme beløpet, fordelt over femten år
            </div>
          </div>
          <div className="figure">
            <div className="figure-value">
              {perCapitaMonthly.toLocaleString("nb-NO")}
            </div>
            <div className="figure-unit">kr per innbygger</div>
            <div className="figure-label">per måned i 2040</div>
          </div>
          <div className="figure">
            <div className="figure-value">
              {OIL_FUND_BN_NOK.toLocaleString("nb-NO")}
            </div>
            <div className="figure-unit">mrd kr</div>
            <div className="figure-label">
              står i Oljefondet til sammenligning
            </div>
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

        <div className="scenario-picker" role="group">
          {usefulEnergyScenarios.map((option) => (
            <button
              key={option.key}
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

        <div className="replacement">
          <div>
            <div className="replacement-value">
              {energy.replacementTwh.toLocaleString("nb-NO")} TWh
            </div>
            <div className="replacement-label">
              ren strøm i året gir samme nytte som det planen din faset ut
            </div>
          </div>
          <div>
            <div className="replacement-value">
              {energy.turbines.toLocaleString("nb-NO")}
            </div>
            <div className="replacement-label">
              havvindturbiner på 15 MW ville produsert den strømmen
            </div>
          </div>
        </div>

        <div className="alternatives">
          {alternatives().map((alternative) => (
            <div key={alternative.name} className="alternative">
              <div className="alternative-head">
                <span className="alternative-emoji">{alternative.emoji}</span>
                <div>
                  <div className="alternative-name">{alternative.name}</div>
                  <div className="alternative-value">
                    {alternative.value} <small>{alternative.unit}</small>
                  </div>
                </div>
              </div>
              <p>{alternative.text}</p>
              <p className="alternative-limit">
                <strong>Men:</strong> {alternative.limit}
              </p>
            </div>
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

        <div className="planned-grid">
          {plannedVsUnplanned.map((item) => (
            <div key={item.title} className="planned">
              <div className="planned-head">
                <span>{item.emoji}</span>
                <h3>{item.title}</h3>
              </div>
              <div className="planned-case with">
                <span className="case-label">Med plan</span>
                {item.planned}
              </div>
              <div className="planned-case without">
                <span className="case-label">Uten plan</span>
                {item.unplanned}
              </div>
            </div>
          ))}
        </div>

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
