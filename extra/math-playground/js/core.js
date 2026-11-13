// Shared lesson registry and SVG drawing kit. Lesson packs in lessons/*.js call MP.register(...).
const MP = {
  // Filled by js/curriculum.js after the lesson packs are registered.
  tracks: [],
  paths: [],
  lessons: [],
  register(...lessons) { this.lessons.push(...lessons); },
  colors: {
    coral: '#d75a43', blue: '#416fae', green: '#317d5c', yellow: '#b8860b', purple: '#7b5ea7', gray: '#87958f',
    ink: '#172a38', muted: '#60717b', grid: '#e5eae5', axis: '#9baea8', paper: '#fafbf8',
    coralSoft: '#fde7e2', blueSoft: '#e6eefb', greenSoft: '#e4f3e9', yellowSoft: '#fff0c7', purpleSoft: '#efe9f7', graySoft: '#eef1ee'
  },
  fmt: (n, digits = 2) => Number(n).toFixed(digits),
  clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)),
  // Seeded random numbers so a simulation looks the same every time the same slider values are drawn.
  rng(seed = 1) {
    let a = seed >>> 0 || 1;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  },
  softmax(logits, temperature = 1) {
    const scaled = logits.map(z => z / temperature), max = Math.max(...scaled);
    const exps = scaled.map(z => Math.exp(z - max)), total = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / total);
  }
};

// Every draw call gets a fresh kit bound to the lesson's <svg>. Coordinates use the viewBox (600 × lesson.viewH, default 360).
MP.kit = function kit(svg, lesson, state, redraw) {
  const C = MP.colors, H = lesson.viewH || 360;
  const el = (tag, attrs = {}, parent = svg) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs)) if (value !== undefined) node.setAttribute(key, value);
    parent.appendChild(node);
    return node;
  };
  const text = (x, y, value, attrs = {}, parent = svg) => {
    const node = el('text', { x, y, fill: C.muted, 'font-size': 13, ...attrs }, parent);
    node.textContent = value;
    return node;
  };
  const line = (x1, y1, x2, y2, color = C.axis, attrs = {}) => el('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round', ...attrs });
  const rect = (x, y, width, height, fill, attrs = {}) => el('rect', { x, y, width: Math.max(0, width), height: Math.max(0, height), fill, ...attrs });
  const circle = (cx, cy, r, fill, attrs = {}) => el('circle', { cx, cy, r: Math.max(0, r), fill, ...attrs });
  const path = (d, stroke = C.coral, attrs = {}) => el('path', { d, fill: 'none', stroke, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...attrs });
  const pts = points => points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const polyline = (points, stroke = C.coral, attrs = {}) => el('polyline', { points: pts(points), fill: 'none', stroke, 'stroke-width': 3, 'stroke-linejoin': 'round', ...attrs });
  const polygon = (points, fill, attrs = {}) => el('polygon', { points: pts(points), fill, ...attrs });
  const arrow = (x1, y1, x2, y2, color = C.blue, width = 3, attrs = {}) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 2) return;
    const a = Math.atan2(y2 - y1, x2 - x1), head = Math.min(13, len * 0.6) + width;
    const bx = x2 - head * 0.8 * Math.cos(a), by = y2 - head * 0.8 * Math.sin(a);
    line(x1, y1, bx, by, color, { 'stroke-width': width, ...attrs });
    polygon([[x2, y2], [x2 - head * Math.cos(a - 0.42), y2 - head * Math.sin(a - 0.42)], [x2 - head * Math.cos(a + 0.42), y2 - head * Math.sin(a + 0.42)]], color);
  };
  const emoji = (x, y, char, size = 28, attrs = {}) => text(x, y, char, { 'font-size': size, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: C.ink, ...attrs });
  // A rounded card used to frame the "real application" part of a scene.
  const box = (x, y, width, height, { fill = '#fff', stroke = '#dce2df', r = 10, title, titleColor = C.ink } = {}) => {
    rect(x, y, width, height, fill, { rx: r, stroke, 'stroke-width': 1.5 });
    if (title) text(x + 10, y + 18, title, { 'font-size': 12, 'font-weight': 700, fill: titleColor });
  };
  // Axes inside any rectangle: left/top/width/height are in viewBox units.
  const plot = ({ xmin = 0, xmax = 6, ymin = 0, ymax = 1, xlabel = '', ylabel = '', left = 62, width = 485, top = 30, height = 255, ticks = 4, xticks = ticks, yticks = ticks, tickFmt = v => Number(MP.fmt(v)), grid = true } = {}) => {
    const x = v => left + (v - xmin) / (xmax - xmin) * width;
    const y = v => top + height - (v - ymin) / (ymax - ymin) * height;
    for (let i = 0; i <= xticks; i++) {
      const xv = xmin + (xmax - xmin) * i / xticks;
      if (grid) line(x(xv), top, x(xv), top + height, C.grid, { 'stroke-width': 1 });
      text(x(xv), top + height + 17, tickFmt(xv), { 'text-anchor': 'middle', 'font-size': 11 });
    }
    for (let i = 0; i <= yticks; i++) {
      const yv = ymin + (ymax - ymin) * i / yticks;
      if (grid) line(left, y(yv), left + width, y(yv), C.grid, { 'stroke-width': 1 });
      text(left - 7, y(yv) + 4, tickFmt(yv), { 'text-anchor': 'end', 'font-size': 11 });
    }
    const baseline = ymin <= 0 && ymax >= 0 ? y(0) : top + height;
    line(left, baseline, left + width, baseline, C.axis);
    if (ylabel) text(left, top - 9, ylabel, { 'font-size': 12, 'font-weight': 700 });
    if (xlabel) text(left + width, top + height + 34, xlabel, { 'text-anchor': 'end', 'font-size': 12 });
    return { x, y, xmin, xmax, ymin, ymax, left, top, width, height, right: left + width, bottom: top + height };
  };
  const curve = (p, fn, color = C.coral, attrs = {}, from = p.xmin, to = p.xmax, samples = 300) => {
    const d = Array.from({ length: samples + 1 }, (_, i) => {
      const t = from + (to - from) * i / samples, v = fn(t);
      return `${i ? 'L' : 'M'}${p.x(t).toFixed(2)},${p.y(Number.isFinite(v) ? MP.clamp(v, p.ymin - (p.ymax - p.ymin), p.ymax + (p.ymax - p.ymin)) : p.ymin).toFixed(2)}`;
    }).join(' ');
    return path(d, color, attrs);
  };
  const dot = (p, x, y, color = C.coral, r = 6) => circle(p.x(x), p.y(y), r, color, { stroke: '#fff', 'stroke-width': 2 });
  const clip = (x, y, width, height) => {
    const id = `clip-${lesson.id}-${Math.round(x)}-${Math.round(y)}-${Math.round(width)}`;
    const cp = el('clipPath', { id }, el('defs'));
    el('rect', { x, y, width, height }, cp);
    return el('g', { 'clip-path': `url(#${id})` });
  };
  // sub(group) returns the same kit drawing into a <g>, e.g. k.sub(k.clip(...)) or k.sub(k.g({ opacity: .5 })).
  const sub = parent => MP.kit(parent, lesson, state, redraw);
  return { svg, lesson, state, redraw, C, W: 600, H, fmt: MP.fmt, clamp: MP.clamp, softmax: MP.softmax, el, text, line, rect, circle, path, polyline, polygon, arrow, emoji, box, plot, curve, dot, clip, sub, g: (attrs = {}) => el('g', attrs) };
};
