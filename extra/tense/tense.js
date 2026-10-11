// 時態樂園：「額外學習」模組。render(root, ctx) 把課程畫在主頁右側，controls(box, ctx) 畫左側的學習模式與 16 格課程。
// 課程、情境與練習進度留在模組裡；換到別的主題再回來，會接著上次的課程與題目。
// 課程表與加強課程在 curriculum-extra.js（window.TenseCurriculum）；樣式在 tense.css。
window.TensePark = (() => {
'use strict';
const { curriculumGroups, coreTenseKeys, allTenseKeys, beginnerKeys, extraLessons, extraQuestions, timelineData } = window.TenseCurriculum;

const scenes = {
  breakfast: {label:'小安的早餐時間', alt:'小安坐在餐桌前，吃麵包、喝牛奶。'},
  soccer: {label:'小安的球場時間', alt:'小安和朋友在學校的草地上踢足球。'},
  dog: {label:'小安的散步時間', alt:'小安牽著小狗，在公園裡散步。'},
  school: {label:'小安的上學時間', alt:'小安背著書包，和朋友一起走向學校。'}
};
const lessons = {
  present: {
    name:'現在式', short:'平常會做', english:'PRESENT SIMPLE', title:'平常、常常會做的事',
    description:'每天或常常做的事，就用「現在式」。它不一定是此刻正在做的事喔！',
    formula:'I / You / We / They ＋ <strong>動詞原形</strong>',
    detail:'He / She / It 後面的動詞，通常加 s 或 es：play → plays、go → goes。',
    clues:'every day 每天 · usually 通常 · often 常常', time:'EVERY DAY · 每天',
    examples:{
      breakfast:['I <mark>eat</mark> breakfast every day.','我每天吃早餐。','每天早上，小安都會吃早餐。'],
      soccer:['I <mark>play</mark> soccer every day.','我每天踢足球。','踢足球是小安每天會做的事。'],
      dog:['I <mark>walk</mark> my dog every day.','我每天遛我的小狗。','每天放學後，小安都會帶小狗散步。'],
      school:['I <mark>go</mark> to school every Monday.','我每個星期一去上學。','每到星期一，小安都會去上學。']
    }
  },
  continuous: {
    name:'現在進行式', short:'現在正在做', english:'PRESENT CONTINUOUS', title:'現在正在發生的事',
    description:'想說「我現在正在做⋯⋯」，就用「現在進行式」。像把此刻的動作拍下來！',
    formula:'主詞 ＋ <strong>am / is / are ＋ 動詞-ing</strong>',
    detail:'I 用 am；He / She / It 用 is；You / We / They 用 are。eat → eating、play → playing。',
    clues:'now 現在 · right now 就在此刻 · Look! 看！', time:'RIGHT NOW · 此刻',
    examples:{
      breakfast:['I <mark>am eating</mark> breakfast now.','我現在正在吃早餐。','看！小安此刻正在吃早餐。'],
      soccer:['I <mark>am playing</mark> soccer now.','我現在正在踢足球。','看！小安正在球場上踢足球。'],
      dog:['I <mark>am walking</mark> my dog now.','我現在正在遛我的小狗。','此刻，小安正牽著小狗散步。'],
      school:['I <mark>am going</mark> to school now.','我現在正在去學校的路上。','現在，小安正在去學校的路上。']
    }
  },
  past: {
    name:'過去式', short:'以前做過', english:'PAST SIMPLE', title:'以前發生、已經做過的事',
    description:'昨天、上星期，或以前做過的事，就用「過去式」。事情已經發生了！',
    formula:'主詞 ＋ <strong>過去式動詞</strong>',
    detail:'有些動詞加 ed：play → played；有些要記新樣子：eat → ate、go → went。',
    clues:'yesterday 昨天 · last week 上星期 · two days ago 兩天前', time:'YESTERDAY · 昨天',
    examples:{
      breakfast:['I <mark>ate</mark> breakfast yesterday.','我昨天吃了早餐。','想一想：昨天，小安吃了早餐。'],
      soccer:['I <mark>played</mark> soccer yesterday.','我昨天踢了足球。','這是小安昨天踢足球的回憶。'],
      dog:['I <mark>walked</mark> my dog yesterday.','我昨天遛了我的小狗。','昨天，小安帶小狗到公園散步。'],
      school:['I <mark>went</mark> to school yesterday.','我昨天去了學校。','這是小安昨天去上學的情境。']
    }
  },
  future: {
    name:'未來式', short:'接下來會做', english:'FUTURE WITH WILL', title:'接下來、還沒發生的事',
    description:'想說接下來或明天會做的事，可以用「will」。這裡先學 will 的說法！',
    formula:'主詞 ＋ <strong>will ＋ 動詞原形</strong>',
    detail:'不管主詞是 I、He 還是 They，will 後面都用動詞原形：will eat、will go。',
    clues:'tomorrow 明天 · next week 下星期 · soon 很快', time:'TOMORROW · 明天',
    examples:{
      breakfast:['I <mark>will eat</mark> breakfast tomorrow.','我明天會吃早餐。','想像明天：小安會吃早餐。'],
      soccer:['I <mark>will play</mark> soccer tomorrow.','我明天會踢足球。','小安想著明天會去踢足球。'],
      dog:['I <mark>will walk</mark> my dog tomorrow.','我明天會遛我的小狗。','小安想著明天會帶小狗散步。'],
      school:['I <mark>will go</mark> to school tomorrow.','我明天會去上學。','想像明天：小安會去學校。']
    }
  }
};

// Each question has one intended answer. Visuals show the action; context supplies its time.
const questions = {
  present:[
    {scene:'breakfast',context:'這是小安每天的習慣：每天吃早餐。',sentence:'I ___ breakfast every day.',options:['eat','ate','am eating'],answer:'eat',explain:'every day 是「每天」。說習慣時，用現在式；主詞是 I，動詞用 eat。'},
    {scene:'soccer',context:'小美每個星期日都會踢足球。',sentence:'She ___ soccer every Sunday.',options:['play','plays','played'],answer:'plays',explain:'每個星期日都是一樣的習慣。主詞是 She，現在式的 play 要加 s，變成 plays。'},
    {scene:'school',context:'小安每個星期一都去上學。',sentence:'He ___ to school every Monday.',options:['go','went','goes'],answer:'goes',explain:'every Monday 是「每個星期一」，用現在式。He 後面要用 goes，這個動詞加 es。'},
    {scene:'dog',context:'我們每天都遛小狗。',sentence:'We ___ our dog every day.',options:['walked','walk','walks'],answer:'walk',explain:'每天做的事用現在式。主詞是 We，用動詞原形 walk，不加 s。'},
    {type:'build',scene:'soccer',context:'用現在式說：「我每天踢足球。」',words:['every day.','soccer','I','play'],answer:'I play soccer every day.',explain:'I 後面用 play，every day 放句尾，說明這是每天的習慣。'},
    {type:'build',scene:'breakfast',context:'用現在式說：「她每天吃早餐。」',words:['breakfast','every day.','eats','She'],answer:'She eats breakfast every day.',explain:'She 是「她」，現在式的 eat 加 s，變成 eats。'}
  ],
  continuous:[
    {scene:'breakfast',context:'小安現在正坐在餐桌前吃早餐。',sentence:'I ___ breakfast now.',options:['eat','am eating','ate'],answer:'am eating',explain:'now 加上「正在吃」的情境，用現在進行式。I 搭配 am，eat 變成 eating。'},
    {scene:'soccer',context:'看！小美正在踢足球。',sentence:'Look! She ___ soccer.',options:['is playing','plays','are playing'],answer:'is playing',explain:'眼前正在踢球，用 is playing。主詞是 She，所以搭配 is。'},
    {scene:'dog',context:'孩子們現在正在遛小狗。',sentence:'They ___ their dog now.',options:['is walking','walked','are walking'],answer:'are walking',explain:'They 是「他們」，搭配 are。正在遛狗的說法是 are walking。'},
    {scene:'school',context:'我們現在正在去學校的路上。',sentence:'We ___ to school now.',options:['went','are going','is going'],answer:'are going',explain:'We 搭配 are；go 加 ing 變成 going。are going 表示正在前往。'},
    {type:'build',scene:'breakfast',context:'用現在進行式說：「我現在正在吃早餐。」',words:['eating','now.','I','breakfast','am'],answer:'I am eating breakfast now.',explain:'現在進行式要有 am / is / are，再加動詞-ing。I 用 am eating。'},
    {type:'build',scene:'soccer',context:'用現在進行式說：「他們現在正在踢足球。」',words:['soccer','They','now.','playing','are'],answer:'They are playing soccer now.',explain:'They 搭配 are；play 變成 playing。記得 are 和 playing 都不能少。'}
  ],
  past:[
    {scene:'breakfast',context:'小安說的是昨天吃早餐的事。',sentence:'I ___ breakfast yesterday.',options:['eat','ate','will eat'],answer:'ate',explain:'yesterday 是「昨天」，用過去式。eat 的過去式是 ate，不能直接加 ed。'},
    {scene:'soccer',context:'小美昨天踢了足球。',sentence:'She ___ soccer yesterday.',options:['plays','is playing','played'],answer:'played',explain:'昨天已經做過，用過去式。play 是規則動詞，加 ed 變成 played。'},
    {scene:'school',context:'小安昨天去上學。',sentence:'He ___ to school yesterday.',options:['went','goes','goed'],answer:'went',explain:'go 的過去式是 went，要特別記住！goed 不是正確的英文單字。'},
    {scene:'dog',context:'我們上星期遛了小狗。',sentence:'We ___ our dog last week.',options:['walk','walked','will walk'],answer:'walked',explain:'last week 是「上星期」，事情已經發生。walk 加 ed，變成 walked。'},
    {type:'build',scene:'soccer',context:'用過去式說：「我昨天踢了足球。」',words:['yesterday.','played','I','soccer'],answer:'I played soccer yesterday.',explain:'昨天做過的事，用過去式 played；yesterday 說明發生的時間。'},
    {type:'build',scene:'school',context:'用過去式說：「她昨天去了學校。」',words:['school','She','yesterday.','to','went'],answer:'She went to school yesterday.',explain:'go 的過去式是 went。主詞是 She，也一樣用 went，不再加 s。'}
  ],
  future:[
    {scene:'breakfast',context:'小安說他明天會吃早餐。',sentence:'I ___ breakfast tomorrow.',options:['ate','will eat','eating'],answer:'will eat',explain:'tomorrow 是「明天」。這裡用 will + 動詞原形，說接下來會做的事。'},
    {scene:'soccer',context:'小美說她明天會踢足球。',sentence:'She ___ soccer tomorrow.',options:['will plays','played','will play'],answer:'will play',explain:'will 後面一律用動詞原形。即使主詞是 She，也用 will play，不加 s。'},
    {scene:'school',context:'孩子們說他們明天會去學校。',sentence:'They ___ to school tomorrow.',options:['will go','will went','goes'],answer:'will go',explain:'will 後面用原形 go，不能用過去式 went。will go 表示接下來會去。'},
    {scene:'dog',context:'我們說下星期會遛小狗。',sentence:'We ___ our dog next week.',options:['walked','will walking','will walk'],answer:'will walk',explain:'next week 是「下星期」。will 後面用 walk，不加 ing 或 ed。'},
    {type:'build',scene:'breakfast',context:'用 will 說：「我明天會吃早餐。」',words:['tomorrow.','eat','I','breakfast','will'],answer:'I will eat breakfast tomorrow.',explain:'先放 I，再放 will eat。will 後面的 eat 保持原形。'},
    {type:'build',scene:'school',context:'用 will 說：「他明天會去學校。」',words:['go','tomorrow.','He','to school','will'],answer:'He will go to school tomorrow.',explain:'He 後面也用 will go。will 後面的 go 不要加 s！'}
  ]
};

Object.assign(lessons, extraLessons);
Object.assign(questions, extraQuestions);
lessons.present.name = '現在簡單式';
lessons.past.name = '過去簡單式';
lessons.future.name = '未來簡單式';

const SPEAKER = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg>';
const PAGE = `
  <section id="lesson" class="lesson-section" aria-label="看圖學習">
    <div id="lesson-panel" class="lesson-card" role="region" aria-labelledby="lesson-name" tabindex="-1">
      <div class="scene-side">
        <div class="scene-toolbar"><span id="scene-label" class="scene-label"></span><span id="time-label" class="time-label"></span></div>
        <div id="lesson-art" class="scene-art" role="img"></div>
        <div class="scene-caption"><span class="caption-dot" aria-hidden="true"></span><span id="scene-caption"></span></div>
        <div class="scene-picker" role="group" aria-label="換一個生活情境">
          <button type="button" data-scene="breakfast">吃早餐</button><button type="button" data-scene="soccer">踢足球</button><button type="button" data-scene="dog">遛小狗</button><button type="button" data-scene="school">去上學</button>
        </div>
      </div>
      <div class="explanation-side">
        <div class="lesson-identity"><span id="lesson-kicker" class="lesson-kicker"></span><span id="lesson-level" class="level-badge"></span></div>
        <p id="lesson-name" class="lesson-name"></p>
        <h3 id="lesson-title"></h3>
        <p id="lesson-description" class="lesson-description"></p>
        <div class="sentence-card">
          <div class="sentence-label">小安這樣說 <button type="button" id="listen" class="listen" aria-label="聽英文例句" title="聽英文例句">${SPEAKER}聽一聽</button></div>
          <p id="english-sentence" class="english-sentence" lang="en"></p>
          <p id="chinese-sentence" class="chinese-sentence"></p>
        </div>
        <div id="lesson-timeline" class="lesson-timeline"></div>
        <div class="formula-box"><span>動詞變身小祕訣</span><p id="formula"></p><p id="formula-detail" class="formula-detail"></p></div>
        <div class="clue-box"><span aria-hidden="true">✧</span><div><strong>找找時間線索</strong><p id="time-clues"></p></div></div>
      </div>
    </div>
    <div class="lesson-footer"><div class="lesson-actions"><button type="button" id="start-lesson" class="primary-button">開始練習</button><span>6 題</span></div></div>
  </section>
  <section id="practice" class="practice-section" aria-labelledby="practice-heading" hidden>
    <div class="practice-card"><div class="practice-top"><h2 id="practice-heading">練習</h2><button type="button" id="mixed-practice" class="outline-button">16 種混合練習</button></div><div id="practice-content" tabindex="-1"></div></div>
  </section>
  <dialog id="guide-dialog" aria-labelledby="guide-title"><div class="guide-heading"><h2 id="guide-title">家長與老師小筆記</h2><button type="button" id="close-guide" class="outline-button" aria-label="關閉家長與老師小筆記">關閉 ×</button></div>
    <details class="tip-details"><summary><span aria-hidden="true">✧</span> 小提醒：「完成」不一定表示全部做完</summary><div>完成式是站在一個時間點，回頭看之前的事。它可以說成果，也可以說經驗，或一路持續到那時的狀態。例如 <span lang="en">I have known her for two years.</span> 是「我認識她兩年了」，認識並沒有結束。完成進行式更強調活動持續了多久；有時還在做，有時剛停下來。先理解情境，再看動詞，不要只靠一個時間單字猜答案。</div></details>
    <details class="tip-details"><summary><span aria-hidden="true">✧</span> 給家長與老師：為什麼有 12 種或 16 種？</summary><div>這裡採用常見的教學整理方式：「現在、過去、未來」×「簡單、進行、完成、完成進行」＝12 種組合；再加上「從過去看未來」的四種表達，就得到 16 格。嚴格從動詞變化來說，英文的基本時態是現在與過去；未來通常用 will 等結構表達。所以 12／16 是幫助學習的分類方式，不是唯一的語言學分類。過去未來課程採用轉述情境；would 也能表示假設或過去的習慣，不能看到 would 就一律當成過去未來式。</div></details>
    <details class="source-notes"><summary>家長與老師的文法參考</summary><p>解說依據英語教學與文法資料整理，生活情境與練習題為本網站自編。</p><ul><li><a href="https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/present-tense" target="_blank" rel="noopener noreferrer">British Council：時態與現在式的四種形式</a></li><li><a href="https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/present-perfect" target="_blank" rel="noopener noreferrer">British Council：現在完成式</a></li><li><a href="https://dictionary.cambridge.org/grammar/british-grammar/past-perfect-continuous" target="_blank" rel="noopener noreferrer">Cambridge：過去完成式與過去完成進行式的差別</a></li><li><a href="https://dictionary.cambridge.org/grammar/british-grammar/future-perfect-continuous" target="_blank" rel="noopener noreferrer">Cambridge：未來完成進行式</a></li><li><a href="https://dictionary.cambridge.org/grammar/british-grammar/future-in-the-past" target="_blank" rel="noopener noreferrer">Cambridge：從過去看未來</a></li></ul></details>
  </dialog>`;

const escapeHTML = text => String(text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const levelOf = key => beginnerKeys.includes(key) ? '入門' : coreTenseKeys.includes(key) ? '進階' : '挑戰';
const isMixed = mode => ['mixed', 'mixed-extended'].includes(mode);

// 畫面元素都在 app（右側）與 side（左側控制列）裡；ctx 是主頁給的共用工具（朗讀、捲到頂端）。
let app = null, side = null, ctx = null;
const $ = id => app?.querySelector('#' + CSS.escape(id));
let currentTense = 'present', currentScene = 'breakfast', view = 'lesson', session = null;
const completedTenses = new Set();

/* ---------- 左側控制列 ---------- */
const GROUPS = [{ id:'beginner', label:'先修四種', keys:beginnerKeys },
  ...curriculumGroups.map(group => ({ ...group, label:'加強 · ' + group.label, keys:group.keys.filter(id => !beginnerKeys.includes(id)) }))];
function controls(box, context) {
  ctx = context; side = box;
  box.classList.add('tense-controls');
  box.innerHTML = `<h2>時態樂園</h2>
    <nav class="view-switch" aria-label="時態學習模式"><button id="tense-view-lesson" type="button">看圖學習</button><button id="tense-view-practice" type="button">互動練習</button></nav>
    <div id="tense-courses" class="tense-matrix" role="group" aria-label="時態課程">${GROUPS.map(group => `<div class="tense-row${group.id === 'past-future' ? ' advanced-row' : ''}"><span class="time-row-label">${group.label}</span>${group.keys.map(key => `<button type="button" id="tense-tab-${key}" data-tense="${key}" aria-label="${lessons[key].name}，${levelOf(key)}"><span class="matrix-level">${levelOf(key)}</span><strong>${lessons[key].name}</strong></button>`).join('')}</div>`).join('')}</div>
    <button class="btn small guide-button" id="tense-guide" type="button">教學筆記</button>`;
  box.querySelector('#tense-view-lesson').onclick = () => showView('lesson', false, true);
  box.querySelector('#tense-view-practice').onclick = () => showView('practice', false, true);
  box.querySelector('#tense-guide').onclick = () => { ctx.scrollTop(); $('guide-dialog')?.showModal(); };
  const matrix = box.querySelector('#tense-courses');
  matrix.addEventListener('click', event => { const button = event.target.closest('[data-tense]'); if (button) setTense(button.dataset.tense, true); });
  // 方向鍵在兩欄的課程格裡移動
  matrix.addEventListener('keydown', event => {
    const button = event.target.closest('[data-tense]');
    if (!button) return;
    const buttons = [...matrix.querySelectorAll('[data-tense]')], index = buttons.indexOf(button);
    const next = { ArrowRight:index + 1, ArrowLeft:index - 1, ArrowDown:index + 2, ArrowUp:index - 2, Home:0, End:buttons.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = buttons[(next + buttons.length) % buttons.length];
    setTense(target.dataset.tense);
    target.focus();
  });
  paintControls();
}
function paintControls() {
  if (!side) return;
  for (const name of ['lesson', 'practice']) side.querySelector('#tense-view-' + name)?.setAttribute('aria-pressed', String(view === name));
  for (const button of side.querySelectorAll('[data-tense]')) button.setAttribute('aria-pressed', String(button.dataset.tense === currentTense));
}

/* ---------- 右側內容 ---------- */
function render(root, context) {
  ctx = context;
  app = document.createElement('div');
  app.className = 'tense-app';
  app.innerHTML = PAGE;
  root.append(app);
  app.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => { currentScene = button.dataset.scene; updateLesson(); }));
  $('listen').addEventListener('click', event => ctx.speak($('english-sentence').textContent, event.currentTarget, 'en-US'));
  $('start-lesson').addEventListener('click', () => startPractice(currentTense));
  $('mixed-practice').addEventListener('click', () => startPractice('mixed'));
  $('close-guide').addEventListener('click', () => $('guide-dialog').close());
  updateLesson();
  if (session) renderPractice(); else startPractice(currentTense, false);
  showView(view);
}
function leave() {
  $('guide-dialog')?.close();
  app = null;
  side = null;
}

// 兩種模式共用同一塊內容區；切換時保留練習進度。
function showView(next, focus = false, scroll = false) {
  if (!['lesson', 'practice'].includes(next)) return;
  view = next;
  if (app) {
    $('lesson').hidden = view !== 'lesson';
    $('practice').hidden = view !== 'practice';
    if (focus) (view === 'lesson' ? $('lesson-panel') : ($('question-title') || $('result-title')))?.focus({ preventScroll:true });
  }
  if (scroll) ctx?.scrollTop();
  paintControls();
}

function renderTimeline(tense) {
  const data = timelineData[tense];
  const legend = data.range ? '深綠色的一段：動作持續進行；直線標記：我們看的時間點。' : '圓點：動作或事件；直線標記：我們看的時間點。';
  $('lesson-timeline').innerHTML = `<div class="timeline-heading"><strong>把時間畫出來</strong><span>${data.range ? '━ 持續做' : '● 事情發生'} · │看的時間</span></div><div class="timeline-track" aria-hidden="true">${data.range ? `<span class="timeline-range" style="left:${data.range[0]}%;width:${data.range[1] - data.range[0]}%"></span>` : ''}${(data.points || []).map(p => `<span class="timeline-point" style="left:${p}%"></span>`).join('')}<span class="timeline-reference" style="left:${data.reference}%"></span></div><div class="timeline-labels">${data.labels.map(label => `<span>${escapeHTML(label)}</span>`).join('')}</div><p>${escapeHTML(data.note)}</p>`;
  $('lesson-timeline').setAttribute('aria-label', legend + ' ' + data.labels.join('，') + '。' + data.note);
}

function updateLesson() {
  paintControls();
  if (!app) return;
  const lesson = lessons[currentTense], example = lesson.examples[currentScene];
  app.querySelectorAll('[data-scene]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === currentScene)));
  $('scene-label').textContent = scenes[currentScene].label;
  $('time-label').textContent = lesson.time;
  $('lesson-art').className = 'scene-art scene-' + currentScene;
  $('lesson-art').setAttribute('aria-label', scenes[currentScene].alt);
  $('scene-caption').textContent = example[2];
  $('lesson-kicker').textContent = lesson.english;
  $('lesson-name').textContent = lesson.name;
  $('lesson-level').textContent = levelOf(currentTense);
  $('lesson-title').textContent = lesson.title;
  $('lesson-description').textContent = lesson.description;
  $('english-sentence').innerHTML = example[0];
  $('chinese-sentence').textContent = example[1];
  $('formula').innerHTML = lesson.formula;
  $('formula-detail').textContent = lesson.detail;
  $('time-clues').textContent = lesson.clues;
  renderTimeline(currentTense);
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function setTense(tense, scroll = false) {
  if (!Object.hasOwn(lessons, tense)) throw new Error('請選擇課程表上的時態組合。');
  currentTense = tense;
  updateLesson();
  if (!session || session.mode !== tense) startPractice(tense, false);
  showView('lesson', false, scroll);
  return { tense, name:lessons[tense].name, sentence:$('english-sentence')?.textContent || '' };
}

/* ---------- 練習 ---------- */
function startPractice(mode, show = true) {
  if (!isMixed(mode) && !Object.hasOwn(lessons, mode)) throw new Error('請選擇有效的練習課程。');
  let list;
  if (isMixed(mode)) {
    list = allTenseKeys.map((tense, index) => ({ ...questions[tense][index % 3 === 1 ? 4 : index % 4], tense }));
    // 打散順序，混合練習不照課程表的順序出題。
    list = list.filter((_, i) => i % 2 === 0).concat(list.filter((_, i) => i % 2 === 1).reverse());
  } else {
    list = questions[mode].map(question => ({ ...question, tense:mode }));
  }
  session = { mode, list, index:0, results:[], selectedWords:[], submitted:false, last:null, done:false };
  renderPractice();
  if (show) showView('practice', true, true);
  return { mode, total:list.length, question:1 };
}
function renderPractice() {
  if (!app) return;
  if (session.done) return renderResults();
  renderQuestion();
  if (session.submitted) paintAnswer();
}

function renderQuestion() {
  const question = session.list[session.index];
  const isBuild = question.type === 'build';
  const label = isMixed(session.mode) ? '16 種混合練習' : lessons[session.mode].name + '小挑戰';
  const total = session.list.length;
  $('practice-content').innerHTML = `
    <div class="question-meta"><strong>${label}</strong><span>第 ${session.index + 1} / ${total} 題 · ${isBuild ? '組句子' : '選答案'}</span></div>
    <div class="progress-track" role="progressbar" aria-label="練習進度" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${session.index}"><span style="width:${session.index / total * 100}%"></span></div>
    <div class="question-layout">
      <div class="scene-art question-art scene-${question.scene}" role="img" aria-label="${scenes[question.scene].alt}"></div>
      <div class="question-content">
        <h4 id="question-title" tabindex="-1">${isBuild ? '排出完整句子' : '選出正確動詞'}</h4>
        <p class="question-context">${escapeHTML(question.context)}</p>
        ${isBuild ? `<div class="sentence-slot" id="sentence-slot" aria-label="你排出的句子"><span>從下面選單字，依序放進來</span></div><div class="word-bank" id="word-bank" aria-label="可選擇的單字"></div><div class="build-actions"><button type="button" id="check-sentence" class="primary-button" disabled>檢查答案</button><button type="button" id="clear-sentence" class="text-button">重新排列</button></div>` :
          `<p class="question-sentence" lang="en">${escapeHTML(question.sentence).replace('___', '<span class="blank" aria-label="空格">____</span>')}</p><div class="answer-options">${question.options.map((option, i) => `<button type="button" class="answer-option" data-option="${i}" lang="en"><span aria-hidden="true">${'ABC'[i]}</span>${escapeHTML(option)}</button>`).join('')}</div>`}
        <div id="answer-feedback" aria-live="polite" aria-atomic="true"></div>
        <div class="question-bottom">${isBuild ? '<span>點選已排單字可移回。</span>' : ''}<button type="button" id="next-question" class="primary-button" hidden>${session.index === total - 1 ? '查看成果' : '下一題'}</button></div>
      </div>
    </div>`;
  if (isBuild) {
    renderWordControls();
    $('check-sentence').addEventListener('click', checkSentence);
    $('clear-sentence').addEventListener('click', () => { if (!session.submitted) { session.selectedWords = []; renderWordControls(); } });
  } else {
    app.querySelectorAll('[data-option]').forEach(button => button.addEventListener('click', () => submitChoice(Number(button.dataset.option))));
  }
  $('next-question').addEventListener('click', nextQuestion);
}

function renderWordControls() {
  const question = session.list[session.index];
  $('sentence-slot').innerHTML = session.selectedWords.length ? session.selectedWords.map(index => `<button type="button" class="word-chip" data-remove="${index}" aria-label="移回單字 ${escapeHTML(question.words[index])}" lang="en">${escapeHTML(question.words[index])}</button>`).join('') : '<span>從下面選單字，依序放進來</span>';
  $('word-bank').innerHTML = question.words.map((word, index) => `<button type="button" class="word-chip" data-word="${index}" lang="en" ${session.selectedWords.includes(index) ? 'disabled' : ''}>${escapeHTML(word)}</button>`).join('');
  app.querySelectorAll('[data-word]').forEach(button => button.addEventListener('click', () => {
    if (session.submitted) return;
    session.selectedWords.push(Number(button.dataset.word));
    renderWordControls();
    ($('word-bank').querySelector('button:not(:disabled)') || $('check-sentence')).focus({ preventScroll:true });
  }));
  app.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
    if (session.submitted) return;
    const removed = Number(button.dataset.remove);
    session.selectedWords = session.selectedWords.filter(i => i !== removed);
    renderWordControls();
    $('word-bank').querySelector(`[data-word="${removed}"]`).focus({ preventScroll:true });
  }));
  $('check-sentence').disabled = session.selectedWords.length !== question.words.length;
}

function submitChoice(index) {
  if (session.submitted) return;
  const question = session.list[session.index];
  const picked = question.options[index];
  if (!picked) throw new Error('請選擇題目中的答案。');
  return finishAnswer(picked === question.answer, picked);
}
function checkSentence() {
  if (session.submitted) return;
  const question = session.list[session.index];
  if (session.selectedWords.length !== question.words.length) return;
  const picked = session.selectedWords.map(index => question.words[index]).join(' ');
  return finishAnswer(picked === question.answer, picked);
}
function finishAnswer(correct, picked) {
  const question = session.list[session.index];
  session.submitted = true;
  session.last = { correct, picked };
  session.results.push({ question, correct, picked });
  const solution = paintAnswer();
  $('next-question').focus({ preventScroll:true });
  return { correct, solution, explanation:question.explain };
}
// 作答後的畫面（重畫題目時也用它還原）：鎖住選項、標出對錯、顯示正確句子與解說。
function paintAnswer() {
  const question = session.list[session.index], { correct, picked } = session.last;
  const solution = question.type === 'build' ? question.answer : question.sentence.replace('___', question.answer);
  if (question.type === 'build') app.querySelectorAll('.word-chip, #clear-sentence, #check-sentence').forEach(button => { button.disabled = true; });
  else app.querySelectorAll('[data-option]').forEach(button => {
    button.disabled = true;
    const answer = question.options[Number(button.dataset.option)];
    if (answer === question.answer) button.classList.add('correct');
    else if (answer === picked) button.classList.add('incorrect');
  });
  $('answer-feedback').innerHTML = `<div class="feedback ${correct ? '' : 'wrong'}"><strong>${correct ? '答對了！你找到時間線索了。' : '再學一次，下次一定更進步！'}</strong>${correct ? '' : `<p>你的答案：<span lang="en">${escapeHTML(picked)}</span></p>`}<p>正確句子：<b lang="en">${escapeHTML(solution)}</b></p><p>${escapeHTML(question.explain)}</p></div>`;
  const progress = app.querySelector('[role="progressbar"]');
  progress.setAttribute('aria-valuenow', session.index + 1);
  progress.firstElementChild.style.width = (session.index + 1) / session.list.length * 100 + '%';
  $('next-question').hidden = false;
  return solution;
}
function nextQuestion() {
  if (!session.submitted) return;
  session.index += 1;
  session.submitted = false;
  session.selectedWords = [];
  session.last = null;
  if (session.index === session.list.length) {
    session.done = true;
    if (!isMixed(session.mode)) completedTenses.add(session.mode);
    renderResults();
    $('result-title').focus({ preventScroll:true });
    return;
  }
  renderQuestion();
  $('question-title').focus({ preventScroll:true });
}

function renderResults() {
  const correct = session.results.filter(result => result.correct).length;
  const missed = session.results.filter(result => !result.correct);
  const total = session.list.length;
  const coreCompleted = coreTenseKeys.filter(key => completedTenses.has(key)).length;
  const advancedCompleted = allTenseKeys.slice(12).filter(key => completedTenses.has(key)).length;
  $('practice-content').innerHTML = `<div class="practice-result"><span class="result-star" aria-hidden="true">✦</span><h4 id="result-title" tabindex="-1">${correct === total ? '太棒了！這次全部答對！' : '挑戰完成！每一題都讓你更進步。'}</h4><div class="result-score">${correct} <small>/ ${total} 題答對</small></div><p>${correct === total ? '你很會觀察時間線索，繼續挑戰吧！' : '看看下面的句子，把還不熟的地方再練一次。'}${completedTenses.size ? `<br>這次學習已完成 ${coreCompleted} / 12 種常見組合，${advancedCompleted} / 4 種過去未來表達。` : ''}</p><div class="result-actions"><button type="button" id="retry-practice" class="primary-button">再練一次</button><button type="button" id="back-lesson" class="outline-button">回去看看課程</button></div></div>${missed.length ? `<div class="review-list"><h5>一起複習這 ${missed.length} 題</h5>${missed.map(({ question, picked }) => `<div class="review-item"><p>${escapeHTML(question.context)}</p><p>你的答案：<span lang="en">${escapeHTML(picked)}</span></p><strong lang="en">${escapeHTML(question.type === 'build' ? question.answer : question.sentence.replace('___', question.answer))}</strong><p>${escapeHTML(question.explain)}</p></div>`).join('')}</div>` : ''}`;
  $('retry-practice').addEventListener('click', () => startPractice(session.mode));
  $('back-lesson').addEventListener('click', () => showView('lesson', true, true));
}

// 支援瀏覽器內建的 AI 工具時，提供切換課程與開始練習（和畫面上的操作相同）。
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const ready = () => { if (!app) throw new Error('請先打開「額外學習 → 時態樂園」。'); };
  const definitions = [
    { name:'navigate_tense_lesson', title:'切換時態課程', description:'Switch the visible lesson to one of the 16 tense/aspect combinations, all permanently visible in the course list.', inputSchema:{ type:'object', properties:{ tense:{ type:'string', enum:allTenseKeys } }, required:['tense'], additionalProperties:false }, annotations:{ readOnlyHint:false, untrustedContentHint:false }, execute:async input => { ready(); if (!input || Object.keys(input).some(k => k !== 'tense')) throw new Error('無效的課程參數。'); return setTense(input.tense, true); } },
    { name:'start_tense_practice', title:'開始時態練習', description:'Start or restart the visible practice session. This replaces the current unfinished practice. mixed covers all 16 combinations; mixed-extended is a legacy alias for the same challenge.', inputSchema:{ type:'object', properties:{ mode:{ type:'string', enum:[...allTenseKeys, 'mixed', 'mixed-extended'] } }, required:['mode'], additionalProperties:false }, annotations:{ readOnlyHint:false, untrustedContentHint:false }, execute:async input => { ready(); if (!input || Object.keys(input).some(k => k !== 'mode')) throw new Error('無效的練習參數。'); return startPractice(input.mode); } }
  ];
  for (const definition of definitions) {
    try { Promise.resolve(document.modelContext.registerTool(definition, { signal:lifecycle.signal })).catch(() => {}); } catch { /* 不支援的瀏覽器照常使用畫面操作 */ }
  }
  window.addEventListener('pagehide', () => lifecycle.abort(), { once:true });
}

// setTense／startPractice 和瀏覽器 AI 工具同一套；keys、session 給測試讀目前的課程與練習
return { render, controls, leave, setTense, startPractice, keys: allTenseKeys, get session() { return session; } };
})();
