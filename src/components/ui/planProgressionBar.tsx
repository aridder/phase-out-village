import React from "react";
import "./progressionBar.css";

type RightLabelType = "baseline" | "prevented";

interface PlanProgressionBarProps {
  current: number; // Current value (e.g. current emissions or production)
  baseline: number; // Baseline value representing 100%
  endColor: string; // Ending color at 0% (e.g. green or blue)
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
  mode: "emission" | "production";
  includeDecimal?: boolean;
  metricLabel?: string;
  barColor?: string; // The static color of the filled bar
  showMiddlePercentage?: boolean;
  rightLabelType?: RightLabelType;
}

/**
 * PlanProgressionBar
 *
 * Displays a horizontal progress bar where:
 * - 100% = baseline
 * - the filled width, the fade of the middle label and the remainder
 *   overlay are data and set inline; everything static lives in
 *   progressionBar.css
 */
export const PlanProgressionBar: React.FC<PlanProgressionBarProps> = ({
  current,
  baseline,
  endColor,
  size = "small",
  showLabel = true,
  mode,
  includeDecimal = false,
  barColor = "#000",
  showMiddlePercentage = false,
  rightLabelType = "baseline",
}) => {
  const progress = Math.min(current / baseline, 1); // clamp between 0–1

  const unit = mode == "emission" ? 1_000_000 : 1_000;
  const currentRounded = Math.round(current / unit);
  const currentRoundedWithDecimal = Math.round((current / unit) * 10) / 10;
  const reductionPercent = Math.round(((current - baseline) / baseline) * 100);

  const rightLabelBase =
    rightLabelType == "baseline" ? baseline : baseline - current;
  const rightLabelValueRounded = Math.round(rightLabelBase / unit);
  const rightLabelValueRoundedWithDecimal =
    Math.round((rightLabelBase / unit) * 10) / 10;

  // Opacity increases as progress decreases (so more color shows as we reduce)
  const opacity = 1 - progress;

  // The middle label fades in between 10–20% progress and out between 80–90%
  let labelOpacity = 1;
  const percent = progress * 100;
  if (percent < 10) {
    labelOpacity = 0;
  } else if (percent < 20) {
    labelOpacity = (percent - 10) / 10;
  } else if (percent > 90) {
    labelOpacity = 0;
  } else if (percent > 80) {
    labelOpacity = 1 - (percent - 80) / 10;
  }
  labelOpacity = Math.max(0, Math.min(labelOpacity, 1));

  return (
    <div className={`progression-bar size-${size}`}>
      {/* Filled portion */}
      <div
        className="fill"
        style={{ width: `${progress * 100}%`, backgroundColor: barColor }}
      />

      {/* Current value, pinned left */}
      {showLabel && (
        <div className="bar-label">
          {progress * 100 >= 100
            ? ""
            : (includeDecimal
                ? currentRoundedWithDecimal
                : currentRounded
              ).toLocaleString("nb-NO")}
        </div>
      )}

      {/* Reduction percent, riding the fill edge (not worth the space on
          mobile) */}
      {showLabel && showMiddlePercentage && (
        <div
          className="bar-label middle"
          style={{
            left: `min(${progress * 100}%, calc(100% - 7rem))`,
            opacity: labelOpacity,
          }}
        >
          {progress * 100 >= 100 ? "" : `−${Math.abs(reductionPercent)} %`}
        </div>
      )}

      {/* Baseline or prevented amount, pinned right */}
      {showLabel && (
        <div
          className="bar-label right"
          style={{
            color: progress * 100 >= 100 ? "white" : "#ffffff88",
          }}
        >
          {(includeDecimal
            ? rightLabelValueRoundedWithDecimal
            : rightLabelValueRounded
          ).toLocaleString("nb-NO")}
        </div>
      )}

      {/* Unfilled colored overlay (only the remaining part) */}
      <div
        className="remainder"
        style={{
          left: `${progress * 100}%`,
          backgroundColor: endColor,
          opacity,
        }}
      />
    </div>
  );
};
