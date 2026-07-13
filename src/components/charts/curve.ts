/**
 * Monotone cubic interpolation (Fritsch–Carlson), the curve behind the
 * smooth lines. Unlike a plain cardinal spline it never overshoots the data,
 * so filled areas can't dip below zero between two low points.
 */
export type CurvePoint = { x: number; y: number };

export type CurveSegment = {
  p0: CurvePoint;
  c1: CurvePoint;
  c2: CurvePoint;
  p1: CurvePoint;
};

/**
 * Computes one cubic bezier segment per consecutive point pair. Working per
 * segment (rather than one long path string) lets the caller style segments
 * individually — the charts use this to dash the estimated stretches.
 */
export function monotoneSegments(points: CurvePoint[]): CurveSegment[] {
  const n = points.length;
  if (n < 2) return [];

  // Secant slopes between consecutive points
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const run = points[i + 1].x - points[i].x || 1e-9;
    dx.push(run);
    slope.push((points[i + 1].y - points[i].y) / run);
  }

  // Tangents: average of neighboring secants, zeroed at local extrema
  const tangent: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    tangent.push(
      slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2,
    );
  }
  tangent.push(slope[n - 2]);

  // Fritsch–Carlson limiter keeps each segment monotone
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const norm = a * a + b * b;
    if (norm > 9) {
      const t = 3 / Math.sqrt(norm);
      tangent[i] = t * a * slope[i];
      tangent[i + 1] = t * b * slope[i];
    }
  }

  return points.slice(0, -1).map((p0, i) => {
    const p1 = points[i + 1];
    const third = dx[i] / 3;
    return {
      p0,
      c1: { x: p0.x + third, y: p0.y + third * tangent[i] },
      c2: { x: p1.x - third, y: p1.y - third * tangent[i + 1] },
      p1,
    };
  });
}

const px = (value: number) => +value.toFixed(2);

/** Path fragment "C c1 c2 p1" for one segment (no leading move). */
export function segmentToPath(segment: CurveSegment): string {
  const { c1, c2, p1 } = segment;
  return `C${px(c1.x)},${px(c1.y)} ${px(c2.x)},${px(c2.y)} ${px(p1.x)},${px(p1.y)}`;
}

/** Full "M … C …" path through a run of points. */
export function curvePath(points: CurvePoint[]): string {
  if (points.length === 0) return "";
  const start = `M${px(points[0].x)},${px(points[0].y)}`;
  if (points.length === 1) return start;
  return start + monotoneSegments(points).map(segmentToPath).join(" ");
}
