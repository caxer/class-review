// 工程數學：訊號、系統、微分方程與最佳化。每一課都是「真實應用場景＋數學圖」，由同一組滑桿驅動。
(() => {
  const TAU = 2 * Math.PI;
  const halo = { stroke: '#fff', 'stroke-width': 3, 'paint-order': 'stroke', 'stroke-linejoin': 'round' };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * MP.clamp(t, 0, 1))).join(',')})`; };
  const grayOf = v => { const g = Math.round(255 * MP.clamp(v, 0, 1)); return `rgb(${g},${g},${g})`; };
  const big = (n, d = 1) => (Math.abs(n) >= 1e4 ? n.toExponential(1) : MP.fmt(n, d));
  const signed = (n, d = 2) => (n < 0 ? `(${MP.fmt(n, d)})` : MP.fmt(n, d));

  // ---------- 傅立葉級數：合成器 ----------
  const FOURIER_WAVES = [
    { name: '方波', b: k => (k % 2 ? 4 / (Math.PI * k) : 0), f: u => ((((u % 1) + 1) % 1) < 0.5 ? 1 : -1), power: 1, jump: true, tone: '空心、像 8 位元電玩音效' },
    { name: '鋸齒波', b: k => 2 * (k % 2 ? 1 : -1) / (Math.PI * k), f: u => { const th = TAU * u; return (th - TAU * Math.round(th / TAU)) / Math.PI; }, power: 1 / 3, jump: true, tone: '明亮、像合成器的銅管與弦樂' },
    { name: '三角波', b: k => (k % 2 ? 8 * (((k - 1) / 2) % 2 ? -1 : 1) / (Math.PI * Math.PI * k * k) : 0), f: u => 2 / Math.PI * Math.asin(Math.sin(TAU * u)), power: 1 / 3, jump: false, tone: '柔和、接近長笛' }
  ];

  // ---------- 傅立葉轉換：調音器 ----------
  const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const noteOf = f => { const m = 69 + 12 * Math.log2(f / 440), n = Math.round(m); return { name: NOTE_NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1), cents: (m - n) * 100 }; };
  const TF_SOUNDS = [
    [[440, 1]],
    [[261.63, 1], [329.63, 0.9], [392.0, 0.8]],
    [[110, 1], [220, 0.7], [330, 0.5], [440, 0.35], [550, 0.25], [660, 0.15]],
    [[440, 1], [466.16, 0.9]]
  ];
  // Hann window spectrum divided by T/2 (without its linear phase), x = f·T.
  const hannW = x => {
    if (Math.abs(x) < 1e-9) return 1;
    if (Math.abs(Math.abs(x) - 1) < 1e-9) return 0.5;
    return Math.sin(Math.PI * x) / (Math.PI * x) / (1 - x * x);
  };

  // ---------- 拉普拉斯：懸吊 ----------
  const LAP_WN = TAU; // 1 Hz natural frequency
  const lapResp = (z, t) => {
    const w = LAP_WN;
    if (t <= 0) return 0;
    if (z < 1 - 1e-6) { const q = Math.sqrt(1 - z * z), wd = w * q; return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z / q * Math.sin(wd * t)); }
    if (z <= 1 + 1e-6) return 1 - Math.exp(-w * t) * (1 + w * t);
    const r = Math.sqrt(z * z - 1), p1 = -w * (z - r), p2 = -w * (z + r);
    return 1 + p2 / (p1 - p2) * Math.exp(p1 * t) + p1 / (p2 - p1) * Math.exp(p2 * t);
  };
  const lapPoles = z => {
    const w = LAP_WN;
    if (z < 1 - 1e-6) return { re: -z * w, im: w * Math.sqrt(1 - z * z), real: false };
    const r = Math.sqrt(Math.max(0, z * z - 1));
    return { a: -w * (z - r), b: -w * (z + r), real: true };
  };

  // ---------- 卷積：修圖濾鏡 ----------
  const CONV_IMG = (() => {
    const r = MP.rng(11), img = [];
    for (let i = 0; i < 10; i++) {
      const row = [];
      for (let j = 0; j < 10; j++) {
        let v = 0.86;
        if (i >= 2 && i <= 7 && j >= 1 && j <= 4) v = 0.16;
        row.push(Math.round(MP.clamp(v + (r() - 0.5) * 0.05, 0, 1) * 100) / 100);
      }
      img.push(row);
    }
    return img;
  })();
  const CONV_KERNELS = [
    { name: '原圖', w: [0, 0, 0, 0, 1, 0, 0, 0, 0], d: 1, note: '只取自己（恆等核）' },
    { name: '模糊', w: [1, 2, 1, 2, 4, 2, 1, 2, 1], d: 16, note: '加權平均，權重和＝1' },
    { name: '銳化', w: [0, -1, 0, -1, 5, -1, 0, -1, 0], d: 1, note: '自己 ×5，扣掉上下左右' },
    { name: '邊緣偵測', w: [-1, -1, -1, -1, 8, -1, -1, -1, -1], d: 1, note: '權重和＝0，平坦處變黑' }
  ];
  const convAt = (kern, i, j) => {
    const terms = [];
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const x = CONV_IMG[MP.clamp(i + a, 0, 9)][MP.clamp(j + b, 0, 9)], w = kern.w[(a + 1) * 3 + b + 1] / kern.d;
      terms.push({ x, w, p: x * w });
    }
    return { terms, y: terms.reduce((s, t) => s + t.p, 0) };
  };
  const convShow = (kern, y) => (kern.name === '邊緣偵測' ? MP.clamp(Math.abs(y), 0, 1) : MP.clamp(y, 0, 1));

  // ---------- 常微分方程：可可冷卻 ----------
  const ODE_CUPS = [
    { name: '保溫杯', k: 0.015, color: '#9fb3bf' },
    { name: '馬克杯', k: 0.06, color: '#f2b8a8' },
    { name: '小紙杯＋吹風扇', k: 0.25, color: '#f1dfb8' }
  ];
  const ODE_TA = 25, ODE_T0 = 90, ODE_OK = 60;

  // ---------- 熱方程：手機均熱片 ----------
  const HEAT = (() => {
    const L = 60, NX = 121, M = 2400, modes = [];
    const bump = x => 55 * Math.exp(-(((x - 30) / 4) ** 2));
    for (let n = 1; n <= 59; n += 2) {
      let s = 0;
      for (let i = 0; i <= M; i++) { const x = L * i / M; s += (i === 0 || i === M ? 0.5 : 1) * bump(x) * Math.sin(n * Math.PI * x / L); }
      modes.push({ n, b: 2 / L * s * L / M, lam: (n * Math.PI / L) ** 2, sin: Array.from({ length: NX }, (_, i) => Math.sin(n * Math.PI * i / (NX - 1))) });
    }
    return { L, NX, modes, bump };
  })();
  const HEAT_MATS = [{ name: '銅', a: 111 }, { name: '鋁', a: 97 }, { name: '不鏽鋼', a: 4.2 }, { name: '塑膠', a: 0.12 }];
  const heatColor = T => { const u = (T - 25) / 55; return u < 0.5 ? mix('#416fae', '#f2d27a', u * 2) : mix('#f2d27a', '#d75a43', (u - 0.5) * 2); };

  // ---------- 梯度下降：擬合直線 ----------
  const GD = (() => {
    const xs = [0, 0.5, 1, 1.5, 2, 2.5, 3], scores = [48, 50, 61, 72, 71, 84, 89], ys = scores.map(s => s / 10), N = xs.length;
    const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
    const mx = mean(xs), my = mean(ys), mxx = mean(xs.map(x => x * x)), mxy = mean(xs.map((x, i) => x * ys[i]));
    const w = (mxy - mx * my) / (mxx - mx * mx), b = my - w * mx;
    const loss = (W, B) => mean(xs.map((x, i) => (W * x + B - ys[i]) ** 2));
    return { xs, ys, scores, N, mx, mxx, w, b, loss, Lmin: loss(w, b) };
  })();

  MP.register(
    // =====================================================================
    {
      id: 'fourier', track: 'engineering', symbol: '∿', name: '傅立葉級數', question: '音色是怎麼合成的？',
      title: '電子琴怎麼用「小波浪」拼出不同樂器的聲音？',
      intro: '同樣彈一個「La」，鋼琴、長笛、電玩音效聽起來就是不一樣。原因是每個聲音除了基本的振動，還偷偷混了 2 倍、3 倍、4 倍…快的「泛音」，泛音的大小比例就是<b>音色</b>。電子合成器反過來做：把許多倍頻的正弦波按比例加起來，就能拼出想要的聲音。<b>傅立葉級數</b>保證：任何重複的波形，都能拆成這樣一組倍頻正弦波。',
      scene: '模擬：電子合成器用「諧波推桿」疊出音色', viewH: 400,
      chart: '上：合成器面板（左邊按下 A3 鍵；右邊第 k 根推桿＝第 k 倍頻正弦波的音量，紅色＝已加入）　下：橘紅線是疊出的波形，灰虛線是目標波形',
      caption: '基頻 220 Hz（A3），下圖畫兩個週期。推桿高度＝係數 |b<sub>k</sub>| 相對於第 1 根的比例，標「0」的倍頻在這個波形裡完全不需要。真實樂器的泛音還會隨時間變化（起音、衰減），這裡只模擬穩定持續的一個音。',
      controls: [
        { key: 'wave', label: '想合成的音色', options: ['方波', '鋸齒波', '三角波'], value: 0 },
        ['terms', '推上去的推桿（最高到第 N 倍頻）', 1, 25, 1, 5, '']
      ],
      play: 'terms',
      try: '選「方波」，按播放把推桿從 1 推到 25：平坦處越來越平，但跳躍旁的小尖角始終降不下去（吉布斯現象）。再換「三角波」，只要幾根推桿就很像了，為什麼？',
      resultLabel: '已經拼出的能量比例（Parseval）',
      takeaway: '任何重複的波形＝一組倍頻正弦波的加總；各倍頻的大小（係數）決定了音色。',
      application: '「把訊號拆成頻率成分」是音訊、通訊、影像壓縮的第一步；下一課的傅立葉轉換把它推廣到不重複的訊號。',
      tech: [
        ['🎹', '電子合成器與電子琴', '加法合成直接把許多倍頻正弦波按比例相加；減法合成則從富含諧波的鋸齒波、方波出發，再用濾波器削掉部分頻率。'],
        ['🎧', 'MP3／AAC 音訊壓縮', '把每一小段聲音轉成頻率係數（MDCT，傅立葉的近親），只保留人耳聽得出來的部分，檔案就能小很多。'],
        ['🔇', '降噪耳機', '分析環境噪音的頻率成分，產生相位相反的聲波去抵消；對引擎聲這類低頻、規律重複的噪音特別有效。'],
        ['⚡', '電力系統諧波', '電力公司與工廠用電力品質分析儀量測 60 Hz 的 3、5、7… 倍諧波；諧波太多會讓變壓器過熱，需要加裝濾波設備。']
      ],
      teach: {
        grade: '國小六年級～國中八年級',
        connect: '倍數（2 倍、3 倍頻率）、坐標平面上的週期圖形、國中「函數圖形」與自然科「聲音的高低與音色」；高中學到 sin 後可直接接上公式。',
        activity: '準備：一條約 3 公尺的跳繩、方格紙、彩色筆、老師事先印好的「波高度表」（把一個週期切成 12 格，列出大波與小波在每格的高度）。① 兩位同學甩跳繩，先甩出「一個大肚子」，再試著甩出「兩個肚子」「三個肚子」，體會 2 倍、3 倍頻。② 各組在方格紙上描出大波 A（高 4 格），再描出 3 倍快、高度只有 1/3 的小波 B。③ 把 A、B 在同一格的高度相加，描出新曲線，觀察它變得比較「方」。④ 再加上 5 倍快、高度 1/5 的小波 C，比較轉角是否更陡。',
        ask: ['為什麼同樣彈「La」，鋼琴和長笛聽起來不一樣？', '加越多小波，方波的轉角最後會變成完美的直角嗎？跳躍旁的小尖角呢？', '方波只用到 1、3、5… 奇數倍頻，偶數倍到哪裡去了？（提示：方波後半週期剛好是前半週期上下翻轉）'],
        myth: '「加夠多項就會一模一樣」不完全對：在跳躍點附近，部分和永遠會多衝出約 9%（跳躍量）的小尖角，只是越來越窄；要用「能量（平方平均誤差）」來衡量，誤差才會趨近 0。'
      },
      formula: 'f(t) = a<sub>0</sub>/2 + ∑<sub>k=1</sub><sup>∞</sup> [a<sub>k</sub> cos(kω<sub>0</sub>t) + b<sub>k</sub> sin(kω<sub>0</sub>t)]，b<sub>k</sub> = (2/T)∫<sub>0</sub><sup>T</sup> f(t) sin(kω<sub>0</sub>t) dt<br>方波 b<sub>k</sub> = 4/(πk)（k 奇數）；鋸齒波 b<sub>k</sub> = 2(−1)<sup>k+1</sup>/(πk)；三角波 b<sub>k</sub> = 8(−1)<sup>(k−1)/2</sup>/(π²k²)（k 奇數）<br>Parseval：(1/T)∫<sub>0</sub><sup>T</sup> f(t)² dt = a<sub>0</sub>²/4 + ½∑<sub>k≥1</sub>(a<sub>k</sub>² + b<sub>k</sub>²)',
      formal: 'T 是週期、ω<sub>0</sub> = 2π/T 是基頻角頻率（本例 T ≈ 4.5 ms）。三個目標波都是奇函數，所以 a<sub>k</sub> = 0、只剩正弦項；方波與三角波還具有半波對稱 f(t + T/2) = −f(t)，因此偶數倍頻係數為 0。收斂性：若 f 在一週期內分段平滑（Dirichlet 條件），部分和 S<sub>N</sub> 在連續點收斂到 f(t)，在跳躍點收斂到左右極限的平均；只要 f 平方可積，S<sub>N</sub> 就在均方（L²）意義下收斂，這正是 Parseval 等式讓「能量比例」趨近 100% 的原因。方波、鋸齒波有跳躍，係數只以 1/k 衰減，收斂慢且非均勻：跳躍附近的最大過衝趨近跳躍量的約 8.95%（(1/π)∫<sub>0</sub><sup>π</sup> sin x / x dx − ½），即吉布斯現象；三角波連續、係數以 1/k² 衰減，絕對且均勻收斂。一般規律：f 越平滑，係數衰減越快。音訊上第 k 倍頻就是第 k 諧波；真實樂器還有非整數倍的泛音與隨時間變化的包絡，需要用短時傅立葉轉換分析。',
      quiz: [
        { question: '方波在跳躍點旁的小尖角，推桿推到很多根之後會怎樣？', options: ['完全消失', '越來越窄，但最高點仍多出約跳躍量的 9%', '越來越高，變成無限大'], answer: 1, why: '對！這就是吉布斯現象：尖角變窄、能量誤差趨近 0，但最高點始終多出約 9% 的跳躍量。', hint: '把推桿推到 25，看下圖紅點標的最高值。' },
        { question: '三角波只要幾根推桿就很像了，主要原因是？', options: ['三角波沒有跳躍，係數以 1/k² 很快變小', '三角波只用偶數倍頻', '三角波的基頻比較高'], answer: 0, why: '對！波形越平滑，高倍頻的係數衰減越快，少少幾根推桿就夠了。' }
      ],
      related: ['transform', 'heat', 'circle', 'position'],
      draw(k, v) {
        const { C, fmt } = k, wave = FOURIER_WAVES[v.wave] || FOURIER_WAVES[0], N = Math.round(v.terms), KMAX = 25;
        k.box(10, 8, 580, 152, { fill: '#f4f6fb', title: '🎹 合成器面板：第 k 根推桿＝第 k 倍頻的正弦波（基頻 220 Hz）' });
        // Keyboard with the A3 key pressed.
        const kx = 24, ky = 40, kw = 15;
        for (let i = 0; i < 7; i++) k.rect(kx + i * kw, ky, kw - 1, 78, i === 5 ? C.blueSoft : '#fff', { stroke: '#9baea8', rx: 2 });
        for (const i of [0, 1, 3, 4, 5]) k.rect(kx + (i + 1) * kw - 5, ky, 9, 46, C.ink, { rx: 1 });
        k.circle(kx + 5.5 * kw - 0.5, ky + 66, 4, C.blue);
        k.text(kx + 52, 136, '按下 A3', { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: C.ink });
        k.text(kx + 52, 151, '220 Hz', { 'text-anchor': 'middle', 'font-size': 10 });
        // Harmonic faders (equalizer-like bars).
        const bx0 = 150, bw = (578 - bx0) / KMAX, base = 124, maxH = 72, b1 = Math.abs(wave.b(1));
        for (let kk = 1; kk <= KMAX; kk++) {
          const x = bx0 + (kk - 1) * bw, amp = Math.abs(wave.b(kk)) / b1, on = kk <= N;
          k.rect(x + 3, base - maxH, bw - 6, maxH, '#e3e8ec', { rx: 3 });
          if (amp > 1e-9) k.rect(x + 3, base - Math.max(1.5, amp * maxH), bw - 6, Math.max(1.5, amp * maxH), on ? C.coral : '#c3ccc8', { rx: 2 });
          else k.text(x + bw / 2, base - 4, '0', { 'text-anchor': 'middle', 'font-size': 10, fill: C.gray });
          k.text(x + bw / 2, base + 14, kk, { 'text-anchor': 'middle', 'font-size': 10, fill: on ? C.ink : C.gray, 'font-weight': on ? 700 : 400 });
        }
        k.text(bx0, 152, `已推上 1～${N} 倍頻　${wave.name}：${wave.tone}`, { 'font-size': 11, fill: C.ink });
        // Partial sum vs target.
        const bs = []; for (let kk = 1; kk <= N; kk++) bs.push(wave.b(kk));
        const M = 1000, S = new Float64Array(M);
        let smax = -Infinity, imax = 0, maxErr = 0;
        for (let i = 0; i < M; i++) {
          const u = i / M; let s = 0;
          for (let kk = 1; kk <= N; kk++) if (bs[kk - 1]) s += bs[kk - 1] * Math.sin(TAU * kk * u);
          S[i] = s;
          if (s > smax) { smax = s; imax = i; }
          maxErr = Math.max(maxErr, Math.abs(s - wave.f(u)));
        }
        const p = k.plot({ xmin: 0, xmax: 2, ymin: -1.5, ymax: 1.5, left: 50, width: 530, top: 192, height: 168, xticks: 4, yticks: 6, xlabel: '時間（週期；1 週期 ≈ 4.5 毫秒）', ylabel: '喇叭振膜的位置（聲波）', tickFmt: x => Number(x.toFixed(2)) });
        k.polyline(Array.from({ length: 1601 }, (_, i) => { const u = i / 800; return [p.x(u), p.y(wave.f(Math.min(u, 1.99999)))]; }), C.gray, { 'stroke-dasharray': '6 5', 'stroke-width': 2 });
        k.polyline(Array.from({ length: 2 * M + 1 }, (_, i) => [p.x(i / M), p.y(S[i % M])]), C.coral, { 'stroke-width': 3 });
        const umax = imax / M;
        k.dot(p, umax, smax, C.coral, 5);
        const right = p.x(umax) > 300;
        const over = (smax - 1) / 2 * 100;
        k.text(p.x(umax) + (right ? -9 : 9), p.y(smax) - 6, wave.jump ? `最高 ${fmt(smax, 3)}（多衝 ${fmt(over, 1)}% 跳躍量）` : `最高 ${fmt(smax, 3)}`, { 'text-anchor': right ? 'end' : 'start', 'font-size': 11, fill: C.coral, 'font-weight': 700, ...halo });
        let energy = 0, used = 0; bs.forEach(b => { energy += b * b / 2; if (b) used++; });
        const pct = energy / wave.power * 100;
        return {
          result: `${fmt(pct, 1)}%`,
          detail: `用了 1～${N} 倍頻中 ${used} 個非零諧波：½∑b_k² = ${fmt(energy, 4)}，目標波的能量 ${fmt(wave.power, 4)}，比例 ${fmt(pct, 1)}%。` +
            (wave.jump ? `最高點 ${fmt(smax, 3)}，比目標多衝出跳躍量的 ${fmt(over, 1)}%（N → ∞ 時趨近 8.95%，不會消失）。` : `三角波沒有跳躍，最大誤差只剩 ${fmt(maxErr, 3)}，而且會一致地變小。`)
        };
      }
    },
    // =====================================================================
    {
      id: 'transform', track: 'engineering', symbol: 'ℱ', name: '傅立葉轉換', question: '手機怎麼聽出音高？',
      title: '調音器與聽歌辨曲：聲音裡藏著哪些頻率？',
      intro: '在吵鬧的教室裡，你還是分得出誰在講話，因為每個人的聲音高低不同。手機麥克風錄到的卻只是一條上下抖動的線。<b>傅立葉轉換</b>像一副「頻率眼鏡」，把這條線變成<b>頻譜</b>：每個頻率各有多強。頻譜上的高峰，就是正在響的音——調音器、Shazam 都靠它。不過有個限制：聽的時間越短，峰就越胖，越分不清相近的音。',
      scene: '模擬：調音器 App 用傅立葉轉換找出音高', viewH: 420,
      chart: '左上：麥克風錄到的聲音（藍色是這次分析的片段，灰色是還沒聽到的）　左下：頻譜，峰上標出音名　右：調音器 App 畫面',
      caption: '聲音由幾個純音相加（吉他泛音的大小為示意值）。分析前先乘上 Hann 窗（片段兩端淡入淡出，實際 App 常見的做法），再用連續傅立葉轉換的公式算頻譜。頻譜只畫 0～700 Hz，高度以最高峰為 1。',
      controls: [
        { key: 'sound', label: '聽到的聲音', options: ['單音 A4', 'C 大三和弦', '吉他 A 弦', '相鄰兩音 A4＋A♯4'], value: 1 },
        ['T', '聆聽長度 T', 10, 200, 5, 60, 'ms']
      ],
      play: 'T',
      try: '選「相鄰兩音 A4＋A♯4」，按播放讓聆聽長度從 10 ms 慢慢加長：大約到幾毫秒，頻譜才分得出兩個峰？調音器顯示的音名有沒有變？',
      resultLabel: '調音器判斷的最強音',
      takeaway: '傅立葉轉換把「隨時間變化的訊號」換成「每個頻率有多強」；聽得越久，頻率分得越細。',
      application: '時間越短、頻譜越寬，這個「時間–頻率不確定性」是數學定理，限制了所有即時音訊與無線通訊系統的設計。',
      tech: [
        ['🎵', 'Shazam 聽歌辨曲', '把錄音切成許多短片段做傅立葉轉換，得到頻譜圖，挑出最強的頻率峰在時間–頻率平面上的位置當作「指紋」，再到資料庫比對。'],
        ['📶', 'Wi-Fi、4G、5G', 'OFDM 技術把資料放在許多互相正交的子載波上：發射端做反 FFT 合成，接收端做 FFT 一次把所有子載波拆開。'],
        ['🧲', 'MRI 核磁共振', '掃描儀量到的原始資料其實是影像的空間頻率（k-space），電腦做反傅立葉轉換後才得到切面影像。'],
        ['🗣️', '語音辨識（如 Whisper）', '先把聲音逐段做 FFT，轉成依人耳尺度分組的梅爾頻譜圖；Transformer 模型讀的是頻譜圖，而不是原始波形。']
      ],
      teach: {
        grade: '國小五年級～國中九年級',
        connect: '國小「長條圖」（頻譜就是「每個頻率有多少」的長條圖）、自然科「音調高低與振動快慢」、國中「坐標平面與函數圖形」。',
        activity: '準備：3 個裝不同水量的玻璃瓶（或木琴的 3 個音）、黑板上畫一條「低音→高音」的橫軸、磁鐵。① 老師背對學生，同時敲 1～3 個瓶子。② 學生閉眼聆聽，上台把磁鐵貼在聽到的「低、中、高」位置，越響貼越多個——這就是人工頻譜。③ 公布答案比對。④ 再試「敲一下立刻用手按住瓶子」的極短聲音，比較是不是比較難判斷音高——聽得太短，頻率就模糊。',
        ask: ['和弦在左上圖看起來忽大忽小，為什麼在頻譜上卻是清楚的三根峰？', '調音器為什麼要「聽一下」才顯示音名，不能一瞬間就顯示？', '兩個音只差一點點時，要怎樣才能在頻譜上分開它們？'],
        myth: '「峰很胖代表聲音不純」不一定：峰的寬度也取決於你聽了多久。聽得太短，就算是最純的單音，峰也會變寬；這是數學限制（時間–頻率不確定性），不是麥克風不夠好。'
      },
      formula: 'X(f) = ∫<sub>−∞</sub><sup>∞</sup> x(t) e<sup>−j2πft</sup> dt，x(t) = ∫<sub>−∞</sub><sup>∞</sup> X(f) e<sup>j2πft</sup> df<br>加窗：x<sub>w</sub>(t) = w(t)x(t) ⇒ X<sub>w</sub> = X ∗ W；A sin(2πf<sub>0</sub>t) ⇒ X<sub>w</sub>(f) = (A/2j)[W(f − f<sub>0</sub>) − W(f + f<sub>0</sub>)]<br>Hann 窗（長度 T）：W(f) = (T/2)·sinc(fT)/(1 − f²T²)·e<sup>−jπfT</sup>，主瓣半寬 2/T；不確定性 σ<sub>t</sub>σ<sub>f</sub> ≥ 1/(4π)',
      formal: 'x(t) 是麥克風訊號，X(f) 是複數頻譜：|X(f)| 是頻率 f 的強度，輻角是相位。存在條件：x 絕對可積時積分直接收斂；x 平方可積時以 L² 極限定義，Plancherel 定理保證能量守恆 ∫|x|² dt = ∫|X|² df。純正弦波不可積，它的轉換是兩根狄拉克 δ 函數（無限細的峰）。App 只能聽有限長度 T，等於把訊號乘上窗函數 w(t)；由卷積定理，頻譜變成 δ 峰與 W(f) 的卷積，每根峰被「抹成」寬約 4/T 的主瓣。因此兩個頻率大約要相距 2/T 以上才分得開：A4（440 Hz）與 A♯4（466.16 Hz）相差約 26 Hz，需要聽約 2/26 s ≈ 77 ms。Hann 窗的旁瓣很低（約 −31 dB），代價是主瓣比矩形窗寬一倍。電腦實際算的是離散傅立葉轉換 DFT（用 FFT 演算法，計算量 O(N log N)），且取樣率必須大於訊號最高頻率的兩倍（取樣定理）。本模擬直接用加窗後的連續公式計算（含負頻率項），等同於零填補到很細的 DFT。',
      quiz: [
        { question: '把聆聽長度 T 從 100 ms 縮短到 20 ms，頻譜上的峰會？', options: ['變細', '變寬（大約寬 5 倍）', '完全不變'], answer: 1, why: '對！峰寬約與 1/T 成正比：聽的時間縮短 5 倍，峰就寬約 5 倍。', hint: '拖動「聆聽長度」滑桿，看峰的胖瘦。' },
        { question: 'Shazam 主要記錄什麼來辨認一首歌？', options: ['每一小段時間裡最強頻率峰的位置（頻譜圖上的指紋）', '整首歌的平均音量', '歌手的名字'], answer: 0, why: '對！強峰在時間–頻率平面上的分布就像指紋，即使有點雜音也比較認得出來。' }
      ],
      related: ['fourier', 'convolution', 'position'],
      draw(k, v) {
        const { C, fmt } = k, parts = TF_SOUNDS[v.sound] || TF_SOUNDS[0], T = v.T / 1000, amax = parts.reduce((s, [, a]) => s + a, 0);
        // Time signal: windowed part (blue) and the part not yet heard (gray).
        const pt = k.plot({ xmin: 0, xmax: 200, ymin: -1, ymax: 1, left: 50, width: 340, top: 34, height: 98, xticks: 4, yticks: 2, xlabel: '時間（毫秒）', ylabel: '麥克風聽到的聲音' });
        k.rect(pt.x(0), pt.top, pt.x(v.T) - pt.x(0), pt.height, C.blueSoft, { opacity: 0.6 });
        const sig = tms => parts.reduce((s, [f, a]) => s + a * Math.sin(TAU * f * tms / 1000), 0) / amax;
        const inPts = [], outPts = [], NS = 1600;
        for (let i = 0; i <= NS; i++) {
          const tms = 200 * i / NS;
          if (tms <= v.T) inPts.push([pt.x(tms), pt.y(sig(tms) * 0.5 * (1 - Math.cos(TAU * tms / v.T)))]);
          if (tms >= v.T) outPts.push([pt.x(tms), pt.y(sig(tms) * 0.9)]);
        }
        k.polyline(outPts, '#c9d2cd', { 'stroke-width': 1 });
        k.polyline(inPts, C.blue, { 'stroke-width': 1.2 });
        k.text(Math.min(pt.x(v.T) + 4, 386), pt.top + 12, `聽 ${v.T} ms`, { 'font-size': 11, fill: C.blue, 'font-weight': 700, 'text-anchor': pt.x(v.T) > 330 ? 'end' : 'start', ...halo });
        // Spectrum (Hann-windowed, both frequency images).
        const mag = new Float64Array(701);
        let mmax = 0;
        for (let f = 0; f <= 700; f++) {
          let re = 0, im = 0;
          for (const [f0, a] of parts) {
            for (const [d, sgn] of [[f - f0, 1], [f + f0, -1]]) {
              const wv = sgn * a * hannW(d * T), ph = -Math.PI * d * T;
              re += wv * Math.cos(ph); im += wv * Math.sin(ph);
            }
          }
          mag[f] = Math.hypot(re, im); mmax = Math.max(mmax, mag[f]);
        }
        const peaks = [];
        for (let f = 1; f < 700; f++) {
          if (mag[f] >= mag[f - 1] && mag[f] > mag[f + 1] && mag[f] > 0.12 * mmax) {
            const a = mag[f - 1], b = mag[f], c = mag[f + 1], den = a - 2 * b + c;
            const fr = f + (den ? 0.5 * (a - c) / den : 0);
            peaks.push({ f: fr, m: b / mmax });
          }
        }
        const ps = k.plot({ xmin: 0, xmax: 700, ymin: 0, ymax: 1.25, left: 50, width: 340, top: 205, height: 165, xticks: 7, yticks: 5, xlabel: '頻率（Hz）', ylabel: '頻譜：各頻率有多強', tickFmt: x => Number(x.toFixed(2)) });
        const area = [[ps.x(0), ps.y(0)]];
        for (let f = 0; f <= 700; f += 2) area.push([ps.x(f), ps.y(mag[f] / mmax)]);
        area.push([ps.x(700), ps.y(0)]);
        k.polygon(area, C.coralSoft);
        k.polyline(area.slice(1, -1), C.coral, { 'stroke-width': 2.5 });
        let lastX = -99, lastY = 0;
        for (const pk of peaks) {
          const x = ps.x(pk.f);
          let y = ps.y(pk.m) - 7;
          if (x - lastX < 32 && Math.abs(y - lastY) < 14) y = lastY - 14;
          k.text(x, y, noteOf(pk.f).name, { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: C.ink, ...halo });
          lastX = x; lastY = y;
        }
        // Tuner phone.
        const top = peaks.reduce((best, pk) => (pk.m > best.m ? pk : best), peaks[0] || { f: 440, m: 1 });
        const note = noteOf(top.f), inTune = Math.abs(note.cents) < 5;
        k.rect(408, 8, 182, 404, C.ink, { rx: 24 });
        k.rect(416, 22, 166, 376, '#fff', { rx: 16 });
        k.text(499, 46, '🎸 調音器', { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.ink });
        k.text(499, 92, note.name, { 'text-anchor': 'middle', 'font-size': 38, 'font-weight': 700, fill: inTune ? C.green : C.coral });
        k.text(499, 116, `${fmt(top.f, 1)} Hz`, { 'text-anchor': 'middle', 'font-size': 13, fill: C.ink });
        const gx = 499, gy = 206, gr = 52, ang = c => Math.PI * (1 - (MP.clamp(c, -50, 50) + 50) / 100);
        k.path(`M${gx - gr},${gy} A${gr},${gr} 0 0 1 ${gx + gr},${gy}`, '#d5ddd8', { 'stroke-width': 10 });
        k.path(`M${gx + gr * Math.cos(ang(5))},${gy - gr * Math.sin(ang(5))} A${gr},${gr} 0 0 0 ${gx + gr * Math.cos(ang(-5))},${gy - gr * Math.sin(ang(-5))}`, C.green, { 'stroke-width': 10, 'stroke-linecap': 'butt' });
        for (const c of [-50, 0, 50]) k.text(gx + (gr + 15) * Math.cos(ang(c)), gy - (gr + 15) * Math.sin(ang(c)) + 4, c > 0 ? `+${c}` : c, { 'text-anchor': 'middle', 'font-size': 10 });
        k.line(gx, gy, gx + (gr - 4) * Math.cos(ang(note.cents)), gy - (gr - 4) * Math.sin(ang(note.cents)), inTune ? C.green : C.coral, { 'stroke-width': 3 });
        k.circle(gx, gy, 5, C.ink);
        k.text(gx, gy + 22, inTune ? '✅ 音準' : `${note.cents < 0 ? '偏低' : '偏高'} ${fmt(Math.abs(note.cents), 0)} 音分`, { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: inTune ? C.green : C.coral });
        k.line(426, 240, 572, 240, C.grid, { 'stroke-width': 1 });
        k.text(428, 260, '🔎 頻譜找到的峰', { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        peaks.slice(0, 6).forEach((pk, i) => {
          k.text(434, 282 + i * 18, noteOf(pk.f).name, { 'font-size': 12, 'font-weight': 700, fill: C.ink });
          k.text(568, 282 + i * 18, `${fmt(pk.f, 1)} Hz`, { 'font-size': 12, 'text-anchor': 'end' });
        });
        k.text(499, 390, `解析度約 2/T ≈ ${fmt(2000 / v.T, 0)} Hz`, { 'text-anchor': 'middle', 'font-size': 10 });
        const merged = v.sound === 3 && peaks.length < 2;
        return {
          result: `${note.name}（${fmt(top.f, 1)} Hz）`,
          detail: `聆聽 T = ${v.T} ms，峰的半寬約 2/T = 2 ÷ ${fmt(T, 3)} s ≈ ${fmt(2 / T, 0)} Hz；頻譜找到 ${peaks.length} 個峰：${peaks.map(pk => `${noteOf(pk.f).name} ${fmt(pk.f, 1)} Hz`).join('、')}。` +
            (merged ? '兩個音只差 26 Hz，峰還黏在一起，要聽久一點才分得開。' : `最強峰離 ${note.name} 的標準音 ${note.cents >= 0 ? '+' : '−'}${fmt(Math.abs(note.cents), 1)} 音分。`)
        };
      }
    },
    // =====================================================================
    {
      id: 'laplace', track: 'engineering', symbol: 'ℒ', name: '拉普拉斯轉換', question: '避震器怎麼調才舒服？',
      title: '車子壓上墊高路面：彈不停、剛剛好，還是慢吞吞？',
      intro: '用手壓一下彈簧床再放開，它會上下彈好幾下；壓一下裝滿蜂蜜的袋子，它只會慢慢回來。汽車的避震系統就是「彈簧＋阻尼器（像在油裡移動的活塞）」。描述它的方程裡有速度、加速度這些微分，很難直接解。<b>拉普拉斯轉換</b>像「換一本帳本」：在新帳本裡，「微分一次」變成「乘一次 s」，微分方程就變成國中學過的代數方程，解完再換回時間。',
      scene: '模擬：汽車懸吊（彈簧＋阻尼器）駛上墊高路面', viewH: 420,
      chart: '左上：四分之一車模型（一個車輪、彈簧、阻尼器與車身）　右上：s 平面上的兩個極點 ×（虛線是 ζ 改變時極點走的路）　下：車身高度隨時間的變化',
      caption: '車身自然頻率設為 1 Hz（ω<sub>n</sub> = 2π rad/s），路面在 t = 0 突然墊高 10 cm（步階輸入）。簡化：輪胎視為剛體，並省略阻尼器把路面衝擊直接傳上車身的那一項。換到 s 帳本後：(s² + 2ζω<sub>n</sub>s + ω<sub>n</sub>²)X(s) = ω<sub>n</sub>²/s。',
      controls: [
        ['zeta', '阻尼比 ζ（避震器多「黏」）', 0, 1.5, 0.05, 0.3, ''],
        ['t', '壓上墊高路面後', 0, 3, 0.02, 0.6, '秒']
      ],
      play: 't',
      try: '把 ζ 從 0 慢慢調到 1.5：右上的兩個 × 怎麼從虛軸往左移、在 ζ = 1 撞在一起，再分成兩個實數？哪一個 ζ 讓車身最快穩定？',
      resultLabel: '懸吊狀態與最大衝過頭',
      takeaway: '拉普拉斯轉換把微分方程變成代數；極點在 s 平面的位置，一眼看出系統會不會晃、多快穩定。',
      application: '工程師設計避震器、電路與控制器時，常常先在 s 平面上「擺放極點」，再回頭決定零件數值。',
      tech: [
        ['🚗', '汽車懸吊與電子避震', '依阻尼比在「舒適」和「操控」之間調校；可調式電子避震器能隨路況即時改變阻尼，等於即時移動極點。'],
        ['🔌', '電路設計（RC、RLC 濾波器）', '電容、電感在 s 帳本裡分別變成 1/(sC)、sL，整個電路可以像電阻一樣用代數解，得到轉移函數。'],
        ['🚁', '無人機與機器人控制', '姿態控制器（常見 PID）用轉移函數分析：閉迴路極點都在左半平面才穩定，離虛軸越遠反應越快。'],
        ['❄️', '冷氣與工業恆溫控制', '溫控器的 PID 參數常用拉普拉斯模型配合根軌跡、波德圖來調校，避免溫度忽冷忽熱。']
      ],
      teach: {
        grade: '國中七年級～九年級（可延伸到高中物理）',
        connect: '國中「一元二次方程式與判別式」：s² + 2ζω s + ω² = 0 的判別式正負，決定兩根是實數（不晃）還是沒有實數根（會晃）。也連結「比例」與「坐標平面」。',
        activity: '準備：橡皮筋或彈簧、裝了硬幣的夾鏈袋、一杯水與一杯洗碗精（或糖漿）、尺、碼錶。① 把袋子掛在橡皮筋下，拉低 3 公分後放開，在空氣中數它彈幾下才停（阻尼很小）。② 讓袋子泡在水中重做，再泡在洗碗精中重做。③ 每組記錄「彈幾下」與「幾秒停下來」，填成表格。④ 討論：哪一杯最像好的汽車避震器？太黏又會怎樣？',
        ask: ['坐車經過減速丘時，車子一直上下晃，代表避震器可能出了什麼問題？', 'ζ = 1 時剛好不晃，為什麼一般轎車不調到 ζ ≥ 1？（提示：太硬、路面衝擊會直接傳上來）', '判別式 b² − 4ac 什麼時候大於 0？對應到右上圖的哪一種樣子？'],
        myth: '「阻尼越大越穩越好」不對：過阻尼雖然不晃，但車身要很久才回到定位；真實懸吊中阻尼太大還會把路面衝擊直接傳給乘客。設計是在「晃」與「硬」之間取捨。'
      },
      formula: 'F(s) = ℒ{f}(s) = ∫<sub>0</sub><sup>∞</sup> f(t)e<sup>−st</sup> dt；ℒ{f′} = sF − f(0)，ℒ{f″} = s²F − sf(0) − f′(0)<br>x″ + 2ζω<sub>n</sub>x′ + ω<sub>n</sub>²x = ω<sub>n</sub>²u(t)，x(0) = x′(0) = 0 ⇒ X(s) = ω<sub>n</sub>² / [s(s² + 2ζω<sub>n</sub>s + ω<sub>n</sub>²)]<br>極點 s = −ζω<sub>n</sub> ± ω<sub>n</sub>√(ζ² − 1)；0 < ζ < 1：x(t) = 1 − e<sup>−ζω<sub>n</sub>t</sup>[cos ω<sub>d</sub>t + (ζ/√(1−ζ²)) sin ω<sub>d</sub>t]，ω<sub>d</sub> = ω<sub>n</sub>√(1−ζ²)',
      formal: 'x(t) 是車身相對原高度的位移（以墊高量為 1），u(t) 是單位步階，ω<sub>n</sub> = √(k/m) 是自然角頻率，ζ = c/(2√(km)) 是阻尼比（m 質量、k 彈簧常數、c 阻尼係數）。單邊拉普拉斯轉換對「指數階」函數 |f(t)| ≤ Me<sup>αt</sup> 在 Re(s) > α 收斂（收斂區 ROC）；微分性質會自動帶入初始條件，這是它比傅立葉轉換更適合解初值問題的原因。轉移函數 H(s) = ω<sub>n</sub>²/(s² + 2ζω<sub>n</sub>s + ω<sub>n</sub>²)；線性非時變（LTI）系統 BIBO 穩定 ⇔ 所有極點實部 < 0（左半平面）。ζ = 0：極點在虛軸上，永遠振盪（臨界穩定）；0 < ζ < 1 欠阻尼，最大過衝 M<sub>p</sub> = e<sup>−πζ/√(1−ζ²)</sup>，2% 穩定時間約 4/(ζω<sub>n</sub>)；ζ = 1 臨界阻尼，重根 −ω<sub>n</sub>，x = 1 − (1 + ω<sub>n</sub>t)e<sup>−ω<sub>n</sub>t</sup>；ζ > 1 過阻尼，兩個負實根，靠近虛軸的慢極點主導。模型假設彈簧與阻尼器是線性、參數不隨時間改變；完整的基座激振方程還有 2ζω<sub>n</sub>y′ 項，真實車輛也要考慮輪胎彈性（車身＋車輪的二自由度模型）。',
      quiz: [
        { question: '右上 s 平面中，兩個極點變成上下一對（有虛部）時，車身會？', options: ['上下晃動，晃動慢慢變小', '完全不動', '越晃越大飛出去'], answer: 0, why: '對！虛部是晃動的角頻率，負的實部決定晃動多快消失。', hint: '把 ζ 調到 0.2，看看下圖的曲線。' },
        { question: '拉普拉斯轉換最大的好處是？', options: ['把「微分」變成「乘以 s」，微分方程變成代數方程', '讓車子變輕', '把時間變成負的'], answer: 0, why: '對！在 s 帳本裡解代數，再轉回時間，就得到車身的運動。' }
      ],
      related: ['ode', 'transform', 'eigen', 'exponential'],
      draw(k, v) {
        const { C, fmt } = k, z = v.zeta, t = v.t, x = lapResp(z, t);
        // Quarter-car scene.
        k.box(10, 8, 192, 214, { fill: '#eef3f1', title: '🚗 四分之一車模型' });
        const xs = MP.clamp(105 - 34 * t, 14, 196);
        k.polygon([[14, 214], [14, 200], [xs, 200], [xs, 184], [196, 184], [196, 214]], '#5d6870');
        k.text(150, 204, '路面墊高 10 cm', { 'text-anchor': 'middle', 'font-size': 10, fill: '#fff' });
        const bodyB = 124 - 16 * x;
        k.circle(105, 171, 13, C.ink); k.circle(105, 171, 5, '#c9d2cd');
        k.line(74, 158, 136, 158, C.gray, { 'stroke-width': 4 });
        const zig = [[80, 158]], nz = 8;
        for (let i = 1; i < nz; i++) zig.push([80 + (i % 2 ? -8 : 8), 158 - (158 - bodyB) * i / nz]);
        zig.push([80, bodyB]);
        k.polyline(zig, C.blue, { 'stroke-width': 2.5 });
        k.rect(122, bodyB, 16, 22, C.yellowSoft, { stroke: C.yellow, 'stroke-width': 1.5 });
        k.line(130, 158, 130, bodyB + 14, C.yellow, { 'stroke-width': 3 });
        k.line(124, bodyB + 14, 136, bodyB + 14, C.yellow, { 'stroke-width': 3 });
        k.line(44, 108, 166, 108, C.gray, { 'stroke-dasharray': '4 4', 'stroke-width': 1.5 });
        k.rect(50, bodyB - 30, 110, 30, C.coral, { rx: 6 });
        k.text(105, bodyB - 11, `車身 +${fmt(10 * x, 1)} cm`, { 'text-anchor': 'middle', 'font-size': 11, fill: '#fff', 'font-weight': 700 });
        k.emoji(105, bodyB - 42, z < 0.25 ? '🤢' : z < 0.9 ? '🙂' : '😐', 20);
        k.text(176, 150, '彈簧', { 'font-size': 10, fill: C.blue, 'text-anchor': 'middle' });
        k.text(176, 164, '阻尼器', { 'font-size': 10, fill: C.yellow, 'text-anchor': 'middle' });
        // s-plane.
        k.box(210, 8, 380, 214, { fill: '#fff', title: '📐 s 平面：極點 × 的位置決定會不會晃' });
        const L0 = 252, Wd = 318, X = re => L0 + (re + 20) / 24 * Wd;
        k.rect(L0, 52, X(0) - L0, 124, C.greenSoft);
        k.rect(X(0), 52, L0 + Wd - X(0), 124, C.coralSoft);
        const ps = k.plot({ xmin: -20, xmax: 4, ymin: -8, ymax: 8, left: L0, width: Wd, top: 52, height: 124, xticks: 6, yticks: 4, xlabel: 'Re(s)：越左＝晃動消失越快', ylabel: 'Im(s)：晃動快慢' });
        k.line(ps.x(0), ps.top, ps.x(0), ps.bottom, C.axis);
        const up = [], dn = [];
        for (let i = 0; i <= 40; i++) { const zz = i / 40 * 0.999, pl = lapPoles(zz); up.push([ps.x(pl.re), ps.y(pl.im)]); dn.push([ps.x(pl.re), ps.y(-pl.im)]); }
        k.polyline(up, C.gray, { 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
        k.polyline(dn, C.gray, { 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
        const pEnd = lapPoles(1.5);
        k.line(ps.x(Math.max(-20, pEnd.b)), ps.y(0), ps.x(pEnd.a), ps.y(0), C.gray, { 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
        k.text(ps.x(-19.5), ps.y(6.6), '穩定（左半平面）', { 'font-size': 10, fill: C.green, 'font-weight': 700 });
        k.text(ps.x(2), ps.y(-6.4), '不穩定', { 'font-size': 10, fill: C.coral, 'text-anchor': 'middle', 'font-weight': 700 });
        const cross = (re, im, color) => {
          const cx = ps.x(MP.clamp(re, -20, 4)), cy = ps.y(im), s = 7;
          k.line(cx - s, cy - s, cx + s, cy + s, color, { 'stroke-width': 3.5 });
          k.line(cx - s, cy + s, cx + s, cy - s, color, { 'stroke-width': 3.5 });
        };
        const pl = lapPoles(z);
        let poleText;
        if (!pl.real) { cross(pl.re, pl.im, C.coral); cross(pl.re, -pl.im, C.coral); poleText = `${pl.re === 0 ? '0' : fmt(pl.re, 2)} ± ${fmt(pl.im, 2)}j`; }
        else { cross(pl.a, 0, C.coral); cross(pl.b, 0, C.coral); poleText = Math.abs(pl.a - pl.b) < 1e-3 ? `${fmt(pl.a, 2)}（重根）` : `${fmt(pl.a, 2)}、${fmt(pl.b, 2)}`; }
        k.text(ps.x(-19.5), ps.y(4.4), `極點 s = ${poleText}`, { 'font-size': 11, fill: C.coral, 'font-weight': 700, ...halo });
        // Time response.
        const regime = z === 0 ? '無阻尼：永遠晃不停' : z < 1 - 1e-6 ? '欠阻尼：衝過頭再彈回' : z <= 1 + 1e-6 ? '臨界阻尼：最快且不衝過頭' : '過阻尼：不晃但慢吞吞';
        const p = k.plot({ xmin: 0, xmax: 3, ymin: 0, ymax: 2, left: 50, width: 530, top: 266, height: 108, xticks: 6, yticks: 4, xlabel: '時間 t（秒）', ylabel: '車身高度（× 墊高量）' });
        k.text(580, 257, regime, { 'text-anchor': 'end', 'font-size': 12, 'font-weight': 700, fill: z > 0 && z < 1 - 1e-6 ? C.coral : z === 0 ? C.coral : C.green });
        k.line(p.x(0), p.y(1), p.x(3), p.y(1), C.gray, { 'stroke-dasharray': '6 5', 'stroke-width': 2 });
        k.curve(p, s => lapResp(z, s), '#f0b3a6', { 'stroke-width': 2.5 }, 0, 3);
        if (t > 0) k.curve(p, s => lapResp(z, s), C.coral, { 'stroke-width': 3.5 }, 0, t, 200);
        k.line(p.x(t), p.top, p.x(t), p.bottom, C.axis, { 'stroke-width': 1 });
        k.dot(p, t, x, C.coral, 6);
        // Overshoot and 2% settling time.
        const Mp = z < 1 - 1e-6 ? Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)) : 0;
        let ts = null;
        if (z > 0) { for (let s = 30; s >= 0; s -= 0.005) if (Math.abs(lapResp(z, s) - 1) > 0.02) { ts = s; break; } }
        return {
          result: `${regime.split('：')[0]} · ${Mp > 0 ? `衝過頭 ${fmt(Mp * 100, 0)}%` : '不衝過頭'}`,
          detail: `極點 s = −ζω ± ω√(ζ²−1) = ${poleText}（ω = 2π ≈ 6.28）。` +
            (ts === null ? '實部是 0，晃動永遠不會消失。' : `約 ${fmt(ts, 2)} 秒後車身穩定在 ±2% 以內。`) +
            `此刻 t = ${fmt(t, 2)} 秒，車身在 ${fmt(x, 3)} × 10 cm = ${fmt(10 * x, 1)} cm。`
        };
      }
    },
    // =====================================================================
    {
      id: 'convolution', track: 'engineering', symbol: '∗', name: '卷積', question: '修圖 App 怎麼讓照片變模糊？',
      title: '一個 3×3 的小窗格，掃過整張照片',
      intro: '拿一張挖了 3×3 小窗的墊板蓋在照片上，把露出來的 9 個格子各乘上一個「權重」再加起來，寫進新照片的同一格；然後一格一格移過整張照片。權重都差不多 → 每格變成鄰居的平均，照片變柔和（模糊）；中間加重、四周扣分 → 邊緣變得更清楚（銳化）。這個「滑動、相乘、加總」的動作就是<b>卷積</b>，手機修圖、人像模式與 AI 看圖都靠它。',
      scene: '模擬：手機修圖 App 的濾鏡（3×3 卷積核）', viewH: 420,
      chart: '左：原始照片放大後的像素（紅框是選中像素的 3×3 鄰居）　中：濾鏡核（藍＝正權重、紅＝負權重）　右：套用濾鏡後的照片　下：選中像素的 9 個乘積',
      caption: '10×10 的灰階照片，亮度 0（黑）～1（白），含少量雜訊。邊界外的像素用最靠近的邊界像素補齊。顯示時把結果截在 0～1 之間；邊緣偵測取絕對值。也可以直接點左圖或右圖的像素來選取。',
      controls: [
        { key: 'kernel', label: '濾鏡', options: ['原圖', '模糊', '銳化', '邊緣偵測'], value: 1 },
        ['row', '選中像素：第幾列（由上往下）', 1, 10, 1, 5, ''],
        ['col', '選中像素：第幾行（由左往右）', 1, 10, 1, 6, '']
      ],
      try: '把選中像素移到黑色方塊的右邊緣（第 5 列、第 6 行），輪流切換「模糊」「銳化」「邊緣偵測」：同樣 9 個鄰居，只換一組權重，答案差多少？',
      resultLabel: '選中像素的輸出亮度（未截斷）',
      takeaway: '卷積＝把同一組權重滑過每個位置，做「相乘再加總」；換一組權重，就換一種濾鏡。',
      application: '卷積神經網路（CNN）不用人手設計權重，而是從大量照片中自己學出成千上萬組卷積核。',
      tech: [
        ['📱', '手機修圖與人像模式', '模糊、銳化、降噪都是卷積；人像模式先估出景深，再對背景做大範圍的模糊，模擬大光圈鏡頭的散景。'],
        ['🚗', '自駕車與影像辨識（CNN）', '卷積神經網路一層層用「學出來的」卷積核找出邊緣、紋理與形狀，用來辨識車道、行人和號誌。'],
        ['🎙️', '音訊殘響（卷積殘響）', '錄下音樂廳對一聲短促脈衝的回應（脈衝響應），再和乾淨的錄音做卷積，聽起來就像在那個音樂廳演奏。'],
        ['📡', '數位濾波器', '手機、耳機裡的 FIR 濾波器就是一維卷積：每個輸出是最近幾個取樣乘上權重的總和。']
      ],
      teach: {
        grade: '國小五年級～國中七年級',
        connect: '國小「平均數」與「四則混合運算」、國中「正負數運算」；權重加總為 1 的卷積就是加權平均。',
        activity: '準備：8×8 方格紙（每格填 0～9 的數字當亮度，例如中間一塊填 9、外圍填 0）、一張剪出 3×3 小窗的墊板、計算紙。① 第一回合「模糊」：把小窗蓋在格子上，算露出 9 個數的平均（四捨五入），寫在新方格紙的同一格；全組分工把整張算完。② 第二回合「銳化」：改成「中間 ×5、上下左右各 ×(−1)、四角 ×0」再加總。③ 把兩張新圖並排：哪一張的邊界變糊、哪一張邊界更明顯（甚至出現比 9 還大、比 0 還小的數）？④ 討論：如果權重加起來是 0，平坦的地方會算出多少？',
        ask: ['模糊濾鏡的 9 個權重加起來是多少？為什麼要剛好是 1？', '邊緣偵測的權重加起來是 0，一片平坦的地方會算出多少？', '同一張照片模糊兩次，和用一個比較大的模糊核模糊一次，像不像？'],
        myth: '「模糊就是把照片縮小」不對：模糊是每個像素都換成鄰居的加權平均，照片大小不變，被濾掉的是細節（高頻）。另外，AI 裡說的「卷積」實作上多半沒有把核翻轉（數學上叫互相關）；本例的核上下左右對稱，兩者結果完全相同。'
      },
      formula: '連續：(f ∗ g)(t) = ∫<sub>−∞</sub><sup>∞</sup> f(τ) g(t − τ) dτ　離散二維：y[m,n] = ∑<sub>i=−1</sub><sup>1</sup>∑<sub>j=−1</sub><sup>1</sup> h[i,j]·x[m−i, n−j]<br>卷積定理：ℱ{f ∗ g} = ℱ{f}·ℱ{g}<br>模糊 (1/16)[1 2 1; 2 4 2; 1 2 1]＝(1/16)[1 2 1]ᵀ[1 2 1]，銳化 [0 −1 0; −1 5 −1; 0 −1 0]，邊緣 [−1 −1 −1; −1 8 −1; −1 −1 −1]',
      formal: 'x 是輸入影像、h 是卷積核（系統的脈衝響應）、y 是輸出。卷積刻畫所有線性且平移不變（LTI）的系統：只要系統是線性的，而且同一個輸入放在不同位置會造成同樣形狀的反應，輸出必然是輸入與脈衝響應的卷積。卷積滿足交換律、結合律（所以連續兩次模糊＝用 h ∗ h 模糊一次），以及卷積定理：空間中的卷積等於頻率域的相乘。因此模糊核（權重全正、和為 1）是低通濾波器，削弱高頻細節與雜訊；銳化核＝原圖 − 離散拉普拉斯算子（4 鄰居），放大高頻；邊緣核是 8 鄰居離散拉普拉斯的相反數，權重和為 0，在亮度均勻處輸出 0。高斯模糊核可分離成兩個一維核的外積，每個像素的乘法從 9 次降到 6 次。邊界需要另外約定（補零、複製邊緣、鏡射），本例用複製邊緣。CNN 的「卷積層」實作上是互相關（不翻轉核），核的權重由反向傳播學出來，並且通常同時有多個輸入與輸出通道。',
      quiz: [
        { question: '模糊濾鏡的 9 個權重加總剛好是 1，是為了？', options: ['讓平坦區域的亮度不變，整張照片不會變亮或變暗', '讓照片變暗一倍', '讓照片尺寸變小'], answer: 0, why: '對！權重和為 1 時，平坦區域算完還是原本的亮度，只有細節被抹平。' },
        { question: '邊緣偵測核蓋在一片顏色完全相同的區域，會輸出多少？', options: ['1（全白）', '0（全黑）', '跟原本一樣'], answer: 1, why: '對！權重總和為 0，鄰居都一樣時正負完全抵消；只有亮度有變化的地方（邊緣）才會留下來。', hint: '把選中像素移到照片左上角的空白處，看下方的加總。' }
      ],
      related: ['transform', 'heat', 'matrix', 'neuron'],
      draw(k, v) {
        const { C, fmt } = k, kern = CONV_KERNELS[v.kernel] || CONV_KERNELS[0], st = k.state, key = `${v.row},${v.col}`;
        if (st.key !== key || !st.sel) { st.key = key; st.sel = [v.row - 1, v.col - 1]; }
        const [sr, sc] = st.sel, cell = 16;
        const pick = (node, i, j) => {
          node.style.cursor = 'pointer';
          node.addEventListener('click', () => { st.sel = [i, j]; k.redraw(); });
        };
        // Input photo.
        k.box(10, 8, 186, 216, { fill: '#fff', title: '📷 原始照片（10×10 像素）' });
        const ix = 25, iy = 38;
        for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) pick(k.rect(ix + j * cell, iy + i * cell, cell, cell, grayOf(CONV_IMG[i][j]), { stroke: '#fff', 'stroke-width': 0.5 }), i, j);
        { const x1 = ix + Math.max(0, sc - 1) * cell, y1 = iy + Math.max(0, sr - 1) * cell, x2 = ix + Math.min(10, sc + 2) * cell, y2 = iy + Math.min(10, sr + 2) * cell; k.rect(x1, y1, x2 - x1, y2 - y1, 'none', { stroke: C.coral, 'stroke-width': 3, rx: 2, 'pointer-events': 'none' }); }
        k.text(103, 215, '點任一像素可以選取', { 'text-anchor': 'middle', 'font-size': 10 });
        // Kernel.
        k.box(204, 8, 192, 216, { fill: '#fff', title: `🧮 濾鏡核：${kern.name}` });
        const kc = 36, kx = 246, ky = 44;
        kern.w.forEach((w, n) => {
          const r = Math.floor(n / 3), c = n % 3;
          k.rect(kx + c * kc, ky + r * kc, kc, kc, w > 0 ? C.blueSoft : w < 0 ? C.coralSoft : '#fafbf8', { stroke: '#c9d2cd' });
          k.text(kx + c * kc + kc / 2, ky + r * kc + kc / 2 + 5, w, { 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: w > 0 ? C.blue : w < 0 ? C.coral : C.muted });
        });
        k.text(300, 172, kern.d > 1 ? '每格再 × 1/16' : '（權重直接相乘）', { 'text-anchor': 'middle', 'font-size': 11, fill: C.ink });
        k.text(300, 192, kern.note, { 'text-anchor': 'middle', 'font-size': 11 });
        k.text(300, 211, `權重和＝${fmt(kern.w.reduce((a, b) => a + b, 0) / kern.d, 0)}`, { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: C.ink });
        // Output photo.
        k.box(404, 8, 186, 216, { fill: '#fff', title: '✨ 套用濾鏡後' });
        const ox = 419;
        for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) pick(k.rect(ox + j * cell, iy + i * cell, cell, cell, grayOf(convShow(kern, convAt(kern, i, j).y)), { stroke: '#fff', 'stroke-width': 0.5 }), i, j);
        k.rect(ox + sc * cell, iy + sr * cell, cell, cell, 'none', { stroke: C.coral, 'stroke-width': 3, 'pointer-events': 'none' });
        k.text(497, 215, kern.name === '邊緣偵測' ? '顯示絕對值，越白＝邊緣越強' : '超出 0～1 的部分截掉', { 'text-anchor': 'middle', 'font-size': 10 });
        // The 9 multiply-adds.
        const { terms, y } = convAt(kern, sr, sc), show = convShow(kern, y);
        k.box(10, 232, 580, 180, { fill: '#f7f9f8', title: `🔍 第 ${sr + 1} 列、第 ${sc + 1} 行：鄰居亮度 × 濾鏡權重，再全部加起來` });
        const gc = 34, gy = 258;
        const grid3 = (x0, label, fill, txt, color) => {
          for (let n = 0; n < 9; n++) {
            const r = Math.floor(n / 3), c = n % 3;
            k.rect(x0 + c * gc, gy + r * gc, gc, gc, fill(n), { stroke: '#c9d2cd' });
            k.text(x0 + c * gc + gc / 2, gy + r * gc + gc / 2 + 4, txt(n), { 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, fill: color(n) });
          }
          k.text(x0 + 1.5 * gc, gy + 3 * gc + 18, label, { 'text-anchor': 'middle', 'font-size': 11, fill: C.ink });
        };
        grid3(28, '鄰居亮度', n => grayOf(terms[n].x), n => fmt(terms[n].x, 2), n => (terms[n].x < 0.5 ? '#fff' : C.ink));
        k.text(151, gy + 56, '×', { 'text-anchor': 'middle', 'font-size': 20, fill: C.ink });
        grid3(168, '濾鏡權重', n => (kern.w[n] > 0 ? C.blueSoft : kern.w[n] < 0 ? C.coralSoft : '#fff'), n => (kern.d > 1 ? `${kern.w[n]}/16` : kern.w[n]), n => (kern.w[n] > 0 ? C.blue : kern.w[n] < 0 ? C.coral : C.muted));
        k.text(291, gy + 56, '=', { 'text-anchor': 'middle', 'font-size': 20, fill: C.ink });
        grid3(308, '相乘', () => '#fff', n => fmt(terms[n].p, 2), n => (terms[n].p < -1e-9 ? C.coral : terms[n].p > 1e-9 ? C.ink : C.muted));
        k.text(434, gy + 56, '→', { 'text-anchor': 'middle', 'font-size': 20, fill: C.ink });
        k.text(515, 280, '9 個相加', { 'text-anchor': 'middle', 'font-size': 12, fill: C.ink });
        k.text(515, 312, fmt(y, 2), { 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 700, fill: C.coral });
        k.rect(490, 326, 50, 30, grayOf(show), { stroke: C.coral, 'stroke-width': 2, rx: 3 });
        k.text(515, 376, `顯示亮度 ${fmt(show, 2)}`, { 'text-anchor': 'middle', 'font-size': 11 });
        return {
          result: fmt(y, 2),
          detail: `9 個乘積：${terms.map(t => signed(t.p)).join(' + ')} = ${fmt(y, 2)}` + (kern.name === '邊緣偵測' ? `，取絕對值後顯示為 ${fmt(show, 2)}。` : y > 1 || y < 0 ? `，超出 0～1，螢幕顯示為 ${fmt(show, 2)}。` : '。')
        };
      }
    },
    // =====================================================================
    {
      id: 'ode', track: 'engineering', symbol: 'd/dt', name: '常微分方程', question: '可可多久才能喝？',
      title: '智慧杯 App：預測熱可可幾分鐘後可以入口',
      intro: '剛泡好的熱可可很燙，一開始涼得很快，越接近室溫就涼得越慢。把這句話寫成數學——「降溫速度和溫差成正比」——就是一條<b>常微分方程</b>：它只說「現在怎麼變」，再配上一開始的溫度，就能推出未來每一刻的溫度。電腦通常不直接解公式，而是「照目前的速度往前走一小步，再重新看速度」（尤拉法）一步步算；步子太大，預測就會出錯，甚至爆掉！',
      scene: '模擬：智慧杯 App 用數值方法預測降溫', viewH: 400,
      chart: '左：杯子、溫度計與 App 提醒　右：灰色小線段是斜率場（每個溫度此刻的降溫方向），紅線是精確解，藍色折線是 App 用尤拉法一步步算的結果',
      caption: '牛頓冷卻定律：室溫 25°C，可可一開始 90°C，「可入口」設為 60°C。三種杯子的散熱係數 k 是示意值；真實杯子還有蒸發、杯壁吸熱、可可溫度不均等效應。',
      controls: [
        { key: 'cup', label: '杯子', options: ['保溫杯', '馬克杯', '小紙杯＋吹風扇'], value: 1 },
        ['h', 'App 每幾分鐘算一步 h', 0.5, 15, 0.5, 4, '分'],
        ['t', '經過時間', 0, 60, 0.5, 10, '分']
      ],
      play: 't',
      try: '選「小紙杯＋吹風扇」，把 h 從 0.5 慢慢拉到 15：藍色折線什麼時候開始跑到室溫以下？什麼時候上下亂跳、越跳越大？',
      resultLabel: '經過 t 分鐘：精確解 vs. App 算的',
      takeaway: '微分方程描述「現在怎麼變」；數值方法一步步走出未來——但步長要夠小才準、才穩。',
      application: '天氣預報、火箭軌道、遊戲物理引擎，都是把微分方程切成許多小步，交給電腦一步步算。',
      tech: [
        ['🌦️', '天氣預報（數值天氣預報模式）', '把大氣運動方程切成網格與時間步，超級電腦一步步往前積分；時間步太大同樣會數值不穩定，所以有嚴格的步長限制。'],
        ['💊', '藥物動力學', '血液中藥物濃度常用一階微分方程描述（排除速度與濃度成正比），用來估計半衰期與給藥間隔；實際用藥請依醫師與藥師指示。'],
        ['🦠', '傳染病 SIR 模型', '易感、感染、康復三群人數的聯立常微分方程，曾被用來評估防疫措施如何壓平疫情曲線。'],
        ['🎮', '遊戲與動畫物理引擎', '每一格畫面用（半隱式）尤拉法等方法更新速度與位置；時間步太大時物體會穿牆、抖動甚至「爆掉」。']
      ],
      teach: {
        grade: '國小六年級～國中八年級',
        connect: '國小「比率與百分率」（每分鐘少掉溫差的百分之幾）、國中「一次函數」與「等比數列」：尤拉法算出的溫差正是公比 (1 − hk) 的等比數列。',
        activity: '準備：兩杯同量的熱水（由老師倒水，注意安全）、一個馬克杯與一個紙杯、料理溫度計、碼錶、方格紙。① 每 2 分鐘記錄一次兩杯的溫度，共 14 分鐘，畫成溫度–時間圖。② 算出每段「降了幾度」與「當時和室溫差幾度」，觀察兩者大致成比例（降幅 ÷ 溫差約略固定，這就是 k × 2 分鐘）。③ 只用第一筆資料和這個比例，每 2 分鐘「走一步」預測 10 分鐘後的溫度；再改成「一步走 10 分鐘」預測一次。④ 和實際量到的比較：哪一種預測比較準？為什麼？',
        ask: ['為什麼可可剛泡好時降溫最快？', '如果 App 每 15 分鐘才算一次，預測會出什麼問題？', '可可的溫度可能降到比室溫還低嗎？為什麼 App 有時候會這樣算？'],
        myth: '「電腦算的一定對」不對：數值方法的誤差和步長有關。尤拉法每一步都假設斜率不變，步長 h 太大時誤差會累積；若 |1 − hk| > 1 甚至會發散。工程上要檢查收斂與穩定性，或改用更好的方法（例如 Runge–Kutta、隱式法）。'
      },
      formula: 'dT/dt = −k(T − T<sub>a</sub>)，T(0) = T<sub>0</sub> ⇒ T(t) = T<sub>a</sub> + (T<sub>0</sub> − T<sub>a</sub>)e<sup>−kt</sup><br>尤拉法：T<sub>n+1</sub> = T<sub>n</sub> + h·f(T<sub>n</sub>) = T<sub>n</sub> − hk(T<sub>n</sub> − T<sub>a</sub>) ⇒ T<sub>n</sub> = T<sub>a</sub> + (T<sub>0</sub> − T<sub>a</sub>)(1 − hk)<sup>n</sup><br>穩定條件 |1 − hk| < 1 ⇔ 0 < h < 2/k；局部截斷誤差 O(h²)，全域誤差 O(h)',
      formal: 'T(t) 是可可溫度，T<sub>a</sub> = 25°C 是室溫，k > 0 是散熱係數（單位 1/分），h 是時間步長。這是一階線性常微分方程，右側 f(T) = −k(T − T<sub>a</sub>) 滿足 Lipschitz 條件，由 Picard–Lindelöf 定理，解存在且唯一；分離變數即得精確解，溫度單調趨近室溫、永不穿越（兩條解曲線不會相交）。斜率場把每個 (t, T) 的 dT/dt 畫成小線段，解曲線處處與它相切。尤拉法用切線取代曲線：步長減半，全域誤差約減半（一階方法）。把尤拉法套在線性方程上得到放大因子 1 − hk：0 < hk < 1 時單調收斂；1 < hk < 2 時在室溫上下振盪地收斂，出現物理上不可能的「比室溫還冷」；hk > 2 時振幅指數成長，數值發散（條件穩定）。後向（隱式）尤拉法 T<sub>n+1</sub> = T<sub>n</sub> − hk(T<sub>n+1</sub> − T<sub>a</sub>) 的放大因子 1/(1 + hk) 對所有 h > 0 都穩定。模型假設 k 與室溫是常數，且杯中溫度均勻（集總參數模型）。',
      quiz: [
        { question: '依照牛頓冷卻定律，可可什麼時候降溫最快？', options: ['剛泡好、和室溫差最多的時候', '快接近室溫的時候', '每一分鐘都一樣快'], answer: 0, why: '對！降溫速度＝k × 溫差，溫差最大時降得最快；右圖越上方的斜率線段越陡。' },
        { question: 'App 用尤拉法時，如果 h × k 大於 2，會發生什麼事？', options: ['算得更準', '數值上下亂跳而且越跳越大（發散）', '剛好等於精確解'], answer: 1, why: '對！每一步溫差都乘上 (1 − hk)，它的絕對值大於 1 時，誤差越滾越大。', hint: '選「小紙杯＋吹風扇」，把 h 拉到 10 以上看看藍線。' }
      ],
      related: ['exponential', 'laplace', 'heat', 'derivative'],
      draw(k, v) {
        const { C, fmt } = k, cup = ODE_CUPS[v.cup] || ODE_CUPS[1], kk = cup.k, h = v.h, t = v.t;
        const exact = s => ODE_TA + (ODE_T0 - ODE_TA) * Math.exp(-kk * s);
        const g = 1 - h * kk, nMax = Math.ceil(60 / h) + 1, eu = [];
        for (let n = 0; n <= nMax; n++) eu.push(MP.clamp(ODE_TA + (ODE_T0 - ODE_TA) * g ** n, -1e6, 1e6));
        const euAt = s => { const n = Math.min(Math.floor(s / h), nMax - 1), fr = s / h - n; return eu[n] + (eu[n + 1] - eu[n]) * fr; };
        const Te = exact(t), Tn = euAt(t);
        const tEx = Math.log((ODE_T0 - ODE_TA) / (ODE_OK - ODE_TA)) / kk;
        let tEu = null;
        for (let n = 1; n <= nMax; n++) if (eu[n] <= ODE_OK) { tEu = (n - 1) * h + h * (eu[n - 1] - ODE_OK) / (eu[n - 1] - eu[n]); break; }
        // Scene: cup, thermometer, app card.
        k.box(10, 8, 206, 384, { fill: '#fbf7f2', title: '☕ 智慧杯與 App' });
        const steam = Te > 75 ? 3 : Te > 55 ? 2 : Te > 38 ? 1 : 0;
        for (let i = 0; i < steam; i++) {
          const sx = 60 + i * 20;
          k.path(`M${sx},122 C${sx - 9},108 ${sx + 9},98 ${sx},84 C${sx - 9},72 ${sx + 7},64 ${sx},54`, '#b8c3c0', { 'stroke-width': 2.5, opacity: 0.9 });
        }
        k.path('M118,146 C142,146 142,184 118,184', cup.color, { 'stroke-width': 7 });
        k.rect(38, 128, 84, 72, cup.color, { rx: 8, stroke: '#9b8b7a', 'stroke-width': 1.5 });
        k.el('ellipse', { cx: 80, cy: 132, rx: 38, ry: 6, fill: mix('#c99a6b', '#6b3f22', (Te - 25) / 65) });
        k.text(80, 222, cup.name, { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.ink });
        k.text(80, 238, `k = ${kk}／分`, { 'text-anchor': 'middle', 'font-size': 11 });
        const ty = T => 190 - MP.clamp(T, 0, 100) / 100 * 140;
        k.rect(160, 46, 12, 146, '#fff', { rx: 6, stroke: '#9baea8' });
        k.rect(162, ty(Te), 8, 192 - ty(Te), C.coral, { rx: 4 });
        k.circle(166, 200, 10, C.coral);
        for (const T of [25, 60, 90]) { k.line(173, ty(T), 179, ty(T), C.axis, { 'stroke-width': 1.5 }); k.text(181, ty(T) + 4, `${T}°`, { 'font-size': 10, fill: T === 60 ? C.green : C.muted }); }
        k.rect(20, 252, 186, 130, '#fff', { rx: 12, stroke: '#cdd6d2' });
        k.text(30, 274, '📱 可入口提醒（≤ 60°C）', { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        k.text(30, 298, `精確解：${fmt(tEx, 1)} 分鐘後`, { 'font-size': 12, 'font-weight': 700, fill: C.coral });
        k.text(30, 320, `App 預測：${tEu === null ? '算不出來' : `${fmt(tEu, 1)} 分鐘後`}`, { 'font-size': 12, 'font-weight': 700, fill: C.blue });
        k.text(30, 346, `第 ${fmt(t, 1)} 分：精確 ${fmt(Te, 1)}°C`, { 'font-size': 11, fill: C.ink });
        k.text(30, 366, `App 算出 ${Math.abs(Tn) > 999 ? '爆表！' : `${fmt(Tn, 1)}°C`}`, { 'font-size': 11, fill: C.blue });
        // Graph: slope field, exact solution, Euler steps.
        const p = k.plot({ xmin: 0, xmax: 60, ymin: -20, ymax: 100, left: 262, width: 318, top: 36, height: 312, xticks: 6, yticks: 6, xlabel: '時間（分鐘）', ylabel: '可可溫度（°C）' });
        const sx = p.width / 60, sy = p.height / 120;
        for (let ti = 2.5; ti < 60; ti += 5) for (let T = 0; T <= 95; T += 10) {
          const dx = sx, dy = -kk * (T - ODE_TA) * sy, len = Math.hypot(dx, dy), ux = dx / len * 7, uy = dy / len * 7;
          k.line(p.x(ti) - ux, p.y(T) + uy, p.x(ti) + ux, p.y(T) - uy, '#c3ccc8', { 'stroke-width': 1.5 });
        }
        k.line(p.left, p.y(ODE_TA), p.right, p.y(ODE_TA), C.gray, { 'stroke-dasharray': '6 5', 'stroke-width': 2 });
        k.line(p.left, p.y(ODE_OK), p.right, p.y(ODE_OK), C.green, { 'stroke-dasharray': '6 5', 'stroke-width': 2 });
        k.text(p.right - 4, p.y(ODE_TA) + 15, '室溫 25°C', { 'text-anchor': 'end', 'font-size': 11, ...halo });
        k.text(p.right - 4, p.y(ODE_OK) - 7, '可入口 60°C', { 'text-anchor': 'end', 'font-size': 11, fill: C.green, 'font-weight': 700, ...halo });
        k.curve(p, exact, C.coral, { 'stroke-width': 3.5 }, 0, 60);
        const gk = k.sub(k.clip(p.left - 6, p.top - 6, p.width + 12, p.height + 12));
        const pts = eu.map((T, n) => [p.x(n * h), p.y(MP.clamp(T, -200, 300))]);
        gk.polyline(pts, C.blue, { 'stroke-width': 2.5 });
        pts.forEach(([x, y]) => gk.circle(x, y, h < 1.5 ? 2.5 : 4, C.blue, { stroke: '#fff', 'stroke-width': 1.5 }));
        k.line(p.x(t), p.top, p.x(t), p.bottom, C.axis, { 'stroke-width': 1 });
        k.dot(p, t, Te, C.coral, 6);
        if (Tn >= -20 && Tn <= 100) k.dot(p, t, Tn, C.blue, 6);
        const hk = h * kk;
        return {
          result: `${fmt(Te, 1)}°C vs. ${Math.abs(Tn) > 9999 ? big(Tn) : fmt(Tn, 1)}°C`,
          detail: `精確：25 + 65e^(−${kk}×${fmt(t, 1)}) = ${fmt(Te, 1)}°C。尤拉法每步把溫差乘上 1 − hk = 1 − ${fmt(h, 1)}×${kk} = ${fmt(g, 3)}，算出 ${big(Tn)}°C，誤差 ${big(Tn - Te)}°C。` +
            (hk > 2 ? `hk = ${fmt(hk, 2)} > 2：|1 − hk| > 1，數值發散！` : hk > 1 ? `hk = ${fmt(hk, 2)} > 1：算出比室溫還冷的溫度，物理上不可能。` : `hk = ${fmt(hk, 2)} < 1：穩定，h 越小越準。`)
        };
      }
    },
    // =====================================================================
    {
      id: 'heat', track: 'engineering', symbol: '∂', name: '熱方程', question: '手機的熱怎麼散開？',
      title: '打完一場遊戲，處理器上的熱點怎麼散開？',
      intro: '把一滴墨水滴進清水，它會慢慢暈開、越來越淡。熱也一樣：處理器全速運算後留下一個很燙的熱點，熱量會從燙的地方往涼的地方「暈開」。<b>熱方程</b>說：某一點接下來變熱還是變冷，要看它和左右鄰居比——比鄰居平均還熱（尖起來）就降溫，比鄰居冷（凹下去）就升溫。均熱片用什麼材料，決定熱暈開得多快。',
      scene: '模擬：手機處理器上的均熱片把熱點散開', viewH: 400,
      chart: '上：手機剖面，均熱片的顏色代表溫度（藍涼、紅燙）　左下：沿著均熱片的溫度分布（灰虛線是一開始）　右下：溫度分布拆成傅立葉模式，每個模式還剩多少',
      caption: '一維模型：均熱片長 60 mm，兩端接手機外框、維持 25°C；一開始處理器正上方有約 80°C 的熱點，之後處理器停止發熱。熱擴散率取常溫下的約略值，並忽略往螢幕與背蓋散出的熱。',
      controls: [
        { key: 'mat', label: '均熱片材料', options: ['銅', '鋁', '不鏽鋼', '塑膠'], value: 0 },
        ['t', '停止運算後經過', 0, 10, 0.05, 0.2, '秒']
      ],
      play: 't',
      try: '先選「銅」按播放，再換「不鏽鋼」和「塑膠」：10 秒後處理器上方各剩幾度？右下的長條，哪幾根最先消失？',
      resultLabel: '處理器正上方的溫度',
      takeaway: '熱方程：溫度曲線越尖的地方降得越快；材料的熱擴散率決定整體快慢。',
      application: '同一條方程也描述墨水擴散、影像模糊與金融上的選擇權定價，是最常見的偏微分方程之一。',
      tech: [
        ['💻', '晶片、筆電與手機散熱設計', '工程師用熱傳模擬軟體（以有限元素法等數值方法解熱方程）安排均熱片、熱管與風扇，避免處理器過熱而降頻。'],
        ['🌊', '天氣與海洋模式', '大氣與海洋中熱和水氣的擴散項就是熱方程形式的偏微分方程，與風、洋流的傳輸項一起數值求解。'],
        ['🖼️', '影像去雜訊與高斯模糊', '讓影像「跑」一段時間的熱方程，結果正好等於和高斯核做卷積：擴散越久越模糊，雜訊也被抹平。'],
        ['🎨', 'AI 繪圖的擴散模型', '訓練時把圖片一步步加入高斯雜訊（前向擴散，機率分布的演變屬於擴散方程這一族，和熱方程是近親）；模型學的是反過來一步步去除雜訊來生成新圖。']
      ],
      teach: {
        grade: '國小五年級～國中九年級',
        connect: '國小「平均數」：離散的熱方程就是「每一格的新溫度往左右鄰居的平均靠近」；國中「坐標與函數圖形」、自然科「熱的傳播：傳導」。',
        activity: '準備：一排 9 個紙杯（排在桌上）、一盒彈珠或積木、記錄表。① 中間的杯子放 32 顆彈珠代表熱點，其他杯子都空著；最左、最右兩個杯子代表「外框」，每回合結束都要清空。② 每回合規則：每個杯子同時把自己的 1/4（無條件捨去）分給左邊、1/4 分給右邊。③ 記錄每一回合每杯的數量，畫成長條圖，做 5 回合。④ 觀察：尖峰怎麼變矮、變寬？總數為什麼越來越少（熱從外框散掉了）？⑤ 換成「每邊只給 1/8」（比較不導熱的材料）再做一次比較。',
        ask: ['為什麼溫度曲線的尖頂降得最快，平坦的地方卻幾乎不變？', '手機的均熱片為什麼常用銅或石墨片，而不是塑膠？', '右下的長條中，為什麼越「尖」（n 越大）的波消失得越快？'],
        myth: '「熱會往上跑」不精確：熱傳導是從高溫往低溫，任何方向都可以；「熱空氣上升」是對流，是另一種機制。另外，熱方程不會無中生有地產生新熱點——內部的最高溫只會下降（最大值原理）。'
      },
      formula: '∂T/∂t = α ∂²T/∂x²，0 < x < L，T(0,t) = T(L,t) = T<sub>a</sub>，T(x,0) = T<sub>0</sub>(x)<br>T(x,t) = T<sub>a</sub> + ∑<sub>n=1</sub><sup>∞</sup> b<sub>n</sub> e<sup>−α(nπ/L)²t</sup> sin(nπx/L)，b<sub>n</sub> = (2/L)∫<sub>0</sub><sup>L</sup> [T<sub>0</sub>(x) − T<sub>a</sub>] sin(nπx/L) dx<br>無邊界時：T(·,t) = T<sub>0</sub> ∗ G<sub>t</sub>，G<sub>t</sub>(x) = e<sup>−x²/(4αt)</sup> / √(4παt)',
      formal: 'T(x,t) 是位置 x、時間 t 的溫度，α = κ/(ρc) 是熱擴散率（熱導率 ÷ 密度 ÷ 比熱，單位 mm²/s）。推導：傅立葉熱傳導定律（熱流 = −κ∂T/∂x）加上能量守恆。∂²T/∂x² 衡量溫度曲線的凹凸：凸起（< 0）處降溫，凹下處升溫。分離變數 T − T<sub>a</sub> = X(x)Θ(t) 得到特徵值問題 X″ = −λX，在兩端固定溫度（Dirichlet 邊界）下 λ<sub>n</sub> = (nπ/L)²，所以解是正弦（傅立葉）級數，第 n 個模式以 e<sup>−αλ<sub>n</sub>t</sup> 衰減：高頻模式衰減快 n² 倍，這是熱方程「抹平細節」的原因，也使解在 t > 0 時立即變得無限平滑。最慢的模式時間常數 L²/(π²α) 決定整體冷卻需要多久；擴散距離約 √(αt)。最大值原理保證溫度不超過初始與邊界的最大值；能量方法可證解唯一。本模擬取 L = 60 mm，起始熱點 T<sub>0</sub> = 25 + 55e<sup>−((x−30)/4)²</sup>，因對稱只有奇數模式非零，用 n = 1～59 的 30 個模式；擴散率約為：銅 111、鋁 97、不鏽鋼 4.2、ABS 塑膠 0.12 mm²/s。真實手機是三維、多種材料、有持續熱源與表面對流，需要用有限差分或有限元素法數值求解。',
      quiz: [
        { question: '熱點的溫度曲線很尖時，熱方程說那裡會？', options: ['降溫最快', '升溫', '溫度不變'], answer: 0, why: '對！尖頂處 ∂²T/∂x² 是很大的負數，所以 ∂T/∂t 也是很大的負數：降溫最快。' },
        { question: '均熱片為什麼常用銅，而不用塑膠？', options: ['銅的熱擴散率大約是塑膠的近千倍，熱點散得快', '銅比塑膠便宜', '塑膠會產生更多熱點'], answer: 0, why: '對！擴散率差近千倍（111 ÷ 0.12 ≈ 925），同樣時間熱散開的距離（約 √(αt)）就差約 30 倍。', hint: '切換材料，比較同樣 10 秒後處理器上方的溫度。' }
      ],
      related: ['fourier', 'ode', 'convolution'],
      draw(k, v) {
        const { C, fmt } = k, mat = HEAT_MATS[v.mat] || HEAT_MATS[0], t = v.t, { L, NX, modes } = HEAT;
        const amps = modes.map(m => m.b * Math.exp(-mat.a * m.lam * t));
        const T = Array.from({ length: NX }, (_, i) => 25 + amps.reduce((s, a, j) => s + a * modes[j].sin[i], 0));
        const Tc = T[(NX - 1) / 2];
        // Phone cross-section.
        k.box(10, 8, 580, 164, { fill: '#f4f6f8', title: '📱 手機剖面：處理器上的均熱片（長 60 mm，兩端接外框）' });
        for (let i = 0; i < 40; i++) k.rect(440 + i * 2, 16, 2.2, 10, heatColor(25 + 55 * i / 39));
        k.text(436, 25, '25°C', { 'text-anchor': 'end', 'font-size': 10 });
        k.text(524, 25, '80°C', { 'font-size': 10 });
        k.rect(28, 38, 544, 126, '#e6eaed', { rx: 18, stroke: '#b9c4c0', 'stroke-width': 1.5 });
        k.rect(40, 46, 520, 16, '#cfe0f5', { rx: 4 });
        k.text(300, 58, '螢幕玻璃', { 'text-anchor': 'middle', 'font-size': 10, fill: C.ink });
        k.rect(40, 70, 20, 40, C.gray, { rx: 3 }); k.rect(540, 70, 20, 40, C.gray, { rx: 3 });
        const sx = 60, pxmm = 8;
        for (let i = 0; i < NX - 1; i++) k.rect(sx + i * pxmm * L / (NX - 1), 78, pxmm * L / (NX - 1) + 0.6, 22, heatColor((T[i] + T[i + 1]) / 2));
        k.rect(sx, 78, 480, 22, 'none', { stroke: '#7d8a86', 'stroke-width': 1 });
        k.text(50, 126, '外框', { 'text-anchor': 'middle', 'font-size': 10 });
        k.text(550, 126, '外框', { 'text-anchor': 'middle', 'font-size': 10 });
        k.rect(268, 103, 64, 22, C.ink, { rx: 3 });
        k.text(300, 118, '處理器', { 'text-anchor': 'middle', 'font-size': 11, fill: '#fff', 'font-weight': 700 });
        const status = Tc > 60 ? '🔥 很燙' : Tc > 40 ? '♨️ 溫熱' : '✅ 涼了';
        k.text(300, 150, `${status}　處理器上方 ${fmt(Tc, 1)}°C　（t = ${fmt(t, 2)} 秒，${mat.name}）`, { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: Tc > 60 ? C.coral : Tc > 40 ? C.yellow : C.green });
        // Temperature profile.
        const p = k.plot({ xmin: 0, xmax: 60, ymin: 20, ymax: 80, left: 50, width: 340, top: 206, height: 152, xticks: 6, yticks: 4, xlabel: '均熱片上的位置 x（mm）', ylabel: '溫度（°C）' });
        k.rect(p.x(26), p.bottom - 5, p.x(34) - p.x(26), 5, C.ink);
        k.curve(p, x => 25 + HEAT.bump(x), C.gray, { 'stroke-dasharray': '6 5', 'stroke-width': 2 }, 0, 60);
        const area = [[p.x(0), p.bottom], ...T.map((y, i) => [p.x(i * L / (NX - 1)), p.y(MP.clamp(y, 20, 80))]), [p.x(60), p.bottom]];
        k.polygon(area, C.coralSoft, { opacity: 0.7 });
        k.polyline(area.slice(1, -1), C.coral, { 'stroke-width': 3.5 });
        k.dot(p, 30, MP.clamp(Tc, 20, 80), C.coral, 5);
        // Fourier modes remaining.
        k.box(406, 182, 184, 212, { fill: '#fff', title: '🎼 傅立葉模式還剩多少' });
        const b1 = Math.abs(modes[0].b), base = 350, maxH = 118, bw = 20;
        for (let j = 0; j < 8; j++) {
          const x = 420 + j * bw, h0 = Math.abs(modes[j].b) / b1 * maxH, h1 = Math.abs(amps[j]) / b1 * maxH;
          k.rect(x + 3, base - h0, bw - 6, h0, 'none', { stroke: C.gray, 'stroke-width': 1.2, 'stroke-dasharray': '3 2' });
          k.rect(x + 3, base - h1, bw - 6, h1, C.coral, { rx: 2 });
          k.text(x + bw / 2, base + 14, modes[j].n, { 'text-anchor': 'middle', 'font-size': 10, fill: C.ink });
        }
        k.text(415, 222, '虛線框＝一開始', { 'font-size': 10 });
        k.text(498, 386, 'n 越大越尖，消失得越快', { 'text-anchor': 'middle', 'font-size': 10, fill: C.ink });
        const tau = L * L / (Math.PI * Math.PI * mat.a);
        return {
          result: `${fmt(Tc, 1)}°C`,
          detail: `${mat.name}的熱擴散率 α ≈ ${mat.a} mm²/s；最慢的模式（n = 1）時間常數 L²/(π²α) = 3600 ÷ (9.87 × ${mat.a}) ≈ ${tau >= 100 ? fmt(tau, 0) : fmt(tau, 1)} 秒，n = 3 的模式快 9 倍。t = ${fmt(t, 2)} 秒時熱點從 80°C 降到 ${fmt(Tc, 1)}°C，熱大約擴散了 √(αt) ≈ ${fmt(Math.sqrt(mat.a * t), 1)} mm。`
        };
      }
    },
    // =====================================================================
    {
      id: 'gradient', track: 'engineering', symbol: '∇', name: '梯度下降', question: 'AI 怎麼找最好的答案？',
      title: '訓練一個小 AI：從「讀書時數」預測「考試分數」',
      intro: '蒙著眼睛站在山谷裡想走到最低點，你會用腳試探哪一邊比較低，往那邊跨一步，再試、再跨。<b>梯度</b>就是「最陡的上坡方向」，反過來走就是下山。訓練 AI 也是這樣：先隨便猜一條直線，算出「預測差多少」（損失），再沿著讓損失下降最快的方向調整參數，一步一步走。步伐（學習率）太小走不到，太大會越跳越遠！',
      scene: '模擬：用梯度下降訓練「預測分數」的小 AI', viewH: 430,
      chart: '左上：7 位同學的資料（藍點）、AI 目前的直線（紅線）與誤差（灰虛線）　左下：損失隨步數的變化　右：損失地形圖（等高線）與 AI 走過的下山路徑',
      caption: '模型：預測分數 = w × 讀書時數 + b，從 w = 0、b = 0（什麼都不懂）出發；損失＝誤差平方的平均（MSE）。為了讓兩個參數的尺度接近，程式內部以 10 分為一單位計算（特徵縮放的概念）。資料為虛構示意。',
      controls: [
        ['lr', '學習率 α（步伐大小）', 0.02, 0.28, 0.01, 0.12, ''],
        ['steps', '走了幾步', 0, 40, 1, 12, '步']
      ],
      play: 'steps',
      try: '先用 α = 0.12 按播放；再試 α = 0.02（太小）和 0.26（太大）。哪一個在山谷兩側來回彈、越彈越遠？α 大約超過多少就會失控？',
      resultLabel: '預測分數平均差幾分（RMSE）',
      takeaway: '梯度下降：沿負梯度方向走一小步、重算、再走；學習率決定快慢，也決定會不會失控。',
      application: '從這條直線到 ChatGPT、Claude 動輒數十億個參數的模型，訓練的核心都是「算梯度、往下走一小步」。',
      tech: [
        ['🤖', 'ChatGPT、Claude、Gemini 等大型語言模型', '訓練時用反向傳播算出損失對每個參數的梯度，再用梯度下降的變形（如 AdamW）一次更新數十億個參數。'],
        ['⚙️', 'Adam／AdamW 最佳化器', '在梯度下降上加入「動量」與「每個參數各自調整步伐」，緩解本例中等高線又扁又長造成的來回震盪，是深度學習最常用的方法之一。'],
        ['🛒', '推薦系統（影音、購物平台）', '用梯度下降學出使用者與商品的向量，讓預測的喜好分數與實際點擊、評分之間的誤差越來越小。'],
        ['📈', '迴歸與預測模型', '房價估計、用電量預測、銷售預測中的線性與邏輯斯迴歸，資料量大時常用（隨機）梯度下降求參數。']
      ],
      teach: {
        grade: '國小六年級～國中九年級',
        connect: '國中「一次函數 y = ax + b」、「坐標平面上的點」、「平方與平方根」（誤差平方、RMSE）、「二次函數的頂點」（損失碗的最低點）。',
        activity: '準備：方格紙、尺、一條細繩、計算機。① 老師給 7 組「讀書時數、分數」資料，各組點在方格紙上。② 用細繩拉一條直線，量出每一點到直線的垂直距離（誤差），平方後取平均，寫在黑板上。③ 規則：每回合只能把直線「轉一點」或「上下平移一點」，算新的平均誤差平方；變小就保留，變大就退回。④ 比賽 5 回合後哪組最小。⑤ 討論：每次移太多會怎樣？移太少又會怎樣？',
        ask: ['為什麼誤差要先平方再平均，而不是直接相加？（提示：正負會抵消）', '學習率太大時，路徑為什麼會在山谷兩側來回彈？', '真正的 AI 有幾十億個參數、地形圖畫不出來，梯度下降還能用嗎？'],
        myth: '「學習率越大學得越快」不對：本例 α 只要超過 0.25，每一步都會跨過谷底並彈得更高，損失爆增。另外，梯度下降只保證往下坡走；複雜模型的地形可能有局部低點與鞍點，本例的損失是碗狀（凸函數），所以只有一個最低點。'
      },
      formula: 'L(w,b) = (1/N)∑<sub>i=1</sub><sup>N</sup>(wx<sub>i</sub> + b − y<sub>i</sub>)²，∇L = (2/N)(∑r<sub>i</sub>x<sub>i</sub>, ∑r<sub>i</sub>)，r<sub>i</sub> = wx<sub>i</sub> + b − y<sub>i</sub><br>θ<sub>t+1</sub> = θ<sub>t</sub> − α∇L(θ<sub>t</sub>)，θ = (w, b)<br>Hessian H = 2[⟨x²⟩ ⟨x⟩; ⟨x⟩ 1]，本例特徵值 8 與 0.5；收斂 ⇔ 0 < α < 2/λ<sub>max</sub> = 0.25',
      formal: 'x<sub>i</sub> 是讀書時數、y<sub>i</sub> 是分數（以 10 分為一單位），w、b 是要學的參數，α 是學習率，∇L 是梯度：指向損失上升最快的方向，長度是那個方向的坡度。MSE 對 (w, b) 是二次凸函數，等高線是橢圓，唯一最低點由正規方程 (XᵀX)θ = Xᵀy 給出。在二次函數上，誤差 e<sub>t</sub> = θ<sub>t</sub> − θ* 滿足 e<sub>t+1</sub> = (I − αH)e<sub>t</sub>：沿 H 的每個特徵向量方向，誤差每步乘上 (1 − αλ<sub>i</sub>)。本例 ⟨x⟩ = 1.5、⟨x²⟩ = 3.25，H 的特徵值為 8 與 0.5，因此 0 < α < 0.25 才收斂；α 接近 0.25 時陡方向的因子 |1 − 8α| 接近 1，路徑在谷底兩側來回彈；緩方向每步只縮小 (1 − 0.5α)，條件數 λ<sub>max</sub>/λ<sub>min</sub> = 16 越大收斂越慢——這就是實務上要做特徵縮放、或使用動量與 Adam 的原因。神經網路的損失不是凸函數，有許多局部低點與鞍點；實際訓練多用隨機（小批次）梯度下降，每步只用一部分資料估計梯度。',
      quiz: [
        { question: '梯度 ∇L 指向哪個方向？', options: ['損失上升最快的方向，所以要反著走', '損失下降最快的方向', '永遠指向原點'], answer: 0, why: '對！梯度指向最陡的上坡，梯度下降就是往負梯度方向走一小步。' },
        { question: '把學習率調到 0.27，訓練會怎樣？', options: ['更快、更穩地走到最低點', '在山谷兩側來回彈，越彈越遠（發散）', '完全不動'], answer: 1, why: '對！0.27 > 2/8 = 0.25，陡方向每步誤差乘上 |1 − 8×0.27| = 1.16 > 1，越來越大。', hint: '把學習率拉到最右邊，再按播放看看右圖的路徑。' }
      ],
      related: ['derivative', 'backprop', 'linear', 'crossentropy'],
      draw(k, v) {
        const { C, fmt } = k, a = v.lr, n = Math.round(v.steps), { xs, ys, scores, N } = GD;
        let w = 0, b = 0;
        const path = [[w, b]], losses = [GD.loss(w, b)];
        for (let s = 0; s < n; s++) {
          let gw = 0, gb = 0;
          xs.forEach((x, i) => { const r = w * x + b - ys[i]; gw += 2 * r * x / N; gb += 2 * r / N; });
          w -= a * gw; b -= a * gb;
          w = MP.clamp(w, -1e8, 1e8); b = MP.clamp(b, -1e8, 1e8);
          path.push([w, b]); losses.push(GD.loss(w, b));
        }
        const L = losses[losses.length - 1], rmse = 10 * Math.sqrt(L);
        // Data + current line.
        k.box(10, 8, 282, 414, { fill: '#fff', title: '📊 讀書時數 vs. 考試分數' });
        const p = k.plot({ xmin: 0, xmax: 3.5, ymin: 0, ymax: 100, left: 50, width: 225, top: 58, height: 160, xticks: 7, yticks: 4, xlabel: '讀書時數（小時）', ylabel: '分數', tickFmt: x => Number(x.toFixed(1)) });
        const gl = k.sub(k.clip(p.left, p.top, p.width, p.height));
        xs.forEach((x, i) => gl.line(p.x(x), p.y(scores[i]), p.x(x), p.y(10 * (w * x + b)), C.gray, { 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }));
        gl.line(p.x(0), p.y(10 * b), p.x(3.5), p.y(10 * (w * 3.5 + b)), C.coral, { 'stroke-width': 3 });
        xs.forEach((x, i) => k.dot(p, x, scores[i], C.blue, 5));
        k.text(20, 272, `AI 的直線：分數 = ${big(10 * w)} × 時數 + ${big(10 * b)}`, { 'font-size': 12, 'font-weight': 700, fill: C.coral });
        // Loss history (log scale).
        const lg = x => Math.log10(MP.clamp(x * 100, 1, 1e4));
        const q = k.plot({ xmin: 0, xmax: 40, ymin: 0, ymax: 4, left: 50, width: 225, top: 306, height: 84, xticks: 4, yticks: 4, xlabel: '步數', ylabel: '損失 MSE（分²，對數刻度）', tickFmt: () => '' });
        for (let i = 0; i <= 4; i++) {
          k.text(q.left - 7, q.y(i) + 4, ['1', '10', '100', '1000', '1萬'][i], { 'text-anchor': 'end', 'font-size': 11 });
          k.text(q.x(i * 10), q.bottom + 17, i * 10, { 'text-anchor': 'middle', 'font-size': 11 });
        }
        k.line(q.left, q.y(lg(GD.Lmin)), q.right, q.y(lg(GD.Lmin)), C.green, { 'stroke-dasharray': '5 4', 'stroke-width': 1.5 });
        k.polyline(losses.map((l, i) => [q.x(i), q.y(lg(l))]), C.coral, { 'stroke-width': 2.5 });
        k.dot(q, n, lg(L), C.coral, 4);
        // Loss landscape with the descent path.
        k.box(300, 8, 290, 414, { fill: '#fff', title: '🗺️ 損失地形圖與下山路徑' });
        const r = k.plot({ xmin: -10, xmax: 40, ymin: -20, ymax: 80, left: 345, width: 230, top: 52, height: 330, xticks: 5, yticks: 5, xlabel: '斜率 w（分／小時）', ylabel: '截距 b（分）' });
        const gc = k.sub(k.clip(r.left, r.top, r.width, r.height));
        const e1 = [2 / Math.sqrt(5), 1 / Math.sqrt(5)], e2 = [1 / Math.sqrt(5), -2 / Math.sqrt(5)];
        [0.1, 0.3, 1, 3, 8, 20, 45].forEach((c, li) => {
          const s1 = Math.sqrt(c / 4), s2 = Math.sqrt(c / 0.25), pts = [];
          for (let i = 0; i <= 72; i++) {
            const th = TAU * i / 72, dw = s1 * Math.cos(th) * e1[0] + s2 * Math.sin(th) * e2[0], db = s1 * Math.cos(th) * e1[1] + s2 * Math.sin(th) * e2[1];
            pts.push([r.x(10 * (GD.w + dw)), r.y(10 * (GD.b + db))]);
          }
          gc.polygon(pts, li === 0 ? C.greenSoft : 'none', { stroke: C.blue, 'stroke-width': 1.3, opacity: 0.25 + 0.1 * (6 - li) });
        });
        const pp = [];
        let escaped = false;
        for (const [pw, pb] of path) {
          const W = 10 * pw, B = 10 * pb;
          pp.push([r.x(MP.clamp(W, -60, 110)), r.y(MP.clamp(B, -120, 180))]);
          if (W < -60 || W > 110 || B < -120 || B > 180) { escaped = true; break; }
        }
        gc.polyline(pp, C.coral, { 'stroke-width': 2.5 });
        if (escaped) k.text((r.left + r.right) / 2, r.top + 18, '💥 路徑飛出地圖：發散！', { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.coral, ...halo });
        pp.forEach(([x, y], i) => gc.circle(x, y, i === pp.length - 1 ? 6 : 3, C.coral, { stroke: '#fff', 'stroke-width': 1.5 }));
        k.circle(r.x(10 * GD.w), r.y(10 * GD.b), 6, C.green, { stroke: '#fff', 'stroke-width': 2 });
        k.text(r.x(10 * GD.w) + 9, r.y(10 * GD.b) - 8, '最低點', { 'font-size': 11, fill: C.green, 'font-weight': 700, ...halo });
        k.circle(r.x(0), r.y(0), 5, C.gray, { stroke: '#fff', 'stroke-width': 2 });
        k.text(r.x(0) + 8, r.y(0) + 16, '起點（亂猜）', { 'font-size': 11, fill: C.ink, ...halo });
        const fast = Math.abs(1 - 8 * a), slow = 1 - 0.5 * a;
        return {
          result: `${big(rmse, 1)} 分`,
          detail: `第 ${n} 步：w = ${big(10 * w, 1)} 分／小時、b = ${big(10 * b, 1)} 分，損失 MSE = ${big(100 * L, 1)} 分²（最低可能 ${fmt(100 * GD.Lmin, 1)}），RMSE = √MSE = ${big(rmse, 1)} 分。α = ${fmt(a, 2)}：陡方向每步誤差 × |1 − 8α| = ${fmt(fast, 2)}，緩方向 × (1 − 0.5α) = ${fmt(slow, 3)}` + (fast >= 1 ? ' → 大於 1，發散！' : '，會收斂。')
        };
      }
    }
  );
})();
