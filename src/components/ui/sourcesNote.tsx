import React from "react";
import { energyData } from "../../generated/energyData";
import {
  HOUSEHOLDS_PER_TWH,
  TWH_PER_MILL_SM3_OE,
  TWH_PER_TURBINE_YEAR,
  USEFUL_ENERGY_FACTOR,
} from "../../data/energyTransition";
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
      <strong>Kilder for tallene:</strong>
      <ul>
        <li>
          Produksjon og utslipp per felt (grunnlaget for TWh- og CO₂-tallene):{" "}
          <a href="https://www.norskpetroleum.no/">Norsk Petroleum</a> og
          Offshore Norge, fra originalspillets datasett. Omregning: 1 mill. Sm³
          o.e. ≈ 10 TWh.
        </li>
        <li>
          Kraftbalansen (produksjon {energyData.electricity.productionTwh} TWh,
          forbruk {energyData.electricity.consumptionTwh} TWh, eksport/import,
          vindkraft, kraft til oljeutvinning):{" "}
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
          Statens netto kontantstrøm fra petroleum (~661 mrd kr, 2024):{" "}
          <a href="https://www.norskpetroleum.no/okonomi/statens-inntekter/">
            Norsk Petroleum
          </a>
          . Tapte inntekter er skalert med planens andel av produksjonen, til
          dagens priser.
        </li>
        <li>
          Statsbudsjettets utgifter (~2 900 mrd kr) og fondsuttaket (~460 mrd
          kr):{" "}
          <a href="https://www.regjeringen.no/no/statsbudsjett/">
            statsbudsjettet 2025
          </a>
          . Oljefondets verdi (~20 000 mrd kr):{" "}
          <a href="https://www.nbim.no/">Norges Bank Investment Management</a>.
        </li>
        <li>
          Vannmagasinenes kapasitet (~87 TWh, om lag halvparten av Europas):{" "}
          <a href="https://www.nve.no/energi/energisystem/vannkraft/">NVE</a>.
          Sjømateksport (~175 mrd kr, 2024):{" "}
          <a href="https://seafood.no/">Norges sjømatråd</a>.
        </li>
        <li>
          Nytteenergi: ~35 % av fossil energi blir nyttig arbeid (
          <a href="https://www.iea.org/">IEA</a>-anslag 30–40 %). En 15 MW
          havvindturbin ≈ 60 GWh/år; en husholdning ≈ 20 000 kWh/år; en
          bensinbil ≈ 2 tonn CO₂/år.
        </li>
        <li>
          Verdenshendelsene i perioderapportene:{" "}
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
      størrelsesorden.
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
            10,7 MWh. Norsk sokkel på ~240 mill. Sm³ o.e. i året gir da ~2 400
            TWh – det vanlig siterte tallet.
          </li>
          <li>
            <strong>Fornybar erstatning:</strong> utfaset TWh ×{" "}
            {USEFUL_ENERGY_FACTOR.toLocaleString("nb-NO")}. Bare rundt en
            tredjedel av energien i olje og gass blir nyttig arbeid når den
            brennes – strøm brukes nesten uten tap, så nytten kan erstattes av
            en tilsvarende mindre strømmengde.
          </li>
          <li>
            <strong>Havvindturbiner:</strong> erstatnings-TWh ÷{" "}
            {TWH_PER_TURBINE_YEAR.toLocaleString("nb-NO")}. En moderne 15
            MW-turbin med ~45 % kapasitetsfaktor produserer ≈ 60 GWh i året.
          </li>
          <li>
            <strong>Husholdninger:</strong> erstatnings-TWh ×{" "}
            {HOUSEHOLDS_PER_TWH.toLocaleString("nb-NO")}. Regnet med ≈ 20 000
            kWh per husholdning per år (NVE-anslag for en gjennomsnittlig norsk
            husholdning – europeiske husholdninger bruker mindre, så antallet er
            i underkant).
          </li>
          <li>
            <strong>Utslippsintensitet (kg CO₂ per fat):</strong> årsutslipp i
            kg ÷ (årsproduksjon ×{" "}
            {oilEquivalentToBarrel.toLocaleString("nb-NO")} fat per Sm³). I
            feltvelgeren er intensiteten et snitt over 2025–2040, så gamle felt
            med fallende produksjon får høyere tall enn dagens øyeblikksbilde.
          </li>
          <li>
            <strong>Tapte statsinntekter:</strong> statens netto kontantstrøm (
            {STATE_NET_CASH_FLOW_BN_NOK} mrd kr) × andelen av produksjonen
            planen fjerner det året (utover naturlig nedgang), summert
            2025–2040. Antall statsbudsjett = summen ÷{" "}
            {STATE_BUDGET_BN_NOK.toLocaleString("nb-NO")} mrd. Per innbygger =
            årstapet ÷ {POPULATION_MILLIONS.toLocaleString("nb-NO")} millioner.
          </li>
          <li>
            <strong>Bensinbiler:</strong> unngåtte tonn CO₂ ÷ 2 (en
            gjennomsnittlig bensinbil slipper ut ≈ 2 tonn i året). Flyreiser: ÷
            1 tonn per tur/retur Oslo–New York. År med Norges utslipp: ÷ 47
            millioner tonn.
          </li>
        </ul>
      </details>
    </div>
  );
}
