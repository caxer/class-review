// 大學機率、統計與資訊理論；每個畫面都從當前控制值重新計算。
// 核對教材（2026-10-03）：
// MIT 18.05: https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/readings/
// MIT Markov chains: https://web.mit.edu/1.041/spring2023/lectures/L9-markov-chains-2023sp-v2.pdf
// Stanford information theory: https://stanford.edu/class/stats311/lecture-notes.pdf
// Ridge objective and normal equations are stated explicitly below; intercept is not penalized.
(() => {
  const pct = x => `${MP.fmt(x * 100, 1)}%`;
  const normal = r => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
  const binomial = (n, p) => Array.from({ length: n + 1 }, (_, j) => {
    if (p === 0) return j === 0 ? 1 : 0;
    if (p === 1) return j === n ? 1 : 0;
    let c = 1;
    for (let i = 1; i <= j; i++) c *= (n - i + 1) / i;
    return c * p ** j * (1 - p) ** (n - j);
  });
  const note = (k, a, b) => {
    k.box(24, 372, 552, 64, { fill: k.C.blueSoft });
    k.text(38, 396, a, { fill: k.C.ink, 'font-size': 13 });
    k.text(38, 417, b, { 'font-size': 12 });
  };
  const heading = (k, text) => k.text(30, 30, text, { fill: k.C.ink, 'font-weight': 700, 'font-size': 15 });
  const make = data => ({ track: 'probability', viewH: 450, ...data });

  MP.register(make({
    id: 'bayes', symbol: '🕵️', name: '貝氏推論', question: '新線索怎麼改變猜測？',
    title: '抽到紅球，來自哪一個袋子？',
    intro: '兩個袋子都有紅球。A 袋的紅球比較多，卻不代表抽到紅球就一定來自 A！先看機器平常多常選 A，再看兩袋各有多少紅球，最後只留下「抽到紅球」的情況重新比較。這就是貝氏更新。',
    scene: '袋子偵探：先選袋子，再抽一球', chart: '長條寬度代表機率；下方將兩種紅球來源重新湊成 100%。',
    caption: 'A 袋有 80% 紅球，B 袋有 20% 紅球；每次抽球後放回。紅、藍分別代表紅球、非紅球。',
    controls: [['prior', '機器原本選 A 的機率', 0, 100, 1, 30, '%'], ['reds', '連續看見紅球', 1, 6, 1, 1, '次']],
    try: '先把選 A 機率降到 5%，再增加連續紅球次數。很少見的袋子，需要多少線索才變得可信？',
    resultLabel: '看完線索後，來自 A 的機率', takeaway: '新猜測＝原本的可能性，乘上這個猜測產生線索的能力，再重新分配。',
    application: '分類器、機器感測與科學推論會結合原本資訊和新觀察。',
    tech: [['📨', '垃圾郵件分類', '根據郵件出現的文字更新分類機率；實際模型還需處理詞語相依。'], ['🤖', '機器人定位', '把原先的位置估計與新的距離測量合在一起。']],
    teach: { grade: '國小高年級可探索；大學機率論', connect: '用「只留下符合線索的人」理解條件機率。', activity: '畫 100 個格子，依機器選袋機率分成 A、B，再各塗 80%、20% 紅色。只數紅格子裡有多少屬於 A。', ask: ['紅球很多的袋子，一開始就一定很常被選到嗎？', '連續看到更多紅球，猜測如何改變？'], myth: 'P(紅球｜A) 與 P(A｜紅球) 是兩個不同的問題。先驗為零的事件，在這個模型內無法靠更新變成非零。' },
    formula: 'P(A｜Rⁿ) = π·0.8ⁿ / [π·0.8ⁿ + (1−π)·0.2ⁿ]',
    formal: 'π 是選 A 的先驗機率。機器只選一次袋子，之後在同一袋放回抽球 n 次；給定袋子後，各次抽球獨立，因此似然可以相乘。分母是觀察到 n 次紅球的總機率。模型、先驗或獨立假設不合現實時，結果也會受到影響。',
    quiz: [{ question: 'A 袋有 80% 紅球，就表示抽到紅球有 80% 來自 A 嗎？', options: ['是，一定如此', '還要看原本多常選 A', '只要看球的大小'], answer: 1, why: '兩個條件機率方向不同，必須把選袋子的先驗機率算進來。' }, { question: '同袋放回抽球，連續紅球越多會怎樣？', options: ['通常更支持紅球較多的 A', '所有先驗都會變成零', 'B 一定更可能'], answer: 0, why: '當 A 的先驗介於 0 與 1，每一個紅球都讓支持 A 相對於 B 的比值乘上 4。' }],
    related: ['distributions', 'probability', 'hypothesis'],
    draw(k, v) {
      const pi = v.prior / 100, a = pi * 0.8 ** v.reds, b = (1 - pi) * 0.2 ** v.reds, post = a / (a + b);
      heading(k, '先驗 × 線索的可能性 → 更新後的猜測');
      const rows = [[90, 'A 袋', pi, 0.8, k.C.coral], [160, 'B 袋', 1 - pi, 0.2, k.C.blue]];
      rows.forEach(([y, label, prior, red, color]) => {
        k.text(32, y, `${label}：先驗 ${pct(prior)}`, { fill: color });
        k.rect(220, y - 20, 330, 28, k.C.graySoft, { rx: 4 });
        k.rect(220, y - 20, 330 * prior, 28, color, { rx: 4 });
        k.text(220, y + 31, `同袋連續 ${v.reds} 次紅球：${pct(red ** v.reds)}`, { 'font-size': 12 });
      });
      k.text(32, 254, '只比較符合線索的情況', { fill: k.C.ink, 'font-weight': 700 });
      k.rect(32, 274, 536 * post, 42, k.C.coral, { rx: 3 });
      k.rect(32 + 536 * post, 274, 536 * (1 - post), 42, k.C.blue, { rx: 3 });
      k.text(32, 343, `A：${pct(post)}`, { fill: k.C.coral });
      k.text(568, 343, `B：${pct(1 - post)}`, { fill: k.C.blue, 'text-anchor': 'end' });
      note(k, `這組線索出現的總機率：${pct(a + b)}`, '同樣的紅球線索，配上不同的先驗，會得到不同的答案。');
      return { result: pct(post), detail: `原本選 A 的機率 ${pct(pi)}。A、B 產生這組線索的加權機率分別是 ${MP.fmt(a, 5)}、${MP.fmt(b, 5)}；把前者除以兩者總和，得到 ${pct(post)}。` };
    }
  }), make({
    id: 'distributions', symbol: '🎲', name: '隨機變數與分布', question: '把隨機結果變成一張地圖？',
    title: '一盒種子，最後會長出幾株？',
    intro: '每顆種子可能發芽，也可能不發芽。我們把「最後發芽幾顆」叫作 X。X 不只一個可能答案；分布把每個答案和它的機率一起列出來。平均值像平衡點，變異數則告訴我們答案有多分散。',
    scene: '二項分布：獨立種子的發芽數', chart: '每一根柱子是「剛好發芽這麼多顆」的機率，橘線標出期望值。',
    caption: '教學模型假設每顆種子發芽機率相同，而且互不影響。圖為精確機率，並非抽樣次數。',
    controls: [['n', '種子顆數 n', 1, 30, 1, 12, '顆'], ['p', '每顆發芽機率', 0, 100, 1, 60, '%']],
    try: '固定種子數，讓發芽機率從 0% 移到 100%。在哪裡最分散？期望值可以是半顆嗎？',
    resultLabel: '期望發芽數', takeaway: '分布描述整張可能性地圖；期望值和變異數各摘要其中一個特徵。',
    application: '良率估計、可靠度與抽樣計畫，都需要先說清楚隨機變數和假設。',
    tech: [['🌱', '發芽與良率', '在近似獨立且機率相同時，用二項分布估計成功個數。'], ['📡', '封包接收', '用成功數的分布分析重複傳送的可靠度。']],
    teach: { grade: '國小高年級可探索；大學機率論', connect: '從「會不會」走到「成功幾次」，再觀察平均和分散。', activity: '每組用硬幣代替 10 顆種子，正面算發芽，記下每組成功顆數，排成人形長條圖。', ask: ['期望 7.2 顆，是否真的會長出 0.2 顆？', '所有柱子的機率加起來是多少？'], myth: '期望值是大量重複後的平均，不保證每次發生，也不一定是最可能的整數答案。' },
    formula: 'X ∼ Binomial(n,p)；P(X=k) = C(n,k)pᵏ(1−p)ⁿ⁻ᵏ；E[X]=np；Var(X)=np(1−p)',
    formal: 'X 為 n 個獨立 Bernoulli(p) 變數的總和。C(n,k) 計算恰有 k 次成功的排列方式。變異數是 E[(X−E[X])²]，標準差是它的平方根。若種子共享病害而彼此相依，二項模型可能低估波動。p=0 或 1 時分布集中於單一結果。',
    quiz: [{ question: '12 顆種子的期望值是 7.2 顆，代表什麼？', options: ['每次都長出 7.2 顆', '反覆種很多盒後，平均接近 7.2', '模型一定錯了'], answer: 1, why: '期望值可以不是整數，單次發芽數仍是整數。' }, { question: '每顆都一定發芽時，變異數多少？', options: ['最大', '等於種子数', '零'], answer: 2, why: '沒有任何不確定，結果永遠等於 n，因此變異數為零。' }],
    related: ['clt', 'bayes', 'confidence'],
    draw(k, v) {
      const p = v.p / 100, probs = binomial(v.n, p), mean = v.n * p, variance = mean * (1 - p);
      heading(k, 'X = 這一盒最後發芽的顆數');
      const g = k.plot({ xmin: -0.5, xmax: v.n + 0.5, ymin: 0, ymax: Math.max(...probs) * 1.18, top: 75, height: 230, xlabel: '發芽數 X', ylabel: '機率', xticks: 4, yticks: 4 });
      const width = g.width / (v.n + 1) * 0.76;
      probs.forEach((q, j) => k.rect(g.x(j) - width / 2, g.y(q), width, g.y(0) - g.y(q), k.C.green, { rx: 2 }));
      k.line(g.x(mean), g.top, g.x(mean), g.bottom, k.C.coral, { 'stroke-dasharray': '5 4' });
      note(k, `期望值 ${MP.fmt(mean)} 顆；標準差 ${MP.fmt(Math.sqrt(variance))} 顆`, '期望值像分布的平衡點，標準差描述典型的偏離大小。');
      return { result: `${MP.fmt(mean)} 顆`, detail: `變異數 = ${v.n} × ${MP.fmt(p)} × ${MP.fmt(1 - p)} = ${MP.fmt(variance)}。全部 ${v.n + 1} 種可能的機率合計為 ${MP.fmt(probs.reduce((a, b) => a + b, 0), 4)}。` };
    }
  }), make({
    id: 'clt', symbol: '🔔', name: '中央極限定理', question: '歪歪的資料，平均後變成鐘形？',
    title: '等公車很不平均，很多次的平均呢？',
    intro: '想像公車隨機到站：常常等一下就到，偶爾等很久。單次等待的圖形很歪。把好幾次獨立等待取平均，再反覆收集這些平均值，圖形卻會逐漸像一座鐘形小山！',
    scene: '從指數分布的等待時間，製作樣本平均分布', chart: '綠柱是 2,000 組平均等待時間的密度；橘線是中央極限定理給的常態近似。',
    caption: '假想公車遵循固定速率的 Poisson 到站模型，平均等待 1 分鐘。實際公車有班表，未必符合此模型。',
    controls: [['n', '每組平均幾次等待', 1, 60, 1, 8, '次'], ['seed', '換一批模擬', 1, 20, 1, 1, '號']],
    try: '從每組 1 次慢慢加到 60 次。觀察偏斜減少，同時平均值變得更集中。',
    resultLabel: '樣本平均的理論標準差', takeaway: '在適當條件下，很多獨立觀察的平均值，經標準化後接近常態分布。',
    application: '這使許多平均值的誤差估計有共同的方法，也連接信賴區間。',
    tech: [['🏭', '平均品質', '多次獨立測量的平均通常比單次穩定。'], ['📊', '抽樣推論', '用平均值的近似分布估計抽樣誤差。']],
    teach: { grade: '國小高年級可探索；大學機率論', connect: '每一根柱子裝的是「一組的平均」，不是原始等待時間。', activity: '每組抽 1 張、4 張、16 張等待卡各算平均，分三張圖比較形狀。', ask: ['樣本數增加後，原本的等待時間變短了嗎？', '要把標準差減半，組內次數要變幾倍？'], myth: '中央極限定理不會把原始資料變常態，也不是樣本數到 30 就必然足夠。強烈相依或無有限變異數時，這個版本不適用。' },
    formula: '若 Xᵢ 獨立同分布，E[Xᵢ]=μ，0&lt;σ²&lt;∞，則 √n(X̄−μ)/σ ⇒ N(0,1)；本例 μ=σ=1',
    formal: '⇒ 表示分布收斂。X̄ 的期望值為 μ、標準差為 σ/√n；標準化後的分布才趨近固定的 N(0,1)。本圖直接畫 X̄，因此鐘形線的中心為 1、標準差為 1/√n。有限樣本近似有誤差，小 n 的常態線甚至延伸到不可能的負等待；圖只顯示非負部分。',
    quiz: [{ question: '這裡慢慢接近鐘形的是哪一種資料？', options: ['所有公車的單次等待', '許多組的平均等待', '公車顏色'], answer: 1, why: '定理描述經標準化的樣本平均分布，原始資料仍是偏斜的。' }, { question: '想把平均值的標準差減半，n 應如何改變？', options: ['增加到 2 倍', '減半', '增加到 4 倍'], answer: 2, why: '標準差與 √n 成反比，√4 = 2。' }],
    related: ['distributions', 'confidence', 'hypothesis'],
    draw(k, v) {
      const r = MP.rng(v.seed * 1777), bins = Array(40).fill(0), count = 2000, dx = 0.1;
      let outside = 0, total = 0;
      for (let i = 0; i < count; i++) {
        let sum = 0; for (let j = 0; j < v.n; j++) sum -= Math.log(Math.max(r(), 1e-12));
        const avg = sum / v.n; total += avg;
        if (avg < 4) bins[Math.floor(avg / dx)]++; else outside++;
      }
      const sd = 1 / Math.sqrt(v.n), density = bins.map(b => b / (count * dx));
      heading(k, `每 ${v.n} 次取平均，重複 ${count.toLocaleString()} 組`);
      const ymax = Math.max(...density, 1 / (sd * Math.sqrt(2 * Math.PI))) * 1.15;
      const g = k.plot({ xmin: 0, xmax: 4, ymin: 0, ymax, top: 75, height: 230, xlabel: '一組的平均等待（分鐘）', ylabel: '機率密度' });
      density.forEach((d, i) => k.rect(g.x(i * dx) + 1, g.y(d), g.width / 40 - 2, g.y(0) - g.y(d), k.C.green, { opacity: 0.72 }));
      k.curve(g, x => Math.exp(-0.5 * ((x - 1) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI)), k.C.coral);
      note(k, `模擬平均 ${MP.fmt(total / count, 3)} 分鐘；理論平均永遠是 1 分鐘`, `圖外超過 4 分鐘的組數：${outside}。密度柱的面積才代表機率。`);
      return { result: `${MP.fmt(sd, 3)} 分鐘`, detail: `1 ÷ √${v.n} = ${MP.fmt(sd, 3)}。這批模擬的每組平均值來自獨立、同分布且有限變異數的等待時間；鐘形是有限樣本下的近似。` };
    }
  }), make({
    id: 'confidence', symbol: '📏', name: '信賴區間', question: '只量一些，怎麼表達不確定？',
    title: '用一張張小網，捕捉不知道的平均值',
    intro: '玩具工廠想知道積木的平均重量。每次抽一批，平均都稍微不同。我們不只猜一個點，還畫一段「小網」。把抽樣重做很多次，好的方法能讓約定比例的小網罩到真正平均值。',
    scene: '60 次獨立抽樣，各自製作一個信賴區間', chart: '每條橫線是一個區間；綠線涵蓋真值 50，橘線沒有涵蓋。虛線是真正平均。',
    caption: '教學模型：獨立常態重量，真平均 50 克、已知標準差 12 克。每條線使用同一個區間規則。',
    controls: [['n', '每次抽樣數', 4, 100, 1, 25, '個'], ['level', '信賴等級：1＝90、2＝95、3＝99%', 1, 3, 1, 2, '級'], ['seed', '換 60 批樣本', 1, 20, 1, 1, '號']],
    try: '增加每次抽樣數，小網變寬還是變窄？再提高信賴等級，看看網子為什麼需要放寬。',
    resultLabel: '本次 60 個區間的實際涵蓋率', takeaway: '95% 描述這個製作區間的方法，在反覆抽樣時的長期涵蓋率。',
    application: '量測、科學研究與問卷報告用區間表達估計的精確程度。',
    tech: [['🔬', '量測平均值', '同時報告平均與區間，比只有一個數字更清楚。'], ['📋', '抽樣調查', '抽样設計、加權和相依性也必須反映在誤差計算內。']],
    teach: { grade: '國小高年級可探索；大學統計推論', connect: '每一批樣本給一張不同的網，真值固定在原地。', activity: '畫一條固定直線表示真值，讓每組用不同樣本畫一段區間，數哪些區間跨過直線。', ask: ['提高信賴等級，為何通常要更寬的網？', '60 次實驗一定剛好有 57 次成功嗎？'], myth: '頻率派 95% 信賴區間不表示「這次算出的固定區間有 95% 機率包含固定真值」。95% 是抽樣前，隨機區間方法的長期表現。' },
    formula: 'I = [X̄ − z·σ/√n, X̄ + z·σ/√n]；Pμ(μ ∈ I)=1−α',
    formal: '本例 σ=12 已知，常態母體下 X̄ 精確服從 N(μ,σ²/n)。雙側 90%、95%、99% 的 z 分別約 1.645、1.960、2.576。母體平均 μ 固定，區間 I 隨樣本而隨機；有限 60 次的涵蓋率會波動。真值在現實中未知，此處揭示它只是為了檢查方法。若 σ 未知且常態，應用 t 區間；有偏或相依抽樣不能直接套用。',
    quiz: [{ question: '95% 信賴主要形容什麼？', options: ['95% 的資料點在區間內', '長期重複抽樣時，約 95% 區間罩住真值', '真值每次都會移動'], answer: 1, why: '移動的是樣本與區間，固定的是母體真值。' }, { question: '其餘條件相同，樣本數變成 4 倍？', options: ['區間半寬減半', '區間半寬加倍', '不影響寬度'], answer: 0, why: '半寬為 zσ/√n，所以會變成原本的一半。' }],
    related: ['clt', 'hypothesis', 'bayes'],
    draw(k, v) {
      const z = [1.644853627, 1.959963985, 2.575829304][v.level - 1], level = [90, 95, 99][v.level - 1];
      const se = 12 / Math.sqrt(v.n), half = z * se, r = MP.rng(440 + v.seed), intervals = Array.from({ length: 60 }, () => 50 + se * normal(r));
      const extent = Math.max(8, ...intervals.map(m => Math.abs(m - 50) + half)) * 1.1;
      heading(k, `${level}% 規則：每次抽 ${v.n} 個，每個區間半寬 ${MP.fmt(half)} 克`);
      const g = k.plot({ xmin: 50 - extent, xmax: 50 + extent, ymin: 0, ymax: 60, top: 64, height: 265, xlabel: '估計的平均重量（克）', ylabel: '抽樣批次', yticks: 3, grid: false });
      k.line(g.x(50), 60, g.x(50), 330, k.C.ink, { 'stroke-dasharray': '4 4' });
      let covered = 0;
      intervals.forEach((m, i) => { const yes = Math.abs(m - 50) <= half; covered += yes ? 1 : 0; const y = g.y(i + 0.5); k.line(g.x(m - half), y, g.x(m + half), y, yes ? k.C.green : k.C.coral, { 'stroke-width': 2 }); k.circle(g.x(m), y, 1.8, yes ? k.C.green : k.C.coral); });
      note(k, `這一批 ${covered} / 60 條線罩到 50 克；方法的目標是 ${level}%`, '換一批樣本，實際成功比例會改變；長期才接近約定比例。');
      return { result: pct(covered / 60), detail: `本次 ${covered} 個區間涵蓋真值。每條半寬 = ${MP.fmt(z, 3)} × 12 ÷ √${v.n} = ${MP.fmt(half)} 克。固定同一批標準化亂數時，改 n 只改寬度，不改哪些線涵蓋；換批次才會換結果。` };
    }
  }), make({
    id: 'hypothesis', symbol: '🪙', name: '假設檢定', question: '看到奇怪結果，夠不夠懷疑？',
    title: '硬幣連出好多正面，是巧合嗎？',
    intro: '先暫時假設硬幣公平。丟 20 次後，問：「公平硬幣出現現在這麼偏、甚至更偏的結果，多常見？」這個機率叫 p 值。它幫我們衡量資料與假設是否合得來，但不能直接說硬幣有多大機率公平。',
    scene: '公平硬幣下的精確雙側二項檢定', chart: '全部柱子來自公平硬幣；橘柱為和觀察結果一樣或更偏的結果，機率總和就是 p 值。',
    caption: '固定丟 20 次，H₀：正面機率 0.5。這裡以離 10 次正面的距離判定雙側「更極端」。',
    controls: [['heads', '20 次中看見正面', 0, 20, 1, 15, '次'], ['alpha', '事先選定顯著水準 α', 1, 10, 1, 5, '%']],
    try: '先選好 α，再移動正面次數。比較 10、15、16 次：哪些結果會落在拒絕範圍？',
    resultLabel: '在公平假設下的雙側 p 值', takeaway: 'p 值是「假設成立時，資料至少這麼極端的機率」。',
    application: '比較實驗結果時，檢定提供明確的判斷規則；還需搭配效果大小與研究設計。',
    tech: [['🧪', '對照實驗', '事先決定樣本數、假設與判斷規則，減少事後挑結果。'], ['🏭', '品質監控', '觀察缺陷數是否難以用原有的模型解釋。']],
    teach: { grade: '國小高年級可探索；大學統計推論', connect: '先演練「如果硬幣公平」，再問觀察到的結果有多罕見。', activity: '全班各丟 20 次，記下正面數，看看偶爾是否也有人得到很偏的結果。', ask: ['沒有拒絕公平假設，等於證明公平嗎？', '一直試到得到小 p 值再停，還符合原本規則嗎？'], myth: 'p 值不是 H₀ 為真的機率，也不是結果純屬巧合的機率。不拒絕 H₀ 不等於接受或證明它。' },
    formula: 'H₀:p=0.5；X ∼ Binomial(20,0.5)；p-value = P₀(|X−10| ≥ |x_obs−10|)',
    formal: '在本例對稱二項分布下，雙侧尾端由 |X−10| 定義。若 p-value≤α 就拒絕 H₀；α 控制規則在 H₀ 成立時的第一類錯誤率上限，因分布離散，實際拒絕率通常小於 α。樣本須獨立，分析與停止規則須事先確定。統計顯著不代表效果很大，也不能排除模型假設錯誤。',
    quiz: [{ question: 'p 值 0.04 代表什麼？', options: ['公平假設只有 4% 機率是真的', '在公平假設下，至少這麼偏的資料機率為 4%', '硬幣有 96% 機率造假'], answer: 1, why: 'p 值以假設成立為前提，並沒有算假設本身的機率。' }, { question: 'p 值大於 α 時可以說？', options: ['已證明公平', '永遠不需要更多資料', '目前不足以用這個規則拒絕公平'], answer: 2, why: '證據不足和證明假設成立是不同的事。' }],
    related: ['distributions', 'confidence', 'bayes'],
    draw(k, v) {
      const probs = binomial(20, 0.5), distance = Math.abs(v.heads - 10), pval = probs.reduce((sum, p, j) => sum + (Math.abs(j - 10) >= distance ? p : 0), 0), reject = pval <= v.alpha / 100;
      heading(k, `觀察 ${v.heads} 次正面；與公平期待的 10 次相差 ${distance} 次`);
      const g = k.plot({ xmin: -0.5, xmax: 20.5, ymin: 0, ymax: 0.21, top: 76, height: 230, xlabel: '20 次中的正面數', ylabel: 'H₀ 下的機率', xticks: 4, yticks: 3 });
      probs.forEach((p, j) => k.rect(g.x(j) - 8, g.y(p), 16, g.y(0) - g.y(p), Math.abs(j - 10) >= distance ? k.C.coral : k.C.blue, { rx: 2 }));
      k.line(g.x(v.heads), 64, g.x(v.heads), 311, k.C.ink, { 'stroke-dasharray': '3 4' });
      note(k, `橘柱機率總和 ${pct(pval)}；事先門檻 α = ${v.alpha}%`, reject ? '依這個規則拒絕公平假設；仍可能發生第一類錯誤。' : '依這個規則不拒絕公平假設；這並沒有證明硬幣公平。');
      return { result: pval < 0.0001 ? pval.toExponential(3) : MP.fmt(pval, 5), detail: `雙側 p 值 = ${pct(pval)}，${reject ? '小於或等於' : '大於'} α=${v.alpha}%。這是公平假設下的尾端機率，不是公平假設的真實機率。` };
    }
  }), make({
    id: 'markov', symbol: '🌦️', name: '馬可夫鏈', question: '只看今天，能猜明天天氣？',
    title: '晴天、雨天，一天天把機率傳下去',
    intro: '在這個小小天氣世界，明天的機率只看今天晴或雨。把晴天流向雨天、雨天流回晴天的比例寫成規則，就能每天往前算。過了很多天，有時會接近固定比例，有時卻會來回跳！',
    scene: '兩狀態天氣模型與穩定分布', chart: '上方是每天的轉移規則；下方是晴天機率隨天數變化。虛線標出平穩分布的晴天比例。',
    caption: '這是有限、時間齊次馬可夫鏈。真實天氣通常需要更多狀態與歷史資訊。',
    controls: [['a', '晴天之後變雨天', 0, 100, 5, 25, '%'], ['b', '雨天之後變晴天', 0, 100, 5, 50, '%'], ['initial', '第 0 天晴天機率', 0, 100, 5, 100, '%'], ['days', '推算到第幾天', 0, 30, 1, 10, '天']],
    play: 'days', try: '先看一般設定；再把兩個轉移機率都調成 100%，會一直靠近固定比例嗎？',
    resultLabel: '指定那一天的晴天機率', takeaway: '轉移規則把今天的分布變成明天的分布；平穩分布不保證每個起點都收斂。',
    application: '隨機過程、可靠度與排隊模型用狀態和轉移描述時間中的不確定。',
    tech: [['🛠️', '機器狀態', '估計運作、故障、維修等狀態的長期比例。'], ['🎮', '程序模擬', '用狀態轉移產生具有相依性的行為。']],
    teach: { grade: '國小高年級可探索；大學隨機過程', connect: '機率像在兩個杯子間流動的水，總量永遠為 1。', activity: '用 100 顆豆子代表可能性，每輪把固定比例從晴杯移向雨杯，再把雨杯原本的一部分移回晴杯。', ask: ['移動比例固定，杯子裡的數量也會固定嗎？', '每天必定換天氣時，為什麼會來回跳？'], myth: '存在平穩分布，不代表從任意起點都會收斂到它。每天必換的鏈有平穩分布，卻有週期 2。' },
    formula: 'P = [[1−a,a],[b,1−b]]；πₜ₊₁ = πₜP；sₜ₊₁ = (1−a)sₜ + b(1−sₜ)；s* = b/(a+b)',
    formal: '分布使用行向量 [晴,雨]。a+b>0 時兩狀態模型有唯一平穩分布；a=b=0 時每個初始分布都平穩，沒有唯一答案。a=b=1 時除初始晴率為 1/2 外，分布來回振盪。有限不可約且非週期的鏈保證從任何初始分布收斂。a 或 b 為零也可能收斂，但需依吸收狀態分析。',
    quiz: [{ question: '兩個變天機率都為 100%，而今天一定晴，會怎樣？', options: ['明天以後固定半晴半雨', '晴雨每天交替', '一定永遠晴'], answer: 1, why: '這個鏈有週期 2；平穩分布的存在不等於任意初值都收斂。' }, { question: '馬可夫假設在這裡指什麼？', options: ['已知今天狀態後，明天機率不再需要更早天氣', '每天獨立且完全相同', '天氣完全可預測'], answer: 0, why: '狀態之間仍有相依性，只是用當前狀態就包含模型需要的歷史資訊。' }],
    related: ['eigen', 'matrix', 'distributions'],
    draw(k, v) {
      const a = v.a / 100, b = v.b / 100, seq = [v.initial / 100];
      for (let i = 1; i <= 30; i++) seq.push(seq[i - 1] * (1 - a) + (1 - seq[i - 1]) * b);
      const steady = a + b > 0 ? b / (a + b) : null;
      heading(k, '每天都用同一套轉移規則');
      k.circle(120, 89, 32, k.C.yellowSoft); k.text(120, 94, '晴', { 'text-anchor': 'middle', fill: k.C.ink });
      k.circle(480, 89, 32, k.C.blueSoft); k.text(480, 94, '雨', { 'text-anchor': 'middle', fill: k.C.ink });
      k.arrow(162, 71, 438, 71, k.C.blue); k.text(300, 61, `晴 → 雨：${v.a}%`, { 'text-anchor': 'middle' });
      k.arrow(438, 110, 162, 110, k.C.green); k.text(300, 132, `雨 → 晴：${v.b}%`, { 'text-anchor': 'middle' });
      const g = k.plot({ xmin: 0, xmax: 30, ymin: 0, ymax: 1, top: 171, height: 152, xlabel: '天數', ylabel: '晴天機率', xticks: 3, yticks: 2 });
      if (steady !== null) k.line(g.x(0), g.y(steady), g.x(30), g.y(steady), k.C.gray, { 'stroke-dasharray': '4 4' });
      k.polyline(seq.map((s, i) => [g.x(i), g.y(s)]), k.C.blue);
      k.dot(g, v.days, seq[v.days], k.C.coral, 6);
      const warning = a + b === 0 ? '沒有轉移：初始分布保持不變，平穩分布不唯一。' : a === 1 && b === 1 ? '每天必定換天氣：除初始各半，否則分布會來回跳。' : '本設定會逐漸接近平穩分布；速度取決於轉移機率。';
      note(k, steady === null ? '平穩晴天比例：沒有唯一答案' : `平穩晴天比例 ${pct(steady)}；第 ${v.days} 天 ${pct(seq[v.days])}`, warning);
      return { result: pct(seq[v.days]), detail: warning + ' 總機率始終為 100%；這條線描述機率分布，不是某一次實際天氣紀錄。' };
    }
  }), make({
    id: 'entropy', symbol: '📦', name: '熵與編碼', question: '常見訊息，能用更短暗號？',
    title: '四種天氣，怎麼用最少的 0 和 1 傳消息？',
    intro: '傳訊息像寫暗號。若四種天氣一樣常見，每種用兩個位元很自然。若幾乎天天晴，把晴天寫短一點、少見天氣寫長一點，平均就能省空間。「熵」計算這個來源平均帶來多少新消息。',
    scene: '四符號來源與 Huffman 前綴編碼', chart: '機率柱旁列出即時計算的 Huffman 暗號；下方比較熵、平均碼長、固定兩位元。',
    caption: '晴的機率由你決定，其餘三種天氣平分剩餘機率。每則訊息只含一個天氣符號。',
    controls: [['sun', '晴天訊息的比例', 25, 95, 1, 70, '%']],
    try: '把晴天比例從 25% 增加到 95%。為什麼平均碼長會下降，但不一定等於熵？',
    resultLabel: '來源熵 H（平均資訊量）', takeaway: '越容易猜中的來源，平均帶來的新資訊越少，也通常越容易壓縮。',
    application: '無損壓縮把常見符號配給短碼；熵提供理想平均碼長的下界。',
    tech: [['🗜️', '無損壓縮', 'Huffman 編碼用前綴碼避免解讀暗號時產生歧義。'], ['📨', '資料傳輸', '估計來源資訊量，安排儲存和傳送資源。']],
    teach: { grade: '國小高年級可探索；大學資訊理論', connect: '常見字用短簡寫，少見字用長簡寫，但不能讓人讀混。', activity: '寫下 10 張天氣卡，用固定碼和畫面上的前綴碼各傳一次，比較總位元數。', ask: ['四種一樣常見時，哪一種值得特別短？', '為什麼不能把暗號都寫成 0？'], myth: '熵不是單一符號必須使用的整數位元數。它是來源的平均資訊量；单符號前綴碼的平均長度通常略大於熵。' },
    formula: 'H(P) = −Σ pᵢ log₂pᵢ；L = Σ pᵢℓᵢ；H(P) ≤ L_Huffman &lt; H(P)+1',
    formal: 'ℓᵢ 是符號碼長。對已知分布的有限離散無記憶來源，二元前綴碼有上述單符號平均長度界。Huffman 每次合併兩個最低機率節點，得到最短平均長度的前綴碼；並列機率可能產生不同但等長的最優碼。分塊編碼可更接近每符號熵。0 log 0 定義為 0；本例所有機率皆正。',
    quiz: [{ question: '四種天氣各 25%，熵是多少？', options: ['0 位元', '2 位元', '4 位元'], answer: 1, why: '每個符號的資訊量是 −log₂(1/4)=2，平均也就是 2。' }, { question: '前綴碼為什麼容易解讀？', options: ['任何一個完整碼都不是另一個碼的開頭', '所有碼都一樣', '完全不用知道編碼表'], answer: 0, why: '讀到一個完整碼就能確定符號，不會和更長碼的開頭混淆。' }],
    related: ['kl', 'crossentropy', 'distributions'],
    draw(k, v) {
      const probs = [v.sun / 100, ...Array(3).fill((1 - v.sun / 100) / 3)], names = ['晴', '陰', '雨', '雪'], codes = Array(4).fill('');
      const queue = probs.map((p, i) => ({ p, ids: [i], order: i })); let order = 4;
      while (queue.length > 1) { queue.sort((a, b) => a.p - b.p || a.order - b.order); const a = queue.shift(), b = queue.shift(); a.ids.forEach(i => { codes[i] = '0' + codes[i]; }); b.ids.forEach(i => { codes[i] = '1' + codes[i]; }); queue.push({ p: a.p + b.p, ids: [...a.ids, ...b.ids], order: order++ }); }
      const h = -probs.reduce((s, p) => s + p * Math.log2(p), 0), length = probs.reduce((s, p, i) => s + p * codes[i].length, 0);
      heading(k, '讓常見的消息使用較短的暗號');
      probs.forEach((p, i) => { const y = 75 + i * 46; k.text(34, y + 17, names[i], { fill: k.C.ink }); k.rect(75, y, p * 330, 26, i === 0 ? k.C.yellow : k.C.blue, { rx: 3 }); k.text(422, y + 17, `${pct(p)}　碼 ${codes[i]}`, { fill: k.C.ink, 'font-size': 12 }); });
      const rows = [[278, h, '熵 H', k.C.green], [309, length, 'Huffman 平均', k.C.coral], [340, 2, '固定碼平均', k.C.gray]];
      rows.forEach(([y, value, label, color]) => { k.text(34, y, label, { 'font-size': 12 }); k.rect(145, y - 15, value * 160, 20, color, { rx: 3 }); k.text(160 + value * 160, y, MP.fmt(value, 3), { 'font-size': 12 }); });
      note(k, `平均每則 ${MP.fmt(length, 3)} 位元，比固定碼節省 ${pct(1 - length / 2)}`, '每個完整碼都不是其他碼的開頭，連在一起也能逐一讀出。');
      return { result: `${MP.fmt(h, 3)} 位元／符號`, detail: `Huffman 平均碼長 ${MP.fmt(length, 3)}，介於 H=${MP.fmt(h, 3)} 與 H+1=${MP.fmt(h + 1, 3)} 之間。熵是理想平均下界，不能直接把小數碼長當成每個符號的實際碼。` };
    }
  }), make({
    id: 'kl', symbol: '↔', name: 'KL 散度', question: '猜錯機率，平均多付多少代價？',
    title: '用錯天氣機率表，消息會多難猜？',
    intro: '真實天氣像一本機率表 P，你心中另有一本猜測表 Q。若常常出現的事被你猜得很少見，每次遇到就特別意外。KL 散度計算：拿 Q 代替 P 時，平均多出的理想資訊代價。交換兩本表，答案通常不同。',
    scene: '兩種天氣的真實分布、猜測分布與方向差異', chart: '橘色是真實 P，藍色是猜測 Q；同時算出兩個方向的 KL，單位是位元。',
    caption: '天氣只分晴與雨。當 Q 把 P 可能發生的事件設成 0，P 對 Q 的 KL 為無限大。',
    controls: [['p', '真實晴天比例 P', 0, 100, 1, 80, '%'], ['q', '猜測晴天比例 Q', 0, 100, 1, 50, '%']],
    try: '先讓兩個比例一樣；再交換 80% 與 50%。最後把 Q 調到 0%，看「絕不可能」的猜測有什麼後果。',
    resultLabel: 'D_KL(P∥Q)', takeaway: 'KL 比較分布，但有方向、可能無限大，不能當成一般幾何距離。',
    application: '機率模型訓練、分布比較與變分推論會使用 KL 或密切相關的交叉熵。',
    tech: [['🧠', '模型學習', '固定資料分布時，降低交叉熵也會降低對應 KL。'], ['📦', '機率編碼', '用錯來源模型，會增加理想平均資訊成本。']],
    teach: { grade: '國小高年級可探索；大學資訊理論', connect: '每種結果的意外程度是 −log₂(猜測機率)，再用真實出現比例算平均。', activity: '各組寫一份晴雨猜測表，用相同天氣卡計分，猜得越離譜的事件扣分越多。', ask: ['兩個方向為什麼要用不同的平均權重？', '把真的會發生的事件猜成絕不可能，有何問題？'], myth: 'KL 不對稱、也不滿足一般距離的三角不等式。P 有正機率但 Q 為零時，不能用一個有限大數悄悄代替無限大。' },
    formula: 'D_KL(P∥Q)=Σ pᵢ log₂(pᵢ/qᵢ)=H(P,Q)−H(P) ≥ 0',
    formal: '以 P 作平均權重。pᵢ=0 的項定義為 0，即使 qᵢ=0 也不貢獻；若 pᵢ>0 且 qᵢ=0，KL 為 +∞。有限離散分布中，KL=0 當且僅當 P=Q。反向 KL 改以 Q 為權重，故通常不同。H(P,Q) 是理想交叉熵成本，未把整數碼長的額外成本算入。',
    quiz: [{ question: 'P=Q 時 KL 是多少？', options: ['0', '1', '無限大'], answer: 0, why: '每個有正機率的項都是 p log₂(1)=0。' }, { question: 'P(雨)>0，而 Q(雨)=0 時，D_KL(P∥Q)？', options: ['忽略雨就好', '必定為 0', '為無限大'], answer: 2, why: 'Q 把真實可能的事件視為不可能，該事件的對數資訊代價無限大。' }],
    related: ['entropy', 'crossentropy', 'bayes'],
    draw(k, v) {
      const p = v.p / 100, q = v.q / 100;
      const divergence = (a, b) => [a, 1 - a].reduce((s, x, i) => { const y = i === 0 ? b : 1 - b; return x === 0 ? s : y === 0 ? Infinity : s + x * Math.log2(x / y); }, 0);
      const forward = divergence(p, q), reverse = divergence(q, p), format = x => Number.isFinite(x) ? MP.fmt(Math.max(0, x), 4) : '∞';
      heading(k, '用誰當真實分布，決定誰來當平均的權重');
      [[90, '真實 P', p, k.C.coral], [170, '猜測 Q', q, k.C.blue]].forEach(([y, label, s, color]) => {
        k.text(34, y - 15, `${label}：晴 ${pct(s)}，雨 ${pct(1 - s)}`, { fill: color });
        k.rect(34, y, 532 * s, 35, color, { rx: 3 }); k.rect(34 + 532 * s, y, 532 * (1 - s), 35, k.C.graySoft, { rx: 3 });
      });
      k.box(34, 252, 255, 89, { fill: k.C.coralSoft, title: '以 P 為真實：D(P∥Q)' });
      k.box(310, 252, 255, 89, { fill: k.C.blueSoft, title: '以 Q 為真實：D(Q∥P)' });
      k.text(161, 311, `${format(forward)} 位元`, { 'text-anchor': 'middle', fill: k.C.coral, 'font-size': 24 });
      k.text(437, 311, `${format(reverse)} 位元`, { 'text-anchor': 'middle', fill: k.C.blue, 'font-size': 24 });
      note(k, !Number.isFinite(forward) ? 'Q 把 P 可能發生的事情設為 0：正向代價無限大。' : `用 Q 猜 P 的結果，每則理想代價多出 ${format(forward)} 位元。`, '灰色部分表示雨；正向和反向使用不同權重，通常不相等。');
      return { result: `${format(forward)} 位元`, detail: `反向 D_KL(Q∥P)=${format(reverse)} 位元。${p === q ? '兩個分布一致，兩個方向都是零。' : '交換來源和猜測會改變問題，這不是對稱距離。'} 零機率項依支撐條件處理。` };
    }
  }), make({
    id: 'regression', symbol: '📈', name: '迴歸與正則化', question: '怎麼學趨勢，又不追著雜訊跑？',
    title: '積木小車：用幾次實驗預測下一次',
    intro: '坡道越高，小車大致滑得越遠，但每次推車都會有一點差別。我們用直線學習大方向。正則化像替斜率加一條橡皮筋：太大的斜率要付出代價。拉太緊又會讓真的趨勢被壓平，所以要用沒拿來訓練的新資料檢查。',
    scene: '帶雜訊的線性迴歸與 ridge 正則化', chart: '橘點是 9 筆訓練資料，藍圈是 15 筆新資料；橘線為擬合，綠虛線是造資料的真趨勢。',
    caption: '為方便計算，坡高與距離都以中心化的相對單位表示。真實關係為 y=2+0.8x，雜訊為獨立常態。',
    controls: [['noise', '實驗雜訊標準差', 0, 3, 0.1, 1.8, ''], ['lambda', '橡皮筋強度 λ', 0, 150, 1, 10, '']],
    try: '先把雜訊設為 0，看看加強正則化會犧牲什麼；再加入雜訊，比較訓練誤差與新資料誤差。',
    resultLabel: '新資料的平均平方誤差', takeaway: '學得很貼近舊資料，未必猜得準新資料；正則化用一點偏差換取較穩定的估計。',
    application: '預測模型需要分開訓練與評估；λ 可用驗證資料選擇，最終測試資料留到最後。',
    tech: [['📊', '預測模型', '用保留資料評估泛化，而非只看訓練分數。'], ['🧠', 'AI 權重衰減', '平方權重懲罰鼓勵較小參數；實際訓練形式依演算法而異。']],
    teach: { grade: '國小高年級可探索；大學統計與最佳化', connect: '先找最接近一群點的直線，再理解「太用力解釋偶然偏差」的風險。', activity: '把量到的小車距離分成練習卡和考試卡，先只看練習卡畫線，再用考試卡計分。', ask: ['完全沒有雜訊時，把斜率壓小有何代價？', '一直看考試答案來調 λ，還算公平的最後考試嗎？'], myth: '正則化不保證每批新資料的誤差都更小。它調整偏差與變異的取捨；過強會欠擬合。相關趨勢也不直接證明因果。' },
    formula: 'minₐ,ᵦ Σ(yᵢ−a−bxᵢ)² + λb²；因 Σxᵢ=0，â=ȳ，b̂=Σxᵢ(yᵢ−ȳ)/(Σxᵢ²+λ)',
    formal: '使用總平方誤差加 λb²，而非平均平方誤差，因此 λ 的尺度依本式定義。截距 a 不受懲罰；訓練 x 已中心化。λ=0 為最小平方法；λ 增加會把斜率往 0 縮。本例固定兩組可重現、互相獨立的標準常態亂數，再乘雜訊大小。新資料誤差是有限批次的估計，不保證單調或代表所有未來樣本；反覆據此選 λ 後，應另取最終測試集。',
    quiz: [{ question: '為何還要保留沒參加訓練的新資料？', options: ['估計模型對新例子的表現', '確保训练分數一定最高', '讓資料點變少才好看'], answer: 0, why: '訓練表現可能樂觀，新資料才有助檢查是否學到了可延伸的趨勢。' }, { question: 'λ 很大時，本例的斜率會？', options: ['無限變大', '往 0 縮，可能連真趨勢也壓掉', '一定等於 0.8'], answer: 1, why: '懲罰 b² 鼓勵小斜率，過強會增加偏差。' }],
    related: ['gradient', 'projection', 'confidence'],
    draw(k, v) {
      const r1 = MP.rng(937), r2 = MP.rng(1289);
      const train = Array.from({ length: 9 }, (_, i) => { const x = (i - 4) * 0.75; return [x, 2 + 0.8 * x + v.noise * normal(r1)]; });
      const test = Array.from({ length: 15 }, (_, i) => { const x = (i - 7) * 0.4; return [x, 2 + 0.8 * x + v.noise * normal(r2)]; });
      const intercept = train.reduce((s, p) => s + p[1], 0) / train.length;
      const slope = train.reduce((s, [x, y]) => s + x * (y - intercept), 0) / (train.reduce((s, [x]) => s + x * x, 0) + v.lambda);
      const predict = x => intercept + slope * x;
      const mse = points => points.reduce((s, [x, y]) => s + (y - predict(x)) ** 2, 0) / points.length;
      heading(k, `擬合：y = ${MP.fmt(intercept)} + ${MP.fmt(slope)}x`);
      const allY = [...train, ...test].map(p => p[1]);
      const ymin = Math.floor(Math.min(-1, ...allY, predict(-3), predict(3))) - 1, ymax = Math.ceil(Math.max(5, ...allY, predict(-3), predict(3))) + 1;
      const g = k.plot({ xmin: -3.5, xmax: 3.5, ymin, ymax, top: 75, height: 230, xlabel: '相對坡道高度 x', ylabel: '相對滑行距離 y', xticks: 4, yticks: 4 });
      k.curve(g, x => 2 + 0.8 * x, k.C.green, { 'stroke-dasharray': '6 4', 'stroke-width': 2 }, -3.2, 3.2);
      k.curve(g, predict, k.C.coral, {}, -3.2, 3.2);
      test.forEach(([x, y]) => k.circle(g.x(x), g.y(y), 4.5, '#fff', { stroke: k.C.blue, 'stroke-width': 2 }));
      train.forEach(([x, y]) => k.dot(g, x, y, k.C.coral, 4.5));
      note(k, `訓練 MSE ${MP.fmt(mse(train), 3)}；新資料 MSE ${MP.fmt(mse(test), 3)}`, '橡皮筋拉得越緊，斜率越小；新資料誤差不保證一路下降。');
      return { result: MP.fmt(mse(test), 3), detail: `λ=${v.lambda} 時斜率 ${MP.fmt(slope, 3)}（真值 0.8），截距 ${MP.fmt(intercept, 3)}（真值 2）。訓練 MSE=${MP.fmt(mse(train), 3)}；新資料 MSE=${MP.fmt(mse(test), 3)}。這些誤差由畫面上的點實際計算。` };
    }
  }));
})();
