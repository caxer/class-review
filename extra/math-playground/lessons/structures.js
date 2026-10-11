// University concepts through manipulable geometry. Sources are attached to each lesson.
(() => {
  const PI = Math.PI, rad = d => d * PI / 180;
  const rot = (p, d) => [p[0] * Math.cos(rad(d)) - p[1] * Math.sin(rad(d)), p[0] * Math.sin(rad(d)) + p[1] * Math.cos(rad(d))];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const txt = (k, x, y, t, color = k.C.ink, size = 13) => k.text(x, y, t, { fill: color, 'font-size': size });
  const footer = (k, a, b) => { k.box(18, 368, 564, 66, { fill: k.C.paper }); txt(k, 30, 391, a, k.C.ink, 14); txt(k, 30, 414, b, k.C.muted, 12); };
  const plane = (k, cx = 300, cy = 196, s = 42, range = 3) => {
    const X = x => cx + x * s, Y = y => cy - y * s;
    for (let q = -range; q <= range; q++) { k.line(X(q), Y(-range), X(q), Y(range), k.C.grid, { 'stroke-width': 1 }); k.line(X(-range), Y(q), X(range), Y(q), k.C.grid, { 'stroke-width': 1 }); }
    k.line(X(-range), cy, X(range), cy, k.C.axis); k.line(cx, Y(-range), cx, Y(range), k.C.axis);
    return { X, Y, point: p => [X(p[0]), Y(p[1])] };
  };
  const arrow = (k, p, a, b, c) => k.arrow(...p.point(a), ...p.point(b), c, 3);
  const linearSource = 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/';
  const sourceSVD = 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/positive-definite-matrices-and-applications/singular-value-decomposition/';
  const teaching = (connect, activity, ask, myth) => ({ grade: '國小高年級可探索；正式內容為大學數學', connect, activity, ask, myth });
  const question = (q, options, answer, why, hint) => ({ question: q, options, answer, why, hint });
  MP.register(
    {
      id: 'basis', track: 'linear', symbol: '🧱', name: '基底與線性獨立', question: '兩支方向箭頭，能走遍整張地圖嗎？',
      title: '選兩種基本步伐，把整張地圖走出來',
      intro: '想像機器人只會照兩支箭頭走，可以走很多步，也可以倒著走。只要兩支箭頭沒有躺在同一條直線上，就能組出地圖上的任何位置。這組剛剛好的基本步伐，叫做<b>基底</b>。把箭頭轉成同一直線，整張地圖就突然縮成一條路！',
      scene: '地圖上的基底與張成空間', viewH: 450,
      chart: '藍色與綠色為基底箭頭，淡色網格為它們組成的新座標；紅點是指定目的地。',
      caption: '固定第一支箭頭 (1,0)，第二支為 (cos θ,sin θ)。目的地固定 (1,1)。數值在 θ 接近 0° 時會變大，表示這組步伐很難穩定使用。',
      controls: [['angle', '第二支箭頭的角度', 0, 180, 5, 60, '°'], ['a', '第一種步伐', -2, 2, 0.25, 1, '步'], ['b', '第二種步伐', -2, 2, 0.25, 1, '步']],
      try: '先把兩種步伐都設成 1，再將角度從 90° 轉到 0°。觀察整張網格為什麼壓成一條線。',
      resultLabel: '兩支箭頭能到達的空間', takeaway: '基底要能組出整個空間，也不能有一支箭頭是多餘的。',
      application: '電腦圖學更換座標、機器手臂定位、訊號分解與線性方程，都要選擇能描述空間的基底。',
      formula: 'B = [b₁ b₂]，x = Bc；det B = sin θ。若 det B ≠ 0，c = B⁻¹x 唯一。',
      formal: '在實數平面中允許任意實數係數，包含負數。圖上的有限網格只是張成空間的一小部分。θ=0° 或 180° 時兩向量線性相依，秩為 1；其他角度秩為 2。目的地 (1,1) 的係數為 c₂=1/sin θ、c₁=1−cot θ。',
      quiz: [question('兩支箭頭方向相同，只是長度不同，能成為平面的基底嗎？', ['可以', '不可以', '長度大就可以'], 1, '它們只能在同一條直線上來回，無法到達旁邊。', '想像兩條鐵軌完全重疊。'), question('基底一定要互相垂直嗎？', ['一定', '不一定，沒有共線即可', '必須一樣長'], 1, '平面的兩個非共線向量就是一組基底；垂直只是比較好算。', '試試 60° 的網格。')],
      teach: teaching('方向、走幾步與倒退', '用兩支不同方向的筷子當基本步伐，沿它們移動棋子。再把筷子排成一直線。', ['什麼位置突然走不到？', '同一目的地換一組步伐，步數會變嗎？'], '基底不是固定的東西；同一空間有很多組基底。'),
      tech: [['🦾', '機器人座標', '用不同關節與工具的座標描述同一位置。'], ['🎨', '電腦圖學', '將模型座標換成相機座標，必須追蹤基底如何改變。']], related: ['vector', 'matrix', 'projection', 'svd'], sources: [linearSource],
      draw(k, v) {
        const p = plane(k, 300, 194, 39, 4), u = [1, 0], w = rot(u, v.angle), det = w[1];
        const g = k.sub(k.clip(110, 36, 380, 310));
        for (let j = -5; j <= 5; j++) {
          g.line(...p.point([j - 5 * w[0], -5 * w[1]]), ...p.point([j + 5 * w[0], 5 * w[1]]), k.C.green, { opacity: .25, 'stroke-width': 1 });
          g.line(...p.point([-5 + j * w[0], j * w[1]]), ...p.point([5 + j * w[0], j * w[1]]), k.C.blue, { opacity: .25, 'stroke-width': 1 });
        }
        const end = [v.a + v.b * w[0], v.b * w[1]];
        arrow(k, p, [0, 0], u, k.C.blue); arrow(k, p, [0, 0], w, k.C.green);
        arrow(k, p, [0, 0], [v.a, 0], k.C.blue); arrow(k, p, [v.a, 0], end, k.C.green);
        k.circle(...p.point(end), 7, k.C.purple); k.circle(...p.point([1, 1]), 6, k.C.coral); txt(k, 18, 22, '紅點：目的地 (1,1)　紫點：目前走到的位置');
        const full = Math.abs(det) > 1e-8;
        footer(k, `det B = ${k.fmt(det)}　${full ? '能走遍平面：秩 2' : '只能走一條線：秩 1'}`, `目前位置 (${k.fmt(end[0])}, ${k.fmt(end[1])})`);
        return { result: full ? '平面：兩支箭頭線性獨立' : '直線：兩支箭頭線性相依', detail: full ? `到紅點需要第一種步伐 ${k.fmt(1 - w[0] / det)} 步、第二種 ${k.fmt(1 / det)} 步。係數可為負數。` : '紅點不在這條線上，無論走幾步都到不了。' };
      }
    },
    {
      id: 'projection', track: 'linear', symbol: '🔦', name: '正交投影與最小平方', question: '只能停在軌道上，哪個位置離玩具最近？',
      title: '幫玩具找最近的影子：最小平方的幾何',
      intro: '桌上有一個玩具，但小火車只能停在直直的軌道上。哪一站離玩具最近？從玩具向軌道垂直落下來的地方，就是<b>正交投影</b>。電腦替資料找最合適的答案，也常在做一樣的事：把到不了的目標，換成能做到、又最接近的影子。',
      scene: '點到直線的最小平方問題', viewH: 450, chart: '紅點是目標，綠點是最佳投影，紫點是你選的候選位置；虛線顯示誤差。',
      caption: '拖動下面的 x、y 滑桿移動目標。方向 u 的長度固定為 1；兩座標誤差的平方相加，等於圖上距離的平方。',
      controls: [['x', '玩具的左右位置', -2.5, 2.5, .1, 1, ''], ['y', '玩具的上下位置', -2.5, 2.5, .1, 2, ''], ['angle', '軌道角度', 0, 180, 5, 30, '°'], ['t', '候選位置：沿軌道走幾步', -3, 3, .1, 1, '']],
      try: '把紫點移到綠點附近，觀察誤差平方和降低。把玩具移動到軌道另一邊，影子會跟著跑到哪裡？',
      resultLabel: '最小誤差平方和', takeaway: '最佳近似的誤差與可移動的方向垂直，這是最小平方法的核心。',
      application: '用直線擬合資料、從雜訊估計訊號、把高維資料壓到子空間，都可以用投影來理解。',
      formula: 't* = uᵀy（‖u‖=1），p=uuᵀy；minₜ‖tu−y‖²。一般最小平方：AᵀAĉ=Aᵀy。',
      formal: '本圖是只有一個未知係數 t 的最小平方：兩筆觀測 y₁、y₂，設計矩陣 A 為一欄 u。因 u 是單位向量，t*=uᵀy。一般直線迴歸 y≈a+bx 要把所有觀測排成高維向量，A 的兩欄為 1 與 x；當 A 的欄向量線性獨立時解唯一。圖上的距離是歐氏距離，誤差沒有加權。',
      quiz: [question('最接近玩具的軌道位置，有什麼特徵？', ['誤差線垂直軌道', '一定是原點', '誤差線平行軌道'], 0, '若還有沿軌道的誤差，就能再移動一點讓距離縮短。', '看綠點與紅點間的虛線。'), question('最小平方把哪個量加起來？', ['誤差的平方', '所有點的名字', '誤差正負互相抵消'], 0, '平方避免正負誤差互相抵消，且有清楚的幾何意義。', '距離平方等於兩方向誤差平方相加。')],
      teach: teaching('距離與垂直', '在紙上畫軌道與軌道外一點，用直尺比較五個候選位置的距離。', ['最近點為什麼不是固定的原點？', '兩個方向的誤差會互相抵消嗎？'], '普通線性迴歸最小化垂直於 x 軸的殘差平方；它的「正交」發生在觀測向量空間。'),
      tech: [['📏', '校準感測器', '利用多次測量找最能解釋資料的參數。'], ['📡', '訊號估計', '將收到的訊號投影到已知訊號形成的子空間。']], related: ['basis', 'gradient', 'pca', 'svd'], sources: [linearSource],
      draw(k, v) {
        const p = plane(k, 300, 190, 44, 3), u = rot([1, 0], v.angle), y = [v.x, v.y], t = dot(u, y), best = u.map(a => a * t), pick = u.map(a => a * v.t);
        k.line(...p.point(u.map(a => -3.4 * a)), ...p.point(u.map(a => 3.4 * a)), k.C.blue, { 'stroke-width': 4 });
        k.line(...p.point(y), ...p.point(pick), k.C.purple, { 'stroke-dasharray': '5 5' }); k.line(...p.point(y), ...p.point(best), k.C.green, { 'stroke-width': 3 });
        k.circle(...p.point(pick), 8, k.C.purple); k.circle(...p.point(best), 6, k.C.green); k.circle(...p.point(y), 7, k.C.coral);
        txt(k, 20, 23, '紅：玩具　綠：最近的影子　紫：你選的位置');
        const err = (pick[0] - y[0]) ** 2 + (pick[1] - y[1]) ** 2, min = (best[0] - y[0]) ** 2 + (best[1] - y[1]) ** 2;
        footer(k, `你的誤差平方和 ${k.fmt(err)}　最小值 ${k.fmt(min)}`, `最佳步數 t* = ${k.fmt(t)}；多出來的誤差 = (t − t*)² = ${k.fmt(err - min)}`);
        return { result: k.fmt(min), detail: `最佳投影 (${k.fmt(best[0])}, ${k.fmt(best[1])})。你選的位置多出 ${k.fmt(err - min)} 的平方誤差。誤差與 u 的內積為 ${k.fmt(dot([y[0] - best[0], y[1] - best[1]], u))}。` };
      }
    },
    {
      id: 'svd', track: 'linear', symbol: '🌀', name: '奇異值分解 SVD', question: '複雜的變形，可以拆成三個簡單動作嗎？',
      title: '轉一轉、拉一拉、再轉一轉',
      intro: '一台神奇影印機把圓形貼紙變成斜斜的橢圓。它的動作看起來很複雜，其實可以拆開：先轉方向，再沿兩條互相垂直的方向伸縮，最後再轉一次。<b>奇異值分解</b>幫我們找出這些動作；伸縮倍數就是奇異值。',
      scene: '用三步構成二維矩陣變換', viewH: 450, chart: '三張小圖依序顯示 Vᵀ、Σ、U 的結果。彩色箭頭是一開始向右的同一支箭頭。',
      caption: '本例構造 A=R(φ) diag(σ₁,σ₂) R(−θ)，是正行列式矩陣的一族。一般 SVD 的正交變換也可能包含鏡射。',
      controls: [['theta', '輸入方向 θ', -90, 90, 5, 30, '°'], ['s1', '第一方向伸長 σ₁', 1, 2.5, .1, 2, '倍'], ['s2', '第二方向伸長 σ₂', 0, 1, .1, .5, '倍'], ['phi', '最後旋轉 φ', -90, 90, 5, 45, '°']],
      try: '把 σ₂ 降到 0：整個圓會被壓成一條線。再旋轉 θ 和 φ，辨認哪個改變輸入方向、哪個改變輸出方向。',
      resultLabel: '奇異值與秩', takeaway: '任何實矩陣都能拆成正交變換、沿軸伸縮、再正交變換。零奇異值表示某個方向被壓掉。',
      application: 'SVD 能找資料的重要方向、分析方程是否穩定、壓縮影像，也是 PCA 與低秩近似的重要工具。',
      formula: 'A=UΣVᵀ；Σ=diag(σ₁,σ₂)，σ₁≥σ₂≥0；AᵀA=VΣ²Vᵀ。',
      formal: 'U、V 為正交矩陣，保留長度與角度；奇異值是 AᵀA 特徵值的非負平方根。本例 U=R(φ)、V=R(θ)，由滑桿構造精確 SVD，並非數值估計任意輸入矩陣。σ₂=0 時秩 1；σ₂>0 時秩 2。',
      quiz: [question('哪一步改變箭頭的長度？', ['只旋轉', '沿軸伸縮 Σ', '改名字'], 1, '正交變換保留長度，伸縮則乘上奇異值。', '看第二張圖。'), question('第二個奇異值為 0 會怎樣？', ['平面變成一條線', '所有點都消失', '仍能反推每個輸入'], 0, '一個方向被壓掉，所以不同輸入可能得到同一輸出。', '把 σ₂ 拉到最左邊。')],
      teach: teaching('旋轉、放大與壓扁', '在透明片上畫圓與兩支箭頭，模擬旋轉，再想像橫向拉長、縱向壓扁。', ['為什麼圓旋轉後外形沒變？', '箭頭的方向仍然會變嗎？'], '奇異值不是一般矩陣的特徵值；它們永遠非負。'),
      tech: [['🧮', '穩定解方程', '很小的奇異值提醒我們輸入誤差可能被大幅放大。'], ['🖼️', '影像壓縮', '保留較大的奇異值與相應方向，可建立低秩近似。']], related: ['basis', 'projection', 'pca', 'lora'], sources: [sourceSVD],
      draw(k, v) {
        const transforms = [p => rot(p, -v.theta), p => { const q = rot(p, -v.theta); return [q[0] * v.s1, q[1] * v.s2]; }, p => { const q = rot(p, -v.theta); return rot([q[0] * v.s1, q[1] * v.s2], v.phi); }];
        ['① Vᵀ：先轉輸入', '② Σ：沿軸伸縮', '③ U：再轉輸出'].forEach((name, i) => {
          const cx = 103 + i * 197, cy = 192, scale = 31;
          k.box(7 + i * 197, 37, 190, 295, { title: name });
          k.line(cx - 83, cy, cx + 83, cy, k.C.grid); k.line(cx, cy - 83, cx, cy + 83, k.C.grid);
          const map = p => [cx + p[0] * scale, cy - p[1] * scale], f = transforms[i];
          k.polyline(Array.from({ length: 121 }, (_, j) => map(f([Math.cos(j * PI / 60), Math.sin(j * PI / 60)]))), k.C.blue);
          for (const [p, c] of [[[1, 0], k.C.coral], [[0, 1], k.C.green]]) k.arrow(cx, cy, ...map(f(p)), c, 3);
          txt(k, 20 + i * 197, 305, i === 0 ? '圓沒變，箭頭轉了' : i === 1 ? `伸縮 ${v.s1}、${v.s2} 倍` : `最後轉 ${v.phi}°`, k.C.muted, 12);
        });
        const e1 = transforms[2]([1, 0]), e2 = transforms[2]([0, 1]);
        footer(k, `A = [ ${k.fmt(e1[0])}  ${k.fmt(e2[0])} ; ${k.fmt(e1[1])}  ${k.fmt(e2[1])} ]`, `面積倍率 |det A| = σ₁σ₂ = ${k.fmt(v.s1 * v.s2)}`);
        return { result: `(${k.fmt(v.s1)}, ${k.fmt(v.s2)})；秩 ${v.s2 === 0 ? 1 : 2}`, detail: v.s2 === 0 ? '第二方向完全壓扁，無法從輸出唯一還原輸入。' : `最大與最小伸縮倍率之比為 ${k.fmt(v.s1 / v.s2)}。比例越大，反推輸入通常越敏感。` };
      }
    },
    {
      id: 'pca', track: 'linear', symbol: '📸', name: '主成分分析 PCA', question: '只能拍一條影子，哪個方向最看得出差別？',
      title: '旋轉相機，保留積木之間最多的差異',
      intro: '一群積木散在桌上，你只能留下它們在一條線上的影子。從某個方向看，大家擠在一起；換個方向，影子就分得很開。<b>主成分分析</b>尋找影子差異最大的方向，用少一點數字保存資料裡比較多的變化。',
      scene: '中心化資料的一維投影', viewH: 450, chart: '藍點是資料，紫色線是相機選的投影方向，淡線連到各點的影子。右方比較保留的變異。',
      caption: '資料先減掉平均位置。這裡以 1/n 定義共變異數；換成 1/(n−1) 不會改變主成分方向。',
      controls: [['angle', '相機方向', 0, 180, 5, 30, '°'], ['tilt', '資料群的方向', 0, 180, 5, 60, '°'], ['spread', '資料群的厚度', .1, 1.5, .1, .4, '']],
      try: '轉動相機，讓保留比例最大，再把資料群變厚。當所有方向一樣寬，還有唯一的最佳相機方向嗎？',
      resultLabel: '投影保留的變異', takeaway: 'PCA 選擇變異最大的方向；中心化後，這也等於讓投影重建的平方誤差最小。',
      application: '用少數座標摘要大量量測、視覺化資料、去除部分雜訊；各欄單位不同時常需先考慮標準化。',
      formula: 'C=(1/n)Σxᵢxᵢᵀ；var(uᵀx)=uᵀCu。第一主成分：Cu₁=λ₁u₁，λ₁=max‖u‖=1 uᵀCu。',
      formal: '本例用均勻取樣的橢圓點，長半軸 1.5、短半軸 s≤1.5，再旋轉 tilt。共變異數特徵值恰為 1.5²/2 與 s²/2；s=1.5 時兩特徵值相同，第一主成分方向不唯一。PCA 保留變異，不保證保留與分類任務最相關的資訊。',
      quiz: [question('PCA 第一個方向想保留什麼？', ['最大的投影變異', '最多的顏色', '一定選水平線'], 0, '把資料投影後分得最開的單位方向，是第一主成分。', '找右邊最高的保留比例。'), question('資料形成正圓時，最佳方向會怎樣？', ['只有向右最好', '每個方向一樣好', '沒有任何影子'], 1, '各方向的變異相等，所以最佳方向不唯一。', '把厚度設成 1.5。')],
      teach: teaching('影子、平均與資料分散程度', '用豆子排成斜斜的長條，轉動一支尺，將豆子投影到尺上。', ['哪個方向的影子最分散？', '壓成一條線失去了什麼？'], 'PCA 找到的是資料的變化方向，不是自動找到因果關係。'),
      tech: [['📊', '量測摘要', '將多個相關的感測數值變成少量主成分座標。'], ['🧬', '資料視覺化', '以主要變化方向展示高維資料，並標明保留多少變異。']], related: ['projection', 'eigen', 'svd', 'embedding'], sources: [linearSource, sourceSVD],
      draw(k, v) {
        const p = plane(k, 210, 190, 74, 2), u = rot([1, 0], v.angle), pts = Array.from({ length: 24 }, (_, i) => rot([1.5 * Math.cos(i * PI / 12), v.spread * Math.sin(i * PI / 12)], v.tilt));
        k.line(...p.point(u.map(x => -2 * x)), ...p.point(u.map(x => 2 * x)), k.C.purple, { 'stroke-width': 3 });
        let variance = 0, total = 0;
        pts.forEach(q => { const t = dot(q, u), foot = u.map(x => x * t); variance += t * t / pts.length; total += dot(q, q) / pts.length; k.line(...p.point(q), ...p.point(foot), k.C.axis, { opacity: .5, 'stroke-width': 1 }); k.circle(...p.point(q), 4, k.C.blue); k.circle(...p.point(foot), 3, k.C.purple); });
        const ratio = variance / total, best = 1.125 / total;
        k.box(407, 62, 175, 260, { title: '保留變異比例' });
        k.rect(434, 111, 38, 155, k.C.purpleSoft); k.rect(434, 266 - ratio * 155, 38, ratio * 155, k.C.purple);
        k.rect(506, 111, 38, 155, k.C.greenSoft); k.rect(506, 266 - best * 155, 38, best * 155, k.C.green);
        txt(k, 425, 288, `${k.fmt(ratio * 100, 1)}%`, k.C.purple, 12); txt(k, 500, 288, `${k.fmt(best * 100, 1)}%`, k.C.green, 12);
        txt(k, 433, 308, '目前', k.C.muted, 12); txt(k, 503, 308, '最佳', k.C.muted, 12);
        footer(k, `投影變異 ${k.fmt(variance, 3)}　重建平均平方誤差 ${k.fmt(total - variance, 3)}`, v.spread === 1.5 ? '圓形資料：所有投影方向一樣好。' : `第一主成分方向：${v.tilt}°（相反方向等價）`);
        return { result: `${k.fmt(100 * ratio, 1)}%`, detail: `總變異 ${k.fmt(total, 3)} = 投影保留 ${k.fmt(variance, 3)} + 重建失去 ${k.fmt(total - variance, 3)}。最佳可保留 ${k.fmt(best * 100, 1)}%。` };
      }
    },
    {
      id: 'graph', track: 'discrete', symbol: '🗺️', name: '圖論與最短路徑', question: '路段最少，真的比較快到家嗎？',
      title: '外送員的選路挑戰：每條路都有時間',
      intro: '外送員要從 A 到 F。地圖上的點是路口，線是道路，數字是走這條路要幾分鐘。最近看起來很短的路，可能正在塞車。<b>圖論</b>把地圖變成點與連線，Dijkstra 演算法則一步步找出最早能到達的時間。',
      scene: '非負權重圖上的 Dijkstra 演算法', viewH: 450, chart: '綠線為目前路況下的最短路。金色點已確定最短時間；灰字 ∞ 表示尚未找到路。',
      caption: '道路可雙向通行，權重是固定的非負時間。步數 0 是初始化，步數 6 代表處理完全部路口。',
      controls: [['traffic', 'B–D 道路時間', 1, 15, 1, 8, '分鐘'], ['bridge', 'C–E 道路時間', 1, 15, 1, 2, '分鐘'], ['steps', '演算法處理幾個路口', 0, 6, 1, 6, '個']], play: 'steps',
      try: '先看完整答案，再把步數拉回 0，逐步前進。調低 B–D 的時間，觀察最佳路線何時改道。',
      resultLabel: 'A 到 F 的最短時間', takeaway: '最短路看的是所有路段的總成本；Dijkstra 每次確定目前暫定時間最小的未處理點。',
      application: '導航、網路封包路由、遊戲角色尋路、工作流程排程，都會遇到圖上的路徑問題。',
      formula: 'd(v) ← min(d(v), d(u)+w(u,v))；每步選未處理且 d 最小的 u。',
      formal: 'Dijkstra 要求所有邊權重非負。本例是 6 點、8 邊的無向連通圖，以簡單陣列選最小值，時間 O(V²+E)。若有負權重須換適合的演算法。步進圖顯示暫定距離；綠色完整最佳路徑只在第 6 步呈現。',
      quiz: [question('比較兩條路，應該比什麼？', ['路口數一定越少越好', '所有道路時間的總和', '畫得比較直就好'], 1, '權重代表旅行時間，最短路最小化的是總和。', '一條塞車道路可能比三條順暢道路更慢。'), question('Dijkstra 的基本保證需要什麼？', ['每條路時間非負', '所有道路一樣長', '只能有三個路口'], 0, '負權重可能讓已確定的距離後來再縮短，破壞此方法的保證。', '正常旅行時間不會是負數。')],
      teach: teaching('地圖與時間加總', '用繩子連接六張路口卡，寫上時間。每次挑暫定到達時間最小的卡更新鄰居。', ['為什麼不用試遍所有走法？', '一條路變慢，會影響哪些路口？'], '演算法找最小成本；成本可以是時間，不一定是地理距離。'),
      tech: [['🚚', '配送導航', '把預估道路時間當權重，重新計算路線。'], ['🌐', '網路路由', '把設備視為節點，依連線成本尋找傳送路徑。']], related: ['markov', 'eigen', 'modular'], sources: ['https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/'],
      draw(k, v) {
        const pts = [[55, 190], [205, 82], [205, 295], [385, 82], [385, 295], [540, 190]], names = 'ABCDEF';
        const edges = [[0, 1, 3], [0, 2, 5], [1, 2, 2], [1, 3, v.traffic], [2, 4, v.bridge], [3, 4, 2], [3, 5, 3], [4, 5, 6]];
        const solve = limit => {
          const d = [0, Infinity, Infinity, Infinity, Infinity, Infinity], prev = Array(6).fill(-1), done = Array(6).fill(false), order = [];
          for (let step = 0; step < limit; step++) {
            let u = -1; for (let i = 0; i < 6; i++) if (!done[i] && (u < 0 || d[i] < d[u])) u = i;
            if (u < 0 || !Number.isFinite(d[u])) break; done[u] = true; order.push(names[u]);
            edges.forEach(([a, b, w]) => { const n = a === u ? b : b === u ? a : -1; if (n >= 0 && !done[n] && d[u] + w < d[n]) { d[n] = d[u] + w; prev[n] = u; } });
          }
          return { d, prev, done, order };
        };
        const full = solve(6), now = solve(v.steps), route = [5]; while (route[route.length - 1] !== 0) route.push(full.prev[route[route.length - 1]]); route.reverse();
        const routeEdges = route.slice(1).map((n, i) => [route[i], n].sort().join('-'));
        edges.forEach(([a, b, w]) => { const active = v.steps === 6 && routeEdges.includes([a, b].sort().join('-')); k.line(...pts[a], ...pts[b], active ? k.C.green : k.C.axis, { 'stroke-width': active ? 6 : 2 }); const x = (pts[a][0] + pts[b][0]) / 2, y = (pts[a][1] + pts[b][1]) / 2; k.rect(x - 12, y - 12, 24, 22, '#fff', { rx: 5 }); txt(k, x - 5, y + 4, w, k.C.ink, 13); });
        pts.forEach(([x, y], i) => { k.circle(x, y, 22, now.done[i] ? k.C.yellowSoft : k.C.blueSoft, { stroke: now.done[i] ? k.C.yellow : k.C.blue, 'stroke-width': 2 }); k.text(x, y + 5, names[i], { 'text-anchor': 'middle', 'font-weight': 700 }); k.text(x, y + 42, Number.isFinite(now.d[i]) ? `${now.d[i]} 分` : '∞', { 'text-anchor': 'middle', fill: k.C.ink }); });
        footer(k, `已確定的順序：${now.order.join(' → ') || '還沒開始'}`, v.steps === 6 ? `最短路：${route.map(i => names[i]).join(' → ')}，共 ${full.d[5]} 分鐘` : '先選暫定時間最小的未處理路口，再更新它的鄰居。');
        return { result: v.steps === 6 ? `${full.d[5]} 分鐘` : `F 暫定：${Number.isFinite(now.d[5]) ? now.d[5] + ' 分鐘' : '尚未找到'}`, detail: v.steps === 6 ? `路線 ${route.map(i => names[i]).join(' → ')}。所有路段都以當前滑桿時間重新計算。` : `目前處理 ${v.steps} 個路口；暫定距離還可能縮短。` };
      }
    },
    {
      id: 'groups', track: 'structures', symbol: '🔄', name: '群論與對稱', question: '先翻再轉，和先轉再翻會一樣嗎？',
      title: '正方形的八種魔法，藏著一個群',
      intro: '把正方形卡片轉 90°，或像照鏡子一樣翻過去，外框都還是正方形。把角落貼上不同顏色，就能看出卡片究竟怎麼動。這些保留形狀的動作，可以接著做、可以倒回來，形成數學家說的<b>群</b>。',
      scene: '正方形的對稱群 D₄', viewH: 450, chart: '左邊固定先做 A 再做 B；右邊先做 B 再做 A。四色角落用來辨識原本是哪個角。',
      caption: 'R 是逆時針轉 90°，F 是左右鏡射；選單 RᵏF 表示先鏡射再旋轉。比較的是角落標記的位置。',
      controls: [{ key: 'a', label: '操作 A', options: ['不動 I', '轉 90° R', '轉 180° R²', '轉 270° R³', '鏡射 F', 'RF', 'R²F', 'R³F'], value: 1 }, { key: 'b', label: '操作 B', options: ['不動 I', '轉 90° R', '轉 180° R²', '轉 270° R³', '鏡射 F', 'RF', 'R²F', 'R³F'], value: 4 }],
      try: '比較 A=轉 90°、B=鏡射。再把 B 改成轉 180°，看看什麼時候順序不影響答案。',
      resultLabel: '兩種順序是否相同', takeaway: '群描述可以組合與還原的對稱操作；有些群的操作順序很重要。',
      application: '晶體與分子對稱、物理守恆、旋轉不變的辨識模型，都會利用群的語言。',
      formula: 'D₄={I,R,R²,R³,F,RF,R²F,R³F}；R⁴=I，F²=I，FR=R⁻¹F。',
      formal: '群的四個條件是封閉性、結合律、單位元與逆元。這裡以正方形頂點的置換表示對稱；函數複合由右至左讀，例如 BA 表示先 A 後 B。D₄ 有 8 個元素，是非交換群，但其中有些操作對仍可交換。',
      quiz: [question('連做兩次左右鏡射會怎樣？', ['回到原樣', '轉 90°', '角落消失'], 0, 'F²=I，所以鏡射本身就是自己的逆操作。', '拿一張有標記的紙試試。'), question('群一定可以交換操作順序嗎？', ['一定', '不一定', '只有旋轉能組合'], 1, '群要求結合律，但不要求交換律。正方形的旋轉與鏡射提供反例。', '比較兩張圖的同色角落。')],
      teach: teaching('旋轉與對稱', '在正方形四角貼四色貼紙，照兩種不同順序旋轉和翻面，記錄結果。', ['外框一樣，角落的位置也一樣嗎？', '哪個動作可以把剛才的操作還原？'], '結合律是改變括號；交換律是改變順序，兩者不同。'),
      tech: [['💎', '晶體結構', '以對稱群描述晶格中不改變結構的操作。'], ['🤖', '辨識模型', '讓模型對指定旋轉或反射具有一致的反應。']], related: ['modular', 'basis', 'topology'], sources: ['https://ocw.mit.edu/courses/18-701-algebra-i-fall-2010/'],
      draw(k, v) {
        const base = [[-1, 1], [1, 1], [1, -1], [-1, -1]], colors = [k.C.coral, k.C.blue, k.C.green, k.C.purple];
        const apply = (p, op) => rot(op >= 4 ? [-p[0], p[1]] : p, (op % 4) * 90);
        const left = base.map(p => apply(apply(p, v.a), v.b)), right = base.map(p => apply(apply(p, v.b), v.a));
        [left, right].forEach((points, panel) => { const cx = 153 + panel * 294, cy = 197, scale = 68; k.box(12 + panel * 294, 33, 282, 296, { title: panel ? '先 B，再 A（AB）' : '先 A，再 B（BA）' }); k.polygon(points.map(p => [cx + p[0] * scale, cy - p[1] * scale]), k.C.paper, { stroke: k.C.axis, 'stroke-width': 3 }); points.forEach((p, i) => { const x = cx + p[0] * scale, y = cy - p[1] * scale; k.circle(x, y, 16, colors[i]); k.text(x, y + 5, String(i + 1), { fill: '#fff', 'text-anchor': 'middle', 'font-weight': 700 }); }); });
        const same = left.every((p, i) => Math.hypot(p[0] - right[i][0], p[1] - right[i][1]) < 1e-8);
        footer(k, same ? '這一對操作可以交換順序。' : '這一對操作不能交換順序！', '看同色角落：相同的外框，可能藏著不同的角落排列。');
        return { result: same ? '相同：AB = BA' : '不同：AB ≠ BA', detail: `先 A 後 B 的角落座標：${left.map((p, i) => `${i + 1}→(${Math.round(p[0])},${Math.round(p[1])})`).join('；')}。` };
      }
    },
    {
      id: 'modular', track: 'structures', symbol: '🕰️', name: '模運算與有限體', question: '在數字轉盤上，乘法能倒著走嗎？',
      title: '數字繞圈圈：哪些乘法有回頭路？',
      intro: '時鐘走過 12 又回到 1。數學家把這種「超過一圈就重新數」叫做<b>模運算</b>。現在換成從 0 開始的數字轉盤：每個數都乘同一個數，再看餘數。有時大家只是換位置，有時幾個數卻擠到一起。這個差別，通往群、環與有限體。',
      scene: '餘數系統中的乘法映射', viewH: 450, chart: '每條箭頭由 x 指向 ax mod n。右表列出所有輸入與輸出；重複的輸出表示資訊被合併。',
      caption: '轉盤有 n 格，標為 0 到 n−1。乘數 a 也會先取模；a≡0 時所有箭頭都指向 0。',
      controls: [['n', '轉盤格數 n', 3, 12, 1, 7, '格'], ['a', '乘數 a', 0, 12, 1, 3, '']],
      try: '設 n=7，比較乘 2、3、6；再設 n=8、a=2。為什麼後者有些格子永遠收不到箭頭？',
      resultLabel: '乘法能不能還原', takeaway: 'a 與 n 互質時，乘 a 有唯一的回頭路。模質數 p 的所有非零數都可除，形成有限體。',
      application: '密碼學、錯誤更正碼、雜湊與週期排程都用到模運算；實際加密使用更大的數與專門的協定。',
      formula: 'ax ≡ y (mod n)；a 有乘法逆元 ⇔ gcd(a,n)=1。若 p 為質數，ℤ/pℤ 是有限體。',
      formal: '本例顯示整數模 n 的環。可逆餘數在乘法下形成群；只有 n 是質數時，整個 ℤ/nℤ 才是體。有限體也可以有 pᵏ 個元素，但 k>1 時不能直接用整數模 pᵏ 代替。當 d=gcd(a,n) 時，映射只有 n/d 個不同輸出。',
      quiz: [question('模 8 時乘 2，能唯一還原輸入嗎？', ['可以', '不行，0 和 4 都變成 0', '只要速度快就可以'], 1, '2×0 與 2×4 除以 8 的餘數都為 0。', '找兩條到達同一格的箭頭。'), question('模 7 時哪個數能把乘 3 還原？', ['乘 5', '乘 3', '乘 0'], 0, '3×5=15≡1 (mod 7)，所以 5 是 3 的乘法逆元。', '要找到乘起來餘 1 的數。')],
      teach: teaching('餘數與時鐘', '畫七格與八格轉盤，把每個數乘 2 後用線連到新位置。比較是否有人擠在一起。', ['輸出重複時，怎麼知道原本是哪個數？', '乘法的回頭路一定是一般除法嗎？'], '模合數也可能有可逆數；例如模 8 的 3 可逆，但 2 不可逆。'),
      tech: [['🔐', '密碼學', '在有限代數結構中設計容易正向計算、難以反推的問題。'], ['📀', '錯誤更正', '利用有限體設計編碼，從部分損壞的資料恢復訊息。']], related: ['groups', 'graph', 'entropy'], sources: ['https://ocw.mit.edu/courses/18-200-principles-of-discrete-applied-mathematics-spring-2024/mit18_200_s24_lec15.pdf'],
      draw(k, v) {
        const pos = i => [204 + 127 * Math.sin(2 * PI * i / v.n), 190 - 127 * Math.cos(2 * PI * i / v.n)], outputs = Array.from({ length: v.n }, (_, i) => (i * v.a) % v.n);
        outputs.forEach((j, i) => { if (i !== j) k.arrow(...pos(i), ...pos(j), k.C.blue, 1.4, { opacity: .35 }); else { const p = pos(i); k.circle(p[0], p[1], 23, 'none', { stroke: k.C.green, 'stroke-width': 2 }); } });
        outputs.forEach((_, i) => { const p = pos(i); k.circle(...p, 15, k.C.blueSoft, { stroke: k.C.blue }); k.text(p[0], p[1] + 5, i, { 'text-anchor': 'middle', fill: k.C.ink }); });
        k.box(387, 37, 195, 306, { title: `x → ${v.a}x mod ${v.n}` });
        outputs.forEach((j, i) => txt(k, 410 + (i >= 6 ? 85 : 0), 85 + (i % 6) * 37, `${i} → ${j}`, k.C.ink, 14));
        const gcd = (a, b) => b ? gcd(b, a % b) : a, d = gcd(v.a, v.n), inv = Array.from({ length: v.n }, (_, i) => i).find(i => i * v.a % v.n === 1), prime = Array.from({ length: v.n - 2 }, (_, i) => i + 2).every(i => v.n % i !== 0);
        footer(k, `gcd(${v.a}, ${v.n}) = ${d}　不同輸出 ${new Set(outputs).size}/${v.n}`, inv === undefined ? '多個輸入合併，乘法無法唯一還原。' : `逆元是 ${inv}：再乘 ${inv}，每個數都回到原位。`);
        return { result: d === 1 ? `可以：逆元 ${inv}` : '不可以：輸出發生碰撞', detail: `${v.n}${prime ? ' 是質數，非零餘數都可逆，這是一個有限體。' : ' 是合數，有些非零餘數不可逆，這個餘數環不是體。'}` };
      }
    },
    {
      id: 'topology', track: 'structures', symbol: '🍩', name: '拓撲與歐拉示性數', question: '把橡皮球拉長，有什麼數字始終不變？',
      title: '數點、數邊、數面，找出形狀的祕密',
      intro: '橡皮球可以捏長、壓扁，但不剪開也不黏接，就不會變成甜甜圈。<b>拓撲</b>研究這種拉來拉去也不變的特徵。把表面鋪滿小三角形，算「頂點−邊＋面」，球面總是 2，甜甜圈面總是 0；網格變細也不會改變答案。',
      scene: '封閉曲面的三角網格與歐拉示性數', viewH: 450, chart: '左邊顯示球面或甜甜圈面的三角網格，右邊計算頂點 V、邊 E、面 F。',
      caption: '數的是整個表面，包含背面的三角形。透明網格方便看連接，不代表剪開表面。只拉伸，不合併頂點或產生新洞。',
      controls: [{ key: 'shape', label: '曲面', options: ['球面：沒有把手', '甜甜圈面：一個把手'], value: 0 }, ['mesh', '環向網格分段 n', 6, 18, 2, 10, ''], ['stretch', '左右拉伸', .6, 1.4, .1, 1, '倍']],
      try: '增加網格密度，再左右拉伸。哪些數字變了？哪個組合始終不變？最後把球面換成甜甜圈面。',
      resultLabel: '歐拉示性數 χ', takeaway: '形狀的大小與胖瘦可以改變，但不剪、不黏的連續變形不會改變拓撲。',
      application: '檢查三維模型是否有破洞、分析資料的連通與洞、理解曲面分類，都會使用拓撲不變量。',
      formula: 'χ = V − E + F；封閉、連通、可定向曲面：χ=2−2g。',
      formal: 'g 是曲面的把手數（虧格）。此公式需封閉且可定向；帶邊界或不可定向曲面需另外處理。本例球面採 n 個經度、m=6 段緯度：V=2+n(m−1)、E=3n(m−1)、F=2n(m−1)。甜甜圈採 n×m 週期網格，每格切兩個三角形：V=nm、E=3nm、F=2nm。',
      quiz: [question('把球面三角網格切得更細，χ 會怎樣？', ['仍為 2', '一直變大', '變成 0'], 0, '新增頂點、邊、面的數量會互相抵銷，V−E+F 不變。', '試著增加網格分段。'), question('球面與甜甜圈面可只靠拉伸互變嗎？', ['可以', '不可以，拓撲不同', '只要拉大一點'], 1, '兩者 χ 不同；要改變把手數，必須發生剪開或黏接等改變。', '比較右側的 χ。')],
      teach: teaching('頂點、邊與面', '拿紙盒數 V、E、F，再把每個方形面畫一條對角線；比較 V−E+F。', ['新增一條對角線，同時新增了什麼？', '拉長紙盒會增加一個洞嗎？'], '甜甜圈的洞指把手所圍出的通道，不是把表面戳破的破洞。'),
      tech: [['🧩', '三維模型檢查', '利用網格連接與拓撲數量發現異常的面或破洞。'], ['🔎', '資料形狀', '持續同調追蹤資料在不同尺度下的連通與洞。']], related: ['groups', 'curvature', 'graph'], sources: ['https://people.eecs.berkeley.edu/~sequin/CS284/TEXT/surf.class.html'],
      draw(k, v) {
        const n = v.mesh, m = 6, verts = [], faces = [], project = p => [202 + 78 * v.stretch * (p[0] + .25 * p[1]), 195 + 78 * (.45 * p[1] - .85 * p[2])];
        if (v.shape === 0) {
          verts.push([0, 0, 1.5]);
          for (let j = 1; j < m; j++) for (let i = 0; i < n; i++) { const a = i * 2 * PI / n, b = j * PI / m; verts.push([1.5 * Math.sin(b) * Math.cos(a), 1.5 * Math.sin(b) * Math.sin(a), 1.5 * Math.cos(b)]); }
          const south = verts.length; verts.push([0, 0, -1.5]);
          const id = (i, j) => 1 + (j - 1) * n + (i % n);
          for (let i = 0; i < n; i++) { faces.push([0, id(i, 1), id(i + 1, 1)], [south, id(i + 1, m - 1), id(i, m - 1)]); for (let j = 1; j < m - 1; j++) { const a = id(i, j), b = id(i + 1, j), c = id(i + 1, j + 1), d = id(i, j + 1); faces.push([a, b, c], [a, c, d]); } }
        } else {
          for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) { const a = i * 2 * PI / n, b = j * 2 * PI / m, r = 1.12 + .43 * Math.cos(b); verts.push([r * Math.cos(a), r * Math.sin(a), .43 * Math.sin(b)]); }
          const id = (i, j) => (j % m) * n + i % n;
          for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) { const a = id(i, j), b = id(i + 1, j), c = id(i + 1, j + 1), d = id(i, j + 1); faces.push([a, b, c], [a, c, d]); }
        }
        const edges = new Set(); faces.forEach(f => f.forEach((a, i) => edges.add([a, f[(i + 1) % 3]].sort((a, b) => a - b).join(','))));
        faces.sort((a, b) => a.reduce((s, i) => s + verts[i][1], 0) - b.reduce((s, i) => s + verts[i][1], 0)).forEach(f => k.polygon(f.map(i => project(verts[i])), k.C.blueSoft, { stroke: k.C.blue, 'stroke-width': .75, 'fill-opacity': .2, 'stroke-opacity': .55 }));
        const V = verts.length, E = edges.size, F = faces.length, chi = V - E + F;
        k.box(413, 49, 168, 282, { title: '整個網格的計數' }); [['頂點 V', V], ['邊 E', E], ['三角面 F', F], ['V − E + F', chi]].forEach(([label, value], i) => { txt(k, 426, 95 + 58 * i, label, k.C.muted, 12); txt(k, 426, 117 + 58 * i, String(value), i === 3 ? k.C.green : k.C.ink, 20); });
        footer(k, `χ = ${V} − ${E} + ${F} = ${chi}`, `把手數 g = ${v.shape}；2 − 2g = ${2 - 2 * v.shape}。拉伸不改變連接。`);
        return { result: String(chi), detail: `程式從實際三角形清單計算 ${V} 個頂點、${E} 條不重複的邊與 ${F} 個面。${v.shape ? '甜甜圈面' : '球面'}的歐拉示性數不隨網格密度或拉伸改變。` };
      }
    },
    {
      id: 'curvature', track: 'structures', symbol: '🥣', name: '曲率與曲面幾何', question: '碗底與馬鞍都彎彎的，哪裡不一樣？',
      title: '兩個方向一起看，才知道曲面怎麼彎',
      intro: '在碗底放一顆小珠子，往前後左右都是上坡。換成馬鞍，中間沿一個方向像山谷，另一方向卻像山頂。<b>高斯曲率</b>把兩個主要方向的彎曲相乘，分辨碗形、平坦與馬鞍形。這是微分幾何研究曲面的起點。',
      scene: '二次曲面原點的主曲率與高斯曲率', viewH: 450, chart: '藍線與紅線是穿過原點的兩條主方向截線；淡色網格呈現局部曲面，中央黑點是量測位置。',
      caption: '圖形 z=(a x²+b y²)/2；固定觀察原點。向上的法向量下，原點主曲率為 a、b。視角只為呈現曲面，不改變計算。',
      controls: [['a', '左右方向的彎曲 a', -1, 1, .1, .7, ''], ['b', '前後方向的彎曲 b', -1, 1, .1, -.7, '']],
      try: '先讓 a、b 一正一負，再讓兩個都正，最後將其中一個設為 0。比較曲面的形狀與 K 的正負。',
      resultLabel: '原點的高斯曲率 K', takeaway: '曲面有很多彎曲方向。兩個主曲率的乘積分辨同向彎、反向彎與其中一向不彎。',
      application: '曲面建模、地圖投影、機器視覺與廣義相對論都要描述彎曲；曲率也把局部幾何連到整體拓撲。',
      formula: 'K(0,0)=k₁k₂=ab；K(x,y)=ab/[1+a²x²+b²y²]²。',
      formal: '對 Monge 曲面 z=f(x,y)，K=(fₓₓfᵧᵧ−fₓᵧ²)/(1+fₓ²+fᵧ²)²。此例 f=(ax²+by²)/2，原點切平面水平，主曲率為 a、b（向上法向）。K=0 不代表曲面完全平坦，例如 a≠0、b=0 是可彎成紙筒一樣的可展曲面。封閉曲面有 Gauss–Bonnet 關係 ∫K dA=2πχ；本圖只是帶邊界的局部片段，不能直接套封閉曲面公式。',
      quiz: [question('馬鞍形原點的高斯曲率是哪一種？', ['負', '正', '一定是 0'], 0, '兩個主方向一個向上彎、一個向下彎，相乘為負。', '設定 a=0.7、b=−0.7。'), question('K=0 就表示曲面每個方向都不彎嗎？', ['是', '不是，可能只有一方向不彎', '一定有洞'], 1, '只要一個主曲率為 0，乘積就是 0；另一方向仍然可以彎。', '把 b 設 0，a 保持 1。')],
      teach: teaching('山頂、山谷與彎曲', '把紙彎成筒，再試著不拉伸紙就貼平球面；比較兩種彎曲。', ['為什麼馬鞍同時像山頂又像山谷？', '只看一條截線，夠不夠知道曲面形狀？'], '高斯曲率為零和所有彎曲為零不同；曲率的量綱也不是角度。'),
      tech: [['🖥️', '曲面建模', '曲率幫助檢查外殼是否平滑，避免不自然的突起。'], ['🌍', '地圖投影', '球面有正高斯曲率，無法在保留所有局部距離下攤成平面。']], related: ['topology', 'partial', 'double'], sources: ['https://people.eecs.berkeley.edu/~sequin/CS284/TEXT/surf.class.html'],
      draw(k, v) {
        const f = (x, y) => (v.a * x * x + v.b * y * y) / 2, project = (x, y) => [300 + 91 * (x + .55 * y), 200 + 48 * y - 81 * f(x, y)];
        const g = k.sub(k.clip(30, 33, 540, 312));
        for (let j = -6; j <= 6; j++) { const t = j / 5; g.polyline(Array.from({ length: 61 }, (_, i) => project(-1.2 + 2.4 * i / 60, t)), k.C.axis, { 'stroke-width': 1, opacity: .55 }); g.polyline(Array.from({ length: 61 }, (_, i) => project(t, -1.2 + 2.4 * i / 60)), k.C.axis, { 'stroke-width': 1, opacity: .55 }); }
        g.polyline(Array.from({ length: 61 }, (_, i) => project(-1.2 + 2.4 * i / 60, 0)), k.C.blue, { 'stroke-width': 4 }); g.polyline(Array.from({ length: 61 }, (_, i) => project(0, -1.2 + 2.4 * i / 60)), k.C.coral, { 'stroke-width': 4 });
        k.circle(...project(0, 0), 6, k.C.ink); txt(k, 24, 23, '藍：左右方向　紅：前後方向　黑點：原點');
        const K = v.a * v.b, type = Math.abs(K) < 1e-9 ? (v.a === 0 && v.b === 0 ? '平面' : '一個方向不彎') : K > 0 ? '碗形／帽形：兩方向同向彎' : '馬鞍形：兩方向反向彎';
        footer(k, `k₁=${k.fmt(v.a, 1)}，k₂=${k.fmt(v.b, 1)}；K=${k.fmt(K)}`, type);
        return { result: k.fmt(K), detail: `原點主曲率乘積 ${k.fmt(v.a, 1)} × ${k.fmt(v.b, 1)} = ${k.fmt(K)}。${type}。離開原點時，高斯曲率按公式改變，圖上顯示的值只屬於中央黑點。` };
      }
    }
  );
})();
