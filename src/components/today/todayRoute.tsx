import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { intensityReasons, shelfToday } from "../../data/norwayToday";
import { energyData } from "../../generated/energyData";
import {
  usefulEnergyScenarios,
  DEFAULT_USEFUL_ENERGY_SCENARIO,
} from "../../data/energyTransition";
import { OIL_FUND_BN_NOK } from "../../data/norwayFacts";
import { Illustration } from "../ui/illustrations";
import { IntensityStrip } from "./intensityStrip";
import { SourcesNote } from "../ui/sourcesNote";
import "./today.css";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

/**
 * ACT 1 — «Norge i dag».
 *
 * Before the player is asked to decide anything, they get the board: what
 * the shelf is, what it earns, how unlike each other the fields are, and
 * what happens to all of it if nobody does anything.
 *
 * The act argues for nothing. Every section is a fact with a source, and
 * the hinge at the bottom says so explicitly. That is deliberate: the game
 * that follows asks the player to choose an order, and a player who
 * suspects they are being steered will not engage with the choice.
 */
export function TodayRoute() {
  useDocumentTitle("Norge i dag");
  const navigate = useNavigate();
  const { restart } = useContext(ApplicationContext);
  const shelf = shelfToday();
  const [scenario, setScenario] = useState(DEFAULT_USEFUL_ENERGY_SCENARIO);

  /**
   * The comparison that makes "the fields differ" concrete.
   *
   * Both sides are picked from fields of real size. The very dirtiest field
   * on the shelf is also one of the smallest, and pairing an outlier
   * against the biggest field invites the obvious objection that it is a
   * rounding error either way. Restricting both sides to fields producing
   * at least a million Sm³ keeps the comparison one a sceptic can accept.
   */
  const contrast = useMemo(() => {
    const substantial = shelf.fields.filter(
      (f) => f.production >= 1 && !f.noEmissionData,
    );
    const clean = [...substantial].sort((a, b) => a.intensity - b.intensity)[0];
    const dirty = [...substantial].sort((a, b) => b.intensity - a.intensity)[0];
    return {
      clean,
      dirty,
      productionRatio: Math.round(clean.production / dirty.production),
      emissionRatio: Math.round(dirty.emission / clean.emission),
    };
  }, [shelf]);

  const electricityMultiple = Math.round(
    shelf.energyTwh / energyData.electricity.consumptionTwh,
  );
  const replacementTwh = Math.round(shelf.energyTwh * scenario.factor);

  function startGame() {
    restart();
    navigate("/periode");
  }

  return (
    <article className="today-page">
      {/* ---------------------------------------------------------- 1. The shelf */}
      <header className="today-hero">
        <div className="kicker">Del 1 av 3</div>
        <h1>Norge i dag</h1>
        <p className="today-lead">
          Før du bestemmer noe som helst: dette er sokkelen slik den står i{" "}
          {shelf.year}. {shelf.fieldCount} felt i drift, tallene hentet fra
          Norsk Petroleum og SSB.
        </p>
      </header>

      <section className="today-section">
        <h2>Maskinen</h2>
        <div className="stats has-lead">
          <Figure
            value={shelf.production.toLocaleString("nb-NO")}
            unit="mill. Sm³ o.e."
            label={`olje og gass i året – ${shelf.oilProduction} olje, ${shelf.gasProduction} gass`}
          />
          <Figure
            value={shelf.energyTwh.toLocaleString("nb-NO")}
            unit="TWh energi"
            label={`i året. Hele Norge bruker ${energyData.electricity.consumptionTwh} TWh strøm – sokkelen produserer ${electricityMultiple} ganger så mye energi`}
            highlight
          />
          <Figure
            value={shelf.emissionMt.toLocaleString("nb-NO")}
            unit="mill. tonn CO₂"
            label={`i året fra selve utvinningen – ${Math.round(shelf.shareOfNorwayEmissions * 100)} % av Norges samlede utslipp`}
          />
          <Figure
            value={shelf.ownElectricityTwh.toLocaleString("nb-NO")}
            unit="TWh strøm"
            label={`bruker plattformene selv – mot ${energyData.electricity.windProductionTwh} TWh fra all norsk vindkraft`}
          />
        </div>
        <p className="today-note">
          Nesten alt eksporteres. Utslippstallet gjelder produksjonen på
          sokkelen – det som skjer når oljen og gassen brennes i andre land,
          teller i deres regnskap, ikke i vårt.
        </p>
      </section>

      {/* ------------------------------------------------------------ 2. Money */}
      <section className="today-section">
        <h2>Pengene</h2>
        <div className="money-bar" aria-hidden="true">
          <div
            className="money-state"
            style={{
              width: `${(shelf.stateRevenueBnNok / shelf.exportValueBnNok) * 100}%`,
            }}
          />
        </div>
        <div className="money-legend">
          <span>
            <span className="key state" /> Til staten:{" "}
            <strong>{shelf.stateRevenueBnNok} mrd kr</strong>
          </span>
          <span>
            <span className="key rest" /> Eksportverdi i alt:{" "}
            <strong>
              {shelf.exportValueBnNok.toLocaleString("nb-NO")} mrd kr
            </strong>
          </span>
        </div>

        <div className="stats has-lead">
          <Figure
            value={shelf.revenuePerCapitaKr.toLocaleString("nb-NO")}
            unit="kroner"
            label="per innbygger per år, er statens netto inntekt fra petroleum"
            highlight
          />
          <Figure
            value={`${Math.round(shelf.shareOfStateBudget * 100)} %`}
            unit="av statsbudsjettet"
            label="tilsvarer petroleumsinntektene i størrelse"
          />
          <Figure
            value={OIL_FUND_BN_NOK.toLocaleString("nb-NO")}
            unit="mrd kr"
            label="står allerede i Oljefondet – over 30 år med dagens årsinntekt fra sokkelen"
          />
        </div>
        <p className="today-note">
          Inntektene går ikke rett inn i statsbudsjettet. De går til Oljefondet,
          og staten bruker en andel av fondet hvert år. Det er derfor et
          bortfall av oljeinntekter ikke merkes som kutt neste år, men som
          mindre handlingsrom over tid.
        </p>
      </section>

      {/* -------------------------------------------------- 3. Fields differ */}
      <section className="today-section">
        <h2>Feltene er ikke like</h2>
        <p className="today-body">
          Et fat olje er et fat olje. Men hva det koster i utslipp å hente det
          opp, varierer enormt fra felt til felt – på norsk sokkel med en faktor
          på over <strong>{shelf.intensitySpread}</strong>.
        </p>

        <IntensityStrip />

        <div className="contrast">
          {[contrast.clean, contrast.dirty].map((field) => (
            <div key={field.field}>
              <h3>{field.field}</h3>
              <p className="num">
                {field.intensity.toLocaleString("nb-NO")}{" "}
                <small className="unit">kg CO₂/fat</small>
              </p>
              <p className="label">
                {field.production.toLocaleString("nb-NO")} mill. Sm³ o.e./år ·{" "}
                {field.sea} · funnet {field.discovered}
              </p>
            </div>
          ))}
        </div>
        <p className="today-punchline">
          {contrast.dirty.field} produserer{" "}
          <strong>{contrast.productionRatio} ganger mindre</strong> enn{" "}
          {contrast.clean.field}, og slipper likevel ut{" "}
          <strong>{contrast.emissionRatio} ganger mer</strong> CO₂.
        </p>

        <h3>Hvorfor er forskjellen så stor?</h3>
        <div className="reasons">
          {intensityReasons.map((reason) => (
            <article key={reason.title} className="reason">
              <Illustration name={reason.illustration} size={40} />
              <div>
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ 4. Energy loss */}
      <section className="today-section">
        <h2>Energien som forsvinner</h2>
        <p className="today-body">
          Sokkelen produserer{" "}
          <strong>{shelf.energyTwh.toLocaleString("nb-NO")} TWh</strong> energi
          i året. Men energi i et fat olje er ikke det samme som energi levert
          til noen som trenger den. Mye av den blir varme ingen bruker – hvor
          mye, avhenger helt av hva den brukes til.
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
        <p className="scenario-explainer">{scenario.explainer}</p>

        <div className="energy-compare">
          <div className="energy-row">
            <span className="energy-label">Energi sokkelen leverer</span>
            <span className="energy-track">
              <span className="fill fossil" style={{ width: "100%" }} />
            </span>
            <span className="energy-value">
              {shelf.energyTwh.toLocaleString("nb-NO")} TWh
            </span>
          </div>
          <div className="energy-row">
            <span className="energy-label">Ren strøm som gir samme nytte</span>
            <span className="energy-track">
              <span
                className="fill renewable"
                style={{ width: `${scenario.factor * 100}%` }}
              />
            </span>
            <span className="energy-value">
              {replacementTwh.toLocaleString("nb-NO")} TWh
            </span>
          </div>
        </div>
        <p className="today-note">
          Dette er den mest omstridte antakelsen i hele spillet, så du får velge
          den selv. Den lave enden gjelder motorer, den høye gjelder gasskjeler
          og industriråstoff. Vi bruker «{DEFAULT_USEFUL_ENERGY_SCENARIO.label}»
          som utgangspunkt der du ikke velger.
        </p>
      </section>

      {/* --------------------------------------------------- 5. Natural decline */}
      <section className="today-section decline">
        <h2>Og så dette: feltene tømmes</h2>
        <p className="today-body">
          Ingen av tallene over er stabile. Reservoarene tømmes, og produksjonen
          faller av seg selv – uten at Stortinget vedtar noe som helst.
        </p>
        <div className="stats has-lead">
          <Figure
            value={`−${Math.round((1 - shelf.remainingIn2040) * 100)} %`}
            unit="produksjon"
            label="av dagens nivå er borte innen 2040, helt uten vedtak"
            highlight
          />
          <Figure
            value="−43 %"
            unit="årlige utslipp"
            label="faller de i samme periode – altså mindre enn produksjonen"
          />
          <Figure
            value="6,6 → 13,7"
            unit="kg CO₂ per fat"
            label="fordi feltene som blir igjen er de eldste og mest energikrevende"
          />
        </div>
        <p className="today-note">
          Legg merke til det siste tallet. Produksjonen faller med tre
          fjerdedeler, men utslippene bare med drøyt fire tideler, fordi de
          siste fatene er de dyreste å hente opp. Det er sokkelens egen
          utvikling, ikke en konsekvens av noen plan.
        </p>
      </section>

      {/* ------------------------------------------------------------- 6. Hinge */}
      <section className="today-hinge">
        <h2>Så – hva nå?</h2>
        <p>
          Norge har bygget dette i femti år, og det har betalt for landet vi
          har. Ingenting på denne siden sier at det var feil, og ingenting i
          resten av spillet kommer til å påstå at utfasing er det eneste
          riktige.
        </p>
        <p>
          Men feltene tømmes uansett, og de siste fatene er de dyreste i
          utslipp. Da er spørsmålet ikke <em>om</em> sokkelen skal ned, men{" "}
          <strong>hvilke felt som går først</strong> – og hva den rekkefølgen
          betyr for klimaet og for statskassa.
        </p>
        <p>
          I resten av spillet velger du rekkefølgen. Vi viser regnestykket begge
          veier, og alle forutsetningene står oppført nederst. Er du uenig i
          noen av dem, er det bare å endre dem og se om konklusjonen holder.
        </p>
        <div className="hinge-actions">
          <button className="primary" onClick={startGame}>
            Del 2: Velg rekkefølgen →
          </button>
          <button onClick={() => navigate("/map")}>
            Utforsk feltene først
          </button>
        </div>
      </section>

      <SourcesNote />
    </article>
  );
}

/**
 * One statistic: number and unit on the same line, then the sentence that
 * explains it. No box — emphasis is carried by weight, with the siblings
 * dimmed (see `.stats.has-lead` in application.css).
 */
function Figure({
  value,
  unit,
  label,
  highlight,
}: {
  value: string;
  unit: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "lead" : undefined}>
      <p className="num">
        {value} <small className="unit">{unit}</small>
      </p>
      <p className="label">{label}</p>
    </div>
  );
}
