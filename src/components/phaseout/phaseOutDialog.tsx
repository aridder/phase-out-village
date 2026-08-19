import { Icon } from "../ui/icons";
import React, { FormEvent, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { fromEntries } from "../../data/fromEntries";
import { gameData, OilfieldName } from "../../data/gameData";
import { periodForRound } from "../../data/periods";
import { availableFields, FieldOutlook } from "../../analysis/periodAnalysis";
import { intensityClassFor } from "../map/fieldScales";
import { usePrefersDarkMode } from "../../hooks/usePrefersDarkMode";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";
import "./phaseOut.css";

/** How the field list can be ordered. */
type SortKey =
  | "lens"
  | "alphabetical"
  | "totalProduction"
  | "emission"
  | "emissionIntensity";

/**
 * The field selector for one period.
 *
 * Two things make this different from the old version, which showed the
 * same list with the same columns and the same sort in all four periods:
 *
 *   - The period's LENS gets its own column and its own default sort. In
 *     period 1 that is emissions per barrel, in period 2 the kroner the
 *     field carries, in period 3 how many years it would have run anyway,
 *     in period 4 how much of it is still going in 2040.
 *   - Capacity is finite. You cannot close everything at once, so the list
 *     is a ranking problem rather than a checklist.
 *
 * The old "select MDG's fields" button is gone. Handing the player a
 * party's answer key in the middle of their own decision was the single
 * loudest signal that the game wanted one particular answer.
 */
export function PhaseOutDialog({ from }: { from: string }) {
  const {
    year,
    commitDraft,
    phaseOut,
    phaseOutDraft,
    setPhaseOutDraft,
    getCurrentRound,
  } = useContext(ApplicationContext);

  const navigate = useNavigate();
  const isSmall = useIsSmallScreen();
  const dark = usePrefersDarkMode();

  const period = periodForRound(getCurrentRound());
  const draft = phaseOutDraft;
  const draftCount = Object.keys(draft).length;
  const remaining = period.capacity - draftCount;
  const atCapacity = remaining <= 0;

  const [sortKey, setSortKey] = useState<SortKey>("lens");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => availableFields(phaseOut, period),
    [phaseOut, period],
  );

  const sorted = useMemo(() => {
    const matching = query
      ? rows.filter((r) =>
          r.field.toLowerCase().includes(query.toLowerCase().trim()),
        )
      : rows;
    return [...matching].sort((a, b) => {
      switch (sortKey) {
        case "alphabetical":
          return a.field.localeCompare(b.field, "nb");
        case "totalProduction":
          return b.forgoneProduction - a.forgoneProduction;
        case "emission":
          return b.avoidedEmission - a.avoidedEmission;
        case "emissionIntensity":
          return b.intensity - a.intensity;
        default:
          return byLens(a, b);
      }
    });
  }, [rows, sortKey, query, period]);

  /** The ordering the period's own question implies. */
  function byLens(a: FieldOutlook, b: FieldOutlook): number {
    switch (period.lens) {
      case "economy":
        return (
          b.avoidedEmission / Math.max(b.forgoneRevenueBnNok, 0.001) -
          a.avoidedEmission / Math.max(a.forgoneRevenueBnNok, 0.001)
        );
      case "additionality":
        return b.yearsRemaining - a.yearsRemaining;
      case "legacy":
        return b.avoidedEmission - a.avoidedEmission;
      default:
        return b.intensity - a.intensity;
    }
  }

  function toggle(field: OilfieldName, checked: boolean) {
    setPhaseOutDraft((current) => {
      if (!checked) {
        return fromEntries(
          Object.entries(current).filter(([name]) => name !== field),
        );
      }
      if (Object.keys(current).length >= period.capacity) return current;
      // The PERIOD's first year, not the app clock. The clock runs
      // 2025 → 2028 → 2032 → 2036 while the periods start 2025/2029/2033/
      // 2037, so storing the clock dated every decision one year before the
      // period it is named after and scored in — the report then measured
      // from 2029 a closure the schedule said happened in 2028, and
      // understated its own result by up to 21 %.
      return { ...current, [field]: period.fromYear };
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    commitDraft();
  }

  const totals = useMemo(() => {
    const chosen = rows.filter((r) => draft[r.field]);
    return {
      emissionMt: chosen.reduce((s, r) => s + r.avoidedEmission, 0) / 1_000_000,
      production: chosen.reduce((s, r) => s + r.forgoneProduction, 0),
      revenue: chosen.reduce((s, r) => s + r.forgoneRevenueBnNok, 0),
    };
  }, [rows, draft]);

  return (
    <form
      className="phaseout-page"
      onSubmit={handleSubmit}
      style={{ ["--period-accent" as string]: period.accent }}
    >
      <header className="phaseout-header">
        <div>
          <div className="phaseout-kicker">
            {period.label} · {period.name}
          </div>
          <h1>Velg felt som skal få sluttdato</h1>
        </div>
        <button
          type="button"
          className="phaseout-close"
          onClick={() => navigate(from)}
          aria-label="Lukk feltvelgeren"
        >
          <Icon name="lukk" size={16} />
        </button>
      </header>

      {/* Kapasiteten er periodens viktigste regel og står derfor øverst,
          ikke som en feilmelding når man treffer taket */}
      <div className={`capacity-bar ${atCapacity ? "full" : ""}`}>
        <div className="capacity-slots" aria-hidden="true">
          {Array.from({ length: Math.min(period.capacity, 12) }, (_, i) => (
            <span key={i} className={i < draftCount ? "slot used" : "slot"} />
          ))}
          {period.capacity > 12 && (
            <span className="capacity-more">+{period.capacity - 12}</span>
          )}
        </div>
        <div className="capacity-text">
          <strong>
            {draftCount} av {period.capacity}
          </strong>{" "}
          plasser brukt.{" "}
          {atCapacity
            ? "Kapasiteten er full – fjern et felt for å bytte."
            : period.capacityReason}
        </div>
      </div>

      <div className="lens-note">
        <strong>{period.lensLabel}:</strong> {period.lensExplainer}
      </div>

      <div className="phaseout-toolbar">
        <input
          type="search"
          className="phaseout-search"
          placeholder="Finn felt …"
          aria-label="Søk etter felt"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="phaseout-sort">
          Sorter:{" "}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="lens">{period.lensLabel} (periodens mål)</option>
            <option value="emission">Størst kutt fram mot 2040</option>
            <option value="emissionIntensity">Mest utslipp per fat</option>
            <option value="totalProduction">Størst produksjon</option>
            <option value="alphabetical">Alfabetisk</option>
          </select>
        </label>
      </div>

      <ul className="phaseout-list">
        {sorted.map((row) => {
          const checked = !!draft[row.field];
          const blocked = !checked && atCapacity;
          return (
            <li key={row.field}>
              <label
                className={`field-card ${checked ? "chosen" : ""} ${blocked ? "blocked" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={blocked}
                  onChange={(e) => toggle(row.field, e.target.checked)}
                />
                <div className="card-body">
                  <div className="card-title">
                    <span className="card-name">{row.field}</span>
                    <LensValue row={row} period={period} dark={dark} />
                  </div>
                  <div className="card-stats">
                    <span title="Produksjon i året">
                      {(
                        gameData.data[row.field]?.[year]?.totalProduction
                          ?.value ?? 0
                      ).toLocaleString("nb-NO", {
                        maximumFractionDigits: 1,
                      })}{" "}
                      mill. Sm³/år
                    </span>
                    <span title="Samlet kutt fram mot 2040 hvis feltet stenges nå">
                      {(row.avoidedEmission / 1_000_000).toLocaleString(
                        "nb-NO",
                        { maximumFractionDigits: 1 },
                      )}{" "}
                      mill. t CO₂ spart
                    </span>
                    <span title="Statsinntekter feltet bærer fram mot 2040">
                      {row.forgoneRevenueBnNok.toLocaleString("nb-NO", {
                        maximumFractionDigits: 0,
                      })}{" "}
                      mrd kr
                    </span>
                  </div>
                </div>
              </label>
            </li>
          );
        })}
        {sorted.length === 0 && (
          <li className="phaseout-empty">
            {rows.length === 0
              ? "Alle felt har allerede fått en sluttdato."
              : `Ingen felt matcher «${query}».`}
          </li>
        )}
      </ul>

      <div className="phaseout-actions">
        <div className="selection-impact">
          {draftCount > 0 ? (
            <>
              Valget kutter{" "}
              <strong>
                {totals.emissionMt.toLocaleString("nb-NO", {
                  maximumFractionDigits: 1,
                })}{" "}
                mill. tonn CO₂
              </strong>{" "}
              fram mot 2040, og koster staten omtrent{" "}
              <strong>
                {totals.revenue.toLocaleString("nb-NO", {
                  maximumFractionDigits: 0,
                })}{" "}
                mrd kr
              </strong>{" "}
              i samme periode.
            </>
          ) : (
            <span className="impact-hint">
              Huk av felt for å se hva valget kutter og hva det koster.
            </span>
          )}
        </div>
        <div className="button-row">
          <button
            type="button"
            onClick={() => setPhaseOutDraft({})}
            disabled={draftCount === 0}
          >
            Tøm
          </button>
          <button
            type="submit"
            className={draftCount === 0 ? "skip" : "primary"}
          >
            {draftCount === 0
              ? "Hopp over perioden"
              : `Vedta sluttdato for ${draftCount} felt`}
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * The one figure this period asks the player to weigh, rendered as the
 * card's headline number so it cannot be missed.
 */
function LensValue({
  row,
  period,
  dark,
}: {
  row: FieldOutlook;
  period: ReturnType<typeof periodForRound>;
  dark: boolean;
}) {
  switch (period.lens) {
    case "economy":
      return (
        <span className="lens-value">
          {row.forgoneRevenueBnNok.toLocaleString("nb-NO", {
            maximumFractionDigits: 0,
          })}{" "}
          <small>mrd kr</small>
        </span>
      );
    case "additionality":
      return (
        <span className="lens-value">
          {row.yearsRemaining} <small>år igjen</small>
        </span>
      );
    case "legacy":
      return (
        <span className="lens-value">
          {(row.avoidedEmission / 1_000_000).toLocaleString("nb-NO", {
            maximumFractionDigits: 1,
          })}{" "}
          <small>mill. t igjen</small>
        </span>
      );
    default: {
      if (!row.hasEmissionData) {
        return (
          <span
            className="lens-value no-data"
            title="Feltet rapporterer ingen utslipp fra sokkelen dette året"
          >
            — <small>ingen tall</small>
          </span>
        );
      }
      const cls = intensityClassFor(row.intensity);
      return (
        <span
          className="lens-value intensity"
          style={{ ["--chip" as string]: dark ? cls.dark : cls.light }}
          title={`${cls.label} utslipp per fat`}
        >
          {row.intensity.toLocaleString("nb-NO", {
            maximumFractionDigits: 1,
          })}{" "}
          <small>kg/fat</small>
        </span>
      );
    }
  }
}
