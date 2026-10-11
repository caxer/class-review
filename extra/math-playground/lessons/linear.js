// 線性代數：向量、矩陣、特徵值與特徵向量。
(() => {
  // ───────────────────────── 向量：無人機遇到側風 ─────────────────────────
  const WINDS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const bearing = (x, y, fmt) => {
    if (Math.hypot(x, y) < 1e-9) return '原地不動';
    const ang = Math.atan2(x, y) * 180 / Math.PI, abs = Math.abs(ang), side = ang > 0 ? '東' : '西';
    if (abs < 0.05) return '正北';
    if (abs > 179.95) return '正南';
    if (Math.abs(abs - 90) < 0.05) return `正${side}`;
    return abs < 90 ? `北偏${side} ${fmt(abs, 1)}°` : `南偏${side} ${fmt(180 - abs, 1)}°`;
  };

  // ───────────────────────── 矩陣：手機修圖濾鏡 ─────────────────────────
  const N = 20;
  const pixelAt = (x, y) => {
    if ((x - 15) ** 2 + (y - 4) ** 2 <= 5) return [255, 210, 80];
    if ((y === 3 && x >= 3 && x <= 7) || (y === 4 && x >= 2 && x <= 8)) return [245, 248, 250];
    if (y >= 8 && y <= 10 && Math.abs(x - 6) <= (y - 7) * 1.5) return [205, 60, 50];
    if (y >= 11 && y <= 15 && x >= 3 && x <= 9) {
      if (x >= 5 && x <= 6 && y >= 13) return [120, 72, 40];
      if (x === 8 && (y === 12 || y === 13)) return [150, 205, 235];
      return [240, 220, 170];
    }
    if ((x === 12 && y === 17) || (x === 17 && y === 18) || (x === 15 && y === 16)) return [250, 120, 170];
    if (y >= 18) return [70, 140, 80];
    if (y >= 15) return [95, 175, 95];
    if (y >= 7 + Math.abs(x - 14) * 0.9) return [80, 120, 150];
    return [110 + 3 * y, 180 + 2 * y, 230 - y];
  };
  const PICTURE = Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => pixelAt(x, y)));
  const LUM = [0.299, 0.587, 0.114];
  const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const SAT = 1.6;
  const FILTERS = [
    { name: '原色', m: I3 },
    { name: '黑白', m: [LUM, LUM, LUM] },
    { name: '懷舊', m: [[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]] },
    { name: '鮮豔', m: I3.map(row => row.map((d, j) => SAT * d + (1 - SAT) * LUM[j])) },
    { name: '紅藍交換', m: [[0, 0, 1], [0, 1, 0], [1, 0, 0]] }
  ];
  const PICKS = [[15, 4], [6, 9], [3, 8], [14, 17]];
  const clamp255 = v => Math.max(0, Math.min(255, Math.round(v)));
  const rgb = c => `rgb(${c.map(clamp255).join(',')})`;
  const mulVec = (m, c) => m.map(row => row[0] * c[0] + row[1] * c[1] + row[2] * c[2]);

  // ───────────────────────── 特徵向量：PageRank ─────────────────────────
  const PAGES = [
    { e: '🏫', name: '學校官網', color: 'coral', x: 75, y: 72 },
    { e: '📚', name: '圖書館', color: 'blue', x: 170, y: 150 },
    { e: '🍜', name: '美食部落格', color: 'green', x: 265, y: 72 },
    { e: '🎮', name: '遊戲攻略', color: 'yellow', x: 265, y: 228 },
    { e: '⚽', name: '球隊', color: 'purple', x: 75, y: 228 }
  ];
  const LINKS = [[1, 4], [0], [0, 1, 3], [2, 4], [0, 1, 3]];
  const P = PAGES.length;
  const step = (x, d) => {
    const out = Array(P).fill((1 - d) / P);
    LINKS.forEach((targets, j) => targets.forEach(i => { out[i] += d * x[j] / targets.length; }));
    return out;
  };
  const steadyCache = new Map();
  const steady = d => {
    const key = d.toFixed(3);
    if (!steadyCache.has(key)) {
      let x = Array(P).fill(1 / P);
      for (let i = 0; i < 3000; i++) x = step(x, d);
      steadyCache.set(key, x);
    }
    return steadyCache.get(key);
  };
  const STARTS = [[1, 0, 0, 0, 0], [0, 0, 0, 1, 0], Array(P).fill(1 / P)];
  const l1 = (a, b) => a.reduce((s, ai, i) => s + Math.abs(ai - b[i]), 0);

  MP.register(
    {
      id: 'vector', track: 'linear', symbol: '→', name: '向量', question: '側風會把無人機吹去哪？',
      title: '無人機送貨遇到側風：它到底往哪裡飛？',
      intro: '在河裡游泳想游到正對岸，水流卻一直把你往下游推——你最後是「斜斜地」上岸。無人機送貨也一樣：機頭朝北飛，風往東吹，兩個速度合起來才是它真正前進的方向。像這種「有方向、也有大小」的量叫<b>向量</b>，把兩支箭頭「頭接尾」接起來，就是向量加法。',
      scene: '模擬：外送無人機的地速、偏航與修正角', viewH: 400,
      chart: '左：送貨地圖（綠線＝真正飛過的路、藍虛線＝沒有風時的路）　右上：藍＝機頭速度、紅＝風、綠＝對地速度　右下：分量計算',
      caption: '假設：風速與風向固定、地面平坦、無人機一起飛就達到設定速度（忽略加速與高度）。方向用「從北方順時針量」的方位角，正數偏東、負數偏西。',
      controls: [
        ['spd', '機頭速度（空速）', 10, 60, 1, 40, ' km/h'],
        ['dir', '機頭方向', -60, 60, 1, 0, '°（正＝偏東）'],
        ['wind', '風速', 0, 30, 1, 15, ' km/h'],
        { key: 'wdir', label: '風往哪裡吹', options: ['→ 往東', '← 往西', '↑ 順風', '↓ 逆風'], value: 0 },
        ['t', '起飛後第', 0, 15, 0.5, 9, ' 分鐘']
      ],
      play: 't',
      try: '風往東吹 15 km/h 時，無人機會被吹到房子右邊。把「機頭方向」慢慢調成負的（偏西）：調到幾度時綠線正好穿過 🏠？和右下角算出的修正角比一比。',
      resultLabel: '對地速度（真正的速度）',
      takeaway: '向量＝方向＋大小；兩個速度同時作用時，把箭頭頭接尾相加，長度用畢氏定理算。',
      application: '只要「方向」很重要——飛行、導航、遊戲角色移動、甚至 AI 理解字的意思——電腦都用一串數字（分量）來存一支向量。',
      tech: [
        ['✈️', '民航機與無人機飛控', '飛控電腦把「空速向量」加上「風向量」得到對地速度，並算出偏流修正角：機頭要稍微迎著風，才能沿著航線直飛。'],
        ['🎮', '遊戲引擎（Unity、Unreal）', '角色的位置、速度、重力、風力都是向量；每一格畫面做「位置 += 速度 × 經過時間」，速度本身再加上各種力造成的變化。'],
        ['🛰️', 'GPS 與手機定位', '接收器用多顆衛星的三維位置向量和到各衛星的距離，解出自己所在的位置；導航 App 再用前後位置相減的向量算出移動方向。'],
        ['🌀', '氣象預報與颱風路徑', '數值天氣模式在地圖的每個格點上存一支風向量，颱風會被周圍的「駛流」風場推著走，跟本課的無人機被風吹一樣。'],
        ['🤖', 'ChatGPT／Claude 的詞向量', '語言模型把每個字（token）變成有上千個分量的向量；意思相近的字，向量指的方向也相近（見「詞向量」）。']
      ],
      teach: {
        grade: '國小五年級～國中八年級',
        connect: '國小「方位與距離」「比例尺地圖」、國中「直角坐標」「畢氏定理」「方位角（北偏東）」；高中「平面向量」。',
        activity: '「會動的紙」實驗（10 分鐘）。材料：一張全開海報紙、彩色筆、碼錶、直尺。步驟：① 甲同學拿筆，在紙上從下往上（往「北」）用固定速度畫直線，10 秒畫 40 公分；② 乙同學同時把整張紙往左（往西）穩穩拉 30 公分；③ 停下後量：筆在紙上畫的線（相對紙）、紙移動的距離、筆在桌面上真正走的線（在桌面先貼兩個起點／終點標記）；④ 驗證 30² + 40² = 50²；⑤ 想想看：甲要把筆往哪個方向斜著畫，桌面上的線才會直直向北？',
        ask: ['風往東吹時，機頭為什麼要偏「西」才飛得直？偏多少跟什麼有關？', '如果風速比無人機還快，還飛得到嗎？在右上圖上看看會怎樣？', '順風和逆風時，對地速度是相加還是相減？那側風呢？為什麼不能直接相加？'],
        myth: '常見誤會：「40 km/h 的無人機加上 30 km/h 的風，速度就是 70 km/h」。只有方向完全相同時才能直接相加；方向垂直時是 √(40² + 30²) = 50 km/h，方向相反時才是相減。向量要按分量相加，不是把長度相加。'
      },
      formula: '<b>v</b><sub>地</sub> = <b>v</b><sub>空</sub> + <b>w</b> = (a sin θ + w<sub>x</sub>, a cos θ + w<sub>y</sub>)；|<b>v</b>| = √(v<sub>x</sub>² + v<sub>y</sub>²)；位置 <b>r</b>(t) = <b>v</b><sub>地</sub> t；直飛修正角 θ* = −arcsin(w<sub>x</sub> / a)（需 |w<sub>x</sub>| ≤ a）；夾角 cos φ = (<b>u</b>·<b>v</b>) / (|<b>u</b>||<b>v</b>|)',
      formal: '取 x 軸向東、y 軸向北。a 是空速（無人機相對空氣的速率），θ 是機頭方位角（從北順時針量），所以空速向量 <b>v</b><sub>空</sub> = (a sin θ, a cos θ)。風向量 <b>w</b> = (w<sub>x</sub>, w<sub>y</sub>) 是空氣相對地面的速度。相對運動告訴我們：地速 = 空速 + 風速，按分量相加；向量加法滿足交換律（右上圖的平行四邊形兩條路都到同一點）。地速大小用畢氏定理 √(v<sub>x</sub>² + v<sub>y</sub>²)，方向用 atan2(v<sub>x</sub>, v<sub>y</sub>)。想沿正北直飛，需要東西分量為 0：a sin θ + w<sub>x</sub> = 0 ⇒ θ* = −arcsin(w<sub>x</sub>/a)；若 |w<sub>x</sub>| > a 無解（風比飛機快，怎麼轉都會被吹走）；此時往北的地速只剩 √(a² − w<sub>x</sub>²) + w<sub>y</sub>，若 ≤ 0 也到不了。點積 <b>u</b>·<b>v</b> = u<sub>x</sub>v<sub>x</sub> + u<sub>y</sub>v<sub>y</sub> 可算兩支向量的夾角，這正是 AI 比較兩個詞向量「意思多像」的方法（餘弦相似度）。同樣的規則推廣到 3 維（飛行高度）甚至上千維都成立。簡化：真實的風會隨高度與時間改變、無人機加速需要時間、長距離要考慮地球是球面。',
      quiz: [
        { question: '無人機機頭朝北、空速 40 km/h，風往東吹 30 km/h，它真正的對地速度是多少？', options: ['70 km/h', '50 km/h', '10 km/h'], answer: 1, why: '對！兩個速度互相垂直，用畢氏定理：√(40² + 30²) = √2500 = 50 km/h，方向是北偏東約 36.9°。', hint: '方向不同的速度不能直接相加或相減。試著把滑桿調成空速 40、風速 30、往東吹，看右下角的計算。' },
        { question: '家在正北方，風卻一直往東吹。要讓無人機「直直地」飛到家，機頭應該怎麼轉？', options: ['稍微偏東，順著風', '稍微偏西，迎著風', '朝正北，只要飛快一點就好'], answer: 1, why: '對！機頭偏西產生一個「往西」的分量，剛好抵消風往東的分量，合起來就只剩往北。偏的角度是 arcsin(風速 ÷ 空速)。', hint: '朝正北時，風的往東分量沒有被抵消，飛再快也會偏。看看地圖上綠線偏到哪邊。' }
      ],
      related: ['pythagoras', 'embedding', 'matrix', 'gradient'],
      draw(k, v) {
        const { C, fmt } = k;
        const a = v.spd, th = v.dir * Math.PI / 180, [ux, uy] = WINDS[v.wdir];
        const ax = a * Math.sin(th), ay = a * Math.cos(th), wx = ux * v.wind, wy = uy * v.wind;
        const gx = ax + wx, gy = ay + wy, gs = Math.hypot(gx, gy);
        const home = [0, 6];
        // ── 送貨地圖 ──
        k.box(10, 8, 280, 384, { title: '🗺️ 送貨地圖（俯視，每格 1 公里）' });
        const S = 42, mx = km => 150 + km * S, my = km => 360 - km * S;
        const g = k.sub(k.clip(18, 50, 264, 334));
        g.rect(18, 50, 264, 334, '#f2f6f1');
        for (let km = -3; km <= 3; km++) g.line(mx(km), 50, mx(km), 384, C.grid, { 'stroke-width': 1 });
        for (let km = -1; km <= 8; km++) g.line(18, my(km), 282, my(km), C.grid, { 'stroke-width': 1 });
        if (v.wind > 0) {
          const len = 8 + v.wind * 0.6;
          for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
            const cx = 60 + c * 90 + (r % 2) * 30, cy = 92 + r * 80;
            g.arrow(cx - ux * len / 2, cy + uy * len / 2, cx + ux * len / 2, cy - uy * len / 2, '#bfd0e3', 2);
          }
        }
        g.line(mx(0), my(0), mx(home[0]), my(home[1]), C.gray, { 'stroke-width': 2, 'stroke-dasharray': '3 6' });
        g.emoji(mx(0), my(0) + 4, '🏭', 22);
        g.emoji(mx(home[0]), my(home[1]), '🏠', 26);
        const hrs = v.t / 60, hEnd = 15 / 60;
        // Delivery check: closest approach of the straight track to the house.
        const gg = gx * gx + gy * gy;
        const tc = gg > 1e-9 ? (gx * home[0] + gy * home[1]) / gg : 0;
        const dmin = Math.hypot(home[0] - gx * tc, home[1] - gy * tc);
        const delivered = gg > 1e-9 && tc >= 0 && tc <= hrs + 1e-9 && dmin <= 0.2;
        const dNow = Math.hypot(home[0] - gx * hrs, home[1] - gy * hrs), fly = delivered ? tc : hrs;
        g.line(mx(0), my(0), mx(gx * hEnd), my(gy * hEnd), C.green, { 'stroke-width': 2, 'stroke-dasharray': '2 5', opacity: 0.6 });
        g.line(mx(0), my(0), mx(ax * hrs), my(ay * hrs), C.blue, { 'stroke-width': 2, 'stroke-dasharray': '7 5' });
        g.line(mx(0), my(0), mx(gx * fly), my(gy * fly), C.green, { 'stroke-width': 4 });
        const px = mx(gx * fly), py = my(gy * fly), inside = px > 22 && px < 278 && py > 54 && py < 380;
        if (inside) {
          const hx = Math.sin(th), hy = -Math.cos(th);
          g.arrow(px, py, px + hx * 24, py + hy * 24, C.blue, 2.5);
          for (const [dx, dy] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) g.circle(px + dx, py + dy, 4.5, '#cfd8d4', { stroke: C.ink, 'stroke-width': 1 });
          g.rect(px - 6, py - 6, 12, 12, C.ink, { rx: 3 });
          g.circle(px, py, 2.5, C.yellow);
        }
        k.rect(18, 32, 264, 18, '#fff');
        k.text(20, 45, delivered ? `✅ 第 ${fmt(tc * 60, 1)} 分鐘送達！` : `⏱ 第 ${fmt(v.t, 1)} 分鐘　離家 ${fmt(dNow, 2)} km`, { 'font-size': 12, 'font-weight': 700, fill: delivered ? C.green : C.ink });
        if (!inside) k.text(280, 45, '飛出地圖了', { 'font-size': 11, fill: C.coral, 'text-anchor': 'end', 'font-weight': 700 });
        // ── 向量圖（頭接尾）──
        k.box(300, 8, 290, 232, { title: '🧮 速度向量：頭接尾相加（km/h）' });
        // Zoom so the three arrows fill the panel (grid stays 15 km/h per square).
        const PL = 310, PT = 34, PW = 272, PH = 198;
        const xsAll = [0, ax, wx, gx], ysAll = [0, ay, wy, gy];
        const minx = Math.min(...xsAll, -10), maxx = Math.max(...xsAll, 10), miny = Math.min(...ysAll, -8), maxy = Math.max(...ysAll, 10);
        const s = Math.min(3.2, (PW - 36) / (maxx - minx), (PH - 34) / (maxy - miny));
        const ox = PL + (PW - (maxx - minx) * s) / 2 - minx * s, oy = PT + (PH - (maxy - miny) * s) / 2 + maxy * s;
        const X = q => ox + q * s, Y = q => oy - q * s;
        const gv = k.sub(k.clip(PL, PT, PW, PH));
        for (let q = -Math.ceil((ox - PL) / s / 15) * 15; X(q) <= PL + PW; q += 15) gv.line(X(q), PT, X(q), PT + PH, C.grid, { 'stroke-width': 1 });
        for (let q = -Math.ceil((PT + PH - oy) / s / 15) * 15; Y(q) >= PT; q += 15) gv.line(PL, Y(q), PL + PW, Y(q), C.grid, { 'stroke-width': 1 });
        gv.line(PL, oy, PL + PW, oy, C.axis, { 'stroke-width': 1.5 });
        gv.line(ox, PT, ox, PT + PH, C.axis, { 'stroke-width': 1.5 });
        k.text(PL + PW - 2, MP.clamp(oy - 5, PT + 12, PT + PH - 4), '東 x', { 'text-anchor': 'end', 'font-size': 11 });
        k.text(MP.clamp(ox + 5, PL + 2, PL + PW - 30), PT + 12, '北 y', { 'font-size': 11 });
        k.text(PL + 2, PT + PH - 4, '每格 15 km/h', { 'font-size': 10 });
        // Parallelogram (commutativity) in light dashes.
        k.line(X(0), Y(0), X(wx), Y(wy), C.coral, { 'stroke-width': 1.5, 'stroke-dasharray': '4 4', opacity: 0.55 });
        k.line(X(wx), Y(wy), X(gx), Y(gy), C.blue, { 'stroke-width': 1.5, 'stroke-dasharray': '4 4', opacity: 0.55 });
        k.arrow(X(0), Y(0), X(ax), Y(ay), C.blue, 4);
        k.arrow(X(ax), Y(ay), X(gx), Y(gy), C.coral, 4);
        k.arrow(X(0), Y(0), X(gx), Y(gy), C.green, 3);
        k.circle(ox, oy, 4, C.ink);
        k.text(ox - 6, oy + 14, 'O', { 'font-size': 11, 'text-anchor': 'end', fill: C.ink });
        // ── 分量表 ──
        k.box(300, 248, 290, 144, { title: '📐 分量計算（東 x, 北 y）' });
        const row = (y, label, x, yv, color, bold) => {
          k.text(312, y, label, { 'font-size': 12, fill: color, 'font-weight': 700 });
          k.text(470, y, fmt(x, 1), { 'font-size': 12, fill: C.ink, 'text-anchor': 'end', 'font-weight': bold ? 700 : 400 });
          k.text(560, y, fmt(yv, 1), { 'font-size': 12, fill: C.ink, 'text-anchor': 'end', 'font-weight': bold ? 700 : 400 });
        };
        k.text(470, 284, '東 x', { 'font-size': 11, 'text-anchor': 'end' });
        k.text(560, 284, '北 y', { 'font-size': 11, 'text-anchor': 'end' });
        row(302, '機頭 a', ax, ay, C.blue);
        row(320, '＋ 風 w', wx, wy, C.coral);
        k.line(312, 326, 572, 326, C.axis, { 'stroke-width': 1 });
        row(341, '＝ 對地 v', gx, gy, C.green, true);
        k.text(312, 362, `|v| = √(${fmt(gx, 1)}² + ${fmt(gy, 1)}²) = ${fmt(gs, 1)}`, { 'font-size': 12, fill: C.ink, 'font-weight': 700 });
        let fix;
        if (Math.abs(wx) < 1e-9) fix = wy < 0 && a + wy <= 0 ? '逆風不比飛機慢，到不了' : '沒有側風：機頭朝正北就行';
        else if (Math.abs(wx) > a) fix = '側風比飛機快：怎麼轉都會被吹走';
        else {
          const ts = -Math.asin(wx / a) * 180 / Math.PI, north = Math.sqrt(a * a - wx * wx) + wy;
          fix = north > 0 ? `直飛修正：機頭偏${ts < 0 ? '西' : '東'} ${fmt(Math.abs(ts), 1)}°` : '修正後往北速度 ≤ 0，到不了';
        }
        k.text(312, 382, fix, { 'font-size': 12, fill: C.purple, 'font-weight': 700 });
        let fixDetail = '';
        if (Math.abs(wx) > 1e-9 && Math.abs(wx) <= a) {
          const ts = -Math.asin(wx / a) * 180 / Math.PI;
          fixDetail = `要直直往北飛，機頭要偏${ts < 0 ? '西' : '東'} arcsin(${fmt(Math.abs(wx), 0)}÷${fmt(a, 0)}) = ${fmt(Math.abs(ts), 1)}°，往北地速剩 √(${fmt(a, 0)}² − ${fmt(Math.abs(wx), 0)}²) ${wy >= 0 ? '+' : '−'} ${fmt(Math.abs(wy), 0)} = ${fmt(Math.sqrt(a * a - wx * wx) + wy, 1)} km/h。`;
        }
        return {
          result: `${fmt(gs, 1)} km/h，${bearing(gx, gy, fmt)}`,
          detail: `(${fmt(ax, 1)}, ${fmt(ay, 1)}) + (${fmt(wx, 1)}, ${fmt(wy, 1)}) = (${fmt(gx, 1)}, ${fmt(gy, 1)})，長度 √(${fmt(gx, 1)}² + ${fmt(gy, 1)}²) = ${fmt(gs, 1)} km/h。${delivered ? `第 ${fmt(tc * 60, 1)} 分鐘送達 (0, 6) km 的家` : `第 ${fmt(v.t, 1)} 分鐘時在 (${fmt(gx * hrs, 2)}, ${fmt(gy * hrs, 2)}) km`}。${fixDetail}`
        };
      }
    },
    {
      id: 'matrix', track: 'linear', symbol: '▦', name: '矩陣', question: '手機濾鏡怎麼改顏色？',
      title: '修圖 App 的濾鏡：一個 3×3 矩陣，改變每一顆像素',
      intro: '老師算學期成績時，會把「平時、期中、期末」各乘上一個比重再加起來——這種「乘了再加」就是矩陣的一列。手機照片是由許多小方格（像素）組成，每一格存著紅、綠、藍三個 0～255 的數字。套一個濾鏡，就是用一個 3×3 的數字表（<b>矩陣</b>），替每一格算出新的紅、綠、藍。',
      scene: '模擬：手機修圖 App 的色彩濾鏡（色彩矩陣）', viewH: 440,
      chart: '上：原始照片與套用濾鏡後的手機畫面（點任一格可以選像素）　下：選中像素的「矩陣 × 向量」計算過程',
      caption: '這張圖有 20×20 = 400 個像素，每個像素都乘同一個矩陣 M。濾鏡強度 α 把 M 和「什麼都不改」的單位矩陣 I 混合：M = (1−α)I + αF。算完超過 255 就記成 255，小於 0 就記成 0。',
      controls: [
        { key: 'f', label: '濾鏡 F', options: FILTERS.map(f => f.name), value: 2 },
        ['alpha', '濾鏡強度 α', 0, 100, 5, 100, '%'],
        { key: 'pick', label: '看哪一個像素（也可以直接點圖）', options: ['☀️ 太陽', '🏠 屋頂', '🌤️ 天空', '🌿 草地'], value: 1 }
      ],
      play: 'alpha',
      try: '選「黑白」，看矩陣三列是不是一模一樣——所以算出來的紅、綠、藍也一樣，就變成灰色。再選「紅藍交換」點紅屋頂：它的紅、藍數字互換了哪一列的 1？',
      resultLabel: '選中像素的新顏色 [R′, G′, B′]',
      takeaway: '矩陣是一張「乘了再加」的規則表；照片濾鏡、3D 遊戲和 AI 的每一層，都是同一個矩陣乘上很多很多向量。',
      application: '矩陣厲害的地方是「同一套規則一次套用到大量資料」，這正是 GPU 這種晶片最擅長的事。',
      tech: [
        ['📸', 'Instagram／手機相簿濾鏡', '黑白、飽和度、色溫這類調色，可寫成對每個像素 RGB 做的色彩矩陣；Android 的 ColorMatrix 與網頁 SVG 的 feColorMatrix 濾鏡，就是讓工程師直接填這個矩陣（另多一欄放常數位移）。'],
        ['📺', 'JPEG 照片與影片壓縮', '壓縮前先用一個 3×3 矩陣（再加位移）把 RGB 轉成「亮度 Y＋兩個色差」，因為人眼對亮度比顏色敏感，色差就可以存得比較粗。'],
        ['🎮', '3D 遊戲繪圖', 'GPU 用 4×4 矩陣把模型的每個頂點旋轉、縮放、移動，再投影到 2D 螢幕上；每一格畫面都要對大量頂點做矩陣乘法。'],
        ['🧠', 'ChatGPT／Claude 等神經網路', '每一層的核心都是「權重矩陣 × 輸入向量」，再加偏差與激活函數；語言模型大部分的計算量都花在矩陣乘法上。'],
        ['🔲', 'AI 晶片（GPU、TPU）', 'NVIDIA GPU 的 Tensor Core、Google TPU 的脈動陣列（systolic array），都是專門加速大型矩陣乘法的硬體。']
      ],
      teach: {
        grade: '國小五年級～國中九年級',
        connect: '國小「小數乘法」「加權平均（成績計算）」「表格」、國中「直角坐標」「二元一次聯立方程式」；高中「矩陣」。',
        activity: '「人體濾鏡」（15 分鐘）。材料：每組 6 張像素卡（寫著紅、綠、藍三個 0～4 的整數，例如 (4, 1, 0)）、2 張濾鏡卡（3×3 表格：A＝紅藍交換、B＝「新紅＝紅＋綠、新綠＝綠、新藍＝0」）、學習單、紅綠藍色鉛筆。步驟：① 示範「一列乘一行」：新紅 = 第一列的三個數分別乘上 (紅, 綠, 藍) 再加總；② 各組把 6 張像素卡都套用濾鏡 A，寫下新數字，用三色鉛筆依數量點點塗色，看看顏色怎麼變；③ 一半組別「先 A 再 B」、另一半「先 B 再 A」，比較同一張卡的最後結果——發現順序不同、答案不同；④ 討論：手機一張照片有上千萬個像素，人工要算多久？',
        ask: ['黑白濾鏡的三列為什麼一模一樣？如果三列不一樣會怎樣？', '矩陣裡哪一個位置的數字，決定「原本的綠色有多少跑到新的紅色」？', '先套黑白再紅藍交換，和先紅藍交換再黑白，結果一樣嗎？為什麼？'],
        myth: '常見誤會：「矩陣乘法就是對應位置相乘」。其實是「列 × 行」：結果的每一個數，都是矩陣的一整列和向量逐項相乘再加總。也因此矩陣相乘通常不能交換順序，AB ≠ BA。'
      },
      formula: '[R′, G′, B′]<sup>T</sup> = M [R, G, B]<sup>T</sup>，R′ = m<sub>11</sub>R + m<sub>12</sub>G + m<sub>13</sub>B（G′、B′ 同理）；M = (1−α)I + αF；黑白 F 每列 = (0.299, 0.587, 0.114)；套兩個濾鏡 = M<sub>2</sub>(M<sub>1</sub>c) = (M<sub>2</sub>M<sub>1</sub>)c',
      formal: '把每個像素的顏色看成 3 維向量 c = (R, G, B)，濾鏡是一個 3×3 矩陣 M，新顏色 c′ = Mc。第 i 個輸出分量是 M 的第 i 列與 c 的點積，所以 m<sub>ij</sub> 表示「原本第 j 個顏色有多少比例流進新的第 i 個顏色」。矩陣乘法是線性的：M(αu + βv) = αMu + βMv，因此「濾鏡強度」這種混合 (1−α)I + αF 的效果，等於把原圖與全濾鏡圖按比例混合（在不需要截斷時）。連續套兩個濾鏡等於先把兩個矩陣相乘，但順序重要：本例 黑白 × 紅藍交換 的每一列是 (0.114, 0.587, 0.299)，而 紅藍交換 × 黑白 仍是原本的黑白矩陣，兩者不同。行列式 det M 告訴我們能不能「還原」：黑白矩陣三列相同，det = 0，資訊被壓扁，無法從灰階照片算回彩色；紅藍交換 det = −1，可以完全還原。簡化：真實照片的數值經過 gamma 編碼（sRGB），嚴格的色彩運算要先轉成線性亮度再乘矩陣；加亮、負片（255 − R）等需要常數位移，要用 3×4 或 4×5 的「仿射」矩陣；數值超出 0～255 會被截斷，這一步不是線性的。灰階權重 0.299／0.587／0.114 來自 ITU-R BT.601 標準，反映人眼對綠光最敏感。',
      quiz: [
        { question: '黑白濾鏡矩陣的三列都是 (0.299, 0.587, 0.114)。為什麼套用後照片會變成灰色？', options: ['因為三列一樣，算出的新紅、新綠、新藍都相等', '因為矩陣裡的數字都小於 1，照片變暗', '因為綠色的比重最大，所以變成綠色'], answer: 0, why: '對！R′ = G′ = B′ 時，紅綠藍一樣多，看起來就是灰色；數字大小只決定是淺灰還是深灰。', hint: '選「黑白」濾鏡，點不同像素，看看下方算出的三個新數字有什麼共同點。' },
        { question: '一張 1200 萬畫素的照片套一個 3×3 色彩濾鏡，大約要做幾次乘法？', options: ['9 次', '1200 萬次', '1 億 800 萬次'], answer: 2, why: '對！每個像素要做 3 × 3 = 9 次乘法，1200 萬 × 9 = 1 億 800 萬次。所以手機用 GPU 同時算很多像素，才能即時預覽濾鏡。', hint: '一個像素的新顏色要算 3 個數字，每個數字要 3 次乘法；再乘上像素的數量。' }
      ],
      related: ['vector', 'eigen', 'neuron', 'lora'],
      draw(k, v) {
        const { C, fmt } = k;
        const F = FILTERS[v.f], al = v.alpha / 100;
        const M = I3.map((row, i) => row.map((d, j) => (1 - al) * d + al * F.m[i][j]));
        if (k.state.lastPick !== v.pick) { k.state.px = null; k.state.lastPick = v.pick; }
        const [sx, sy] = k.state.px || PICKS[v.pick];
        const cell = 10, top = 42, leftA = 30, leftB = 370;
        k.box(10, 8, 580, 252, { fill: '#f6f8f6' });
        k.text(leftA, 30, '📷 原始照片', { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        k.rect(leftB - 12, 22, 224, 230, C.ink, { rx: 18 });
        k.rect(leftB + 80, 27, 40, 5, '#3b4c58', { rx: 2.5 });
        const pickHandler = event => {
          const t = event.target;
          if (t.dataset && t.dataset.x !== undefined) { k.state.px = [Number(t.dataset.x), Number(t.dataset.y)]; k.redraw(); }
        };
        for (const [left, filtered] of [[leftA, false], [leftB, true]]) {
          const gp = k.g({ cursor: 'pointer' });
          gp.addEventListener('click', pickHandler);
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const c = filtered ? mulVec(M, PICTURE[y][x]) : PICTURE[y][x];
            k.el('rect', { x: left + x * cell, y: top + y * cell, width: cell + 0.3, height: cell + 0.3, fill: rgb(c), 'data-x': x, 'data-y': y }, gp);
          }
          k.rect(left + sx * cell - 1, top + sy * cell - 1, cell + 2, cell + 2, 'none', { stroke: C.ink, 'stroke-width': 2.5 });
          k.rect(left + sx * cell + 1, top + sy * cell + 1, cell - 2, cell - 2, 'none', { stroke: '#fff', 'stroke-width': 1.2 });
        }
        // Middle arrow: × M
        k.arrow(248, 150, 350, 150, C.purple, 4);
        k.text(299, 128, '× 矩陣 M', { 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.purple });
        k.text(299, 176, `${F.name}　強度 ${fmt(v.alpha, 0)}%`, { 'text-anchor': 'middle', 'font-size': 12, fill: C.ink });
        k.text(299, 196, `每格都算一次`, { 'text-anchor': 'middle', 'font-size': 11 });
        k.text(299, 212, `共 ${N * N} 次`, { 'text-anchor': 'middle', 'font-size': 11 });
        // ── 計算區 ──
        const before = PICTURE[sy][sx], raw = mulVec(M, before), after = raw.map(clamp255);
        k.box(10, 264, 580, 172, { title: `🔍 第 ${sy + 1} 列、第 ${sx + 1} 行的像素：新顏色 = M × 原顏色` });
        const rows = [316, 338, 360], chan = [C.coral, C.green, C.blue], soft = [C.coralSoft, C.greenSoft, C.blueSoft];
        const bracket = (x0, x1) => {
          k.path(`M${x0 + 5},${rows[0] - 15} H${x0} V${rows[2] + 7} H${x0 + 5}`, C.ink, { 'stroke-width': 1.5 });
          k.path(`M${x1 - 5},${rows[0] - 15} H${x1} V${rows[2] + 7} H${x1 - 5}`, C.ink, { 'stroke-width': 1.5 });
        };
        // matrix M
        const mx0 = 30, colW = 54;
        for (let i = 0; i < 3; i++) {
          k.rect(mx0 + 4, rows[i] - 14, colW * 3 - 2, 19, soft[i], { rx: 4 });
          for (let j = 0; j < 3; j++) {
            const val = M[i][j];
            k.text(mx0 + 4 + colW * j + colW / 2, rows[i], fmt(val, 3), { 'text-anchor': 'middle', 'font-size': 12, fill: val < -1e-9 ? C.coral : Math.abs(val) < 1e-9 ? C.axis : C.ink, 'font-weight': 700 });
          }
        }
        bracket(mx0, mx0 + colW * 3 + 6);
        k.text(mx0 + colW * 1.5 + 3, 382, 'M（每一列算一個新顏色）', { 'text-anchor': 'middle', 'font-size': 10 });
        k.text(212, rows[1] + 4, '×', { 'text-anchor': 'middle', 'font-size': 16, fill: C.ink });
        // input vector
        const vx0 = 226;
        for (let i = 0; i < 3; i++) k.text(vx0 + 27, rows[i], before[i], { 'text-anchor': 'middle', 'font-size': 12, fill: chan[i], 'font-weight': 700 });
        bracket(vx0, vx0 + 54);
        k.rect(vx0 + 12, 370, 30, 12, rgb(before), { rx: 3, stroke: '#9aa', 'stroke-width': 1 });
        k.text(296, rows[1] + 4, '=', { 'text-anchor': 'middle', 'font-size': 16, fill: C.ink });
        // output vector
        const ox0 = 310;
        for (let i = 0; i < 3; i++) k.text(ox0 + 34, rows[i], fmt(raw[i], 1), { 'text-anchor': 'middle', 'font-size': 12, fill: chan[i], 'font-weight': 700 });
        bracket(ox0, ox0 + 68);
        k.text(394, rows[1] + 4, '→', { 'text-anchor': 'middle', 'font-size': 15, fill: C.ink });
        // after (clamped) + swatches
        for (let i = 0; i < 3; i++) {
          const clipped = Math.round(raw[i]) !== after[i];
          k.text(428, rows[i], after[i], { 'text-anchor': 'middle', 'font-size': 12, fill: chan[i], 'font-weight': 700 });
          if (clipped) k.text(448, rows[i], raw[i] > 255 ? '↓ 上限 255' : '↑ 下限 0', { 'font-size': 10, fill: C.muted });
        }
        k.rect(510, 300, 34, 34, rgb(before), { rx: 6, stroke: '#9aa', 'stroke-width': 1 });
        k.rect(546, 300, 34, 34, rgb(after), { rx: 6, stroke: '#9aa', 'stroke-width': 1 });
        k.text(527, 350, '原', { 'text-anchor': 'middle', 'font-size': 11 });
        k.text(563, 350, '新', { 'text-anchor': 'middle', 'font-size': 11 });
        // step-by-step row computations
        const names = ['新紅 R′', '新綠 G′', '新藍 B′'];
        for (let i = 0; i < 3; i++) {
          const terms = M[i].map((m, j) => `${fmt(m, 3)}×${before[j]}`).join(' + ').replace(/\+ -/g, '− ');
          k.text(24, 401 + i * 16, `${names[i]} = ${terms} = ${fmt(raw[i], 1)}`, { 'font-size': 12, fill: chan[i], 'font-weight': 600 });
        }
        return {
          result: `[${after.join(', ')}]`,
          detail: `${names[0]} = ${M[0].map((m, j) => `${fmt(m, 3)}×${before[j]}`).join(' + ').replace(/\+ -/g, '− ')} = ${fmt(raw[0], 1)}${Math.round(raw[0]) !== after[0] ? `（截成 ${after[0]}）` : ''}。整張 ${N}×${N} 圖要做 ${N * N} 次「矩陣 × 向量」、${N * N * 9} 次乘法；1200 萬畫素的照片就是 1 億 800 萬次。`
        };
      }
    },
    {
      id: 'eigen', track: 'linear', symbol: 'λ', name: '特徵值與特徵向量', question: 'Google 怎麼幫網頁排名？',
      title: '網路上的隨機小精靈：最後停在哪裡最多？',
      intro: '想像有 100 隻「網路小精靈」在 5 個網頁之間亂逛：每一分鐘，每隻小精靈都從目前網頁上的連結裡隨便點一個。一開始大家擠在學校官網，可是過幾分鐘後，每個網頁的人數會<b>穩定下來不再改變</b>。被很多人連、又被「重要網頁」連的網頁，小精靈最多——這就是 Google 早期排名的想法 PageRank。「乘上規則後完全不變」的那組比例，數學上叫做特徵值為 1 的<b>特徵向量</b>。',
      scene: '模擬：搜尋引擎用 PageRank 幫 5 個網頁排名', viewH: 440,
      chart: '左上：網頁與連結（線越粗＝這一步流過越多人）　右上：目前比例，黑色短線＝穩定解　下：每一步的比例變化',
      caption: '每一步：比例 d 的小精靈照連結隨機點（每條連結機會相等），1−d 的小精靈隨機「跳」到任何一個網頁（像直接在網址列打字）。這正是 x ← G x，G 是 5×5 的 Google 矩陣。',
      controls: [
        ['n', '走了幾步 n', 0, 30, 1, 3, ' 步'],
        ['d', '照連結點的機率 d', 0.5, 1, 0.05, 0.85, ''],
        { key: 'start', label: '小精靈一開始在哪裡', options: ['全在 🏫 學校', '全在 🎮 遊戲', '平均分散'], value: 0 }
      ],
      play: 'n',
      try: '按播放，看比例怎麼慢慢穩定下來。再換成「全在 🎮 遊戲」或「平均分散」重播：最後的排名有沒有不一樣？把 d 調到 1，穩定得比較快還是比較慢？',
      resultLabel: '目前排名第一的網頁',
      takeaway: '特徵向量是「被矩陣作用後方向不變」的向量（Av = λv）；PageRank 的排名就是 Google 矩陣特徵值 1 的特徵向量。',
      application: '不管從哪裡出發，一直重複乘同一個矩陣，最後都會被「拉」到最大特徵值的特徵向量方向——這叫冪次法，是電腦計算特徵向量最基本的方法。',
      tech: [
        ['🔍', 'Google 搜尋（PageRank）', '1998 年 Brin 與 Page 提出 PageRank：把整個網路的連結寫成巨大的矩陣，用冪次法反覆相乘求特徵值 1 的特徵向量，論文建議 d ≈ 0.85。今天 Google 排名還會考慮非常多其他訊號，PageRank 只是其中一種。'],
        ['🏗️', '橋樑、高樓的耐震設計', '結構工程師解 Kφ = ω²Mφ 這種特徵值問題：特徵值給出建築的自然振動頻率，特徵向量是振動的形狀（振態）；設計要避開地震與風容易引起共振的頻率，台北 101 的阻尼球也是針對主要振態調校的。'],
        ['📊', '主成分分析 PCA（資料壓縮、人臉辨識）', '資料的共變異數矩陣的特徵向量，指出資料變化最大的方向；早期人臉辨識「Eigenfaces」就是用這些特徵向量把臉壓縮成少數幾個數字。'],
        ['⚛️', '量子力學與量子電腦', '原子的能階是 Hamiltonian（能量算符）的特徵值，量測一個量子位元只會得到某個特徵值；量子化學模擬就是在求超大矩陣的特徵值。'],
        ['🤖', 'AI 模型分析與壓縮', '奇異值分解（SVD，與特徵值密切相關）能找出權重矩陣最重要的幾個方向，用來分析或壓縮大型語言模型（見「低秩分解」）。']
      ],
      teach: {
        grade: '國小六年級～國中九年級',
        connect: '國小「比例」「百分率」「統計圖表」、國中「機率」「數列」「坐標」；高中「矩陣」「轉移矩陣（馬可夫鏈）」。',
        activity: '「人肉網路小精靈」（15 分鐘）。材料：5 張 A4 網頁卡（貼在教室四周，畫上本課的箭頭連結）、每人一顆骰子、黑板記錄表。步驟：① 全班 25 人都站在「學校官網」；② 每一回合每人擲骰子：擲到 6 就「瞬間移動」，再擲一次決定去 1～5 號網頁（6 重擲）；擲到 1～5 就照目前網頁卡上的箭頭走：有 2 條連結時丟硬幣決定（正面、反面各一條），3 條連結時再擲一次骰子 1-2／3-4／5-6；③ 每回合結束各網頁數人數寫在黑板；④ 玩 8 回合，畫折線圖，和電腦上 d ≈ 0.85（約 5/6）的穩定比例比較。',
        ask: ['為什麼「美食部落格」連結很多出去，排名卻不一定高？排名看的是「被誰連」還是「連到誰」？', '如果所有人一開始站在不同地方，玩很多回合後的比例會一樣嗎？', '如果沒有「瞬間移動」（d = 1），小精靈有可能被困在某幾個網頁出不來嗎？'],
        myth: '常見誤會：「被連結最多次的網頁，排名一定最高」。PageRank 還看「誰」連你：一個重要網頁的推薦，比很多冷門網頁的推薦更有份量；而且一個網頁連出去越多，每條連結分到的票就越少。'
      },
      formula: 'Av = λv（v ≠ 0）；det(A − λI) = 0；PageRank：G = dM + (1−d)/N · 𝟙𝟙<sup>T</sup>，M<sub>ij</sub> = 1/出連結數(j)（若 j→i）；x<sup>(n+1)</sup> = Gx<sup>(n)</sup> → x*，Gx* = 1·x*；‖x<sup>(n)</sup> − x*‖<sub>1</sub> ≤ d<sup>n</sup>‖x<sup>(0)</sup> − x*‖<sub>1</sub>',
      formal: '一般地，方陣 A 的特徵向量 v 是被 A 作用後「不轉彎」的非零向量：Av = λv，λ 是伸縮倍率（負數表示反向）；λ 是 det(A − λI) = 0 的根。像橡皮布左右拉 2 倍、上下不變（A = diag(2, 1)），水平與垂直方向的箭頭只變長短（λ = 2 與 1），斜的箭頭都會轉向。PageRank 中，x 是 5 個網頁的人數比例（各項 ≥ 0、加總 = 1），M 的第 j 行描述從網頁 j 出發的人平均分到它的每條連結，因此 M 每一行加總為 1（行隨機矩陣）。加上「隨機跳轉」得到 Google 矩陣 G，所有元素都是正數。Perron–Frobenius 定理保證：G 有特徵值 1，並對應唯一一個各項為正、加總為 1 的特徵向量 x*；其他特徵值的絕對值都 ≤ d < 1。所以從任何起點反覆乘 G（冪次法），誤差每步至少縮成 d 倍，最後都收斂到 x*——與起點無關。d = 1 時本例仍會收斂（網路強連通，且同時有長度 2 與 3 的迴圈，所以不會週期性來回跳），但可能較慢；若網路有「只進不出」的網頁或分成兩塊，沒有跳轉就可能卡住或排名不唯一。真實網路有數十億網頁，矩陣極為稀疏，只能用冪次法這類反覆相乘的方法，不可能去解 det(A − λI) = 0。簡化：真實的瀏覽者不是均勻亂點，搜尋排名也還結合內容相關性等許多其他訊號。',
      quiz: [
        { question: '小精靈的比例 x 一直乘上 G，到後來 G x 和 x 一模一樣。這代表什麼？', options: ['x 是 G 的特徵向量，特徵值是 1', '所有網頁一樣重要', '計算出錯了，應該要一直變'], answer: 0, why: '對！Gx = 1·x 正是「特徵值 1 的特徵向量」的定義。這組穩定比例就是 PageRank 的排名。', hint: '回想定義 Av = λv：乘上矩陣後只被放大 λ 倍。如果完全沒變，λ 是多少？' },
        { question: '讓小精靈「全在學校官網」出發和「平均分散」出發，走了 30 步之後，排名會怎樣？', options: ['完全由起點決定，兩者不同', '幾乎一樣，都收斂到同一個穩定解', '永遠不會穩定，一直跳來跳去'], answer: 1, why: '對！只要有隨機跳轉（d < 1），Google 矩陣只有一個穩定的特徵向量，不管從哪裡出發都會被拉過去，誤差每步至少縮成 d 倍。', hint: '把步數拉到 30，切換「小精靈一開始在哪裡」三個選項，比較右上角的比例。' }
      ],
      related: ['matrix', 'probability', 'lora', 'gradient'],
      draw(k, v) {
        const { C, fmt } = k;
        const d = v.d, n = Math.round(v.n), maxN = 30;
        const hist = [STARTS[v.start].slice()];
        for (let i = 0; i < maxN; i++) hist.push(step(hist[i], d));
        const x = hist[n], xs = steady(d);
        const pct = q => `${fmt(q * 100, 1)}%`;
        // ── 網頁與連結 ──
        k.box(10, 8, 322, 270, { title: '🌐 網頁與連結（線越粗＝流過越多人）' });
        const hw = 55, hh = 22;
        const edge = (j, i) => {
          const A = PAGES[j], B = PAGES[i], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy);
          const both = LINKS[i].includes(j), off = both ? 6 : 0, nx = -dy / L * off, ny = dx / L * off;
          const tA = Math.min((hw + 4) / Math.abs(dx || 1e-9), (hh + 4) / Math.abs(dy || 1e-9));
          const tB = Math.min((hw + 6) / Math.abs(dx || 1e-9), (hh + 6) / Math.abs(dy || 1e-9));
          const flow = d * x[j] / LINKS[j].length;
          k.arrow(A.x + dx * tA + nx, A.y + dy * tA + ny, B.x - dx * tB + nx, B.y - dy * tB + ny, '#8fa3ad', 1.2 + 11 * flow);
        };
        LINKS.forEach((targets, j) => targets.forEach(i => edge(j, i)));
        const maxX = Math.max(...x);
        PAGES.forEach((p, i) => {
          k.rect(p.x - hw, p.y - hh, hw * 2, hh * 2, C[p.color + 'Soft'], { rx: 9, stroke: C[p.color], 'stroke-width': x[i] === maxX && maxX - Math.min(...x) > 1e-6 ? 3 : 1.5 });
          k.text(p.x - hw + 8, p.y - 4, `${p.e} ${p.name}`, { 'font-size': 12, 'font-weight': 700, fill: C.ink });
          k.rect(p.x - hw + 8, p.y + 7, 44, 8, '#fff', { rx: 4 });
          k.rect(p.x - hw + 8, p.y + 7, 44 * x[i], 8, C[p.color], { rx: 4 });
          k.text(p.x + hw - 7, p.y + 15, pct(x[i]), { 'font-size': 12, 'font-weight': 700, fill: C[p.color], 'text-anchor': 'end' });
        });
        k.text(20, 270, `另有 1−d = ${fmt((1 - d) * 100, 0)}% 的人隨機跳到任一頁`, { 'font-size': 11 });
        // ── 比例與排名 ──
        k.box(340, 8, 250, 270, { title: `📊 第 ${n} 步的人數比例` });
        PAGES.forEach((p, i) => {
          const y0 = 46 + i * 42, rank = 1 + x.filter(q => q > x[i] + 1e-9).length;
          k.text(350, y0, `#${rank} ${p.e} ${p.name}`, { 'font-size': 12, 'font-weight': 700, fill: C.ink });
          k.text(582, y0, pct(x[i]), { 'font-size': 12, 'font-weight': 700, fill: C[p.color], 'text-anchor': 'end' });
          k.rect(350, y0 + 6, 232, 12, C.graySoft, { rx: 4 });
          k.rect(350, y0 + 6, 232 * x[i], 12, C[p.color], { rx: 4 });
          k.line(350 + 232 * xs[i], y0 + 3, 350 + 232 * xs[i], y0 + 21, C.ink, { 'stroke-width': 2.5, 'stroke-linecap': 'butt' });
        });
        const errN = l1(x, xs), err0 = l1(hist[0], xs);
        k.text(350, 254, `黑線＝穩定解 x*（G x* = x*）`, { 'font-size': 11 });
        k.text(350, 270, `離穩定解還差 ${fmt(errN, 4)}`, { 'font-size': 11, fill: errN < 0.005 ? C.green : C.muted, 'font-weight': 700 });
        // ── 收斂折線圖 ──
        const p = k.plot({ xmin: 0, xmax: maxN, ymin: 0, ymax: 1, left: 52, width: 520, top: 304, height: 92, xticks: 6, yticks: 2, xlabel: '步數 n（每一步：x ← G x）', ylabel: '比例', tickFmt: q => q === 0 ? '0' : q < 1.0001 ? `${Math.round(q * 100)}%` : String(Math.round(q)) });
        PAGES.forEach((pg, i) => {
          k.line(p.x(0), p.y(xs[i]), p.x(maxN), p.y(xs[i]), C[pg.color], { 'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: 0.5 });
          k.polyline(hist.map((h, s) => [p.x(s), p.y(h[i])]), C[pg.color], { 'stroke-width': 1.5, opacity: 0.25 });
          k.polyline(hist.slice(0, n + 1).map((h, s) => [p.x(s), p.y(h[i])]), C[pg.color], { 'stroke-width': 2.5 });
        });
        k.line(p.x(n), p.top, p.x(n), p.bottom, C.ink, { 'stroke-width': 1.5, 'stroke-dasharray': '4 3' });
        const order = x.map((q, i) => i).sort((a, b) => x[b] - x[a]);
        const best = order[0];
        const tie = x[order[0]] - x[order[1]] < 1e-6;
        const nextX = step(x, d), change = l1(nextX, x);
        return {
          result: tie ? `平手（各 ${pct(x[best])}）` : `${PAGES[best].e} ${PAGES[best].name} ${pct(x[best])}`,
          detail: `第 ${n} 步：${PAGES.map((pg, i) => `${pg.name} ${pct(x[i])}`).join('、')}。再乘一次 G 只變 ${fmt(change, 4)}；離穩定解 x* 差 ${fmt(errN, 4)}，理論上限 ${fmt(d, 2)}^${n} × ${fmt(err0, 3)} = ${fmt(Math.pow(d, n) * err0, 4)}。穩定解滿足 G x* = 1·x*：${PAGES.map((pg, i) => pct(xs[i])).join('、')}。`
        };
      }
    }
  );
})();
