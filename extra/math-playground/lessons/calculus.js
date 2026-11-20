// 微積分：變化率與累積量。
MP.register(
  {
    id: 'derivative', track: 'calculus', symbol: '↗', name: '微分', question: '導航怎麼知道車速？',
    title: '綠燈一亮，車子「這一瞬間」開多快？',
    intro: '汽車從紅綠燈起步，越開越快。手機導航每隔一小段時間記下車子的位置：「走了多遠 ÷ 花了多久」就是這段時間的平均速度。把時間段縮得越短，算出來的數字就越接近儀表板上「此刻」的速度——這就是微分。',
    scene: '模擬：GPS 記錄位置，推算儀表板車速', viewH: 400,
    chart: '上：馬路上的車與兩次 GPS 定位　左下：位置–時間圖（藍線是割線、虛線是切線）　右下：車速表',
    caption: '車子的位置 s(t) = 1.5t² 公尺（等加速度起步）。藍色指針是兩次定位算出的平均速度，紅色指針是真正的瞬間速度。',
    controls: [['t', '綠燈後第', 0, 7, 0.1, 3, '秒'], ['h', 'GPS 間隔 Δt', 0.1, 3, 0.1, 2, '秒']],
    play: 't',
    try: '把 Δt 從 3 秒慢慢縮到 0.1 秒：藍色指針怎麼追上紅色指針？再按播放，看車子加速。',
    resultLabel: '兩次定位算出的平均速度',
    takeaway: '微分＝「時間段縮到很短很短時」的變化率。',
    application: '速度是位置的微分，加速度是速度的微分；手機、汽車、無人機都靠它知道自己「正在怎麼動」。',
    tech: [
      ['🗺️', 'Google 地圖／導航', '用連續 GPS 位置的差除以時間差，估算車速與預計抵達時間。'],
      ['📱', '手機計步與螢幕旋轉', '加速度計量的是速度的變化率，也就是位置的二次微分。'],
      ['🚗', '自動駕駛與 ABS 煞車', '每秒上百次計算車輪轉速的變化率，判斷是否打滑。'],
      ['🤖', 'AI 訓練', '用微分算出「調一下參數，錯誤會變多快」，才知道往哪裡改（見梯度下降、反向傳播）。']
    ],
    teach: {
      grade: '國小五年級～國中（速率單元）',
      connect: '國小「速率＝距離÷時間」、國中「一次函數的斜率」。微分只是把「時間」縮得非常小。',
      activity: '操場直線跑道每 5 公尺站一位同學拿碼錶，記錄跑者經過的時間。分組計算「0～20 公尺」與「15～20 公尺」的平均速度：哪一個比較像跑者衝線時的速度？',
      ask: ['平均速度和儀表板上的速度一樣嗎？什麼時候會一樣？', '如果 GPS 每 10 秒才定位一次，算出來的速度會有什麼問題？', '車子停在紅燈前，位置–時間圖會長什麼樣子？'],
      myth: '「瞬間」不是時間等於 0（0 ÷ 0 沒有意義），而是時間段越來越小時，平均速度逼近的那個數。'
    },
    formula: "s'(t) = lim<sub>Δt→0</sub> [s(t+Δt) − s(t)] / Δt；本例 s(t) = 1.5t² ⇒ s'(t) = 3t",
    formal: 's(t) 是位置，[s(t+Δt) − s(t)]/Δt 是割線斜率（平均變化率），極限 lim 表示 Δt 趨近 0 時的值，得到切線斜率（瞬間變化率）。本例平均速度 = 3t + 1.5Δt，與真正速度只差 1.5Δt，所以 Δt 越小越準。一般函數不一定處處可微，例如有尖角的地方。',
    quiz: [
      { question: '導航想更準確地知道「此刻」車速，應該怎麼做？', options: ['把定位的時間間隔縮短', '把定位的時間間隔拉長', '只看出發點的位置'], answer: 0, why: '對！Δt 越小，平均速度越接近瞬間速度。' },
      { question: '位置–時間圖越來越陡，代表什麼？', options: ['車子越開越慢', '車子越開越快', '車子停住了'], answer: 1, why: '對！圖的斜率就是速度，越陡代表速度越大。' }
    ],
    related: ['linear', 'integral', 'gradient', 'backprop'],
    draw(k, v) {
      const { C, fmt } = k;
      const s = t => 1.5 * t * t, t2 = v.t + v.h;
      const avg = (s(t2) - s(v.t)) / v.h, inst = 3 * v.t;
      // Road with the car and the two GPS fixes.
      k.box(10, 8, 580, 108, { fill: '#eef3f1', title: '🛰️ 馬路（0～160 公尺）　藍色圖釘＝兩次 GPS 定位' });
      const roadX = m => 40 + MP.clamp(m, 0, 160) / 160 * 530;
      k.rect(30, 58, 550, 34, '#5d6870', { rx: 4 });
      for (let m = 0; m <= 160; m += 10) k.line(roadX(m), 75, roadX(m) + 9, 75, '#f4f1e6', { 'stroke-width': 2 });
      k.rect(roadX(0) - 4, 52, 4, 46, C.green);
      k.text(roadX(0), 110, '起點', { 'text-anchor': 'middle', 'font-size': 11 });
      for (const [time, label] of [[v.t, '1'], [t2, '2']]) {
        const x = roadX(s(time));
        k.line(x, 44, x, 60, C.blue, { 'stroke-width': 2 });
        k.circle(x, 42, 8, C.blue);
        k.text(x, 46, label, { 'text-anchor': 'middle', 'font-size': 11, fill: '#fff', 'font-weight': 700 });
      }
      if (s(t2) > 160) k.text(578, 110, '定位 2 超出畫面 →', { 'text-anchor': 'end', 'font-size': 11, fill: C.blue });
      const carX = roadX(s(v.t));
      k.rect(carX - 26, 64, 30, 14, C.coral, { rx: 4 });
      k.rect(carX - 20, 58, 16, 9, '#f7b9a9', { rx: 3 });
      k.circle(carX - 19, 79, 4, C.ink); k.circle(carX - 3, 79, 4, C.ink);
      // Position–time graph with the secant and the tangent.
      const p = k.plot({ xmin: 0, xmax: 10, ymin: 0, ymax: 150, left: 58, width: 330, top: 146, height: 200, xticks: 5, yticks: 3, xlabel: '時間 t（秒）', ylabel: '位置 s（公尺）' });
      k.curve(p, s, C.coral, { 'stroke-width': 4 }, 0, 10);
      k.curve(p, t => s(v.t) + inst * (t - v.t), C.gray, { 'stroke-dasharray': '6 5', 'stroke-width': 2 }, Math.max(0, v.t - 2.5), Math.min(10, v.t + 2.5));
      k.line(p.x(v.t), p.y(s(v.t)), p.x(t2), p.y(Math.min(s(t2), 150)), C.blue, { 'stroke-width': 4 });
      k.dot(p, v.t, s(v.t), C.blue);
      if (s(t2) <= 150) k.dot(p, t2, s(t2), C.blue);
      // Speedometer: blue needle = average, red needle = instantaneous (km/h).
      const cx = 498, cy = 288, r = 78, maxKmh = 120;
      const ang = kmh => Math.PI * (1 - MP.clamp(kmh, 0, maxKmh) / maxKmh);
      k.path(`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`, '#d5ddd8', { 'stroke-width': 12 });
      for (let kmh = 0; kmh <= maxKmh; kmh += 20) {
        const a = ang(kmh);
        k.text(cx + (r - 24) * Math.cos(a), cy - (r - 24) * Math.sin(a) + 4, kmh, { 'text-anchor': 'middle', 'font-size': 10 });
      }
      const needle = (kmh, color, width) => k.line(cx, cy, cx + (r - 6) * Math.cos(ang(kmh)), cy - (r - 6) * Math.sin(ang(kmh)), color, { 'stroke-width': width });
      needle(avg * 3.6, C.blue, 5); needle(inst * 3.6, C.coral, 3);
      k.circle(cx, cy, 7, C.ink);
      k.text(cx, cy + 26, `瞬間 ${fmt(inst * 3.6, 0)} km/h`, { 'text-anchor': 'middle', 'font-size': 12, fill: C.coral, 'font-weight': 700 });
      k.text(cx, cy + 44, `平均 ${fmt(avg * 3.6, 0)} km/h`, { 'text-anchor': 'middle', 'font-size': 12, fill: C.blue, 'font-weight': 700 });
      k.text(cx, 168, '車速表', { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.ink });
      return {
        result: `${fmt(avg, 2)} 公尺／秒`,
        detail: `(${fmt(s(t2), 1)} − ${fmt(s(v.t), 1)}) ÷ ${fmt(v.h, 1)} = ${fmt(avg, 2)}。真正的瞬間速度是 ${fmt(inst, 2)} 公尺／秒（約 ${fmt(inst * 3.6, 0)} km/h），差距 ${fmt(avg - inst, 2)}，正好是 1.5 × Δt。`
      };
    }
  }
);

// 積分、指數與對數、泰勒級數、二重積分（放在區塊裡，避免和其他課程包的變數名稱衝突）。
(() => {
  const { clamp } = MP;
  // ---------- 共用小工具 ----------
  // 中文大數字：1234 → 1234，56789 → 5.68萬，2.8e14 → 281兆。
  const zh = n => {
    for (const [u, s] of [[1e16, '京'], [1e12, '兆'], [1e8, '億'], [1e4, '萬']]) {
      if (n >= u) { const x = n / u; return `${x >= 99.5 ? Math.round(x) : x.toPrecision(3).replace(/\.?0+$/, '')}${s}`; }
    }
    return String(Math.round(n));
  };
  const SUP = s => String(s).replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]);
  const fact = m => { let f = 1; for (let i = 2; i <= m; i++) f *= i; return f; };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (stops, t) => {
    const s = clamp(t, 0, 1) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(s)), f = s - i;
    const a = hex(stops[i]), b = hex(stops[i + 1]);
    return `rgb(${a.map((c, j) => Math.round(c + (b[j] - c) * f)).join(',')})`;
  };
  const signed = (x, d) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(d)}`;

  // ---------- 積分：太陽能板 ----------
  const PK = 3; // 晴天中午的最大功率（kW）
  const solarP = t => (t <= 6 || t >= 18) ? 0 : PK * Math.sin(Math.PI * (t - 6) / 12) ** 2;
  const solarE = T => { const u = clamp(T - 6, 0, 12); return PK * (u / 2 - 3 / Math.PI * Math.sin(Math.PI * u / 6)); };
  const clock = h => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };

  // ---------- 指數：培養皿裡固定的細菌位置 ----------
  const DISH = (() => {
    const r = MP.rng(42), pts = [];
    while (pts.length < 300) { const x = r() * 2 - 1, y = r() * 2 - 1; if (x * x + y * y < 0.9) pts.push([x, y]); }
    return pts;
  })();
  const niceUp = x => { const e = 10 ** Math.floor(Math.log10(x)); for (const m of [1, 2, 2.5, 5, 10]) if (m * e >= x - 1e-9) return m * e; return 10 * e; };

  // ---------- 泰勒：sin 與 eˣ 的每一項 ----------
  const TAY = [
    { f: Math.sin, term: (i, x) => (i % 2 ? -1 : 1) * x ** (2 * i + 1) / fact(2 * i + 1), label: i => i === 0 ? 'x' : `${i % 2 ? '−' : '＋'} x${SUP(2 * i + 1)}/${2 * i + 1}!`, ymin: -2, ymax: 2, yticks: 4 },
    { f: Math.exp, term: (i, x) => x ** i / fact(i), label: i => i === 0 ? '1' : i === 1 ? '＋ x' : `＋ x${SUP(i)}/${i}!`, ymin: -5, ymax: 25, yticks: 6 }
  ];
  const taySum = (F, x, n) => { let s = 0; for (let i = 0; i < n; i++) s += F.term(i, x); return s; };

  // ---------- 二重積分：颱風雨量 ----------
  const erf = x => { // Abramowitz–Stegun 7.1.26，誤差 < 1.5e-7
    const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
    return s * (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a));
  };
  const RW = 40, RH = 30, SX = 7, SY = 10, CY = 15;
  const rain = (x, y, c) => 40 + 360 * Math.exp(-((x - c) ** 2) / (2 * SX * SX) - ((y - CY) ** 2) / (2 * SY * SY));
  const gaussInt = (a, b, c, s) => s * Math.sqrt(Math.PI / 2) * (erf((b - c) / (s * Math.SQRT2)) - erf((a - c) / (s * Math.SQRT2)));
  const IY = gaussInt(0, RH, CY, SY);
  const rainExact = c => 40 * RW * RH + 360 * gaussInt(0, RW, c, SX) * IY; // 毫米·平方公里
  const rainMid = (n, c) => {
    const dx = RW / n, dy = RH / n; let s = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += rain((i + 0.5) * dx, (j + 0.5) * dy, c);
    return s * dx * dy;
  };
  const RAIN_STOPS = ['#f3f7fc', '#a9c6ea', '#416fae', '#7b5ea7'];

  MP.register(
    {
      id: 'integral', track: 'calculus', symbol: '∫', name: '積分', question: '太陽能板發了多少電？',
      title: '一整天的陽光，變成幾度電？',
      intro: '電費單上的「1 度電」，就是 1 千瓦的電器開 1 小時用掉的電。屋頂的太陽能板早上發電少、中午最多、傍晚又變少，想知道一天總共發了幾度電，就把一天切成很多小段：每段「功率 × 時間」算出一小塊，再全部加起來——這就是<b>積分</b>。切得越細，加起來越準。',
      scene: '模擬：屋頂太陽能板的發電功率，累積成電池裡的度數', viewH: 400,
      chart: '上：太陽位置、屋頂太陽能板與電池（黃色＝切段估計，紅線＝精確值）　下：功率–時間圖，黃色長方形面積＝每段估計的電量',
      caption: '晴天的理想化模型：6 點日出、18 點日落，功率 P(t) = 3 sin²(π(t−6)/12) 千瓦，中午最高 3 kW，一整天精確值 18 度。真實發電量還會受雲量、氣溫、板子方位與髒污影響。',
      controls: [['T', '現在時刻', 6, 18, 0.25, 13, '點'], ['n', '切成幾段', 1, 24, 1, 4, '段'], { key: 'm', label: '每段的高度取', options: ['左端點', '中點', '右端點'], value: 0 }],
      play: 'T',
      try: '先把時刻拉到 18 點（一整天），段數從 1 慢慢加到 24，看黃色長方形怎麼貼近紅色曲線；再把高度改成「中點」：同樣 4 段，誤差少了多少？',
      resultLabel: '切段估計的累積發電量',
      takeaway: '積分＝把「不斷變化的速率 × 很短的時間」全部加起來，得到總量；畫成圖，就是曲線底下的面積。',
      application: '微分從總量算出速率，積分從速率算回總量，兩者互為反運算——這就是微積分基本定理。',
      tech: [
        ['⚡', '智慧電表與電費單', '電表持續量測功率（千瓦），乘上很短的時間再累加，得到帳單上的「度」（kWh），也就是功率對時間的積分。'],
        ['☀️', '太陽能變流器 App', '變流器（逆變器）不斷量測輸出功率並累加，App 上的「今日發電量」就是這條功率曲線底下的面積。'],
        ['🔋', '手機與電動車的電量估計', '電池管理系統把流進、流出的電流對時間積分（庫侖計數），再配合電壓校正，估算剩下幾 % 與還能跑多遠。'],
        ['🛰️', '隧道裡的導航', '收不到 GPS 時，手機與車機把加速度積分成速度、再積分成位置，暫時推算你在哪裡（慣性導航）。'],
        ['🤖', 'AI 與機率', '連續機率分布的曲線底下總面積必須等於 1；評估分類模型常用的 AUC，就是 ROC 曲線底下的面積。']
      ],
      teach: {
        grade: '國小五年級～國中八年級',
        connect: '國小「長方形面積＝長 × 寬」「距離＝速率 × 時間」、國中「坐標平面」與「函數圖形」。積分就是把很多細長方形的面積加起來。',
        activity: '發給每組一張 1 公分方格紙，上面畫好一條山形的「一天發電功率」曲線（橫軸 6～18 點，每格 1 小時；縱軸每格 0.5 kW）。① 先切成 2 段、每段用左端高度畫長方形，算面積；② 再切成 6 段、12 段重做；③ 最後直接數曲線底下的方格（超過半格算一格）。把結果寫上黑板：哪一種最接近？一格方格代表幾度電？',
        ask: ['長方形的「寬」和「高」各代表什麼？為什麼乘起來是電量？', '為什麼切得越細越準？曲線的哪一段最容易估錯？', '中午有一朵雲飄過，曲線和整天的發電量會怎麼變？'],
        myth: '「積分就是算面積」只說對一半：面積是畫成圖的樣子，真正的意思是「速率 × 時間」的累積。若功率是負的（例如電池放電），那一段的「面積」要算成負的。'
      },
      formula: 'E(T) = ∫<sub>6</sub><sup>T</sup> P(t) dt = lim<sub>n→∞</sub> Σ<sub>i=1</sub><sup>n</sup> P(t<sub>i</sub><sup>*</sup>) Δt，Δt = (T − 6)/n；本例 E(18) = ∫<sub>6</sub><sup>18</sup> 3 sin²(π(t−6)/12) dt = 18 kWh',
      formal: 'P(t) 是功率（kW），t 是時刻（小時），t<sub>i</sub><sup>*</sup> 是第 i 段裡挑來量高度的點（左端、中點或右端），Σ P(t<sub>i</sub><sup>*</sup>)Δt 叫做黎曼和。只要 P 連續，不論怎麼挑點，n → ∞ 時黎曼和都收斂到同一個數，就是定積分。左、右端點法的誤差大約與 Δt 成正比，中點法的誤差與 Δt² 成正比，所以中點法收斂得快很多。本例的反導函數是 E(T) = 3[u/2 − (3/π) sin(πu/6)]，u = T − 6；微積分基本定理保證 E′(T) = P(T)：累積電量的變化率，就是當下的功率。',
      quiz: [
        { question: '想讓「切段估計」更接近真正的發電量，最直接的方法是？', options: ['把一天切成更多、更短的段', '只量中午最亮的那一刻', '每段的高度都取最大值'], answer: 0, why: '對！Δt 越短，每個長方形越貼近曲線，總和就越接近積分。', hint: '想想黃色長方形什麼時候最貼近紅色曲線。' },
        { question: '太陽能板以 3 千瓦連續發電 2 小時，共發了幾度電？', options: ['1.5 度', '5 度', '6 度'], answer: 2, why: '對！3 kW × 2 h = 6 kWh，也就是 6 度電——正好是一個長方形的面積。', hint: '「度」＝千瓦 × 小時。' }
      ],
      related: ['derivative', 'double', 'probability', 'ode'],
      draw(k, v) {
        const { C, fmt } = k;
        const T = v.T, n = v.n, dt = (T - 6) / n, off = [0, 0.5, 1][v.m];
        let sumH = 0; const bars = [];
        for (let i = 0; i < n; i++) { const a = 6 + i * dt, s = a + off * dt, h = solarP(s); sumH += h; bars.push([a, s, h]); }
        const approx = sumH * dt, exact = solarE(T), now = solarP(T), err = approx - exact;
        // 場景：太陽在天空的位置、屋頂的板子、電池。
        k.box(10, 8, 580, 132, { fill: '#eef4fb', title: '☀️ 屋頂太陽能板（晴天）' });
        const cx = 180, gy = 128, R = 86, sa = Math.PI * (T - 6) / 12;
        k.path(`M${cx - R},${gy} A${R},${R} 0 0 1 ${cx + R},${gy}`, '#c4d3e6', { 'stroke-width': 1.5, 'stroke-dasharray': '4 5' });
        k.text(cx - R - 15, gy - 4, '日出', { 'text-anchor': 'end', 'font-size': 11 });
        k.text(cx + R + 15, gy - 4, '日落', { 'font-size': 11 });
        k.line(24, gy, 330, gy, C.green, { 'stroke-width': 3 });
        k.rect(cx - 40, 100, 80, 28, '#f4ead7', { stroke: '#c9b48f', 'stroke-width': 1.5 });
        k.rect(cx - 8, 110, 16, 18, '#c9b48f');
        k.line(cx - 22, 100, cx - 22, 92, C.gray, { 'stroke-width': 2 }); k.line(cx + 18, 100, cx + 18, 88, C.gray, { 'stroke-width': 2 });
        const glow = now / PK;
        k.polygon([[cx - 36, 98], [cx + 32, 98], [cx + 24, 82], [cx - 28, 82]], C.blue, { 'fill-opacity': 0.3 + 0.7 * glow, stroke: C.ink, 'stroke-width': 1 });
        for (const f of [0.25, 0.5, 0.75]) k.line(cx - 36 + 68 * f, 98, cx - 28 + 52 * f, 82, '#ffffff', { 'stroke-width': 1, opacity: 0.7 });
        k.line(cx - 32, 90, cx + 28, 90, '#ffffff', { 'stroke-width': 1, opacity: 0.7 });
        const sx = cx - R * Math.cos(sa), sy = gy - R * Math.sin(sa);
        if (now > 0.15) {
          const dx = cx - 2 - sx, dy = 88 - sy, L = Math.hypot(dx, dy);
          k.arrow(sx + dx / L * 16, sy + dy / L * 16, cx - 2 - dx / L * 12, 88 - dy / L * 12, C.yellow, 2);
        }
        k.emoji(sx, sy - 2, T > 6 && T < 18 ? '☀️' : '🌅', 24);
        k.polyline([[cx + 40, 114], [300, 114], [300, 66], [352, 66]], C.gray, { 'stroke-width': 2 });
        k.text(370, 34, `此刻 ${clock(T)}　功率 ${fmt(now, 2)} kW`, { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        k.rect(356, 46, 194, 40, '#fff', { rx: 6, stroke: C.ink, 'stroke-width': 2 });
        k.rect(550, 58, 7, 16, C.ink, { rx: 2 });
        k.rect(359, 49, 188 * clamp(approx / 20, 0, 1), 34, C.yellow, { rx: 4, 'fill-opacity': 0.55 });
        const ex = 359 + 188 * clamp(exact / 20, 0, 1);
        k.line(ex, 42, ex, 90, C.coral, { 'stroke-width': 3 });
        k.text(546, 70, '20 度', { 'text-anchor': 'end', 'font-size': 10 });
        k.text(358, 108, `切段 ${fmt(approx, 2)} 度`, { 'font-size': 12, 'font-weight': 700, fill: C.yellow });
        k.text(470, 108, `精確 ${fmt(exact, 2)} 度`, { 'font-size': 12, 'font-weight': 700, fill: C.coral });
        k.text(358, 128, `≈ 1 kW 冷氣可以開 ${fmt(exact, 1)} 小時`, { 'font-size': 11 });
        // 功率–時間圖與黎曼長方形。
        const p = k.plot({ xmin: 6, xmax: 18, ymin: 0, ymax: 4, left: 58, width: 510, top: 172, height: 180, xticks: 6, yticks: 4, xlabel: '時刻（點）', ylabel: '發電功率 P（kW）' });
        for (const [a, , h] of bars) k.rect(p.x(a), p.y(h), p.x(a + dt) - p.x(a), p.y(0) - p.y(h), C.yellowSoft, { stroke: C.yellow, 'stroke-width': 1.2 });
        k.curve(p, solarP, C.gray, { 'stroke-width': 2, 'stroke-dasharray': '4 4' }, 6, 18);
        if (T > 6) k.curve(p, solarP, C.coral, { 'stroke-width': 3.5 }, 6, T);
        if (n <= 12) for (const [, s, h] of bars) k.circle(p.x(s), p.y(h), 3.5, C.yellow, { stroke: '#fff', 'stroke-width': 1.5 });
        k.line(p.x(T), p.top, p.x(T), p.bottom, C.blue, { 'stroke-width': 2, 'stroke-dasharray': '5 4' });
        k.text(p.x(T) + (T > 15 ? -6 : 6), p.top + 14, `現在 ${clock(T)}`, { 'text-anchor': T > 15 ? 'end' : 'start', 'font-size': 12, 'font-weight': 700, fill: C.blue });
        return {
          result: `${fmt(approx, 2)} 度（kWh）`,
          detail: `切成 ${n} 段，每段 Δt = ${fmt(dt, 2)} 小時；各段高度合計 ${fmt(sumH, 2)} kW × ${fmt(dt, 2)} h = ${fmt(approx, 2)} 度。精確積分 ∫P dt = ${fmt(exact, 2)} 度，誤差 ${signed(err, 2)} 度${exact > 0.05 ? `（${fmt(Math.abs(err) / exact * 100, 1)}%）` : ''}。`
        };
      }
    },
    {
      id: 'exponential', track: 'calculus', symbol: 'eˣ', name: '指數與對數', question: '細菌為什麼一下就爆量？',
      title: '一隻細菌，每次分裂都翻一倍',
      intro: '把一張紙對摺，厚度變 2 倍；再摺一次變 4 倍……每次都「乘上同一個倍數」就叫<b>指數成長</b>。細菌在溫暖的便當裡也是這樣：一隻分成兩隻、兩隻變四隻，一開始看不出來，過一陣子突然爆量。<b>對數</b>則反過來問「翻了幾次？」——它把乘法變成加法，讓 1 和 1 兆能畫在同一張圖上。',
      scene: '模擬：培養皿裡的細菌分裂計數（一般刻度 vs 對數刻度）', viewH: 400,
      chart: '上：培養皿、計數器、對數換算　下：數量–時間圖（紅線＝每次翻倍，灰虛線＝每次只多 1 隻的直線成長）',
      caption: '理想化模型：從 1 隻開始、養分無限、每隔固定時間分裂一次，N(t) = 2<sup>t/d</sup>。真實的細菌會因養分耗盡而停止成長（S 形曲線）；分裂快慢也隨菌種與溫度而不同。',
      controls: [['t', '經過時間', 0, 8, 0.1, 4, '小時'], ['d', '多久分裂一次', 10, 60, 5, 20, '分鐘'], { key: 'log', label: '縱軸刻度', options: ['一般刻度', '對數刻度'], value: 0 }],
      play: 't',
      try: '用「一般刻度」按播放：前面大半段曲線幾乎貼地，最後突然衝上天。再切到「對數刻度」：同一條曲線變成直線！把分裂時間改成 10 分鐘，直線變陡多少？',
      resultLabel: '培養皿裡的細菌數',
      takeaway: '指數成長是「每段時間乘同一個倍數」；取對數後，乘法變加法，指數曲線變成直線。',
      application: 'e ≈ 2.71828 是最「自然」的底數：eˣ 的變化率剛好等於它自己，所以連續成長、放射性衰變、機率與 AI 的 softmax 都用它。',
      tech: [
        ['🤖', 'ChatGPT／Claude／Gemini 的 softmax', '把每個候選字的分數 z 變成 e<sup>z</sup> 再除以總和，得到下一個字的機率；指數讓分數高一點的字，機率高出很多。'],
        ['📉', 'AI 訓練的交叉熵損失', '模型給正確答案的機率是 p，損失就是 −log p；對數把「很多機率相乘」變成「相加」，訓練才算得動、也不會數值下溢。'],
        ['📈', '縮放定律（scaling laws）', '研究者把模型參數量、訓練資料量與錯誤率畫在雙對數圖上，發現接近一條直線，用來預估更大的模型會進步多少。'],
        ['🔊', '分貝與地震規模', '聲音每多 10 分貝，能量變 10 倍；地震規模每多 1 級，釋放的能量約多 32 倍——兩者都是對數刻度。'],
        ['🧪', '防疫與食品安全', '流行病學用指數模型估計疫情初期的「倍增時間」；冷藏讓細菌分裂變慢、倍增時間變長，食物才放得久。']
      ],
      teach: {
        grade: '國小六年級～國中九年級',
        connect: '國小「倍數與乘法」、國中七年級「指數律與科學記號」、九年級「等比數列」。高中再正式學對數 log。',
        activity: '紙張對摺挑戰（每組一張影印紙、一把尺）：① 先猜最多能對摺幾次；② 每摺一次記錄層數（1、2、4、8……）並量厚度；③ 在方格紙上畫「對摺次數–層數」圖，很快就超出紙張；④ 改畫「對摺次數–層數有幾位數」，發現幾乎是直線。最後計算：一張紙約 0.1 毫米，若能摺 42 次會有多厚？（超過地球到月球的距離）',
        ask: ['細菌每 20 分鐘翻倍，3 小時後變成幾倍？為什麼不是 9 倍而是 512 倍？', '為什麼在一般刻度上，前半段看起來「幾乎沒有細菌」？', '對數刻度往上一格，代表「乘 10」還是「加 10」？'],
        myth: '「指數成長＝一開始就很快」不對：初期它常常比直線成長還慢，可怕的是「倍數固定」，時間一長就把任何直線甩在後面。另外，真實世界的指數成長最後一定會被資源限制住。'
      },
      formula: 'N(t) = N<sub>0</sub>·2<sup>t/d</sup> = N<sub>0</sub>e<sup>kt</sup>，k = ln 2 / d；dN/dt = kN；log<sub>10</sub>N = log<sub>10</sub>N<sub>0</sub> + (t/d)·log<sub>10</sub>2；(e<sup>x</sup>)′ = e<sup>x</sup>，(ln x)′ = 1/x',
      formal: 'N<sub>0</sub> 是起始數量（本例 1 隻），d 是倍增時間，k 是連續成長率。e = lim<sub>n→∞</sub>(1 + 1/n)<sup>n</sup> ≈ 2.71828，是唯一讓 (a<sup>x</sup>)′ = a<sup>x</sup> 的底數，所以「成長速度與數量成正比」的微分方程 dN/dt = kN，解一定是 N<sub>0</sub>e<sup>kt</sup>。對數是指數的反函數，滿足 log(xy) = log x + log y，因此在對數刻度上，指數函數的圖是斜率 k/ln 10 的直線；在雙對數圖上，冪次律 y = ax<sup>p</sup> 也會變成斜率 p 的直線（縮放定律就是這樣讀的）。本模擬忽略養分限制，真實族群較接近 logistic 方程 dN/dt = kN(1 − N/K)，K 是環境能容納的上限。',
      quiz: [
        { question: '細菌每 30 分鐘翻倍，從 1 隻開始，3 小時後有幾隻？', options: ['6 隻', '64 隻', '180 隻'], answer: 1, why: '對！3 小時翻了 6 次：2⁶ = 64。', hint: '先算翻了幾次，再連乘 2。' },
        { question: '科學家為什麼常把地震能量或 AI 縮放定律畫在對數刻度上？', options: ['讓相差很多倍的數字放進同一張圖，倍數關係變成直線', '因為對數刻度比較好看', '因為取對數會讓所有數字變成 0'], answer: 0, why: '對！對數把「乘幾倍」變成「加幾格」，1 和 1 兆都放得進同一張圖。' }
      ],
      related: ['probability', 'softmax', 'crossentropy', 'scaling'],
      draw(k, v) {
        const { C, fmt } = k;
        const g = 60 * v.t / v.d, N = 2 ** g, L = g * Math.log10(2), isLog = v.log === 1;
        const growth = t => 2 ** (60 * t / v.d), straight = t => 1 + 60 * t / v.d;
        // 場景：培養皿、計數器、對數換算。
        k.box(10, 8, 580, 150, { fill: '#f3f6f2', title: '🧫 培養皿（溫暖、養分充足）' });
        const dx = 92, dy = 88;
        k.circle(dx, dy, 48, '#fffdf3', { stroke: '#cbd5cf', 'stroke-width': 4 });
        k.circle(dx, dy, 43, 'none', { stroke: '#e4e9e5', 'stroke-width': 1 });
        const per = N <= 300 ? 1 : 2 ** Math.ceil(Math.log2(N / 300)), count = clamp(Math.round(N / per), 1, 300);
        for (let i = 0; i < count; i++) k.circle(dx + DISH[i][0] * 42, dy + DISH[i][1] * 42, 2.5, C.green);
        k.text(dx, 149, `1 點 ＝ ${zh(per)} 隻`, { 'text-anchor': 'middle', 'font-size': 11 });
        k.box(170, 34, 196, 116, { fill: '#fff' });
        k.text(182, 56, '細菌數 N', { 'font-size': 12 });
        k.text(182, 90, `${zh(N)} 隻`, { 'font-size': 26, 'font-weight': 700, fill: C.coral });
        k.text(182, 114, `分裂了 ${fmt(g, 1)} 次`, { 'font-size': 12, fill: C.ink });
        k.text(182, 134, `每 ${v.d} 分鐘 × 2`, { 'font-size': 12 });
        k.box(378, 34, 202, 116, { fill: '#fff' });
        k.text(390, 56, '對數：數「翻了幾次」', { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        k.text(390, 79, `log₂ N = ${fmt(g, 1)}`, { 'font-size': 13, fill: C.blue });
        k.text(390, 100, `log₁₀ N = ${fmt(g, 1)} × 0.301`, { 'font-size': 13, fill: C.blue });
        k.text(390, 121, `　　　 = ${fmt(L, 2)} → ${Math.floor(L) + 1} 位數`, { 'font-size': 13, 'font-weight': 700, fill: C.blue });
        k.text(390, 141, '乘 2 變成「加 0.301」', { 'font-size': 11 });
        // 數量–時間圖：一般刻度或對數刻度（刻度文字自己畫，因為 x、y 格式不同）。
        const box = { left: 74, width: 490, top: 192, height: 160, xticks: 8, tickFmt: () => '' };
        let p, yLabels;
        if (isLog) {
          const dec = Math.log10(growth(8)) <= 6 ? 1 : 3, top = Math.max(3, Math.ceil(Math.log10(growth(8)) / dec) * dec);
          p = k.plot({ ...box, xmin: 0, xmax: 8, ymin: 0, ymax: top, yticks: top / dec, xlabel: '經過時間（小時）', ylabel: '細菌數（對數刻度）' });
          yLabels = Array.from({ length: top / dec + 1 }, (_, i) => [i * dec, zh(10 ** (i * dec))]);
          k.curve(p, t => Math.log10(straight(t)), C.gray, { 'stroke-width': 2, 'stroke-dasharray': '6 5' });
          k.curve(p, t => Math.log10(growth(t)), C.coral, { 'stroke-width': 3.5 });
          k.dot(p, v.t, L, C.coral);
          k.text(p.left + 8, p.top + 14, `每往上一格 ＝ × ${dec === 1 ? 10 : 1000}`, { 'font-size': 11, 'font-weight': 700, fill: C.ink });
        } else {
          const top = niceUp(growth(8));
          p = k.plot({ ...box, xmin: 0, xmax: 8, ymin: 0, ymax: top, yticks: 5, xlabel: '經過時間（小時）', ylabel: '細菌數（一般刻度）' });
          yLabels = Array.from({ length: 6 }, (_, i) => [top * i / 5, zh(top * i / 5)]);
          k.curve(p, straight, C.gray, { 'stroke-width': 2, 'stroke-dasharray': '6 5' });
          k.curve(p, growth, C.coral, { 'stroke-width': 3.5 });
          k.dot(p, v.t, N, C.coral);
          k.text(p.left + 8, p.top + 14, '前面幾乎貼地，後面突然衝上天', { 'font-size': 11, 'font-weight': 700, fill: C.ink });
        }
        for (const [yv, s] of yLabels) k.text(p.left - 7, p.y(yv) + 4, s, { 'text-anchor': 'end', 'font-size': 11 });
        for (let h = 0; h <= 8; h++) k.text(p.x(h), p.bottom + 17, h, { 'text-anchor': 'middle', 'font-size': 11 });
        const rate = Math.LN2 / v.d * N;
        return {
          result: `${zh(N)} 隻`,
          detail: `${fmt(v.t * 60, 0)} 分鐘 ÷ ${v.d} = ${fmt(g, 2)} 次分裂，N = 2^${fmt(g, 2)} ≈ ${zh(N)}。取對數：log₁₀N = ${fmt(g, 2)} × 0.301 = ${fmt(L, 2)}（乘法變加法）。此刻每分鐘約增加 (ln2 ÷ ${v.d}) × N ≈ ${rate < 10 ? fmt(rate, 2) : zh(rate)} 隻——越多長得越快。`
        };
      }
    },
    {
      id: 'taylor', track: 'calculus', symbol: 'Σ', name: '泰勒級數', question: '計算機怎麼算 sin？',
      title: '按下 sin 鍵的那一瞬間，晶片在做什麼？',
      intro: '計算機的晶片其實只會加、減、乘、除，那它怎麼算出 sin 1 或 e²？秘訣是用一串「越來越小的修正」去拼：先猜一個粗略的值，再加一點、減一點……每多一項，螢幕上就多幾位數字是對的。這串修正叫做<b>泰勒級數</b>：用某一點的高度、斜率、彎曲程度……把彎曲的函數換成好算的多項式。',
      scene: '模擬：計算機按下 sin／eˣ，一項一項累加出答案', viewH: 420,
      chart: '左上：計算機螢幕（綠字＝已經正確的位數）　右上：每一項與累加　下：真正的曲線（藍虛線）vs 多項式近似（紅線），底部綠線＝誤差小於 0.01 的範圍',
      caption: '從 x = 0 展開（麥克勞林級數），x 用弧度（1 弧度 ≈ 57.3°）。真實的數學函式庫會先把 x 縮到很小的範圍再用多項式，所以只要幾項就準到最後一位；本模擬不縮小，讓你看見大 x 時的誤差。',
      controls: [{ key: 'f', label: '按哪個鍵', options: ['sin x', 'eˣ'], value: 0 }, ['x', '輸入 x（弧度）', -3, 3, 0.1, 1, ''], ['n', '用了幾項', 1, 8, 1, 2, '項']],
      play: 'n',
      try: '選 sin、x = 1，按播放：螢幕上的綠色數字怎麼一位一位變多？再把 x 拉到 3，要幾項才夠準？最後看圖底部的綠線：項數越多，「夠準的範圍」怎麼變寬？',
      resultLabel: '計算機目前算出的值',
      takeaway: '泰勒級數把難算的函數換成只要加減乘除的多項式；離展開點越近、項數越多，就越準。',
      application: '只用第一項 sin x ≈ x，就是物理課「小角度單擺」的近似；工程上也常只留前一、兩項，把複雜的系統「線性化」。',
      tech: [
        ['🧮', '計算機與程式語言的數學函式庫', 'C、Python、JavaScript 的 sin、exp 等函式，先用週期性或 e<sup>x</sup> = 2<sup>k</sup>·e<sup>r</sup> 把輸入縮小，再用調整過係數的多項式（泰勒或誤差最小化的多項式）算出結果。'],
        ['🎮', '遊戲引擎與 3D 繪圖', '每一格畫面都要算大量旋轉角度的 sin、cos；有些引擎與 GPU 用低次多項式近似，以一點點精度換取速度。'],
        ['🛰️', 'GPS 定位', '接收器解位置時，把「到每顆衛星的距離」公式在目前猜測的位置附近做一階泰勒展開（線性化），反覆修正直到收斂。'],
        ['🤖', 'AI 晶片與 GELU', 'GPT 類模型常用的 GELU 激活函數，有一個用 tanh 與 x³ 組成的近似公式；AI 晶片也常用多項式或查表近似 exp，加速 softmax。'],
        ['⏱️', '擺鐘', '擺角很小時 sin θ ≈ θ（泰勒第一項），單擺週期幾乎與擺幅無關，所以擺鐘能穩定計時。']
      ],
      teach: {
        grade: '國中八年級～九年級（可延伸到高中）',
        connect: '國小「估算與四捨五入」、國中「乘方」「多項式」「近似值」。泰勒級數就是「越修越準的估算」。',
        activity: '「修正卡接力」：目標數字 e ≈ 2.71828 寫在黑板角落。全班分 6 組，每組一張卡：1、1、1/2、1/6、1/24、1/120。依序上台把卡片換成小數，加到黑板上的「累加值」，並用紅筆圈出和目標一樣的位數（1 → 2 → 2.5 → 2.667 → 2.708 → 2.717）。討論：每多一張卡，正確的位數多了幾位？為什麼後面的卡越來越不重要？',
        ask: ['為什麼第一、二張卡影響最大，後面的卡越來越小？', '如果目標換成 e³（約 20.09），6 張卡還夠嗎？為什麼？', '計算機只會加減乘除，為什麼多項式剛好適合它？'],
        myth: '「項數加越多一定越準、任何函數都能這樣拼」不對：有些函數的泰勒級數只在展開點附近收斂（例如 1/(1−x) 只在 |x| < 1 有效）。sin 與 eˣ 是對所有 x 都收斂的好例子，但 x 越大需要的項越多。'
      },
      formula: 'f(x) = Σ<sub>k=0</sub><sup>∞</sup> f<sup>(k)</sup>(a)(x−a)<sup>k</sup>/k!；sin x = x − x³/3! + x⁵/5! − ⋯，e<sup>x</sup> = 1 + x + x²/2! + x³/3! + ⋯；餘項 |R<sub>n</sub>(x)| ≤ M|x−a|<sup>n+1</sup>/(n+1)!',
      formal: 'f<sup>(k)</sup>(a) 是 f 在 a 點的第 k 階導數，k! = 1 × 2 × ⋯ × k（0! = 1）。前 n 次的泰勒多項式 P<sub>n</sub> 與 f 在 a 點的值、斜率、彎曲……前 n 階導數完全相同。拉格朗日餘項給出誤差上界，M 是 |f<sup>(n+1)</sup>| 在 a 與 x 之間的最大值；對 sin 來說 M ≤ 1，所以誤差不超過「下一項」的大小。因為 (n+1)! 長得比 |x|<sup>n+1</sup> 快，sin 與 eˣ 對所有實數都收斂，但 |x| 越大需要越多項——所以實作上會先做「範圍縮減」，並常改用誤差分布更平均的極小化（minimax）多項式。',
      quiz: [
        { question: '用 sin x ≈ x − x³/6 算 sin 0.1，為什麼幾乎完全正確？', options: ['因為 0.1 離展開點 0 很近，後面的項非常小', '因為 sin x 本來就等於 x', '因為含有 x³ 的式子一定很準'], answer: 0, why: '對！下一項 x⁵/120 在 x = 0.1 時只有約 0.00000008。', hint: '算算看下一項 x⁵/5! 在 x = 0.1 時有多大。' },
        { question: '計算機要算 e 的較大次方（例如 e³）時，聰明的做法是？', options: ['只用前兩項 1 + x', '先把 x 縮到小範圍，再用少數幾項多項式', '直接顯示錯誤'], answer: 1, why: '對！數學函式庫會先做範圍縮減，例如 eˣ = 2ᵏ·eʳ，r 很小時幾項就夠準。' }
      ],
      related: ['derivative', 'exponential', 'fourier', 'neuron'],
      draw(k, v) {
        const { C, fmt } = k;
        const F = TAY[v.f], x = v.x, n = v.n, isSin = v.f === 0;
        const vals = Array.from({ length: 9 }, (_, i) => F.term(i, x));
        const approx = vals.slice(0, n).reduce((a, b) => a + b, 0), truth = F.f(x), err = approx - truth;
        const aStr = approx.toFixed(8), tStr = truth.toFixed(8);
        let same = 0; while (same < aStr.length && aStr[same] === tStr[same]) same++;
        const digits = aStr.slice(0, same).replace(/[^0-9]/g, '').replace(/^0+/, '').length;
        const fname = isSin ? `sin(${fmt(x, 1)})` : `e^(${fmt(x, 1)})`;
        // 場景：計算機。
        k.box(10, 8, 222, 200, { fill: '#eef1ee', title: '🧮 計算機' });
        k.rect(24, 32, 194, 168, C.ink, { rx: 14 });
        k.rect(36, 44, 170, 66, '#dfeedd', { rx: 6 });
        k.text(198, 62, `${fname} =`, { 'text-anchor': 'end', 'font-size': 12, fill: C.ink, 'font-family': 'Consolas, monospace' });
        const disp = k.text(198, 96, '', { 'text-anchor': 'end', 'font-size': 20, 'font-weight': 700, 'font-family': 'Consolas, monospace' });
        k.el('tspan', { fill: C.green }, disp).textContent = aStr.slice(0, same);
        k.el('tspan', { fill: C.coral }, disp).textContent = aStr.slice(same);
        ['AC', 'sin', 'eˣ', '='].forEach((s, i) => {
          const kx = 36 + i * 43, on = (i === 1 && isSin) || (i === 2 && !isSin);
          k.rect(kx, 120, 38, 26, i === 3 ? C.coral : on ? C.yellow : '#3a4d5a', { rx: 6 });
          k.text(kx + 19, 138, s, { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#fff' });
        });
        k.text(121, 168, `✓ 已正確 ${digits} 位數字`, { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#9fe0bd' });
        k.text(121, 189, '晶片只會 ＋ − × ÷', { 'text-anchor': 'middle', 'font-size': 11, fill: '#c9d3d8' });
        // 場景：一項一項加上去。
        k.box(242, 8, 348, 200, { fill: '#fff', title: '按下「=」後，一項一項加上去' });
        k.text(256, 44, '這一項', { 'font-size': 11 });
        k.text(462, 44, '數值', { 'text-anchor': 'end', 'font-size': 11 });
        k.text(578, 44, '累加到這裡', { 'text-anchor': 'end', 'font-size': 11 });
        let run = 0;
        vals.slice(0, 8).forEach((val, i) => {
          run += val;
          const y = 63 + i * 17.5, used = i < n, last = i === n - 1;
          const col = !used ? C.axis : last ? C.coral : C.ink, w = last ? 700 : 400;
          k.text(256, y, F.label(i), { 'font-size': 12, fill: col, 'font-weight': w });
          k.text(462, y, signed(val, 6), { 'text-anchor': 'end', 'font-size': 12, fill: col, 'font-weight': w, 'font-family': 'Consolas, monospace' });
          k.text(578, y, used ? run.toFixed(6) : '…', { 'text-anchor': 'end', 'font-size': 12, fill: col, 'font-weight': w, 'font-family': 'Consolas, monospace' });
        });
        // 曲線：真正的函數 vs 多項式。
        const p = k.plot({ xmin: -4, xmax: 4, ymin: F.ymin, ymax: F.ymax, left: 58, width: 510, top: 240, height: 140, xticks: 8, yticks: F.yticks, xlabel: 'x（弧度）', ylabel: isSin ? 'sin x' : 'eˣ' });
        const Pn = t => taySum(F, t, n);
        const g = k.sub(k.clip(p.left, p.top - 2, p.width, p.height + 4));
        let start = null;
        for (let i = 0; i <= 400; i++) {
          const s = -4 + i * 0.02, ok = Math.abs(Pn(s) - F.f(s)) < 0.01;
          if (ok && start === null) start = s;
          if ((!ok || i === 400) && start !== null) { g.rect(p.x(start), p.bottom - 6, Math.max(2, p.x(s) - p.x(start)), 5, C.green, { 'fill-opacity': 0.75 }); start = null; }
        }
        g.line(p.x(x), p.top, p.x(x), p.bottom, C.gray, { 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
        g.curve(p, F.f, C.blue, { 'stroke-width': 2.5, 'stroke-dasharray': '7 5' });
        g.curve(p, Pn, C.coral, { 'stroke-width': 3 });
        g.line(p.x(x), p.y(truth), p.x(x), p.y(clamp(approx, F.ymin - 10, F.ymax + 10)), C.purple, { 'stroke-width': 3 });
        g.dot(p, x, truth, C.blue, 5);
        g.dot(p, x, approx, C.coral, 5);
        const next = Math.abs(vals[n]);
        return {
          result: approx.toFixed(6),
          detail: `${isSin ? `sin(${fmt(x, 1)})，${fmt(x, 1)} 弧度 ≈ ${fmt(x * 180 / Math.PI, 0)}°` : `e^${fmt(x, 1)}`}：前 ${n} 項加起來 = ${approx.toFixed(6)}；真值 ${truth.toFixed(6)}，誤差 ${signed(err, 6)}，已正確 ${digits} 位。下一項大小約 ${next < 1e-4 ? next.toExponential(1) : next.toFixed(4)}——項數夠多時，誤差就和它差不多。`
        };
      }
    },
    {
      id: 'double', track: 'calculus', symbol: '∬', name: '二重積分', question: '颱風下了多少雨？',
      title: '颱風過後，水庫集水區一共收到多少水？',
      intro: '颱風來時，有的地方下大雨、有的地方只下小雨。想知道一整片山區總共下了多少水，可以把地圖切成棋盤格，每格中央放一個雨量筒：「這格的雨量 × 這格的面積」就是這格的水，全部加起來就是總水量。格子切得越細越準——這就是<b>二重積分</b>：在一整片平面上，把每一小塊的貢獻加總。',
      scene: '模擬：用雨量站網格估計颱風帶給水庫集水區的總水量', viewH: 400,
      chart: '左：集水區地圖（顏色越深雨越大，白點＝雨量站）　右上：總水量　右下：格子越切越細，估計值（藍點）逼近精確值（紅虛線）',
      caption: '理想化模型：40 × 30 公里的長方形集水區，颱風期間累積雨量 r(x, y) = 40 + 360·exp(−(x−c)²/98 − (y−15)²/200) 毫米（一條南北走向的強雨帶）。每格只用中央那一站代表整格（中點法）。1 毫米雨落在 1 平方公里＝1,000 立方公尺（約 1,000 公噸）的水。',
      controls: [['n', '每邊切成幾格', 1, 12, 1, 2, '格'], ['c', '最大雨帶位置（距西邊）', 0, 40, 1, 22, '公里'], { key: 'view', label: '地圖顯示', options: ['雷達看到的真實雨量', '雨量站方格估計'], value: 0 }],
      play: 'n',
      try: '先只放 1 個雨量站（每邊 1 格），雨帶放在 22 公里：估計值差了幾倍？再按播放，格子從 1×1 切到 12×12，看右下角藍點怎麼貼上紅虛線。切換兩種地圖比一比。',
      resultLabel: '雨量站網格估計的總水量',
      takeaway: '二重積分＝把平面切成小塊，「每塊的值 × 每塊面積」全部加起來，再讓小塊無限變小。',
      application: '同樣的加法可以算體積（高度 × 底面積）、一塊厚薄不均板子的重量，或二維機率分布底下的總機率。',
      tech: [
        ['🌧️', '中央氣象署與水庫的流域雨量', '氣象署的 QPESUMS 系統結合雷達與地面雨量站，估出每個網格的降雨量；把集水區內每格「雨量 × 面積」加總，就能預估水庫的進水量。'],
        ['🖨️', '3D 列印切片軟體', '切片軟體把模型切成一層層，計算每層要填滿的面積再乘上層厚相加，估出要用多少線材、印多久。'],
        ['🩻', 'CT 斷層掃描', '電腦斷層把身體拍成許多薄片影像；估算腫瘤或器官體積時，就是把每片的截面積 × 片厚加起來。'],
        ['📷', '手機相機感光元件', '每個像素收集的是落在那一小塊面積上的光，影像亮度本身就是光強度在像素面積（與曝光時間）上的積分。'],
        ['🤖', 'AI 與機率', '二維常態分布等機率密度，在整個平面上的二重積分必須等於 1；擴散模型生成圖片時加入的雜訊，就來自這類高斯分布。']
      ],
      teach: {
        grade: '國小五年級～國中八年級',
        connect: '國小「長方形面積」「體積＝底面積 × 高」「平均數」、國中「坐標平面」。二重積分就是「很多根細柱子的體積加起來」。',
        activity: '「翻卡雨量地圖」：在黑板或桌上用膠帶貼出 4 × 4 的方格，每格面朝下放一張雨量卡（老師事先寫好，中間大、邊緣小，每格當作 1 平方公里）。① 每 2 × 2 格併成一大格，每組只能在每個大格翻開 1 張卡當「雨量站」，用「雨量 × 4 平方公里」估總雨量；② 再把 16 張全部翻開重算；③ 比較：只有 4 個雨量站時，哪裡最容易估錯？延伸：用積木在每格疊出雨量高度，總雨量就是積木柱子的總體積。',
        ask: ['為什麼只看一個雨量站，會把整片山區的雨估得太多或太少？', '「雨量（毫米）× 面積（平方公里）」算出來的是什麼？要怎麼換成噸？', '如果集水區的形狀不是長方形，格子要怎麼切？'],
        myth: '「把所有雨量站的數字平均，就是總雨量」不對：平均雨量還要乘上面積才是總水量；而且雨量站分布不均時，要按每站代表的面積加權，不能直接平均。'
      },
      formula: 'V = ∬<sub>R</sub> r(x, y) dA ≈ Σ<sub>i=1</sub><sup>n</sup>Σ<sub>j=1</sub><sup>n</sup> r(x<sub>i</sub>, y<sub>j</sub>) ΔxΔy，Δx = 40/n、Δy = 30/n；本例 ∬<sub>R</sub> r dA = 40·1200 + 360·I<sub>x</sub>I<sub>y</sub>，I<sub>x</sub> = ∫<sub>0</sub><sup>40</sup>e<sup>−(x−c)²/98</sup>dx，I<sub>y</sub> = ∫<sub>0</sub><sup>30</sup>e<sup>−(y−15)²/200</sup>dy',
      formal: 'R = [0, 40] × [0, 30] 是集水區（公里），r(x, y) 是累積雨量（毫米），dA = dx dy 是面積元素。(x<sub>i</sub>, y<sub>j</sub>) 取每格的中心，叫做中點法；r 夠平滑時，誤差大約與 Δx² + Δy² 成正比，所以每邊格數加倍，誤差約變成四分之一。Fubini 定理保證可以先對 x 積、再對 y 積；本例 r 是可分離的高斯形狀，I<sub>x</sub>、I<sub>y</sub> 可用誤差函數 erf 寫出精確值。真實流域形狀不規則、雨量站分布不均，實務上用雷達網格或徐昇（Thiessen）多邊形決定每站代表的面積；而且落下的雨不會全部流進水庫，還要扣掉蒸發與滲入地下的部分。',
      quiz: [
        { question: '一格 2 × 2 公里的方格，中央雨量站量到 100 毫米，這格大約收到多少水？', options: ['200 立方公尺', '40 萬立方公尺', '400 萬立方公尺'], answer: 1, why: '對！面積 4 平方公里 × 100 毫米，每「1 毫米 × 1 平方公里」是 1,000 立方公尺，共 40 萬立方公尺。', hint: '1 毫米雨落在 1 平方公里＝1,000 立方公尺。' },
        { question: '只放一個雨量站，而它剛好在強雨帶正中央，用它代表整個集水區，結果會？', options: ['剛好準確', '高估總雨量', '低估總雨量'], answer: 1, why: '對！把最大的雨量當成整片山區的雨量，所以高估；多放幾站、格子切細才會準。' }
      ],
      related: ['integral', 'probability', 'convolution', 'heat'],
      draw(k, v) {
        const { C, fmt } = k;
        const n = v.n, c = v.c, dx = RW / n, dy = RH / n, area = dx * dy;
        const ests = Array.from({ length: 12 }, (_, i) => rainMid(i + 1, c));
        const est = ests[n - 1], ex = rainExact(c), err = (est - ex) / ex * 100;
        const toYi = s => s / 1e5; // 毫米·平方公里 → 億立方公尺（≈ 億公噸）
        // 地圖。
        k.box(10, 8, 320, 384, { fill: '#fff', title: '🗺️ 水庫集水區 40 × 30 公里（俯視）' });
        const mx = 30, my = 40, s = 7, X = km => mx + km * s, Y = km => my + (RH - km) * s;
        if (v.view === 0) {
          for (let i = 0; i < RW; i++) for (let j = 0; j < RH; j++) k.rect(X(i), Y(j + 1), s + 0.4, s + 0.4, mix(RAIN_STOPS, rain(i + 0.5, j + 0.5, c) / 400));
        } else {
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) k.rect(X(i * dx), Y((j + 1) * dy), dx * s, dy * s, mix(RAIN_STOPS, rain((i + 0.5) * dx, (j + 0.5) * dy, c) / 400));
        }
        for (let i = 1; i < n; i++) {
          k.line(X(i * dx), Y(0), X(i * dx), Y(RH), '#ffffff', { 'stroke-width': 1.5, opacity: 0.85 });
          k.line(X(0), Y(i * dy), X(RW), Y(i * dy), '#ffffff', { 'stroke-width': 1.5, opacity: 0.85 });
        }
        k.rect(X(0), Y(RH), RW * s, RH * s, 'none', { stroke: C.ink, 'stroke-width': 1.5 });
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          const gx = (i + 0.5) * dx, gy = (j + 0.5) * dy, r = rain(gx, gy, c);
          k.circle(X(gx), Y(gy), n <= 6 ? 4 : 2.5, '#fff', { stroke: C.ink, 'stroke-width': 1.2 });
          if (n <= 4) k.text(X(gx), Y(gy) + 18, `${Math.round(r)} mm`, { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: r > 200 ? '#fff' : C.ink });
        }
        k.polygon([[X(c), Y(0) + 3], [X(c) - 6, Y(0) + 13], [X(c) + 6, Y(0) + 13]], C.coral);
        k.text(clamp(X(c), 58, 282), Y(0) + 28, '最大雨帶', { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: C.coral });
        for (let i = 0; i < 20; i++) k.rect(30 + i * 10, 318, 10.5, 10, mix(RAIN_STOPS, i / 19));
        for (const [mm, xx] of [[0, 30], [200, 130], [400, 230]]) k.text(xx, 342, mm, { 'text-anchor': 'middle', 'font-size': 10 });
        k.text(242, 327, '毫米', { 'font-size': 11 });
        k.text(30, 364, `雨量站 ${n} × ${n} = ${n * n} 站`, { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        k.text(30, 383, `每站代表 ${fmt(dx, 1)} × ${fmt(dy, 1)} = ${fmt(area, 1)} km²`, { 'font-size': 12 });
        // 總水量卡片。
        k.box(340, 8, 250, 150, { fill: '#fff', title: '💧 集水區收到的總水量' });
        k.text(352, 46, '雨量站估計', { 'font-size': 12 });
        k.text(352, 76, `${fmt(toYi(est), 2)} 億噸`, { 'font-size': 24, 'font-weight': 700, fill: C.blue });
        k.text(352, 100, `精確積分 ${fmt(toYi(ex), 2)} 億噸`, { 'font-size': 13, 'font-weight': 700, fill: C.coral });
        k.text(352, 120, `誤差 ${signed(err, 1)}%　平均雨量 ${fmt(est / (RW * RH), 0)} 毫米`, { 'font-size': 12, fill: C.ink });
        k.text(352, 142, `≈ ${zh(est * 1000 / 2500)} 座奧運泳池（每座 2,500 m³）`, { 'font-size': 11 });
        // 收斂圖。
        k.box(340, 166, 250, 226, { fill: '#fff', title: '📉 格子越細，估計越準' });
        // 縱軸以 n ≥ 2 的估計為準；n = 1 若太大，畫在頂端並標出數值。
        const step = niceUp(Math.max(...ests.slice(1).map(toYi), toYi(ex)) * 1.3 / 4), ymax = step * 4;
        const p = k.plot({ xmin: 0, xmax: 12, ymin: 0, ymax, left: 388, width: 186, top: 216, height: 134, xticks: 4, yticks: 4, xlabel: '每邊幾格 n', ylabel: '總水量（億噸）', tickFmt: t => Number(fmt(t, 2)) });
        const py = e => p.y(Math.min(toYi(e), ymax));
        k.line(p.x(0), p.y(toYi(ex)), p.right, p.y(toYi(ex)), C.coral, { 'stroke-width': 2, 'stroke-dasharray': '6 4' });
        k.polyline(ests.map((e, i) => [p.x(i + 1), py(e)]), C.gray, { 'stroke-width': 1.5 });
        ests.forEach((e, i) => { if (i !== n - 1) k.circle(p.x(i + 1), py(e), 3, C.gray); });
        if (toYi(ests[0]) > ymax) k.text(p.x(1) + 8, p.top + 12, `n=1：${fmt(toYi(ests[0]), 2)} ↑`, { 'font-size': 11, 'font-weight': 700, fill: n === 1 ? C.blue : C.muted });
        k.circle(p.x(n), py(est), 6, C.blue, { stroke: '#fff', 'stroke-width': 2 });
        return {
          result: `${fmt(toYi(est), 2)} 億噸水`,
          detail: `${n} × ${n} 站，每站代表 ${fmt(area, 1)} km²：Σ 雨量 × 面積 = ${fmt(est, 0)} 毫米·平方公里 = ${fmt(toYi(est), 2)} 億立方公尺。精確 ∬ r dA = ${fmt(toYi(ex), 2)} 億立方公尺，誤差 ${signed(err, 1)}%。`
        };
      }
    }
  );
})();
