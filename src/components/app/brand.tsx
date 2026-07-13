import React from "react";
import { Link } from "react-router-dom";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";

/**
 * The shared brand mark: MDG logo (external campaign link) and the
 * "Oljespillet" word mark linking home. Hidden on small screens, where the
 * page content carries its own heading.
 */
export function Brand() {
  const isSmall = useIsSmallScreen();
  if (isSmall) return null;
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <a
        className="brand-logo"
        href="https://mdg.no/politikk/utfasing"
        target="_blank"
      >
        <img
          style={{ maxWidth: "196px" }}
          src={
            "https://d1nizz91i54auc.cloudfront.net/_service/505811/display/img_version/8880781/t/1750686348/img_name/68683_505811_ba2eeb201a.png.webp"
          }
          alt={"MDG - det ER mulig"}
        />
      </a>
      <div
        className="brand-divider"
        style={{
          height: "50%",
          width: "1px",
          backgroundColor: "white",
          marginRight: "1.5rem",
        }}
      ></div>
      <div>
        <Link to="/">Oljespillet</Link>
      </div>
    </div>
  );
}
