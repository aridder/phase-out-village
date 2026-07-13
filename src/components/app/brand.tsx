import React, { useState } from "react";
import { Link } from "react-router-dom";

/**
 * The shared brand mark: MDG logo (external campaign link) and the
 * "Oljespillet" word mark linking home.
 *
 * The logo is hotlinked from MDG's CDN; if it fails to load (offline,
 * conference wifi, blocked CDN) the logo and divider hide themselves so the
 * header never shows a broken-image icon.
 *
 * Responsiveness is pure CSS (.brand in application.css): the logo drops
 * away on tablets, the whole mark on phones — the page content carries its
 * own heading there.
 */
export function Brand() {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className="brand">
      {!logoFailed && (
        <>
          <a
            className="brand-logo"
            href="https://mdg.no/politikk/utfasing"
            target="_blank"
          >
            <img
              src={
                "https://d1nizz91i54auc.cloudfront.net/_service/505811/display/img_version/8880781/t/1750686348/img_name/68683_505811_ba2eeb201a.png.webp"
              }
              alt={"MDG - det ER mulig"}
              onError={() => setLogoFailed(true)}
            />
          </a>
          <div className="brand-divider"></div>
        </>
      )}
      <div>
        <Link to="/">Oljespillet</Link>
      </div>
    </div>
  );
}
