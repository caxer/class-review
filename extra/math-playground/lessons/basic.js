// 國中小基礎：分數、一次函數、畢氏定理、圓、機率、統計——每一課都接到大學數學與 AI。
(() => {
  const TAU = Math.PI * 2;
  const pt = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const sector = (cx, cy, r, a0, a1) => {
    const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1);
    return `M${cx.toFixed(2)},${cy.toFixed(2)} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
  };
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  // 0.375 → "0.375"、1/3 → "≈0.333"（剛好的就照寫，除不盡的四捨五入並標上 ≈）
  const nice = (x, d = 3) => {
    const s = Number(x.toFixed(d));
    return Math.abs(s - x) < 1e-9 ? String(s) : `≈${x.toFixed(d)}`;
  };
  const eq = str => (str[0] === '≈' ? ` ${str}` : ` = ${str}`);
  const halo = { stroke: '#fff', 'stroke-width': 3, 'paint-order': 'stroke' };

  // 機率課：三位玩家的亂數序列只算一次（seeded，所以播放時前面的結果不會變）。
  const DRAWS = 500;
  const PLAYER_U = [11, 29, 47].map(seed => { const r = MP.rng(seed); return Array.from({ length: DRAWS }, () => r()); });
  // 扭蛋機裡 20 顆扭蛋的位置（從下往上堆）與「哪幾顆是金色」的順序。
  const CAPSULES = (() => {
    const cands = [];
    for (let row = 0; row < 7; row++) {
      const y = 50 - row * 20, shift = row % 2 ? 11 : 0;
      for (let x = -66 + shift; x <= 66; x += 22) if (Math.hypot(x, y) <= 60) cands.push([x, y]);
    }
    cands.sort((p, q) => q[1] - p[1] || p[0] - q[0]);
    const pos = cands.slice(0, 20), r = MP.rng(5), order = pos.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return { pos, order };
  })();

  // 統計課：村子原本的 9 戶月收入（萬元，虛構的教學資料）。
  const VILLAGE = [3.2, 4.8, 2.6, 3.8, 5.4, 3.0, 4.3, 3.5, 4.0];

  MP.register(
    {
      id: 'fraction', track: 'basic', symbol: '½', name: '分數', question: '一份到底有多少？',
      title: '同一個「多少」，披薩、電量條和數線都在說',
      intro: '一個披薩平均切 8 片，你拿走 3 片，就是 3/8 個披薩。手機電量條、影片下載進度條其實也在說同一件事：把「全部」當成 1，看你有其中的幾分之幾。分數、小數、百分比只是同一個數的三種寫法——AI 回答問題時算出的「每個字被選中的機會」，也是一組加起來剛好等於 1 的分數。',
      scene: '模擬：分披薩＝手機電量＝下載進度＝數線上的一個點', viewH: 400,
      chart: '左上：披薩（拉出來的是拿走的片）　右上：手機電量與三種寫法　下：數線與「拿走＋剩下＝1」',
      caption: '假設每片一樣大；「每片再切成」會把每一片平均再切小，只改變寫法、不改變拿走的量。拿走片數超過總片數時，以總片數計。',
      controls: [['parts', '平均切成', 2, 12, 1, 8, '片'], ['taken', '拿走', 0, 12, 1, 3, '片'], ['cut', '每片再切成', 1, 4, 1, 1, '小片']],
      try: '先拿走 3/8，再把「每片再切成」調到 2、3、4：披薩切得更碎，電量條和數線上的點有沒有動？再試試 4/8 和 1/2 是不是同一格電量。',
      resultLabel: '拿走的量（分數＝小數＝百分比）',
      takeaway: '分數就是「把全部當成 1」之後的一個位置；同一個量可以有無限多種等值寫法。',
      application: '折扣（打 75 折＝付 3/4）、食譜（1/2 杯）、音樂節拍（八分音符）、AI 輸出的機率，都是分數。',
      tech: [
        ['🔋', '手機電量與下載進度', '系統把「目前電量 ÷ 滿電容量」、「已下載 ÷ 檔案大小」這個分數乘上 100，顯示成百分比和進度條。'],
        ['🖼️', '螢幕顏色與透明度', '每個像素的紅綠藍亮度常用 0～255 表示，其實就是 n/255 的分數；圖層透明度 0～1 也是分數。'],
        ['🎵', '音樂與節拍', '樂譜裡的二分、四分、八分音符就是一拍的分數；數位音樂軟體用它來對齊節拍。'],
        ['🤖', 'ChatGPT／Claude／Gemini 選字', '模型對每個候選字算出一個機率，全部加起來剛好等於 1（softmax 的輸出），這就是一組分數。']
      ],
      teach: {
        grade: '國小三年級～五年級（分數、小數、百分率）',
        connect: '國小「分數的意義」、「等值分數與約分擴分」、「分數與小數互換」、五年級「百分率」，國中「數線」與「機率」。',
        activity: '每組發 3 張同樣大的紙圓（紙盤也可以）。第一張對摺 3 次得 8 片，塗色 3 片；第二張對摺 4 次得 16 片，塗色 6 片；第三張當電池：在 10 公分紙條上畫出「37.5%」的電量。三張疊在一起對光看，塗色的範圍是否一樣大？最後全班把塗色和沒塗色的寫成算式：3/8 ＋ 5/8 ＝ ？',
        ask: ['3/8 和 6/16 片數不同，為什麼是一樣多的披薩？', '電量 50% 時，換成披薩是幾分之幾？有幾種寫法？', '為什麼「拿走的」和「剩下的」加起來一定是 1？'],
        myth: '「分母越大，分數越大」是錯的：1/8 比 1/4 小，因為同一個披薩切越多片，每片越小。比較大小要看分子 ÷ 分母的結果。'
      },
      formula: 'a/b = a ÷ b（b ≠ 0）；a/b = (a·k)/(b·k)（k ≠ 0）；百分比 = a/b × 100%；機率分布：p<sub>1</sub> + p<sub>2</sub> + … + p<sub>n</sub> = 1，p<sub>i</sub> ≥ 0',
      formal: '分數 a/b 有三個意思：把整體平均分成 b 份取 a 份（部分–整體）、除法 a ÷ b 的商、以及數線上的一個點。分子分母同乘非零的 k，值不變，所以 3/8、6/16、9/24 是同一個數；在大學代數裡，有理數正是被定義成「所有等值分數」這一整組（等價類）。約成最簡分數後，分母只含質因數 2 和 5 時是有限小數（3/8 = 0.375），否則是循環小數（1/3 = 0.333…）。一組非負、總和為 1 的分數叫機率分布；語言模型最後的 softmax 就是把任意實數轉成這樣一組分數。模擬簡化：每片大小完全相同，拿走片數最多等於總片數。',
      quiz: [
        { question: '手機電量顯示 75%，用分數表示是多少？', options: ['3/4', '7/5', '1/75'], answer: 0, why: '對！75% = 75/100，約分後是 3/4。', hint: '百分比就是分母是 100 的分數，再約分看看。' },
        { question: '把每片披薩再切成兩半，原本拿走的 3/8 會變成？', options: ['3/16', '6/16', '6/8'], answer: 1, why: '對！總片數變 16，拿走的片數也變 6，量沒有變：6/16 = 3/8。', hint: '切碎以後，總片數和你拿走的片數都會變多。' }
      ],
      related: ['probability', 'softmax', 'token', 'quantization'],
      draw(k, v) {
        const { C } = k;
        const n = v.parts, m = v.cut, t = Math.min(v.taken, n), N = n * m, T = t * m;
        const val = t / n, g = gcd(t, n);
        // 披薩：拿走的片往外拉出來。
        k.box(10, 8, 290, 252, { fill: '#fff8ec', title: '🍕 一個披薩平均切成幾片' });
        const cx = 155, cy = 142, r = 88;
        for (let i = 0; i < n; i++) {
          const a0 = -Math.PI / 2 + TAU * i / n, a1 = a0 + TAU / n, mid = (a0 + a1) / 2, on = i < t;
          const [ox, oy] = pt(cx, cy, on ? 9 : 0, mid);
          for (let j = 0; j < m; j++) {
            const b0 = a0 + (a1 - a0) * j / m, b1 = a0 + (a1 - a0) * (j + 1) / m;
            k.el('path', { d: sector(ox, oy, r, b0, b1), fill: on ? '#f6c453' : '#efe6d4', stroke: '#fff', 'stroke-width': 1.2, 'stroke-dasharray': m > 1 ? '3 3' : undefined });
          }
          const pr = Math.min(9, 0.6 * r * Math.sin(Math.PI / n) * 0.6);
          const [px, py] = pt(ox, oy, r * 0.66, mid);
          k.circle(px, py, pr, on ? C.coral : '#dccbb9');
          if (n <= 6) { const [qx, qy] = pt(ox, oy, r * 0.34, mid + 0.25); k.circle(qx, qy, pr * 0.8, on ? C.coral : '#dccbb9'); }
          k.el('path', { d: sector(ox, oy, r, a0, a1), fill: 'none', stroke: on ? C.coral : '#c9a46a', 'stroke-width': on ? 3 : 2, 'stroke-linejoin': 'round' });
        }
        const pizzaLabel = m > 1 ? `拿走 ${t}/${n} 個＝${T}/${N} 個` : `拿走 ${t} 片／共 ${n} 片＝${t}/${n} 個`;
        k.text(155, 250, pizzaLabel, { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.ink });
        // 手機：電池與下載條。
        k.box(310, 8, 280, 252, { title: '📱 同一個量，換個樣子' });
        k.rect(322, 32, 118, 220, C.ink, { rx: 16 });
        k.rect(329, 44, 104, 198, '#fff', { rx: 8 });
        k.rect(366, 64, 30, 8, C.ink, { rx: 2 });
        k.rect(351, 70, 60, 88, '#fff', { rx: 8, stroke: C.ink, 'stroke-width': 3 });
        const fillH = 80 * val, low = val <= 0.2;
        k.rect(355, 154 - fillH, 52, fillH, low ? C.coral : C.green, { rx: 4 });
        k.text(381, 186, `${nice(val * 100, 1)}%`, { 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: low ? C.coral : C.green });
        k.text(381, 208, '影片下載中', { 'text-anchor': 'middle', 'font-size': 10 });
        k.rect(340, 216, 82, 10, C.graySoft, { rx: 5 });
        k.rect(340, 216, 82 * val, 10, C.blue, { rx: 5 });
        // 三種寫法。
        const cards = [['分數', C.coral], ['小數', C.blue], ['百分比', C.green]];
        cards.forEach(([label, color], i) => {
          const y = 34 + i * 72;
          k.rect(450, y, 130, 64, i === 0 ? C.coralSoft : i === 1 ? C.blueSoft : C.greenSoft, { rx: 8 });
          k.text(460, y + 37, label, { 'font-size': 11, 'font-weight': 700, fill: color });
          if (i === 0) {
            k.text(540, y + 27, String(t), { 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: C.ink });
            k.line(526, y + 33, 554, y + 33, C.ink, { 'stroke-width': 2 });
            k.text(540, y + 54, String(n), { 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: C.ink });
          } else {
            k.text(540, y + 40, i === 1 ? nice(val, 3) : `${nice(val * 100, 1)}%`, { 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: C.ink });
          }
        });
        // 數線與「拿走＋剩下＝1」。
        k.box(10, 270, 580, 122, { fill: '#f7f9f7', title: '📏 數線上的位置' });
        const X = f => 40 + f * 520, ly = 316;
        k.line(X(0), ly, X(1), ly, C.axis, { 'stroke-width': 2 });
        k.line(X(0), ly, X(val), ly, C.coral, { 'stroke-width': 6 });
        if (m > 1) for (let i = 0; i <= N; i++) k.line(X(i / N), ly - 4, X(i / N), ly + 4, C.axis, { 'stroke-width': 1 });
        for (let i = 0; i <= n; i++) {
          k.line(X(i / n), ly - 8, X(i / n), ly + 8, C.ink, { 'stroke-width': 1.5 });
          k.text(X(i / n), ly + 22, i === 0 ? '0' : i === n ? '1' : `${i}/${n}`, { 'text-anchor': 'middle', 'font-size': 10, fill: i === t ? C.coral : C.muted, 'font-weight': i === t ? 800 : 400 });
        }
        k.circle(X(val), ly, 7, C.coral, { stroke: '#fff', 'stroke-width': 2 });
        k.rect(X(0), 348, 520 * val, 18, C.coral, { rx: 3 });
        k.rect(X(val), 348, 520 * (1 - val), 18, C.gray, { rx: 3, opacity: 0.45 });
        if (520 * val > 70) k.text(X(val / 2), 361, `拿走 ${t}/${n}`, { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#fff' });
        if (520 * (1 - val) > 70) k.text(X((1 + val) / 2), 361, `剩下 ${n - t}/${n}`, { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: C.ink });
        k.text(300, 384, `${t}/${n} ＋ ${n - t}/${n} ＝ 1　（AI 給每個字的機率，加起來也剛好是 1）`, { 'text-anchor': 'middle', 'font-size': 11, fill: C.ink });
        const simplest = g > 1 ? `，約分後是 ${t / g}/${n / g}` : '';
        const extra = v.taken > n ? `（只有 ${n} 片，最多拿 ${n} 片）` : '';
        return {
          result: `${t}/${n}${eq(nice(val, 3))}${eq(nice(val * 100, 1) + '%')}`,
          detail: `${t} ÷ ${n}${eq(nice(val, 3))}，乘 100 得 ${nice(val * 100, 1)}%${simplest}。${m > 1 ? `每片再切 ${m} 小片後是 ${T}/${N}，${T} ÷ ${N} 還是 ${nice(val, 3)}（等值分數）。` : ''}${extra}`
        };
      }
    },

    {
      id: 'linear', track: 'basic', symbol: 'ƒ', name: '一次函數', question: '車資怎麼算出來？',
      title: '從 5 張計程車收據，找出跳錶的規則',
      intro: '搭計程車，一上車就先算一筆「起跳價」，之後每多開 1 公里就多加固定的錢。所以車資 ＝ 每公里價錢 × 公里數 ＋ 起跳價，寫成 y = ax + b，畫出來是一條直線。你手上有 5 張舊收據：調整 a 和 b，讓直線剛好穿過每一張收據——這就是電腦「從資料學規則」最簡單的版本，叫做線性迴歸。',
      scene: '模擬：計程車跳錶＋用收據反推計費規則（線性迴歸）', viewH: 420,
      chart: '上：馬路上的計程車與計費表　左下：車資–里程圖（紫點＝收據，虛線＝差多少）　右下：同一個算式就是一個神經元',
      caption: '簡化模型：車資 = a × 公里 + b，連續計費；真實跳錶是每走一小段才跳一次（階梯狀），還會加上等候時間與夜間加成。收據是依同一規則虛構的教學資料。',
      controls: [['a', '每公里 a', 10, 40, 1, 15, '元'], ['b', '起跳價 b', 0, 150, 5, 120, '元'], ['km', '坐了', 0, 10, 0.1, 4, '公里']],
      play: 'km',
      try: '任務：讓「收據平均差」變成 0 元！先調 b 讓直線左端對準，再調 a 讓直線轉到穿過所有紫點。找到後按播放，看計費表怎麼跳。',
      resultLabel: '你猜的計費公式',
      takeaway: '一次函數 y = ax + b：b 是起點，a 是「每多 1 就多加多少」；從資料找出 a、b 就是機器學習的第一步。',
      application: '手機月租費、水電費、溫度換算（°F = 1.8 × °C + 32）都是一次函數；AI 裡的每個神經元也是先算 w·x + b。',
      tech: [
        ['🚕', '計程車與叫車 App 估價', '車資用「基本費＋里程 × 單價＋時間 × 單價」估算，固定時間時就是車資對里程的一次函數。'],
        ['📈', 'Excel／Google 試算表趨勢線', '「新增趨勢線（線性）」用最小平方法，自動找出最貼近資料點的 a 和 b，就是你在這裡用手做的事。'],
        ['🌡️', '感測器校正', '溫度計、體重計把感測到的電壓換成讀數，常用「讀數 = a × 電壓 + b」，出廠時用標準值求出 a、b。'],
        ['🧠', '神經網路（GPT、Claude、Llama）', '每個人工神經元先算 w₁x₁ + w₂x₂ + … + b，再經過激活函數；Transformer 裡大部分的計算都是這種乘加。']
      ],
      teach: {
        grade: '國中七年級～八年級（一次函數、坐標平面）',
        connect: '國小「規律與數量關係」、國中「一元一次方程式」、「直角坐標」、八年級「一次函數的圖形、斜率與截距」，高中「迴歸直線」。',
        activity: '「收據偵探」：老師發給每組 5 張自製收據卡（例如 1.2 公里 115 元、2.8 公里 155 元、4.6 公里 200 元、6.4 公里 245 元、8.8 公里 305 元）。各組在方格紙上描點，用一根吸管或直尺擺出「最貼近所有點」的直線，讀出起跳價 b 和每公里價錢 a，再預測坐 10 公里要多少錢，全班比較誰最接近。',
        ask: ['只有一張收據，能找出規則嗎？至少要幾張？為什麼？', '起跳價變貴、每公里不變，直線會怎麼移動？', '如果收據上的點不在同一條直線上，你會怎麼選「最好」的那條線？'],
        myth: '「坐 2 倍遠就付 2 倍錢」只在 b = 0 時成立（正比）；有起跳價時，車資會增加，但不是變成 2 倍。'
      },
      formula: 'y = ax + b（a：斜率，b：y 截距）；最小平方法：min<sub>a,b</sub> Σ<sub>i</sub> (a·x<sub>i</sub> + b − y<sub>i</sub>)²；神經元：y = w·x + b = w<sub>1</sub>x<sub>1</sub> + … + w<sub>n</sub>x<sub>n</sub> + b',
      formal: '一次函數 f(x) = ax + b 的圖形是直線：x 每增加 1，y 固定增加 a（斜率），f(0) = b（截距）。給定 n 個資料點 (x<sub>i</sub>, y<sub>i</sub>)，線性迴歸找使「誤差平方和」最小的 a、b；令對 a、b 的偏微分為 0，可得 a = Σ(x<sub>i</sub> − x̄)(y<sub>i</sub> − ȳ) / Σ(x<sub>i</sub> − x̄)²，b = ȳ − a·x̄。本模擬的收據剛好落在 y = 25x + 85 上，所以存在誤差為 0 的解；真實資料有雜訊時，最佳直線誤差不為 0。畫面上的「平均差」是平均絕對誤差，迴歸常用的是平方誤差（MSE），兩者最佳解一般不同。多個輸入時，ax 換成內積 w·x，就是神經元與線性代數的起點；加上非線性的激活函數，才能學到彎曲的規則。',
      quiz: [
        { question: '起跳價 85 元、每公里 25 元，坐 4 公里大約要多少錢？', options: ['110 元', '185 元', '340 元'], answer: 1, why: '對！25 × 4 + 85 = 185 元。', hint: '先算 4 公里的里程費，再加上起跳價。' },
        { question: 'y = ax + b 裡，哪個數字決定直線有多陡？', options: ['a', 'b', 'x'], answer: 0, why: '對！a 是斜率：x 每多 1，y 就多 a。b 只決定直線從哪裡出發。', hint: '想想「每多 1 公里多加多少錢」是哪個字母。' }
      ],
      related: ['derivative', 'neuron', 'gradient', 'matrix'],
      draw(k, v) {
        const { C, fmt } = k;
        const a = v.a, b = v.b, x = v.km, fare = X => a * X + b, y = fare(x);
        const receipts = [[1.2, 115], [2.8, 155], [4.6, 200], [6.4, 245], [8.8, 305]];
        const mae = receipts.reduce((s, [rx, ry]) => s + Math.abs(fare(rx) - ry), 0) / receipts.length;
        // 馬路與計程車。
        k.box(10, 8, 580, 108, { fill: '#eef3f1', title: '🚕 計程車上路（0～10 公里）' });
        const roadX = km => 60 + km / 10 * 360;
        k.rect(24, 50, 406, 30, '#5d6870', { rx: 4 });
        for (let m = 0; m < 10; m += 0.5) k.line(roadX(m) + 4, 65, roadX(m) + 12, 65, '#f4f1e6', { 'stroke-width': 2 });
        for (let m = 0; m <= 10; m += 2) k.text(roadX(m), 98, m === 10 ? '10 km' : String(m), { 'text-anchor': 'middle', 'font-size': 10 });
        k.rect(roadX(0) - 2, 44, 4, 42, C.green);
        const tx = roadX(x);
        k.rect(tx - 36, 60, 40, 14, '#f2c230', { rx: 4, stroke: '#b8860b', 'stroke-width': 1 });
        k.rect(tx - 28, 51, 24, 11, '#f2c230', { rx: 3 });
        k.rect(tx - 25, 53, 9, 7, '#cfe3f3', { rx: 1 });
        k.rect(tx - 14, 53, 8, 7, '#cfe3f3', { rx: 1 });
        k.rect(tx - 21, 46, 10, 5, C.ink, { rx: 1 });
        k.circle(tx - 27, 75, 4.5, C.ink); k.circle(tx - 5, 75, 4.5, C.ink);
        k.rect(440, 28, 140, 78, '#1d2a33', { rx: 8 });
        k.text(452, 46, '計費表', { 'font-size': 11, fill: '#9fb7c4' });
        k.text(568, 46, `${fmt(x, 1)} km`, { 'text-anchor': 'end', 'font-size': 11, fill: '#9fb7c4' });
        k.text(510, 84, `NT$ ${Math.round(y)}`, { 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 800, fill: '#7cf29a', 'font-family': 'Consolas, monospace' });
        // 車資–里程圖。
        const p = k.plot({ xmin: 0, xmax: 10, ymin: 0, ymax: 400, left: 60, width: 320, top: 150, height: 218, xticks: 5, yticks: 4, xlabel: '里程 x（公里）', ylabel: '車資 y（元）' });
        const gk = k.sub(k.clip(p.left - 8, p.top - 8, p.width + 16, p.height + 16));
        gk.curve(p, fare, C.coral, { 'stroke-width': 4 }, 0, 10, 2);
        for (const [rx, ry] of receipts) {
          gk.line(p.x(rx), p.y(ry), p.x(rx), p.y(MP.clamp(fare(rx), 0, 410)), C.purple, { 'stroke-width': 1.5, 'stroke-dasharray': '4 3' });
          gk.circle(p.x(rx), p.y(ry), 5.5, C.purple, { stroke: '#fff', 'stroke-width': 2 });
        }
        // 斜率三角形：走 2 公里，車資多 2a。
        const x0 = x <= 8 ? x : x - 2, y0 = fare(x0), y2 = fare(x0 + 2);
        if (y2 <= 400) {
          k.polyline([[p.x(x0), p.y(y0)], [p.x(x0 + 2), p.y(y0)], [p.x(x0 + 2), p.y(y2)]], C.blue, { 'stroke-width': 2 });
          k.text(p.x(x0 + 1), p.y(y0) + 15, '2 公里', { 'text-anchor': 'middle', 'font-size': 10, fill: C.blue, ...halo });
          k.text(p.x(x0 + 2) + 5, p.y((y0 + y2) / 2) + 4, `+${2 * a}`, { 'font-size': 11, 'font-weight': 700, fill: C.blue, ...halo });
        }
        k.dot(p, 0, b, C.green, 5);
        k.text(p.x(0) + 9, Math.min(p.y(b) + 18, p.bottom - 4), `起跳 b = ${b}`, { 'font-size': 11, 'font-weight': 700, fill: C.green, ...halo });
        if (y <= 400) k.dot(p, x, y, C.coral, 6);
        else k.text(p.x(x), p.top + 10, '↑ 超出', { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 800, fill: C.coral, ...halo });
        const ok = mae < 0.5;
        k.text(p.left + 8, p.top + 14, ok ? '✓ 收據平均差 0 元：找到規則！' : `🧾 收據平均差 ${fmt(mae, 1)} 元`, { 'font-size': 12, 'font-weight': 700, fill: ok ? C.green : C.purple, ...halo });
        // 函數機器＝神經元。
        k.box(400, 128, 190, 284, { fill: '#f8f6fb', title: '🧠 函數機器＝一個神經元' });
        const mx = 495;
        k.circle(mx, 175, 22, C.blueSoft, { stroke: C.blue, 'stroke-width': 2 });
        k.text(mx, 180, fmt(x, 1), { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800, fill: C.ink });
        k.text(mx - 30, 180, '輸入 x', { 'text-anchor': 'end', 'font-size': 11 });
        k.arrow(mx, 198, mx, 214, C.axis, 2);
        k.rect(mx - 72, 216, 144, 32, C.blueSoft, { rx: 6 });
        k.text(mx, 237, `× ${a}（權重 w）`, { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.blue });
        k.arrow(mx, 250, mx, 266, C.axis, 2);
        k.rect(mx - 72, 268, 144, 32, C.greenSoft, { rx: 6 });
        k.text(mx, 289, `＋ ${b}（偏差 b）`, { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.green });
        k.arrow(mx, 302, mx, 318, C.axis, 2);
        k.circle(mx, 342, 22, C.coralSoft, { stroke: C.coral, 'stroke-width': 2 });
        k.text(mx, 347, String(Math.round(y)), { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800, fill: C.ink });
        k.text(mx - 30, 347, '輸出 y', { 'text-anchor': 'end', 'font-size': 11 });
        k.text(mx, 384, 'y = w·x + b', { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.ink });
        k.text(mx, 402, 'AI 裡有數十億個這種乘加', { 'text-anchor': 'middle', 'font-size': 10 });
        return {
          result: `y = ${a}x ${b ? `+ ${b}` : ''}`.trim(),
          detail: `坐 ${fmt(x, 1)} 公里：${a} × ${fmt(x, 1)} + ${b} = ${fmt(y, 1)} 元。5 張收據平均差 ${fmt(mae, 1)} 元${ok ? '——規則找到了！' : '（目標是 0）'}。`
        };
      }
    },

    {
      id: 'pythagoras', track: 'basic', symbol: '△', name: '畢氏定理', question: '捷徑有多長？',
      title: '外送員沿街道騎，無人機直直飛：差多遠？',
      intro: '外送員從餐廳出發，只能沿著街道先往東、再往北騎；如果是無人機，就能直接斜斜地飛過去。斜線比較短，但短多少？把兩段街道當成直角三角形的兩邊 a、b，直線就是斜邊 c：a² + b² = c²。同一個公式，地圖算距離、遊戲判斷撞到沒、AI 比較兩個詞的意思有多近，都在用。',
      scene: '模擬：外送地圖上「沿街道距離」與「直線距離」', viewH: 400,
      chart: '左：棋盤狀街道地圖（紅＝沿街道騎車，藍虛線＝直線）　右：三邊上的正方形，面積 a² + b² = c²',
      caption: '假設街道是整齊的棋盤格、1 格 = 100 公尺、地面是平的。真實城市街道會彎、有單行道；距離很遠時還要考慮地球是圓的。',
      controls: [['a', '往東 a', 1, 8, 1, 3, '格'], ['b', '往北 b', 1, 8, 1, 4, '格']],
      try: '找出 3 組會讓直線距離剛好是整數的 a、b（提示：3 和 4）。再比較 a = b 時，沿街道比直線多走了百分之幾？',
      resultLabel: '直線距離 c',
      takeaway: '直角三角形兩股的平方和等於斜邊的平方；換成座標，就是「兩點距離」的公式。',
      application: '梯子要多長、電視幾吋（對角線）、地圖上兩點直線距離，都是畢氏定理。',
      tech: [
        ['🗺️', 'Google 地圖／外送 App', '同時用「直線距離」快速篩選附近店家，再用實際路線規劃算騎車距離；短距離的直線距離就是座標差的平方和開根號。'],
        ['🛰️', 'GPS 定位', '接收器與衛星的距離是三維的 √(Δx² + Δy² + Δz²)；用好幾顆衛星的距離，解出自己的位置。'],
        ['🎮', '遊戲引擎碰撞判斷', '兩個圓形角色的圓心距離小於半徑和就算相撞；程式常直接比較「距離的平方」，省去開根號。'],
        ['📺', '電視、手機螢幕吋數', '「55 吋」量的是對角線；知道長寬比 16:9，就能用畢氏定理算出實際寬和高。'],
        ['🤖', 'AI 詞向量與語意搜尋', '詞或句子被變成幾百到幾千維的向量，向量的長度和兩點距離用同一個公式（多維畢氏定理）計算，距離近代表意思相近。']
      ],
      teach: {
        grade: '國中八年級（平方根、畢氏定理）',
        connect: '國小「正方形面積」、國中「平方與平方根」、「畢氏定理」、「坐標平面上兩點距離」，高中「向量長度」。',
        activity: '利用教室地磚（或在地上用膠帶貼出 1 公尺方格）：兩位同學分別站在「東 3 格、北 4 格」的兩點。一組沿格線量出 a + b，另一組拉棉繩量直線長度，再用 √(a² + b²) 計算比較。最後用 12 個等距打結的繩子圍出 3–4–5 三角形，檢查是不是直角（古埃及人用這招）。',
        ask: ['沿街道和直線，什麼時候差最多？什麼時候差最少？', '斜邊為什麼一定比任何一股長？', '如果還能往上飛（三維），距離公式會變成什麼？'],
        myth: '「a + b = c」是常見錯誤：直線一定比繞路短。要先把兩股「平方」再相加，最後開根號；而且只有直角三角形才成立。'
      },
      formula: 'a² + b² = c²，c = √(a² + b²)；兩點距離 d = √[(x<sub>2</sub>−x<sub>1</sub>)² + (y<sub>2</sub>−y<sub>1</sub>)²]；n 維：‖u − w‖ = √[Σ<sub>i</sub>(u<sub>i</sub> − w<sub>i</sub>)²]；街道距離（L1）= |Δx| + |Δy|',
      formal: '在歐氏平面上，直角三角形兩股 a、b 與斜邊 c 滿足 a² + b² = c²（反之亦然：滿足此式則為直角）。右圖是面積證明的想法：兩個小正方形的面積和等於大正方形。座標化後得到兩點距離，推廣到 n 維就是向量的歐氏範數 ‖x‖₂。沿棋盤街道的距離叫 L1（曼哈頓）距離 |Δx| + |Δy|；兩者比值 (a + b)/c 介於 1 與 √2 ≈ 1.41 之間，a = b 時最大。地球表面是曲面，長距離要用球面距離（大圓距離）公式；本模擬假設平面與整齊街道。',
      quiz: [
        { question: '餐廳往東 6 格、往北 8 格就是客人家，直線距離是幾格？', options: ['10 格', '14 格', '48 格'], answer: 0, why: '對！6² + 8² = 36 + 64 = 100，√100 = 10。沿街道要騎 14 格。', hint: '先把兩邊各自平方再相加，最後開根號。' },
        { question: '電視「55 吋」指的是螢幕的哪一段長度？', options: ['寬', '對角線', '高'], answer: 1, why: '對！吋數是對角線長度，寬和高可以用畢氏定理配合長寬比算出來。', hint: '想想螢幕上最長的那條線。' }
      ],
      related: ['vector', 'embedding', 'circle', 'attention'],
      draw(k, v) {
        const { C, fmt } = k;
        const a = v.a, b = v.b, c = Math.hypot(a, b), street = a + b, save = (1 - c / street) * 100;
        // 地圖。
        k.box(10, 8, 290, 384, { fill: '#f4f6f2', title: '🛵 外送地圖（1 格 = 100 公尺）' });
        const s = 30, ox = 40, oy = 362, X = i => ox + i * s, Y = j => oy - j * s;
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) k.rect(X(i) + 4, Y(j + 1) + 4, s - 8, s - 8, '#dfe5df', { rx: 3 });
        k.text(24, 46, `▬ 沿街道 a + b = ${street} 格 = ${street * 100} 公尺`, { 'font-size': 11, 'font-weight': 700, fill: C.coral });
        k.text(24, 64, `┅ 直線 c = ${fmt(c, 2)} 格 ≈ ${Math.round(c * 100)} 公尺`, { 'font-size': 11, 'font-weight': 700, fill: C.blue });
        k.text(24, 82, `直線比繞路短了 ${fmt(save, 0)}%`, { 'font-size': 11, fill: C.ink });
        k.polyline([[X(0), Y(0)], [X(a), Y(0)], [X(a), Y(b)]], C.coral, { 'stroke-width': 5, opacity: 0.85 });
        k.line(X(0), Y(0), X(a), Y(b), C.blue, { 'stroke-width': 3, 'stroke-dasharray': '7 5' });
        k.circle(X(0), Y(0), 6, C.ink);
        k.emoji(X(0) - 4, Y(0) + 16, '🍜', 18);
        k.emoji(X(a), Y(b) - 14, '🏠', 20);
        k.text(X(a / 2), Y(0) + 22, `a = ${a}`, { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: C.coral, ...halo });
        const bRight = X(a) + 44 <= 296;
        k.text(X(a) + (bRight ? 8 : -8), Y(b / 2) + 4, `b = ${b}`, { 'text-anchor': bRight ? 'start' : 'end', 'font-size': 11, 'font-weight': 700, fill: C.coral, ...halo });
        // 三個正方形。
        k.box(310, 8, 280, 384, { title: '📐 三邊上的正方形' });
        const sc = Math.min(250 / (a + 2 * b), 280 / (2 * a + b), 30);
        const left = 320 + (260 - (a + 2 * b) * sc) / 2, top = 40 + (284 - (2 * a + b) * sc) / 2;
        const P = (x, y) => [left + (x + b) * sc, top + (a + b - y) * sc];
        const sqA = [P(0, 0), P(a, 0), P(a, -a), P(0, -a)];
        const sqB = [P(a, 0), P(a + b, 0), P(a + b, b), P(a, b)];
        const sqC = [P(0, 0), P(a, b), P(a - b, b + a), P(-b, a)];
        k.polygon(sqC, C.blueSoft, { stroke: C.blue, 'stroke-width': 2 });
        k.polygon(sqA, C.coralSoft, { stroke: C.coral, 'stroke-width': 2 });
        k.polygon(sqB, C.yellowSoft, { stroke: C.yellow, 'stroke-width': 2 });
        if (sc >= 8) {
          for (let i = 1; i < a; i++) { k.line(...P(i, 0), ...P(i, -a), C.coral, { 'stroke-width': 0.7, opacity: 0.5 }); k.line(...P(0, -i), ...P(a, -i), C.coral, { 'stroke-width': 0.7, opacity: 0.5 }); }
          for (let i = 1; i < b; i++) { k.line(...P(a + i, 0), ...P(a + i, b), C.yellow, { 'stroke-width': 0.7, opacity: 0.5 }); k.line(...P(a, i), ...P(a + b, i), C.yellow, { 'stroke-width': 0.7, opacity: 0.5 }); }
        }
        k.polygon([P(0, 0), P(a, 0), P(a, b)], '#fff', { stroke: C.ink, 'stroke-width': 2 });
        const m = Math.min(10, sc * 0.4), [rx, ry] = P(a, 0);
        k.polyline([[rx - m, ry], [rx - m, ry - m], [rx, ry - m]], C.ink, { 'stroke-width': 1.5 });
        const label = (pts, str, color, minSide) => {
          const cx = pts.reduce((s2, q) => s2 + q[0], 0) / 4, cy = pts.reduce((s2, q) => s2 + q[1], 0) / 4;
          if (minSide) k.text(cx, cy + 5, str, { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 800, fill: color, ...halo });
        };
        label(sqA, `a² = ${a * a}`, C.coral, a * sc >= 54);
        label(sqB, `b² = ${b * b}`, C.yellow, b * sc >= 54);
        label(sqC, `c² = ${a * a + b * b}`, C.blue, true);
        k.text(450, 354, `a² + b² = ${a * a} + ${b * b} = ${a * a + b * b}`, { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.ink });
        k.text(450, 376, `c = √${a * a + b * b} ≈ ${fmt(c, 2)} 格`, { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.blue });
        return {
          result: `${fmt(c, 2)} 格 ≈ ${Math.round(c * 100)} 公尺`,
          detail: `√(${a}² + ${b}²) = √${a * a + b * b} ≈ ${fmt(c, 2)}；沿街道要騎 ${a} + ${b} = ${street} 格，是直線的 ${fmt(street / c, 2)} 倍。`
        };
      }
    },

    {
      id: 'circle', track: 'basic', symbol: '○', name: '圓周與面積', question: '大披薩比較划算嗎？',
      title: '同一個直徑：披薩看面積，輪子看圓周',
      intro: '披薩店的「吋」量的是直徑。12 吋的直徑只是 8 吋的 1.5 倍，價錢卻是 2 倍，好像不划算？可是你吃的是「面積」，面積會變成 1.5 × 1.5 = 2.25 倍！同樣的圓，裝在腳踏車上就變成輪子：輪子轉一圈，車子剛好前進一個圓周長 π × 直徑，碼表就是這樣算里程的。',
      scene: '模擬：比較兩種披薩每平方吋的價錢＋腳踏車碼表算里程', viewH: 440,
      chart: '左上：8 吋與 d 吋披薩　右上：跟 8 吋比是幾倍（藍＝圓周、紅＝面積、紫點＝價錢）　下：輪子與碼表',
      caption: '假設兩種披薩厚度與配料一樣、只比面積；8 吋披薩固定 200 元（虛構價格）。輪子不打滑、不變形，實際輪胎受胎壓與載重影響，有效周長會略小。',
      controls: [['d', '直徑 d', 6, 28, 1, 12, '吋'], ['price', 'd 吋披薩價錢', 100, 1000, 10, 400, '元'], ['turns', '輪子轉了', 0, 40, 0.25, 10, '圈']],
      play: 'turns',
      try: '把直徑調到 16 吋（8 吋的 2 倍）：圓周和面積各變幾倍？價錢要定多少，兩種披薩才一樣划算？再按播放，看紅色氣嘴每轉一圈，碼表加多少。',
      resultLabel: 'd 吋披薩是 8 吋的幾倍',
      takeaway: '直徑變 k 倍，圓周變 k 倍，面積卻變 k² 倍；所有圓的「圓周 ÷ 直徑」都是同一個數 π。',
      application: '買披薩比面積、圍花圃算圓周、輪胎換尺寸會讓車速表不準，都是圓的公式。',
      tech: [
        ['🚲', '自行車碼表與運動手錶', '磁鐵感測器數輪子轉了幾圈，乘上你設定的輪周長（π × 直徑），就得到里程；再除以時間得到速度。'],
        ['🚗', '汽車車速表與輪胎尺寸', '車速表依「輪子轉速 × 輪周長」換算；換成外徑較大的輪胎，每圈走得比較遠，儀表顯示的速度就會偏低。'],
        ['📡', '基地台與 Wi-Fi 覆蓋', '理想情況下覆蓋範圍近似圓形，面積 πr²：半徑變 2 倍，涵蓋面積約變 4 倍（實際受建築物與地形影響）。'],
        ['🤖', 'Transformer 的位置編碼', '原始 Transformer 用 sin、cos 標記每個字的位置，像點在圓上以不同速度繞圈；Llama 等模型用的 RoPE 則直接把向量「旋轉」一個角度（見位置編碼）。']
      ],
      teach: {
        grade: '國小六年級（圓周率、圓周長、圓面積）～國中九年級（相似形）',
        connect: '國小「圓周長 = 直徑 × 圓周率」、「圓面積 = 半徑 × 半徑 × 圓周率」、「扇形」，國中「相似形的面積比」，大學「積分求面積」。',
        activity: '每組準備 4 個圓形物品（膠帶捲、碗、瓶蓋、光碟）、棉線和尺。用棉線繞一圈量圓周、用尺量直徑，算「圓周 ÷ 直徑」填入表格，全班比較是不是都接近 3.14。接著在地上貼一條紙膠帶，把膠帶捲滾一圈並做記號，量出前進距離，和量到的圓周比較。',
        ask: ['不管大圓小圓，圓周 ÷ 直徑為什麼都差不多？', '16 吋披薩的面積是 8 吋的幾倍？價錢要怎麼定才公平？', '腳踏車輪胎氣不夠時，碼表算出的里程會偏多還偏少？'],
        myth: '「直徑變 2 倍，面積也變 2 倍」是錯的：面積和直徑的平方成正比，會變 4 倍。比較披薩要比面積，不是比吋數。'
      },
      formula: 'C = πd = 2πr；A = πr²；直徑變 k 倍 ⇒ C 變 k 倍、A 變 k² 倍；里程 = 轉數 × πd；A = ∫<sub>0</sub><sup>r</sup> 2πt dt = πr²',
      formal: 'π 定義為任意圓的周長與直徑之比，是無理數（3.14159…）。把圓切成很多細扇形交錯排開，會接近寬 πr、高 r 的長方形，所以面積 πr²；用積分則是把半徑 t 的細圓環（周長 2πt、厚 dt）從 0 累加到 r。所有圓都相似：長度比 k 時面積比 k²（體積比 k³）。本模擬的「倍數」都以 8 吋為基準：圓周比 d/8、面積比 (d/8)²、價錢比 price/200；面積比大於價錢比，就代表大披薩每平方吋比較便宜。碼表模型假設無打滑：前進距離 = 轉數 × 周長；1 吋 = 2.54 公分。',
      quiz: [
        { question: '12 吋披薩的面積，大約是 6 吋披薩的幾倍？', options: ['2 倍', '4 倍', '6 倍'], answer: 1, why: '對！直徑 2 倍，面積是 2² = 4 倍。', hint: '面積和直徑的「平方」成正比。' },
        { question: '腳踏車輪直徑 0.7 公尺，轉 10 圈大約前進多遠？', options: ['7 公尺', '約 22 公尺', '約 15 公尺'], answer: 1, why: '對！一圈 π × 0.7 ≈ 2.2 公尺，10 圈約 22 公尺。', hint: '轉一圈前進的是圓周長，不是直徑。' }
      ],
      related: ['pythagoras', 'integral', 'fourier', 'position'],
      draw(k, v) {
        const { C, fmt } = k;
        const d = v.d, ratio = d / 8, areaR = ratio * ratio, priceR = v.price / 200;
        const area = d2 => Math.PI * (d2 / 2) ** 2, refUnit = 200 / area(8), unit = v.price / area(d);
        const bigBetter = unit < refUnit - 1e-9, same = Math.abs(unit - refUnit) < 0.005;
        // 披薩比較。
        k.box(10, 8, 300, 272, { fill: '#fff8ec', title: '🍕 哪個披薩比較划算？' });
        const S = 6.8;
        const pizza = (cx, cy, dIn) => {
          const r = dIn / 2 * S;
          k.circle(cx, cy, r, '#e3a857');
          k.circle(cx, cy, r * 0.86, '#f6d27a');
          [[0.5, 0.3], [0.55, 2.2], [0.25, 4.1], [0.6, 3.4], [0.62, 5.3], [0.0, 0], [0.4, 1.2]].forEach(([f, ang]) => {
            const [px, py] = pt(cx, cy, r * f, ang);
            k.circle(px, py, r * 0.11, C.coral);
          });
          k.line(cx - r, cy, cx + r, cy, C.ink, { 'stroke-width': 1.5, 'stroke-dasharray': '4 3' });
        };
        pizza(66, 142, 8);
        pizza(205, 142, d);
        const good = C.green, tag = (cx, label, u, win) => {
          k.text(cx, 252, label, { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.ink });
          k.text(cx, 270, `每平方吋 ${fmt(u, 2)} 元${win ? ' ✓' : ''}`, { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': win ? 800 : 400, fill: win ? good : C.muted });
        };
        tag(66, '8 吋　$200', refUnit, !bigBetter && !same);
        tag(205, `${d} 吋　$${v.price}`, unit, bigBetter && !same);
        // 倍數圖。
        const p = k.plot({ xmin: 4, xmax: 28, ymin: 0, ymax: 16, left: 350, width: 225, top: 40, height: 196, xticks: 4, yticks: 4, xlabel: '直徑 d（吋）', ylabel: '跟 8 吋比是幾倍' });
        k.curve(p, x => (x / 8) ** 2, C.coral, { 'stroke-width': 3 });
        k.curve(p, x => x / 8, C.blue, { 'stroke-width': 3 });
        k.text(p.x(17) - 6, p.y((17 / 8) ** 2), '面積 ×k²', { 'text-anchor': 'end', 'font-size': 11, 'font-weight': 700, fill: C.coral, ...halo });
        k.text(p.x(23), p.y(23 / 8) - 8, '圓周 ×k', { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: C.blue, ...halo });
        k.line(p.x(d), p.top, p.x(d), p.bottom, C.axis, { 'stroke-width': 1, 'stroke-dasharray': '3 3' });
        k.dot(p, d, Math.min(areaR, 16), C.coral, 5);
        k.dot(p, d, ratio, C.blue, 5);
        k.dot(p, d, Math.min(priceR, 16), C.purple, 5);
        // 腳踏車輪與碼表。
        k.box(10, 290, 580, 142, { fill: '#f4f6f2', title: '🚲 腳踏車碼表：輪子轉一圈＝前進一個圓周 πd' });
        const ground = 404, r = d * 1.5, cx = 66, cy = ground - r, theta = TAU * v.turns;
        const circPx = Math.PI * d * 3;
        k.line(24, ground, 410, ground, C.axis, { 'stroke-width': 2 });
        k.line(cx, ground, cx + circPx, ground, C.coral, { 'stroke-width': 6 });
        k.line(cx + circPx, ground - 8, cx + circPx, ground + 8, C.coral, { 'stroke-width': 2 });
        k.circle(cx, cy, r, 'none', { stroke: C.ink, 'stroke-width': 5 });
        for (let i = 0; i < 8; i++) { const [sx, sy] = pt(cx, cy, r - 3, theta + i * Math.PI / 4); k.line(cx, cy, sx, sy, C.gray, { 'stroke-width': 1.2 }); }
        k.circle(cx, cy, 3.5, C.ink);
        k.circle(cx + (r - 1) * Math.sin(theta), cy - (r - 1) * Math.cos(theta), 4.5, C.coral, { stroke: '#fff', 'stroke-width': 1.5 });
        const metersPerTurn = Math.PI * d * 0.0254, dist = metersPerTurn * v.turns;
        k.text(24, 424, `一圈 = π × ${d} ≈ ${fmt(Math.PI * d, 1)} 吋 ≈ ${fmt(metersPerTurn, 2)} 公尺（紅線就是攤平的一圈）`, { 'font-size': 11, fill: C.ink });
        k.text(150, 340, '🧲 磁鐵每經過感測器一次＝轉 1 圈', { 'font-size': 11 });
        k.rect(426, 302, 152, 120, '#1d2a33', { rx: 10 });
        k.text(440, 321, '碼表', { 'font-size': 11, fill: '#9fb7c4' });
        k.text(564, 321, `轉 ${fmt(v.turns, 2)} 圈`, { 'text-anchor': 'end', 'font-size': 11, fill: '#9fb7c4' });
        k.text(502, 362, `${fmt(dist, 1)}`, { 'text-anchor': 'middle', 'font-size': 28, 'font-weight': 800, fill: '#7cf29a', 'font-family': 'Consolas, monospace' });
        k.text(502, 385, '公尺', { 'text-anchor': 'middle', 'font-size': 11, fill: '#9fb7c4' });
        k.text(502, 408, `${fmt(v.turns, 2)} × ${fmt(metersPerTurn, 2)} m`, { 'text-anchor': 'middle', 'font-size': 11, fill: '#9fb7c4' });
        const verdict = same ? '兩個一樣划算' : bigBetter ? `${d} 吋比較划算` : '8 吋比較划算';
        return {
          result: `面積 ×${fmt(areaR, 2)}（圓周 ×${fmt(ratio, 2)}）`,
          detail: `${d} 吋面積 π × ${fmt(d / 2, 1)}² ≈ ${fmt(area(d), 1)} 平方吋，${v.price} ÷ ${fmt(area(d), 1)} ≈ ${fmt(unit, 2)} 元／平方吋（8 吋是 ${fmt(refUnit, 2)}），${verdict}。輪子轉 ${fmt(v.turns, 2)} 圈 × ${fmt(metersPerTurn, 2)} 公尺 ≈ ${fmt(dist, 1)} 公尺。`
        };
      }
    },

    {
      id: 'probability', track: 'basic', symbol: '%', name: '機率', question: '抽幾次才會中？',
      title: '扭蛋機裡的稀有款：抽得越多，越接近真正的機率',
      intro: '扭蛋機裡 20 顆扭蛋有 2 顆金色稀有款，抽一次中金色的機會是 2/20 = 1/10。可是抽 10 次不一定剛好中 1 次！有人運氣好、有人運氣差；但抽的次數越多，每個人「中的比例」都會越來越靠近 1/10——這叫大數法則。AI 寫文章時，也是照著機率在「抽」下一個字。',
      scene: '模擬：扭蛋機抽獎（每次抽完放回），三位玩家的中獎比例', viewH: 400,
      chart: '左：扭蛋機與玩家 A 最近 10 抽　右：三位玩家抽到第 n 次時的中獎比例（虛線＝真正機率，灰帶＝大部分人會落在的範圍）',
      caption: '假設每次抽完都補回同樣的扭蛋，所以每一抽都獨立、機率不變。亂數由電腦產生（固定種子，所以同樣設定每次畫出來都一樣）。灰帶是 p ± 2 × 標準差，大約 95% 的情況會落在裡面。',
      controls: [['gold', '金色稀有款', 1, 10, 1, 2, '顆（共 20 顆）'], ['n', '已經抽了', 0, 500, 5, 200, '次']],
      play: 'n',
      try: '先把「已經抽了」拉回 0 再按播放：三條線一開始亂跳，後來往哪裡集中？灰帶為什麼越來越窄？',
      resultLabel: '玩家 A 實際抽中的比例',
      takeaway: '機率是「長期來看會發生的比例」：次數少時很亂，次數多時才穩定。',
      application: '降雨機率、抽籤、保險費率、醫學檢驗準確度，都在用機率描述「不確定」。',
      tech: [
        ['🌧️', '中央氣象署降雨機率', '預報「降雨機率 70%」表示預報時段內，這個地區出現 0.1 毫米以上降雨的機會有 7 成——像在類似的天氣條件下，大約 10 次有 7 次會下雨；不是「70% 的地方會下雨」，也和雨量大小無關。'],
        ['📧', 'Gmail 等垃圾郵件過濾', '根據信件裡字詞與特徵，估計「這封是垃圾信的機率」，超過門檻就放進垃圾信匣（早期用貝氏過濾，現在多搭配機器學習）。'],
        ['🎮', '手遊轉蛋機率公告', '台灣自 2023 年起，網路連線遊戲的定型化契約規範要求業者以百分比公開付費機率型商品的中獎機率；玩家可以用 1 ÷ 機率估計「平均要抽幾次」。'],
        ['🤖', 'ChatGPT／Claude 生成文字', '每一步先算出所有候選字的機率，再依機率「抽籤」選字，所以同一個問題問兩次，回答可能不一樣（見下一個字的機率）。']
      ],
      teach: {
        grade: '國小五年級（可能性）～國中九年級（機率）',
        connect: '國小「分數、百分率」、國中九年級「機率」、高中「獨立事件、二項分布」，大學「大數法則、中央極限定理」。',
        activity: '「紙杯扭蛋」：每組一個紙杯放 20 張卡片，其中 2 張畫金星。兩人一組，一人抽、一人畫正字記錄，每次抽完放回並搖勻，抽 30 次。各組先算自己的金星比例（差很多！），再把全班的次數加總計算（接近 10%）。最後把全班比例畫在黑板上的長條圖。',
        ask: ['為什麼有的組抽 30 次一次都沒中？是卡片有問題嗎？', '連續 9 次沒中，第 10 次中獎的機會會變大嗎？', '如果抽完不放回，機率會怎麼變？'],
        myth: '「已經好久沒中了，下一次一定會中」是賭徒謬誤：放回再抽時，每一次都是獨立的，機率永遠是 1/10；大數法則是「比例」慢慢接近，不是「補回來」。'
      },
      formula: 'P(中) = 有利結果數 ÷ 全部等可能結果數 = k/20；抽 n 次中 X 次：X ~ B(n, p)，E[X] = np；比例 X/n 的標準差 = √[p(1−p)/n]；大數法則：X/n → p（n → ∞）；至少中一次：1 − (1−p)<sup>n</sup>',
      formal: '每次抽完放回並攪勻，各抽是獨立且機率相同的伯努利試驗，n 次中的次數 X 服從二項分布 B(n, p)。比例 X/n 的期望值是 p，標準差 √[p(1−p)/n] 隨 n 增加而縮小，所以比例會集中到 p（弱大數法則）。灰帶 p ± 2√[p(1−p)/n] 用常態近似（中央極限定理），n 很小或 p 很接近 0 時近似不準。「抽到第一次中獎為止」的次數服從幾何分布，平均 1/p 次。電腦用偽亂數模擬隨機；真實扭蛋若不放回，機率會隨剩餘扭蛋改變（超幾何分布）。',
      quiz: [
        { question: '扭蛋機 20 顆裡有 2 顆金色，抽一次中金色的機率是？', options: ['1/10', '1/2', '2/18'], answer: 0, why: '對！2/20 = 1/10 = 10%。', hint: '符合條件的有幾顆？全部有幾顆？' },
        { question: '小明（放回再抽）連續 9 次沒中，第 10 次中獎的機率會？', options: ['變大，因為快輪到了', '不變', '變小，因為運氣不好'], answer: 1, why: '對！每次抽都是獨立的，機率一直是 1/10。', hint: '扭蛋機記得小明之前抽過什麼嗎？' }
      ],
      related: ['fraction', 'statistics', 'token', 'softmax'],
      draw(k, v) {
        const { C, fmt } = k;
        const g = v.gold, prob = g / 20, n = Math.round(v.n);
        const hitsOf = u => { const h = [0]; for (let i = 0; i < n; i++) h.push(h[i] + (u[i] < prob ? 1 : 0)); return h; };
        const H = PLAYER_U.map(hitsOf), A = H[0][n] || 0;
        // 扭蛋機。
        k.box(10, 8, 214, 384, { fill: '#fdf9f2', title: '🎁 扭蛋機（金色＝稀有）' });
        const gx = 117, gy = 112;
        k.circle(gx, gy, 72, '#eef6fb', { stroke: C.blue, 'stroke-width': 3 });
        const gold = new Set(CAPSULES.order.slice(0, g)), others = [C.blue, C.green, C.purple, C.coral];
        CAPSULES.pos.forEach(([x, y], i) => {
          const isGold = gold.has(i);
          k.circle(gx + x, gy + y, 10, isGold ? '#f2c230' : others[i % 4], { stroke: isGold ? '#a77400' : '#fff', 'stroke-width': isGold ? 2 : 1.5, opacity: isGold ? 1 : 0.55 });
          k.line(gx + x - 10, gy + y, gx + x + 10, gy + y, '#fff', { 'stroke-width': 1.2 });
        });
        k.rect(52, 184, 130, 84, C.coral, { rx: 10 });
        k.circle(117, 218, 16, '#fff', { stroke: C.ink, 'stroke-width': 2 });
        const [hx, hy] = pt(117, 218, 11, -Math.PI / 2 + n * Math.PI / 2);
        k.line(117, 218, hx, hy, C.ink, { 'stroke-width': 4 });
        k.circle(hx, hy, 4.5, C.ink);
        k.circle(117, 218, 3, C.ink);
        k.rect(90, 246, 54, 14, C.ink, { rx: 4 });
        k.text(24, 294, '玩家 A 最近 10 抽', { 'font-size': 11, 'font-weight': 700, fill: C.ink });
        for (let i = 0; i < 10; i++) {
          const idx = n - 10 + i, x = 30 + i * 19;
          if (idx < 0) { k.circle(x, 312, 8, 'none', { stroke: C.axis, 'stroke-dasharray': '2 2' }); continue; }
          const win = PLAYER_U[0][idx] < prob;
          k.circle(x, 312, 8, win ? '#f2c230' : C.graySoft, { stroke: win ? '#a77400' : C.axis, 'stroke-width': 1.5 });
        }
        k.text(24, 344, n ? `中 ${A} 次／抽 ${n} 次` : '還沒抽', { 'font-size': 13, 'font-weight': 700, fill: C.ink });
        k.text(24, 364, n ? `實際比例 ${fmt(A / n * 100, 1)}%` : '實際比例 —', { 'font-size': 12, fill: C.purple, 'font-weight': 700 });
        k.text(24, 383, `真正機率 ${g}/20 = ${fmt(prob * 100, 0)}%`, { 'font-size': 12, fill: C.coral, 'font-weight': 700 });
        // 中獎比例圖。
        const ymax = [0.25, 0.5, 0.75, 1].find(t => t >= prob * 2.5 + 0.08) || 1;
        const p = k.plot({ xmin: 0, xmax: DRAWS, ymin: 0, ymax, left: 272, width: 302, top: 40, height: 282, xticks: 5, yticks: ymax <= 0.5 ? 5 : ymax === 0.75 ? 3 : 4, xlabel: '抽的次數 n', ylabel: '中獎比例（開頭太高的會超出圖外）', tickFmt: x => (x <= 1 ? `${Math.round(x * 100)}%` : String(Math.round(x))) });
        const band = [], sd = m => 2 * Math.sqrt(prob * (1 - prob) / m);
        for (let m = 1; m <= DRAWS; m += 3) band.push([p.x(m), p.y(Math.min(ymax, prob + sd(m)))]);
        for (let m = DRAWS; m >= 1; m -= 3) band.push([p.x(m), p.y(Math.max(0, prob - sd(m)))]);
        k.polygon(band, C.graySoft, { opacity: 0.9 });
        k.line(p.x(0), p.y(prob), p.right, p.y(prob), C.coral, { 'stroke-width': 2, 'stroke-dasharray': '6 4' });
        const gk = k.sub(k.clip(p.left, p.top - 6, p.width + 8, p.height + 12));
        const colors = [C.purple, C.green, C.yellow];
        for (let j = 2; j >= 0; j--) {
          if (n < 1) break;
          const pts = [];
          for (let m = 1; m <= n; m++) pts.push([p.x(m), p.y(H[j][m] / m)]);
          gk.polyline(pts, colors[j], { 'stroke-width': j ? 1.8 : 3, opacity: j ? 0.85 : 1 });
          gk.circle(p.x(n), p.y(H[j][n] / n), j ? 3.5 : 5, colors[j], { stroke: '#fff', 'stroke-width': 1.5 });
        }
        k.text(p.right - 4, p.y(prob) - 9, `真正機率 ${fmt(prob * 100, 0)}%`, { 'text-anchor': 'end', 'font-size': 11, 'font-weight': 700, fill: C.coral, ...halo });
        ['A', 'B', 'C'].forEach((name, j) => {
          k.text(272 + j * 104, 386, `● 玩家 ${name} ${n ? `${fmt(H[j][n] / n * 100, 1)}%` : '—'}`, { 'font-size': 12, 'font-weight': 700, fill: colors[j] });
        });
        const atLeast = 1 - (1 - prob) ** n;
        const atLeastStr = atLeast > 0.999 ? '> 99.9%' : `≈ ${fmt(atLeast * 100, 1)}%`;
        return {
          result: n ? `${fmt(A / n * 100, 1)}%（真正 ${fmt(prob * 100, 0)}%）` : '還沒抽',
          detail: n ? `${A} ÷ ${n} = ${fmt(A / n * 100, 1)}%；理論上平均每 1 ÷ ${fmt(prob, 2)} = ${fmt(1 / prob, 0)} 抽中 1 次。抽 ${n} 次至少中一次的機率 = 1 − ${fmt(1 - prob, 2)}^${n} ${atLeastStr}。` : `真正機率 ${g} ÷ 20 = ${fmt(prob, 2)}。把「已經抽了」往右拉，或按播放開始抽。`
        };
      }
    },

    {
      id: 'statistics', track: 'basic', symbol: '▥', name: '平均數與中位數', question: '哪個數字最有代表性？',
      title: '一位富翁搬進村子，大家「平均」變有錢了？',
      intro: '小村子有 9 戶人家，月收入都在 3～5 萬元左右。有一天，一位月收入上百萬的富翁搬進來，新聞報導：「本村平均月收入大增！」可是其他 9 戶的錢一塊都沒變多。平均數會被一個特別大的數字拉走；中位數（排隊站中間的那個）卻幾乎不動。用哪個數字描述「一般人」，差很多。',
      scene: '模擬：村子的收入統計與新聞標題（平均數 vs 中位數 vs 標準差）', viewH: 420,
      chart: '上：10 戶人家與新聞標題　左下：由小到大排好的收入（紅線＝平均數、藍線＝中位數）　右下：三個統計數字',
      caption: '收入是虛構的教學資料（單位：萬元／月）。標準差用母體公式（除以 n）。超過圖表上限的長條用斷裂符號表示。',
      controls: [['rich', '新鄰居月收入', 0, 300, 1, 120, '萬元']],
      play: 'rich',
      try: '按播放，讓新鄰居越來越有錢：紅線（平均）和藍線（中位數）誰被拉走？再把收入調成 0，平均數和中位數誰變小比較多？',
      resultLabel: '平均數 vs 中位數',
      takeaway: '平均數會被極端值拉走，中位數不容易被影響；標準差告訴你資料有多分散。',
      application: '薪資、房價、評分、考試成績，都要同時看平均數、中位數和分散程度，才不會被一個數字騙了。',
      tech: [
        ['💰', '行政院主計總處薪資統計', '同時公布平均薪資與薪資中位數；因為少數高薪會拉高平均，中位數更能代表「一般人」的薪水。'],
        ['⭐', 'Google 地圖、App Store 評分', '星等是（加權）平均數，所以少數極端評分（或洗評價）會影響很大；看評分時也要看評分人數與分布。'],
        ['💳', '信用卡盜刷偵測', '銀行系統會比較這筆消費和你平常的金額與習慣，偏離平均好幾個標準差的交易會被標記為可疑（異常值偵測）。'],
        ['🤖', 'Transformer 的 LayerNorm', 'GPT-2、GPT-3 等公開架構的語言模型，每一層都把一組數字「減掉平均、除以標準差」，拉回同一個尺度，訓練才穩定；Llama 用簡化版 RMSNorm（只除以均方根）。']
      ],
      teach: {
        grade: '國小六年級（平均數）～國中七年級（統計圖表、平均數、中位數、眾數）',
        connect: '國小「平均數」、國中「資料整理、統計圖表、中位數與四分位數」，高中「標準差」，大學「穩健統計、資料標準化」。',
        activity: '準備 10 張卡片寫上虛構的「每週零用錢」（例如 80、100、100、120、150、150、180、200、220，第 10 張先空白）。請 10 位同學拿卡片依金額排成一排，全班算平均數、找中位數（中間兩人的平均）。接著老師在第 10 張寫上 5000 元，排到最後，再算一次：誰變了、誰幾乎沒變？',
        ask: ['平均數變大了，代表大部分同學的零用錢都變多了嗎？', '有 10 個人時，中位數要怎麼找？', '新聞說「平均薪資」時，你會想再問什麼問題？'],
        myth: '「平均數就是最常見、最一般的數字」是錯的：資料很不對稱時，大部分人可能都在平均數以下。要描述一般人，常用中位數。'
      },
      formula: '平均數 μ = (x<sub>1</sub> + … + x<sub>n</sub>) / n；中位數：排序後中間值（n 為偶數取中間兩數平均）；標準差 σ = √[Σ(x<sub>i</sub> − μ)² / n]；z = (x − μ)/σ；LayerNorm：y = γ·(x − μ)/√(σ² + ε) + β',
      formal: '平均數是使 Σ(x<sub>i</sub> − c)² 最小的 c，中位數是使 Σ|x<sub>i</sub> − c| 最小的 c。只要改動一個數，平均數就能被拉到任意大（崩潰點 1/n），中位數則要改動將近一半的資料才會被拉走（崩潰點約 50%），所以中位數是「穩健」的統計量。標準差衡量資料離平均有多遠；z 分數把資料換成「離平均幾個標準差」，常把 |z| > 2 或 3 當作可能的異常值——但 n 個資料的 |z| 最大只有 √(n−1)，本例 10 筆最大是 3。本模擬用母體標準差（除以 n）；從樣本估計母體時常除以 n − 1。LayerNorm 對向量的各個分量算 μ、σ，再用可學習的 γ、β 縮放平移，ε 是避免除以 0 的小數。',
      quiz: [
        { question: '2、3、4、5、100 的中位數是多少？', options: ['4', '22.8', '100'], answer: 0, why: '對！排好後正中間是 4；平均數是 114 ÷ 5 = 22.8，被 100 拉走了。', hint: '先由小到大排好，找正中間那一個。' },
        { question: '如果村裡有少數超級富翁，要描述「一般家庭」的收入，比較適合用？', options: ['平均數', '中位數', '最大值'], answer: 1, why: '對！中位數不容易被極端值影響，更能代表一般家庭。', hint: '哪個數字不會被富翁一個人拉走？' }
      ],
      related: ['probability', 'neuron', 'scaling', 'exponential'],
      draw(k, v) {
        const { C, fmt } = k;
        const x = v.rich, all = [...VILLAGE, x], n = all.length;
        const mean = all.reduce((s, q) => s + q, 0) / n;
        const sorted = all.map((val, i) => ({ val, me: i === n - 1 })).sort((p, q) => p.val - q.val || (p.me ? 1 : -1));
        const median = (sorted[4].val + sorted[5].val) / 2;
        const sd = Math.sqrt(all.reduce((s, q) => s + (q - mean) ** 2, 0) / n), z = sd ? (x - mean) / sd : 0;
        // 村子與新聞。
        k.box(10, 8, 580, 128, { fill: '#f4f6f2', title: '🏘️ 小村子 10 戶的月收入（萬元）' });
        all.forEach((val, i) => {
          const hx = 45 + i * 56, me = i === n - 1;
          const icon = !me || x < 10 ? '🏠' : x < 60 ? '🏡' : '🏰', size = me ? 28 + Math.min(18, x / 12) : 28;
          k.emoji(hx, 66, icon, size);
          k.text(hx, 104, me ? `新 ${fmt(val, 0)}` : fmt(val, 1), { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': me ? 800 : 400, fill: me ? C.coral : C.ink });
        });
        k.text(22, 126, `📰「本村平均月收入 ${fmt(mean, 1)} 萬！」　其實：一半人家不到 ${fmt(median, 2)} 萬`, { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        // 排好序的長條圖。
        const L = 52, R = 412, T = 170, B = 375, ymax = 40, Y = q => B - Math.min(q, ymax) / ymax * (B - T);
        for (let t = 0; t <= ymax; t += 10) {
          k.line(L, Y(t), R, Y(t), C.grid, { 'stroke-width': 1 });
          k.text(L - 7, Y(t) + 4, String(t), { 'text-anchor': 'end', 'font-size': 11 });
        }
        k.line(L, B, R, B, C.axis);
        k.text(L, T - 9, '月收入（萬元），由小排到大', { 'font-size': 12, 'font-weight': 700 });
        sorted.forEach(({ val, me }, i) => {
          const bx = L + 18 + i * 36, top = Y(val), mid = i === 4 || i === 5;
          k.rect(bx - 12, top, 24, B - top, me ? C.coralSoft : C.greenSoft, { stroke: mid ? C.blue : me ? C.coral : C.green, 'stroke-width': mid ? 2.5 : 1.2 });
          if (val > ymax) {
            k.polyline([[bx - 13, T + 14], [bx - 4, T + 9], [bx + 4, T + 15], [bx + 13, T + 10]], '#fff', { 'stroke-width': 4 });
            k.polyline([[bx - 13, T + 20], [bx - 4, T + 15], [bx + 4, T + 21], [bx + 13, T + 16]], '#fff', { 'stroke-width': 4 });
          }
          k.text(bx, top - 4, val >= 10 ? fmt(val, 0) : fmt(val, 1), { 'text-anchor': 'middle', 'font-size': 10, fill: me ? C.coral : C.ink, ...halo });
          const under = me ? '新鄰居' : mid ? '中間' : '';
          if (under) k.text(bx, B + 15, under, { 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: me ? C.coral : C.blue });
        });
        k.line(L, Y(median), R, Y(median), C.blue, { 'stroke-width': 2.5 });
        k.line(L, Y(mean), R, Y(mean), C.coral, { 'stroke-width': 2.5, 'stroke-dasharray': '7 4' });
        let ym = Y(mean) + 4, yd = Y(median) + 4;
        if (Math.abs(ym - yd) < 14) { if (mean >= median) { ym = yd - 14; } else { yd = ym - 14; } }
        k.text(R + 4, ym, `平均 ${fmt(mean, 1)}`, { 'font-size': 11, 'font-weight': 700, fill: C.coral });
        k.text(R + 4, yd, `中位 ${fmt(median, 2)}`, { 'font-size': 11, 'font-weight': 700, fill: C.blue });
        // 統計卡。
        k.box(478, 146, 112, 264, { title: '📊 統計卡' });
        const rows = [['平均數 μ', fmt(mean, 1), C.coral], ['中位數', fmt(median, 2), C.blue], ['標準差 σ', fmt(sd, 1), C.purple]];
        rows.forEach(([lab, val, col], i) => {
          k.text(488, 186 + i * 50, lab, { 'font-size': 11 });
          k.text(488, 208 + i * 50, val, { 'font-size': 19, 'font-weight': 800, fill: col });
        });
        k.text(488, 342, '新鄰居 z 分數', { 'font-size': 11 });
        k.text(488, 364, `z = ${fmt(z, 2)}`, { 'font-size': 15, 'font-weight': 800, fill: C.ink });
        const outlier = Math.abs(z) > 2;
        k.text(488, 392, outlier ? '⚠️ 異常值' : '✓ 不算異常', { 'font-size': 12, 'font-weight': 700, fill: outlier ? C.coral : C.green });
        const sum = all.reduce((s, q) => s + q, 0);
        return {
          result: `平均 ${fmt(mean, 1)} 萬 ／ 中位數 ${fmt(median, 2)} 萬`,
          detail: `平均 = ${fmt(sum, 1)} ÷ 10 = ${fmt(mean, 2)}；中位數 = 第 5、6 名 (${fmt(sorted[4].val, 1)} + ${fmt(sorted[5].val, 1)}) ÷ 2 = ${fmt(median, 2)}。標準差 ${fmt(sd, 2)}，新鄰居 z = (${fmt(x, 0)} − ${fmt(mean, 2)}) ÷ ${fmt(sd, 2)} = ${fmt(z, 2)}。`
        };
      }
    }
  );
})();
