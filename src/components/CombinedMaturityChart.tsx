import { STAGE_NAME_BY_LEVEL } from "../lib/scoring";
import type { Dimension, Level, Scores, TargetsByDimension } from "../types";

interface Props {
  dimensions: Dimension[];
  scores: Scores;
  targets: TargetsByDimension;
}

const WIDTH = 680;
const ROW_H = 60;
const PAD_LEFT = 140;
const PAD_RIGHT = 20;
const HEADER_H = 32; // two-line "L1 / Initial / Ad hoc" level headers
const REF_LABEL_H = 18;
const LEGEND_H = 40;

// Categorical palette, fixed identity order: Now / Short-term / Long-term.
// Different shape AND size per series -- when two or more points land on
// the same spot (a common case: targets default to the current level),
// drawing smallest-on-top (see the reversed z-order below) makes every
// series visible as concentric shapes even under a full overlap, rather
// than the top one fully hiding the others.
const SERIES = [
  { key: "now", label: "Now", color: "#eb6834", shape: "circle", size: 3.5 },
  { key: "shortTerm", label: "Short-term target", color: "#2a78d6", shape: "square", size: 5 },
  { key: "longTerm", label: "Long-term target", color: "#1baf7a", shape: "diamond", size: 9 },
] as const;

function xFor(level: number, plotW: number) {
  return PAD_LEFT + ((level - 1) / 4) * plotW;
}

function Marker({
  shape,
  size,
  x,
  y,
  color,
}: {
  shape: "circle" | "square" | "diamond";
  size: number;
  x: number;
  y: number;
  color: string;
}) {
  const common = { fill: color, stroke: "var(--surface-card, #fff)", strokeWidth: 1.25 };
  if (shape === "circle") return <circle cx={x} cy={y} r={size} {...common} />;
  if (shape === "square")
    return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} {...common} />;
  const d = `M${x},${y - size} L${x + size},${y} L${x},${y + size} L${x - size},${y} Z`;
  return <path d={d} {...common} />;
}

// Wraps onto two lines at a natural break (around "&" if present, else the
// last space before the midpoint) so long labels don't overflow their
// column -- used for both the row (dimension) labels and, split on a fixed
// "level number" / "stage name" boundary, the x-axis level headers.
function wrapAtAmpersand(name: string): string[] {
  if (name.includes("&")) {
    const [first, second] = name.split("&");
    return [`${first.trim()} &`, second.trim()];
  }
  return [name];
}

export function CombinedMaturityChart({ dimensions, scores, targets }: Props) {
  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotTop = HEADER_H + REF_LABEL_H;
  const plotH = dimensions.length * ROW_H;
  const height = plotTop + plotH + LEGEND_H;
  const x3 = xFor(3, plotW);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label="Maturity by dimension: current score, short-term target, and long-term target on a level 1 to 5 scale, with a recommended minimum baseline at level 3"
      style={{ width: "100%", height: "auto", overflow: "visible" }}
    >
      {/* level band headers: level number, stage name wrapped underneath -- same two-line treatment for all five */}
      {([1, 2, 3, 4, 5] as Level[]).map((lvl) => {
        const anchor = lvl === 1 ? "start" : lvl === 5 ? "end" : "middle";
        const x = xFor(lvl, plotW);
        return (
          <text key={lvl} x={x} y={12} textAnchor={anchor} fontSize={11} fill="var(--text-secondary, #52514e)">
            <tspan x={x} dy={0} fontWeight={700}>
              {`L${lvl}`}
            </tspan>
            <tspan x={x} dy="1.2em">
              {STAGE_NAME_BY_LEVEL[lvl]}
            </tspan>
          </text>
        );
      })}

      {/* level 3 reference line + label */}
      <text
        x={x3}
        y={HEADER_H + 12}
        textAnchor="middle"
        fontSize={10}
        fontStyle="italic"
        fill="var(--text-muted, #898781)"
      >
        Recommended minimum baseline
      </text>
      <line
        x1={x3}
        x2={x3}
        y1={plotTop}
        y2={plotTop + plotH}
        stroke="var(--border-strong, #c3c2b7)"
        strokeWidth={1.5}
        strokeDasharray="4,3"
      />

      {/* vertical gridlines at each level */}
      {([1, 2, 3, 4, 5] as Level[]).map((lvl) => (
        <line
          key={lvl}
          x1={xFor(lvl, plotW)}
          x2={xFor(lvl, plotW)}
          y1={plotTop}
          y2={plotTop + plotH}
          stroke="var(--border, #e1e0d9)"
          strokeWidth={1}
        />
      ))}

      {/* rows */}
      {dimensions.map((dim, i) => {
        const rowY = plotTop + i * ROW_H + ROW_H / 2;
        const score = scores.byDimension[dim.id];
        const t = targets[dim.id];
        const values = { now: score.average, shortTerm: t.shortTerm, longTerm: t.longTerm };
        const coords = SERIES.map((s) => ({ ...s, x: xFor(values[s.key], plotW) }));
        const nowCoord = coords[0];
        const nameLines = wrapAtAmpersand(dim.name);

        return (
          <g key={dim.id}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={rowY}
              y2={rowY}
              stroke="var(--border, #e1e0d9)"
              strokeWidth={1}
            />
            {/* row label pushed to the page edge rather than hugging the plot */}
            <text
              x={0}
              y={rowY}
              textAnchor="start"
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={600}
              fill="var(--text-primary, #0b0b0b)"
            >
              {nameLines.map((line, li) => (
                <tspan key={li} x={0} dy={li === 0 ? (nameLines.length > 1 ? "-0.3em" : 0) : "1.15em"}>
                  {line}
                </tspan>
              ))}
            </text>

            {/* connecting dotted line, Now -> Short-term -> Long-term, this row only */}
            <path
              d={`M${coords[0].x},${rowY} L${coords[1].x},${rowY} L${coords[2].x},${rowY}`}
              fill="none"
              stroke="var(--border-strong, #c3c2b7)"
              strokeWidth={1.5}
              strokeDasharray="2,3"
            />

            {/* draw back-to-front: largest (long-term) first, smallest (now)
                last, so every series stays visible even under a full overlap */}
            {[...coords].reverse().map((c) => (
              <Marker key={c.key} shape={c.shape} size={c.size} x={c.x} y={rowY} color={c.color} />
            ))}

            {/* data label: current score only -- short/long-term targets are
                whole numbers that already land exactly on a gridline */}
            <text
              x={nowCoord.x}
              y={rowY - SERIES[2].size - 6}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="var(--text-primary, #0b0b0b)"
            >
              {score.average.toFixed(1).replace(/\.0$/, "")}
            </text>
          </g>
        );
      })}

      {/* legend */}
      {SERIES.map((s, i) => {
        const legendW = WIDTH - PAD_LEFT - PAD_RIGHT;
        const cx = PAD_LEFT + (i + 0.5) * (legendW / SERIES.length);
        const y = plotTop + plotH + 24;
        return (
          <g key={s.key}>
            <Marker shape={s.shape} size={s.size} x={cx - 46} y={y} color={s.color} />
            <text x={cx - 36} y={y} dominantBaseline="middle" fontSize={11} fill="var(--text-secondary, #52514e)">
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
