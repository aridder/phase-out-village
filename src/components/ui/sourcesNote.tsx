import React from "react";
import { Link } from "react-router-dom";
import { energyData } from "../../generated/energyData";
import {
  HOUSEHOLDS_PER_TWH,
  TWH_PER_MILL_SM3_OE,
  TWH_PER_TURBINE_YEAR,
  usefulEnergyScenarios,
  DEFAULT_USEFUL_ENERGY_SCENARIO,
} from "../../data/energyTransition";
import { OFFSHORE_WIND_GW_TARGET } from "../../data/alternatives";
import { NORWAY_EMISSIONS_MT } from "../../data/norwayToday";
import {
  POPULATION_MILLIONS,
  STATE_BUDGET_BN_NOK,
  STATE_NET_CASH_FLOW_BN_NOK,
} from "../../data/petroleumEconomy";
import { oilEquivalentToBarrel } from "../../data/gameData";

/**
 * The shared sources block: every figure the fork's pages show, with a link
 * to where it comes from. Included on the cost, transition, report and
 * summary pages so no number appears without a checkable source.
 */
export function SourcesNote() {
  return (
    <div className="sources-note">
      {/* Sammenleggbar: på rapport- og resultatsidene skal kildene finnes,
          ikke dominere — utbrettet var kildelisten 43 % av perioderapporten */}
      <details>
        <summary>
          <strong>📚 Kilder for tallene</strong>
        </summary>
        <ul>
          <li>
            Produksjon og utslipp per felt (grunnlaget for TWh- og CO₂-tallene):{" "}
            <a href="https://www.norskpetroleum.no/">Norsk Petroleum</a> og
            Offshore Norge, fra originalspillets datasett. Omregning: 1 mill.
            Sm³ o.e. ≈ 10 TWh.
          </li>
          <li>
            Kraftbalansen (produksjon {energyData.electricity.productionTwh}{" "}
            TWh, forbruk {energyData.electricity.consumptionTwh} TWh,
            eksport/import, vindkraft, kraft til oljeutvinning):{" "}
            <a href="https://www.ssb.no/statbank/table/14091">
              SSB-tabell 14091 (elektrisitetsbalanse)
            </a>
            {energyData.verified
              ? `, hentet automatisk ${energyData.updatedAt}`
              : " (foreløpige anslag)"}
            .
          </li>
          <li>
            Eksportverdier for råolje, naturgass og strøm (
            {energyData.trade.petroleumExportValueBnNok.toLocaleString("nb-NO")}{" "}
            mrd kr i {energyData.trade.year}):{" "}
            <a href="https://www.ssb.no/statbank/table/08801">
              SSB-tabell 08801 (utenrikshandel med varer)
            </a>
            .
          </li>
          <li>
            Statens netto kontantstrøm fra petroleum (664 mrd kr i 2025, anslått
            til 686 mrd i 2026):{" "}
            <a href="https://www.norskpetroleum.no/okonomi/statens-inntekter/">
              Norsk Petroleum
            </a>{" "}
            og nasjonalbudsjettet 2026. Tapte inntekter er skalert med planens
            andel av produksjonen, til dagens priser.
          </li>
          <li>
            Statsbudsjettets samlede utgifter (2 201 mrd kr i 2026 – vi runder
            til 2 200), fondsuttaket (det strukturelle oljekorrigerte
            underskuddet, 579 mrd kr) og forsvarsbudsjettet (112 mrd kr utenom
            Ukraina-støtten):{" "}
            <a href="https://www.regjeringen.no/no/statsbudsjett/2026/id3118616/">
              statsbudsjettet 2026
            </a>
            . Oljefondets verdi (over 22 000 mrd kr, juli 2026):{" "}
            <a href="https://www.nbim.no/">Norges Bank Investment Management</a>
            .
          </li>
          <li>
            Vannmagasinenes kapasitet (~87 TWh, om lag halvparten av Europas):{" "}
            <a href="https://www.nve.no/energi/energisystem/vannkraft/">NVE</a>.
            Sjømateksport (181,5 mrd kr i 2025):{" "}
            <a href="https://www.seafood.no/aktuelt/nyheter/slik-gikk-det-med-sjomateksporten-i-2025/">
              Norges sjømatråd
            </a>
            . Fastlandseksport av varer (765,6 mrd kr i 2025):{" "}
            <a href="https://www.ssb.no/utenriksokonomi/utenrikshandel/statistikk/utenrikshandel-med-varer">
              SSB utenrikshandel
            </a>
            .
          </li>
          <li>
            <strong>Nytteenergi (den mest usikre forutsetningen):</strong> hvor
            mye ren strøm som trengs for å erstatte fossil energi, avhenger av
            hva energien brukes til – rundt{" "}
            {usefulEnergyScenarios[0].factor.toLocaleString("nb-NO")} TWh per
            TWh drivstoff i motorer, men nærmere{" "}
            {usefulEnergyScenarios[2].factor.toLocaleString("nb-NO")} for gass
            til oppvarming og industriråstoff (
            <a href="https://www.iea.org/">IEA</a> og alminnelige
            virkningsgrader). Vi regner med{" "}
            {DEFAULT_USEFUL_ENERGY_SCENARIO.factor.toLocaleString("nb-NO")} der
            du ikke velger selv, og du kan bytte antakelse på både faktasiden og
            i oppgjøret. En 15 MW havvindturbin ≈ 60 GWh/år. En gjennomsnittlig
            norsk husholdning brukte ~14 700 kWh strøm i 2024 (
            <a href="https://www.ssb.no/energi-og-industri/energi/artikler/hva-er-gjennomsnittlig-stromforbruk-i-husholdningene">
              SSB
            </a>
            ) – vi runder til 15 000. En bensinbil ≈ 2 tonn CO₂/år. Norges
            utslipp: 44,6 mill. tonn CO₂e i 2024 (
            <a href="https://www.ssb.no/natur-og-miljo/forurensning-og-klima/statistikk/utslipp-til-luft">
              SSB, endelige tall
            </a>
            ).
          </li>
          <li>
            Feltenes plassering, størrelse, funnår, havområde og operatør:{" "}
            <a href="https://factpages.sodir.no/">
              Sokkeldirektoratets faktakart
            </a>
            . Kartet tegner hvert felt som en boble i feltets arealvektede
            midtpunkt – arealet er produksjonen, fargen er utslipp per fat. Når
            hele sokkelen er i bildet skyves boblene fra hverandre så de ikke
            overlapper, og en strek viser hvor feltet egentlig ligger.
          </li>
          <li>
            Norges samlede utslipp (
            {NORWAY_EMISSIONS_MT.toLocaleString("nb-NO")} mill. tonn CO₂e i
            2024), som sokkelens utslipp måles mot:{" "}
            <a href="https://www.ssb.no/natur-og-miljo/forurensning-og-klima/statistikk/utslipp-til-luft">
              SSB
            </a>
            . Havvindmålet på {OFFSHORE_WIND_GW_TARGET} GW innen 2040:{" "}
            <a href="https://www.regjeringen.no/no/tema/energi/landingssider/havvind/">
              regjeringen.no
            </a>
            .
          </li>
          <li>
            <strong>Avviklingskapasiteten per periode</strong> (5, 10, 12 og
            fritt) er en spillregel, ikke et tall fra en kilde. Den finnes fordi
            plugging av brønner og fjerning av installasjoner krever rigger og
            fartøy det er begrenset tilgang på – men selve grensene er satt for
            at hver periode skal kreve en prioritering.
          </li>
          <li>
            Verdenshendelsene i periodebriefene:{" "}
            <a href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en">
              EUs karbontoll (CBAM)
            </a>
            ,{" "}
            <a href="https://www.consilium.europa.eu/en/policies/fit-for-55/">
              Fit for 55
            </a>
            ,{" "}
            <a href="https://www.regjeringen.no/no/tema/energi/landingssider/havvind/">
              havvindutbyggingen
            </a>{" "}
            og{" "}
            <a href="https://www.iea.org/reports/net-zero-by-2050">
              IEAs Net Zero-scenario
            </a>
            .
          </li>
        </ul>
        Alle kronetall er forenklede anslag i dagens priser, ment for å vise
        størrelsesorden. Alle tallene per felt ligger i{" "}
        <Link to="/data">dataoversikten</Link>.
        {/* The constants below are imported from the calculation modules, so
          this text can never drift away from what the code actually does */}
        <details className="calculation-note">
          <summary>Slik er tallene regnet ut (vis utregningene)</summary>
          <ul>
            <li>
              <strong>Energi i TWh:</strong> produksjon (mill. Sm³ o.e.) ×{" "}
              {TWH_PER_MILL_SM3_OE}. Én Sm³ oljeekvivalent inneholder ≈ 10 MWh
              kjemisk energi. Kryssjekk via fat: 1 Sm³ ={" "}
              {oilEquivalentToBarrel.toLocaleString("nb-NO")} fat à ≈ 1,7 MWh ≈
              10,7 MWh. Norsk sokkel på ~246 mill. Sm³ o.e. i året gir da ~2 460
              TWh.
            </li>
            <li>
              <strong>Fornybar erstatning:</strong> utfaset TWh × den valgte
              nytteenergifaktoren (
              {usefulEnergyScenarios
                .map((scenario) => scenario.factor.toLocaleString("nb-NO"))
                .join(" / ")}
              , standard{" "}
              {DEFAULT_USEFUL_ENERGY_SCENARIO.factor.toLocaleString("nb-NO")}).
              Strøm brukes nesten uten tap, mens fossil energi taper mye i
              motorer og lite i kjeler – derfor spenner faktoren så vidt.
            </li>
            <li>
              <strong>Havvindturbiner:</strong> erstatnings-TWh ÷{" "}
              {TWH_PER_TURBINE_YEAR.toLocaleString("nb-NO")}. En moderne 15
              MW-turbin med ~45 % kapasitetsfaktor produserer ≈ 60 GWh i året.
            </li>
            <li>
              <strong>Husholdninger:</strong> erstatnings-TWh ×{" "}
              {HOUSEHOLDS_PER_TWH.toLocaleString("nb-NO")} husholdninger per TWh
              (≈ 15 000 kWh per husholdning per år; SSB-snittet for 2024 er 14
              700 – europeiske husholdninger bruker mindre, så antallet er i
              underkant).
            </li>
            <li>
              <strong>Utslippsintensitet (kg CO₂ per fat):</strong> årsutslipp i
              kg ÷ (årsproduksjon ×{" "}
              {oilEquivalentToBarrel.toLocaleString("nb-NO")} fat per Sm³). I
              feltvelgeren er intensiteten et snitt over 2025–2040, så gamle
              felt med fallende produksjon får høyere tall enn dagens
              øyeblikksbilde.
            </li>
            <li>
              <strong>Tapte statsinntekter:</strong> statens netto kontantstrøm
              ({STATE_NET_CASH_FLOW_BN_NOK} mrd kr) × andelen av produksjonen
              planen fjerner det året (utover naturlig nedgang), summert
              2025–2040. Antall statsbudsjett = summen ÷{" "}
              {STATE_BUDGET_BN_NOK.toLocaleString("nb-NO")} mrd. Per innbygger =
              årstapet ÷ {POPULATION_MILLIONS.toLocaleString("nb-NO")}{" "}
              millioner.
            </li>
            <li>
              <strong>Bensinbiler:</strong> unngåtte tonn CO₂ ÷ 2 (en
              gjennomsnittlig bensinbil slipper ut ≈ 2 tonn i året: ~12 000 km ×
              ~0,16 kg/km). Flyreiser: ÷ 1 tonn per tur/retur Oslo–New York. År
              med Norges utslipp: ÷ 44,6 millioner tonn (SSB, 2024).
            </li>
          </ul>
        </details>
      </details>
    </div>
  );
}
