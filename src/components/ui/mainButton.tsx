import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface MainButtonProps {
  /** The icon element, e.g. <FaMap /> */
  icon: React.ReactNode;
  /** The text label */
  label: string;
  /** Shorter label used on mobile; falls back to label */
  labelSmall?: string;
  /** Navigate here when clicked */
  to?: string;
  /** Custom click handler (used instead of navigation) */
  onClick?: () => void;
  /** Tooltip text; falls back to label */
  title?: string;
  disabled?: boolean;
  /** Highlight as the primary action (--eple background) */
  primary?: boolean;
  /** Badge number shown in the top-right corner */
  count?: number;
}

/**
 * A main navigation/action button: icon + label, with an optional count
 * badge.
 *
 * All styling lives in CSS (.main-button in application.css): sizing and
 * the label/labelSmall swap are pure media queries, the colors are the
 * .primary and .active modifiers. The component only decides WHICH
 * modifiers apply.
 */
export const MainButton: React.FC<MainButtonProps> = ({
  icon,
  label,
  labelSmall,
  to,
  onClick,
  title = label,
  disabled = false,
  primary = false,
  count,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = to && location.pathname.includes(to);

  const handleClick = () => {
    if (disabled) return;
    if (onClick) onClick();
    else if (to) navigate(to, { state: { from: location } });
  };

  const className = ["main-button", primary && "primary", isActive && "active"]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      onClick={handleClick}
      title={title}
      className={className}
      disabled={disabled}
    >
      <span className="icon" aria-hidden="true">
        {icon}
      </span>
      <span className="label-large">{label}</span>
      {/* Skjules for skjermlesere: uten dette blir tilgjengelig navn
          «Velg felter for 2025–2028Velg» (begge etikettene i DOM) */}
      <span className="label-small" aria-hidden="true">
        {labelSmall ?? label}
      </span>
      {typeof count === "number" && (
        <span className="count">{count > 99 ? "99+" : count}</span>
      )}
    </button>
  );
};
