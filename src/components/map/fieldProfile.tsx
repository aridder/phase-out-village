import { Icon } from "../ui/icons";
import React, { useEffect, useRef } from "react";
import { OilfieldName } from "../../data/gameData";
import { fieldGeometry } from "../../generated/fieldGeometry";
import { usePrefersDarkMode } from "../../hooks/usePrefersDarkMode";
import { CombinedProductionForFieldChart } from "../production/combinedProductionForFieldChart";
import { EmissionsForFieldChart } from "../emissions/emissionsForFieldChart";
import { FieldMapDatum, fieldColor, intensityClassFor } from "./fieldScales";
import { shelfToday } from "../../data/norwayToday";

/**
 * One field, in the terms the game is played in: what it produces, what
 * that costs in CO₂ per barrel, how it compares to the shelf average, and
 * when it runs out on its own.
 *
 * The last of those is the number the old detail view never showed, and it
 * is the one that decides whether closing the field changes anything.
 */
export function FieldProfile({
  datum,
  onClose,
}: {
  datum: FieldMapDatum;
  onClose: () => void;
}) {
  const dark = usePrefersDarkMode();
  const geometry = fieldGeometry[datum.field];
  const shelf = shelfToday();
  const today = shelf.fields.find((f) => f.field === datum.field);
  const intensityClass = intensityClassFor(datum.intensity);
  /**
   * Ratio to the shelf average, NOT rounded until it is displayed.
   * Rounding first and inverting afterwards turned Johan Sverdrup's
   * 0,16 / 6,55 = 0,024 into 0,0 and printed "∞ ganger lavere" on the
   * single biggest field on the shelf.
   */
  const versusAverage =
    shelf.averageIntensity > 0 ? datum.intensity / shelf.averageIntensity : 0;
  const round1 = (value: number) =>
    (Math.round(value * 10) / 10).toLocaleString("nb-NO");

  // Move focus into the panel when a field is opened, so a keyboard user
  // lands on the content they just asked for instead of at the page top
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => headingRef.current?.focus(), [datum.field]);

  return (
    <div className="field-profile">
      <div className="profile-head">
        <span
          className="profile-swatch"
          style={{
            backgroundColor: fieldColor(
              datum.intensity,
              datum.hasEmissionData,
              datum.state,
              dark,
            ),
          }}
          aria-hidden="true"
        />
        <h3 ref={headingRef} tabIndex={-1}>
          {datum.field}
        </h3>
        <button type="button" onClick={onClose} aria-label="Lukk feltvisning">
          <Icon name="lukk" size={16} />
        </button>
      </div>

      {geometry && (
        <div className="profile-meta">
          {geometry.sea} · funnet {geometry.discovered} · {geometry.produces} ·{" "}
          {geometry.operator}
        </div>
      )}

      <div className="profile-figures">
        <div>
          <div className="value">
            {datum.production.toLocaleString("nb-NO", {
              maximumFractionDigits: 1,
            })}
          </div>
          <div className="label">mill. Sm³ o.e. i år</div>
        </div>
        <div>
          <div className="value">
            {datum.hasEmissionData
              ? Math.round(datum.emission / 1000).toLocaleString("nb-NO")
              : "—"}
          </div>
          <div className="label">kt CO₂ i år</div>
        </div>
        <div>
          <div className="value">
            {datum.hasEmissionData
              ? datum.intensity.toLocaleString("nb-NO", {
                  maximumFractionDigits: 1,
                })
              : "—"}
          </div>
          <div className="label">kg CO₂ per fat</div>
        </div>
        {today && (
          <div>
            <div className="value">
              {today.stateRevenueBnNok.toLocaleString("nb-NO")}
            </div>
            <div className="label">mrd kr til staten i året</div>
          </div>
        )}
      </div>

      {datum.hasEmissionData ? (
        <div className="profile-verdict">
          {intensityClass.label} utslipp per fat –{" "}
          <strong>
            {versusAverage > 0 && versusAverage < 1
              ? `${round1(1 / versusAverage)} ganger lavere`
              : `${round1(versusAverage)} ganger høyere`}
          </strong>{" "}
          enn snittet på sokkelen (
          {shelf.averageIntensity.toLocaleString("nb-NO")} kg/fat).
        </div>
      ) : (
        <div className="profile-verdict">
          Feltet rapporterer ingen utslipp fra sokkelen. Brønnstrømmen går rett
          til et anlegg på land, så utslippene fra prosesseringen føres i
          fastlandsregnskapet i stedet. Det er ikke det samme som null utslipp.
        </div>
      )}

      {today?.lastProductionYear && (
        <div className="profile-tail">
          Uten vedtak produserer feltet ut{" "}
          <strong>{today.lastProductionYear}</strong>
          {today.remainingIn2040 > 0.02 && (
            <>
              {" "}
              – i 2040 er det nede i{" "}
              <strong>{Math.round(today.remainingIn2040 * 100)} %</strong> av
              dagens nivå
            </>
          )}
          .
        </div>
      )}

      {datum.state === "scheduled" && (
        <div className="profile-status scheduled">
          Valgt for avvikling i denne perioden. Vedtaket gjelder fra{" "}
          <strong>{datum.endYear}</strong>.
        </div>
      )}
      {datum.state === "retired" && (
        <div className="profile-status retired">
          Avviklet i <strong>{datum.endYear}</strong>. Tallene over er fra siste
          driftsår.
        </div>
      )}

      <div className="profile-charts">
        <CombinedProductionForFieldChart field={datum.field as OilfieldName} />
        <EmissionsForFieldChart field={datum.field as OilfieldName} />
      </div>
    </div>
  );
}
