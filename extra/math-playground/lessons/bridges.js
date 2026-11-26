// Curriculum bridges and discrete/optimization foundations.
// References: OpenStax Precalculus 2e (functions, trigonometry, conics),
// https://openstax.org/details/books/precalculus-2e
// MIT 6.042J (logic, counting), MIT 18.06 (systems).
(() => {
  const fact = n => { let p = 1; for (let i = 2; i <= n; i++) p *= i; return p; };
  const quiz = (question, options, answer, why) => ({ question, options, answer, why });
  const teach = (connect, activity, myth) => ({ grade: '國小高年級可探索；高中銜接與大學延伸', connect, activity, ask: ['先預測，再操作：什麼改變了？', '換一組數字，剛才的規律還成立嗎？'], myth });
  MP.register(
    {
      id: 'polynomial', track: 'foundations', symbol: 'xⁿ', name: '多項式與成長', question: '多一倍，工作量多幾倍？',
      title: '一排燈、一面牆、一座方塊城',
      intro: '每邊放 x 顆燈，一排需要 x 顆，一面正方形牆需要 x² 顆，一座立方體需要 x³ 顆。多項式把不同次方的零件加在一起，能描述很多不同的成長規則。',
      scene: '模擬：不同維度的裝飾工程', viewH: 420, chart: '藍：一次　綠：二次　橘：三次；黑點標出目前選擇',
      caption: '用連續曲線比较成長率；實際擺燈時邊長應取整數。圖的數字是簡化的工作量單位。',
      controls: [{ key: 'degree', label: '工程形狀', options: ['一排 x', '一面 x²', '一座 x³'], value: 1 }, ['x', '每邊的大小 x', 0, 4, 0.1, 2, '']], play: 'x',
      try: '比較 x=2 和 x=4：三種工程都變成兩倍嗎？', resultLabel: '目前的工作量',
      takeaway: '次方不同，放大後的成長速度也不同。', application: '演算法的工作量常用多項式估計；同一張資料表，掃過一遍與比較每一對資料，成本不同。',
      tech: [['💻', '演算法分析', '比較輸入增大時，步驟數是約 n、n² 還是 n³。'], ['📐', '曲線近似', '泰勒多項式把不同次方加起來，近似彎曲的函數。']],
      teach: teach('面積、體積、函數', '用積木拼一排、正方形與立方體，將每邊從 2 增為 3。', '次方描述重複相乘；x³ 不是 x 乘 3。'),
      formula: 'P(x)=a₀+a₁x+⋯+aₙxⁿ；本例 f(x)=xᵈ ⇒ f(2x)=2ᵈf(x)',
      formal: 'd=1、2、3 對應不同維度。一般多項式可以包含多個次方及正負係數；主導項描述 |x| 很大時的行為。演算法的 O(nᵈ) 描述漸近上界，並不等於精確執行秒數。',
      related: ['linear', 'derivative', 'taylor', 'roots'],
      quiz: [quiz('立方體每邊變成 2 倍，體積變成？', ['2 倍', '4 倍', '8 倍'], 2, '三個方向各乘 2，所以是 8 倍。'), quiz('多項式可以包含哪些零件？', ['不同整數非負次方的項', '只能是直線', '只能有一項'], 0, '常數、x、x² 等都可以乘上係數後相加。')],
      draw(k, v) {
        const p = k.plot({ xmin: 0, xmax: 4, ymin: 0, ymax: 64, top: 45, height: 275, xlabel: '每邊大小 x', ylabel: '工作量' });
        [1, 2, 3].forEach((d, i) => k.curve(p, x => x ** d, [k.C.blue, k.C.green, k.C.coral][i], { 'stroke-width': d === v.degree + 1 ? 4 : 2 }));
        const d = v.degree + 1, amount = v.x ** d;
        k.dot(p, v.x, amount, k.C.ink);
        k.box(60, 368, 485, 40, { fill: k.C.yellowSoft });
        k.text(78, 394, `邊長放大 2 倍 → 工作量放大 ${2 ** d} 倍`, { 'font-size': 16, fill: k.C.ink });
        return { result: `${k.fmt(amount)} 單位`, detail: `${v.x} 的 ${d} 次方 = ${k.fmt(amount)}。選一種工程，再改邊長。` };
      }
    },
    {
      id: 'trigonometry', track: 'foundations', symbol: 'sin', name: '三角函數與相位', question: '轉圈圈，怎麼畫出波？',
      title: '摩天輪的座位，留下一條波浪',
      intro: '摩天輪轉一圈，座位先升高、再降低。把每一刻的高度畫在紙上，就會出現一條波浪。三角函數把「轉到哪裡」和「現在多高」接在一起；相位就是從哪個位置開始。',
      scene: '模擬：旋轉座位與同步的高度記錄', viewH: 420, chart: '左：單位圓　右：高度 sin(t+φ)；橘點是現在',
      caption: '高度以圓心為 0、半徑為 1；角度採弧度，完整一圈為 2π。右圖橫軸是轉過的角度。',
      controls: [['angle', '已轉過的角度 t', 0, 360, 5, 60, '°'], ['phase', '起跑位置 φ', 0, 180, 15, 0, '°']], play: 'angle',
      try: '保持 t 不動，改變起跑位置。再播放一圈，看圓上的點和波上的點同步移動。', resultLabel: '座位相對圓心的高度',
      takeaway: '圓周運動的投影就是正弦、餘弦波。', application: '相位描述週期訊號的相對位置，是合成聲音、交流電與位置編碼的重要概念。',
      tech: [['🎵', '合成器', '調整頻率、振幅與相位，組成不同波形。'], ['📡', '通訊', '訊號可以藉由相位的改變來承載資訊。']],
      teach: teach('圓、角度、坐標', '用紙圓盤上的點轉圈，另一人每次記下它的高度。', 'sin 的輸出是相對高度，並不是角度本身。'),
      formula: 'x=cos θ，y=sin θ；θ=t+φ；sin(θ+2π)=sin θ',
      formal: '單位圓上的點為 (cos θ,sin θ)，角度轉成弧度才能直接代入微積分公式。一般波可寫成 A sin(ωt+φ)，A 是振幅，ω 是角頻率，週期為 2π/|ω|（ω≠0）。',
      related: ['complex', 'fourier', 'position'],
      quiz: [quiz('相位改變了什麼？', ['圓周率', '波從哪裡開始', '每圈一定變大'], 1, '相位相當於旋轉起點的改變。'), quiz('轉完整一圈後，座位高度會？', ['回到原本高度', '永遠往上', '必定變為 0'], 0, '正弦與餘弦都有週期性。')],
      draw(k, v) {
        const theta = (v.angle + v.phase) * Math.PI / 180, cx = 135, cy = 183, r = 88;
        k.box(8, 20, 245, 300, { title: '摩天輪：圓心高度為 0' });
        k.circle(cx, cy, r, '#fff', { stroke: k.C.blue, 'stroke-width': 3 });
        k.line(40, cy, 230, cy); k.line(cx, 86, cx, 280);
        const x = cx + r * Math.cos(theta), y = cy - r * Math.sin(theta);
        k.arrow(cx, cy, x, y, k.C.coral); k.circle(x, y, 7, k.C.coral);
        k.line(x, y, 240, y, k.C.coral, { 'stroke-dasharray': '4 4' });
        const p = k.plot({ xmin: 0, xmax: 360, ymin: -1, ymax: 1, left: 305, width: 258, top: 85, height: 195, xticks: 4, yticks: 2, xlabel: '已轉角度（°）', ylabel: '相對高度' });
        k.curve(p, t => Math.sin((t + v.phase) * Math.PI / 180));
        k.dot(p, v.angle, Math.sin(theta));
        k.text(300, 368, `cos θ = ${k.fmt(Math.cos(theta))}　sin θ = ${k.fmt(Math.sin(theta))}`, { 'text-anchor': 'middle', 'font-size': 18, fill: k.C.ink });
        return { result: k.fmt(Math.sin(theta), 3), detail: `總角度 ${v.angle + v.phase}°；同一座位的左右位置是 ${k.fmt(Math.cos(theta), 3)}。` };
      }
    },
    {
      id: 'sequences', track: 'foundations', symbol: 'aₙ', name: '數列、遞迴與級數', question: '每天加一點，最後會怎樣？',
      title: '一個漏水又補水的桶子',
      intro: '桶子每天先留下原本水量的一部分，再加入 1 杯水。今天剩多少，決定明天有多少，這就是遞迴。如果每天都漏一點，水會一直漲，還是慢慢靠近固定高度？',
      scene: '模擬：每日保留比例與固定補水', viewH: 420, chart: '橘點：每天的水量　藍虛線：存在時的平衡水量',
      caption: '初始為 0 杯。r≤1 時是保留模型；r>1 是數學上的成長模型，不再代表單純漏水。桶的容量視為無限。',
      controls: [['ratio', '每天保留／成長倍率 r', 0, 1.2, 0.1, 0.5, ''], ['days', '觀察幾天', 1, 15, 1, 8, '天']], play: 'days',
      try: '比較 r=0.5、1、1.2。哪一種會靠近固定數字？', resultLabel: '最後一天的水量',
      takeaway: '遞迴用前一步定義下一步；無窮多次之後是否穩定，要看規則。', application: '同樣的反覆更新想法會出現在數值方法、訊號濾波與動態系統中。',
      tech: [['📉', '指數平滑', '把前一次狀態與新輸入按比例混合。'], ['🧮', '迭代算法', '重複套用規則，觀察是否收斂。']],
      teach: teach('等比數列、分數與比例', '拿紙片代表水，每回合留下半數，再放入一整張。', '有限步看起來接近，仍要分析規則才能判斷無限步的極限。'),
      formula: 'a₀=0，aₙ₊₁=raₙ+1；aₙ=1+r+⋯+rⁿ⁻¹；0≤r<1 ⇒ lim aₙ=1/(1−r)',
      formal: '本例 r≥0。r≠1 時有限和為 (1−rⁿ)/(1−r)；r=1 時 aₙ=n。0≤r<1 的平衡值滿足 a=ra+1，且誤差每步乘 r。一般等比級數在 |r|<1 收斂，負 r 會產生交替現象。',
      related: ['convergence', 'markov', 'ode'],
      quiz: [quiz('若 r=1，每天水量如何變化？', ['不變', '增加 1 杯', '減少 1 杯'], 1, '沒有漏水，每天只多加 1 杯。'), quiz('r=0.5 時會靠近幾杯？', ['1 杯', '2 杯', '無限多杯'], 1, '2 杯留下一半再加 1 杯，仍是 2 杯。')],
      draw(k, v) {
        const data = [0]; for (let i = 0; i < v.days; i++) data.push(v.ratio * data.at(-1) + 1);
        const limit = v.ratio < 1 ? 1 / (1 - v.ratio) : null;
        const ymax = Math.max(3, Math.ceil(Math.max(...data, limit || 0) * 1.1));
        const p = k.plot({ xmin: 0, xmax: 15, ymin: 0, ymax, top: 40, height: 285, xlabel: '天數 n', ylabel: '水量（杯）', xticks: 5 });
        if (limit !== null) k.line(p.x(0), p.y(limit), p.x(15), p.y(limit), k.C.blue, { 'stroke-dasharray': '5 5' });
        k.polyline(data.map((a, i) => [p.x(i), p.y(a)])); data.forEach((a, i) => k.dot(p, i, a, k.C.coral, 4));
        k.text(300, 397, `下一步：${k.fmt(data.at(-1))} × ${v.ratio} + 1 = ${k.fmt(data.at(-1) * v.ratio + 1)}`, { 'text-anchor': 'middle', 'font-size': 16, fill: k.C.ink });
        return { result: `${k.fmt(data.at(-1))} 杯`, detail: limit !== null ? `平衡值 ${k.fmt(limit)} 杯，現在還差 ${k.fmt(limit - data.at(-1), 4)}。` : '這個倍率下，水量不會收斂到有限的平衡值。' };
      }
    },
    {
      id: 'combinatorics', track: 'discrete', symbol: 'C', name: '排列組合', question: '選隊員和排棒次一樣嗎？',
      title: '同樣三個人，換順序算不算新答案？',
      intro: '選出接力隊員時，阿明、阿美和小華是一隊；安排第一棒、第二棒、第三棒時，順序就很重要。組合數「選誰」，排列數「誰站哪個位置」。',
      scene: '模擬：從候選人名單組隊或安排棒次', viewH: 420, chart: '上：候選人　下：可行名單範例，最多顯示 12 種',
      caption: '每人最多選一次；組隊不看順序，排棒次看順序。完整總數由公式計算。',
      controls: [['n', '候選人', 3, 8, 1, 5, '位'], ['r', '選幾人', 1, 3, 1, 3, '位'], { key: 'ordered', label: '任務', options: ['組隊：不看順序', '排棒次：看順序'], value: 0 }],
      try: '固定選 3 人，切換任務。看總數是否剛好多了 3×2×1 倍。', resultLabel: '全部可能的安排',
      takeaway: '先決定「順序算不算差別」，才能正確計數。', application: '排列組合幫助計算抽樣空間、搜尋組合與算法需要探索多少種可能。',
      tech: [['🎲', '機率模型', '先數出等可能結果，再計算事件機率。'], ['🗂️', '搜尋與排程', '估計候選安排的數量，決定是否能逐一嘗試。']],
      teach: teach('乘法原理、階乘', '三張人名卡，先選兩張成一隊，再排成第一、第二棒。', '排列和組合不是兩種任意公式；差別來自問題是否區分順序。'),
      formula: 'P(n,r)=n!/(n−r)!；C(n,r)=n!/[r!(n−r)!]；P(n,r)=r! C(n,r)',
      formal: 'n 與 r 為整數且 0≤r≤n。本例不允許重複選取；若可以重複，樣本空間和公式會改變。以 r! 消除同一組人內部的重複排列。',
      related: ['distributions', 'graph', 'logic'],
      quiz: [quiz('選三位隊員、不分職位，要用？', ['組合', '排列', '一定是 n³'], 0, '同一組人換順序仍是同一隊。'), quiz('同樣三人排三棒，有幾種順序？', ['3', '6', '9'], 1, '第一棒 3 種、第二棒 2 種、第三棒 1 種，共 6 種。')],
      draw(k, v) {
        const list = [];
        const visit = (prefix, start) => {
          if (prefix.length === v.r) { list.push(prefix); return; }
          for (let i = v.ordered ? 0 : start; i < v.n; i++) if (!prefix.includes(i)) visit([...prefix, i], i + 1);
        };
        visit([], 0);
        k.box(10, 10, 580, 96, { title: '候選人名單' });
        for (let i = 0; i < v.n; i++) { k.circle(48 + i * 69, 67, 19, k.C.blueSoft); k.text(48 + i * 69, 73, String.fromCharCode(65 + i), { 'text-anchor': 'middle', fill: k.C.blue, 'font-size': 19 }); }
        list.slice(0, 12).forEach((row, i) => {
          const x = 18 + (i % 3) * 192, y = 126 + Math.floor(i / 3) * 59;
          k.box(x, y, 180, 47, { fill: k.C.greenSoft });
          k.text(x + 90, y + 29, row.map(n => String.fromCharCode(65 + n)).join(v.ordered ? ' → ' : ' · '), { 'text-anchor': 'middle', 'font-size': 17, fill: k.C.ink });
        });
        const count = fact(v.n) / fact(v.n - v.r) / (v.ordered ? 1 : fact(v.r));
        k.text(300, 400, `顯示 ${Math.min(list.length, 12)} 種，共 ${count} 種`, { 'text-anchor': 'middle', 'font-size': 16 });
        return { result: `${count} 種`, detail: v.ordered ? `每組人有 ${fact(v.r)} 種內部順序，所以比不分順序多 ${fact(v.r)} 倍。` : '同一組人只顯示一次，A、B 與 B、A 算同一組。' };
      }
    },
    {
      id: 'logic', track: 'discrete', symbol: '⇒', name: '邏輯、反例與證明', question: '反過來說，也一定對嗎？',
      title: '「下雨就帶傘」，能倒著說嗎？',
      intro: '「下雨就帶傘」不代表「帶傘就一定下雨」；也可能是怕太陽！數學把一句話拆成真、假，逐一檢查規則。只要找到一個反例，就能推翻「永遠成立」。',
      scene: '模擬：用真值表檢查推論', viewH: 420, chart: 'P、Q 各有真／假兩種；綠色通過，橘色是推論反例',
      caption: '這是命題邏輯的材料蘊涵。P⇒Q 只有在 P 真、Q 假時為假；不表達現實的因果關係。',
      controls: [{ key: 'rule', label: '要檢查的推論', options: ['原句推出逆句', '原句推出逆否句', '德摩根律'], value: 0 }, ['row', '觀察第幾種情況', 1, 4, 1, 1, '']],
      try: '找出第一個推論中的橘色列。切換逆否句，還找得到反例嗎？', resultLabel: '這個推論是否對所有情況成立？',
      takeaway: '一個反例就足以推翻全稱說法；列完有限的所有情況也能構成證明。', application: '邏輯是數學證明、程式條件判斷與數位電路的共同語言。',
      tech: [['💻', '程式驗證', '檢查前提是否足以保證程式的結果。'], ['🔌', '數位邏輯', 'AND、OR、NOT 閘可以用真值表描述。']],
      teach: teach('條件句、分類', '用真和假卡片排出四種情況，討論遮陽傘是否構成反例。', '如果前提是假，材料蘊涵可以為真；這不代表前提已被證明。'),
      formula: 'P⇒Q ≡ ¬P∨Q；(P⇒Q) ≡ (¬Q⇒¬P)；¬(P∧Q) ≡ ¬P∨¬Q',
      formal: '逆句 Q⇒P 一般不等價於原句；逆否句 ¬Q⇒¬P 則等價。真值表可證明有限命題公式是恆真式。涉及無限多整數時，不能只靠有限測試，可能需要歸納法等證明方法。',
      related: ['convergence', 'groups', 'graph'],
      quiz: [quiz('證明「每隻鳥都會飛」是錯的，需要？', ['找到一隻不會飛的鳥', '找到十隻會飛的鳥', '檢查所有鳥才行'], 0, '一個反例就足以推翻「全部」。'), quiz('與 P⇒Q 等價的是？', ['Q⇒P', '¬Q⇒¬P', 'P 且 Q'], 1, '逆否句與原命題具有相同真值。')],
      draw(k, v) {
        const implication = (p, q) => !p || q;
        const rows = [[true, true], [true, false], [false, true], [false, false]];
        const labels = ['(P⇒Q) ⇒ (Q⇒P)', '(P⇒Q) ⇒ (¬Q⇒¬P)', '¬(P∧Q) ⇔ (¬P∨¬Q)'];
        k.text(300, 34, labels[v.rule], { 'text-anchor': 'middle', fill: k.C.ink, 'font-size': 20 });
        ['P', 'Q', '前提 P⇒Q', '整個推論'].forEach((s, i) => k.text(80 + i * 140, 85, s, { 'text-anchor': 'middle', 'font-weight': 700 }));
        const outcomes = rows.map(([p, q], i) => {
          const premise = implication(p, q);
          const good = v.rule === 0 ? implication(premise, implication(q, p)) : v.rule === 1 ? implication(premise, implication(!q, !p)) : (!(p && q) === (!p || !q));
          k.box(20, 105 + i * 58, 560, 48, { fill: good ? k.C.greenSoft : k.C.coralSoft, stroke: i === v.row - 1 ? k.C.ink : '#dce2df' });
          [p, q, premise, good].forEach((x, j) => k.text(80 + j * 140, 136 + i * 58, x ? '真' : '假', { 'text-anchor': 'middle', 'font-size': 18, fill: k.C.ink }));
          return good;
        });
        k.text(300, 386, `目前觀察 P=${rows[v.row - 1][0] ? '真' : '假'}、Q=${rows[v.row - 1][1] ? '真' : '假'}`, { 'text-anchor': 'middle', 'font-size': 16 });
        return { result: outcomes.every(Boolean) ? '成立：四種情況都通過' : '不成立：有反例', detail: outcomes[v.row - 1] ? '目前這一列通過；仍要看完整四列，才能判斷是否恆真。' : 'P 假、Q 真時，原句成立但逆句不成立，這一列就是反例。' };
      }
    },
    {
      id: 'conics', track: 'foundations', symbol: '◒', name: '圓錐曲線與軌跡', question: '拉著繩子，可以畫什麼？',
      title: '點照著距離規則走，就畫出曲線',
      intro: '把繩子繞過兩個固定點，拉緊鉛筆繞一圈，就畫出橢圓。橢圓、拋物線、雙曲線都可以用「到某些地方的距離」來定義；規則不同，留下的路線也不同。',
      scene: '模擬：移動點與焦點之間的距離', viewH: 440, chart: '橘線：軌跡　藍點：焦點　綠點：正在移動的位置',
      caption: '橢圓：a=3、b=2；拋物線：y=x²/4，焦點 (0,1)；雙曲線：x²−y²=1。長寬使用相同尺度。',
      controls: [{ key: 'shape', label: '距離規則', options: ['橢圓：距離和', '拋物線：兩距離相等', '雙曲線：距離差'], value: 0 }, ['position', '沿曲線移動', 0, 100, 1, 30, '%']], play: 'position',
      try: '移動綠點：個別距離一直變，哪個組合保持不變？', resultLabel: '保持不變的距離規則',
      takeaway: '幾何曲線可以用一組不變的條件來定義。', application: '橢圓出現在理想二體軌道，拋物線的反射性質則用於天線與反射鏡。',
      tech: [['📡', '拋物面反射器', '平行入射的理想光線會反射到焦點。'], ['🛰️', '軌道幾何', '理想二體引力模型的束縛軌道是橢圓。']],
      teach: teach('距離、坐標、平方', '用兩個圖釘和一條繩圈畫橢圓，再量兩段距離的和。', '橢圓不是任意壓扁的曲線；必須滿足焦點距離和固定。'),
      formula: '橢圓 d₁+d₂=2a；拋物線 dist(P,F)=dist(P,準線)；雙曲線 |d₁−d₂|=2a',
      formal: '橢圓的焦距 c 滿足 c²=a²−b²；本例 c=√5。拋物線 x²=4py 的 p=1、準線 y=−1。雙曲線 x²/a²−y²/b²=1 的 c²=a²+b²，本例 a=b=1。',
      related: ['lagrange', 'curvature', 'vector'],
      quiz: [quiz('橢圓上的點移動時，保持不變的是？', ['到兩焦點的距離和', '到單一焦點的距離', '橫座標'], 0, '每段長度可以變，但相加等於固定的 2a。'), quiz('拋物線比較哪兩個距離？', ['兩個圓心', '到焦點和到準線', '到任意兩個角'], 1, '到焦點的距離等於到準線的最短距離。')],
      draw(k, v) {
        const p = k.plot({ xmin: -5, xmax: 5, ymin: -3, ymax: 4, left: 70, width: 460, top: 45, height: 322, xticks: 4, yticks: 4, xlabel: '位置 x', ylabel: '位置 y' });
        const draw = k.sub(k.clip(p.left, p.top, p.width, p.height));
        let x, y, focus, measured, rule;
        if (v.shape === 0) {
          const theta = v.position / 100 * Math.PI * 2, c = Math.sqrt(5);
          draw.polyline(Array.from({ length: 181 }, (_, i) => [p.x(3 * Math.cos(i * Math.PI / 90)), p.y(2 * Math.sin(i * Math.PI / 90))]));
          x = 3 * Math.cos(theta); y = 2 * Math.sin(theta); focus = [[-c, 0], [c, 0]];
          measured = focus.map(([fx, fy]) => Math.hypot(x - fx, y - fy)); rule = `距離和 = ${k.fmt(measured[0] + measured[1])}`;
        } else if (v.shape === 1) {
          x = -3.5 + v.position * 0.07; y = x * x / 4; focus = [[0, 1], [x, -1]];
          draw.curve(p, t => t * t / 4); draw.line(p.x(-5), p.y(-1), p.x(5), p.y(-1), k.C.blue, { 'stroke-dasharray': '5 5' });
          measured = [Math.hypot(x, y - 1), y + 1]; rule = `兩段皆為 ${k.fmt(measured[0])}`;
        } else {
          const u = -1.7 + v.position * 0.034;
          for (const sign of [-1, 1]) draw.polyline(Array.from({ length: 181 }, (_, i) => { const t = -2 + i / 45; return [p.x(sign * Math.cosh(t)), p.y(Math.sinh(t))]; }));
          x = Math.cosh(u); y = Math.sinh(u); focus = [[-Math.SQRT2, 0], [Math.SQRT2, 0]];
          measured = focus.map(([fx]) => Math.hypot(x - fx, y)); rule = `距離差 = ${k.fmt(Math.abs(measured[0] - measured[1]))}`;
        }
        focus.forEach(([fx, fy]) => { draw.line(p.x(x), p.y(y), p.x(fx), p.y(fy), k.C.blue); draw.dot(p, fx, fy, k.C.blue, 5); });
        draw.dot(p, x, y, k.C.green);
        k.text(300, 428, rule, { 'text-anchor': 'middle', 'font-size': 17, fill: k.C.ink });
        return { result: rule, detail: `點位於 (${k.fmt(x)}, ${k.fmt(y)})；兩段距離分別是 ${k.fmt(measured[0])}、${k.fmt(measured[1])}。` };
      }
    },
    {
      id: 'systems', track: 'linear', symbol: 'Ax', name: '聯立方程與消去法', question: '兩張收據，找得出單價嗎？',
      title: '把兩張收據相減，消掉同一種商品',
      intro: '一份點心加一杯飲料共 6 元，另一張收據買了不同份數。兩張收據一起看，常常能找出各自單價。但如果第二張只把第一張抄兩遍，就沒有新線索了。',
      scene: '模擬：用兩條收據方程找交點', viewH: 440, chart: '藍線：x+y=6　橘線：第二張收據；交點代表同時符合',
      caption: '金額使用模型單位。唯一解可能出現負值，代表這份數據不符合「非負價格」的生活假設。',
      controls: [{ key: 'case', label: '第二張收據的份數', options: ['2x+y=c', '2x+2y=c'], value: 0 }, ['total', '第二張收據總價 c', 8, 14, 1, 10, '元']],
      try: '選 2x+2y=c，比較 c=12 與 c=10：為什麼一次有無限多解，一次沒有解？', resultLabel: '收據能提供的答案',
      takeaway: '獨立的線索才能縮小答案範圍；重複或矛盾的線索會改變解的數量。', application: '線性方程組是工程模擬、電路分析與最小平方擬合的基本工具。',
      tech: [['⚡', '電路求解', '把電流與電壓限制寫成聯立方程。'], ['📊', '資料擬合', '投影與最小平方法也會產生線性方程組。']],
      teach: teach('一次函數、等式', '用紅藍紙片代表兩種商品，重複的部分直接從兩張收據上劃掉。', '方程式數量等於未知數數量，仍不保證唯一解；條件要獨立且相容。'),
      formula: 'Ax=b；R₂←R₂−2R₁；det A≠0 ⇒ 唯一解',
      formal: '第一列是 [1,1|6]。第二列 [2,1|c] 消去後是 [0,−1|c−12]，得到 y=12−c、x=c−6。若第二列為 [2,2|c]，消去後為 [0,0|c−12]：c=12 有無限多實數解，其他 c 無解。',
      related: ['matrix', 'basis', 'projection', 'linear-program'],
      quiz: [quiz('第二張收據完全是第一張的兩倍，能多知道什麼？', ['一定找到唯一單價', '沒有增加獨立線索', '價格一定變兩倍'], 1, '兩條方程描述同一條線。'), quiz('兩條不同平行線代表？', ['沒有共同解', '唯一解', '無限多解'], 0, '沒有一個點能同時滿足兩條線。')],
      draw(k, v) {
        const p = k.plot({ xmin: -2, xmax: 8, ymin: -4, ymax: 10, top: 45, height: 285, xlabel: '點心單價 x', ylabel: '飲料單價 y' });
        const draw = k.sub(k.clip(p.left, p.top, p.width, p.height));
        draw.curve(p, x => 6 - x, k.C.blue, { 'stroke-width': 5 });
        draw.curve(p, x => v.case ? v.total / 2 - x : v.total - 2 * x, k.C.coral, { 'stroke-dasharray': '7 5' });
        let result, operation;
        if (!v.case) { const x = v.total - 6, y = 12 - v.total; draw.dot(p, x, y); result = `x=${x}，y=${y}`; operation = `消去 x 後：−y = ${v.total - 12}`; }
        else { result = v.total === 12 ? '無限多解：兩條線重疊' : '無解：兩條線平行'; operation = `消去後：0 = ${v.total - 12}`; }
        k.text(300, 390, operation, { 'text-anchor': 'middle', 'font-size': 22, fill: k.C.ink });
        return { result, detail: v.case ? '兩條方程的左邊成比例，請檢查右邊是否也成相同比例。' : '從第二張收據扣掉兩倍第一張，再代回求另一個價格。' };
      }
    },
    {
      id: 'linear-program', track: 'optimization', symbol: 'max', name: '線性規劃', question: '材料有限，怎麼做最划算？',
      title: '烘焙店的一天：餅乾和蛋糕怎麼分配？',
      intro: '餅乾和蛋糕都要用麵粉，也要占烤箱時間。把每一種限制畫成邊界，就圈出能做到的安排。線性規劃在這片範圍裡，找出收入最高的位置。',
      scene: '模擬：兩種產品的資源分配', viewH: 440, chart: '綠色區域：做得到的配方　橘點：最佳頂點　虛線：相同收入',
      caption: '產品以可分割的批量表示：x+y≤麵粉 F、x+2y≤烤箱 12。若只能做整數批，需另外解整數規劃。',
      controls: [['flour', '麵粉容量 F', 4, 10, 1, 8, '單位'], ['profit', '蛋糕每批收入 c', 1, 6, 0.5, 4, '元']],
      try: '固定麵粉 8 單位，提高蛋糕收入。最划算的配方會沿著邊界移動嗎？', resultLabel: '最高收入（連續批量）',
      takeaway: '先畫出限制允許的區域，再比較目標在邊界上的值。', application: '線性規劃可用於生產排程、運輸分配與有限資源的安排。',
      tech: [['🏭', '生產計畫', '在材料與產能限制下安排產品。'], ['🚚', '運輸分配', '用線性成本模型分配出貨量。']],
      teach: teach('聯立方程、不等式', '用兩種紙卡代表产品，每種消耗不同數量的材料卡，列出可行配方。', '最高點可能是一整條邊，不一定只有一個配方；一般非線性問題也不保證頂點最佳。'),
      formula: 'max 3x+cy；x+y≤F，x+2y≤12，x≥0，y≥0',
      formal: '可行域是有界凸多邊形，因此線性目標至少有一個頂點達到最大值。目標等值線與最佳邊平行時，整段邊都最佳。本例枚舉兩條資源邊界與坐標軸的交點，移除不滿足限制的點再比較。',
      related: ['systems', 'lagrange', 'gradient'],
      quiz: [quiz('綠色區域代表什麼？', ['所有最高收入配方', '同時符合所有限制的配方', '不能製作的配方'], 1, '可行域收集做得到的選擇。'), quiz('最高收入一定只有一個配方嗎？', ['一定', '不一定，整條邊可能一樣好', '一定有無限多個'], 1, '當目標等值線平行某條最佳邊時，這條邊都最佳。')],
      draw(k, v) {
        const candidates = [[0, 0], [v.flour, 0], [12, 0], [0, v.flour], [0, 6], [2 * v.flour - 12, 12 - v.flour]];
        const vertices = candidates.filter(([x, y]) => x >= 0 && y >= 0 && x + y <= v.flour + 1e-8 && x + 2 * y <= 12 + 1e-8).filter((p, i, arr) => arr.findIndex(q => q[0] === p[0] && q[1] === p[1]) === i);
        const center = vertices.reduce(([x, y], p) => [x + p[0] / vertices.length, y + p[1] / vertices.length], [0, 0]);
        vertices.sort((a, b) => Math.atan2(a[1] - center[1], a[0] - center[0]) - Math.atan2(b[1] - center[1], b[0] - center[0]));
        const scores = vertices.map(([x, y]) => 3 * x + v.profit * y), best = Math.max(...scores), winners = vertices.filter((_, i) => Math.abs(scores[i] - best) < 1e-8);
        const p = k.plot({ xmin: 0, xmax: 12, ymin: 0, ymax: 8, top: 40, height: 285, xlabel: '餅乾批量 x', ylabel: '蛋糕批量 y' });
        const draw = k.sub(k.clip(p.left, p.top, p.width, p.height));
        draw.polygon(vertices.map(([x, y]) => [p.x(x), p.y(y)]), k.C.greenSoft, { stroke: k.C.green, 'stroke-width': 2 });
        draw.curve(p, x => v.flour - x, k.C.blue, { 'stroke-width': 2 });
        draw.curve(p, x => (12 - x) / 2, k.C.gray, { 'stroke-width': 2 });
        draw.curve(p, x => (best - 3 * x) / v.profit, k.C.coral, { 'stroke-dasharray': '6 5' });
        winners.forEach(([x, y]) => draw.dot(p, x, y));
        k.text(300, 393, winners.length > 1 ? '橘點之間整段邊都是最佳解' : `最佳配方：餅乾 ${winners[0][0]} 批、蛋糕 ${winners[0][1]} 批`, { 'text-anchor': 'middle', 'font-size': 18, fill: k.C.ink });
        return { result: `${k.fmt(best)} 元`, detail: `比較 ${vertices.length} 個可行頂點。${winners.length > 1 ? '有多個同樣好的配方。' : '橘點同時滿足麵粉與烤箱限制。'}` };
      }
    }
  );
})();
