// 相似題的出題指示與結果整理。本機預備題庫（units.mjs，用 Claude Code）和網站現場出題（ai/live.js，用 Claude API）共用，
// 所以這裡只有純函式，不依賴 Node 或瀏覽器。
export const SUBJECT_NAMES = { zh: "國文", en: "英文", math: "數學" };
export const str = v => (v == null ? "" : String(v).trim());

export function extractJson(text) {
  const tries = [text];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) tries.push(fence[1]);
  for (const [a, b] of [["{", "}"], ["[", "]"]]) {
    const i = text.indexOf(a), j = text.lastIndexOf(b);
    if (i >= 0 && j > i) tries.push(text.slice(i, j + 1));
  }
  for (const t of tries) { try { return JSON.parse(t); } catch {} }
  return null;
}

export const EXPLAIN_RULES = {
  en: [
    "請用繁體中文寫國小高年級學生看得懂的解析：",
    "- answer：正確選項字母；非選擇題寫完整答案句子。",
    "- explanation：為什麼是這個答案（2 到 3 句）。閱讀題要指出文章裡的依據；計算題（時間、金額）要列出算式。",
    "- keyPoint：15 字內的考點，例如「by + 交通工具不加冠詞」。",
    "- optionNotes：其他每個選項錯在哪（各 1 句）；非選擇題給空陣列。",
    "- completed：把答案填進空格後的完整英文句子，填入的部分用方括號 [ ] 標出；不是填空題給空字串。"
  ],
  zh: [
    "請用繁體中文寫國小高年級學生看得懂的解析：",
    "- answer：正確選項字母；非選擇題寫完整答案。",
    "- explanation：為什麼是這個答案（2 到 3 句）。對聯題要指出對聯裡的關鍵字和它跟行業或場所的關係，並用白話解釋這副對聯的意思；閱讀題要指出文章依據。",
    "- keyPoint：15 字內的考點，例如「秋毫、老眼 → 眼鏡行」。",
    "- optionNotes：其他每個選項錯在哪（各 1 句）；非選擇題給空陣列。",
    "- completed：給空字串。"
  ],
  math: [
    "請用繁體中文寫國小六年級學生看得懂的解析，盡量用講義的方法（找基準量與比較量、畫線段、母子和、母子差、份數）：",
    "- answer：正確選項字母；非選擇題寫最後答案（含單位，多個答案用「；」分開）。",
    "- explanation：逐步解題，一步一行，每行格式「說明：算式＝結果」，最後一行寫「答：…」。分數寫成 a/b，帶分數寫成「4又1/3」，不要用 LaTeX。",
    "- keyPoint：15 字內的考點，例如「已知部分量求全部量：部分量÷比率」。",
    "- optionNotes：選擇題的其他每個選項是哪種錯誤算法得到的（各 1 句）；非選擇題給空陣列。",
    "- completed：給空字串。",
    "請自己驗算一次，確定答案正確。"
  ],
  mixed: [
    "請用繁體中文寫國小六年級學生看得懂的解析：",
    "- answer：正確選項字母；非選擇題寫完整答案（數學含單位）。",
    "- explanation：為什麼是這個答案（數學題逐步列式，一步一行）。",
    "- keyPoint：15 字內的考點。",
    "- optionNotes：其他每個選項錯在哪（各 1 句）；非選擇題給空陣列。",
    "- completed：英文填空題給填好的完整句子，填入的部分用 [ ] 標出；其他給空字串。"
  ]
};

// 每一科要出哪些相似題；count 是預備題庫一批出幾題，ask(n) 是出 n 題的指示
export const PRACTICE = {
  en: {
    grammar: { label: "文法 12 題", count: 12, ask: n => `請出 ${n} 題四選一文法選擇題。題型仿照原題（交通工具動詞與過去式、by/on/in 介系詞、How 問句、問路句型、地方副詞倒裝句等，依本單元重點），句子和情境要換新的。` },
    vocab: { label: "單字 12 題", count: 12, ask: n => `請出 ${n} 題四選一單字題。混合三種：句子填空選正確單字、看中文選英文、片語搭配。單字以本單元單字表為主。` },
    reading: { label: "閱讀 2 篇", count: 6, passages: true, ask: n => `請出閱讀測驗：寫 ${Math.max(1, Math.round(n / 3))} 篇新的短篇閱讀材料，形式仿照本單元題組（例如問路對話、交通時刻表、商店廣告、短文），每篇 3 題四選一。時刻表或廣告用文字表格，一列一行，欄位用「 | 」分隔。題目要能只靠文字作答。` }
  },
  zh: {
    knowledge: { label: "語文常識 12 題", count: 12, ask: n => `請出 ${n} 題四選一語文常識題，仿照本單元（例如：這副對聯適合哪一種行業或場所、選出適合某行業的對聯、對聯的格式規則）。可以用本單元以外、真實常見的傳統對聯，不要自己捏造不通順的對聯。` },
    words: { label: "字詞 10 題", count: 10, ask: n => `請出 ${n} 題四選一字詞題：字音（選出正確注音）、字形（選出正確的字）、詞語或成語的意思。以本單元字詞表為主。` },
    reading: { label: "閱讀 1 篇", count: 4, passages: true, ask: n => `請出閱讀測驗：寫 1 篇 300 字左右的新短文（例如春聯或行業對聯的由來、對聯小故事），配 ${n} 題四選一閱讀題。` }
  },
  math: {
    word: { label: "應用題 10 題", count: 10, ask: n => `請出 ${n} 題四選一應用題，題型仿照原題（例如母子和、母子差、已知部分量求全部量、年齡問題、流水問題、追趕相遇，依本單元內容），換數字和情境，數字要算得出整數或簡單分數。` },
    concept: { label: "觀念 6 題", count: 6, ask: n => `請出 ${n} 題四選一觀念題：判斷誰是基準量、選出正確的算式、比率與倍數的換算、公式的意思。` },
    calc: { label: "計算 6 題", count: 6, ask: n => `請出 ${n} 題四選一計算題：和本單元有關的分數、小數、百分率乘除與換算。` }
  },
  mixed: {}
};
const MATH_CHECK = "數學題每一題出完後，自己從頭再算一次，確定答案正確、四個選項只有一個對。錯誤選項用學生常見的錯誤算法得到的數字（例如把基準量弄錯、加減弄反）。";

// 出題指示分三段：context（單元內容，同一單元同一題型不變）、task（已出過的題目與這次要出幾題）、rules（解析與回覆格式）。
// Claude Code 把三段照順序接成一則提示；Claude API 把 context、rules 放 system（可快取），task 放 user。
export function practiceParts(subject, data, category, count) {
  const plan = PRACTICE[subject][category];
  const flat = v => str(v).replace(/\n/g, " ");
  const originals = (data.sets || []).flatMap(s => s.questions.filter(q => q.category === category).map(q => `${flat(q.stem)} → ${q.answer}`)).slice(0, 25);
  const keys = (data.answerKeys || []).flatMap(k => k.items.filter(i => i.explanation).map(i => `${flat(i.explanation)} → ${i.answer}`)).slice(0, 15);
  const existing = (data.practice || []).filter(q => q.category === category).map(q => flat(q.stem)).slice(-40);
  const lines = list => list.filter(Boolean).join("\n");
  return {
    context: lines([
      `你是台灣國小六年級私中班${SUBJECT_NAMES[subject]}老師，要幫學生出隨堂考的練習題。`,
      `單元：${data.title}`,
      "本單元重點：",
      (data.notes || []).map(n => `- ${n.title}：` + n.points.map(p => [p.label, p.pattern].filter(Boolean).join(" ")).join("；")).join("\n"),
      data.vocab?.length ? "本單元字詞：" + data.vocab.map(v => `${v.word} ${v.zh}`).join("、") : "",
      originals.length ? "原題範例（題目 → 答案）：\n" + originals.join("\n") : "",
      keys.length ? "作業題的解析（可以參考題型）：\n" + keys.join("\n") : ""
    ]),
    task: lines([
      existing.length ? "之前已經出過這些題目，不要重複：\n" + existing.join("\n") : "",
      plan.ask(count || plan.count)
    ]),
    rules: lines([
      "難度和講義相同。每題只有一個正確答案，選項要有誘答力，答案字母要平均分布在 A 到 D。",
      subject === "math" ? MATH_CHECK : "",
      ...EXPLAIN_RULES[subject],
      "只回覆一個 JSON 物件，不要任何其他文字。格式：",
      plan.passages
        ? '{"passages":[{"id":"r1","label":"文章標題","text":"..."}],"questions":[{"passageId":"r1","stem":"...","options":[{"label":"A","text":"..."}],"answer":"B","keyPoint":"...","explanation":"...","optionNotes":[{"label":"A","note":"..."}],"completed":""}]}'
        : '{"questions":[{"stem":"...","options":[{"label":"A","text":"..."}],"answer":"A","keyPoint":"...","explanation":"...","optionNotes":[{"label":"B","note":"..."}],"completed":""}]}'
    ])
  };
}
export function practicePrompt(subject, data, category, count) {
  const p = practiceParts(subject, data, category, count);
  return [p.context, p.task, p.rules].join("\n");
}

/* ---------- 整理回覆 ---------- */
export const cleanLabel = v => str(v).replace(/[()（）]/g, "");
export const cleanOptions = opts => Array.isArray(opts) ? opts.map(o => ({ label: cleanLabel(o?.label), text: str(o?.text) })).filter(o => o.label) : [];
export const solved = s => ({
  answer: str(s?.answer).replace(/^[(（]([A-Da-d])[)）]$/, "$1"), completed: str(s?.completed), keyPoint: str(s?.keyPoint), explanation: str(s?.explanation),
  optionNotes: Array.isArray(s?.optionNotes) ? s.optionNotes.map(o => ({ label: cleanLabel(o?.label), note: str(o?.note) })) : []
});

// 把一批回覆整理成題目：不完整、答案不唯一、和題庫重複的題目都不收。
// tag 是這一批的代號，讓文章 id 不會撞到；id(n) 決定第 n 題的題目 id。
export function cleanPractice(raw, { subject, category, data, tag, startSeq = 0, id = n => `x${n}` }) {
  let seq = startSeq;
  const passages = (Array.isArray(raw?.passages) ? raw.passages : []).map((p, i) => ({ id: `${tag}-${str(p?.id) || i + 1}`, oldId: str(p?.id), label: str(p?.label), text: str(p?.text) }));
  const stemKey = value => str(value).replace(/\s+/g, "").toLowerCase();
  const seen = new Set([...(data.practice || []), ...(data.sets || []).flatMap(s => s.questions)].map(q => stemKey(q.stem)));
  const questions = (Array.isArray(raw?.questions) ? raw.questions : []).map(q => {
    const p = passages.find(x => x.oldId === str(q?.passageId));
    return { id: id(++seq), category, passageId: p ? p.id : null, stem: str(q?.stem), options: cleanOptions(q?.options), ...solved(q) };
  }).filter(q => {
    if (PRACTICE[subject][category].passages && (!q.passageId || !passages.some(p => p.id === q.passageId && p.text))) return false;
    if (!q.stem || !q.explanation || q.options.length < 2 || q.options.filter(o => o.label === q.answer).length !== 1 || seen.has(stemKey(q.stem))) return false;
    seen.add(stemKey(q.stem)); return true;
  });
  return { seq, questions, passages: passages.filter(p => questions.some(q => q.passageId === p.id)).map(({ oldId, ...p }) => p) };
}
