// AI 語言模型的數學（二）：模型怎麼學會、怎麼變小變便宜。
// neuron → backprop → crossentropy → lora → quantization → scaling
(() => {
  const C0 = MP.colors;
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = n => String(n).split('').map(c => (c === '-' ? '⁻' : SUP['0123456789'.indexOf(c)] || c)).join('');
  // 1.2×10²⁰ style scientific notation.
  const sci = (x, d = 1) => {
    if (x === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
    if (Math.abs(Number(m.toFixed(d))) >= 10) { e += 1; m /= 10; }
    return `${m.toFixed(d)}×10${sup(e)}`;
  };
  // Number with fixed digits, or scientific notation when it gets huge.
  const num = (x, d = 1) => (Math.abs(x) < 1e4 ? MP.fmt(x, d) : sci(x, 1)).replace(/^-/, '−');
  const sgn = (x, d = 1) => MP.fmt(x, d).replace(/^-/, '−');
  const comma = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sig = (x, s = 3) => String(Number(x.toPrecision(s)));
  const zh = x => (x >= 1e12 ? `${sig(x / 1e12)} 兆` : x >= 1e8 ? `${sig(x / 1e8)} 億` : x >= 1e4 ? `${sig(x / 1e4)} 萬` : sig(x));
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b), u = MP.clamp(t, 0, 1); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };
  const heatColor = (val, max) => (val >= 0 ? mix('#ffffff', C0.blue, val / max) : mix('#ffffff', C0.coral, -val / max));
  const halo = { stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', 'stroke-linejoin': 'round' };

  // ---------- neuron: 36 seeded past days (cloud %, humidity %, rained?) ----------
  const DAYS = (() => {
    const r = MP.rng(2024), out = [];
    for (let i = 0; i < 36; i++) {
      const x1 = 0.05 + 0.9 * r(), x2 = 0.05 + 0.9 * r();
      const z = 5 * x1 + 4 * x2 - 4.6 + (r() + r() - 1) * 1.3;
      out.push({ x1, x2, rain: z > 0 });
    }
    return out;
  })();
  const TODAY = { x1: 0.7, x2: 0.45 };
  const ACTS = [
    { name: '階梯', f: z => (z > 0 ? 1 : 0), top: 1 },
    { name: 'Sigmoid', f: z => 1 / (1 + Math.exp(-z)), top: 1 },
    { name: 'ReLU', f: z => Math.max(0, z), top: 6 }
  ];

  // ---------- backprop: one delivery order ----------
  const BP = { x: 3, y: 20 };
  const bpRun = (w, b, lr, steps) => {
    const hist = [];
    let cw = w, cb = b, at = null;
    for (let i = 0; i <= 20; i++) {
      const e = cw * BP.x + cb - BP.y;
      hist.push(e * e);
      if (i === steps) at = { w: cw, b: cb };
      cw -= lr * 2 * e * BP.x; cb -= lr * 2 * e;
    }
    return { ...at, hist };
  };

  // ---------- crossentropy: the sentence and three "models" ----------
  const CE_WORDS = ['今天', '放學', '後', '我們', '去', '公園', '打', '籃球'];
  const CE_MODELS = [
    { p: [0.6, 0.5, 0.9, 0.7, 0.85, 0.55, 0.8], bet: {} },
    { p: [0.15, 0.2, 0.3, 0.2, 0.25, 0.15, 0.2], bet: {} },
    { p: [0.6, 0.5, 0.9, 0.02, 0.85, 0.01, 0.8], bet: { 3: '他們', 5: '補習班' } }
  ];

  // ---------- lora: SVD of two 8×8 matrices, precomputed once ----------
  const svd = M => {
    const n = M.length, r = MP.rng(5);
    const G = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => M.reduce((s, row) => s + row[i] * row[j], 0)));
    const comps = [];
    for (let c = 0; c < n; c++) {
      let v = Array.from({ length: n }, () => r() - 0.5);
      for (let it = 0; it < 600; it++) {
        const nv = G.map(row => row.reduce((s, g, j) => s + g * v[j], 0));
        const len = Math.hypot(...nv) || 1;
        v = nv.map(x => x / len);
      }
      const Gv = G.map(row => row.reduce((s, g, j) => s + g * v[j], 0));
      const lam = Math.max(0, v.reduce((s, x, i) => s + x * Gv[i], 0));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) G[i][j] -= lam * v[i] * v[j];
      const s = Math.sqrt(lam), keep = s > 1e-6 && s > 1e-4 * (comps[0] ? comps[0].s : s);
      const u = keep ? M.map(row => row.reduce((acc, m, j) => acc + m * v[j], 0) / s) : Array(n).fill(0);
      comps.push({ s: keep ? s : 0, u, v });
    }
    return comps;
  };
  const LORA = (() => {
    const n = 8, r = MP.rng(77);
    const vec = () => Array.from({ length: n }, () => 2 * r() - 1);
    const parts = [[2.2, vec(), vec()], [0.9, vec(), vec()], [0.45, vec(), vec()], [0.2, vec(), vec()]];
    const delta = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) =>
      parts.reduce((s, [w, a, b]) => s + w * a[i] * b[j], 0) + 0.04 * (2 * r() - 1)));
    const table = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i + 1) * (j + 1)));
    return [delta, table].map(M => {
      const comps = svd(M);
      const norm = Math.hypot(...M.flat());
      const approx = [], err = [];
      for (let k = 0; k <= n; k++) {
        const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => comps.slice(0, k).reduce((s, c) => s + c.s * c.u[i] * c.v[j], 0)));
        approx.push(A);
        err.push(Math.hypot(...M.flat().map((m, idx) => m - A[Math.floor(idx / n)][idx % n])) / norm);
      }
      return { M, comps, approx, err, max: Math.max(...M.flat().map(Math.abs)) };
    });
  })();

  // ---------- quantization: 800 bell-shaped weights ----------
  const QW = (() => {
    const r = MP.rng(31), w = [];
    for (let i = 0; i < 800; i++) { const u1 = r() || 1e-9, u2 = r(); w.push(0.02 * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)); }
    return w;
  })();
  const QMAX = Math.max(...QW.map(Math.abs));
  const QRMS = Math.sqrt(QW.reduce((s, w) => s + w * w, 0) / QW.length);
  const QHIST = (() => { const h = Array(40).fill(0); QW.forEach(w => { const i = Math.floor((w + 0.08) / 0.004); if (i >= 0 && i < 40) h[i]++; }); return h; })();
  const Q_MODELS = [{ n: 1e9, label: '10 億' }, { n: 3e9, label: '30 億' }, { n: 7e9, label: '70 億' }, { n: 70e9, label: '700 億' }];

  // ---------- scaling: Hoffmann et al. (2022) fitted constants ----------
  const CH = { E: 1.69, A: 406.4, B: 410.7, a: 0.34, b: 0.28 };
  const chLoss = (N, D) => CH.E + CH.A / N ** CH.a + CH.B / D ** CH.b;
  const CH_G = ((CH.a * CH.A) / (CH.b * CH.B)) ** (1 / (CH.a + CH.b));

  MP.register(
    // =====================================================================
    {
      id: 'neuron', track: 'llm', symbol: 'φ', name: '神經元與激活函數', question: 'AI 怎麼做決定？',
      title: '出門前，要不要帶傘？讓一顆「人工神經元」幫你決定',
      intro: '你出門前會看看天空：雲很多、空氣又很濕，就帶傘。你心裡其實在<b>打分數</b>：雲量算幾分、濕度算幾分，加起來超過門檻就帶傘。人工神經元做的事一模一樣：把每個線索<b>乘上權重</b>、加總、再加一個偏差 b，最後交給<b>激活函數</b>決定要輸出多少。ChatGPT、Claude 這類模型裡面，就是大量這樣的小計分器一層層疊在一起，權重總數多達數十億個以上。',
      scene: '模擬：天氣 App 用一顆神經元判斷「今天要不要帶傘」', viewH: 400,
      chart: '左：過去 36 天（藍點＝下雨、黃圈＝沒下雨、紅框＝判斷錯、★＝今天），藍色區域＝神經元說「帶傘」　右：神經元的即時計算與 App 通知',
      caption: '雲量 x₁、濕度 x₂ 都換成 0～1。分數 z = w₁x₁ + w₂x₂ + b；z > 0 就帶傘，所以「z = 0」那條直線就是決策邊界。資料是隨機產生的示意，權重由你手動調整（真正的 AI 會用梯度下降自己學）。',
      controls: [
        ['w1', '雲量的權重 w₁', -5, 5, 0.1, 3, ''],
        ['w2', '濕度的權重 w₂', -5, 5, 0.1, 2, ''],
        ['b', '偏差 b（門檻）', -8, 2, 0.1, -2.5, ''],
        { key: 'act', label: '激活函數', options: ['階梯', 'Sigmoid', 'ReLU'], value: 1 }
      ],
      try: '調整 w₁、w₂、b，讓答對天數越多越好（能超過 32 天嗎？）。再把 w₁ 調成負的：神經元會變成「雲越多越不帶傘」！最後切換激活函數，看看邊界線有沒有變。',
      resultLabel: '神經元對今天的判斷',
      takeaway: '一顆神經元＝加權打分數＋一個「要不要放行」的激活函數；它在平面上畫出一條直線把資料分兩邊。',
      application: '把很多神經元並排成一層、再一層層疊起來，就能畫出彎彎曲曲的邊界——這就是深度學習。',
      tech: [
        ['🤖', 'ChatGPT／Claude／Gemini／Llama', '每個 Transformer 區塊都有一層前饋網路（FFN／MLP）：上萬顆神經元同時算 φ(Wx + b)。在標準設計裡，FFN 約佔每個區塊（不含詞嵌入）三分之二的參數；現代模型多用 GELU 或 SwiGLU 這類平滑激活（例如 Llama 系列用 SwiGLU）。'],
        ['📧', '垃圾郵件過濾', '經典做法就是「一顆 sigmoid 神經元」（邏輯斯迴歸）：把可疑字詞、寄件來源等特徵乘權重加總，輸出「是垃圾信的機率」；新的系統再疊上更深的神經網路。'],
        ['📷', '手機相簿找人臉、找貓狗', '影像辨識網路一層層都是大量神經元＋ReLU 類激活，前幾層找邊緣，後幾層組合成眼睛、臉。'],
        ['💳', '信用卡盜刷偵測', '把消費金額、地點、時間等特徵加權組合，經過激活函數輸出可疑分數，超過門檻就請你確認交易。']
      ],
      teach: {
        grade: '國小六年級～國中八年級',
        connect: '國小「比較大小」、國中「一次函數 y = ax + b」「二元一次方程式的圖形是直線」「坐標平面」。決策邊界 w₁x₁ + w₂x₂ + b = 0 就是一條直線。',
        activity: '準備 12 張「天氣卡」，每張寫雲量（0～10）、濕度（0～10）和那天有沒有下雨。每組抽一組「權重卡」（例如雲量 ×2、濕度 ×1、門檻 −12）：對每張天氣卡算「分數 = 2×雲量 + 1×濕度 − 12」，大於 0 就舉傘。統計答對幾張，再讓各組自己改權重比賽誰答對最多。最後在方格紙上把天氣卡畫成點，畫出「分數 = 0」的直線，看它是不是把下雨卡和晴天卡分開。',
        ask: ['如果某個權重是 0，代表神經元怎麼看待那個線索？是負的呢？', '偏差 b 變大或變小，邊界線會往哪裡移？為什麼？', '有沒有一種資料，無論怎麼畫一條直線都分不開？（提示：對角線上的兩種顏色）'],
        myth: '「激活函數決定了邊界的形狀」——對單一顆神經元來說，階梯、Sigmoid、ReLU 的邊界都是同一條直線 z = 0；激活函數真正的作用是讓「很多層疊起來」時不會退化成一條直線，以及讓梯度能傳回去好好學習。'
      },
      formula: 'z = w·x + b = Σ<sub>i</sub> w<sub>i</sub>x<sub>i</sub> + b，　a = φ(z)<br>σ(z) = 1 / (1 + e<sup>−z</sup>)，ReLU(z) = max(0, z)，GELU(z) = z·Φ(z)<br>決策邊界：{ x : w·x + b = 0 }（法向量為 w）<br>Transformer 前饋層：FFN(x) = W<sub>2</sub> φ(W<sub>1</sub>x + b<sub>1</sub>) + b<sub>2</sub>',
      formal: 'x ∈ ℝⁿ 是輸入特徵，w ∈ ℝⁿ 是權重、b 是偏差，φ 是激活函數。σ 輸出介於 0 和 1，可解讀成機率 P(下雨 | x)；配上交叉熵損失，一顆 sigmoid 神經元就是統計學的<b>邏輯斯迴歸</b>。決策邊界 w·x + b = 0 是一個超平面，w 垂直於它，點到邊界的有號距離為 z/‖w‖。<b>限制</b>：單一神經元只能做線性分割（無法解 XOR）；把多個神經元組成多層且激活函數非線性，才能逼近任意連續函數（萬能逼近定理，Cybenko 1989、Hornik 1991）。若沒有非線性，W₂(W₁x) = (W₂W₁)x 仍只是一次變換，疊再多層也沒用。階梯函數幾乎處處導數為 0，梯度下降學不動，所以實務上用 sigmoid、ReLU；sigmoid 在 |z| 大時飽和造成梯度消失，ReLU 與 GELU 緩解此問題。現代 LLM（如 Llama）的 FFN 用 SwiGLU：(Swish(xW) ⊙ xV)W₂，中間寬度約為模型寬度的 2.7～3.5 倍（原始建議是 8/3 ≈ 2.7 倍，Llama 3 用 3.5 倍）。本模擬只有 2 個特徵、36 筆人造資料，權重由人手調。',
      quiz: [
        { question: '把偏差 b 調得更負（例如 −2 變成 −5），神經元會怎樣？', options: ['更容易說「帶傘」', '更不容易說「帶傘」，需要更多雲和濕氣', '完全沒有影響'], answer: 1, why: '對！b 更負，分數 z 更難超過 0，就像把門檻提高；邊界線往右上方移。', hint: 'z = w₁x₁ + w₂x₂ + b，b 變小時 z 也會變小喔。' },
        { question: '為什麼深度網路的每一層後面都要接一個「非線性」激活函數？', options: ['為了讓計算比較快', '不然疊很多層效果等於只有一層線性變換', '為了讓輸出一定是正數'], answer: 1, why: '對！線性變換的組合還是線性變換；非線性激活讓多層網路能畫出彎曲、複雜的邊界。' }
      ],
      related: ['linear', 'gradient', 'backprop', 'softmax'],
      draw(k, v) {
        const { C, fmt } = k;
        const act = ACTS[v.act];
        const f = (x1, x2) => v.w1 * x1 + v.w2 * x2 + v.b;
        // Past days scatter with the decision boundary.
        k.text(10, 16, '📅 過去 36 天的天氣紀錄', { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        const p = k.plot({ xmin: 0, xmax: 1, ymin: 0, ymax: 1, left: 56, top: 44, width: 240, height: 240, xticks: 4, yticks: 4, tickFmt: t => `${Math.round(t * 100)}%`, xlabel: '雲量 x₁', ylabel: '濕度 x₂' });
        const sq = [[0, 0], [1, 0], [1, 1], [0, 1]], poly = [], ends = [];
        sq.forEach((P, i) => {
          const Q = sq[(i + 1) % 4], fp = f(...P), fq = f(...Q);
          if (fp > 0) poly.push(P);
          if ((fp > 0) !== (fq > 0)) { const t = fp / (fp - fq), X = [P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]; poly.push(X); ends.push(X); }
        });
        if (poly.length > 2) k.polygon(poly.map(([a, b]) => [p.x(a), p.y(b)]), C.blueSoft, { opacity: 0.9 });
        if (ends.length === 2) k.line(p.x(ends[0][0]), p.y(ends[0][1]), p.x(ends[1][0]), p.y(ends[1][1]), C.purple, { 'stroke-width': 3, 'stroke-dasharray': '8 5' });
        let correct = 0;
        DAYS.forEach(d => {
          const ok = (f(d.x1, d.x2) > 0) === d.rain;
          if (ok) correct++;
          if (d.rain) k.circle(p.x(d.x1), p.y(d.x2), 5.5, C.blue, { stroke: '#fff', 'stroke-width': 1.5 });
          else k.circle(p.x(d.x1), p.y(d.x2), 5, '#fff', { stroke: C.yellow, 'stroke-width': 2.5 });
          if (!ok) k.rect(p.x(d.x1) - 9, p.y(d.x2) - 9, 18, 18, 'none', { stroke: C.coral, 'stroke-width': 2, rx: 3 });
        });
        k.text(p.x(TODAY.x1), p.y(TODAY.x2) + 1, '★', { 'font-size': 24, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: C.purple, ...halo, 'stroke-width': 3 });
        k.text(56, 348, `答對 ${correct} / 36 天（${Math.round(correct / 36 * 100)}%）`, { 'font-size': 15, 'font-weight': 700, fill: correct >= 32 ? C.green : C.ink });
        k.text(56, 370, ends.length === 2 ? '紫色虛線：w₁x₁ + w₂x₂ + b = 0' : '邊界線跑到圖外面了', { 'font-size': 11 });
        // The neuron itself, computing today's decision.
        const z = f(TODAY.x1, TODAY.x2), a = act.f(z), yes = z > 0;
        k.box(316, 8, 276, 254, { title: '🧠 一顆神經元（輸入：今天的天氣）' });
        const sx = 455, sy = 140;
        const inputs = [[350, 92, '雲量 x₁', TODAY.x1, v.w1, -1], [350, 196, '濕度 x₂', TODAY.x2, v.w2, 1]];
        inputs.forEach(([x, y, label, val, w, side]) => {
          const col = w >= 0 ? C.blue : C.coral;
          k.line(x + 22, y, sx - 24, sy, col, { 'stroke-width': 1.5 + Math.abs(w) * 1.1, opacity: 0.75 });
          k.circle(x, y, 22, C.graySoft, { stroke: C.gray, 'stroke-width': 1.5 });
          k.text(x, y + 5, fmt(val, 2), { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.ink });
          k.text(x, y - 28, label, { 'text-anchor': 'middle', 'font-size': 11 });
          k.text(396, y + (sy - y) * 24 / 59 + (side < 0 ? -8 : 18), `×${sgn(w, 1)}`, { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: col, ...halo });
        });
        k.line(sx, 72, sx, sy - 24, C.gray, { 'stroke-width': 1.5 });
        k.text(sx, 64, `偏差 b = ${sgn(v.b, 1)}`, { 'text-anchor': 'middle', 'font-size': 11, fill: C.ink });
        k.circle(sx, sy, 24, C.purpleSoft, { stroke: C.purple, 'stroke-width': 2 });
        k.text(sx, sy + 7, 'Σ', { 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: C.purple });
        k.text(sx, sy + 44, `z = ${sgn(z, 2)}`, { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.purple });
        k.arrow(sx + 25, sy, 500, sy, C.purple, 2);
        // Mini graph of the activation function with today's z.
        const bx = 502, by = 110, bw = 82, bh = 62, zr = 6;
        k.rect(bx, by, bw, bh, '#fff', { rx: 6, stroke: C.purple, 'stroke-width': 1.5 });
        k.text(bx + bw / 2, by - 7, `φ：${act.name}`, { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: C.ink });
        const mx = t => bx + 6 + (t + zr) / (2 * zr) * (bw - 12), my = t => by + bh - 8 - t / act.top * (bh - 16);
        k.line(bx + 4, my(0), bx + bw - 4, my(0), C.grid, { 'stroke-width': 1 });
        k.line(mx(0), by + 4, mx(0), by + bh - 4, C.grid, { 'stroke-width': 1 });
        k.polyline(Array.from({ length: 61 }, (_, i) => { const t = -zr + i / 60 * 2 * zr; return [mx(t), my(act.f(t))]; }), C.purple, { 'stroke-width': 2 });
        const zc = MP.clamp(z, -zr, zr);
        k.circle(mx(zc), my(Math.min(act.f(zc), act.top)), 4.5, C.coral, { stroke: '#fff', 'stroke-width': 1.5 });
        k.arrow(bx + bw / 2, by + bh + 2, bx + bw / 2, by + bh + 26, C.purple, 2);
        k.text(bx + bw / 2, by + bh + 44, `a = ${fmt(a, 2)}`, { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: yes ? C.blue : C.ink });
        k.text(330, 252, 'z = w₁x₁ + w₂x₂ + b，a = φ(z)', { 'font-size': 11 });
        // The weather app notification.
        k.box(316, 272, 276, 120, { fill: yes ? C.blueSoft : C.yellowSoft, title: '📱 天氣 App 推播' });
        k.text(454, 322, yes ? '☂️ 記得帶傘！' : '😎 今天不用帶傘', { 'text-anchor': 'middle', 'font-size': 21, 'font-weight': 700, fill: C.ink });
        const sub = v.act === 1 ? `神經元估計下雨機率 ${Math.round(a * 100)}%` : v.act === 0 ? `輸出 ${a}：${yes ? '1 代表帶傘' : '0 代表不帶'}` : `輸出 ${fmt(a, 2)}（大於 0 就帶傘）`;
        k.text(454, 352, sub, { 'text-anchor': 'middle', 'font-size': 13, fill: C.ink });
        k.text(454, 376, '判斷規則：分數 z > 0 ⇒ 帶傘', { 'text-anchor': 'middle', 'font-size': 11 });
        return {
          result: `${yes ? '☂️ 帶傘' : '😎 不用帶'}（z = ${sgn(z, 2)}）`,
          detail: `z = ${sgn(v.w1, 1)}×${fmt(TODAY.x1, 2)} + ${sgn(v.w2, 1)}×${fmt(TODAY.x2, 2)} + (${sgn(v.b, 1)}) = ${sgn(z, 2)}，${act.name}(${sgn(z, 2)}) = ${fmt(a, 2)}。這組權重在過去 36 天答對 ${correct} 天。`
        };
      }
    },
    // =====================================================================
    {
      id: 'backprop', track: 'llm', symbol: '∂', name: '反向傳播與連鎖律', question: 'AI 怎麼知道錯在哪？',
      title: '外送 App 預估錯了 12 分鐘：該怪哪個參數？怪多少？',
      intro: '一串齒輪連在一起：轉第一個齒輪一圈，最後一個會轉幾圈？把每一對齒輪的「倍數」<b>連乘</b>起來就知道了。AI 也一樣：答案是一步一步算出來的（前向），錯了以後，就從最後一步往回傳「如果你多 1，錯誤會多多少」，每經過一步就乘上那一步的倍數——這就是<b>連鎖律</b>，往回傳的過程叫<b>反向傳播</b>。',
      scene: '模擬：外送 App 的 AI 從「距離」預估送達時間，並用反向傳播修正自己', viewH: 420,
      chart: '上：計算圖（x＝距離 3 公里，y＝實際花了 20 分鐘；藍＝前向的值，紅＝反向的梯度）　左下：損失 L 對 w 的曲線與切線　右下：App 畫面與每一步的損失',
      caption: '模型只有兩個參數：ŷ = w·x + b（w＝每公里幾分鐘，b＝出餐時間）。損失 L = (ŷ − y)²。每走一步：w ← w − η·∂L/∂w、b ← b − η·∂L/∂b。只用一筆訂單示範，真正訓練會用成千上萬筆資料。',
      controls: [
        ['w0', '起始 w（每公里幾分鐘）', 0, 10, 0.5, 2, ''],
        ['b0', '起始 b（出餐時間）', 0, 10, 0.5, 2, '分'],
        ['lr', '學習率 η', 0.002, 0.11, 0.002, 0.01, ''],
        ['step', '已經訓練了', 0, 20, 1, 0, '步']
      ],
      play: 'step',
      try: '先按 ▶ 播放，看損失一步步變小。再把學習率 η 拉到 0.05（一步就到位）和 0.11（越走越遠，發散！）各播放一次。注意：∂L/∂w 永遠是 ∂L/∂ŷ 再乘上 x = 3。',
      resultLabel: '現在的損失 L',
      takeaway: '反向傳播＝用連鎖律，把「最後的錯誤」沿著計算的路一路乘回去，一次算出每個參數該負多少責任。',
      application: '有了每個參數的梯度，就能用梯度下降一起調整；GPT、Claude 這類參數動輒數十億到上千億的大模型，也是這樣學出來的。',
      tech: [
        ['🔥', 'PyTorch／JAX／TensorFlow', '「自動微分」：程式在前向計算時記下計算圖，呼叫 loss.backward() 就沿著圖反向乘上每一步的局部導數，自動算出所有參數的梯度。'],
        ['🤖', 'GPT／Claude／Gemini／Llama 預訓練', '每一個訓練步驟都先前向算出預測與損失，再反向傳播算出所有參數的梯度，交給 AdamW 之類的最佳化器更新——重複非常多步。'],
        ['🎨', '影像與影片生成模型', 'Stable Diffusion 這類擴散模型的訓練，同樣靠反向傳播調整去雜訊網路的參數。'],
        ['💾', '訓練大模型的記憶體技巧', '反向傳播需要前向時的中間值；記憶體不夠時，用「梯度檢查點」只存一部分，反向時再重算，用時間換空間。']
      ],
      teach: {
        grade: '國小六年級～國中九年級',
        connect: '國小「倍數」「乘法」、國中「一次函數的斜率」「乘法分配律」。連鎖律就是「倍數的倍數」：齒輪比、匯率換算（美元→台幣→日圓）都是連乘。',
        activity: '「傳話責任鏈」：5 位同學排成一排，各拿一張規則卡：×w（w = 2）、+b（b = 2）、−20、平方。第一位拿到 x = 3，依序往右算，最後一位得到損失 L = 144。接著反過來：最後一位說出自己的「局部倍數」（平方：×2e = −24），每位同學把收到的數乘上自己的倍數（加減法是 ×1）再往左傳；拿 ×w 卡的同學乘上 x = 3，得到 ∂L/∂w = −72。最後用計算機驗證：把 w 改成 2.01 重算一次，L 大約變少 0.72 嗎？',
        ask: ['為什麼加法、減法那一步的倍數是 1？', '如果 x 從 3 公里變成 10 公里，w 要負的責任會變大還是變小？', '學習率太大時，為什麼會越修越糟？'],
        myth: '「反向傳播是另一種學習方法」——其實它只是一種「很省力地算梯度」的方法；真正改參數的是之後的梯度下降（或 Adam 等）。它也不是把答案倒著算回去，而是把「責任（導數）」傳回去。'
      },
      formula: 'ŷ = wx + b，e = ŷ − y，L = e²<br>∂L/∂w = (∂L/∂e)(∂e/∂ŷ)(∂ŷ/∂w) = 2e · 1 · x，　∂L/∂b = 2e · 1 · 1<br>更新：w ← w − η ∂L/∂w，b ← b − η ∂L/∂b<br>一般：∂L/∂θ = (∂L/∂h<sub>n</sub>)(∂h<sub>n</sub>/∂h<sub>n−1</sub>)⋯(∂h<sub>k</sub>/∂θ)（向量時為 Jacobian 連乘）',
      formal: '計算圖把函數拆成基本運算，每個節點只需要知道自己的局部導數。反向模式自動微分從輸出往輸入，依序計算「向量 × Jacobian」，<b>一次反向傳遞就得到所有參數的梯度</b>，花費只是前向的幾倍（常說約 2 倍），與參數數量無關；若改用前向模式或數值差分，每個參數都要各算一次，對上千億參數完全不可行。代價是要保存前向的中間值（activation），所以大模型訓練常用梯度檢查點。本例對 (w, b) 而言損失是二次函數，誤差每步乘上 1 − 2η(x² + 1) = 1 − 20η：0 < η < 0.1 會收斂，η = 0.05 一步到位，η > 0.1 發散。真實訓練是非凸的、用小批次資料估計梯度（SGD）、搭配 AdamW 與學習率排程（暖身＋遞減）。另外只用一筆資料時，任何滿足 3w + b = 20 的 (w, b) 都能讓損失為 0，這就是為什麼需要大量資料。',
      quiz: [
        { question: '計算圖是 x → ×w → +b → −y → 平方 → L。∂L/∂w 等於什麼？', options: ['2e', '2e × x', 'x + b'], answer: 1, why: '對！從 L 往回乘：平方的倍數 2e，加減法都是 ×1，最後經過 ×w 時乘上 x。', hint: '想想「w 多 1，ŷ 會多 x」，再把它乘上 L 對 ŷ 的倍數。' },
        { question: '學習率 η 太大時最可能發生什麼？', options: ['損失一定更快變成 0', '參數來回跳、損失越來越大（發散）', '梯度會變成 0'], answer: 1, why: '對！步伐太大會跨過谷底跑到對面更高的地方，越跳越遠。試試 η = 0.11 再按播放。' }
      ],
      related: ['derivative', 'gradient', 'neuron', 'crossentropy'],
      draw(k, v) {
        const { C, fmt } = k;
        const run = bpRun(v.w0, v.b0, v.lr, v.step);
        const { w, b } = run, wx = w * BP.x, yh = wx + b, e = yh - BP.y, L = e * e;
        const gy = 2 * e, gw = gy * BP.x, gb = gy;
        const diverge = v.lr * 2 * (BP.x * BP.x + 1) > 2;
        // Computation graph.
        k.box(8, 8, 584, 202, { fill: '#f6f8f6', title: '🔗 計算圖：藍色往右算預測（前向），紅色往左傳「該怪誰」（反向）' });
        const xs = [52, 152, 252, 352, 452, 548], ny = 76, nw = 64, nh = 34;
        const labels = ['x = 3', '× w', '+ b', '− y', '( )²', 'L'];
        const fill = [C.graySoft, C.blueSoft, C.blueSoft, C.blueSoft, C.blueSoft, C.coralSoft];
        const local = ['', '∂/∂w = x', '∂/∂b = 1', '∂/∂ŷ = 1', '∂/∂e = 2e', ''];
        xs.forEach((x, i) => {
          k.rect(x - nw / 2, ny - nh / 2, nw, nh, fill[i], { rx: 8, stroke: i === 5 ? C.coral : C.blue, 'stroke-width': 1.5 });
          k.text(x, ny + 5, labels[i], { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink });
          if (local[i]) k.text(x, ny + 34, local[i], { 'text-anchor': 'middle', 'font-size': 10.5, fill: C.purple });
        });
        const fwd = ['3', `wx = ${num(wx)}`, `ŷ = ${num(yh)}`, `e = ${num(e)}`, `L = ${num(L)}`];
        const back = [null, ['∂L/∂(wx)', num(gy)], ['∂L/∂ŷ', num(gy)], ['∂L/∂e = 2e', num(gy)], ['∂L/∂L', '1']];
        for (let i = 0; i < 5; i++) {
          const a = xs[i] + nw / 2 + 2, c = xs[i + 1] - nw / 2 - 2, mid = (xs[i] + xs[i + 1]) / 2;
          k.arrow(a, ny, c, ny, C.blue, 2.5);
          k.text(mid, ny - 24, fwd[i], { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.blue });
          if (back[i]) {
            k.arrow(c, ny + 52, a, ny + 52, C.coral, 2.5);
            k.text(mid, ny + 70, back[i][0], { 'text-anchor': 'middle', 'font-size': 10.5, fill: C.coral });
            k.text(mid, ny + 84, `= ${back[i][1]}`, { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.coral });
          }
        }
        // Parameter nodes fed into ×w and +b, gradients flowing down into them.
        [[xs[1], `w = ${num(w, 2)}`], [xs[2], `b = ${num(b, 2)}`]].forEach(([x, t]) => {
          k.line(x - 6, 168, x - 6, ny + 42, C.blue, { 'stroke-width': 1.5 });
          k.arrow(x + 6, ny + 42, x + 6, 166, C.coral, 2);
          k.rect(x - 40, 170, 80, 28, C.yellowSoft, { rx: 8, stroke: C.yellow, 'stroke-width': 1.5 });
          k.text(x, 189, t, { 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700, fill: C.ink });
        });
        k.text(312, 180, `∂L/∂w = (${num(gy)}) × 3 = ${num(gw)}`, { 'font-size': 12.5, 'font-weight': 700, fill: C.coral });
        k.text(312, 198, `∂L/∂b = (${num(gy)}) × 1 = ${num(gb)}`, { 'font-size': 12.5, 'font-weight': 700, fill: C.coral });
        // Loss as a function of w (b fixed at its current value) with the tangent slope = ∂L/∂w.
        const p = k.plot({ xmin: 0, xmax: 10, ymin: 0, ymax: 400, left: 52, top: 244, width: 250, height: 128, xticks: 5, yticks: 4, xlabel: 'w（每公里幾分鐘）', ylabel: `損失 L（b 固定為 ${num(b, 2)}）`, tickFmt: t => String(Math.round(t)) });
        const Lw = t => (BP.x * t + b - BP.y) ** 2;
        const pg = k.sub(k.clip(p.left - 8, p.top - 8, p.width + 16, p.height + 8));
        pg.curve(p, Lw, C.coral, { 'stroke-width': 3 });
        if (w >= 0 && w <= 10 && L <= 400) {
          pg.curve(p, t => L + gw * (t - w), C.ink, { 'stroke-dasharray': '6 4', 'stroke-width': 2 }, Math.max(0, w - 1.2), Math.min(10, w + 1.2));
          k.dot(p, w, L, C.purple, 7);
        } else k.text(p.right, p.top + 14, '目前的點跑出圖外了', { 'text-anchor': 'end', 'font-size': 11, fill: C.coral });
        // Delivery app with prediction bars and the per-step loss history.
        k.box(318, 222, 274, 190, { title: '🛵 外送 App：3 公里外的訂單' });
        const barX = 380, scale = 180 / 40;
        k.text(330, 256, 'AI 預估', { 'font-size': 11.5, fill: C.ink });
        k.rect(barX, 245, MP.clamp(yh, 0, 40) * scale, 14, C.purple, { rx: 3 });
        k.text(MP.clamp(barX + MP.clamp(yh, 0, 40) * scale + 6, barX + 6, 580), 256, `${num(yh)} 分`, { 'font-size': 11.5, 'font-weight': 700, fill: C.purple, ...halo });
        k.text(330, 280, '實際', { 'font-size': 11.5, fill: C.ink });
        k.rect(barX, 269, BP.y * scale, 14, C.green, { rx: 3 });
        k.text(barX + BP.y * scale + 6, 280, `${BP.y} 分`, { 'font-size': 11.5, 'font-weight': 700, fill: C.green });
        k.text(330, 308, '每一步的損失（對數高度，紫＝已走過）', { 'font-size': 11 });
        const hmax = Math.log10(1 + Math.max(...run.hist)), base = 388;
        run.hist.forEach((h, i) => {
          const hh = Math.max(1.5, 62 * Math.log10(1 + h) / (hmax || 1));
          k.rect(332 + i * 12, base - hh, 9, hh, i <= v.step ? (i === v.step ? C.coral : C.purple) : '#dfe5e2', { rx: 2 });
        });
        k.text(332, 404, '第 0 步', { 'font-size': 10 });
        k.text(582, 404, diverge ? '⚠️ 發散中' : '第 20 步', { 'text-anchor': 'end', 'font-size': 10, fill: diverge ? C.coral : C.muted });
        const nw2 = w - v.lr * gw, nb2 = b - v.lr * gb;
        return {
          result: `L = ${num(L, 1)}`,
          detail: `ŷ = ${num(w, 2)}×3 + ${num(b, 2)} = ${num(yh, 2)}，e = ${num(e, 2)}，L = e² = ${num(L, 1)}。∂L/∂w = 2e·x = ${num(gw, 1)}，∂L/∂b = 2e = ${num(gb, 1)}；下一步 w → ${num(nw2, 2)}、b → ${num(nb2, 2)}。${diverge ? '學習率太大：每一步都跨過頭，越跳越遠！' : ''}`
        };
      }
    },
    // =====================================================================
    {
      id: 'crossentropy', track: 'llm', symbol: 'H', name: '交叉熵與困惑度', question: 'AI 猜錯要扣幾分？',
      title: '「猜下一個字」大賽：AI 越驚訝，扣分越多',
      intro: '玩「猜下一個字」：如果你很有把握某個字會出現，結果真的出現，一點也不驚訝；如果你覺得它幾乎不可能，它卻出現了，你就會<b>超級驚訝</b>。AI 的成績單就是「平均有多驚訝」，用 −log₂ p 來量（單位是 bits）：機率 1/2 扣 1 分、1/4 扣 2 分、1/8 扣 3 分⋯⋯這就是<b>交叉熵</b>。把它換回「好像在幾個字裡亂猜」，就是<b>困惑度</b>。',
      scene: '模擬：語言模型讀一句話，逐字預測並計算訓練用的損失', viewH: 420,
      chart: '上：每個字的卡片（綠條＝模型給正確字的機率 p，下面是驚訝 −log₂p）　左下：驚訝曲線　右下：困惑度＝好像在幾個字裡亂猜',
      caption: '每張卡片是「讀完前面的字後，模型給『正確下一個字』的機率」。前 7 個字的機率由所選模型決定，最後一個字「籃球」的機率由滑桿控制。為了好懂，一個詞當一個 token；真實模型的 token 切法不同。',
      controls: [
        ['p', '模型給「籃球」的機率 p', 0.01, 1, 0.01, 0.5, ''],
        { key: 'model', label: '換一個模型', options: ['自信又準', '猶豫不決', '自信卻猜錯'], value: 0 }
      ],
      try: '把 p 從 1 慢慢降到 0.01：扣分是「慢慢變多」還是「突然暴增」？再切到「自信卻猜錯」：大部分字都猜得很準，平均成績卻比你想的差很多，為什麼？',
      resultLabel: '這句話的困惑度',
      takeaway: '交叉熵＝平均驚訝程度；猜對但不確定只扣一點，「很有把握卻猜錯」會被重罰。',
      application: '訓練 LLM 就是調整參數，讓它對真實文字的平均驚訝越來越小；困惑度越低，代表越會「猜下一個字」。',
      tech: [
        ['🤖', 'GPT／Claude／Gemini／Llama 預訓練', '預訓練的目標函數就是「下一個 token」的平均交叉熵（用自然對數，單位 nats）；困惑度是比較同一套 tokenizer 下模型好壞的常用指標。'],
        ['🗜️', '資料壓縮', '算術編碼替每個符號花大約 −log₂p 個位元，預測越準檔案越小；H.264／H.265 影片壓縮裡的 CABAC 就是一種算術編碼。DeepMind 2023 年的研究也示範了 LLM 可以當成強大的壓縮器。'],
        ['🖼️', '影像分類與語音辨識', '辨識貓狗、辨識語音的網路，訓練時也是用 softmax 加交叉熵：正確答案的機率越高，損失越小。'],
        ['🌦️', '機率預報的評分', '氣象與預測市場可用「對數分數」評估機率預報：說 90% 會下雨卻沒下，會被扣很多分，鼓勵預報員誠實給機率。']
      ],
      teach: {
        grade: '國小五年級～國中九年級',
        connect: '國小「分數」「機率的直觀」、國中「機率」「2 的次方」；高中的對數 log₂ 就是「要對折幾次」。1/8 = (1/2)³，所以驚訝 3 bits。',
        activity: '老師準備一句話（例如「下課後我們去操場打球」），一次只露出一個字。每組有 8 枚籌碼，在黑板上 3～4 個候選字上押注（可以分散押，也可以有些字完全不押）。揭曉後，正確字上有 k 枚，就查「驚訝表」扣分：8 枚→0、4 枚→1、2 枚→2、1 枚→3、0 枚→淘汰（無限大）；其他數量用 −log₂(k/8) 查表（3 枚 1.4、5 枚 0.7、6 枚 0.4、7 枚 0.2）。整句總扣分最少的組獲勝，最後算平均扣分 h 和 2^h。',
        ask: ['為什麼把籌碼全押一個字很冒險？', '總是平均押在 4 個字上，平均扣幾分？困惑度是多少？', '如果一組每次都猜中而且全押，困惑度是多少？'],
        myth: '「只要多數字都猜對，成績就很好」——交叉熵是取 log 再平均，只要有一個字給了接近 0 的機率，扣分就會暴增，把平均拉高。所以好的模型不能「過度自信」。'
      },
      formula: 'H(p, q) = −Σ<sub>x</sub> p(x) log q(x)　（p 為真實分布，q 為模型）<br>one-hot 目標：ℓ<sub>t</sub> = −log q(x<sub>t</sub> | x<sub>&lt;t</sub>)，L = (1/T) Σ<sub>t</sub> ℓ<sub>t</sub><br>困惑度 PPL = 2<sup>L<sub>bits</sub></sup> = e<sup>L<sub>nats</sub></sup><br>對 logits 的梯度：∂ℓ/∂z = softmax(z) − onehot(x<sub>t</sub>)',
      formal: 'x<sub>t</sub> 是第 t 個 token，q(· | x<sub>&lt;t</sub>) 是模型讀完前文後輸出的機率分布。訓練時目標分布 p 是 one-hot（只有真實下一個字為 1），所以交叉熵只剩 −log q(正確字)；最小化它等價於<b>最大概似估計</b>。H(p, q) = H(p) + KL(p‖q) ≥ H(p)：損失不可能低於語言本身的熵，多出來的部分 KL 就是模型的「不夠好」。實務用自然對數（nats），1 nat ≈ 1.443 bits，但困惑度數值相同。均勻地在 k 個字裡亂猜時 PPL = k，所以困惑度可解讀為「有效選項數」。依照夏農的編碼定理，−log₂ q 也是用這個模型壓縮時每個字要花的位元數，所以「好的預測器＝好的壓縮器」。當 q → 0 時損失 → ∞，實務上會用 label smoothing 或機率下限避免數值問題。對 logits 的梯度 softmax − onehot 非常簡潔，是 softmax 與交叉熵總是搭配使用的原因。限制：困惑度依賴 tokenizer 與資料集，不同模型、不同切字法之間不能直接比。本模擬的機率是直接給定的，不是由網路計算。',
      quiz: [
        { question: '模型給正確字的機率是 1/8，它的「驚訝」是幾 bits？', options: ['1/8', '3', '8'], answer: 1, why: '對！−log₂(1/8) = 3，因為 1/8 = (1/2)³，要對折 3 次。', hint: '想想 1/8 是 1/2 乘自己幾次。' },
        { question: '一個模型的困惑度是 4，最貼切的解讀是？', options: ['它平均好像在 4 個字裡亂猜', '它有 4% 的字猜錯', '它每句話要猜 4 次'], answer: 0, why: '對！困惑度 = 2^(平均 bits)，等於「均勻亂猜時的選項數」。' }
      ],
      related: ['probability', 'exponential', 'token', 'softmax'],
      draw(k, v) {
        const { C, fmt } = k;
        const model = CE_MODELS[v.model];
        const ps = [...model.p, v.p], bits = ps.map(p => -Math.log2(p));
        const avg = bits.reduce((a, b) => a + b, 0) / bits.length, ppl = 2 ** avg;
        k.text(10, 18, '📝 AI 讀這句話，一個字一個字猜：「今天放學後我們去公園打籃球」', { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        CE_WORDS.forEach((word, i) => {
          const x = 12 + i * 73, last = i === 7, p = ps[i], hot = bits[i] >= 3;
          k.rect(x, 30, 66, 172, last ? C.purpleSoft : '#fff', { rx: 8, stroke: last ? C.purple : '#dce2df', 'stroke-width': last ? 2.5 : 1.5 });
          k.text(x + 33, 54, word, { 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: C.ink });
          k.rect(x + 18, 64, 30, 80, C.graySoft, { rx: 3 });
          k.rect(x + 18, 144 - p * 80, 30, p * 80, p < 0.1 ? C.coral : C.green, { rx: 3 });
          k.text(x + 33, 160, `p = ${fmt(p, 2)}`, { 'text-anchor': 'middle', 'font-size': 11 });
          k.text(x + 33, 177, `${fmt(bits[i], 2)} bits`, { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: hot ? C.coral : C.ink });
          const note = model.bet[i] ? `押「${model.bet[i]}」` : last ? '↑ 滑桿' : '';
          if (note) k.text(x + 33, 194, note, { 'text-anchor': 'middle', 'font-size': 10.5, fill: last ? C.purple : C.coral, 'font-weight': 700 });
        });
        // Surprise curve −log₂ p.
        const pl = k.plot({ xmin: 0, xmax: 1, ymin: 0, ymax: 7, left: 52, top: 242, width: 262, height: 128, xticks: 4, yticks: 7, xlabel: '給正確字的機率 p', ylabel: '驚訝 −log₂ p（bits）', tickFmt: t => (t <= 1 && t > 0 && t % 1 ? fmt(t, 2) : String(Math.round(t))) });
        k.curve(pl, t => -Math.log2(t), C.coral, { 'stroke-width': 3 }, 0.0078, 1);
        ps.slice(0, 7).forEach(p => k.dot(pl, p, -Math.log2(p), C.gray, 4));
        k.line(pl.x(v.p), pl.y(0), pl.x(v.p), pl.y(bits[7]), C.purple, { 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
        k.line(pl.x(0), pl.y(bits[7]), pl.x(v.p), pl.y(bits[7]), C.purple, { 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
        k.dot(pl, v.p, bits[7], C.purple, 7);
        // Perplexity panel.
        k.box(332, 224, 260, 188, { title: '🎲 困惑度：好像在幾個字裡亂猜？' });
        k.text(346, 262, `平均驚訝 = ${fmt(avg, 2)} bits／字`, { 'font-size': 13, fill: C.ink });
        k.text(346, 288, `困惑度 = 2^${fmt(avg, 2)} ≈ ${fmt(ppl, 1)}`, { 'font-size': 16, 'font-weight': 700, fill: C.purple });
        const nCards = Math.max(1, Math.round(ppl));
        for (let i = 0; i < Math.min(nCards, 18); i++) {
          const cx = 346 + (i % 9) * 26, cy = 302 + Math.floor(i / 9) * 30;
          k.rect(cx, cy, 21, 25, i === 0 ? C.purple : C.purpleSoft, { rx: 4, stroke: C.purple, 'stroke-width': 1 });
          k.text(cx + 10.5, cy + 17, '?', { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: i === 0 ? '#fff' : C.purple });
        }
        k.text(346, 380, `≈ 每個字都在 ${fmt(ppl, 1)} 個候選裡亂猜`, { 'font-size': 12, fill: C.ink });
        k.text(346, 400, `用它壓縮整句約需 ${fmt(avg * 8, 1)} 個位元`, { 'font-size': 11 });
        return {
          result: `困惑度 ≈ ${fmt(ppl, 2)}`,
          detail: `「籃球」：−log₂(${fmt(v.p, 2)}) = ${fmt(bits[7], 2)} bits。8 個字平均 ${fmt(avg, 2)} bits，2^${fmt(avg, 2)} ≈ ${fmt(ppl, 2)}：好像每個字都在約 ${fmt(ppl, 1)} 個字裡亂猜。`
        };
      }
    },
    // =====================================================================
    {
      id: 'lora', track: 'llm', symbol: 'BA', name: '低秩分解（LoRA）', question: 'AI 怎麼便宜地學新技能？',
      title: '九九乘法表只要 18 個數就能記住——LoRA 用同一招微調 AI',
      intro: '九九乘法表有 81 格，但你其實只要記住「1 到 9」一排、「1 到 9」一列，任何一格都是「這列 × 那行」——一張大表竟然只靠兩條小紙條！這種表叫做<b>秩 1</b> 矩陣。想讓 AI 學會寫台語童詩，不必改動它幾十億個參數，只要學兩個很瘦的小矩陣 B 和 A，相乘補到原本的大矩陣上就好，這就是 <b>LoRA</b>。',
      scene: '模擬：用 LoRA 把語言模型微調成「會寫台語童詩」，只訓練一對小矩陣', viewH: 420,
      chart: '上：B（直條）× A（橫條）= B·A，和要學的目標表比較（藍＝正、紅＝負，顏色越深數字越大）　左下：秩 r 與誤差　右下：真實模型的參數量',
      caption: '「目標 ΔW」是假想中全部重新訓練時，某一層 8×8 權重應該改變的量；這裡用 SVD 找出秩 r 的最佳近似（數學上誤差最小的那一對 B、A）。右下用 d = 4096（許多 7B 等級模型一層的寬度）計算參數量。',
      controls: [
        ['r', '秩 r（小矩陣有幾條）', 1, 8, 1, 1, ''],
        { key: 'mat', label: '要拼出的表', options: ['微調要改的量 ΔW', '乘法表（1～8）'], value: 0 }
      ],
      try: '先選「乘法表」：r = 1 誤差就是 0%！換成「微調要改的量」，把 r 從 1 調到 4，誤差掉得多快？再看右下：r = 8 時要訓練的參數只有全部的百分之幾？',
      resultLabel: 'B·A 和目標的差距',
      takeaway: '很多大矩陣其實「有效資訊」很少，可以寫成幾個「直條 × 橫條」相加；LoRA 只學這幾條，就省下 99% 以上的訓練參數。',
      application: '凍結原模型、只存 LoRA 的小矩陣，一個基礎模型就能掛上許多不同的「技能包」，隨時切換。',
      tech: [
        ['🎨', 'Stable Diffusion／FLUX 畫風 LoRA', '社群分享的畫風、角色 LoRA 檔通常只有幾 MB 到幾百 MB，套在同一個基礎模型上就能換風格，不必下載整個模型。'],
        ['🦙', '開源 LLM 微調（Llama、Mistral、Qwen⋯）', 'Hugging Face 的 PEFT 函式庫用 LoRA 微調大型語言模型；QLoRA 再把凍結的權重量化成 4 位元，讓單張 GPU 就能微調數百億參數的模型。'],
        ['🍎', 'Apple Intelligence', 'Apple 說明其裝置端基礎模型用 LoRA 轉接器（adapter）切換摘要、校對、改寫等不同任務，共用同一個基礎模型。'],
        ['🎬', '推薦系統', '「使用者 × 影片」的評分大表可以近似成低秩矩陣（矩陣分解），Netflix Prize 時代起就是推薦演算法的核心想法之一。']
      ],
      teach: {
        grade: '國小三年級（乘法表）～國中九年級',
        connect: '國小「九九乘法表」「乘法」、國中「規律與數列」；大學線性代數的「外積」「矩陣的秩」「奇異值分解（SVD）」。',
        activity: '發 8×8 方格紙，請學生填 1～8 的乘法表（64 格）。問：「最少只要告訴你哪幾個數，就能重建整張表？」引導出一條直紙條（1～8）和一條橫紙條（1～8），共 16 個數。第二步：老師在黑板貼一張「乘法表＋棋盤格」的表（黑格 +1、白格 −1）。請各組想：再加一對紙條（直條 +1、−1 交錯；橫條 +1、−1 交錯）相乘能補出棋盤格嗎？得出「兩對紙條＝秩 2」。最後比較：64 個數 vs 2×16 = 32 個數。',
        ask: ['為什麼乘法表的每一列都是第一列的倍數？', '一張隨便亂填的 8×8 表，要幾對紙條才能完全拼出來？', '如果表是 4096×4096，兩條紙條共有幾個數？省下多少？'],
        myth: '「LoRA 是把模型壓縮變小」——LoRA 並不縮小原模型，原本的大矩陣 W 全部保留、只是凍結；它縮小的是「要訓練、要另外存的那份改變量」。想讓模型本身變小要用量化或蒸餾。'
      },
      formula: '外積（秩 1）：(uv<sup>T</sup>)<sub>ij</sub> = u<sub>i</sub>v<sub>j</sub>，乘法表 = [1…8]<sup>T</sup>[1…8]<br>LoRA：h = W<sub>0</sub>x + (α/r)·B A x，　B ∈ ℝ<sup>d×r</sup>，A ∈ ℝ<sup>r×k</sup>，r ≪ min(d, k)<br>參數量：d·k → r(d + k)　（d = k = 4096, r = 8：16,777,216 → 65,536）<br>Eckart–Young：min<sub>rank(X)≤r</sub> ‖M − X‖<sub>F</sub> = √(σ<sub>r+1</sub>² + ⋯ + σ<sub>n</sub>²)',
      formal: '任何矩陣都可寫成 SVD：M = Σ σ<sub>i</sub> u<sub>i</sub> v<sub>i</sub><sup>T</sup>（σ<sub>1</sub> ≥ σ<sub>2</sub> ≥ ⋯ ≥ 0），每一項是一個「直條 × 橫條」的秩 1 矩陣；只保留前 r 項就是 Frobenius 範數下最好的秩 r 近似（Eckart–Young–Mirsky 定理）。LoRA（Hu 等人，2021）觀察到：預訓練模型在微調時，權重的改變量 ΔW 往往有很低的「內在秩」。因此凍結原權重 W<sub>0</sub>，只訓練 B 與 A；B 初始化為 0，所以一開始模型和原本完全相同；α/r 是縮放係數。訓練完可把 W<sub>0</sub> + (α/r)BA 合併回一個矩陣，推論時不增加延遲。LoRA 常加在注意力的投影矩陣（W<sub>q</sub>、W<sub>k</sub>、W<sub>v</sub>、W<sub>o</sub>），也常加在 MLP；r 常見 4～64。QLoRA（Dettmers 等人，2023）把 W<sub>0</sub> 存成 4 位元 NF4、LoRA 部分用 16 位元訓練。<b>本模擬的簡化</b>：真實 LoRA 並不知道 ΔW，也不做 SVD，而是用反向傳播直接學 B 和 A；這裡用 SVD 展示「秩 r 最多能做到多好」。若 ΔW 本身不是低秩（例如要學全新語言），小 r 就會不夠。',
      quiz: [
        { question: '一張 4096×4096 的權重矩陣，用 r = 8 的 LoRA，要訓練多少個參數？', options: ['4096 × 4096 = 16,777,216', '2 × 4096 × 8 = 65,536', '8 × 8 = 64'], answer: 1, why: '對！B 是 4096×8、A 是 8×4096，共 65,536 個，不到原本的 0.4%。' },
        { question: '九九乘法表為什麼是「秩 1」？', options: ['因為每一格都等於某一列的數 × 某一行的數', '因為表裡只有一個 1', '因為它是正方形'], answer: 0, why: '對！整張表 = 直條 [1…9] 和橫條 [1…9] 的外積，只要一對紙條。', hint: '試試在左邊選「乘法表」，看 r = 1 時的誤差。' }
      ],
      related: ['matrix', 'eigen', 'quantization', 'attention'],
      draw(k, v) {
        const { C, fmt } = k;
        const r = v.r, data = LORA[v.mat], n = 8, cell = 12, size = n * cell;
        const comps = data.comps.slice(0, r), approx = data.approx[r], err = data.err[r];
        const B = Array.from({ length: n }, (_, i) => comps.map(c => c.u[i] * Math.sqrt(c.s)));
        const A = comps.map(c => c.v.map(x => x * Math.sqrt(c.s)));
        const bMax = Math.max(1e-9, ...B.flat().map(Math.abs)), aMax = Math.max(1e-9, ...A.flat().map(Math.abs));
        const resid = data.M.map((row, i) => row.map((m, j) => m - approx[i][j]));
        const grid = (x0, y0, M, max) => {
          M.forEach((row, i) => row.forEach((val, j) => k.rect(x0 + j * cell, y0 + i * cell, cell, cell, heatColor(val, max), { stroke: '#fff', 'stroke-width': 0.6 })));
          k.rect(x0, y0, M[0].length * cell, M.length * cell, 'none', { stroke: C.axis, 'stroke-width': 1 });
        };
        k.text(10, 18, '🧮 兩條瘦長的小矩陣相乘 B·A，拼出一整張表', { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        const slots = [16, 134, 252, 370, 488], ty = 52;
        grid(slots[0], ty, B, bMax);
        grid(slots[1], ty, A, aMax);
        grid(slots[2], ty, approx, data.max);
        grid(slots[3], ty, data.M, data.max);
        grid(slots[4], ty, resid, data.max);
        const heads = [`B（8×${r}）`, `A（${r}×8）`, `B·A（秩 ${r}）`, v.mat ? '乘法表' : '目標 ΔW', '誤差（目標 − B·A）'];
        heads.forEach((h, i) => k.text(slots[i], 44, h, { 'font-size': 11.5, 'font-weight': 700, fill: i < 3 ? C.purple : C.ink }));
        ['×', '=', '≈', ' '].forEach((s, i) => k.text(slots[i] + size + 11, ty + size / 2 + 6, s, { 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: C.ink }));
        const subs = [`${8 * r} 個數`, `${8 * r} 個數`, `共 ${16 * r} 個數`, '64 個數', `差 ${fmt(err * 100, 1)}%`];
        subs.forEach((s, i) => k.text(slots[i], ty + size + 18, s, { 'font-size': 11.5, fill: i === 4 ? (err < 0.05 ? C.green : C.coral) : C.muted, 'font-weight': i === 4 ? 700 : 400 }));
        // Error vs rank bars.
        const p = k.plot({ xmin: 0.4, xmax: 8.6, ymin: 0, ymax: 100, left: 52, top: 214, width: 240, height: 150, xticks: 1, yticks: 4, tickFmt: t => (t % 1 ? '' : String(t)), xlabel: '秩 r', ylabel: '剩下的誤差（%）' });
        for (let i = 1; i <= 8; i++) {
          const e = data.err[i] * 100, x = p.x(i);
          k.rect(x - 10, p.y(e), 20, p.y(0) - p.y(e), i === r ? C.purple : C.purpleSoft, { rx: 2 });
          k.text(x, p.bottom + 16, String(i), { 'text-anchor': 'middle', 'font-size': 11, fill: i === r ? C.purple : C.muted, 'font-weight': i === r ? 700 : 400 });
        }
        k.text(p.x(r), p.y(err * 100) - 6, `${fmt(err * 100, 1)}%`, { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: C.purple, ...halo });
        // Real model scene: frozen W plus the trainable strips.
        k.box(318, 196, 274, 216, { title: '🐸 微調成「會寫台語童詩」的 AI' });
        k.rect(332, 228, 92, 92, '#cfd6d3', { rx: 4 });
        k.text(378, 268, 'W（凍結）', { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.ink });
        k.text(378, 286, '🔒 4096×4096', { 'text-anchor': 'middle', 'font-size': 10.5, fill: C.ink });
        k.text(438, 280, '+', { 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: C.ink });
        const bw = 3 + 1.6 * r;
        k.rect(452, 228, bw, 92, C.purple, { rx: 2 });
        k.text(452 + bw / 2, 334, 'B', { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: C.purple });
        k.rect(452 + bw + 8, 228, 92, bw, C.purple, { rx: 2 });
        k.text(452 + bw + 54, 228 + bw + 14, `A（${r}×4096）`, { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: C.purple });
        const full = 4096 * 4096, lora = 2 * 4096 * r, ratio = lora / full;
        k.text(332, 354, `全部重訓：${comma(full)} 個`, { 'font-size': 12, fill: C.ink });
        k.text(332, 372, `LoRA：2×4096×${r} = ${comma(lora)} 個`, { 'font-size': 12, 'font-weight': 700, fill: C.purple });
        k.rect(332, 381, 246, 9, '#cfd6d3', { rx: 3 });
        k.rect(332, 381, Math.max(2, 246 * ratio), 9, C.purple, { rx: 2 });
        k.text(332, 405, `只訓練約 ${fmt(ratio * 100, 2)}%（每一層）`, { 'font-size': 11.5, 'font-weight': 700, fill: C.purple });
        return {
          result: `誤差 ${fmt(err * 100, 1)}%`,
          detail: `秩 ${r}：B（8×${r}）和 A（${r}×8）共 ${16 * r} 個數，拼出 64 格的表，剩下 ${fmt(err * 100, 1)}% 的差距。換成 4096×4096 的真實權重：${comma(lora)} ÷ ${comma(full)} ≈ ${fmt(ratio * 100, 2)}%。`
        };
      }
    },
    // =====================================================================
    {
      id: 'quantization', track: 'llm', symbol: '≈', name: '量化', question: 'AI 怎麼塞進手機？',
      title: '70 億個數字要放進手機：每個數字只用 4 個位元記，夠嗎？',
      intro: '量身高時，記到「0.01 公分」很精確，但很佔筆記本；記到「整數公分」就省很多，誤差也小到沒人在意。AI 模型裡有幾十億個權重，原本每個用 16 位元記錄。<b>量化</b>就是把它們「四捨五入到比較粗的格子上」：4 位元只有 15 個格子，模型大小變成原本的四分之一，就塞得進手機了。',
      scene: '模擬：把語言模型的權重四捨五入成低位元，看它放不放得進 8 GB 手機', viewH: 420,
      chart: '左上：權重分布與量化格子（紫線）　左下：四捨五入的階梯　右：手機記憶體與品質',
      caption: '800 個權重取自鐘形（常態）分布，用對稱 absmax 方法：最大的 |w| 對到最外側格子，共 2^b − 1 個等距格子。模型大小 = 參數 × 位元 ÷ 8（忽略執行時的其他記憶體）；假設 8 GB 手機中系統與其他 App 約占一半。',
      controls: [
        ['bits', '每個權重用幾位元 b', 2, 16, 1, 4, '位元'],
        { key: 'model', label: '模型大小（參數）', options: ['10 億', '30 億', '70 億', '700 億'], value: 2 }
      ],
      try: '把位元數從 16 一路降到 2：模型變多小？誤差從哪一格開始突然變大？再找出「70 億參數的模型要放進手機，最多能用幾位元」。換成 700 億試試看。',
      resultLabel: '模型大小',
      takeaway: '量化＝用比較粗的格子記數字：每少 1 位元，格子變粗一倍、檔案少一截，誤差大約加倍。',
      application: '目前 4～8 位元通常是品質與大小的甜蜜點；更低的位元需要更聰明的方法（分組縮放、保護重要權重、訓練時就考慮量化）。',
      tech: [
        ['🦙', 'llama.cpp／GGUF、Ollama', '把開源模型存成 4～8 位元（例如 Q4_K_M、Q8_0）的檔案，讓一般筆電也能直接跑 70～80 億參數的模型；每一小組權重共用一個縮放係數。'],
        ['📱', '手機上的 AI', 'Google 的 Gemini 技術報告說 Nano 模型以 4 位元量化部署；Apple Intelligence 的裝置端模型 2024 年版混用 2 與 4 位元（平均約 3.5～3.7 位元），2025 年版用量化感知訓練壓到約 2 位元，才能在手機記憶體裡執行。'],
        ['🎮', 'GPU 的 INT8／FP8／FP4 運算', 'NVIDIA H100 的 Tensor Core 支援 FP8，Blackwell 世代再加入 FP4；位元越少，同樣的晶片每秒能做越多次乘法，推論更快更省電。'],
        ['🎵', '數位音樂與照片', 'CD 音質每個取樣用 16 位元（65,536 階），一般照片每個顏色 8 位元（256 階）——同樣是把連續的數值四捨五入到格子上。']
      ],
      teach: {
        grade: '國小四年級～國中八年級',
        connect: '國小「四捨五入」「概數」「2 的倍數」、國中「誤差」「科學記號」「統計圖表（直方圖）」。b 位元可以表示 2 的 b 次方種狀態。',
        activity: '請每組量 10 位同學的身高到 0.1 公分（或使用老師給的資料）。依三種「格子」重新記錄：每 1 公分、每 5 公分、每 20 公分（四捨五入到最近的格子）。算出每人的誤差與平均誤差；再數一數每種記法用到幾種不同的值，換算要幾個位元（2 種→1 位元、4 種→2 位元、8 種→3 位元⋯）。最後討論：哪一種格子最省、哪一種還「夠用」？',
        ask: ['從 16 位元變 4 位元，檔案變成原本的幾分之幾？', '如果有一個權重特別大（離群值），格子會怎樣？其他權重會受什麼影響？', '為什麼 2 位元時，大部分權重都變成 0？'],
        myth: '「4 位元的模型就是 16 位元的模型 4 倍爛」——誤差是被四捨五入的「小尾巴」，大多數權重只差一點點；做得好的 4 位元量化，表現常常和原模型差不多。但位元太低（例如 2 位元）時，誤差就會明顯傷害品質。'
      },
      formula: 's = max|w| / (2<sup>b−1</sup> − 1)，　q = round(w / s) ∈ {−(2<sup>b−1</sup>−1), …, 2<sup>b−1</sup>−1}，　ŵ = s·q<br>誤差 |w − ŵ| ≤ s/2，均方根誤差 ≈ s/√12<br>每多 1 位元：s 減半，訊號雜訊比 SQNR 約 +6.02 dB<br>記憶體 ≈ 參數數量 × b ÷ 8 位元組',
      formal: 'w 為原權重，s 為縮放係數（格子寬度），q 為存下來的整數，ŵ 為還原後的值。這是<b>對稱、逐張量（per-tensor）的 absmax 均勻量化</b>。若捨入誤差在格子內近似均勻分布，均方誤差為 s²/12，所以每多 1 位元誤差約減半（約 6 dB）。<b>真實系統更精細</b>：(1) 分組量化：每 16～128 個權重共用一組縮放係數（GGUF k-quants、GPTQ、AWQ），減少離群值把格子撐大的問題，因此「4 位元」實際平均略多於 4 位元；(2) 非均勻格子：QLoRA 的 NF4 依常態分布的分位數放格子；FP8（E4M3／E5M2）、BF16 等浮點格式在 0 附近格子較密；(3) GPTQ 用二階資訊補償誤差，AWQ 依激活值保護重要權重，LLM.int8() 把離群特徵留在高精度；(4) 量化感知訓練（QAT）在訓練時就模擬捨入。記憶體估計未包含 KV cache、激活值與程式本身，實際需求更大。本模擬以整數格子示意 16 位元，實務上 16 位元通常是 FP16／BF16 浮點。',
      quiz: [
        { question: '70 億參數的模型用 4 位元存，權重大約佔多少記憶體？', options: ['約 3.5 GB', '約 28 GB', '約 14 GB'], answer: 0, why: '對！7×10⁹ × 4 ÷ 8 = 3.5×10⁹ 位元組 ≈ 3.5 GB。16 位元則是 14 GB。', hint: '位元組 = 參數 × 位元 ÷ 8。' },
        { question: '把位元數從 8 降到 7，量化格子的寬度會？', options: ['不變', '大約變成 2 倍', '大約變成一半'], answer: 1, why: '對！格子數量少一半，同樣的範圍要分給更少的格子，每格寬度約加倍，誤差也約加倍。' }
      ],
      related: ['fraction', 'statistics', 'lora', 'scaling'],
      draw(k, v) {
        const { C, fmt } = k;
        const b = v.bits, L = 2 ** (b - 1) - 1, s = QMAX / L, count = 2 * L + 1;
        const quant = w => MP.clamp(Math.round(w / s), -L, L) * s;
        let se = 0, zeros = 0;
        QW.forEach(w => { const q = quant(w); se += (w - q) ** 2; if (q === 0) zeros++; });
        const rmse = Math.sqrt(se / QW.length), rel = rmse / QRMS, sqnr = 20 * Math.log10(QRMS / Math.max(rmse, 1e-12));
        // Histogram with the quantization grid.
        const hmax = Math.max(...QHIST);
        const hp = k.plot({ xmin: -0.08, xmax: 0.08, ymin: 0, ymax: Math.ceil(hmax / 20) * 20, left: 50, top: 32, width: 270, height: 110, xticks: 4, yticks: 2, tickFmt: t => (t === 0 ? '0' : Math.abs(t) < 1 ? fmt(t, 2) : String(Math.round(t))), xlabel: '權重的值', ylabel: '權重個數' });
        if (count <= 63) for (let q = -L; q <= L; q++) {
          k.line(hp.x(q * s), hp.top, hp.x(q * s), hp.bottom, C.purple, { 'stroke-width': 1, opacity: 0.35 });
          k.polygon([[hp.x(q * s), hp.bottom - 7], [hp.x(q * s) - 4, hp.bottom], [hp.x(q * s) + 4, hp.bottom]], C.purple);
        }
        QHIST.forEach((c, i) => k.rect(hp.x(-0.08 + i * 0.004) + 0.5, hp.y(c), hp.x(0.004) - hp.x(0) - 1, hp.y(0) - hp.y(c), '#b7c2bd', { opacity: 0.85 }));
        k.text(hp.right, hp.top - 9, count <= 63 ? `紫線＝${count} 個格子` : `${comma(count)} 個格子（密到畫不出來）`, { 'text-anchor': 'end', 'font-size': 11, fill: C.purple, 'font-weight': 700 });
        // Staircase: original → stored value.
        const sp = k.plot({ xmin: -0.08, xmax: 0.08, ymin: -0.08, ymax: 0.08, left: 50, top: 216, width: 270, height: 150, xticks: 4, yticks: 4, tickFmt: t => (Math.abs(t) < 1e-9 ? '0' : fmt(t, 2)), xlabel: '原本的權重 w', ylabel: '存起來的值 ŵ' });
        k.curve(sp, t => t, C.gray, { 'stroke-width': 1.5, 'stroke-dasharray': '5 5' });
        k.curve(sp, quant, C.purple, { 'stroke-width': 2.5 }, -0.08, 0.08, 800);
        // Phone with RAM bar.
        const m = Q_MODELS[v.model], gb = m.n * b / 8 / 1e9, avail = 4, fits = gb <= avail;
        k.box(334, 8, 258, 404, { title: `📱 ${m.label}參數的模型放得進手機嗎？` });
        k.rect(352, 36, 92, 196, C.ink, { rx: 14 });
        k.rect(358, 48, 80, 170, '#fff', { rx: 4 });
        const ramTop = 56, ramBot = 210, perGB = (ramBot - ramTop) / 8;
        k.rect(372, ramTop, 52, ramBot - ramTop, C.graySoft, { stroke: C.axis, 'stroke-width': 1 });
        k.rect(372, ramBot - 4 * perGB, 52, 4 * perGB, '#cfd6d3');
        k.text(398, ramBot - 2 * perGB + 4, '系統+App', { 'text-anchor': 'middle', 'font-size': 10, fill: C.ink });
        const mh = Math.min(gb, 4) * perGB;
        k.rect(372, ramBot - 4 * perGB - mh, 52, mh, fits ? C.purple : C.coral);
        if (mh > 14) k.text(398, ramBot - 4 * perGB - mh / 2 + 4, 'AI 模型', { 'text-anchor': 'middle', 'font-size': 10, fill: '#fff', 'font-weight': 700 });
        k.text(398, 228, '8 GB', { 'text-anchor': 'middle', 'font-size': 10, fill: '#fff' });
        k.text(456, 60, '模型大小', { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        k.text(456, 80, `${m.label} × ${b} ÷ 8`, { 'font-size': 12, fill: C.ink });
        k.text(456, 102, `= ${gb >= 10 ? fmt(gb, 1) : fmt(gb, 2)} GB`, { 'font-size': 16, 'font-weight': 700, fill: fits ? C.purple : C.coral });
        k.text(456, 128, '可用約 4 GB', { 'font-size': 12 });
        k.text(456, 156, fits ? '✅ 放得進！' : '❌ 放不下', { 'font-size': 15, 'font-weight': 700, fill: fits ? C.green : C.coral });
        if (!fits) k.text(456, 176, `是可用空間的 ${fmt(gb / avail, 1)} 倍`, { 'font-size': 12, fill: C.coral });
        // Quality numbers and common formats.
        k.text(348, 258, `格子寬度 s = ${s < 0.001 ? sci(s, 1) : fmt(s, 4)}`, { 'font-size': 12, fill: C.ink });
        k.text(348, 278, `平均誤差 ≈ 權重大小的 ${rel < 0.01 ? fmt(rel * 100, 3) : fmt(rel * 100, 1)}%`, { 'font-size': 12, fill: rel > 0.3 ? C.coral : C.ink, 'font-weight': 700 });
        k.text(348, 298, `訊號雜訊比 ≈ ${fmt(sqnr, 1)} dB，變成 0 的有 ${Math.round(zeros / QW.length * 100)}%`, { 'font-size': 11 });
        const formats = [[16, '16 位元：FP16／BF16 原始模型'], [8, '8 位元：INT8／FP8 伺服器推論'], [4, '4 位元：GGUF Q4、筆電與手機'], [2, '2～3 位元：極限壓縮，品質下降']];
        formats.forEach(([fb, label], i) => {
          const hit = fb === b || (fb === 2 && b <= 3);
          const y = 322 + i * 22;
          if (hit) k.rect(344, y - 15, 240, 21, C.purpleSoft, { rx: 5 });
          k.text(352, y, label, { 'font-size': 11.5, fill: hit ? C.purple : C.muted, 'font-weight': hit ? 700 : 400 });
        });
        return {
          result: `${gb >= 10 ? fmt(gb, 1) : fmt(gb, 2)} GB ${fits ? '✅' : '❌'}`,
          detail: `${m.label} × ${b} 位元 ÷ 8 = ${fmt(gb, 2)} GB。${count} 個格子、每格寬 ${s < 0.001 ? sci(s, 1) : fmt(s, 4)}，均方根誤差約為權重大小的 ${rel < 0.01 ? fmt(rel * 100, 3) : fmt(rel * 100, 1)}%（訊號雜訊比 ${fmt(sqnr, 1)} dB）。`
        };
      }
    },
    // =====================================================================
    {
      id: 'scaling', track: 'llm', symbol: 'Nᵅ', name: '縮放定律', question: 'AI 越大越聰明嗎？',
      title: '要蓋多大的 AI、讀多少書？用一條公式事先算出來',
      intro: '練習投籃：前 10 次進步很快，練到第 1,000 次，每多練一次只進步一點點。AI 也一樣：模型越大、讀的資料越多，錯誤越少，但<b>每多 10 倍，錯誤只會乘上一個固定比例</b>。這種規律叫<b>冪次定律</b>，畫在「每格放大 10 倍」的對數座標上會變成直線。AI 公司就靠它，在花大錢訓練之前先預估成果。',
      scene: '模擬：AI 實驗室規劃一次預訓練——模型多大、資料多少、要花多少算力', viewH: 420,
      chart: '上：訓練計畫書　左下：對數座標上的冪次定律（直線＝冪次）　右下：同樣算力時，模型大小與損失的 U 形曲線（紅圈＝你的計畫、綠點＝公式最低點、黃菱形＝20 倍法則）',
      caption: '預測公式是 Hoffmann 等人（DeepMind，2022，Chinchilla 論文）擬合的 L(N, D)，損失單位是 nats／token，只對他們的資料與設定成立。算力 C ≈ 6ND；GPU 天數假設每張頂級 GPU 每秒實際完成約 4×10¹⁴ 次運算，只是數量級估計。',
      controls: [
        ['logN', '模型參數 N ＝ 10 的', 7, 12, 0.1, 9, '次方'],
        ['logD', '訓練資料 D ＝ 10 的', 9, 14, 0.1, 10.3, '次方（tokens）']
      ],
      try: '先把 N 拉到最大（10¹²）但資料留在 10⁹：損失降得動嗎？再試著讓「每個參數配約 20 個 token」。最後比較：同樣算力下，右圖的紅點離最低點有多遠？',
      resultLabel: '預測的訓練損失 L',
      takeaway: '縮放定律：損失 ≈ 下限 E + 冪次遞減的兩項；模型和資料要一起放大，只放大其中一個很快就會遇到瓶頸。',
      application: '在 log–log 圖上是直線，所以用便宜的小模型實驗畫出直線，就能外推大模型的結果——但也要記得：越往後，每一份進步都更貴。',
      tech: [
        ['🔬', 'OpenAI GPT-4 技術報告', '報告指出：他們用算力只有 GPT-4 千分之一到萬分之一的小模型，畫出縮放曲線，事先準確預測了 GPT-4 的最終損失。'],
        ['🐭', 'DeepMind Chinchilla（2022）', '發現當時的大模型「太大、讀太少」：70B 參數＋1.4 兆 tokens 的 Chinchilla，用和 Gopher（280B 參數、3,000 億 tokens）相近的算力卻表現更好，帶出「約 20 tokens／參數」的經驗法則。'],
        ['🦙', 'Meta Llama 3', '8B 模型用了超過 15 兆 tokens 訓練，遠超過 20 倍：因為模型之後要被大量使用，多花訓練算力讓小模型更強，推論就更便宜。'],
        ['🏢', 'OpenAI、Google、Anthropic 等實驗室', '用小規模實驗的縮放曲線決定模型大小、資料量與算力預算（Kaplan 等人 2020 年的縮放定律論文，部分作者後來共同創立 Anthropic）；各家最新的確切數字多半不公開。']
      ],
      teach: {
        grade: '國中七年級～國中九年級（延伸到高中對數）',
        connect: '國中「科學記號」「指數律」「等比數列」、國小「倍數」。冪次定律：x 每乘 10，y 就乘一個固定比例——在對數座標上就是一次函數（直線）。',
        activity: '發給各組這張表（模型參數 → 可改進的錯誤）：10⁷ → 1.69、10⁸ → 0.77、10⁹ → 0.35、10¹⁰ → 0.16、10¹¹ → 0.074。第一步：畫在一般方格紙上（x 軸用 1、2、3、4、5 代表 10 的幾次方），看到曲線越來越平。第二步：用計算機算相鄰兩數的比值，發現每次都約 ×0.46。第三步：把 y 改成「乘了幾次 0.46」（0、1、2、3、4）再畫一次，變成直線！用直尺延長，預測 10¹² 的值（約 0.034），再用計算機驗證。',
        ask: ['如果每多 10 倍參數，錯誤只剩 46%，要讓錯誤剩下 1/10 需要大概多少倍的參數？', '為什麼資料量不變時，只加大模型會沒用？', '公司為什麼要先用小模型做實驗，再決定大模型的大小？'],
        myth: '「縮放定律保證 AI 會一直變聰明」——它描述的是「平均損失」隨規模下降的趨勢，而且有下限 E；損失降低不等於每一種能力都同步變好。資料用完、算力太貴、或方法改變，曲線都可能改變。'
      },
      formula: 'L(N, D) = E + A / N<sup>α</sup> + B / D<sup>β</sup><br>Hoffmann 等人（2022）擬合：E ≈ 1.69, A ≈ 406.4, B ≈ 410.7, α ≈ 0.34, β ≈ 0.28<br>log(L − E) = log A − α·log N　（資料無限多時：log–log 上斜率 −α 的直線）<br>算力 C ≈ 6ND（FLOPs）；固定 C 下的最佳：N<sub>opt</sub> ∝ C<sup>a</sup>, D<sub>opt</sub> ∝ C<sup>b</sup>，a ≈ b ≈ 0.5 ⇒ D ≈ 20N',
      formal: 'N 是參數數量、D 是訓練 token 數，L 是測試資料上每個 token 的交叉熵（nats）。E 是「不可再降」的損失（文字本身的不確定性，加上這個模型族的極限），A/N<sup>α</sup> 是模型容量不足、B/D<sup>β</sup> 是資料不足造成的額外損失。冪次 y = a·x<sup>−k</sup> 取對數後 log y = log a − k log x，是直線，所以「直線外推」很方便；但每多 10 倍，可降的部分只乘上 10<sup>−0.34</sup> ≈ 0.46，報酬遞減。C ≈ 6ND：前向每個 token 約 2N 次浮點運算（每個參數一次乘一次加），反向約 4N，忽略注意力隨文長增加的部分。固定 C 求最小 L（拉格朗日乘數）得 N<sub>opt</sub> = G·(C/6)<sup>β/(α+β)</sup>，G = (αA/βB)<sup>1/(α+β)</sup>，右下圖的綠點就是它；Chinchilla 論文另外兩種方法得到 a ≈ b ≈ 0.5、約 20 tokens／參數（黃點）。這兩個結果並不完全一致，後來 Epoch AI（2024）重做這個擬合，指出原本數字的誤差，修正後與「約 20 倍」較一致。<b>限制</b>：常數依資料集、tokenizer、架構與訓練方法而變，不能拿來比較不同公司的模型；Kaplan 等人（2020）較早的結果建議更大的模型、更少的資料，差異部分來自學習率排程的設定；實務上常故意「過度訓練」小模型以降低推論成本；資料重複使用、合成資料、推論時多思考（test-time compute）都超出本公式。',
      quiz: [
        { question: '在「每格放大 10 倍」的 log–log 座標上，冪次定律 y = A / x<sup>α</sup> 長什麼樣子？', options: ['一條直線', '一個圓', '一條往上翹的拋物線'], answer: 0, why: '對！取對數後 log y = log A − α log x，是斜率 −α 的直線。' },
        { question: '算力固定時，Chinchilla 的經驗法則建議怎麼分配？', options: ['參數越多越好，資料少一點沒關係', '每個參數大約配 20 個訓練 token，兩者一起放大', '資料越多越好，模型越小越好'], answer: 1, why: '對！Chinchilla 以 70B 參數配 1.4 兆 tokens（20 倍），勝過更大但讀得少的 Gopher。', hint: '看看右下圖：U 形曲線的最低點在中間，不在兩端。' }
      ],
      related: ['exponential', 'linear', 'crossentropy', 'statistics'],
      draw(k, v) {
        const { C, fmt } = k;
        const N = 10 ** v.logN, D = 10 ** v.logD, L = chLoss(N, D), Cf = 6 * N * D;
        const termN = CH.A / N ** CH.a, termD = CH.B / D ** CH.b;
        const nOpt = CH_G * (Cf / 6) ** (CH.b / (CH.a + CH.b)), nRule = Math.sqrt(Cf / 120);
        const gpuSec = Cf / 4e14, gpuDays = gpuSec / 86400;
        const gpuTime = gpuSec < 3600 ? `≈ ${sig(gpuSec / 60, 2)} GPU‑分鐘` : gpuSec < 86400 ? `≈ ${sig(gpuSec / 3600, 2)} GPU‑小時` : gpuDays < 365 ? `≈ ${sig(gpuDays, 2)} GPU‑天` : `≈ ${zh(gpuDays / 365)} GPU‑年`;
        const tick = t => (t >= 6.5 ? `10${sup(Math.round(t))}` : fmt(10 ** t, 2));
        // Plan sheet.
        k.box(8, 8, 584, 106, { title: '🏗️ 訓練計畫書（用 Chinchilla 公式預估）' });
        const tiles = [
          ['🧠 模型參數 N', `${zh(N)} 個`, `N = ${sci(N, 2)}`, C.purple],
          ['📚 訓練資料 D', `${zh(D)} tokens`, `每個參數配 ${D / N >= 1e4 ? zh(D / N) : D / N >= 10 ? fmt(D / N, 0) : sig(D / N, 2)} 個`, C.blue],
          ['⚡ 算力 C ≈ 6ND', `${sci(Cf, 1)}`, gpuTime, C.yellow],
          ['🎯 預測損失 L', `${fmt(L, 3)}`, `困惑度 e^L ≈ ${fmt(Math.exp(L), 1)}`, C.coral]
        ];
        tiles.forEach(([h, big, small, col], i) => {
          const x = 16 + i * 144;
          k.rect(x, 32, 136, 74, C.graySoft, { rx: 8 });
          k.text(x + 8, 50, h, { 'font-size': 11.5, 'font-weight': 700, fill: C.ink });
          k.text(x + 8, 76, big, { 'font-size': 15, 'font-weight': 700, fill: col });
          k.text(x + 8, 96, small, { 'font-size': 10.5, fill: C.muted });
        });
        // Left: log–log power law.
        const lp = k.plot({ xmin: 7, xmax: 12, ymin: -1.5, ymax: 0.5, left: 52, top: 150, width: 236, height: 216, xticks: 5, yticks: 4, tickFmt: tick, xlabel: '參數 N（對數刻度）', ylabel: '可降低的損失 L − E（對數刻度）' });
        k.curve(lp, t => Math.log10(CH.A / 10 ** (CH.a * t)), C.purple, { 'stroke-width': 2.5, 'stroke-dasharray': '7 5' });
        k.curve(lp, t => Math.log10(CH.A / 10 ** (CH.a * t) + termD), C.blue, { 'stroke-width': 3 });
        k.dot(lp, v.logN, Math.log10(termN + termD), C.coral, 7);
        k.line(lp.right - 112, lp.top + 10, lp.right - 94, lp.top + 10, C.purple, { 'stroke-width': 2.5, 'stroke-dasharray': '5 3' });
        k.text(lp.right - 90, lp.top + 14, '資料無限多（直線）', { 'font-size': 10.5, fill: C.purple, ...halo });
        k.line(lp.right - 112, lp.top + 28, lp.right - 94, lp.top + 28, C.blue, { 'stroke-width': 3 });
        k.text(lp.right - 90, lp.top + 32, '目前資料量 D', { 'font-size': 10.5, fill: C.blue, ...halo });
        // Right: IsoFLOP curve for the current compute budget.
        const rp = k.plot({ xmin: 7, xmax: 12, ymin: 1.5, ymax: 5.5, left: 352, top: 150, width: 230, height: 216, xticks: 5, yticks: 4, tickFmt: t => (t >= 6.5 ? `10${sup(Math.round(t))}` : fmt(t, 1)), xlabel: '參數 N（資料 D = C ÷ 6N）', ylabel: `算力固定為 ${sci(Cf, 1)} 時的損失` });
        const iso = t => chLoss(10 ** t, Cf / (6 * 10 ** t));
        k.sub(k.clip(rp.left, rp.top - 4, rp.width + 4, rp.height + 4)).curve(rp, iso, C.blue, { 'stroke-width': 3 });
        const lo = Math.log10(nOpt), ru = Math.log10(nRule);
        if (L > 5.5) k.text(rp.x(v.logN), rp.top + 12, '▲ 你的計畫（損失太高）', { 'text-anchor': v.logN > 10 ? 'end' : 'start', 'font-size': 10.5, fill: C.coral, 'font-weight': 700 });
        if (ru >= 7 && ru <= 12) {
          const y = rp.y(Math.min(iso(ru), 5.5));
          k.polygon([[rp.x(ru), y - 7], [rp.x(ru) + 7, y], [rp.x(ru), y + 7], [rp.x(ru) - 7, y]], C.yellow, { stroke: '#fff', 'stroke-width': 1.5 });
          k.text(MP.clamp(rp.x(ru), rp.left + 28, rp.right - 28), y + 22, '20 倍法則', { 'text-anchor': 'middle', 'font-size': 10.5, fill: C.yellow, 'font-weight': 700, ...halo });
        }
        if (lo >= 7 && lo <= 12) {
          k.dot(rp, lo, iso(lo), C.green, 5);
          k.text(MP.clamp(rp.x(lo), rp.left + 32, rp.right - 32), rp.y(iso(lo)) - 16, '公式最低點', { 'text-anchor': 'middle', 'font-size': 10.5, fill: C.green, 'font-weight': 700, ...halo });
        }
        if (L <= 5.5) { k.circle(rp.x(v.logN), rp.y(L), 10, 'none', { stroke: C.coral, 'stroke-width': 3 }); k.circle(rp.x(v.logN), rp.y(L), 3.5, C.coral); }
        return {
          result: `L ≈ ${fmt(L, 3)}`,
          detail: `L = 1.69 + 406.4/N^0.34（${fmt(termN, 3)}）+ 410.7/D^0.28（${fmt(termD, 3)}）= ${fmt(L, 3)}。C = 6 × ${sci(N, 1)} × ${sci(D, 1)} = ${sci(Cf, 1)} FLOP。同樣算力下，公式最佳約 N ≈ ${sci(nOpt, 1)}，20 倍法則則是 N ≈ ${sci(nRule, 1)}。`
        };
      }
    }
  );
})();
