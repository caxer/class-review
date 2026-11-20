// AI 語言模型的數學（一）：大型語言模型怎麼「讀字」與「選字」。
// token → embedding → softmax → attention → position
(() => {
  const pct = (p, d = 0) => `${(p * 100).toFixed(d)}%`;
  const sgn = n => (n < 0 ? `−${Math.abs(n).toFixed(2)}` : n.toFixed(2));
  const zi1 = n => (n < -0.04 ? `−${Math.abs(n).toFixed(1)}` : Math.abs(n).toFixed(1));
  const PALETTE = ['coral', 'blue', 'green', 'yellow', 'purple'];
  const HALO = { stroke: '#fff', 'stroke-width': 3, 'paint-order': 'stroke', 'stroke-linejoin': 'round' };

  // ---------- token：二元語法（bigram）小語料 ----------
  const CORPUS = [
    ['我', '想', '吃', '拉麵'],
    ['今天', '天氣', '很', '好'],
    ['我', '喜歡', '吃', '蘋果'],
    ['我', '很', '好'],
    ['你', '喜歡', '吃', '蛋糕'],
    ['我', '喜歡', '看', '書'],
    ['今天', '天氣', '很', '熱'],
    ['我', '喜歡', '吃', '蘋果']
  ];
  const CONTEXTS = ['我', '喜歡', '吃', '很', '天氣'];
  const bigrams = sentences => {
    const m = new Map();
    for (const s of sentences) for (let i = 0; i + 1 < s.length; i++) {
      if (!m.has(s[i])) m.set(s[i], new Map());
      const row = m.get(s[i]);
      row.set(s[i + 1], (row.get(s[i + 1]) || 0) + 1);
    }
    return m;
  };
  // Followers of each word over the full corpus, most frequent first (used as a stable tie-break order).
  const FULL = bigrams(CORPUS);
  const FOLLOWERS = new Map([...FULL].map(([a, row]) => [a, [...row].sort((x, y) => y[1] - x[1]).map(([b]) => b)]));
  const ranked = (counts, word) => (FOLLOWERS.get(word) || []).map(w => [w, counts.get(word)?.get(w) || 0]).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);

  // ---------- embedding：手工擺放的 2 維詞向量 ----------
  const WORDS = [
    ['貓', -0.55, 0.72, 'coral'], ['狗', -0.78, 0.66, 'coral'], ['老虎', -0.35, 0.92, 'coral'],
    ['蘋果', 0.61, 0.73, 'green'], ['香蕉', 0.70, 0.49, 'green'], ['西瓜', 0.42, 0.91, 'green'],
    ['汽車', 0.94, -0.17, 'blue'], ['公車', 0.82, -0.38, 'blue'], ['腳踏車', 0.85, 0.07, 'blue'],
    ['國王', -0.95, -0.30, 'yellow'], ['男人', -0.55, -0.70, 'yellow'], ['女人', -0.05, -0.85, 'yellow'], ['皇后', -0.43, -0.47, 'yellow']
  ].map(([w, x, y, c]) => ({ w, x, y, c }));
  const WV = Object.fromEntries(WORDS.map(o => [o.w, o]));
  const cosine = (a, b) => (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));

  // ---------- softmax：候選詞與 logits ----------
  const PROMPTS = [
    { prompt: '今天天氣很', words: ['好', '熱', '冷', '晴朗', '奇怪'], z: [3.2, 2.6, 2.0, 1.4, -0.5] },
    { prompt: '我最喜歡吃', words: ['蘋果', '拉麵', '披薩', '冰淇淋', '石頭'], z: [2.8, 2.5, 2.1, 1.6, -1.2] }
  ];
  const SAMPLE_U = (() => { const r = MP.rng(2026); return Array.from({ length: 12 }, () => r()); })();

  // ---------- attention：手工設計的 Q、K、V ----------
  const SENTS = [
    ['小貓', '追', '球', '因為', '牠', '很', '好奇'],
    ['小貓', '追', '球', '因為', '它', '滾得', '很快']
  ];
  // Head 1 features: [動物性, 物體性, 動作性, 功能詞]
  const K1 = { 小貓: [2, 0, 0, 0], 追: [0, 0, 2, 0], 球: [0, 2, 0, 0], 因為: [0, 0, 0, 1], 牠: [1, 0, 0, 1], 它: [0, 1, 0, 1], 很: [0, 0, 0, 1], 好奇: [1, 0, 1, 0], 滾得: [0, 1, 1, 0], 很快: [0, 0, 1, 0] };
  const Q1 = { 小貓: [1, 0, 1, 0], 追: [1, 1, 0, 0], 球: [0, 0, 1, 0], 因為: [0, 0, 1, 1], 牠: [3, 0, 0, 0], 它: [0, 3, 0, 0], 很: [0, 0, 1, 0], 好奇: [2, 0, 0, 0], 滾得: [0, 2, 0, 0], 很快: [0, 2, 1, 0] };
  // Values: [動物, 物體, 動作]
  const VAL = { 小貓: [1, 0, 0], 追: [0, 0, 1], 球: [0, 1, 0], 因為: [0, 0, 0], 牠: [0.2, 0, 0], 它: [0, 0.2, 0], 很: [0, 0, 0], 好奇: [0, 0, 0.5], 滾得: [0, 0, 1], 很快: [0, 0, 0.5] };
  // Head 2 (previous-token head) is built from positions: k_j = [cos jφ, sin jφ, 0, 0], q_i = 7·[cos (i−1)φ, sin (i−1)φ, 0, 0].
  const PHI = Math.PI / 4;
  const vecQ = (head, words, i) => head === 0 ? Q1[words[i]] : [7 * Math.cos((i - 1) * PHI), 7 * Math.sin((i - 1) * PHI), 0, 0];
  const vecK = (head, words, j) => head === 0 ? K1[words[j]] : [Math.cos(j * PHI), Math.sin(j * PHI), 0, 0];
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

  // ---------- position：RoPE（3 對、base 100） ----------
  const THETA = [0, 1, 2].map(i => Math.pow(100, -2 * i / 6));
  const XV = [0.5, 0.9, 0.3, 0.7, 0.6, 0.4], YV = [0.8, 0.2, 0.6, 0.5, 0.3, 0.9];
  const pe = m => THETA.flatMap(t => [Math.sin(m * t), Math.cos(m * t)]);
  const ropeScore = gap => THETA.reduce((s, t) => s + Math.cos(gap * t), 0);
  const addScore = (m, n) => { const a = pe(m), b = pe(n); return XV.reduce((s, x, i) => s + (x + a[i]) * (YV[i] + b[i]), 0); };
  const deg = r => r * 180 / Math.PI;

  MP.register(
    {
      id: 'token', track: 'llm', symbol: 'P', name: '下一個字的機率', question: '手機怎麼猜下一個字？',
      title: '手機鍵盤怎麼猜到你下一個想打的詞？',
      intro: '你在手機打「我」，鍵盤上方馬上跳出「喜歡」「想」「很」。它不是會讀心，而是像一個<b>很會數數的小幫手</b>：翻遍讀過的句子，數一數「我」後面最常接什麼，再把次數變成比例（3/5、1/5…），這就是<b>條件機率</b>。ChatGPT、Claude 也是一次只猜「下一個 token」，只是它們不查次數表，而是用神經網路算出同一種機率。',
      scene: '模擬：手機輸入法聯想字＋自動完成灰字', viewH: 420,
      chart: '左上：AI 讀過的句子（紫＝前文、紅＝接在後面的詞）　右上：手機建議列與自動完成　下：P(下一個詞｜前文)',
      caption: '這是只讀 8 句話的「二元語法（bigram）」模型：只看前一個 token，用「次數 ÷ 總次數」估計機率。灰色句子代表 AI 還沒讀到；手機灰字是每一步都挑最高機率詞接下去的結果。',
      controls: [
        { key: 'ctx', label: '前一個詞（前文）', options: CONTEXTS, value: 0 },
        ['n', 'AI 讀過的句子', 1, 8, 1, 8, '句']
      ],
      play: 'n',
      try: '選「我」，把句子數從 1 拉到 8（或按播放）：最高機率的詞怎麼變？再選「很」或「天氣」，看看只讀 1 句時為什麼猜不出來。',
      resultLabel: 'AI 猜的下一個詞（機率最高）',
      takeaway: '語言模型只回答一個問題：給定前文，下一個 token 的機率分布是什麼？',
      application: '把「猜下一個」重複做幾百次，就能寫出一整段文章，這叫自迴歸生成；手機灰字、Gmail 自動完成、聊天機器人都是這樣一個一個接出來的。',
      tech: [
        ['📱', '手機輸入法聯想字', '根據你剛打的字，估計 P(下一個詞｜前文)，把機率最高的幾個詞放在建議列。'],
        ['✉️', 'Gmail 智慧撰寫', '你寫到一半，神經網路語言模型預測後面最可能的文字，用灰字顯示，按 Tab 就接受。'],
        ['🤖', 'ChatGPT／Claude／Gemini', '每一步對整個詞彙表（數萬到二十多萬個 token）輸出機率，挑一個接上後，再把它放回前文繼續猜。'],
        ['🎙️', '語音辨識（Siri、Google 語音輸入、Whisper）', '聲音聽起來一樣的「期中／其中」，用語言模型的條件機率判斷哪個在這句話裡比較通順。']
      ],
      teach: {
        grade: '國小六年級～國中七年級（比率、機率單元）',
        connect: '國小「分數、比率與百分率」、國中「機率＝某事件次數 ÷ 總次數」與統計的次數分配表、長條圖。',
        activity: '全班合寫 8 句短句貼在黑板（如「我喜歡吃蘋果」），學生用直線把句子切成詞（token）。每組負責一個詞（「我」「吃」「很」…），用正字記號數它後面接了哪些詞，算出分數與百分率並畫長條圖。最後玩「人肉輸入法」：老師說一個詞，各組舉出機率最高的下一個詞，全班接龍造句，看看會造出什麼句子。',
        ask: ['為什麼讀越多句子，猜得越準？只讀 1 句會發生什麼事？', '「我很」和「天氣很」後面接「好」的機率一樣嗎？只看前一個詞夠不夠？', '某個詞組從來沒出現過，它的機率真的是 0 嗎？'],
        myth: 'AI 不是在「查字典」或「背整句」。它每一步輸出的是一整串機率，再挑一個 token；真正的大型語言模型也不存次數表，而是用神經網路從整段前文算出機率，所以沒看過的句子也能合理地接下去。'
      },
      formula: 'P(w<sub>1</sub>…w<sub>T</sub>) = ∏<sub>t</sub> P(w<sub>t</sub> | w<sub>&lt;t</sub>)；二元語法：P̂(b | a) = count(a b) / Σ<sub>x</sub> count(a x)；神經網路：P(· | w<sub>&lt;t</sub>) = softmax(W h<sub>t</sub>)',
      formal: '第一式是機率的連鎖律，沒有任何近似：一句話的機率等於每個 token 在「前面所有 token」條件下的機率連乘。困難在於前文的組合多到數不完。n-gram 模型假設只有前 n−1 個 token 有影響（本例 n = 2，屬於馬可夫假設），用次數比例做最大概似估計；缺點是沒見過的組合機率為 0、分母為 0 時無法估計，傳統上用加一平滑、Kneser-Ney 等方法補救。Transformer 語言模型（GPT、Claude、Gemini、Llama）把整段前文編碼成向量 h<sub>t</sub>，乘上輸出矩陣 W 得到每個 token 的分數（logits），再做 softmax，得到大小為 |V| 的機率分布，|V| 通常是數萬到二十多萬。Token 由 BPE 等演算法從資料中學出：反覆把最常相鄰的片段合併成新 token，所以常見詞可能是一個 token，罕見字可能被拆成好幾個位元組片段。本模擬以「詞」當 token、只用 8 句話，並省略句首、句尾等特殊 token。',
      quiz: [
        { question: '「吃」後面出現過：蘋果 2 次、拉麵 1 次、蛋糕 1 次。P(蘋果｜吃) 是多少？', options: ['1/2', '1/3', '2/3'], answer: 0, why: '對！2 ÷ (2 + 1 + 1) = 1/2。條件機率只在「前面是吃」的那些情況裡算比例。', hint: '分母是「吃」後面接任何詞的總次數，也就是 4。' },
        { question: 'ChatGPT 這類大型語言模型產生回答時，每一步在做什麼？', options: ['從資料庫找出一整句現成的答案', '算出下一個 token 的機率分布，挑一個接上，再重複', '一次把整篇回答同時寫出來'], answer: 1, why: '對！這叫自迴歸生成：一次一個 token，接上後再猜下一個。', hint: '想想手機灰字是怎麼一個詞一個詞冒出來的。' }
      ],
      related: ['probability', 'fraction', 'softmax', 'crossentropy'],
      draw(k, v) {
        const { C } = k;
        const ctx = CONTEXTS[v.ctx], n = Math.round(v.n);
        const counts = bigrams(CORPUS.slice(0, n));
        const followers = FOLLOWERS.get(ctx) || [];
        const cnt = followers.map(w => counts.get(ctx)?.get(w) || 0);
        const total = cnt.reduce((a, b) => a + b, 0);
        const top = ranked(counts, ctx);
        // Corpus card.
        k.box(10, 8, 300, 246, { title: '📚 AI 讀過的句子（一格＝一個 token）' });
        CORPUS.forEach((s, i) => {
          const y = 34 + i * 26, isRead = i < n;
          k.text(26, y + 14.5, String(i + 1), { 'text-anchor': 'middle', 'font-size': 11, fill: isRead ? C.muted : '#b9c3be' });
          let x = 40;
          s.forEach((w, j) => {
            const width = 14 * w.length + 14;
            const isCtx = isRead && w === ctx && j < s.length - 1, isNext = isRead && j > 0 && s[j - 1] === ctx;
            const fill = !isRead ? C.graySoft : isCtx ? C.purpleSoft : isNext ? C.coralSoft : '#fff';
            const stroke = !isRead ? '#e0e5e2' : isCtx ? C.purple : isNext ? C.coral : '#cfd8d3';
            k.rect(x, y, width, 20, fill, { rx: 5, stroke, 'stroke-width': 1.3 });
            k.text(x + width / 2, y + 14.5, w, { 'text-anchor': 'middle', 'font-size': 13, fill: !isRead ? '#b3bdb8' : isNext ? C.coral : isCtx ? C.purple : C.ink, 'font-weight': isCtx || isNext ? 700 : 400 });
            x += width + 4;
          });
          if (!isRead) k.text(x + 4, y + 14.5, '還沒讀', { 'font-size': 11, fill: '#b3bdb8' });
        });
        // Phone with suggestion bar and autocomplete ghost text.
        k.box(320, 8, 270, 246, { fill: '#f1f4f2' });
        k.rect(365, 18, 180, 230, '#fff', { rx: 16, stroke: C.ink, 'stroke-width': 2 });
        k.rect(430, 24, 50, 5, '#cfd8d3', { rx: 2.5 });
        k.text(455, 45, '📱 手機打字中', { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: C.ink });
        const chain = [];
        let cur = ctx;
        for (let step = 0; step < 5; step++) { const r = ranked(counts, cur); if (!r.length) break; cur = r[0][0]; chain.push(cur); }
        k.text(377, 60, '自動完成（灰字＝AI 接的）', { 'font-size': 10 });
        k.rect(377, 68, 156, 34, C.blueSoft, { rx: 12 });
        const typed = k.text(386, 90, '', { 'font-size': 14 });
        k.el('tspan', { fill: C.ink, 'font-weight': 700 }, typed).textContent = ctx;
        k.el('tspan', { fill: '#9aa6a0' }, typed).textContent = chain.length ? chain.join('') : '……？';
        k.rect(377, 116, 156, 26, '#fff', { rx: 6, stroke: '#cfd8d3' });
        k.text(386, 134, `${ctx}｜`, { 'font-size': 13, fill: C.ink });
        for (let i = 0; i < 3; i++) {
          const x = 377 + i * 53, item = top[i];
          k.rect(x, 150, 50, 26, i === 0 && item ? C.purpleSoft : '#f3f5f4', { rx: 6, stroke: i === 0 && item ? C.purple : '#dfe5e2' });
          k.text(x + 25, 167.5, item ? item[0] : '—', { 'text-anchor': 'middle', 'font-size': 13, fill: item ? (i === 0 ? C.purple : C.ink) : '#b3bdb8', 'font-weight': i === 0 ? 700 : 400 });
        }
        for (let r = 0; r < 3; r++) for (let c = 0; c < 9 - r; c++) k.rect(377 + r * 8 + c * 17.3, 186 + r * 18, 14, 14, '#e8ecea', { rx: 3 });
        // Probability bars.
        k.text(20, 278, `P(下一個詞｜前文「${ctx}」)　讀了 ${n} 句`, { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        const base = 392, hgt = 92, x0 = 80, x1 = 580;
        for (const g of [0, 0.5, 1]) {
          k.line(x0, base - g * hgt, x1, base - g * hgt, g ? C.grid : C.axis, { 'stroke-width': g ? 1 : 2 });
          k.text(x0 - 8, base - g * hgt + 4, pct(g), { 'text-anchor': 'end', 'font-size': 11 });
        }
        const slot = (x1 - x0) / Math.max(3, followers.length);
        followers.forEach((w, i) => {
          const p = total ? cnt[i] / total : 0, cx = x0 + (x1 - x0 - slot * followers.length) / 2 + slot * (i + 0.5);
          const isTop = top.length && top[0][0] === w;
          k.rect(cx - 40, base - p * hgt, 80, p * hgt, isTop ? C.purple : C.coral, { rx: 3, opacity: isTop ? 1 : 0.75 });
          k.text(cx, base + 15, w, { 'text-anchor': 'middle', 'font-size': 13, fill: C.ink, 'font-weight': 700 });
          if (total) k.text(cx, base - p * hgt - 6, `${cnt[i]}/${total} = ${pct(p)}`, { 'text-anchor': 'middle', 'font-size': 12, fill: isTop ? C.purple : C.coral, 'font-weight': 700 });
        });
        if (!total) k.text(330, 342, `前 ${n} 句裡，「${ctx}」後面還沒出現過任何詞`, { 'text-anchor': 'middle', 'font-size': 13, fill: C.coral, 'font-weight': 700 });
        if (!total) return {
          result: '猜不出來！',
          detail: `前 ${n} 句裡「${ctx}」後面沒有接過任何詞：count = 0，0 ÷ 0 沒有意義。只靠次數表就會卡住；神經網路語言模型能從相似的詞推測。`
        };
        const others = top.slice(1).map(([w, c]) => `${w} ${c}/${total}`).join('、');
        return {
          result: `${top[0][0]}　${top[0][1]}/${total} = ${pct(top[0][1] / total)}`,
          detail: `P(${top[0][0]}｜${ctx}) = count(${ctx} ${top[0][0]}) ÷ count(${ctx} ＿) = ${top[0][1]} ÷ ${total} = ${(top[0][1] / total).toFixed(2)}。${others ? `其他：${others}。` : '只出現過這一種接法，所以是 100%。'}一直挑最高的接下去：「${ctx}${chain.join('')}」。`
        };
      }
    },

    {
      id: 'embedding', track: 'llm', symbol: 'cos', name: '詞向量', question: 'AI 怎麼知道詞的意思？',
      title: '搜尋「貓」，為什麼也會找到「狗」？',
      intro: '想像每個詞都住在一張大地圖上：意思相近的詞住在同一區，動物一區、水果一區、交通工具一區。AI 把每個詞變成一支從原點出發的<b>箭頭（向量）</b>，兩支箭頭的夾角越小，意思就越像。量「夾角有多小」的工具叫<b>餘弦相似度</b>：cos 越接近 1 越像，0 代表沒關係。',
      scene: '模擬：語意搜尋「找意思最像的詞」', viewH: 420,
      chart: '左：詞向量地圖（紫箭頭＝搜尋的詞、淡紫扇形＝cos 達門檻的範圍）　右：搜尋結果依 cos 排序',
      caption: '每個詞用一個 2 維向量表示，座標是手工擺放的示意值。真實的詞向量有數百到數千維，壓到 2 維只能保留大概的方向。類比題會排除題目用到的詞（國王、男人、女人）。',
      controls: [
        { key: 'q', label: '搜尋', options: ['貓', '蘋果', '汽車', '國王', '國王 − 男人 + 女人'], value: 0 },
        ['th', '相似度門檻 cos ≥', 0, 0.99, 0.01, 0.9, '']
      ],
      try: '搜尋「貓」，把門檻從 0.99 慢慢降到 0：扇形怎麼變寬？哪些詞依序被找到？最後選「國王 − 男人 + 女人」，最接近的詞是誰？',
      resultLabel: '最相似的詞',
      takeaway: '詞向量把「意思」變成「方向」；比較兩個詞的意思，就是算兩支箭頭夾角的 cos。',
      application: '同樣的方法也能比較整句話、整段文件，甚至圖片和聲音：先變成向量，再比方向。',
      tech: [
        ['📚', 'RAG（先搜尋、再回答）', '把文件切段轉成向量存進向量資料庫；提問時找出與問題 cos 最高的幾段，交給 ChatGPT、Claude 這類模型根據資料回答。'],
        ['🎵', 'Spotify／YouTube 推薦', '把歌曲、影片和你的喜好表示成向量，推薦方向相近、你可能也喜歡的內容。'],
        ['🖼️', '用文字找照片、以圖搜圖', 'CLIP 這類模型把圖片和文字放進同一個向量空間，打「海邊的狗」就能找到相近方向的照片。'],
        ['🛒', '電商語意搜尋', '搜「保暖外套」也能找到「羽絨衣」：兩者字面不同，但向量方向很接近。'],
        ['🤖', 'Transformer 的第一步', 'GPT、Claude、Gemini、Llama 一開始都把每個 token 查表換成嵌入向量，後面所有計算都在這些向量上進行。']
      ],
      teach: {
        grade: '國小六年級～國中八年級',
        connect: '國小「角度與量角器」、國中「直角坐標」、「畢氏定理（算箭頭長度）」；高中再接到向量內積與 cos。',
        activity: '在黑板畫一個大十字坐標。每組拿 6 張詞卡（貓、狗、蘋果、香蕉、汽車、公車），討論後把詞卡貼在覺得合理的位置，從原點畫箭頭到詞卡。用量角器量任兩支箭頭的夾角，用計算機（或查表）求 cos。比較：哪兩個詞夾角最小？各組貼的位置都不一樣，「最像的詞」排序還一樣嗎？',
        ask: ['為什麼用「夾角」，而不是「箭頭尖端的距離」來比較意思？', '兩支箭頭方向剛好相反時，cos 是多少？代表什麼？', '「國王 − 男人 + 女人」在地圖上是怎麼走的？為什麼會走到皇后附近？'],
        myth: '詞向量的每一維通常沒有「動物度」這種清楚的名稱；位置是模型從大量文字中「常在相似上下文出現」的規律學出來的。「國王 − 男人 + 女人 ≈ 皇后」是 word2vec 時代的經典例子，只是近似，而且通常要排除題目用到的詞才成立。'
      },
      formula: 'cos θ = (a·b) / (‖a‖ ‖b‖) = Σ<sub>i</sub> a<sub>i</sub>b<sub>i</sub> / (√Σ<sub>i</sub> a<sub>i</sub>² · √Σ<sub>i</sub> b<sub>i</sub>²)；類比：argmax<sub>w ∉ {國王, 男人, 女人}</sub> cos(v<sub>w</sub>, v<sub>國王</sub> − v<sub>男人</sub> + v<sub>女人</sub>)',
      formal: '嵌入（embedding）是一張查找表 E ∈ ℝ<sup>|V|×d</sup>：第 i 個 token 對應第 i 列的 d 維向量。這些數字一開始是亂數，訓練時和整個模型一起被梯度下降調整；在相似上下文出現的詞，向量方向會靠近（分布假說）。cos θ 只看方向不看長度，值域 [−1, 1]：1 同向、0 垂直、−1 反向；向量若先正規化成長度 1，cos 就等於內積，所以向量資料庫常用內積或 cos 做最近鄰搜尋，資料量大時改用 HNSW 等近似演算法。word2vec（2013）的類比現象來自向量空間中近似的線性結構，並非每組都成立。注意：Transformer 內每個 token 的向量會隨上下文改變（手機的「蘋果」和水果的「蘋果」最後會不同）；RAG 用的句子嵌入則是另外訓練的模型產生的。本模擬只有 2 維、13 個詞，座標是手工擺放的。',
      quiz: [
        { question: '兩個詞向量的夾角是 90°，餘弦相似度是多少？', options: ['1', '0', '−1'], answer: 1, why: '對！cos 90° = 0，代表兩個詞的方向互相垂直，幾乎沒有關係。', hint: '同方向是 1、反方向是 −1，剛好垂直在中間。' },
        { question: 'RAG 系統回答問題之前，通常怎麼找到相關的文件段落？', options: ['把問題也轉成向量，找 cos 最高的段落', '找出字數最多的段落', '隨機挑幾段'], answer: 0, why: '對！問題和段落都變成向量，方向最接近的段落最可能有答案。' }
      ],
      related: ['vector', 'pythagoras', 'attention', 'token'],
      draw(k, v) {
        const { C, fmt } = k;
        const analogy = v.q === 4;
        const qName = ['貓', '蘋果', '汽車', '國王', '國王−男人+女人'][v.q];
        const qv = analogy ? { x: WV.國王.x - WV.男人.x + WV.女人.x, y: WV.國王.y - WV.男人.y + WV.女人.y } : WV[qName];
        const excluded = analogy ? ['國王', '男人', '女人'] : [qName];
        const list = WORDS.filter(o => !excluded.includes(o.w)).map(o => ({ ...o, cos: cosine(qv, o) })).sort((a, b) => b.cos - a.cos);
        const best = list[0], hits = list.filter(o => o.cos >= v.th - 1e-9);
        // Map.
        k.box(10, 8, 370, 404, { title: '🗺️ 詞向量地圖（2 維示意）' });
        const cx = 195, cy = 222, s = 150, P = o => [cx + s * o.x, cy - s * o.y];
        k.line(cx - 172, cy, cx + 172, cy, C.grid, { 'stroke-width': 1.5 });
        k.line(cx, cy - 178, cx, cy + 172, C.grid, { 'stroke-width': 1.5 });
        k.circle(cx, cy, s, 'none', { stroke: '#d5ddd8', 'stroke-dasharray': '4 5', 'stroke-width': 1.2 });
        const phi = Math.atan2(qv.y, qv.x), alpha = Math.acos(MP.clamp(v.th, -1, 1)), R = 160;
        const cone = [[cx, cy]];
        for (let i = 0; i <= 40; i++) { const a = phi - alpha + 2 * alpha * i / 40; cone.push([cx + R * Math.cos(a), cy - R * Math.sin(a)]); }
        k.polygon(cone, C.purpleSoft, { opacity: 0.85 });
        if (analogy) {
          const [mx, my] = P(WV.男人), [wx, wy] = P(WV.女人), [kx, ky] = P(WV.國王), [qx, qy] = P(qv);
          k.arrow(mx, my, wx, wy, C.yellow, 2, { 'stroke-dasharray': '5 4' });
          k.line(cx, cy, kx, ky, C.gray, { 'stroke-width': 2, 'stroke-dasharray': '3 4' });
          k.arrow(kx, ky, qx, qy, C.yellow, 2.5, { 'stroke-dasharray': '5 4' });
          k.text((kx + qx) / 2 - 4, (ky + qy) / 2 + 20, '＋(女人−男人)', { 'text-anchor': 'middle', 'font-size': 11, fill: C.yellow, 'font-weight': 700, ...HALO });
          k.text(20, 384, '黃虛線：女人−男人（兩段同長、同方向）', { 'font-size': 11, fill: C.yellow, 'font-weight': 700 });
        }
        const [bx, by] = P(best);
        k.line(cx, cy, bx, by, C.green, { 'stroke-width': 2.5, 'stroke-dasharray': '6 4' });
        const [qx, qy] = P(qv);
        k.arrow(cx, cy, qx, qy, C.purple, 3.5);
        // Angle arc between query and best match.
        const pb = Math.atan2(best.y, best.x);
        let d = pb - phi; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        const arc = Array.from({ length: 21 }, (_, i) => { const a = phi + d * i / 20; return [cx + 34 * Math.cos(a), cy - 34 * Math.sin(a)]; });
        k.polyline(arc, C.ink, { 'stroke-width': 1.5 });
        for (const o of WORDS) {
          const [px, py] = P(o), n = Math.hypot(o.x, o.y), ux = o.x / n, uy = o.y / n;
          const isExcl = excluded.includes(o.w), isHit = hits.some(h => h.w === o.w), isBest = o.w === best.w;
          k.circle(px, py, isBest ? 7 : 5, C[o.c], { stroke: '#fff', 'stroke-width': 1.5, opacity: isExcl && analogy ? 0.55 : 1 });
          let anchor = ux > 0.35 ? 'start' : ux < -0.35 ? 'end' : 'middle';
          let lx = px + ux * 11, ly = py - uy * 12 + 4 + (uy < -0.6 ? 6 : uy > 0.6 ? -2 : 0);
          if (analogy && o.w === '皇后') { lx = px + 9; ly = py + 18; anchor = 'start'; }
          k.text(lx, ly, o.w, { 'text-anchor': anchor, 'font-size': 13, fill: isHit ? C.green : isExcl ? C.purple : C.ink, 'font-weight': isHit || isExcl ? 700 : 400 });
        }
        k.text(20, 403, `門檻 cos ≥ ${fmt(v.th, 2)} ⇔ 夾角 ≤ ${fmt(deg(alpha), 1)}°`, { 'font-size': 12, fill: C.purple, 'font-weight': 700 });
        // Search results.
        k.box(388, 8, 202, 404, { title: '🔍 語意搜尋' });
        k.rect(398, 30, 182, 28, '#fff', { rx: 14, stroke: C.purple, 'stroke-width': 1.5 });
        k.text(410, 49, qName, { 'font-size': 13, fill: C.ink, 'font-weight': 700 });
        k.text(402, 77, '詞', { 'font-size': 11 });
        k.text(444, 77, 'cos（虛線＝門檻）', { 'font-size': 11 });
        const bx0 = 444, bw = 100, rowY = i => 86 + i * 26;
        list.forEach((o, i) => {
          const y = rowY(i), hit = o.cos >= v.th - 1e-9;
          if (hit) k.rect(394, y - 2, 190, 24, C.greenSoft, { rx: 5 });
          k.text(402, y + 14, o.w, { 'font-size': 12, fill: hit ? C.green : C.ink, 'font-weight': hit ? 700 : 400 });
          k.rect(bx0, y + 5, bw, 10, '#eef1ee', { rx: 3 });
          if (o.cos > 0) k.rect(bx0, y + 5, bw * o.cos, 10, C[o.c], { rx: 3, opacity: 0.85 });
          k.text(584, y + 14, sgn(o.cos), { 'text-anchor': 'end', 'font-size': 11, fill: o.cos < 0 ? C.coral : C.ink });
        });
        const tx = bx0 + bw * v.th;
        k.line(tx, rowY(0) - 4, tx, rowY(list.length - 1) + 22, C.purple, { 'stroke-width': 1.5, 'stroke-dasharray': '4 3' });
        k.text(491, 403, hits.length ? `找到 ${hits.length} 個詞` : '沒有詞達到門檻', { 'text-anchor': 'middle', 'font-size': 12, fill: hits.length ? C.green : C.coral, 'font-weight': 700 });
        const na = Math.hypot(qv.x, qv.y), nb = Math.hypot(best.x, best.y);
        return {
          result: `${best.w}　cos = ${fmt(best.cos, 2)}`,
          detail: `cos = (a·b) ÷ (‖a‖‖b‖) = (${sgn(qv.x)}×${sgn(best.x)} + ${sgn(qv.y)}×${sgn(best.y)}) ÷ (${fmt(na, 2)}×${fmt(nb, 2)}) = ${fmt(best.cos, 3)}，夾角約 ${fmt(deg(Math.acos(MP.clamp(best.cos, -1, 1))), 1)}°。門檻 ${fmt(v.th, 2)} 時找到 ${hits.length} 個詞${hits.length ? '：' + hits.slice(0, 6).map(o => o.w).join('、') : ''}。`
        };
      }
    },

    {
      id: 'softmax', track: 'llm', symbol: 'σ', name: 'Softmax 與溫度', question: 'AI 為什麼每次回答不同？',
      title: '同一句話，為什麼 AI 每次接得都不一樣？',
      intro: '想像一個抽籤筒：「好」的籤放 49 支、「熱」放 27 支、「奇怪」只有 1 支。AI 每次從筒裡抽一支，所以大多時候說「好」，偶爾也會說別的。<b>Softmax</b> 負責把模型給每個詞的分數變成「每種籤佔幾成」；<b>溫度 T</b> 決定籤筒有多偏心：T 小，幾乎只抽第一名；T 大，冷門的詞也常被抽到。',
      scene: '模擬：聊天機器人按 12 次「重新生成」', viewH: 420,
      chart: '上：12 次生成結果　左下：機率長條（虛線框＝T = 1、不過濾時）　右下：softmax 計算表',
      caption: '分數 z（logits）是假設的示範值；真實模型會對整個詞彙表（數萬個 token）都算分數。抽樣用固定亂數種子，所以同樣設定每次畫面都相同；計算表先減去最高分再取 e 次方（實作防溢位的標準做法）。',
      controls: [
        { key: 'ctx', label: '句子開頭', options: PROMPTS.map(p => p.prompt + '…'), value: 0 },
        ['temp', '溫度 T', 0.1, 3, 0.1, 1, ''],
        { key: 'mode', label: '取樣方式', options: ['全部候選都可抽', 'top-k：只留前 2 名', 'top-p：累積到 80% 為止'], value: 0 }
      ],
      play: 'temp',
      try: '把 T 拉到 0.1：12 次回答變成什麼樣子？再拉到 3：冷門的「奇怪」被抽到了嗎？最後在 T = 3 時切換成 top-p，冷門詞還抽得到嗎？',
      resultLabel: '最可能的下一個詞',
      takeaway: 'Softmax 把任意分數變成加總為 1 的機率；溫度控制 AI 是「穩定保守」還是「天馬行空」。',
      application: '低溫度適合要精確的任務（算數、寫程式、查資料），高溫度適合腦力激盪和寫故事；溫度太高就容易冒出怪句子。',
      tech: [
        ['🤖', 'ChatGPT／Claude／Gemini API', '開發者可設定 temperature 與 top_p（部分也有 top_k）：模型先把 logits 除以 T 做 softmax，再依設定截掉長尾後抽樣。'],
        ['📷', '手機相簿與影像分類', '辨識模型最後一層用 softmax 把分數變成「貓 92%、狗 6%」這類信心值，再決定照片要歸到哪一類。'],
        ['🚗', '自駕車與機器人視覺', '物件偵測網路常用 softmax（或類似函數）判斷框裡是行人、汽車還是腳踏車，信心太低就保守處理。'],
        ['🎓', '知識蒸餾', '用較高溫度的 softmax 讓大模型的「次要答案」也露出來，教小模型模仿（Hinton 等人，2015）。']
      ],
      teach: {
        grade: '國小五年級～國中九年級',
        connect: '國小「百分率」「按比例分配」、國中「機率」與國九「指數（2 的次方成長很快）」。',
        activity: '用紙杯當籤筒、彩色吸管當籤。黑板寫 4 個候選詞與分數：好 2、熱 1.5、冷 1、奇怪 0。「低溫組」每個詞放 2 的（分數 × 2）次方支吸管（16、8、4、1 支）；「高溫組」放 2 的（分數 ÷ 2）次方支並四捨五入（2、2、1、1 支）。兩組各抽 10 次（抽完放回）記錄結果，比較哪一組的句子比較多變、哪一組比較常出現「今天天氣很奇怪」。',
        ask: ['把所有分數都加 10，機率會改變嗎？為什麼？', '溫度接近 0 時會發生什麼事？AI 還會有「創意」嗎？', '如果要 AI 算數學答案，你會把溫度調高還是調低？寫詩呢？'],
        myth: '溫度高不代表 AI 更聰明，只是更常抽到低機率的詞；太高時會冒出不通順或錯誤的句子。溫度 0 也不保證答案正確，只是每次都選分數最高的詞。'
      },
      formula: 'p<sub>i</sub> = e<sup>z<sub>i</sub>/T</sup> / Σ<sub>j</sub> e<sup>z<sub>j</sub>/T</sup>；T → 0⁺：argmax（貪婪解碼）；T → ∞：均勻分布；top-p：保留使 Σp ≥ p 的最小前段集合，再重新正規化',
      formal: 'z<sub>i</sub> 是模型最後一層輸出的分數（logit），可正可負；e<sup>x</sup> 恆正且遞增，除以總和後 p<sub>i</sub> ∈ (0, 1)、總和為 1，而且不改變分數的排名。所有 z 同加一個常數，機率不變，所以實作時先減去最大值以免 e<sup>z</sup> 溢位（本表就是這樣算）。溫度把 logits 除以 T：T &lt; 1 放大差距（分布變尖），T &gt; 1 縮小差距（分布變平）。top-k 只保留 k 個最高者；top-p（nucleus sampling）保留累積機率達 p 的最小集合，兩者都是截掉長尾再重新正規化（讓總和回到 1）。softmax 是 log-sum-exp 函數的梯度，訓練時搭配交叉熵，對 logits 的梯度就是 p − y，非常簡潔。實作上溫度 0 通常直接取最大值，而且伺服器的平行浮點運算有時仍會造成極小差異。本模擬只有 5 個候選詞，分數為假設值。',
      quiz: [
        { question: '把溫度 T 調到非常小（接近 0），AI 會怎麼選字？', options: ['幾乎每次都選分數最高的詞', '每個詞被選到的機會都一樣', '只選分數最低的詞'], answer: 0, why: '對！z/T 讓分數差距被放大很多倍，第一名的機率趨近 100%。', hint: '試試把滑桿拉到 0.1，看 12 次結果。' },
        { question: '三個詞的分數是 2、1、0，全部加 5 變成 7、6、5 之後，softmax 機率會？', options: ['全部變大', '完全不變', '最高的變成 100%'], answer: 1, why: '對！e^(z+5) = e^5 × e^z，分子分母同乘 e^5 就約掉了。',hint: '機率是「比例」，大家一起乘上同一個數，比例不變。' }
      ],
      related: ['exponential', 'probability', 'token', 'crossentropy'],
      draw(k, v) {
        const { C, fmt } = k;
        const P = PROMPTS[v.ctx], T = v.temp, z = P.z, n = z.length;
        const zmax = Math.max(...z), ex = z.map(x => Math.exp((x - zmax) / T)), sum = ex.reduce((a, b) => a + b, 0);
        const p = ex.map(e => e / sum), p1 = k.softmax(z, 1);
        const order = p.map((_, i) => i).sort((a, b) => p[b] - p[a]);
        const keep = new Set();
        if (v.mode === 1) order.slice(0, 2).forEach(i => keep.add(i));
        else if (v.mode === 2) { let c = 0; for (const i of order) { keep.add(i); c += p[i]; if (c >= 0.8 - 1e-12) break; } }
        else order.forEach(i => keep.add(i));
        const keptSum = [...keep].reduce((s, i) => s + p[i], 0);
        const q = p.map((x, i) => (keep.has(i) ? x / keptSum : 0));
        const cum = q.reduce((a, x) => { a.push((a.length ? a[a.length - 1] : 0) + x); return a; }, []);
        const picks = SAMPLE_U.map(u => { const i = cum.findIndex(c => u < c - 1e-12); return i < 0 ? order[0] : i; });
        const tally = z.map((_, i) => picks.filter(x => x === i).length);
        // Chat window.
        k.box(10, 8, 580, 142, { title: '💬 聊天機器人　同一個問題按 12 次「重新生成」' });
        k.rect(372, 18, 206, 26, C.blueSoft, { rx: 13 });
        k.text(475, 36, `幫我接下去：${P.prompt}…`, { 'text-anchor': 'middle', 'font-size': 12, fill: C.ink });
        picks.forEach((w, i) => {
          const x = 22 + (i % 6) * 94, y = 56 + Math.floor(i / 6) * 44, col = C[PALETTE[w]];
          k.rect(x, y, 88, 34, C[PALETTE[w] + 'Soft'], { rx: 10, stroke: col, 'stroke-width': 1.3 });
          k.text(x + 8, y + 14, `#${i + 1}`, { 'font-size': 10, fill: C.muted });
          k.text(x + 44, y + 28, `…${P.prompt.slice(-1)}${P.words[w]}`, { 'text-anchor': 'middle', 'font-size': 13, fill: C.ink, 'font-weight': 700 });
        });
        // Probability bars.
        const base = 384, hgt = 170, bx0 = 58, slot = 56;
        k.text(20, 172, `機率 p（T = ${fmt(T, 1)}）`, { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        for (const g of [0, 0.5, 1]) {
          k.line(bx0, base - g * hgt, bx0 + slot * n, base - g * hgt, g ? C.grid : C.axis, { 'stroke-width': g ? 1 : 2 });
          k.text(bx0 - 6, base - g * hgt + 4, pct(g), { 'text-anchor': 'end', 'font-size': 11 });
        }
        z.forEach((_, i) => {
          const x = bx0 + slot * i + 8, w = slot - 16, col = C[PALETTE[i]];
          k.rect(x, base - q[i] * hgt, w, q[i] * hgt, col, { rx: 3, opacity: keep.has(i) ? 0.9 : 0.25 });
          k.rect(x, base - p1[i] * hgt, w, p1[i] * hgt, 'none', { stroke: C.ink, 'stroke-dasharray': '3 3', 'stroke-width': 1.2 });
          const top = Math.min(base - q[i] * hgt, base - p1[i] * hgt);
          k.text(x + w / 2, top - 5, keep.has(i) ? pct(q[i]) : '刪去', { 'text-anchor': 'middle', 'font-size': 11, fill: keep.has(i) ? col : C.muted, 'font-weight': 700 });
          k.text(x + w / 2, base + 15, P.words[i], { 'text-anchor': 'middle', 'font-size': 12, fill: C.ink, 'font-weight': 700 });
          k.text(x + w / 2, base + 29, `×${tally[i]}`, { 'text-anchor': 'middle', 'font-size': 11, fill: tally[i] ? col : C.muted });
        });
        // Computation table.
        const tx = 352, cols = [tx + 8, tx + 70, tx + 112, tx + 168, tx + 222];
        k.box(tx - 4, 162, 242, 250, { fill: '#f7f8f6' });
        k.text(tx + 6, 182, 'softmax 計算表', { 'font-size': 12, 'font-weight': 700, fill: C.ink });
        ['詞', 'z', 'z/T', 'e^(…)', 'p'].forEach((h, c) => k.text(cols[c], 204, h, { 'font-size': 11, 'text-anchor': c ? 'end' : 'start', 'font-weight': 700 }));
        const small = x => (x >= 0.001 ? x.toFixed(3) : x.toExponential(0).replace('e-', 'e−'));
        z.forEach((zi, i) => {
          const y = 228 + i * 25, dim = !keep.has(i);
          if (i === order[0]) k.rect(tx + 2, y - 15, 232, 22, C.purpleSoft, { rx: 4 });
          const cells = [P.words[i], zi1(zi), zi1(zi / T), small(ex[i]), pct(p[i], 1)];
          cells.forEach((t, c) => k.text(cols[c], y, t, { 'font-size': 12, 'text-anchor': c ? 'end' : 'start', fill: dim ? '#a8b3ad' : c === 4 ? C[PALETTE[i]] : C.ink, 'font-weight': c === 4 || c === 0 ? 700 : 400 }));
        });
        k.line(tx + 6, 352, tx + 230, 352, C.axis, { 'stroke-width': 1 });
        k.text(cols[0], 370, 'Σ e^(…)', { 'font-size': 12, fill: C.ink });
        k.text(cols[3], 370, fmt(sum, 3), { 'font-size': 12, 'text-anchor': 'end', fill: C.ink, 'font-weight': 700 });
        k.text(cols[4], 370, '100%', { 'font-size': 12, 'text-anchor': 'end', fill: C.ink });
        k.text(tx + 6, 396, 'e^(…) = e^((z − 最高分)/T)', { 'font-size': 11 });
        const b = order[0];
        const filterNote = v.mode === 0 ? '' : `；${v.mode === 1 ? 'top-k' : 'top-p'} 留下 ${keep.size} 個詞，除以 ${fmt(keptSum, 3)} 重新正規化 → ${pct(q[b], 1)}`;
        const tallyText = order.filter(i => tally[i]).map(i => `${P.words[i]}×${tally[i]}`).join('、');
        return {
          result: `${P.words[b]}　${pct(q[b], 1)}`,
          detail: `p(${P.words[b]}) = e^(${zi1(z[b])}/${fmt(T, 1)}) ÷ Σ e^(z/T)；先減最高分 ${zi1(zmax)} 後 = ${fmt(ex[b], 3)} ÷ ${fmt(sum, 3)} = ${pct(p[b], 1)}${filterNote}。12 次重新生成：${tallyText}。`
        };
      }
    },

    {
      id: 'attention', track: 'llm', symbol: 'QK', name: '注意力機制', question: 'AI 怎麼知道「牠」是誰？',
      title: '「因為牠很好奇」：AI 怎麼知道「牠」指的是誰？',
      intro: '讀到「牠」的時候，你會往前找一個會「好奇」的動物：小貓。AI 也一樣：每個詞舉手發問（<b>Query</b>），前面的詞舉著自己的名牌（<b>Key</b>），問題和名牌越配，就越<b>注意</b>它，再把那些詞的內容（<b>Value</b>）依注意程度混在一起。這就是 GPT、Claude、Gemini 裡最核心的零件：注意力機制。',
      scene: '模擬：閱讀理解小幫手判斷代名詞指誰', viewH: 420,
      chart: '上：句子與注意力弧線（越粗＝越注意；虛線框＝未來的詞，看不到）　左下：分數與權重　右下：輸出向量與 AI 回答',
      caption: 'Q、K 是手工設計的 4 維向量、V 是 3 維（動物、物體、動作）；第 2 頭的 Q、K 只由位置組成。採用 GPT 類模型的因果遮罩：每個詞只能注意自己和前面的詞。真實模型的 Q、K、V 由學出來的矩陣乘出，有幾十層、每層很多頭。',
      controls: [
        { key: 's', label: '句子', options: ['小貓追球，因為牠很好奇', '小貓追球，因為它滾得很快'], value: 0 },
        ['q', '提問的詞（第幾個）', 1, 7, 1, 5, ''],
        { key: 'head', label: '注意力頭', options: ['第 1 頭：找意思相關的詞', '第 2 頭：看前一個詞'], value: 0 }
      ],
      try: '先看第 5 個詞「牠」最注意誰，再切換成「它」的句子：粗弧線跑去哪裡？把提問的詞換成第 7 個，再切到「第 2 頭」，弧線有什麼不同？',
      resultLabel: '提問的詞最注意',
      takeaway: '注意力＝用 Q·K 算「誰跟我有關」→ softmax 變成權重 → 把 V 加權平均。',
      application: '一層注意力讓每個詞都能「去別的詞那裡拿資訊」；疊幾十層之後，模型就能處理代名詞、長距離的邏輯關係與上下文。',
      tech: [
        ['🤖', 'GPT、Claude、Gemini、Llama', '都是 Transformer：每層有多個注意力頭，生成時每個新 token 透過因果遮罩注意前面所有 token。'],
        ['🌐', '機器翻譯', '現代注意力最早就是為神經機器翻譯發展的：產生譯文的每個詞時，去對齊原文中最相關的詞。'],
        ['🎙️', 'Whisper 語音辨識', '把聲音切成一小段一小段當作 token，用 Transformer 的注意力把聲音片段對應成文字。'],
        ['🧬', 'AlphaFold', '用注意力讓蛋白質的每個胺基酸「看」其他胺基酸，推測哪些會在 3D 結構中靠在一起。'],
        ['🖼️', 'ViT 影像模型', '把圖片切成小方塊當 token，用自注意力找出畫面各區域之間的關係。']
      ],
      teach: {
        grade: '國小五年級～國中九年級',
        connect: '國語「代名詞」、國小「百分率與加權平均」、國中「正負數乘法」：內積就是「對應的數相乘再相加」。',
        activity: '把「小貓追球，因為牠很好奇」的 7 個詞做成大字卡，請 7 位同學拿卡站成一排，卡背寫 4 個數字當 Key（例如小貓 2,0,0,0；球 0,2,0,0）。拿「牠」的同學手持 Query 卡（3,0,0,0），走到左邊每位同學面前，全班一起算「對應數字相乘再相加」寫在黑板；分數最高的人用最粗的毛線連到「牠」。最後討論：換成「它滾得很快」時，Query 卡要怎麼改？',
        ask: ['為什麼「牠」不能注意後面的詞？（想想 AI 是一個字一個字寫出來的）', '如果每個詞都平均注意所有詞，會發生什麼事？', '為什麼要好幾個「頭」，而不是只有一個？'],
        myth: '注意力權重不等於「AI 的理由」，也不是理解的證明；它只是一種加權平均。真正的模型有幾十層、每層很多頭，只看一個頭的弧線，無法完整解釋模型為什麼這樣回答。'
      },
      formula: 'Attention(Q, K, V) = softmax(QK<sup>T</sup> / √d<sub>k</sub> + M) V；M<sub>ij</sub> = 0（j ≤ i）、−∞（j &gt; i）；MultiHead(X) = Concat(head<sub>1</sub>, …, head<sub>h</sub>) W<sup>O</sup>，head<sub>r</sub> = Attention(XW<sub>Q</sub><sup>r</sup>, XW<sub>K</sub><sup>r</sup>, XW<sub>V</sub><sup>r</sup>)',
      formal: '每個 token 的向量 x<sub>i</sub> 乘上三個學出來的矩陣，得到 q<sub>i</sub> = W<sub>Q</sub>x<sub>i</sub>、k<sub>i</sub> = W<sub>K</sub>x<sub>i</sub>、v<sub>i</sub> = W<sub>V</sub>x<sub>i</sub>。分數 q<sub>i</sub>·k<sub>j</sub> 衡量「i 想找的」和「j 提供的」有多配；除以 √d<sub>k</sub> 是因為各分量獨立、變異數為 1 時，內積的變異數是 d<sub>k</sub>，不縮放的話 softmax 會太尖、梯度變得很小。遮罩 M 讓 GPT 類解碼器只能看自己和前面的 token（因果遮罩），訓練時才能同時讓每個位置學「預測下一個」。輸出 Σ<sub>j</sub> a<sub>ij</sub> v<sub>j</sub> 是 V 的加權平均（凸組合），之後還會經過殘差連接與前饋網路。多頭注意力讓不同的頭用各自的 W<sub>Q</sub>, W<sub>K</sub>, W<sub>V</sub> 關注不同關係（語意、前一個詞、句法…），再接起來乘 W<sup>O</sup>。計算量隨長度 n 為 O(n²)，所以很長的文件很貴，FlashAttention、KV 快取等技術就是為了加速。本模擬 d<sub>k</sub> = 4，兩個頭共用同一組 V，數值為手工設計。',
      quiz: [
        { question: 'GPT 類模型讀到「牠」時，為什麼不能注意後面的「好奇」？', options: ['因為因果遮罩：生成時後面的字還沒寫出來', '因為「好奇」不是名詞', '因為注意力只能看前一個詞'], answer: 0, why: '對！遮罩把未來位置的分數設成 −∞，softmax 後權重是 0。' },
        { question: '注意力權重是怎麼算出來的？', options: ['把 V 的長度除以句子長度', 'Q 和 K 的內積除以 √d，再做 softmax', '依照詞的筆畫多寡決定'], answer: 1, why: '對！先算 q·k/√d 當分數，再用 softmax 變成加總為 1 的權重。', hint: '看看左下角表格的兩欄：分數 → 權重。' }
      ],
      related: ['softmax', 'embedding', 'matrix', 'position'],
      draw(k, v) {
        const { C, fmt } = k;
        const words = SENTS[v.s], qi = Math.round(v.q) - 1, head = v.head, N = words.length;
        const q = vecQ(head, words, qi);
        const scores = words.map((_, j) => (j <= qi ? dot(q, vecK(head, words, j)) / 2 : -Infinity));
        const vis = scores.slice(0, qi + 1), mx = Math.max(...vis), ex = vis.map(s => Math.exp(s - mx)), sum = ex.reduce((a, b) => a + b, 0);
        const wts = words.map((_, j) => (j <= qi ? ex[j] / sum : 0));
        const best = wts.indexOf(Math.max(...wts));
        // Sentence with arcs.
        k.box(10, 8, 580, 172, { title: '🧠 注意力：「' + words[qi] + '」往前看' });
        const xs = words.map((_, j) => 52 + j * 82.6), ty = 140;
        for (let j = 0; j <= qi; j++) {
          const w = wts[j]; if (w < 0.004) continue;
          const width = 1 + 13 * w, col = j === best ? C.purple : C.blue;
          if (j === qi) {
            k.path(`M${xs[j] - 10},${ty} C${xs[j] - 26},${ty - 40} ${xs[j] + 26},${ty - 40} ${xs[j] + 10},${ty}`, col, { 'stroke-width': width, opacity: 0.75, fill: 'none' });
            if (w >= 0.03) k.text(xs[j], ty - 36, pct(w), { 'text-anchor': 'middle', 'font-size': 11, fill: col, 'font-weight': 700, ...HALO });
          } else {
            const h = 22 + 13 * (qi - j), sx = xs[qi] - 22 + 16 * j / qi, mxm = (xs[j] + 6 + sx) / 2;
            k.path(`M${sx},${ty} Q${mxm},${ty - 2 * h} ${xs[j] + 6},${ty}`, col, { 'stroke-width': width, opacity: 0.75, fill: 'none' });
            if (w >= 0.03) k.text(mxm, ty - h - 4 - width / 2, pct(w), { 'text-anchor': 'middle', 'font-size': 11, fill: col, 'font-weight': 700, ...HALO });
          }
        }
        words.forEach((w, j) => {
          const future = j > qi, isQ = j === qi, bw = 18 * w.length + 20;
          k.rect(xs[j] - bw / 2, ty, bw, 28, isQ ? C.coralSoft : future ? '#f6f7f6' : j === best ? C.purpleSoft : '#fff', { rx: 7, stroke: isQ ? C.coral : future ? '#cfd8d3' : j === best ? C.purple : '#b9c5bf', 'stroke-width': isQ ? 2 : 1.3, 'stroke-dasharray': future ? '4 3' : undefined });
          k.text(xs[j], ty + 19.5, w, { 'text-anchor': 'middle', 'font-size': 15, fill: future ? '#b3bdb8' : C.ink, 'font-weight': isQ ? 700 : 400 });
          k.text(xs[j], ty + 41, isQ ? '提問 Q' : future ? '看不到' : String(j + 1), { 'text-anchor': 'middle', 'font-size': 10, fill: isQ ? C.coral : '#a8b3ad' });
        });
        // Score table.
        k.box(10, 190, 330, 222, { title: `計算（${head === 0 ? '第 1 頭：意思' : '第 2 頭：位置'}）` });
        ['詞', 'q·k/√d', '權重（softmax）'].forEach((h, c) => k.text([22, 140, 160][c], 230, h, { 'font-size': 11, 'font-weight': 700, 'text-anchor': c === 1 ? 'end' : 'start' }));
        words.forEach((w, j) => {
          const y = 252 + j * 22, future = j > qi;
          if (j === best) k.rect(16, y - 15, 318, 21, C.purpleSoft, { rx: 4 });
          k.text(22, y, w, { 'font-size': 12, fill: future ? '#b3bdb8' : C.ink, 'font-weight': j === best ? 700 : 400 });
          k.text(140, y, future ? '−∞ 遮罩' : sgn(scores[j]), { 'font-size': 12, 'text-anchor': 'end', fill: future ? '#b3bdb8' : C.ink });
          k.rect(160, y - 10, 120, 10, '#eef1ee', { rx: 3 });
          if (!future) k.rect(160, y - 10, 120 * wts[j], 10, j === best ? C.purple : C.blue, { rx: 3 });
          k.text(328, y, future ? '0%' : pct(wts[j]), { 'font-size': 11, 'text-anchor': 'end', fill: future ? '#b3bdb8' : C.ink });
        });
        // Output vector and chat answer.
        const out = [0, 1, 2].map(c => words.reduce((s, w, j) => s + wts[j] * VAL[w][c], 0));
        k.box(350, 190, 240, 222, { title: '輸出 = Σ 權重 × V' });
        ['動物', '物體', '動作'].forEach((f, c) => {
          const y = 222 + c * 24;
          k.text(362, y + 9, f, { 'font-size': 12, fill: C.ink });
          k.rect(400, y, 130, 11, '#eef1ee', { rx: 3 });
          k.rect(400, y, 130 * MP.clamp(out[c], 0, 1), 11, [C.coral, C.blue, C.green][c], { rx: 3 });
          k.text(578, y + 10, fmt(out[c], 2), { 'font-size': 11, 'text-anchor': 'end', fill: C.ink });
        });
        const pron = words[qi] === '牠' || words[qi] === '它';
        k.rect(364, 300, 212, 28, C.blueSoft, { rx: 12 });
        k.text(470, 319, pron ? `「${words[qi]}」指的是誰？` : `「${words[qi]}」在看哪個詞？`, { 'text-anchor': 'middle', 'font-size': 12, fill: C.ink });
        k.text(364, 352, '🤖', { 'font-size': 16, fill: C.ink });
        k.rect(388, 336, 188, 30, C.purpleSoft, { rx: 12 });
        k.text(482, 356, `${words[best]}（權重 ${pct(wts[best])}）`, { 'text-anchor': 'middle', 'font-size': 13, fill: C.purple, 'font-weight': 700 });
        k.text(364, 392, head === 0 ? '第 1 頭用意思配對 Q 與 K' : '第 2 頭只用位置：q 指向前一格', { 'font-size': 11 });
        const kb = vecK(head, words, best);
        const terms = q.map((x, i) => [x, kb[i]]).filter(([a, b]) => Math.abs(a * b) > 1e-9).map(([a, b]) => `${fmt(a, head ? 2 : 0)}×${fmt(b, head ? 2 : 0)}`.replace(/-/g, '−'));
        return {
          result: `${words[best]}　${pct(wts[best])}`,
          detail: `「${words[qi]}」對「${words[best]}」：q·k/√d = (${terms.join(' + ') || '0'}) ÷ √4 = ${sgn(scores[best])}；softmax 後權重 = e^${sgn(scores[best])} ÷ Σ = ${pct(wts[best], 1)}。輸出向量 = Σ 權重 × v = (${out.map(x => fmt(x, 2)).join(', ')})。${qi < N - 1 ? `後面 ${N - 1 - qi} 個詞被遮罩。` : ''}`
        };
      }
    },

    {
      id: 'position', track: 'llm', symbol: 'θ', name: '位置編碼', question: 'AI 怎麼知道字的順序？',
      title: '「小貓追球」和「球追小貓」：AI 怎麼分辨順序？',
      intro: '注意力只會比較「誰跟誰配」，本身分不出誰在前、誰在後。所以 AI 給每個字配一組「時鐘」：秒針轉很快、分針中等、時針很慢，第 m 個字就把指針轉 m 格。兩個字差幾格，看兩支針的<b>夾角</b>就知道，而且不管這句話在文件開頭還是第 500 個字，夾角都一樣。這招叫 <b>RoPE 旋轉位置編碼</b>。',
      scene: '模擬：AI 讀長文件，同一句話出現在不同位置', viewH: 430,
      chart: '上：文件中的位置（紅＝小貓、藍＝球）　中：三組轉盤（快、中、慢）與分數　下：注意力分數 vs. 整句往後移',
      caption: '用 6 維向量（3 對）示範，轉速 θ<sub>i</sub> = 100<sup>−2i/6</sup>（真實模型常用 10000，慢針慢到幾乎看不出在動）。q、k 旋轉前都指向正上方，逆時針轉；灰線是「把 sin／cos 位置向量加到詞向量」的舊方法，作為對照。',
      controls: [
        ['gap', '小貓和球相距', 1, 12, 1, 2, '格'],
        ['shift', '整句往後移', 0, 40, 1, 0, '格']
      ],
      play: 'shift',
      try: '按播放讓整句往後移：三個轉盤的針都在轉，但夾角和紫色分數有變嗎？灰線呢？再改「相距」，哪一個轉盤的夾角變最多？',
      resultLabel: 'RoPE 注意力分數 q·k',
      takeaway: 'RoPE 用「轉角度」記位置：兩個字的內積只取決於相距幾格，而不是絕對位置。',
      application: '因為只看相對距離，模型在文件開頭學到的「主詞—動詞」關係，搬到第一萬個字也一樣適用。',
      tech: [
        ['🦙', 'Llama、Qwen、Mistral、Gemma', '許多開源大型語言模型都用 RoPE：每一層的 q、k 依位置旋轉後再算注意力。'],
        ['📚', '長文件延伸', 'Position Interpolation、NTK 縮放、YaRN 等技術調整旋轉的角速度，讓模型能讀比訓練時更長的文件。'],
        ['🌐', '原始 Transformer（2017）', '最早的翻譯模型把 sin／cos 波形的位置向量「加」到詞向量上，和傅立葉級數用的是同一族函數。'],
        ['🧠', 'BERT、GPT-2', '用「學出來」的絕對位置向量（每個位置一個可訓練向量），所以最長只能讀到訓練時設定的長度。']
      ],
      teach: {
        grade: '國小四年級～國中八年級',
        connect: '國小「時鐘與角度」「量角器」、國中「坐標平面上的旋轉」；高中三角函數 cos 的週期性。',
        activity: '每人用厚紙剪一個圓盤，用雙腳釘固定紅、藍兩支紙指針。規則：「第 m 個字，指針從 12 點方向逆時針轉 m × 30°」。紅針放「小貓」的位置（第 1 個字）、藍針放「球」的位置（第 3 個字），用量角器量夾角。接著假設句子前面多了 3 個字（兩支針都再轉 90°），重量一次夾角；最後換成每格 10° 的「慢盤」，比較快盤與慢盤。',
        ask: ['整句往後移，兩支針都轉了，為什麼夾角不變？', '快盤每格 30°，相距 0 格和相距 12 格看起來一樣，怎麼辦？慢盤能幫什麼忙？', '如果完全不給位置資訊，「小貓追球」和「球追小貓」對注意力來說有什麼不同？'],
        myth: '位置編碼不是直接在詞上標「1、2、3」那麼簡單：用很大的數字會讓向量數值爆大，模型也很難推廣到更長的句子；用多種速度的旋轉（或波形），才能同時分辨近距離和遠距離。'
      },
      formula: 'RoPE：第 i 對座標 (x<sub>2i</sub>, x<sub>2i+1</sub>) 旋轉 mθ<sub>i</sub>，θ<sub>i</sub> = b<sup>−2i/d</sup>（b = 10000）；⟨R<sub>m</sub>q, R<sub>n</sub>k⟩ = ⟨q, R<sub>n−m</sub>k⟩ = Σ<sub>i</sub> |q<sub>i</sub>||k<sub>i</sub>| cos((n−m)θ<sub>i</sub> + φ<sub>i</sub>)；正弦式：PE(m, 2i) = sin(m·θ<sub>i</sub>)、PE(m, 2i+1) = cos(m·θ<sub>i</sub>)',
      formal: '沒有遮罩的自注意力對 token 的排列是「置換等變」的：打亂順序，每個 token 得到的結果只是跟著換位置，所以必須另外注入位置（因果遮罩本身會透露一點順序資訊，但主流模型仍明確加入位置編碼）。RoPE（Su 等人，2021，RoFormer）把 q、k 的 d 維拆成 d/2 對，每對在平面上旋轉 mθ<sub>i</sub>。旋轉矩陣滿足 R<sub>m</sub><sup>T</sup>R<sub>n</sub> = R<sub>n−m</sub>，所以內積只取決於相對距離 n − m，這正是本模擬「整句往後移分數不變」的原因；φ<sub>i</sub> 是 q、k 第 i 對原本的夾角。θ<sub>i</sub> 從 1 rad/格開始等比遞減，像秒針、分針、時針：快的分辨近距離，慢的分辨遠距離且不會太快繞回原點。原始 Transformer（2017）把 sin／cos 位置向量加到詞向量上，p<sub>m</sub>·p<sub>n</sub> 雖然只和 m − n 有關，但詞向量與位置向量的交叉項仍與絕對位置有關（灰線會起伏）。長文件延伸方法（Position Interpolation 把位置等比例壓縮、YaRN 對不同頻率分別縮放）都是在調整 mθ<sub>i</sub>。本模擬只有 3 對、b 改成 100、φ<sub>i</sub> = 0，灰線的詞向量是任意示範值，且省略了 W<sub>Q</sub>、W<sub>K</sub>。',
      quiz: [
        { question: '用 RoPE 時，「小貓」在第 3 格、「球」在第 5 格，和「小貓」在第 103 格、「球」在第 105 格，注意力分數會？', options: ['一樣，因為只和相距 2 格有關', '後者比較大', '後者比較小'], answer: 0, why: '對！兩支針都多轉了 100 格，夾角不變，內積也不變。' },
        { question: '為什麼 RoPE 要用好幾種不同的轉速？', options: ['讓計算比較快', '快的分辨近距離、慢的分辨遠距離，避免轉一圈後分不清', '因為每個詞的筆畫不同'], answer: 1, why: '對！只用快針，相距 0 格和繞一整圈會分不清；慢針幫忙分辨遠距離。', hint: '想想時鐘只有秒針會怎樣。' }
      ],
      related: ['fourier', 'circle', 'attention', 'vector'],
      draw(k, v) {
        const { C, fmt } = k;
        const gap = Math.round(v.gap), shift = Math.round(v.shift), m = 2 + shift, n = m + gap;
        const rope = ropeScore(gap), add = addScore(m, n);
        // Document ruler.
        k.box(10, 8, 580, 82, { title: `📄 長文件：前面多了 ${shift} 個字，「小貓…球」從第 ${m} 格開始` });
        const rx = pos => 40 + pos * 8.8;
        k.rect(rx(0), 50, rx(m) - rx(0) - 4, 14, C.graySoft, { rx: 3 });
        k.line(rx(0), 64, rx(60), 64, C.axis, { 'stroke-width': 1.5 });
        for (let i = 0; i <= 60; i += 5) {
          k.line(rx(i), 64, rx(i), i % 10 ? 68 : 71, C.axis, { 'stroke-width': 1 });
          if (i % 10 === 0) k.text(rx(i), 83, String(i), { 'text-anchor': 'middle', 'font-size': 10 });
        }
        k.rect(rx(m) - 3, 50, rx(n) - rx(m) + 6, 14, C.purpleSoft, { rx: 3 });
        k.circle(rx(m), 57, 6, C.coral, { stroke: '#fff', 'stroke-width': 1.5 });
        k.circle(rx(n), 57, 6, C.blue, { stroke: '#fff', 'stroke-width': 1.5 });
        const mid = (rx(m) + rx(n)) / 2, labX = MP.clamp(mid, 60, 540);
        k.text(rx(m) - 9, 44, '小貓', { 'text-anchor': 'end', 'font-size': 11, fill: C.coral, 'font-weight': 700 });
        k.text(rx(n) + 9, 44, '球', { 'text-anchor': 'start', 'font-size': 11, fill: C.blue, 'font-weight': 700 });
        if (gap >= 4) k.text(labX, 44, `相距 ${gap}`, { 'text-anchor': 'middle', 'font-size': 10, fill: C.purple });
        // Three rotation dials.
        const names = ['快（秒針）', '中（分針）', '慢（時針）'];
        THETA.forEach((t, i) => {
          const cx = 75 + i * 128, cy = 178, r = 50;
          k.circle(cx, cy, r, '#fff', { stroke: '#cfd8d3', 'stroke-width': 1.5 });
          for (let a = 0; a < 12; a++) { const ang = a * Math.PI / 6; k.line(cx + (r - 5) * Math.cos(ang), cy - (r - 5) * Math.sin(ang), cx + r * Math.cos(ang), cy - r * Math.sin(ang), '#cfd8d3', { 'stroke-width': 1.5 }); }
          const aq = Math.PI / 2 + m * t, ak = Math.PI / 2 + n * t;
          const diff = ((gap * t) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
          const arcPts = Array.from({ length: 25 }, (_, s) => { const a = aq + diff * s / 24; return [cx + 20 * Math.cos(a), cy - 20 * Math.sin(a)]; });
          if (diff > 0.02) k.polyline(arcPts, C.purple, { 'stroke-width': 2 });
          k.arrow(cx, cy, cx + (r - 8) * Math.cos(aq), cy - (r - 8) * Math.sin(aq), C.coral, 3);
          k.arrow(cx, cy, cx + (r - 14) * Math.cos(ak), cy - (r - 14) * Math.sin(ak), C.blue, 3);
          k.circle(cx, cy, 4, C.ink);
          k.text(cx, 116, `${names[i]} ${fmt(deg(t), t < 0.1 ? 2 : 1)}°/格`, { 'text-anchor': 'middle', 'font-size': 11, fill: C.ink, 'font-weight': 700 });
          k.text(cx, 246, `夾角 ${fmt(deg(diff), 1)}°`, { 'text-anchor': 'middle', 'font-size': 12, fill: C.purple, 'font-weight': 700 });
          k.text(cx, 262, `cos = ${sgn(Math.cos(gap * t))}`, { 'text-anchor': 'middle', 'font-size': 11 });
        });
        // Score panel.
        k.box(408, 100, 182, 170, { fill: '#f7f5fb', title: '注意力分數 q·k' });
        k.text(420, 140, 'RoPE（新）', { 'font-size': 12, fill: C.purple, 'font-weight': 700 });
        k.text(578, 140, sgn(rope), { 'font-size': 20, 'text-anchor': 'end', fill: C.purple, 'font-weight': 700 });
        k.text(420, 160, '＝三個 cos 相加', { 'font-size': 11 });
        k.text(420, 196, '加法式（舊）', { 'font-size': 12, fill: C.gray, 'font-weight': 700 });
        k.text(578, 196, sgn(add), { 'font-size': 20, 'text-anchor': 'end', fill: C.gray, 'font-weight': 700 });
        k.text(420, 216, '會隨絕對位置改變', { 'font-size': 11 });
        k.text(420, 252, `只看 n − m = ${n} − ${m} = ${gap}`, { 'font-size': 11, fill: C.ink });
        // Score vs shift.
        const p = k.plot({ xmin: 0, xmax: 40, ymin: -2, ymax: 8, left: 58, width: 500, top: 300, height: 92, xticks: 8, yticks: 5, xlabel: '整句往後移（格）', ylabel: '分數' });
        k.curve(p, s => addScore(2 + s, 2 + s + gap), C.gray, { 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }, 0, 40, 400);
        k.curve(p, () => rope, C.purple, { 'stroke-width': 4 }, 0, 40, 10);
        k.dot(p, shift, add, C.gray, 5);
        k.dot(p, shift, rope, C.purple, 6);
        k.text(shift > 20 ? p.left + 6 : p.right, p.y(rope) - 8, 'RoPE：一條水平線', { 'text-anchor': shift > 20 ? 'start' : 'end', 'font-size': 11, fill: C.purple, 'font-weight': 700, ...HALO });
        const cosTerms = THETA.map(t => `cos(${gap}×${fmt(deg(t), t < 0.1 ? 2 : 1)}°)`).join(' + ');
        return {
          result: `${sgn(rope)}（往後移 ${shift} 格也一樣）`,
          detail: `小貓在第 ${m} 格、球在第 ${n} 格，RoPE 分數只和 n − m = ${gap} 有關：${cosTerms} = ${sgn(rope)}。舊的加法式分數此時是 ${sgn(add)}，整句往後移就會改變。`
        };
      }
    }
  );
})();
