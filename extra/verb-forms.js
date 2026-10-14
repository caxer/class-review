'use strict';

// Practical learning groups, not a claim that every textbook uses the same grade list.
// Forms are explicit: do not generate past forms by blindly adding -ed.
window.VerbForms = (() => {
  function rows(text, level, regular = false) {
    return text.trim().split('\n').map(line => {
      const [base, past, participle, zh, note = ''] = line.trim().split('|');
      // Group by the first (learning) form; retain every listed alternative for grading.
      const p = past.split(' / ')[0], pp = participle.split(' / ')[0];
      const pattern = regular ? 'regular' : base === p && p === pp ? 'AAA'
        : base === p ? 'AAB' : base === pp ? 'ABA' : p === pp ? 'ABB' : 'ABC';
      return Object.freeze({ base, past, participle, zh, note, level, pattern });
    });
  }
  const verbs = Object.freeze([
    ...rows(`
be|was / were|been|是；在|am / is 的過去式用 was；are 用 were。完成式用 been。
begin|began|begun|開始
bring|brought|brought|帶來
buy|bought|bought|買
catch|caught|caught|接住；趕上
come|came|come|來
cut|cut|cut|切；剪
do|did|done|做
draw|drew|drawn|畫；拉
drink|drank|drunk|喝
drive|drove|driven|開車
eat|ate|eaten|吃
fall|fell|fallen|落下；跌倒
feel|felt|felt|感覺
find|found|found|找到
fly|flew|flown|飛
forget|forgot|forgotten|忘記
get|got|gotten / got|得到；變得|過去分詞 gotten 常見於美式英文，got 常見於英式英文；表示擁有的 have got 不用 have gotten。
give|gave|given|給
go|went|gone|去
grow|grew|grown|成長；種植
have|had|had|有；吃／喝
hear|heard|heard|聽見
hit|hit|hit|打；撞
hurt|hurt|hurt|受傷；使疼痛
keep|kept|kept|保持；保留
know|knew|known|知道；認識
leave|left|left|離開；留下
lose|lost|lost|失去；輸
make|made|made|製作；使
meet|met|met|遇見
pay|paid|paid|付錢
put|put|put|放
read|read|read|閱讀|拼字相同，讀音不同：原形 /riːd/；過去式、過去分詞 /red/，和 red 同音。
ride|rode|ridden|騎
run|ran|run|跑
say|said|said|說
see|saw|seen|看見
sell|sold|sold|賣
send|sent|sent|寄；送
show|showed|shown / showed|展示|過去式用 showed；過去分詞常用 shown，也可用 showed。
sing|sang|sung|唱歌
sit|sat|sat|坐
sleep|slept|slept|睡覺
speak|spoke|spoken|說話
spend|spent|spent|花費（金錢／時間）
stand|stood|stood|站
swim|swam|swum|游泳
take|took|taken|拿；帶；搭乘
teach|taught|taught|教
tell|told|told|告訴
think|thought|thought|想；認為
understand|understood|understood|了解
wear|wore|worn|穿；戴
win|won|won|贏
write|wrote|written|寫
`, 'elementary'),
    ...rows(`
ask|asked|asked|問；請求
brush|brushed|brushed|刷（牙）；梳理
call|called|called|打電話；叫
clean|cleaned|cleaned|打掃
close|closed|closed|關閉|字尾已有 e，只加 d。
cook|cooked|cooked|煮
dance|danced|danced|跳舞|字尾已有 e，只加 d。
dress|dressed|dressed|穿衣；打扮
enjoy|enjoyed|enjoyed|享受；喜歡|母音 + y，直接加 ed。
exercise|exercised|exercised|運動|字尾已有 e，只加 d。
finish|finished|finished|完成
guess|guessed|guessed|猜
hate|hated|hated|討厭|字尾已有 e，只加 d。
help|helped|helped|幫助
hop|hopped|hopped|單腳跳|短母音後接單一子音，先雙寫 p 再加 ed。
jump|jumped|jumped|跳
kick|kicked|kicked|踢
laugh|laughed|laughed|笑
like|liked|liked|喜歡|字尾已有 e，只加 d。
listen|listened|listened|聽
live|lived|lived|居住|字尾已有 e，只加 d。
look|looked|looked|看
love|loved|loved|愛|字尾已有 e，只加 d。
mail|mailed|mailed|郵寄
need|needed|needed|需要
open|opened|opened|打開
paint|painted|painted|畫；油漆
pick|picked|picked|挑選；摘
plant|planted|planted|種植
play|played|played|玩；打球；演奏|母音 + y，直接加 ed。
point|pointed|pointed|指
practice|practiced|practiced|練習|美式動詞用 practice；英式動詞用 practise → practised → practised。
rain|rained|rained|下雨
rest|rested|rested|休息
skate|skated|skated|溜冰|字尾已有 e，只加 d。
ski|skied|skied|滑雪
smile|smiled|smiled|微笑|字尾已有 e，只加 d。
start|started|started|開始
stay|stayed|stayed|停留|母音 + y，直接加 ed。
stop|stopped|stopped|停止|短母音後接單一子音，先雙寫 p 再加 ed。
study|studied|studied|讀書；研究|子音 + y，先把 y 改成 i，再加 ed。
surf|surfed|surfed|衝浪
talk|talked|talked|談話
taste|tasted|tasted|品嚐；嚐起來|字尾已有 e，只加 d。
try|tried|tried|嘗試|子音 + y，先把 y 改成 i，再加 ed。
type|typed|typed|打字|字尾已有 e，只加 d。
use|used|used|使用|字尾已有 e，只加 d。
visit|visited|visited|拜訪；參觀
wait|waited|waited|等待
walk|walked|walked|走路
want|wanted|wanted|想要
wash|washed|washed|洗
watch|watched|watched|觀看
water|watered|watered|澆水
wish|wished|wished|希望；祝願
work|worked|worked|工作
`, 'elementary', true),
    ...rows(`
become|became|become|變成
beat|beat|beaten|打敗；敲打
bite|bit|bitten|咬
blow|blew|blown|吹
break|broke|broken|打破；壞掉
build|built|built|建造
burn|burned / burnt|burned / burnt|燃燒|burned 和 burnt 都可用；burnt 常見於英式英文。
choose|chose|chosen|選擇
cost|cost|cost|價值；花費|這裡指物品「價值多少」的用法。
dig|dug|dug|挖
dream|dreamed / dreamt|dreamed / dreamt|做夢|dreamed 和 dreamt 都可用。
feed|fed|fed|餵
fight|fought|fought|打架；戰鬥
hang|hung|hung|掛；懸掛
hide|hid|hidden|躲藏；藏
hold|held|held|握住；舉辦
lay|laid|laid|放置；下蛋|lay 後面通常接物品：lay the book on the desk。別和 lie（躺）混淆。
lead|led|led|帶領|過去式、過去分詞 led 讀 /led/。
learn|learned / learnt|learned / learnt|學習|learned 和 learnt 都可用；learnt 常見於英式英文。
lend|lent|lent|借出|lend 是借給別人；borrow 是向別人借。
let|let|let|讓
lie|lay|lain|躺；位於|這裡是「躺」的 lie；「說謊」則是 lie → lied → lied。
light|lit / lighted|lit / lighted|點亮；點燃|lit 和 lighted 都可用。
mean|meant|meant|意思是
ring|rang|rung|響；打電話
rise|rose|risen|升起|rise 是自己升起；raise 是把某物舉起。
shake|shook|shaken|搖；握手
shine|shone / shined|shone / shined|發光|表示發光時兩種都可用；擦亮鞋子通常用 shined。
shoot|shot|shot|射；投籃
shut|shut|shut|關閉
smell|smelled / smelt|smelled / smelt|聞；聞起來|smelled 和 smelt 都可用。
spell|spelled / spelt|spelled / spelt|拼字|spelled 和 spelt 都可用。
steal|stole|stolen|偷
throw|threw|thrown|丟
wake|woke / waked|woken / waked|醒來；叫醒|先記常見的 woke → woken；也有規則的 waked。
`, 'junior'),
    ...rows(`
agree|agreed|agreed|同意
answer|answered|answered|回答
arrive|arrived|arrived|抵達
believe|believed|believed|相信
borrow|borrowed|borrowed|借入|borrow 是向別人借；lend 是借給別人。
carry|carried|carried|攜帶|子音 + y，先把 y 改成 i，再加 ed。
change|changed|changed|改變
check|checked|checked|檢查
climb|climbed|climbed|爬
collect|collected|collected|收集
copy|copied|copied|抄寫；複製|子音 + y，先把 y 改成 i，再加 ed。
count|counted|counted|數；計算
cover|covered|covered|覆蓋
cry|cried|cried|哭|子音 + y，先把 y 改成 i，再加 ed。
decide|decided|decided|決定
die|died|died|死亡|字尾已有 e，只加 d。
drop|dropped|dropped|掉落|短母音後接單一子音，先雙寫 p 再加 ed。
enter|entered|entered|進入
expect|expected|expected|預期
explain|explained|explained|解釋
fill|filled|filled|填滿
fix|fixed|fixed|修理
follow|followed|followed|跟隨
happen|happened|happened|發生
hope|hoped|hoped|希望|hope → hoped；hop（單腳跳）則是 hopped。
invite|invited|invited|邀請
join|joined|joined|加入
kill|killed|killed|殺死
marry|married|married|結婚|子音 + y，先把 y 改成 i，再加 ed。
miss|missed|missed|想念；錯過
move|moved|moved|移動；搬家
notice|noticed|noticed|注意到
order|ordered|ordered|點餐；命令
pass|passed|passed|通過；傳遞
plan|planned|planned|計畫|短母音後接單一子音，先雙寫 n 再加 ed。
prefer|preferred|preferred|較喜歡|重音在最後一音節，雙寫 r 再加 ed。
prepare|prepared|prepared|準備
pull|pulled|pulled|拉
push|pushed|pushed|推
raise|raised|raised|舉起；飼養|raise 後面通常接東西；rise 是自己升起。
remember|remembered|remembered|記得
return|returned|returned|返回；歸還
save|saved|saved|拯救；儲存
share|shared|shared|分享
shop|shopped|shopped|購物|短母音後接單一子音，先雙寫 p 再加 ed。
shout|shouted|shouted|喊叫
snow|snowed|snowed|下雪
sound|sounded|sounded|聽起來
touch|touched|touched|觸碰
travel|traveled / travelled|traveled / travelled|旅行|美式常用 traveled；英式常用 travelled，兩種都可用。
turn|turned|turned|轉；變得
welcome|welcomed|welcomed|歡迎
worry|worried|worried|擔心|子音 + y，先把 y 改成 i，再加 ed。
`, 'junior', true)
  ].sort((a, b) => a.base.localeCompare(b.base, 'en')));

  const levels = { all: '全部程度', elementary: '國小先學', junior: '國中補充' };
  const patterns = { all: '全部變化', regular: '規則變化', AAA: 'AAA · 三態相同', AAB: 'AAB · 原形＝過去式',
    ABA: 'ABA · 原形＝過去分詞', ABB: 'ABB · 過去式＝過去分詞', ABC: 'ABC · 三態不同' };
  const state = { level: 'all', pattern: 'all', search: '', view: 'list', session: null };
  const formKeys = ['base', 'past', 'participle'];
  const formLabels = ['原形', '過去式', '過去分詞'];
  const alternatives = value => value.toLowerCase().split(/\s*\/\s*/);
  function matchesAnswer(input, expected) {
    const values = alternatives(String(input).trim());
    return values.every(value => alternatives(expected).includes(value));
  }
  function filtered() {
    const query = state.search.trim().toLowerCase();
    return verbs.filter(v => (state.level === 'all' || v.level === state.level)
      && (state.pattern === 'all' || v.pattern === state.pattern)
      && (!query || [v.base, v.past, v.participle, v.zh].some(value => value.toLowerCase().includes(query))));
  }

  function render(root, { el, chip, shuffle, speakBtn }) {
    const page = el('section', 'verb-page');
    page.setAttribute('aria-label', '動詞三態學習');
    const head = el('div', 'sheet-head');
    head.append(el('h2', null, '動詞三態'), el('p', 'note', `從生活常用字開始，累積 ${verbs.length} 個動詞。先看原形，再一起記過去式與過去分詞。`));
    const guide = el('details', 'verb-guide');
    guide.append(el('summary', null, '三態怎麼用？哪些字要特別留意？'));
    const examples = el('div', 'verb-usage');
    [ ['原形', 'I eat breakfast every day.', '我每天吃早餐。'], ['過去式', 'I ate breakfast yesterday.', '我昨天吃了早餐。'],
      ['過去分詞', 'I have eaten breakfast.', '我已經吃過早餐。'] ].forEach(([label, en, zh]) => {
      const item = el('div'); const sentence = el('p', 'verb-english', en); sentence.lang = 'en';
      item.append(el('b', null, label), sentence, el('p', 'note', zh)); examples.append(item);
    });
    guide.append(examples, el('p', 'note', '過去分詞常搭配 have / has / had，也能搭配 be 形成被動語態，不能把它當過去式單獨使用。三態不包含第三人稱單數（eats）和 -ing（eating）。'),
      el('p', 'note', '規則變化：通常加 ed；字尾 e 加 d（like → liked）；子音 + y 改成 ied（study → studied）；部分短母音、單一子音結尾要雙寫（stop → stopped）。母音 + y 直接加 ed（play → played）。'),
      el('p', 'note', 'AAA / AAB / ABA / ABB / ABC 按拼字分組；相同字母表示拼字相同。有多種形式時，以斜線前的形式分類。read 的三態拼字相同，但原形唸 /riːd/，另外兩態唸 /red/。斜線表示可用的形式，練習時填其中一種即可；be 的 was / were 要依主詞選。'),
      el('p', 'note', '「國小先學／國中補充」是建議的學習順序，各版本課本的進度可能不同。'));
    const sources = el('p', 'note', '延伸查閱：');
    [ ['British Council 不規則動詞', 'https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/irregular-verbs'],
      ['Cambridge：lay / lie', 'https://dictionary.cambridge.org/grammar/british-grammar/word-choice-lay-and-lie'],
      ['Cambridge：英美用法', 'https://dictionary.cambridge.org/us/grammar/british-grammar/british-english'] ].forEach(([label, url], i) => {
      if (i) sources.append(' · '); const a = el('a', null, label); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; sources.append(a);
    });
    guide.append(sources); head.append(guide);
    const views = el('div', 'chips');
    [['list', '三態表'], ['practice', '填寫練習']].forEach(([view, label]) => views.append(chip(label, state.view === view, () => {
      state.view = view; repaint();
    })));
    head.append(views); page.append(head);

    const filters = el('div', 'panel verb-filters');
    const searchLabel = el('label', 'field', '搜尋英文或中文'); searchLabel.htmlFor = 'verb-search';
    const search = el('input'); search.id = 'verb-search'; search.type = 'search'; search.placeholder = '例如：go、went、吃'; search.value = state.search;
    searchLabel.append(search); filters.append(searchLabel);
    for (const [key, label, options] of [['level', '學習程度', levels], ['pattern', '變化分類', patterns]]) {
      const field = el('label', 'field', label); field.htmlFor = 'verb-' + key;
      const select = el('select'); select.id = 'verb-' + key;
      Object.entries(options).forEach(([value, text]) => { const option = el('option', null, text); option.value = value; select.append(option); });
      select.value = state[key]; select.onchange = () => { state[key] = select.value; updateContent(); }; field.append(select); filters.append(field);
    }
    const reset = el('button', 'btn small', '清除篩選'); reset.type = 'button'; reset.onclick = () => {
      state.search = ''; state.level = 'all'; state.pattern = 'all'; repaint();
    };
    filters.append(reset); page.append(filters);
    const count = el('p', 'note'); count.id = 'verb-count'; count.setAttribute('role', 'status'); page.append(count);
    const content = el('div', 'verb-content'); page.append(content);
    search.oninput = () => { state.search = search.value; updateContent(); };
    root.append(page);
    function repaint() { root.replaceChildren(); render(root, { el, chip, shuffle, speakBtn }); }
    function button(label, action, cls = 'btn') {
      const b = el('button', cls, label); b.type = 'button'; b.onclick = action; return b;
    }
    function forms(v) {
      const dl = el('dl', 'verb-forms');
      formKeys.forEach((key, i) => {
        const cell = el('div'); const dd = el('dd'); const word = el('span', 'verb-english', v[key]); word.lang = 'en';
        // TTS may read the spelling "read" as present in every cell. Supply the homophone for past forms.
        const spoken = v.base === 'read' && key !== 'base' ? 'red' : v[key].replace(/\s*\/\s*/g, '. ');
        const audio = speakBtn(spoken, `朗讀 ${v.base} 的${formLabels[i]}`, 'en-US', true);
        dd.append(word); if (audio) dd.append(audio); cell.append(el('dt', null, formLabels[i]), dd); dl.append(cell);
      });
      return dl;
    }
    function card(v) {
      const article = el('article', 'panel verb-card'); article.dataset.verb = v.base;
      const top = el('div', 'verb-card-top'); const title = el('h3', 'verb-english', v.base); title.lang = 'en';
      top.append(title, el('span', 'pill', levels[v.level]), el('span', 'pill', v.pattern === 'regular' ? '規則' : v.pattern));
      article.append(top, el('p', 'verb-meaning', v.zh), forms(v));
      if (v.note) article.append(el('p', 'note verb-note', v.note)); return article;
    }
    function start(pool) {
      if (!pool.length) return;
      state.session = { list: shuffle(pool).slice(0, 10), index: 0, results: [], drafts: {}, answered: false };
      updateContent(); content.querySelector('input')?.focus({ preventScroll: true });
    }
    function practice(pool) {
      const setup = el('div', 'panel');
      setup.append(el('h3', null, '把動詞的兩個變身寫出來'), el('p', 'note', '從目前篩選的動詞隨機抽最多 10 題。過去式和過去分詞都正確才算答對；大小寫不影響，斜線列出的形式填一種即可。'),
        el('p', 'note', '切換三態表或篩選不會改變進行中的題目。想換範圍時，按「重新抽題」。'));
      const launch = button(state.session ? '重新抽題' : '開始練習', () => start(pool), 'btn primary');
      launch.id = 'verb-start'; launch.disabled = !pool.length; setup.append(launch); content.append(setup);
      const session = state.session; if (!session) return;
      if (session.index >= session.list.length) {
        const result = el('div', 'panel verb-result');
        const title = el('h3', null, '這次練習完成了！'); title.id = 'verb-result-title'; title.tabIndex = -1;
        const right = session.results.filter(r => r.ok).length;
        result.append(title, el('p', 'end-msg', `${right} / ${session.list.length} 題答對`));
        const wrong = session.results.filter(r => !r.ok).map(r => r.verb);
        if (wrong.length) {
          result.append(el('p', 'note', '再看一次這些動詞，把三態一起唸出來。'), button('再練答錯的動詞', () => start(wrong)));
          wrong.forEach(v => result.append(card(v)));
        } else result.append(el('p', 'note', '全部答對了！可以試試其他變化分類。'));
        content.append(result); return;
      }
      const v = session.list[session.index];
      const question = el('form', 'panel verb-question');
      const title = el('h3', null, `第 ${session.index + 1} / ${session.list.length} 題`); title.id = 'verb-question-title'; title.tabIndex = -1;
      const prompt = el('p', 'verb-prompt'); const base = el('b', 'verb-english', v.base); base.lang = 'en'; prompt.append(base, '　', v.zh);
      const baseAudio = speakBtn(v.base, `朗讀 ${v.base} 的原形`, 'en-US', true); if (baseAudio) prompt.append(baseAudio);
      question.append(title, prompt);
      const fields = el('div', 'verb-answer-fields');
      for (const [key, label] of [['past', '過去式'], ['participle', '過去分詞']]) {
        const field = el('label', 'field', label); const input = el('input'); input.id = 'verb-answer-' + key;
        field.htmlFor = input.id; input.required = true; input.autocomplete = 'off'; input.spellcheck = false; input.autocapitalize = 'none'; input.lang = 'en';
        const previous = session.results[session.index] || session.drafts[session.index]; input.value = previous?.[key] || ''; input.disabled = session.answered;
        input.oninput = () => { (session.drafts[session.index] ||= {})[key] = input.value; };
        field.append(input); fields.append(field);
      }
      question.append(fields);
      if (!session.answered) {
        const submit = el('button', 'btn primary', '對答案'); submit.type = 'submit'; submit.id = 'verb-check';
        question.append(submit, button('還不會，看答案', () => answer(true), 'btn small'));
        question.onsubmit = event => { event.preventDefault(); answer(false); };
      } else {
        const feedback = el('div', 'verb-feedback'); feedback.id = 'verb-feedback'; feedback.setAttribute('role', 'status');
        const answerResult = session.results[session.index]; feedback.classList.add(answerResult.ok ? 'is-correct' : 'is-wrong');
        feedback.append(el('p', null, answerResult.ok ? '答對了！把三態一起記起來。' : '再記一次：下面是正確的三態。'), forms(v));
        if (v.note) feedback.append(el('p', 'note', v.note)); question.append(feedback);
        const next = button(session.index + 1 === session.list.length ? '看成績' : '下一題', () => {
          session.index++; session.answered = false; updateContent();
          (content.querySelector('input') || content.querySelector('#verb-result-title'))?.focus({ preventScroll: true });
        }, 'btn primary'); next.id = 'verb-next'; question.append(next);
      }
      content.append(question);
      function answer(reveal) {
        if (session.answered) return;
        const past = question.querySelector('#verb-answer-past').value.trim();
        const participle = question.querySelector('#verb-answer-participle').value.trim();
        session.results.push({ verb: v, past, participle, ok: !reveal && matchesAnswer(past, v.past) && matchesAnswer(participle, v.participle) });
        session.answered = true; updateContent(); content.querySelector('#verb-next')?.focus({ preventScroll: true });
      }
    }
    function updateContent() {
      const pool = filtered(); count.textContent = `顯示 ${pool.length} / ${verbs.length} 個動詞`; content.replaceChildren();
      if (!pool.length) content.append(el('div', 'empty', '找不到符合的動詞，試試其他字或清除篩選。'));
      if (state.view === 'practice') practice(pool);
      else { const list = el('div', 'verb-list'); pool.forEach(v => list.append(card(v))); content.append(list); }
    }
    updateContent();
  }
  return Object.freeze({ verbs, matchesAnswer, render });
})();
