// 數學遊樂場：「額外學習」模組。render(root, ctx) 在主頁右側畫學習地圖或一課，controls(box, ctx) 在左側畫 12 類 66 課。
// 課程在 lessons/*.js 用 MP.register 註冊，課程表與路線在 js/curriculum.js，繪圖工具在 js/core.js；樣式在 math-playground.css。
// 只畫目前這一課；每課的滑桿、選項與小挑戰作答留在模組裡，切回來時還原。目前的課、路線與投影模式記在主站的 store。
window.MathPlayground = (() => {
'use strict';
const trackOf = lesson => MP.tracks.find(track => track.id === lesson.track) || MP.tracks[0];
// 課程表決定每一課的位置，不受程式載入順序影響。
const lessons = MP.tracks.flatMap(track => MP.lessons.filter(lesson => lesson.track === track.id && Array.isArray(lesson.controls) && typeof lesson.draw === 'function').sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
const lessonById = id => lessons.find(lesson => lesson.id === id);
const paths = MP.paths.map(path => ({ ...path, ids: path.ids.filter(lessonById) })).filter(path => path.ids.length > 1);

// 滑桿是陣列 [key, label, min, max, step, value, unit]；選項是 { key, label, options, value }。
const isChoice = control => !Array.isArray(control);
const controlKey = control => isChoice(control) ? control.key : control[0];
const defaultValue = control => isChoice(control) ? control.value || 0 : control[5];

const saved = new Map();   // 課程 id → { values, quiz, draw }：滑桿／選項的值、小挑戰選了哪個、圖解自己的狀態
const memory = id => { if (!saved.has(id)) saved.set(id, { values: {}, quiz: {}, draw: {} }); return saved.get(id); };
const valueOf = (lesson, control) => memory(lesson.id).values[controlKey(control)] ?? defaultValue(control);

let app = null, side = null, ctx = null, settings = null, playing = null;
const $ = id => app?.querySelector('#' + CSS.escape(id));
const remember = () => ctx.store.set('math', settings);
const init = context => { ctx = context; settings ??= { lesson: 'map', route: '', projector: false, ...ctx.store.get('math', {}) }; };

/* ---------- 共用的小片段 ---------- */
function lessonChip(id, route = '') {
  const lesson = lessonById(id);
  return lesson ? `<button type="button" class="concept-chip track-${lesson.track}" data-course="${id}"${route ? ` data-route="${route}"` : ''}><span aria-hidden="true">${lesson.symbol}</span>${lesson.name}</button>` : '';
}
const symbolClass = symbol => [...symbol].length > 2 ? ' long' : '';
function controlHTML(lesson, control) {
  const value = valueOf(lesson, control);
  if (isChoice(control)) {
    const { key, label, options } = control;
    return `<div class="choice-label" id="${lesson.id}-${key}-label">${label}</div><div class="choice-group" role="group" aria-labelledby="${lesson.id}-${key}-label" data-key="${key}" data-value="${value}">${options.map((option, i) => `<button type="button" aria-pressed="${i === Number(value)}" data-index="${i}">${option}</button>`).join('')}</div>`;
  }
  const [key, label, min, max, step, , unit] = control;
  return `<label for="${lesson.id}-${key}">${label} <strong id="${lesson.id}-${key}-value">${value}</strong> ${unit}</label><input id="${lesson.id}-${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">`;
}
function teachHTML(teach) {
  if (!teach) return '';
  const row = (label, value) => value ? `<div class="teach-row"><b>${label}</b><div>${value}</div></div>` : '';
  return `<details class="teach-box"><summary>🧑‍🏫 課堂怎麼教（國中小教師版）</summary>
    ${row('適合年級', teach.grade)}${row('連結學過的', teach.connect)}${row('不插電活動', teach.activity)}
    ${row('引導提問', teach.ask ? `<ol>${teach.ask.map(q => `<li>${q}</li>`).join('')}</ol>` : '')}${row('常見迷思', teach.myth)}</details>`;
}
function quizHTML(lesson) {
  const quizzes = [].concat(lesson.quiz || []);
  return quizzes.length ? `<section class="quiz-card"><div><span class="quiz-kicker">想通了嗎？ ✦ 小挑戰</span>${quizzes.map((quiz, q) => `
    <div class="quiz-item" data-quiz="${q}"><h3>${quizzes.length > 1 ? `${q + 1}. ` : ''}${quiz.question}</h3><div class="quiz-options">${quiz.options.map((option, i) => `<button type="button" aria-pressed="false" data-index="${i}">${option}</button>`).join('')}</div><p class="quiz-feedback" role="status" aria-live="polite"></p></div>`).join('')}</div><div class="quiz-graphic" aria-hidden="true">?</div></section>` : '';
}

/* ---------- 左側控制列 ---------- */
function controls(box, context) {
  init(context); side = box;
  box.classList.add('mp-controls');
  let number = 0;
  box.innerHTML = `<h2>數學遊樂場 <span class="topic-count" id="topic-count">${lessons.length} 個主題</span></h2>
    <button type="button" class="lesson-tab map-tab track-map" id="mp-tab-map" data-lesson="map"><span class="tab-symbol" aria-hidden="true">🗺</span><span>學習地圖<small>分類、路線與搜尋</small></span></button>
    <div class="mp-tracks">${MP.tracks.map(track => {
      const items = lessons.filter(lesson => lesson.track === track.id);
      return items.length ? `<details class="track-${track.id}" data-track="${track.id}"><summary><span aria-hidden="true">${track.icon}</span>${track.name}<small>${items.length} 課</small></summary><div class="track-lessons">${items.map(lesson => `<button type="button" class="lesson-tab track-${track.id}" id="mp-tab-${lesson.id}" data-lesson="${lesson.id}"><span class="tab-number">${String(++number).padStart(2, '0')}</span><span class="tab-symbol${symbolClass(lesson.symbol)}" aria-hidden="true">${lesson.symbol}</span><span>${lesson.question}<small>${lesson.name}</small></span></button>`).join('')}</div></details>` : '';
    }).join('')}</div>`;
  box.addEventListener('click', event => { const tab = event.target.closest('[data-lesson]'); if (tab) navigate(tab.dataset.lesson); });
  // ↑↓ 依序切換主題（地圖 → 第 1 課 → … → 第 66 課）
  box.addEventListener('keydown', event => {
    const tab = event.target.closest('[data-lesson]');
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (!tab || !step) return;
    event.preventDefault();
    const ids = ['map', ...lessons.map(lesson => lesson.id)];
    const next = ids[(ids.indexOf(tab.dataset.lesson) + step + ids.length) % ids.length];
    navigate(next);
    box.querySelector(`[data-lesson="${next}"]`).focus();
  });
  paintControls();
}
function paintControls() {
  if (!side) return;
  for (const tab of side.querySelectorAll('[data-lesson]')) tab.setAttribute('aria-pressed', String(tab.dataset.lesson === settings.lesson));
  // 寬螢幕的左側欄放得下，展開目前這課的分類；手機的側欄在內容上方，維持收合
  const lesson = lessonById(settings.lesson);
  if (lesson && matchMedia('(min-width: 960px)').matches) side.querySelector(`details[data-track="${lesson.track}"]`).open = true;
}

/* ---------- 右側內容 ---------- */
function render(root, context) {
  init(context);
  if (settings.lesson !== 'map' && !lessonById(settings.lesson)) settings.lesson = 'map';
  app = document.createElement('div');
  app.className = 'mp-app';
  app.innerHTML = `<div class="workspace-heading"><div><span class="section-kicker" id="section-kicker"></span><h2 id="workspace-title"></h2></div><div class="heading-actions"><span id="lesson-position" class="lesson-position"></span><button type="button" id="projector-toggle" class="projector-toggle" title="放大字體、收起選單，適合教室投影">📽 投影模式</button></div></div>
    <div id="route-context" class="route-context" hidden></div>
    <div id="lesson-content"></div>`;
  root.append(app);
  // 課程小標籤、上下課、路線起點都用 data-course／data-route
  app.addEventListener('click', event => {
    const link = event.target.closest('[data-course]');
    if (link) navigate(link.dataset.course, link.dataset.route || '');
  });
  $('projector-toggle').addEventListener('click', () => { settings.projector = !settings.projector; remember(); paintProjector(); });
  paintProjector();
  renderContent();
}
function leave() {
  stopPlay();
  document.body.classList.remove('mp-projector');
  app = null;
  side = null;
}
function paintProjector() {
  const on = Boolean(settings.projector);
  app?.classList.toggle('projector', on);
  document.body.classList.toggle('mp-projector', on);
  $('projector-toggle')?.setAttribute('aria-pressed', String(on));
}

function navigate(id, route = settings.route || '') {
  const lesson = lessonById(id);
  settings.lesson = lesson ? id : 'map';
  settings.route = lesson && paths.some(path => path.id === route && path.ids.includes(id)) ? route : '';
  remember();
  paintControls();
  renderContent();
  ctx.scrollTop();
}

function renderContent() {
  if (!app) return;
  stopPlay();
  const lesson = lessonById(settings.lesson);
  const track = lesson && trackOf(lesson);
  app.className = 'mp-app' + (settings.projector ? ' projector' : '') + (lesson ? ` track-${lesson.track}` : ' track-map');
  $('workspace-title').textContent = lesson ? lesson.question : '選一條路線，走進大學數學';
  $('section-kicker').textContent = lesson ? `${track.icon} ${track.name} · ${track.level}` : '數學遊樂場 · 學習地圖';
  $('lesson-position').textContent = lesson ? `${String(lessons.indexOf(lesson) + 1).padStart(2, '0')} / ${lessons.length}` : `${lessons.length} 課`;
  const panel = document.createElement('article');
  panel.className = 'lesson-panel' + (lesson ? ` track-${lesson.track}` : ' map-panel');
  panel.id = 'panel-' + (lesson ? lesson.id : 'map');
  $('lesson-content').replaceChildren(panel);
  if (lesson) renderLesson(panel, lesson); else renderMap(panel);
  renderRoute(lesson);
}

/* 學習地圖：分類搜尋、連貫路線、上課用法 */
function renderMap(panel) {
  panel.innerHTML = `
    <div class="lesson-intro"><div class="lesson-pill">${lessons.length} 個案例 · ${MP.tracks.length} 個分類 · ${paths.length} 條路線</div><h3>選一個好奇的問題，沿著案例學下去</h3>
      <p><b>大學的數學，用小學生聽得懂的話說。</b>先玩生活模擬，再看公式與假設。可以選一條連貫路線，也能依分類找課；高中銜接與先備工具會在需要時帶你回頭補。每課附兩道小挑戰和教師活動。</p></div>
    <section class="course-catalog" aria-labelledby="catalog-title"><h4 id="catalog-title">依分類找課程</h4>
      <div class="catalog-controls"><label>搜尋課程<input id="course-search" type="search" placeholder="例如：傅立葉、貝氏、投影" autocomplete="off"></label><label>數學分類<select id="course-track"><option value="all">全部分類</option>${MP.tracks.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select></label></div>
      <p id="catalog-count" role="status" aria-live="polite"></p>
      <div class="track-grid">${MP.tracks.map(track => {
        const items = lessons.filter(lesson => lesson.track === track.id);
        return items.length ? `<section class="track-card track-${track.id}" data-track="${track.id}"><div class="track-head"><span class="track-icon" aria-hidden="true">${track.icon}</span><div><h4>${track.name}</h4><small>${track.level} · ${items.length} 課</small></div></div><p>${track.blurb}</p><div class="track-lessons">${items.map(lesson => lessonChip(lesson.id)).join('')}</div></section>` : '';
      }).join('')}</div><p id="catalog-empty" hidden>找不到符合的課程。試試其他關鍵字，或切換到全部分類。</p></section>
    <section class="map-paths"><h4>🔗 選一條連貫路線</h4><p class="map-help">箭頭是建議的探索順序。點選任一課後，頁面的「上一課／下一課」會跟著這條路線走。</p>${paths.map(path => `<div class="path-row"><div class="path-name">${path.name}<small>${path.goal}</small><button type="button" class="path-start" data-course="${path.ids[0]}" data-route="${path.id}">開始這條路線 · ${path.ids.length} 課 →</button></div><div class="path-steps">${path.ids.map(id => lessonChip(id, path.id)).join('<span class="path-arrow" aria-hidden="true">→</span>')}</div></div>`).join('')}</section>
    <section class="classroom-tips"><h4>🧑‍🏫 拿去上課的三種用法</h4><ol>
      <li><b>5 分鐘開場：</b>投影一課的模擬，按「▶ 播放」讓學生先猜會發生什麼，再揭曉。</li>
      <li><b>20 分鐘探究：</b>學生分組操作滑桿，完成「你來試試」的任務，最後用小挑戰檢查。</li>
      <li><b>不插電延伸：</b>每課的「課堂怎麼教」附有不需要電腦的活動，例如用紙卡玩 AI 選字、用尺量向量。</li></ol></section>`;
  $('course-search').addEventListener('input', filterCatalog);
  $('course-track').addEventListener('change', filterCatalog);
  filterCatalog();
}
function filterCatalog() {
  const query = $('course-search').value.trim().toLocaleLowerCase();
  const category = $('course-track').value;
  let count = 0;
  app.querySelectorAll('.track-card').forEach(card => {
    let matches = 0;
    card.querySelectorAll('[data-course]').forEach(link => {
      const lesson = lessonById(link.dataset.course);
      const text = `${lesson.id} ${lesson.name} ${lesson.title} ${lesson.question} ${trackOf(lesson).name} ${lesson.intro}`.toLocaleLowerCase();
      const show = (category === 'all' || lesson.track === category) && (!query || text.includes(query));
      link.hidden = !show;
      if (show) { count++; matches++; }
    });
    card.hidden = !matches;
  });
  $('catalog-count').textContent = `顯示 ${count} / ${lessons.length} 課`;
  $('catalog-empty').hidden = count > 0;
}

/* 一課：圖解、操作、科技應用、教學建議、正式數學、小挑戰 */
function renderLesson(panel, lesson) {
  const track = trackOf(lesson);
  const prerequisites = (lesson.prerequisites || []).filter(lessonById);
  panel.innerHTML = `
    <div class="lesson-intro"><div class="lesson-meta"><span class="lesson-pill">${track.name} · ${lesson.name}</span>${lesson.teach?.grade ? `<span class="grade-pill">🎒 ${lesson.teach.grade}</span>` : ''}</div><h3>${lesson.title}</h3><p>${lesson.intro}</p></div>
    <div class="prerequisite-strip"><span>先備概念</span>${prerequisites.length ? prerequisites.map(id => lessonChip(id)).join('') : '<small>可以從這裡開始探索</small>'}<button type="button" class="back-map" data-course="map">回分類與路線 ↗</button></div>
    <div class="playground-grid">
      <div class="visual-card"><div class="visual-top"><span class="scene-tag">應用模擬</span><span>${lesson.scene || lesson.title}</span></div>${lesson.chart ? `<div class="visual-legend">${lesson.chart}</div>` : ''}<svg id="${lesson.id}-chart" class="chart" viewBox="0 0 600 ${lesson.viewH || 360}" role="img" aria-label="${lesson.scene || lesson.title}" aria-describedby="${lesson.id}-caption ${lesson.id}-detail"></svg><div id="${lesson.id}-caption" class="chart-caption">${lesson.caption}</div></div>
      <div class="control-card"><div class="control-eyebrow">你來試試</div><h4>${lesson.task || '動一下，找出規律'}</h4>
        ${lesson.controls.map(control => controlHTML(lesson, control)).join('')}
        ${lesson.play ? `<button type="button" class="play-button" data-key="${lesson.play}" aria-pressed="false">▶ 播放動畫</button>` : ''}
        <div class="result-card" role="status" aria-live="polite" aria-atomic="true"><span>${lesson.resultLabel}</span><strong id="${lesson.id}-result"></strong><p id="${lesson.id}-detail"></p></div>
        <p class="simple-explain">💡 ${lesson.try}</p>
      </div>
    </div>
    ${lesson.tech?.length ? `<section class="tech-strip"><h4>🛰️ 現在哪些科技在用？</h4><div class="tech-grid">${lesson.tech.map(([icon, name, how]) => `<div class="tech-item"><span class="tech-icon" aria-hidden="true">${icon}</span><div><b>${name}</b><p>${how}</p></div></div>`).join('')}</div></section>` : ''}
    <div class="real-world"><span class="real-world-icon${symbolClass(lesson.symbol)}" aria-hidden="true">${lesson.symbol}</span><div><strong>${lesson.takeaway}</strong>${lesson.application ? `<p>${lesson.application}</p>` : ''}</div></div>
    ${teachHTML(lesson.teach)}
    <details class="formal-math"><summary>🎓 看看大學裡怎麼寫 · ${lesson.name}</summary><p class="formula">${lesson.formula}</p><p>${lesson.formal}</p></details>
    ${quizHTML(lesson)}
    <nav class="lesson-nav" aria-label="相關課程"></nav>`;
  wireLesson(lesson, panel);
}
function wireLesson(lesson, panel) {
  const redraw = () => drawLesson(lesson);
  for (const control of lesson.controls) {
    const key = controlKey(control);
    if (isChoice(control)) {
      const group = panel.querySelector(`.choice-group[data-key="${key}"]`);
      group.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;
        group.dataset.value = button.dataset.index;
        [...group.children].forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        redraw();
      });
    } else $(`${lesson.id}-${key}`).addEventListener('input', redraw);
  }
  const play = panel.querySelector('.play-button');
  if (play) play.addEventListener('click', () => togglePlay(lesson, play));
  const answers = memory(lesson.id).quiz;
  panel.querySelectorAll('.quiz-item').forEach(item => {
    const q = Number(item.dataset.quiz), quiz = [].concat(lesson.quiz)[q];
    const pick = index => {
      answers[q] = index;
      [...item.querySelector('.quiz-options').children].forEach((b, i) => {
        b.setAttribute('aria-pressed', String(i === index));
        b.classList.toggle('correct', i === index && index === quiz.answer);
        b.classList.toggle('incorrect', i === index && index !== quiz.answer);
      });
      item.querySelector('.quiz-feedback').textContent = index === quiz.answer ? quiz.why : (quiz.hint || '再看看圖、動動滑桿，試試另一個答案！');
    };
    item.querySelector('.quiz-options').addEventListener('click', event => {
      const button = event.target.closest('button');
      if (button) pick(Number(button.dataset.index));
    });
    if (answers[q] !== undefined) pick(answers[q]);
  });
  redraw();
}
// 讀畫面上的滑桿與選項（順便記住），再請課程畫圖
function drawLesson(lesson) {
  const svg = $(`${lesson.id}-chart`);
  if (!svg) return;
  const values = memory(lesson.id).values;
  const v = Object.fromEntries(lesson.controls.map(control => {
    const key = controlKey(control);
    const value = isChoice(control) ? Number(app.querySelector(`.choice-group[data-key="${key}"]`).dataset.value) : Number($(`${lesson.id}-${key}`).value);
    if (!isChoice(control)) $(`${lesson.id}-${key}-value`).textContent = value;
    values[key] = value;
    return [key, value];
  }));
  svg.replaceChildren();
  let output;
  try {
    output = lesson.draw(MP.kit(svg, lesson, memory(lesson.id).draw, () => drawLesson(lesson)), v) || {};
  } catch (error) {
    console.error(`[${lesson.id}]`, error);
    output = { result: '圖解出了點問題', detail: String(error.message || error) };
  }
  $(`${lesson.id}-result`).textContent = output.result ?? '';
  $(`${lesson.id}-detail`).textContent = output.detail ?? '';
}

// 「▶ 播放」把一個滑桿從目前的值（或起點）推到終點。
function stopPlay() {
  if (!playing) return;
  cancelAnimationFrame(playing.frame);
  playing.button.textContent = '▶ 播放動畫';
  playing.button.setAttribute('aria-pressed', 'false');
  playing = null;
}
function togglePlay(lesson, button) {
  if (playing?.button === button) return stopPlay();
  stopPlay();
  const input = $(`${lesson.id}-${button.dataset.key}`);
  const min = Number(input.min), max = Number(input.max), step = Number(input.step) || 1;
  let value = Number(input.value) >= max ? min : Number(input.value);
  const steps = Math.round((max - min) / step), msPerStep = MP.clamp(5000 / Math.max(steps, 1), 70, 600);
  let last = performance.now();
  button.textContent = '⏸ 暫停';
  button.setAttribute('aria-pressed', 'true');
  playing = { button, frame: 0 };
  const tick = now => {
    if (now - last >= msPerStep) {
      last = now;
      value = Math.min(max, value + step);
      input.value = value;
      drawLesson(lesson);
      if (value >= max) return stopPlay();
    }
    playing.frame = requestAnimationFrame(tick);
  };
  input.value = value;
  drawLesson(lesson);
  playing.frame = requestAnimationFrame(tick);
}

// 探索順序：跟著選的路線，或依分類順序；上一課／下一課與延伸課程
function renderRoute(lesson) {
  const context = $('route-context');
  context.hidden = !lesson;
  if (!lesson) return;
  const active = paths.find(path => path.id === settings.route);
  const options = paths.filter(path => path.ids.includes(lesson.id));
  const ids = active ? active.ids : lessons.filter(item => item.track === lesson.track).map(item => item.id);
  const index = ids.indexOf(lesson.id);
  context.innerHTML = `<label for="route-select">探索順序</label><select id="route-select"><option value="">${trackOf(lesson).name} · 分類順序</option>${options.map(path => `<option value="${path.id}"${active?.id === path.id ? ' selected' : ''}>${path.name}</option>`).join('')}</select><span>第 ${index + 1} / ${ids.length} 課</span>`;
  $('route-select').addEventListener('change', event => navigate(lesson.id, event.target.value));
  const step = (id, text) => `<button type="button" class="nav-step" data-course="${id}"${active ? ` data-route="${active.id}"` : ''}>${text}</button>`;
  app.querySelector('.lesson-nav').innerHTML = `
    ${index > 0 ? step(ids[index - 1], `← 上一課：${lessonById(ids[index - 1]).name}`) : step('map', '← 選擇路線')}
    <div class="related"><span>延伸：</span>${(lesson.related || []).filter(lessonById).slice(0, 4).map(id => lessonChip(id)).join('')}</div>
    ${index < ids.length - 1 ? step(ids[index + 1], `下一課：${lessonById(ids[index + 1]).name} →`) : step('map', '這條路線完成，回地圖 →')}`;
}

return { render, controls, leave, lessons, lessonById };
})();
