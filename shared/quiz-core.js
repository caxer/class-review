// 學生網站（index.html）、維護端（lib/）和現場出題（ai/）共用的科目、題型與判分規則，只維護這一份。
// 不寫 import／export：學生網站要能直接開檔（file:// 不能載入 ES module），所以瀏覽器用一般的 <script src> 載入；
// Node 與 ai/ 用 import "../shared/quiz-core.js" 執行這個檔，再從 globalThis.QuizCore 取用（lib/ 經由 lib/quiz-core.mjs）。
(() => {
  const SUBJECT_NAMES = { zh: "國文", en: "英文", math: "數學" };
  // 各科的題型；mixed 是三科合併的考卷
  const CATEGORIES = {
    zh: { reading: "閱讀", words: "字詞", knowledge: "語文常識" },
    en: { reading: "閱讀", grammar: "文法", vocab: "單字" },
    math: { concept: "觀念", calc: "計算", word: "應用題" },
    mixed: { zh: "國文", en: "英文", math: "數學" }
  };
  const SUBJECT_MATCH = [["zh", /國文|國語|中文/], ["en", /英文|英語|english/i], ["math", /數學|math/i]];
  const detectSubject = text => SUBJECT_MATCH.find(([, re]) => re.test(text))?.[0] || null;
  const examSubject = e => detectSubject(`${e.subject} ${e.title}`) || "mixed";
  // 選項字母比較時忽略括號、空白與句點，大小寫不分
  const norm = v => String(v ?? "").replace(/[()（）\s.]/g, "").toUpperCase();
  // 考卷上學生的作答和正解比較：ok／bad／none（沒作答、沒有正解，或非選擇題不是數字）
  function verdict(q) {
    if (q.studentAnswer == null || !q.answer) return "none";
    if (!q.options?.length) {
      const student = String(q.studentAnswer).trim(), answer = String(q.answer).trim();
      if (!/^-?\d+(?:\.\d+)?$/.test(student) || !/^-?\d+(?:\.\d+)?$/.test(answer)) return "none";
      return Number(student) === Number(answer) ? "ok" : "bad";
    }
    const normalize = v => q.multiple ? String(v).split(/[、,，]/).map(norm).sort().join(",") : norm(v);
    return normalize(q.studentAnswer) === normalize(q.answer) ? "ok" : "bad";
  }
  // 解析結果沒有題型時依題目內容補上：有文章是閱讀，其餘英文、國文用第二種、數學用第三種
  const fallbackCategory = (subject, q) => (q.passageId && CATEGORIES[subject]?.reading ? "reading" : Object.keys(CATEGORIES[subject] || { grammar: 1 })[subject === "math" ? 2 : 1]);
  // 重新解析後題目 ID 變了：依解析結果附的 idMoves（[{ at, map: { 舊 key: 新 key 或 null } }]）搬移錯題紀錄。
  // book 是錯題本（id → 紀錄），prefix 是這個單元或考卷的 ID 前綴；applied 記著搬過的（prefix@at），每筆只搬一次。回傳有沒有搬動。
  function applyIdMoves(book, prefix, moves, applied) {
    let changed = false;
    for (const move of moves || []) {
      const tag = `${prefix}@${move.at}`;
      if (applied.has(tag)) continue;
      applied.add(tag); changed = true;
      const moving = Object.entries(move.map).filter(([from]) => book[prefix + from]).map(([from, to]) => [to, book[prefix + from]]);
      for (const from of Object.keys(move.map)) delete book[prefix + from];
      for (const [to, entry] of moving) {
        if (!to) continue;
        const had = book[prefix + to];
        book[prefix + to] = had ? { ...had, n: (had.n || 0) + (entry.n || 0), right: (had.right || 0) + (entry.right || 0),
          at: had.at > entry.at ? had.at : entry.at, done: Boolean(had.done && entry.done) } : entry;
      }
    }
    return changed;
  }
  globalThis.QuizCore = Object.freeze({ SUBJECT_NAMES, CATEGORIES, detectSubject, examSubject, norm, verdict, fallbackCategory, applyIdMoves });
})();
