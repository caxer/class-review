// 大學微積分、分析與數值方法：每個模型的假設都放在 formal。
// 延伸教材（圖像與說明為本專案重新設計）：
// https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/
// https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/
// https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
(() => {
  const TAU = 2 * Math.PI;
  const samples = (a, b, n, fn) => Array.from({ length: n + 1 }, (_, i) => fn(a + (b - a) * i / n));
  const panel = (k, y, title, line1, line2) => {
    k.box(22, y, 556, 76, { fill: k.C.blueSoft, title });
    k.text(34, y + 41, line1, { fill: k.C.ink, 'font-size': 13 });
    k.text(34, y + 62, line2, { 'font-size': 12 });
  };
  const teach = (connect, activity, ask, myth) => ({ grade: '大學概念・國小高年級可跟著玩', connect, activity, ask, myth });
  MP.register(
    {
      id: 'complex', track: 'signals', symbol: 'eⁱθ', name: '複數旋轉與歐拉公式', question: '旋轉的箭頭，怎麼唱出一個音？',
      title: '把旋轉箭頭的影子，排成一首波浪歌',
      intro: '想像一支不停轉圈的時鐘指針。只記下它的尖端有多高，再把每一刻排成一條線，就會得到平滑的波浪。複數讓我們用一個數，同時記住左右和上下；歐拉公式把「轉圈」和「波浪」接在一起。傅立葉分析再用很多支轉速不同的箭頭，拆解複雜聲音。',
      scene: '旋轉複數與它的上下影子', viewH: 450,
      chart: '上：複數平面與目前相位　下：一秒內的虛部（上下影子）',
      caption: '箭頭長度固定為 1；頻率 f 表示每秒轉幾圈。改相位只改起跑角度。',
      controls: [['t', '觀察時刻', 0, 1, 0.01, 0.2, '秒'], ['f', '轉動頻率', 1, 4, 1, 1, 'Hz'], ['phase', '起跑角度', 0, 360, 15, 0, '°']], play: 't',
      try: '先按播放，追蹤箭頭尖端與波浪上的紅點。再把頻率加倍，數一秒內出現幾個波峰。',
      resultLabel: '目前的複數位置', takeaway: 'e 的虛數次方可以表示旋轉；它的兩個影子正是 cos 和 sin。',
      application: '用旋轉向量描述頻率和相位，可以把聲音、交流電與通訊訊號寫成相同的數學語言。',
      tech: [['🎧', '音訊頻譜', '傅立葉分析測量訊號與不同轉速複數波的配合程度。'], ['📡', '數位通訊', 'I/Q 訊號用兩個互相垂直的分量記錄振幅和相位。'], ['⚡', '交流電', '相量把同頻率的電壓、電流表示成旋轉向量。']],
      teach: teach('先知道水平與垂直兩個方向，就能把複數看成一支箭頭。', '在紙盤畫一支指針，每轉 30 度記下尖端高度，把高度依序畫在方格紙。', ['轉快兩倍，波浪哪裡改變？', '起跑位置不同，箭頭長度有變嗎？'], 'i 不是一條額外的神祕距離；這裡它表示與實軸垂直的方向。頻率與振幅是不同的量。'),
      formula: 'e<sup>iθ</sup> = cos θ + i sin θ；z(t) = e<sup>i(2πft+φ)</sup>；c<sub>n</sub> = (1/T)∫<sub>0</sub><sup>T</sup> x(t)e<sup>−i2πnt/T</sup>dt',
      formal: 'θ 與 φ 在公式中用弧度。本例 |z| = 1，角速度為 2πf。最後一式是週期 T 訊號的複數傅立葉係數：乘上反向旋轉的波再取平均，可以分離各個頻率。對平方可積週期訊號，傅立葉級數在均方意義下逼近訊號；不能一概保證每點都精確相等。',
      quiz: [{ question: '頻率由 1 Hz 改為 2 Hz，一秒內會怎樣？', options: ['箭頭變兩倍長', '箭頭轉兩圈', '波浪消失'], answer: 1, why: 'Hz 就是每秒完成幾個週期。' }, { question: '歐拉公式接起哪兩件事？', options: ['平面旋轉與正弦、餘弦', '機率與平均數', '面積與周長'], answer: 0, why: '旋轉箭頭的水平、垂直分量就是 cos θ、sin θ。' }],
      related: ['fourier', 'transform', 'position', 'wave'],
      draw(k, v) {
        const { C, fmt } = k, phi = v.phase * Math.PI / 180, theta = TAU * v.f * v.t + phi;
        const cx = 145, cy = 116, r = 78, x = Math.cos(theta), y = Math.sin(theta);
        k.circle(cx, cy, r, 'none', { stroke: C.grid, 'stroke-width': 2 });
        k.line(40, cy, 250, cy); k.line(cx, 18, cx, 215);
        k.text(247, 108, '實部', { 'text-anchor': 'end' }); k.text(152, 27, '虛部');
        k.arrow(cx, cy, cx + r * x, cy - r * y, C.coral);
        k.line(cx + r * x, cy - r * y, 265, cy - r * y, C.blue, { 'stroke-dasharray': '4 4' });
        k.circle(cx + r * x, cy - r * y, 5, C.coral);
        k.text(290, 68, `水平影子 cos θ = ${fmt(x)}`, { fill: C.ink });
        k.text(290, 97, `上下影子 sin θ = ${fmt(y)}`, { fill: C.blue });
        k.text(290, 134, `每秒 ${v.f} 圈｜起跑 ${v.phase}°`);
        k.text(290, 163, `箭頭長度 |z| = ${fmt(Math.hypot(x, y))}`);
        const p = k.plot({ xmin: 0, xmax: 1, ymin: -1.2, ymax: 1.2, left: 65, width: 480, top: 255, height: 140, xlabel: '時間（秒）', ylabel: '上下影子 sin(2πft + φ)', yticks: 4 });
        k.curve(p, t => Math.sin(TAU * v.f * t + phi), C.blue);
        k.line(p.x(v.t), p.top, p.x(v.t), p.bottom, C.coral, { 'stroke-dasharray': '4 4' }); k.dot(p, v.t, y);
        return { result: `${fmt(x)} ${y < 0 ? '−' : '＋'} ${fmt(Math.abs(y))}i`, detail: `t = ${fmt(v.t)} 秒，總角度 ${fmt(theta * 180 / Math.PI, 1)}°。旋轉只改方向，長度仍為 1；波浪的週期為 ${fmt(1 / v.f)} 秒。` };
      }
    },
    {
      id: 'partial', track: 'calculus', symbol: '∂', name: '偏導數與方向導數', question: '同一座山，朝哪走最陡？',
      title: '你在山坡上，轉個方向就有不同的坡度',
      intro: '同一個地方，往東可能很陡，往北卻很平。偏導數像是先只試東西方向、再只試南北方向；方向導數則讓你試任意方向。把兩個偏導數放在同一支箭頭上，就得到指向最陡上坡的梯度。',
      scene: '橢圓山谷的等高線與方向試走', viewH: 450,
      chart: '上：等高線、所在位置與行走方向　下：沿此方向的高度剖面',
      caption: '模型高度 h(x,y) = x² + 2y²；方向用單位向量，因此坡度是每走一單位距離的高度變化。',
      controls: [['x', '東西位置 x', -1, 1, 0.1, 0.6, ''], ['y', '南北位置 y', -1, 1, 0.1, 0.5, ''], ['angle', '行走方向', 0, 360, 15, 45, '°']],
      try: '把方向轉一圈，找到上坡最快和下坡最快的角度。再移到谷底 (0,0)，觀察所有瞬間坡度。',
      resultLabel: '這個方向的瞬間坡度', takeaway: '方向導數是梯度在行走方向上的投影；梯度指向最陡上坡。',
      application: '地形導航和 AI 訓練都需要知道：往哪個方向改變，結果增加或減少得最快。',
      tech: [['⛰️', '地形分析', '由高度資料估計坡度與坡向。'], ['🤖', '模型訓練', '負梯度提供局部降低損失的方向。'], ['💡', '電腦繪圖', '曲面偏導數用來求法向量與表面光照。']],
      teach: teach('把「走一小步會升高多少」當作坡度，不用先背符號。', '將紙板斜放，拿玩具車試著朝不同方向走，找最陡方向與等高方向。', ['往最陡方向的反方向走會怎樣？', '谷底的坡度是零，代表整座山都是平的嗎？'], '偏導數只改一個座標；方向導數要指定方向。坡度為零只描述當下的一階變化。'),
      formula: '∇h = (∂h/∂x, ∂h/∂y) = (2x, 4y)；D<sub>u</sub>h = ∇h · u，u = (cos θ, sin θ)',
      formal: '對可微函數 h，單位方向 u 的方向導數為 lim<sub>s→0</sub>[h(p+su)−h(p)]/s。本例沿路高度為 h(p)+s(∇h·u)+s²(cos²θ+2sin²θ)。因此局部直線估計的誤差是二次項。非零梯度的方向達到最大方向導數 ||∇h||；僅有偏導數存在，並不足以保證函數可微。',
      quiz: [{ question: '哪個方向上坡最快？', options: ['與梯度垂直', '梯度方向', '負梯度方向'], answer: 1, why: '單位方向與梯度同向時，內積最大。' }, { question: '在這個山谷的谷底，瞬間坡度都是零，代表什麼？', options: ['附近高度永遠不變', '沒有這座山', '一階變化為零，走遠仍會升高'], answer: 2, why: '谷底的高度從二次項開始增加。' }], related: ['derivative', 'gradient', 'lagrange', 'vectorfield'],
      draw(k, v) {
        const { C, fmt } = k, a = v.angle * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), d = 2 * v.x * ux + 4 * v.y * uy, h = v.x * v.x + 2 * v.y * v.y;
        const cx = 148, cy = 118, s = 69;
        for (const r of [0.4, 0.8, 1.2, 1.6]) k.el('ellipse', { cx, cy, rx: r * s, ry: r * s / Math.SQRT2, fill: 'none', stroke: C.green, opacity: 0.5 });
        k.line(27, cy, 270, cy, C.grid); k.line(cx, 14, cx, 222, C.grid);
        const px = cx + v.x * s, py = cy - v.y * s;
        k.arrow(px, py, px + 38 * ux, py - 38 * uy, C.coral);
        k.arrow(px, py, px + 12 * 2 * v.x, py - 12 * 4 * v.y, C.blue);
        k.circle(px, py, 5, C.ink);
        k.text(292, 48, '紅箭頭：你的方向', { fill: C.coral }); k.text(292, 73, '藍箭頭：最陡上坡', { fill: C.blue });
        k.text(292, 108, `東西坡度 ∂h/∂x = ${fmt(2 * v.x)}`);
        k.text(292, 134, `南北坡度 ∂h/∂y = ${fmt(4 * v.y)}`);
        k.text(292, 169, `沿紅箭頭的坡度 = ${fmt(d)}`, { fill: C.ink });
        k.text(292, 196, d > 0.001 ? '現在朝上坡走' : d < -0.001 ? '現在朝下坡走' : '當下的一階變化為零');
        const f = t => (v.x + t * ux) ** 2 + 2 * (v.y + t * uy) ** 2;
        const p = k.plot({ xmin: -0.5, xmax: 0.5, ymin: -1, ymax: 6, left: 65, width: 480, top: 260, height: 135, ylabel: '沿路高度（綠）與局部直線估計（紅）', xlabel: '沿選定方向走的距離 s', yticks: 2 });
        k.curve(p, f, C.green); k.curve(p, t => h + d * t, C.coral, { 'stroke-dasharray': '5 4' }); k.dot(p, 0, h, C.ink);
        return { result: fmt(d, 3), detail: `目前高度 ${fmt(h)}。每走很小的一步 ε，高度約改變 ${fmt(d)} × ε。走 0.1 單位時，直線估計少算 ${fmt(0.01 * (ux * ux + 2 * uy * uy), 4)}。` };
      }
    },
    {
      id: 'lagrange', track: 'optimization', symbol: 'λ', name: '拉格朗日乘數', question: '只能沿圍欄走，怎樣找到最高處？',
      title: '最高處很想去，可是你得留在圓形步道上',
      intro: '公園的地面朝某個方向升高，但你只能沿圓形步道走。最好的位置不是隨便朝上坡衝，而是在允許的路線上找到最高點。到那裡時，朝步道前後走都不會立刻更高；山坡的梯度和圍欄的法線會排成同一條線。',
      scene: '圓形步道上的限制最佳化', viewH: 450, chart: '左上：步道與高度等高線　下：繞一圈各位置的高度',
      caption: '高度 f = ax + y，限制 x² + y² = R²；示範光滑等式限制與非零限制梯度。',
      controls: [['a', '東向坡度 a', 0.5, 2, 0.1, 1, ''], ['r', '步道半徑 R', 0.5, 1.5, 0.1, 1, ''], ['angle', '你在步道上的角度', 0, 360, 5, 20, '°']],
      try: '把你的位置移到綠色最高點，觀察高度曲線變平。改半徑，看看最高高度如何改變。',
      resultLabel: '目前高度 / 可達最高高度', takeaway: '有限制時，最佳方向得配合可走的路；極值點的兩個梯度可能互相平行。',
      application: '預算、材料或能量有限時，最佳化要把限制一起計算。',
      tech: [['📦', '產品設計', '固定材料用量時，尋找更大的容量或更高的強度。'], ['⚙️', '機械設計', '零件必須符合幾何限制，再尋找能量的極值。']],
      teach: teach('沿著畫好的圓走，試試哪裡最高。', '把圓圈畫在斜紙板上，用小棋子沿圓移動，找到最高點和最低點。', ['最高點可以隨便離開步道嗎？', '梯度平行時，一定是最高點嗎？'], '梯度平行是候選極值條件；最低點也可能符合，還必須比較高度。'),
      formula: '∇f = λ∇g，g(x,y)=x²+y²−R²=0；(x*,y*) = R(a,1)/√(a²+1)；f<sub>max</sub> = R√(a²+1)',
      formal: 'f、g 可微且限制曲線上的 ∇g ≠ 0 時，局部極值滿足拉格朗日條件。本例 ∇f=(a,1)，∇g=(2x,2y)，最大點 λ=√(a²+1)/(2R)，相反位置是最小點。參數 θ 沿圈的高度導數為 R(−a sin θ + cos θ)。限制梯度為零或存在不等式限制時，需要另作判斷。',
      quiz: [{ question: '在限制下找最高處，能做什麼？', options: ['直接走離步道', '只比較允許位置的高度', '忽略高度'], answer: 1, why: '限制定義了可以選擇的位置。' }, { question: '兩個梯度平行，就保證最高嗎？', options: ['是，永遠如此', '只有半徑等於一才是', '不，最低點也可能符合'], answer: 2, why: '條件幫忙找候選點，還要比較或進一步判斷。' }], related: ['partial', 'gradient', 'projection'],
      draw(k, v) {
        const { C, fmt } = k, a = v.angle * Math.PI / 180, norm = Math.hypot(v.a, 1), x = v.r * Math.cos(a), y = v.r * Math.sin(a), best = v.r * norm, now = v.a * x + y;
        const cx = 146, cy = 123, s = 61, X = x => cx + x * s, Y = y => cy - y * s;
        const g = k.sub(k.clip(25, 12, 242, 224));
        for (let h = -4; h <= 4; h += 0.5) g.line(X(-2), Y(h + 2 * v.a), X(2), Y(h - 2 * v.a), C.grid);
        k.circle(cx, cy, v.r * s, 'none', { stroke: C.blue, 'stroke-width': 3 });
        k.circle(X(x), Y(y), 6, C.coral); k.circle(X(v.r * v.a / norm), Y(v.r / norm), 7, C.green);
        k.arrow(X(x), Y(y), X(x) + 22 * v.a, Y(y) - 22, C.coral);
        k.text(290, 48, '藍圈：可以走的路', { fill: C.blue }); k.text(290, 76, '綠點：最高位置', { fill: C.green });
        k.text(290, 112, `你的位置 (${fmt(x)}, ${fmt(y)})`); k.text(290, 140, `沿路高度變化率 ${fmt(v.r * (-v.a * Math.sin(a) + Math.cos(a)))}`);
        k.text(290, 178, `離最高高度還差 ${fmt(best - now)}`, { fill: C.ink });
        const p = k.plot({ xmin: 0, xmax: 360, ymin: -3.5, ymax: 3.5, left: 65, width: 480, top: 271, height: 125, xlabel: '在步道上的角度（度）', ylabel: '高度', xticks: 4, yticks: 2 });
        k.curve(p, t => v.r * (v.a * Math.cos(t * Math.PI / 180) + Math.sin(t * Math.PI / 180)), C.blue); k.dot(p, v.angle, now);
        k.dot(p, Math.atan2(1, v.a) * 180 / Math.PI, best, C.green);
        return { result: `${fmt(now)} / ${fmt(best)}`, detail: `最高點 (${fmt(v.r * v.a / norm)}, ${fmt(v.r / norm)})。最高點與最低點都滿足梯度平行；比較高度後才選最高點。` };
      }
    },
    {
      id: 'numerical-ode', track: 'numerical', symbol: 'Δt', name: '微分方程的數值解', question: '只知道現在變多快，怎麼猜下一刻？',
      title: '讓電腦用小步走出一杯可可的冷卻曲線',
      intro: '每一刻，可可降溫的速度都會變。電腦可以先假裝「這一小段時間內，速度不變」，走一小步，再重新量速度。這是歐拉法。步子太大會偏離真正路線，甚至算出比室溫更冷的可可；縮小步子才能看清誤差。',
      scene: '同一杯可可：精確解與歐拉法比較', viewH: 450, chart: '紅線：精確解　藍點與折線：歐拉近似，每點是一個計算步驟',
      caption: '環境 25°C、起始 85°C、冷卻率 k 固定，模型 T′ = −k(T−25)。',
      controls: [['n', '十分鐘切成', 2, 40, 1, 10, '步'], ['rate', '冷卻率 k', 0.1, 0.4, 0.05, 0.2, '/分']],
      try: '先只切 2 步，再切 20 步，比較終點誤差。把 k 調到 0.4，再切 2 步，觀察不衰減的來回跳動。',
      resultLabel: '十分鐘後的近似溫度', takeaway: '數值解靠局部規則一步步前進；精度與穩定性都跟步長有關。',
      application: '許多微分方程沒有好寫的公式，電腦用數值方法計算天氣、機械和電路。',
      tech: [['🌦️', '科學模擬', '由當下變化率推進時間，計算複雜系統。'], ['🎮', '遊戲物理', '用離散時間步更新物體的位置與速度。'], ['🔌', '電路模擬', '數值積分描述電容電壓與電感電流的變化。']],
      teach: teach('知道現在速度，就能用「速度 × 很短時間」猜變化量。', '在印好的斜率方向圖上，分別用長尺段和短尺段接路線，比較誰更貼近曲線。', ['步子太大時，哪個假設不準？', '多算幾步一定代表電腦算錯嗎？'], '精確解是這個理想模型的精確答案，不代表真實可可一定完全符合模型。'),
      formula: 'T<sub>j+1</sub> = T<sub>j</sub> − hk(T<sub>j</sub>−25)；h=10/n；T(t)=25+60e<sup>−kt</sup>',
      formal: '前向歐拉法 y<sub>j+1</sub>=y<sub>j</sub>+hf(t<sub>j</sub>,y<sub>j</sub>) 在足夠光滑且滿足合適 Lipschitz 條件的固定時間區間上，全域誤差通常為 O(h)。本線性模型的溫差每步乘以 1−hk；衰減穩定要求 |1−hk|<1，即 0<hk<2。hk≤1 時不會交替越過室溫；hk=2 時誤差不衰減。',
      quiz: [{ question: '歐拉法每一步使用哪個速度？', options: ['當下的變化率', '未來所有時刻的平均', '固定為零'], answer: 0, why: '用當下斜率作短時間直線預測。' }, { question: '藍線跳到室溫以下，最合理的解讀？', options: ['可可真的會自己結冰', '步長可能太大，數值近似失真', '室溫一定量錯'], answer: 1, why: '此冷卻模型的精確解不會越過室溫，這是離散近似的現象。' }], related: ['ode', 'derivative', 'roots', 'convergence'],
      draw(k, v) {
        const { C, fmt } = k, h = 10 / v.n, factor = 1 - h * v.rate, pts = [];
        let temp = 85; pts.push([0, temp]); for (let j = 1; j <= v.n; j++) { temp -= h * v.rate * (temp - 25); pts.push([j * h, temp]); }
        const exact = 25 + 60 * Math.exp(-10 * v.rate), min = Math.min(20, ...pts.map(p => p[1])) - 5;
        const p = k.plot({ xmin: 0, xmax: 10, ymin: min, ymax: 90, left: 65, width: 480, top: 40, height: 235, xlabel: '時間（分）', ylabel: '溫度（°C）', yticks: 4, xticks: 5 });
        k.line(p.x(0), p.y(25), p.x(10), p.y(25), C.gray, { 'stroke-dasharray': '4 4' });
        k.curve(p, t => 25 + 60 * Math.exp(-v.rate * t), C.coral);
        k.polyline(pts.map(([t, y]) => [p.x(t), p.y(y)]), C.blue, { 'stroke-width': 2 });
        pts.forEach(([t, y]) => k.dot(p, t, y, C.blue, 3));
        panel(k, 342, `每一步 ${fmt(h)} 分鐘｜溫差倍率 1−hk = ${fmt(factor)}`, `精確：${fmt(exact, 3)}°C　近似：${fmt(temp, 3)}°C　誤差：${fmt(Math.abs(temp - exact), 3)}°C`, Math.abs(factor) >= 1 ? '穩定性邊界：溫差來回跳動，而且不會縮小。' : factor < 0 ? '仍會衰減，但近似溫度會來回越過室溫。' : '每一步都朝室溫靠近；縮小步長再檢查精度。');
        return { result: `${fmt(temp, 3)} °C`, detail: `精確值 ${fmt(exact, 3)} °C，絕對誤差 ${fmt(Math.abs(temp - exact), 3)} °C。步長 h=${fmt(h)}，hk=${fmt(h * v.rate)}。` };
      }
    },
    {
      id: 'roots', track: 'numerical', symbol: 'xₙ', name: '牛頓法與二分法', question: '答案藏在曲線哪裡穿過地板？',
      title: '找不到精確答案時，用兩種策略越猜越準',
      intro: '我們想找一個數，讓「它的三次方，加上它自己」等於 2。二分法像猜數字，每次把有答案的區間切半。牛頓法則站在曲線上，沿當下的切線滑到地板，再試一次。你可以比較：誰每次進步大？誰需要更多條件？',
      scene: '同一個方程，兩種求根策略', viewH: 450, chart: '上：函數曲線、牛頓切線與二分區間　下：每次猜測離答案多遠',
      caption: '固定方程 f(x)=x³+x−2，唯一實根為 1。二分初始區間 [0,3]；牛頓起點可調。',
      controls: [['steps', '迭代次數', 0, 8, 1, 2, '次'], ['start', '牛頓法起點', 0, 3, 0.1, 2.6, '']],
      try: '先從 2.6 開始，逐次增加迭代。再從 0 開始，看看牛頓法第一步是否更靠近答案。',
      resultLabel: '兩種方法目前的誤差', takeaway: '二分法靠保留夾住根的區間；牛頓法靠局部切線加速，並非任何起點都成功。',
      application: '方程解、幾何交點、隱式模型和最佳化中的駐點，常需要數值求根。',
      tech: [['📐', '幾何計算', '找曲線與平面的交點。'], ['⚙️', '工程方程', '解無法輕易手算的非線性平衡條件。']],
      teach: teach('先認識猜數字時保留「太大」和「太小」之間的範圍。', '一人想數字，另一人每次猜區間中間；再沿曲線的切線用尺畫下一次猜測。', ['二分法為什麼不能隨便丟掉另一半？', '牛頓法每次都保證更靠近答案嗎？'], '牛頓法在導數為零時不能直接除；也可能跑遠或循環。此頁特意用導數永不為零的例子。'),
      formula: 'x<sub>n+1</sub> = x<sub>n</sub> − f(x<sub>n</sub>)/f′(x<sub>n</sub>)；f(x)=x³+x−2，f′(x)=3x²+1；二分誤差上界 = (b−a)/2',
      formal: '二分法需要 f 連續且區間兩端異號；每次保留異號的那半段，本例 n 次後寬度為 3/2ⁿ，中點誤差最多 3/2ⁿ⁺¹。牛頓法在單根附近且函數足夠光滑時可有二次收斂，但不是全域保證。圖中切線代表從「目前」走到「下一次」的位置；誤差圖包含第 0 次猜測。',
      quiz: [{ question: '二分法每次保留哪半邊？', options: ['較漂亮那半邊', '兩端函数值異號的那半邊', '永遠左半邊'], answer: 1, why: '連續函數兩端異號時，中間必有根。' }, { question: '牛頓法一定比二分法可靠嗎？', options: ['不一定，它受起點和導數影響', '是，永遠一步成功', '只有負數起點才可靠'], answer: 0, why: '牛頓法可以很快，但需要檢查導數、起點與收斂行為。' }], related: ['derivative', 'numerical-ode', 'convergence'],
      draw(k, v) {
        const { C, fmt } = k, f = x => x ** 3 + x - 2, df = x => 3 * x * x + 1;
        let lo = 0, hi = 3, xn = v.start; const errN = [Math.abs(xn - 1)], errB = [0.5];
        for (let j = 0; j < v.steps; j++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; xn -= f(xn) / df(xn); errN.push(Math.abs(xn - 1)); errB.push(Math.abs((lo + hi) / 2 - 1)); }
        const mid = (lo + hi) / 2, next = xn - f(xn) / df(xn);
        const p = k.plot({ xmin: 0, xmax: 3, ymin: -3, ymax: 28, left: 65, width: 480, top: 34, height: 165, xlabel: '猜測 x', ylabel: 'f(x)', xticks: 3, yticks: 2 });
        k.curve(p, f, C.gray); k.line(p.x(lo), p.y(0), p.x(hi), p.y(0), C.blue, { 'stroke-width': 8 });
        k.line(p.x(xn), p.y(f(xn)), p.x(next), p.y(0), C.coral); k.dot(p, xn, f(xn), C.coral, 5); k.dot(p, mid, 0, C.blue, 5);
        const q = k.plot({ xmin: 0, xmax: 8, ymin: -12, ymax: 1, left: 65, width: 480, top: 267, height: 112, xlabel: '迭代次數', ylabel: '誤差的 log₁₀（越低越準）', xticks: 4, yticks: 2 });
        const logerr = a => a.map((e, i) => [q.x(i), q.y(Math.log10(Math.max(1e-12, e)))]);
        k.polyline(logerr(errB), C.blue); k.polyline(logerr(errN), C.coral);
        logerr(errB).forEach(([x, y]) => k.circle(x, y, 3, C.blue)); logerr(errN).forEach(([x, y]) => k.circle(x, y, 3, C.coral));
        k.text(65, 438, '藍：二分　紅：牛頓；小於 10⁻¹² 的誤差顯示在圖底。', { 'font-size': 12 });
        return { result: `二分 ${Math.abs(mid - 1).toExponential(2)}｜牛頓 ${Math.abs(xn - 1).toExponential(2)}`, detail: `二分猜測 ${fmt(mid, 6)}，保證誤差 ≤ ${fmt((hi - lo) / 2, 6)}；牛頓猜測 ${fmt(xn, 6)}。答案 1 用來檢查本次示範，實務上通常事先不知道答案。` };
      }
    },
    {
      id: 'wave', track: 'engineering', symbol: '∂²', name: '波動方程', question: '固定兩端的繩子，可以怎麼跳舞？',
      title: '兩種繩子舞步，疊成一段振動',
      intro: '把繩子兩端綁好，中間仍可以上下振動。有的舞步整條繩子一起拱起，有的舞步分成兩段反著動。每個舞步叫一個模態；把它們加起來，就能做出更複雜的振動。波動方程描述彎曲的繩子會怎樣加速。',
      scene: '固定弦的兩個正常模態疊加', viewH: 450, chart: '上：兩個模態各自的形狀　下：相加後的繩子，兩端固定在零',
      caption: '弦長 L=1，小振幅、均勻張力、無阻尼；時間以相對單位表示。這是駐波疊加，不是單一波包向右跑。',
      controls: [['t', '觀察時間', 0, 4, 0.02, 0.25, ''], ['speed', '波速 c', 0.5, 2, 0.1, 1, ''], ['mix', '第二模態振幅', 0, 0.8, 0.05, 0.4, '']], play: 't',
      try: '先把第二模態設為零，再按播放。加上第二模態後，觀察繩子的中點與兩端，哪些位置一定不動？',
      resultLabel: '現在的兩個模態係數', takeaway: '線性波動方程允許模態相加；邊界條件決定哪些舞步能留在繩子上。',
      application: '樂器弦、聲學空間與振動分析都會分解系統的模態與頻率。',
      tech: [['🎻', '弦樂器', '固定弦的正常模態形成基頻與泛音。'], ['🏗️', '結構振動', '工程師研究結構的模態，避免外力造成過大振動。'], ['🔊', '聲學', '波動方程描述小擾動聲波的傳播。']],
      teach: teach('兩條曲線在相同位置的高度相加，就得到合成高度。', '畫出一個拱形和兩個相反的拱形，在相同位置把高度相加。', ['為什麼兩端始終不動？', '第二模態的振動頻率與第一模態有什麼關係？'], '畫面是固定端的駐波。傳播波、反射波與駐波有關，但不能把每個波峰都當成向右移動的小物體。'),
      formula: 'u<sub>tt</sub>=c²u<sub>xx</sub>；u(0,t)=u(1,t)=0；u(x,t)=sin(πx)cos(πct)+A sin(2πx)cos(2πct)',
      formal: '本解取零初速度，初始形狀為 sin(πx)+A sin(2πx)。第 n 模態的角頻率 ω<sub>n</sub>=nπc/L，頻率 f<sub>n</sub>=nc/(2L)。線性、小振幅、均勻弦且固定兩端時，模態疊加仍是解。無限長弦的行進波可寫 F(x−ct)+G(x+ct)，有限弦還必須符合邊界。此頁未包含阻尼、非線性大變形或不同邊界。',
      quiz: [{ question: '為什麼繩子兩端一直在零？', options: ['固定端邊界要求如此', '時間沒有變', '第二模態消失了'], answer: 0, why: '兩個模態在 x=0、1 都是零，相加也仍為零。' }, { question: '波速加倍，第一模態的頻率？', options: ['不變', '減半', '加倍'], answer: 2, why: 'f₁=c/(2L)，弦長固定時，頻率與波速成正比。' }], related: ['fourier', 'heat', 'complex', 'ode'],
      draw(k, v) {
        const { C, fmt } = k, b1 = Math.cos(Math.PI * v.speed * v.t), b2 = v.mix * Math.cos(TAU * v.speed * v.t);
        const f1 = x => Math.sin(Math.PI * x) * b1, f2 = x => Math.sin(TAU * x) * b2;
        const p = k.plot({ xmin: 0, xmax: 1, ymin: -1.2, ymax: 1.2, left: 65, width: 480, top: 35, height: 120, ylabel: '藍：第一模態　黃：第二模態', xlabel: '繩上的位置', yticks: 2 });
        k.curve(p, f1, C.blue); k.curve(p, f2, C.yellow);
        const q = k.plot({ xmin: 0, xmax: 1, ymin: -1.9, ymax: 1.9, left: 65, width: 480, top: 245, height: 125, ylabel: '紅：合成繩子（兩個高度相加）', xlabel: '繩上的位置', yticks: 2 });
        k.curve(q, x => f1(x) + f2(x), C.coral, { 'stroke-width': 4 }); k.dot(q, 0, 0, C.ink); k.dot(q, 1, 0, C.ink);
        k.text(65, 434, `第一頻率 ${fmt(v.speed / 2)}　第二頻率 ${fmt(v.speed)}　固定端位移 = 0`, { 'font-size': 12 });
        return { result: `${fmt(b1, 3)} 與 ${fmt(b2, 3)}`, detail: `在 t=${fmt(v.t)}，用這兩個係數乘上 sin(πx)、sin(2πx) 再相加。第二模態頻率是第一模態的 2 倍；c 改變振動快慢，A 改變第二舞步的份量。` };
      }
    },
    {
      id: 'vectorfield', track: 'calculus', symbol: '∇·', name: '向量場、散度與旋度', question: '水是在往外冒，還是在原地轉？',
      title: '放一圈小浮標，再放一個小水車',
      intro: '在地圖上每個位置放一支箭頭，記錄水往哪流、多快，這叫向量場。小圈圈裡流出去的比流進來的多，就像有水往外冒，叫正散度。小水車會被帶著轉，則反映旋度。流得很快不一定轉得很厲害，往外冒也不一定旋轉。',
      scene: '可混合的向外流與旋轉流', viewH: 450, chart: '箭頭是各位置流速；圓圈用來計算流出量與繞圈流動量',
      caption: '平面流場 F(x,y)=(ax−by, bx+ay)，以 a 控制擴散，以 b 控制逆時針旋轉。',
      controls: [['a', '向外冒的程度 a', -1, 1, 0.1, 0.4, ''], ['b', '轉圈程度 b', -1, 1, 0.1, 0.7, ''], ['r', '觀察圓半徑', 0.5, 1.5, 0.1, 1, '']],
      try: '先把 b 設零，只改 a；再把 a 設零，只改 b。比較通量和環流，找出「有流動但沒有散度」的例子。',
      resultLabel: '散度與平面旋度', takeaway: '散度問「淨流出多少」，旋度問「局部轉多強」；它們看的是不同特徵。',
      application: '流體、電磁場和影像中的速度場，常用散度與旋度描述局部行為。',
      tech: [['🌊', '流體模擬', '不可壓縮、定密度流體的速度場滿足零散度。'], ['🧲', '電磁學', '馬克士威方程用散度和旋度描述場的關係。'], ['🌪️', '流場分析', '渦度幫助描述流體的局部旋轉。']],
      teach: teach('用箭頭表示方向和快慢；流入與流出先像記帳一樣比較。', '在方格紙畫向外箭頭、轉圈箭頭，沿一個圓圈逐段看箭頭朝外還是沿圓。', ['往外流一定會把水車轉起來嗎？', '沒有散度是不是沒有流動？'], '旋度描述局部旋轉趨勢，不能只看一條流線像不像圓。散度為零也不代表箭頭都是零。'),
      formula: '∇·F=∂F<sub>x</sub>/∂x+∂F<sub>y</sub>/∂y=2a；curl<sub>z</sub>F=∂F<sub>y</sub>/∂x−∂F<sub>x</sub>/∂y=2b；Φ=2aπR²，Γ=2bπR²',
      formal: 'Φ=∮ F·n ds 為外法向通量，Γ=∮ F·dr 為逆時針環流。對本光滑線性場，平面散度定理與格林定理分別將兩個邊界積分轉成圓內 2a、2b 的面積積分。圖上箭頭按同一比例縮放，沒有把每支都正規化。這是可含源匯的抽象速度場，a≠0 時不能視為封閉平面內定密度不可壓縮流。',
      quiz: [{ question: 'a=0、b=1 時會怎樣？', options: ['完全沒有水流', '有旋轉，散度為零', '只向外冒水'], answer: 1, why: '場為 (−y,x)，散度 0、平面旋度 2。' }, { question: '觀察圓半徑加倍，這個場的總通量如何變化？', options: ['成為四倍', '一定變為零', '成為兩倍'], answer: 0, why: '散度固定，總通量與圓面積 πR² 成正比；原通量為零時仍是零。' }], related: ['partial', 'double', 'wave'],
      draw(k, v) {
        const { C, fmt } = k, cx = 195, cy = 180, s = 78;
        for (let ix = -4; ix <= 4; ix++) for (let iy = -4; iy <= 4; iy++) {
          const x = ix * 0.45, y = iy * 0.45, fx = v.a * x - v.b * y, fy = v.b * x + v.a * y;
          k.arrow(cx + x * s, cy - y * s, cx + x * s + fx * 9, cy - y * s - fy * 9, C.blue, 1.6);
        }
        k.circle(cx, cy, s * v.r, 'none', { stroke: C.coral, 'stroke-width': 2, 'stroke-dasharray': '5 4' });
        k.circle(cx, cy, 4, C.ink);
        k.text(395, 65, '淨流出：散度', { fill: C.coral }); k.text(395, 95, `2a = ${fmt(2 * v.a)}`, { 'font-size': 20, fill: C.ink });
        k.text(395, 145, '局部轉動：旋度', { fill: C.blue }); k.text(395, 175, `2b = ${fmt(2 * v.b)}`, { 'font-size': 20, fill: C.ink });
        k.text(395, 230, '正：逆時針旋轉'); k.text(395, 255, '負：順時針旋轉');
        const area = Math.PI * v.r * v.r, flux = 2 * v.a * area, circ = 2 * v.b * area;
        panel(k, 355, `觀察圓面積 ${fmt(area)}｜半徑 ${fmt(v.r)}`, `總通量 Φ = ${fmt(flux)}（向外為正）`, `總環流 Γ = ${fmt(circ)}（逆時針為正）`);
        return { result: `${fmt(2 * v.a)} / ${fmt(2 * v.b)}`, detail: `圓內散度與旋度處處相同，所以總通量 = 2a × 面積 = ${fmt(flux)}，總環流 = 2b × 面積 = ${fmt(circ)}。改半徑會改總量，不改局部散度與旋度。` };
      }
    },
    {
      id: 'convergence', track: 'foundations', symbol: 'ε', name: '極限、收斂與實分析', question: '靠近一次，算真的會靠近嗎？',
      title: '把目標周圍畫一條窄窄的安全帶',
      intro: '一串數字有沒有「收斂」，不能只看某次剛好很近。真正的約定是：不管安全帶畫多窄，總能找到一個位置，讓後面所有數字都留在帶裡。你還會看到一個陷阱：每次加的數越來越小，全部加起來卻仍可能越長越大。',
      scene: '數列與級數的 ε 安全帶', viewH: 450, chart: '橫軸是項數，點是數列值或部分和；綠帶表示目標 ±ε',
      caption: '可比較 1/n、反覆跳動的 (−1)ⁿ、幾何級數部分和與調和級數部分和。有限畫面只能提供線索，判斷無限尾端需要推理。',
      controls: [{ key: 'kind', label: '觀察對象', options: ['數列 1/n', '數列 (−1)ⁿ', '級數 Σ 1/2ʲ 的部分和', '級數 Σ 1/j 的部分和'], value: 0 }, ['n', '顯示到第幾項', 5, 100, 1, 40, '項'], ['eps', '安全帶半寬 ε', 0.02, 0.5, 0.02, 0.1, '']],
      try: '先看 1/n，縮小安全帶並增加項數。再切換到調和級數：每項 1/n 變小，部分和卻如何變化？',
      resultLabel: '收斂判斷', takeaway: '收斂是「最後永遠留在任意小的範圍內」；項趨近零，不保證級數總和收斂。',
      application: '實分析把近似是否可靠說清楚，讓數值方法與無窮級數有可檢查的誤差保證。',
      tech: [['🧮', '數值精度', '用誤差界決定要計算多少項。'], ['🔊', '訊號近似', '有限個傅立葉或其他基底的和，必須說明以何種意義逼近。'], ['📐', '嚴謹證明', 'ε 與尾端索引把「越來越接近」變成可驗證的敘述。']],
      teach: teach('先用距離理解誤差，再問「後面會不會又跑出去」。', '把數列值寫成紙卡，畫出目標左右的窄帶；找一張卡，讓後面的卡全部待在帶裡。', ['曾經進入安全帶，夠不夠？', '每次只加一點點，總和一定有上限嗎？'], '顯示一百項仍不是對無限多項的證明；調和級數就是「每項變小但總和不收斂」的反例。'),
      formula: 'a<sub>n</sub>→L ⇔ ∀ε>0，∃N，∀n≥N：|a<sub>n</sub>−L|<ε；Σ<sub>j=1</sub><sup>n</sup>2<sup>−j</sup>=1−2<sup>−n</sup>；Σ<sub>j=1</sub><sup>∞</sup>1/j 發散',
      formal: '1/n→0 可取 N=⌊1/ε⌋+1。幾何部分和的誤差為 2⁻ⁿ，可取 N=⌊log₂(1/ε)⌋+1。交錯數列 (−1)ⁿ 的奇、偶子列分別為 −1、1，故沒有共同極限。調和級數按 1、1/2、(1/3+1/4)、(1/5+…+1/8)… 分組，每組至少 1/2，因此部分和無上界。頁面的 ε 帶使用嚴格不等式；級數是否收斂是看部分和數列。',
      quiz: [{ question: '收斂的約定是哪個？', options: ['某一項碰到目標', '不管帶多窄，足夠後面的所有項都留在裡面', '頭五项看起來很接近'], answer: 1, why: '關鍵是任意 ε，以及某個索引之後的所有項。' }, { question: '1/n 趨近零，所以 Σ1/n 一定有限嗎？', options: ['是', '只有 n 是偶數才是', '不是，調和級數會無界增長'], answer: 2, why: '每項變小是級數收斂的必要條件，但不是充分條件。' }], related: ['taylor', 'numerical-ode', 'roots', 'fourier'],
      draw(k, v) {
        const { C, fmt } = k, vals = []; let harmonic = 0;
        for (let j = 1; j <= v.n; j++) { harmonic += 1 / j; vals.push(v.kind === 0 ? 1 / j : v.kind === 1 ? (j % 2 ? -1 : 1) : v.kind === 2 ? 1 - 2 ** (-j) : harmonic); }
        const converges = v.kind === 0 || v.kind === 2, target = v.kind === 2 ? 1 : 0, ymax = v.kind === 3 ? 6 : 1.6;
        const p = k.plot({ xmin: 1, xmax: v.n, ymin: v.kind === 1 ? -1.4 : -0.6, ymax, left: 65, width: 480, top: 42, height: 226, xlabel: '第 n 項', ylabel: v.kind < 2 ? '數列值 aₙ' : '前 n 項加起來的部分和 Sₙ', yticks: 4, xticks: 4, tickFmt: x => Number(x.toFixed(1)) });
        if (converges) { k.rect(p.left, p.y(target + v.eps), p.width, p.y(target - v.eps) - p.y(target + v.eps), C.greenSoft, { opacity: 0.85 }); k.line(p.left, p.y(target), p.right, p.y(target), C.green, { 'stroke-dasharray': '4 4' }); }
        k.polyline(vals.map((x, i) => [p.x(i + 1), p.y(x)]), C.blue, { 'stroke-width': 1.5 }); vals.forEach((x, i) => k.dot(p, i + 1, x, converges && Math.abs(x - target) < v.eps ? C.green : C.coral, v.n > 50 ? 2 : 3));
        const N = v.kind === 0 ? Math.floor(1 / v.eps) + 1 : Math.floor(Math.log2(1 / v.eps)) + 1;
        // Use the exact error formula: 1 - 2^-n rounds to 1 in doubles for large n.
        const error = v.kind === 2 ? 2 ** (-v.n) : 1 / v.n;
        const label = converges ? `收斂到 ${target}` : v.kind === 1 ? '不收斂：永遠在 −1 與 1 之間跳' : '不收斂：部分和沒有上限';
        panel(k, 346, label, converges ? `ε=${fmt(v.eps)} 時，從 N=${N} 起保證一直待在安全帶內。` : v.kind === 1 ? '奇數項和偶數項各自停在不同位置。' : '每次加的 1/n 雖然越來越小，總和仍會一直增加。', converges ? `第 ${v.n} 項值約 ${fmt(vals[v.n - 1], 6)}；誤差 ${error.toExponential(2)}` : '證明要管到無限尾端；不是只看目前畫出的點。');
        return { result: label, detail: converges ? `目標 ${target}，公式算出的誤差 ${error.toExponential(3)}（項值顯示到小數六位）。根據公式可證明 n≥${N} 時誤差嚴格小於 ${fmt(v.eps)}；這項保證涵蓋圖外的所有後續項。` : v.kind === 1 ? '任意往後看，都還有 −1 和 1；它們無法一起待在半寬小於 1 的同一安全帶。' : `目前部分和 ${fmt(harmonic, 6)}。按項數翻倍分組，每組至少增加 1/2，所以不存在有限總和。` };
      }
    }
  );
})();
