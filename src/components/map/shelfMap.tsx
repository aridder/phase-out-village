import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Feature, Map, MapBrowserEvent, View } from "ol";
import { Point } from "ol/geom";
import { LineString } from "ol/geom";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import TileLayer from "ol/layer/Tile";
import { StadiaMaps } from "ol/source";
import { GeoJSON } from "ol/format";
import { defaults as defaultInteractions } from "ol/interaction";
import { defaults as defaultControls } from "ol/control";
import { useGeographic } from "ol/proj";
import "ol/ol.css";

import { OilfieldName } from "../../data/gameData";
import { fieldGeometry } from "../../generated/fieldGeometry";
import { usePrefersDarkMode } from "../../hooks/usePrefersDarkMode";
import {
  bubbleRadius,
  FieldMapDatum,
  fieldColor,
  positionFor,
  RING_COLOR,
  SELECTED_COLOR,
} from "./fieldScales";

/**
 * Stadia Maps key for the background tiles.
 *
 * A key used by a browser can never be a secret — it goes out with every
 * tile request, so anyone with devtools can read it. Stadia's own model is
 * to restrict a key to the domains that may use it, which is a setting in
 * their dashboard rather than anything we can do in code. That restriction,
 * not secrecy, is what stops the key being used elsewhere.
 *
 * What the env var buys is rotation: a fork, or MDG on their own domain,
 * can set VITE_STADIA_API_KEY at build time instead of editing this file
 * and carrying a diff forever. The fallback is the key the project has been
 * using since its first commit.
 */
const STADIA_API_KEY =
  import.meta.env.VITE_STADIA_API_KEY || "5a2e5035-ad83-4002-a6e6-5f679b73240f";

useGeographic();

/**
 * The shelf map.
 *
 * The old map drew each field's true licence polygon on an OpenStreetMap
 * background. At the zoom where you can see all of Norway that makes half
 * the fields 1–3 pixels wide, so what you actually saw was 1.5 px of red
 * outline — and the size on screen encoded licence area, which is not
 * something the game is about.
 *
 * This map encodes the two things the game IS about:
 *
 *   bubble area   → how much the field produces
 *   bubble colour → how much CO₂ each barrel of it costs to produce
 *
 * Three layers, in order: the real polygons as a quiet underlay that only
 * appears once you are zoomed in far enough for them to have a shape; the
 * bubbles, never decluttered so a bubble can never silently vanish; and
 * the labels, decluttered so they may.
 */
export function ShelfMap({
  data,
  selected,
  onSelect,
  hovered,
  onHover,
}: {
  data: FieldMapDatum[];
  selected?: OilfieldName;
  onSelect: (field: OilfieldName | undefined) => void;
  hovered?: OilfieldName;
  onHover: (field: OilfieldName | undefined) => void;
}) {
  const dark = usePrefersDarkMode();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [zoom, setZoom] = useState(5);

  // The style function reads these on every frame; refs keep it stable so
  // OpenLayers is not handed a new style function on every React render
  const stateRef = useRef({ data, selected, hovered, dark, zoom });
  stateRef.current = { data, selected, hovered, dark, zoom };

  const bubbleSource = useMemo(() => new VectorSource(), []);
  const leaderSource = useMemo(() => new VectorSource(), []);

  /** The polygon underlay — fetched after first paint, 74 kB instead of 3.4 MB. */
  const outlineSource = useMemo(
    () =>
      new VectorSource({
        url: `${import.meta.env.BASE_URL}geojson/fields-simplified.geojson`,
        format: new GeoJSON(),
      }),
    [],
  );

  /* ------------------------------------------------------------- features */

  // One bubble feature per field, created once and then restyled
  useEffect(() => {
    bubbleSource.clear();
    bubbleSource.addFeatures(
      Object.keys(fieldGeometry).map((field) => {
        const feature = new Feature({
          geometry: new Point(positionFor(field as OilfieldName, 5)),
        });
        feature.set("field", field);
        return feature;
      }),
    );
  }, [bubbleSource]);

  // Bubbles move as you zoom (spread → true position), so their geometry and
  // the leader lines back to the real centres are recomputed per zoom step
  useEffect(() => {
    for (const feature of bubbleSource.getFeatures()) {
      const field = feature.get("field") as OilfieldName;
      (feature.getGeometry() as Point).setCoordinates(positionFor(field, zoom));
    }
    leaderSource.clear();
    for (const field of Object.keys(fieldGeometry) as OilfieldName[]) {
      const drawn = positionFor(field, zoom);
      const { lon, lat } = fieldGeometry[field];
      const offset = Math.hypot(drawn[0] - lon, drawn[1] - lat);
      // Only draw the line when the bubble is visibly away from its field
      if (offset < 0.05) continue;
      leaderSource.addFeature(
        new Feature({ geometry: new LineString([drawn, [lon, lat]]) }),
      );
    }
  }, [zoom, bubbleSource, leaderSource]);

  /* --------------------------------------------------------------- styles */

  const bubbleStyle = useCallback((feature: any) => {
    const { data, selected, hovered, dark, zoom } = stateRef.current;
    const field = feature.get("field") as OilfieldName;
    const datum = data.find((d) => d.field === field);
    if (!datum) return undefined; // never produced in this dataset

    const theme = dark ? "dark" : "light";
    const isSelected = field === selected;
    const isHovered = field === hovered;
    const fullRadius = bubbleRadius(datum.production, zoom);
    // A retired field shrinks, leaving a ghost ring at its old size — the
    // accumulating record of what the plan has removed
    const radius = datum.state === "retired" ? fullRadius * 0.55 : fullRadius;

    const styles: Style[] = [];

    if (datum.state === "retired") {
      styles.push(
        new Style({
          image: new Circle({
            radius: fullRadius,
            fill: new Fill({ color: "rgba(0,0,0,0)" }),
            stroke: new Stroke({
              color: dark ? "rgba(231,243,209,0.35)" : "rgba(19,54,0,0.3)",
              width: 1,
              lineDash: [2, 3],
            }),
          }),
        }),
      );
    }

    styles.push(
      new Style({
        image: new Circle({
          radius: isSelected || isHovered ? radius * 1.15 : radius,
          fill: new Fill({
            color: fieldColor(
              datum.intensity,
              datum.hasEmissionData,
              datum.state,
              dark,
            ),
          }),
          stroke: new Stroke({
            color: isSelected
              ? SELECTED_COLOR[theme]
              : isHovered
                ? SELECTED_COLOR[theme]
                : RING_COLOR[theme],
            width: isSelected ? 3 : isHovered ? 2 : 1.25,
            // A dashed ring means "an end date is set, but it has not
            // arrived yet" — decided is not the same as done
            lineDash: datum.state === "scheduled" ? [4, 3] : undefined,
          }),
        }),
        // Small bubbles on top of big ones, so nothing is unclickable
        zIndex: Math.round(1000 - radius),
      }),
    );

    return styles;
  }, []);

  const labelStyle = useCallback((feature: any) => {
    const { data, selected, hovered, dark, zoom } = stateRef.current;
    const field = feature.get("field") as OilfieldName;
    const datum = data.find((d) => d.field === field);
    if (!datum) return undefined;

    const isFocus = field === selected || field === hovered;
    const rank = data.indexOf(datum);
    // Zoomed out, only the biggest fields are named — anything more is a
    // wall of text over a small sea. Zoomed in, everything gets a name.
    const show = isFocus || zoom >= 6.5 || rank < 6;
    if (!show) return undefined;

    const radius = bubbleRadius(datum.production, zoom);
    return new Style({
      text: new Text({
        text: field,
        font: `${isFocus ? "600 " : ""}${Math.round(Math.max(11, Math.min(15, 7 + zoom)))}px bureau-sans, helvetica, sans-serif`,
        offsetY: -(radius + 9),
        fill: new Fill({ color: dark ? "#e7f3d1" : "#12300a" }),
        stroke: new Stroke({
          color: dark ? "rgba(14,36,5,0.85)" : "rgba(255,255,255,0.9)",
          width: 3,
        }),
        // Must stay false: with overflow the label is drawn even when it
        // collides, which defeats the whole point of the declutter layer
        overflow: false,
        declutterMode: "obstacle",
      }),
      zIndex: isFocus ? 2000 : 1000,
    });
  }, []);

  /* ---------------------------------------------------------------- layers */

  const layers = useMemo(() => {
    const basemap = new TileLayer({
      source: new StadiaMaps({
        // One cartographic language in both themes — the old map paired a
        // full-colour OSM raster in light mode with a smooth dark one
        layer: dark ? "alidade_smooth_dark" : "alidade_smooth",
        apiKey: STADIA_API_KEY,
      }),
      opacity: dark ? 0.75 : 0.65,
    });

    const outlines = new VectorLayer({
      source: outlineSource,
      // The real licence areas only mean something once they have a shape
      minZoom: 6.5,
      style: () =>
        new Style({
          fill: new Fill({
            color: dark ? "rgba(231,243,209,0.10)" : "rgba(19,54,0,0.10)",
          }),
          stroke: new Stroke({
            color: dark ? "rgba(231,243,209,0.35)" : "rgba(19,54,0,0.3)",
            width: 1,
          }),
        }),
    });

    const leaders = new VectorLayer({
      source: leaderSource,
      style: () =>
        new Style({
          stroke: new Stroke({
            color: dark ? "rgba(231,243,209,0.4)" : "rgba(19,54,0,0.35)",
            width: 1,
          }),
        }),
    });

    const bubbles = new VectorLayer({
      source: bubbleSource,
      style: bubbleStyle,
      // Never declutter the bubbles: declutter DELETES colliding features,
      // and a field silently missing from the map is worse than a crowded map
      declutter: false,
    });

    const labels = new VectorLayer({
      source: bubbleSource,
      style: labelStyle,
      declutter: true,
    });

    return [basemap, outlines, leaders, bubbles, labels];
  }, [
    dark,
    outlineSource,
    leaderSource,
    bubbleSource,
    bubbleStyle,
    labelStyle,
  ]);

  /* ------------------------------------------------------------------- map */

  // The map instance is owned by this component, not by the module. The old
  // version created it at module scope, so it survived unmount, broke under
  // StrictMode's double render and leaked its view between routes.
  useEffect(() => {
    const map = new Map({
      target: containerRef.current!,
      view: new View({
        center: [12, 65],
        zoom: 4.4,
        minZoom: 3.5,
        maxZoom: 11,
        // Keep the player over the shelf — nobody meant to end up at Iceland
        extent: [-14, 50, 44, 78],
      }),
      controls: defaultControls({ rotate: false }),
      interactions: defaultInteractions({
        altShiftDragRotate: false,
        pinchRotate: false,
      }),
    });
    mapRef.current = map;
    setZoom(map.getView().getZoom() ?? 5);
    const onResolution = () => setZoom(map.getView().getZoom() ?? 5);
    map.getView().on("change:resolution", onResolution);

    // The mobile bottom sheet resizes the container without a window resize
    const observer = new ResizeObserver(() => map.updateSize());
    observer.observe(containerRef.current!);

    return () => {
      observer.disconnect();
      map.getView().un("change:resolution", onResolution);
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapRef.current?.setLayers(layers);
  }, [layers]);

  // Frame the whole shelf on arrival. A hardcoded centre and zoom cannot do
  // this: the right framing depends on the pane's aspect ratio, which the
  // side panel and the mobile layout both change.
  const framed = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || framed.current || selected) return;
    const extent = bubbleSource.getExtent();
    if (!isFinite(extent[0])) return;
    // Deferred by a frame: on first mount the pane has not been laid out
    // yet, so fitting immediately measures a zero-sized viewport and the
    // southern North Sea ends up off the bottom edge.
    // NB: framed is set INSIDE the callback. Setting it before meant that
    // under StrictMode the cleanup cancelled the frame while the ref stayed
    // true, so the re-run bailed out and the map never framed itself.
    const frame = requestAnimationFrame(() => {
      framed.current = true;
      map.updateSize();
      map.getView().fit(extent, {
        // Room for the bubbles themselves, which stick out past their
        // centres, and for the overlay in the top-left corner
        padding: [76, 44, 52, 44],
        maxZoom: 6,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [layers, bubbleSource, selected]);

  // Restyle when the data, selection or hover changes
  useEffect(() => {
    bubbleSource.changed();
  }, [data, selected, hovered, dark, zoom, bubbleSource]);

  /* ----------------------------------------------------------- interaction */

  /**
   * The nearest bubble to the pointer, not "the one feature exactly under
   * it". In the North Sea cluster an exact hit test returns two features or
   * none, which is why the old map so often did nothing when tapped.
   */
  const fieldAt = useCallback(
    (event: MapBrowserEvent<any>): OilfieldName | undefined => {
      const map = mapRef.current;
      if (!map) return undefined;
      let best: OilfieldName | undefined;
      let bestDistance = Infinity;
      map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => {
          const field = feature.get("field") as OilfieldName | undefined;
          if (!field) return;
          const point = (feature.getGeometry() as Point).getCoordinates();
          const pixel = map.getPixelFromCoordinate(point);
          const distance = Math.hypot(
            pixel[0] - event.pixel[0],
            pixel[1] - event.pixel[1],
          );
          if (distance < bestDistance) {
            bestDistance = distance;
            best = field;
          }
        },
        { hitTolerance: 12 },
      );
      return best;
    },
    [],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function handleClick(event: MapBrowserEvent<any>) {
      const field = fieldAt(event);
      onSelect(field);
    }

    let frame = 0;
    function handleMove(event: MapBrowserEvent<any>) {
      if (event.dragging) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const field = fieldAt(event);
        map!.getTargetElement().style.cursor = field ? "pointer" : "";
        onHover(field);
      });
    }

    map.on("click", handleClick);
    map.on("pointermove", handleMove);
    return () => {
      cancelAnimationFrame(frame);
      map.un("click", handleClick);
      map.un("pointermove", handleMove);
    };
  }, [fieldAt, onSelect, onHover]);

  // Zoom to the selected field, but never past the point where the player
  // loses the shelf around it
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    const geometry = fieldGeometry[selected];
    if (!geometry) return;
    map.getView().animate({
      center: [geometry.lon, geometry.lat],
      zoom: Math.max(map.getView().getZoom() ?? 5, 7),
      duration: 450,
    });
  }, [selected]);

  // The description is a sibling, not a role="img" on the container: the
  // container holds OpenLayers' own zoom buttons, and role="img" would have
  // hidden those from assistive technology entirely.
  return (
    <>
      <p className="visually-hidden">
        Kart over {data.length} felt på norsk sokkel. Hvert felt er tegnet som
        en boble der størrelsen er produksjonen og fargen er utslipp per fat.
        Kartet krever mus eller berøring. Feltlisten ved siden av kartet har det
        samme innholdet og kan brukes med tastatur.
      </p>
      <div className="shelf-map" ref={containerRef} />
    </>
  );
}
