'use strict';

window.GrammarPrep = (() => {
  const { courses, questions } = window.GrammarPrepData;
  const questionById = new Map(questions.map(q => [q.id, q]));
  const types = { written: '筆試混合', choice: '選擇題', rewrite: '依提示作答', translate: '中翻英', listen: '新興英聽練習', mixed: '筆試＋英聽' };
  const typeNames = { choice: '選擇題', rewrite: '依提示作答', translate: '中翻英', listen: '英聽理解' };
  const defaults = { course: courses[0].id, view: 'lesson', scope: 'current', type: 'written', count: 10, wrong: {}, history: [], session: null };
  let state;
  function normalize(value) {
    return String(value ?? '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'")
      .replace(/\b(don't|doesn't|didn't|isn't|aren't|wasn't|weren't|can't|won't|i'm|you're|he's|she's|it's|we're|they're)\b/g,
        word => ({ "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "isn't": 'is not', "aren't": 'are not',
          "wasn't": 'was not', "weren't": 'were not', "can't": 'cannot', "won't": 'will not', "i'm": 'i am', "you're": 'you are',
          "he's": 'he is', "she's": 'she is', "it's": 'it is', "we're": 'we are', "they're": 'they are' })[word])
      .trim().replace(/[.!?。！？]+$/g, '').trim().replace(/\s+/g, ' ');
  }
  function matchesAnswer(q, value) {
    const normalized = normalize(value);
    return Boolean(normalized) && (q.answers || [q.answer]).some(answer => normalize(answer) === normalized);
  }
  function load(store) {
    const saved = store.get('grammar-prep', {});
    state = { ...defaults, wrong: {}, history: [] };
    if (!saved || typeof saved !== 'object') return;
    if (courses.some(c => c.id === saved.course)) state.course = saved.course;
    if (['lesson', 'practice', 'review'].includes(saved.view)) state.view = saved.view;
    if (['current', 'all'].includes(saved.scope)) state.scope = saved.scope;
    if (Object.hasOwn(types, saved.type)) state.type = saved.type;
    if ([5, 10, 20].includes(saved.count)) state.count = saved.count;
    for (const [id, record] of Object.entries(saved.wrong || {})) {
      if (questionById.has(id) && record && Number.isInteger(record.n) && record.n > 0) state.wrong[id] = record;
    }
    if (Array.isArray(saved.history)) state.history = saved.history.filter(h => Number.isInteger(h.right) && Number.isInteger(h.total)
      && h.total > 0 && h.right >= 0 && h.right <= h.total && typeof h.at === 'string').slice(0, 5);
    const s = saved.session;
    if (s && Array.isArray(s.ids) && s.ids.length > 0 && s.ids.length <= 20 && s.ids.every(id => questionById.has(id))
      && new Set(s.ids).size === s.ids.length && Number.isInteger(s.index) && s.index >= 0 && s.index <= s.ids.length) {
      const answers = {}, drafts = {}, orders = {}, heard = {};
      for (const id of s.ids) {
        const q = questionById.get(id), answer = s.answers?.[id];
        if (answer && typeof answer.value === 'string') answers[id] = { value: answer.value, reveal: Boolean(answer.reveal), ok: !answer.reveal && matchesAnswer(q, answer.value) };
        if (typeof s.drafts?.[id] === 'string') drafts[id] = s.drafts[id];
        if (q.options) orders[id] = Array.isArray(s.orders?.[id]) && s.orders[id].length === q.options.length
          && new Set(s.orders[id]).size === q.options.length && s.orders[id].every(option => q.options.includes(option)) ? s.orders[id] : [...q.options];
        heard[id] = Boolean(s.heard?.[id]);
      }
      if (s.ids.slice(0, s.index).every(id => answers[id])) state.session = { ids: s.ids, index: s.index, answers, drafts, orders, heard,
        label: typeof s.label === 'string' ? s.label : '文法練習', recorded: Boolean(s.recorded) };
    }
  }
  function pool() {
    return questions.filter(q => (state.scope === 'all' || q.course === state.course)
      && (state.type === 'mixed' || state.type === 'written' && q.type !== 'listen' || q.type === state.type));
  }
  function render(root, helpers) {
    const { el, chip, shuffle, speakBtn, store } = helpers;
    if (!state) load(store);
    const save = () => store.set('grammar-prep', state);
    const course = courses.find(c => c.id === state.course);
    const page = el('section', 'grammar-page'); page.setAttribute('aria-label', '私中英文文法');
    const head = el('div', 'sheet-head');
    head.append(el('h2', null, '私中英文文法'), el('p', 'note', '振聲／新興入學準備 · 四個優先單元 · 80 題原創練習'));
    const guide = el('details', 'grammar-guide'); guide.append(el('summary', null, '備考方向與使用方式'));
    guide.append(el('p', 'note', '依兩校公開資料安排備考方向，教材與題目為原創練習。振聲官方題型範例含選擇、依提示作答與翻譯；115 學年度振聲不考英聽，新興包含英聽。新年度內容請依當年度公告核對。'),
      el('p', 'note', '先讀重點，再做筆試。新興備考可加做英聽；英聽用瀏覽器語音朗讀，先播放，再選答案，對答案後才顯示英文原文。'),
      el('p', 'note', '填寫題需寫完整英文句子。大小寫、句尾標點與常見縮寫不影響判分；系統接受題目列出的常見寫法，其他正確表達可請家長或老師確認。進度、成績與文法錯題保存在這台裝置。'));
    const sources = el('p', 'note', '官方資料：');
    [['振聲題型範例', 'https://drive.google.com/file/d/10-ZcYfOBGnIJRpkXO_gI5D9_zFPqKstA/view'],
      ['振聲招生資訊', 'https://sites.google.com/gm.fxsh.tyc.edu.tw/fxsh1210/115年國中招生資訊'],
      ['新興 115 招生簡章', 'https://asp.hshs.tyc.edu.tw/國中部115學年度招生簡章.pdf']].forEach(([text, url], i) => {
      if (i) sources.append(' · '); const link = el('a', null, text); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; sources.append(link);
    });
    guide.append(sources); head.append(guide);
    const views = el('div', 'chips');
    [['lesson', '看重點'], ['practice', '做練習'], ['review', '文法錯題']].forEach(([view, title]) => views.append(chip(title, state.view === view,
      () => { state.view = view; repaint(); }, view === 'review' ? Object.keys(state.wrong).length : null)));
    head.append(views); page.append(head);
    const nav = el('nav', 'grammar-courses'); nav.setAttribute('aria-label', '文法單元');
    courses.forEach((c, i) => {
      const b = button('', () => { state.course = c.id; repaint(); }, 'grammar-course'); b.dataset.grammarCourse = c.id;
      b.setAttribute('aria-pressed', String(c.id === state.course)); b.append(el('b', null, `${i + 1}. ${c.name}`), el('span', 'note', c.short)); nav.append(b);
    }); page.append(nav);
    const content = el('div', 'grammar-content'); page.append(content); root.append(page);
    function repaint() { save(); root.replaceChildren(); render(root, helpers); }
    function button(label, action, cls = 'btn') { const b = el('button', cls, label); b.type = 'button'; b.onclick = action; return b; }
    function english(text, cls = '') { const span = el('span', 'grammar-english ' + cls, text); span.lang = /[\u4e00-\u9fff]/.test(text) ? 'zh-Hant' : 'en'; return span; }
    function addAudio(parent, text, label) { const b = speakBtn(text, label, 'en-US', true); if (b) parent.append(b); }
    function select(key, label, options) {
      const field = el('label', 'field', label); field.htmlFor = 'grammar-' + key;
      const input = el('select'); input.id = field.htmlFor;
      Object.entries(options).forEach(([value, text]) => { const option = el('option', null, text); option.value = value; input.append(option); });
      input.value = String(state[key]); input.onchange = () => { state[key] = key === 'count' ? Number(input.value) : input.value; repaint(); };
      field.append(input); return field;
    }
    function start(items, label) {
      if (!items.length) return;
      const selected = shuffle(items).slice(0, state.count), orders = {};
      selected.forEach(q => { if (q.options) orders[q.id] = shuffle(q.options); });
      state.session = { ids: selected.map(q => q.id), index: 0, answers: {}, drafts: {}, orders, heard: {}, label, recorded: false };
      state.view = 'practice'; repaint(); focusQuestion();
    }
    function focusQuestion() { (root.querySelector('#grammar-answer') || root.querySelector('#grammar-question-title') || root.querySelector('#grammar-result-title'))?.focus(); }
    function lesson() {
      const section = el('div', 'panel grammar-lesson'); section.dataset.grammarLesson = course.id;
      section.append(el('h3', null, course.name), el('p', 'note', course.intro));
      const rules = el('div', 'grammar-rules');
      course.rules.forEach(([title, text]) => { const rule = el('article'); rule.append(el('h4', null, title), el('p', null, text)); rules.append(rule); });
      section.append(rules, el('h4', null, '看例句，理解用法'));
      course.examples.forEach(([sentence, answer, explain]) => {
        const example = el('div', 'grammar-example'); const line = el('p'); line.append(english(sentence)); addAudio(line, sentence, '朗讀例句');
        const response = el('p'); response.append(/[\u4e00-\u9fff]/.test(answer) ? document.createTextNode(answer) : english(answer));
        if (!/[\u4e00-\u9fff]/.test(answer)) addAudio(response, answer, '朗讀完整回答');
        example.append(line, response, el('p', 'note', explain)); section.append(example);
      });
      section.append(el('h4', null, '容易寫錯的地方'));
      course.mistakes.forEach(([wrong, right, explain]) => {
        const item = el('div', 'grammar-correction'); const before = el('p'); before.append('常見誤用：', english(wrong));
        const after = el('p'); after.append('正確寫法：', english(right)); item.append(before, after, el('p', 'note', explain)); section.append(item);
      });
      const begin = button('練習這個單元', () => { state.scope = 'current'; start(pool(), course.name); }, 'btn primary');
      section.append(begin); content.append(section);
    }
    function reviewCard(q) {
      const item = el('article', 'panel grammar-review-card'); item.dataset.grammarReview = q.id;
      item.append(el('span', 'pill', `${courses.find(c => c.id === q.course).name} · ${typeNames[q.type]}`), el('p', null, q.prompt));
      if (q.audio) { const line = el('p'); line.append(english(q.audio)); addAudio(line, q.audio, '重聽原文'); item.append(line); }
      const answer = el('p'); answer.append('答案：', english(q.answers ? q.answers.join(' / ') : q.answer));
      item.append(answer, el('p', 'note', q.explain)); return item;
    }
    function review() {
      const items = questions.filter(q => state.wrong[q.id]);
      const top = el('div', 'panel'); top.append(el('h3', null, '文法錯題'), el('p', 'note', `共有 ${items.length} 題還要練習。重新作答正確後會自動移出這裡；這份紀錄保存在這台裝置。`));
      const retry = button('重練文法錯題', () => start(items, '文法錯題重練'), 'btn primary'); retry.disabled = !items.length; top.append(retry); content.append(top);
      items.forEach(q => content.append(reviewCard(q)));
      if (!items.length) content.append(el('div', 'empty', '目前沒有文法錯題，先選一個單元練習吧！'));
    }
    function practice() {
      const available = pool(); const setup = el('div', 'panel'); setup.append(el('h3', null, '練習設定'));
      const filters = el('div', 'grammar-filters');
      filters.append(select('scope', '出題範圍', { current: '目前單元', all: '四單元混合' }), select('type', '練習題型', types), select('count', '題數', { 5: '5 題', 10: '10 題', 20: '20 題' }));
      setup.append(filters, el('p', 'note', `目前可抽 ${available.length} 題，每次最多 ${state.count} 題。範圍與題型的變更會在下一次抽題時生效；切換頁面會保留作答。`));
      setup.append(button(state.session ? '開始新練習' : '開始練習', () => start(available, `${state.scope === 'all' ? '四單元混合' : course.name} · ${types[state.type]}`), 'btn primary'));
      content.append(setup);
      const session = state.session;
      if (!session) {
        content.append(el('div', 'empty', '選好範圍與題型後，開始練習。'));
        history(); return;
      }
      if (session.index >= session.ids.length) {
        const right = session.ids.filter(id => session.answers[id]?.ok).length;
        if (!session.recorded) { state.history.unshift({ at: new Date().toISOString(), right, total: session.ids.length }); state.history = state.history.slice(0, 5); session.recorded = true; save(); }
        const result = el('div', 'panel grammar-result'); const title = el('h3', null, '練習完成！'); title.id = 'grammar-result-title'; title.tabIndex = -1;
        result.append(title, el('p', 'end-msg', `${right} / ${session.ids.length} 題答對`), el('p', 'note', session.label));
        const wrong = session.ids.filter(id => !session.answers[id]?.ok).map(id => questionById.get(id));
        if (wrong.length) { result.append(button('再練這次錯題', () => start(wrong, '這次錯題重練'))); wrong.forEach(q => result.append(reviewCard(q))); }
        else result.append(el('p', 'note', '全部答對了！可以挑戰其他單元或題型。'));
        content.append(result); history(); return;
      }
      const q = questionById.get(session.ids[session.index]), answered = session.answers[q.id];
      const form = el('form', 'panel grammar-question'); form.dataset.grammarQuestion = q.id;
      const title = el('h3', null, `第 ${session.index + 1} / ${session.ids.length} 題 · ${typeNames[q.type]}`); title.id = 'grammar-question-title'; title.tabIndex = -1;
      form.append(title, el('span', 'pill', courses.find(c => c.id === q.course).name), el('p', 'grammar-prompt', q.prompt));
      if (q.type === 'listen') {
        const audio = speakBtn(q.audio, '播放聽力', 'en-US');
        if (audio) {
          const original = audio.onclick; audio.className = 'btn grammar-play'; audio.append(document.createTextNode(' 播放／重聽'));
          audio.disabled = !('speechSynthesis' in window);
          audio.onclick = event => { original(event); session.heard[q.id] = true; save(); form.querySelectorAll('.grammar-option').forEach(b => { b.disabled = Boolean(answered); }); };
          form.append(audio);
        }
        form.append(el('p', 'note', 'speechSynthesis' in window ? '先播放再作答，可以重聽。對答案後會顯示英文原文。' : '這個瀏覽器不支援朗讀，請使用支援語音的瀏覽器，或按「看答案」閱讀原文。'));
      }
      if (q.options) {
        const options = el('div', 'grammar-options');
        session.orders[q.id].forEach((text, index) => {
          const b = button('', () => answer(text, false), 'btn grammar-option'); b.dataset.grammarOption = String(index);
          b.append(el('span', 'grammar-option-letter', 'ABCD'[index]), english(text));
          b.disabled = Boolean(answered) || q.type === 'listen' && !session.heard[q.id];
          if (answered) { if (text === q.answer) b.classList.add('good'); else if (text === answered.value) b.classList.add('bad'); }
          options.append(b);
        }); form.append(options);
      } else {
        const label = el('label', 'field', '寫完整英文句子'); label.htmlFor = 'grammar-answer';
        const input = el('textarea'); input.id = 'grammar-answer'; input.rows = 3; input.required = true; input.lang = 'en';
        input.autocomplete = 'off'; input.spellcheck = false; input.autocapitalize = 'none'; input.value = answered?.value || session.drafts[q.id] || ''; input.disabled = Boolean(answered);
        input.oninput = () => { session.drafts[q.id] = input.value; save(); }; label.append(input); form.append(label);
        if (!answered) { const submit = el('button', 'btn primary', '對答案'); submit.type = 'submit'; submit.id = 'grammar-check'; form.append(submit); }
        form.onsubmit = event => { event.preventDefault(); if (input.value.trim()) answer(input.value, false); };
      }
      if (!answered) form.append(button('還不會，看答案', () => answer(session.drafts[q.id] || '', true), 'btn small grammar-reveal'));
      else {
        const feedback = el('div', 'grammar-feedback ' + (answered.ok ? 'is-correct' : 'is-wrong')); feedback.id = 'grammar-feedback'; feedback.setAttribute('role', 'status');
        feedback.append(el('p', null, answered.ok ? '答對了！' : '再看一次句型與用法。'));
        if (q.audio) { const transcript = el('p', 'grammar-transcript'); transcript.append('英文原文：', english(q.audio)); feedback.append(transcript); }
        if (answered.value && !answered.ok) { const chosen = el('p'); chosen.append('你的作答：', english(answered.value)); feedback.append(chosen); }
        const solution = el('p'); solution.append('答案：', english(q.answers ? q.answers.join(' / ') : q.answer)); feedback.append(solution, el('p', 'note', q.explain));
        if (q.answers) addAudio(feedback, q.answers[0], '朗讀正確答案'); form.append(feedback);
        const next = button(session.index + 1 === session.ids.length ? '看成績' : '下一題', () => { session.index++; repaint(); focusQuestion(); }, 'btn primary'); next.id = 'grammar-next'; form.append(next);
      }
      content.append(form);
      function answer(value, reveal) {
        if (session.answers[q.id]) return;
        const ok = !reveal && matchesAnswer(q, value);
        session.answers[q.id] = { value, reveal, ok };
        if (ok) delete state.wrong[q.id];
        else state.wrong[q.id] = { n: (state.wrong[q.id]?.n || 0) + 1, at: new Date().toISOString() };
        repaint(); root.querySelector('#grammar-next')?.focus();
      }
    }
    function history() {
      if (!state.history.length) return;
      const box = el('div', 'panel'); box.append(el('h3', null, '最近練習成績')); const list = el('ul', 'history-list');
      state.history.forEach(h => list.append(el('li', null, `${new Date(h.at).toLocaleDateString('zh-TW')}　${h.right} / ${h.total} 題答對`))); box.append(list); content.append(box);
    }
    if (state.view === 'lesson') lesson(); else if (state.view === 'review') review(); else practice();
  }
  return Object.freeze({ render, normalize, matchesAnswer });
})();
