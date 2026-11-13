// This file runs after all lesson packs. Keep the course order and prerequisites explicit.
MP.tracks = [
  { id: 'basic', name: '先備工具箱', short: '先備', level: '國中小先備', color: 'coral', icon: '🎒', blurb: '需要時回來補分數、比例、幾何與資料閱讀，再繼續大學案例。' },
  { id: 'foundations', name: '函數、極限與級數', short: '函數', level: '高中銜接～大學分析', color: 'yellow', icon: '🔎', blurb: '從多項式、三角與遞迴，走到無窮逼近與收斂。' },
  { id: 'calculus', name: '微積分與向量場', short: '微積分', level: '大學微積分', color: 'yellow', icon: '📈', blurb: '沿不同方向看變化，累加一片區域，讀懂空間裡的流動。' },
  { id: 'linear', name: '線性代數與資料幾何', short: '線代', level: '大學線性代數', color: 'green', icon: '🧭', blurb: '聯立方程、基底、投影與分解，串起資料擬合、降維和模型壓縮。' },
  { id: 'probability', name: '機率、統計與資訊', short: '機統', level: '大學機率與統計', color: 'purple', icon: '🎲', blurb: '從分布與新線索，到抽樣推論、動態機率、編碼與預測。' },
  { id: 'discrete', name: '離散數學與圖論', short: '離散', level: '高中銜接～大學離散數學', color: 'blue', icon: '🔗', blurb: '數清楚可能性、判斷推理、在一張網路中找路。' },
  { id: 'structures', name: '代數、數論與幾何', short: '結構', level: '大學數學探索', color: 'purple', icon: '🔷', blurb: '從對稱與餘數，探索代數結構、曲率與形狀的連通方式。' },
  { id: 'numerical', name: '數值分析', short: '數值', level: '大學數值方法', color: 'coral', icon: '🧮', blurb: '電腦如何用有限步驟逼近答案，如何看出誤差與方法限制。' },
  { id: 'optimization', name: '最佳化', short: '最佳化', level: '大學最佳化', color: 'green', icon: '🎯', blurb: '從沿下坡找答案，到有預算、空間與資源限制時的最佳選擇。' },
  { id: 'signals', name: '複數、傅立葉與訊號', short: '訊號', level: '大學訊號分析', color: 'blue', icon: '🎵', blurb: '旋轉的箭頭變成波浪，再用頻率與卷積理解聲音和影像。' },
  { id: 'engineering', name: '微分方程與工程', short: '方程', level: '大學工程數學', color: 'blue', icon: '⚙️', blurb: '由變化規則預測冷卻、避震、熱擴散與波的運動。' },
  { id: 'llm', name: 'AI 語言模型的數學', short: 'AI', level: '大學數學的 AI 應用', color: 'purple', icon: '🤖', blurb: '把機率、向量、微分與資訊量接起來，理解模型推論與訓練。' }
];

MP.courseOrder = {
  basic: ['fraction', 'linear', 'pythagoras', 'circle', 'probability', 'statistics'],
  foundations: ['polynomial', 'exponential', 'trigonometry', 'sequences', 'convergence', 'conics'],
  calculus: ['derivative', 'integral', 'partial', 'double', 'vectorfield', 'taylor'],
  linear: ['vector', 'systems', 'matrix', 'basis', 'projection', 'eigen', 'svd', 'pca'],
  probability: ['distributions', 'bayes', 'clt', 'confidence', 'hypothesis', 'markov', 'regression', 'entropy', 'kl'],
  discrete: ['logic', 'combinatorics', 'graph'],
  structures: ['groups', 'modular', 'curvature', 'topology'],
  numerical: ['roots', 'numerical-ode'],
  optimization: ['gradient', 'linear-program', 'lagrange'],
  signals: ['complex', 'fourier', 'transform', 'convolution'],
  engineering: ['ode', 'laplace', 'heat', 'wave'],
  llm: ['token', 'embedding', 'softmax', 'attention', 'position', 'neuron', 'backprop', 'crossentropy', 'lora', 'quantization', 'scaling']
};

MP.prerequisites = {
  fraction: [], linear: [], pythagoras: [], circle: [], probability: ['fraction'], statistics: [],
  polynomial: ['linear'], exponential: ['linear'], trigonometry: ['circle'], sequences: ['exponential'], convergence: ['sequences', 'logic'], conics: ['pythagoras'],
  derivative: ['linear'], integral: ['fraction'], partial: ['derivative', 'vector'], double: ['integral'], vectorfield: ['partial', 'vector'], taylor: ['derivative', 'convergence'],
  vector: ['pythagoras'], systems: ['linear'], matrix: ['systems'], basis: ['vector', 'matrix'], projection: ['vector', 'basis'], eigen: ['matrix'], svd: ['basis', 'eigen'], pca: ['projection', 'statistics'],
  distributions: ['probability', 'statistics'], bayes: ['probability'], clt: ['distributions'], confidence: ['clt'], hypothesis: ['distributions'], markov: ['probability', 'matrix'], regression: ['projection', 'gradient'], entropy: ['probability', 'exponential'], kl: ['entropy'],
  logic: [], combinatorics: ['fraction'], graph: ['logic'], groups: ['matrix'], modular: [], curvature: ['trigonometry', 'derivative'], topology: ['graph'],
  roots: ['polynomial', 'derivative'], 'numerical-ode': ['derivative', 'ode'], gradient: ['partial'], 'linear-program': ['systems'], lagrange: ['partial', 'conics'],
  complex: ['trigonometry', 'vector'], fourier: ['trigonometry'], transform: ['fourier', 'complex'], convolution: ['matrix'], ode: ['derivative', 'exponential'], laplace: ['ode', 'complex'], heat: ['partial', 'fourier'], wave: ['trigonometry', 'ode'],
  token: ['probability'], embedding: ['vector'], softmax: ['exponential', 'probability'], attention: ['embedding', 'matrix', 'softmax'], position: ['complex'], neuron: ['vector', 'polynomial'], backprop: ['derivative', 'neuron'], crossentropy: ['entropy', 'softmax'], lora: ['svd'], quantization: ['distributions'], scaling: ['exponential', 'regression']
};

MP.paths = [
  { id: 'sound', name: '旋轉的箭頭 → 音樂與訊號', goal: '看懂聲音如何由波組成，頻譜如何找出成分。', ids: ['trigonometry', 'complex', 'fourier', 'transform', 'convolution'] },
  { id: 'inference', name: '隨機抽樣 → 有根據的推論', goal: '分清楚隨機起伏、估計誤差與證據。', ids: ['probability', 'combinatorics', 'distributions', 'clt', 'confidence', 'hypothesis', 'bayes'] },
  { id: 'prediction', name: '猜下一步 → AI 選字', goal: '用條件機率、轉移與資訊量理解預測。', ids: ['bayes', 'markov', 'token', 'softmax', 'entropy', 'crossentropy', 'kl'] },
  { id: 'data', name: '聯立方程 → 資料壓縮', goal: '理解資料的方向、維度與保留資訊的代價。', ids: ['systems', 'matrix', 'basis', 'projection', 'eigen', 'svd', 'pca', 'lora', 'quantization'] },
  { id: 'learning', name: '山坡的方向 → AI 學習', goal: '從變化率走到擬合、反向傳播與避免過度擬合。', ids: ['polynomial', 'derivative', 'partial', 'gradient', 'neuron', 'backprop', 'regression', 'scaling'] },
  { id: 'engineering', name: '冷卻規則 → 工程模擬', goal: '由初始狀態和變化規則預測未來。', ids: ['exponential', 'derivative', 'ode', 'numerical-ode', 'laplace', 'heat', 'wave'] },
  { id: 'limits', name: '一步步逼近 → 電腦求解', goal: '知道有限步驟何時能接近答案，何時不行。', ids: ['sequences', 'logic', 'convergence', 'taylor', 'roots', 'integral', 'double'] },
  { id: 'constraints', name: '有限資源 → 最佳選擇', goal: '分辨沒有約束與受到限制的最佳化問題。', ids: ['systems', 'linear-program', 'conics', 'partial', 'lagrange'] },
  { id: 'space', name: '走路與流動 → 空間幾何', goal: '比較平面與曲面上的方向、流動和距離。', ids: ['pythagoras', 'vector', 'trigonometry', 'curvature', 'vectorfield', 'graph', 'topology'] },
  { id: 'structures', name: '規則與對稱 → 抽象結構', goal: '把具體操作變成可推理的數學規則。', ids: ['logic', 'combinatorics', 'matrix', 'groups', 'modular', 'topology'] },
  { id: 'language', name: '向量與旋轉 → 語言模型', goal: '串起語意相似、注意力和詞語的順序。', ids: ['vector', 'projection', 'embedding', 'softmax', 'attention', 'complex', 'position'] }
];

for (const [track, ids] of Object.entries(MP.courseOrder)) {
  ids.forEach((id, order) => {
    const lesson = MP.lessons.find(item => item.id === id);
    if (lesson) Object.assign(lesson, { track, order, prerequisites: MP.prerequisites[id] || [] });
  });
}
