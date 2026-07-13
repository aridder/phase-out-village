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
  /** Background when the current route matches `to` */
  activeColor?: string;
  /** Background otherwise */
  defaultColor?: string;
  /** Badge number shown in the top-right corner */
  count?: number;
}

/**
 * A main navigation/action button: icon + label, with an optional count
 * badge.
 *
 * All sizing and responsive behavior lives in CSS (.main-button in
 * application.css): the label/labelSmall swap and the icon size are pure
 * media queries, so this component needs no resize listeners. The only
 * inline style is the background color, because it is data (active state
 * and per-button color), not layout.
 */
export const MainButton: React.FC<MainButtonProps> = ({
  icon,
  label,
  labelSmall,
  to,
  onClick,
  title = label,
  disabled = false,
  activeColor = "cyan",
  defaultColor = "#e0ffb2",
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

  return (
    <button
      onClick={handleClick}
      title={title}
      className="main-button"
      style={{ backgroundColor: isActive ? activeColor : defaultColor }}
      disabled={disabled}
    >
      <span className="icon" aria-hidden="true">
        {icon}
      </span>
      <span className="label-large">{label}</span>
      <span className="label-small">{labelSmall ?? label}</span>
      {typeof count === "number" && (
        <span className="count">{count > 99 ? "99+" : count}</span>
      )}
    </button>
  );
};
