import React from "react";
import { energyData } from "../../generated/energyData";

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
    </div>
  );
}
