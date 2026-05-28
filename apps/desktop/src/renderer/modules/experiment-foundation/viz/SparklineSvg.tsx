export type SparklinePoint = {
  /** X axis label / sort key — typically an ISO timestamp or a run_recipe_id. */
  x: string;
  y: number;
};

export type SparklineSvgProps = {
  points: SparklinePoint[];
  width?: number;
  height?: number;
  ariaLabel?: string;
};

/**
 * Inline SVG sparkline. Renders a single polyline plus the latest point dot.
 * No external library; no Tailwind beyond inherited shell layout. The path
 * coordinates are computed at render time from the supplied points.
 */
export function SparklineSvg({
  points,
  width = 160,
  height = 32,
  ariaLabel = 'sparkline',
}: SparklineSvgProps) {
  if (points.length === 0) {
    return (
      <p data-ui="text" data-variant="caption" data-tone="muted">
        无数据
      </p>
    );
  }
  if (points.length === 1) {
    const only = points[0];
    return (
      <p data-ui="text" data-variant="caption" data-tone="muted">
        单点：{only.y}（{only.x}）
      </p>
    );
  }

  const ys = points.map((point) => point.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeY = maxY - minY === 0 ? 1 : maxY - minY;
  const lastIndex = points.length - 1;
  const padX = 2;
  const padY = 2;
  const usableWidth = width - padX * 2;
  const usableHeight = height - padY * 2;

  const projected = points.map((point, index) => {
    const px = padX + (index / lastIndex) * usableWidth;
    const py = padY + usableHeight - ((point.y - minY) / rangeY) * usableHeight;
    return { px, py };
  });

  const pathSegments = projected
    .map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.px.toFixed(2)},${coord.py.toFixed(2)}`)
    .join(' ');

  const last = projected[lastIndex];

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path d={pathSegments} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
      <circle cx={last.px} cy={last.py} r={2.4} fill="currentColor" />
    </svg>
  );
}
