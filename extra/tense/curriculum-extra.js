// 時態樂園的 16 格課程表、時間線與加強課程資料；tense.js 從 window.TenseCurriculum 取用。
window.TenseCurriculum = (() => {
'use strict';

// A teaching map of tense/aspect combinations, with a separate future-in-the-past row.
const curriculumGroups = [
  {id:'present',label:'現在',keys:['present','continuous','present-perfect','present-perfect-continuous']},
  {id:'past',label:'過去',keys:['past','past-continuous','past-perfect','past-perfect-continuous']},
  {id:'future',label:'未來',keys:['future','future-continuous','future-perfect','future-perfect-continuous']},
  {id:'past-future',label:'過去未來',keys:['past-future','past-future-continuous','past-future-perfect','past-future-perfect-continuous']}
];
const coreTenseKeys = curriculumGroups.slice(0,3).flatMap(group=>group.keys);
const allTenseKeys = curriculumGroups.flatMap(group=>group.keys);
const aspectLabels = ['簡單','進行','完成','完成進行'];
const beginnerKeys = ['present','continuous','past','future'];
const extraLessons = {};
const extraQuestions = {};
const timelineData = {
  present:{labels:['之前也做','現在的習慣','平常反覆做'],points:[12,50,88],reference:50,note:'一個個小圓點是反覆做的事。現在簡單式可以說習慣，不代表此刻正在做。'},
  continuous:{labels:['剛才','現在這一刻','接下來'],range:[37,62],reference:50,note:'深綠色的一段是正在進行的動作，穿過「現在」。句子沒有告訴我們何時結束。'},
  'present-perfect':{labels:['之前發生','現在回頭看','接下來'],points:[23],reference:50,note:'之前的事，和現在有關。可以看成果、累積經驗，也可以說持續到現在的狀態。'},
  'present-perfect-continuous':{labels:['開始做','持續到現在附近','接下來'],range:[12,50],reference:50,note:'從之前開始，持續到現在或剛剛。重點是活動和「多久」，不一定表示已經做完。'},
  past:{labels:['以前發生','後來','現在'],points:[12],reference:12,note:'回想以前的一件事。圓點放在以前；事情發生的時間已經過去了。'},
  'past-continuous':{labels:['更早','以前的某一刻','現在'],range:[29,63],reference:50,note:'把鏡頭停在以前的某一刻：那時正在做。常會搭配另一個突然發生的小事件。'},
  'past-perfect':{labels:['更早的事','以前那時回頭看','現在'],points:[20],reference:50,note:'先有更早的事，再到以前的參考時間。用 had + 過去分詞把先後關係說清楚。'},
  'past-perfect-continuous':{labels:['早就開始做','以前那時回頭看','現在'],range:[12,50],reference:50,note:'在以前「那時」之前就開始，已經持續一段時間。重點是那時以前做了多久，不保證之後繼續或停止。'},
  future:{labels:['現在','以後會做','更後面'],points:[74],reference:12,note:'站在現在往前看，說之後會做什麼。這裡用 will + 動詞原形。'},
  'future-continuous':{labels:['現在','未來某一刻','再之後'],range:[37,66],reference:50,note:'把鏡頭放到未來某一刻：那時正在做。用 will be + 動詞-ing。'},
  'future-perfect':{labels:['現在','預計先發生','未來那時回頭看'],points:[51],reference:88,note:'想像到未來「那時」回頭看，先前已經做過、累積多少，或某個狀態已持續多久。'},
  'future-perfect-continuous':{labels:['現在','預計開始做','未來那時回頭看'],range:[43,88],reference:88,note:'想像到未來「那時」，活動已經持續多久。深綠色的一段表示累積的時間，不表示一定在那時停止。'},
  'past-future':{labels:['以前說話時','當時預計之後','再之後'],points:[65],reference:12,note:'先回到以前說話的時候，再看當時的未來。這是轉述當時的想法，不保證後來真的發生。'},
  'past-future-continuous':{labels:['以前說話時','當時預計的時刻','再之後'],range:[38,67],reference:50,note:'以前說：到了之後的某一刻，會正在做。這裡用 would be + 動詞-ing 轉述。'},
  'past-future-perfect':{labels:['以前說話時','當時預計先發生','當時預計的期限'],points:[50],reference:88,note:'以前預計：到了之後的期限，已經做過。這裡是轉述預期，和「如果當初⋯⋯」的假設情境不同。'},
  'past-future-perfect-continuous':{labels:['以前說話時','當時預計開始','當時預計的時刻'],range:[43,88],reference:88,note:'以前預計：到了之後的某一刻，活動已持續多久。這裡是在轉述預期，沒有斷定實際結果。'}
};

function example(en,zh,context,wrong,chunks) { return {en,zh,context,wrong,chunks}; }
function addLesson(id,config,examples) {
  extraLessons[id]={...config,examples:Object.fromEntries(Object.entries(examples).map(([scene,e])=>[scene,[e.en,e.zh,e.context]]))};
  const entries=Object.entries(examples);
  extraQuestions[id]=entries.map(([scene,e],index)=>{
    const match=e.en.match(/<mark>(.*?)<\/mark>/);
    if(!match)throw new Error('例句必須標示主要動詞組：'+id);
    const answer=match[1];
    const options=[answer,...e.wrong];
    const shift=(allTenseKeys.indexOf(id)+index)%3;
    return {scene,context:e.context+' 選出正確的動詞組。',sentence:e.en.replace(/<mark>.*?<\/mark>/,'___'),options:options.slice(shift).concat(options.slice(0,shift)),answer,explain:config.questionReason+' 這句的動詞組是 '+answer+'。'};
  });
  for(const [scene,e] of entries.slice(0,2)){
    const answer=e.en.replace(/<\/?mark>/g,'');
    if(e.chunks.join(' ')!==answer)throw new Error('組句詞塊與例句不符：'+id+' / '+scene);
    // The fixed bank is rearranged away from the answer, while each chunk stays readable.
    const words=e.chunks.filter((_,i)=>i%2===1).reverse().concat(e.chunks.filter((_,i)=>i%2===0));
    extraQuestions[id].push({type:'build',scene,context:'用'+config.name+'表達：「'+e.zh+'」',words,answer,explain:config.questionReason+' 注意主要動詞組的先後順序。'});
  }
}

addLesson('past-continuous',{
  name:'過去進行式',short:'以前那時正在做',english:'PAST CONTINUOUS',title:'以前的某一刻，正在做',
  description:'像翻出昨天的照片：那一刻，小安正在做什麼？用「過去進行式」，把以前正在做的動作說出來。',
  formula:'主詞 ＋ <strong>was / were ＋ 動詞-ing</strong>',
  detail:'I / He / She / It 用 was；You / We / They 用 were。另一件事突然發生時，常用過去簡單式。',
  clues:'at seven yesterday 昨天七點 · when ... 當另一件事發生時',time:'THEN · 以前那時',
  questionReason:'說以前那一刻正在進行的動作，用 was / were + 動詞-ing；We / They 搭配 were。'
},{
  breakfast:example('I <mark>was eating</mark> breakfast when Mum called.','媽媽打電話來時，我正在吃早餐。','昨天媽媽打電話來的那一刻，小安正吃著早餐。',['were eating','was eat'],['I','was','eating','breakfast','when Mum called.']),
  soccer:example('We <mark>were playing</mark> soccer at four yesterday.','昨天四點，我們正在踢足球。','把時間停在昨天四點，小安和朋友正在踢球。',['was playing','were play'],['We','were','playing','soccer','at four yesterday.']),
  dog:example('He <mark>was walking</mark> his dog when it started to rain.','開始下雨時，他正在遛小狗。','昨天忽然下雨的那一刻，小安正在遛狗。',['were walking','was walk']),
  school:example('They <mark>were walking</mark> to school at seven yesterday.','昨天七點，他們正在走路去上學。','昨天七點，孩子們還在走去學校的路上。',['was walking','were walk'])
});

addLesson('present-perfect',{
  name:'現在完成式',short:'之前的事連到現在',english:'PRESENT PERFECT',title:'回頭看，之前的事和現在有關',
  description:'「已經吃過，所以現在不餓」「今天踢過兩次」都在回頭看之前的事。現在完成式也能說經驗和持續到現在的狀態。',
  formula:'主詞 ＋ <strong>have / has ＋ 過去分詞</strong>',
  detail:'He / She / It 用 has；其他主詞用 have。過去分詞不是都和過去式一樣：eat → ate → eaten。',
  clues:'already 已經 · just 剛剛 · ever 曾經 · yet 還沒／已經（常見於問句與否定句）',time:'UP TO NOW · 到現在',
  questionReason:'從現在回頭看，用 have / has + 過去分詞。I / We / They 用 have；He 用 has。eat 的過去分詞是 eaten。'
},{
  breakfast:example('I <mark>have eaten</mark> breakfast already.','我已經吃過早餐了。','小安已經吃過早餐，所以現在肚子不餓。',['have ate','has eaten'],['I','have','eaten','breakfast','already.']),
  soccer:example('We <mark>have played</mark> soccer twice today.','我們今天已經踢過兩次足球。','今天還沒結束，小安和朋友回想今天已踢了兩次球。',['has played','have play'],['We','have','played','soccer','twice today.']),
  dog:example('He <mark>has walked</mark> his dog already.','他已經遛過小狗了。','小安已經遛過狗，現在小狗在休息。',['have walked','has walk']),
  school:example('They <mark>have arrived</mark> at school already.','他們已經到學校了。','孩子們已經到學校，現在可以準備上課。',['has arrived','have arrive'])
});

addLesson('present-perfect-continuous',{
  name:'現在完成進行式',short:'一直做到現在附近',english:'PRESENT PERFECT CONTINUOUS',title:'已經做了一陣子，重點是多久',
  description:'「我已經踢了半小時，還在踢！」不只說此刻正在做，還把前面持續的時間一起說出來。有時也能說剛停下來的活動。',
  formula:'主詞 ＋ <strong>have / has been ＋ 動詞-ing</strong>',
  detail:'He / She / It 用 has been；其他主詞用 have been。for 接一段時間，since 接開始的時間點。',
  clues:'for ten minutes 持續十分鐘 · since seven 從七點開始',time:'UNTIL NOW · 持續到現在附近',
  questionReason:'強調之前開始的活動已持續到現在附近，用 have / has been + 動詞-ing。been 不能省略。'
},{
  breakfast:example('I <mark>have been eating</mark> breakfast for ten minutes.','我已經吃了十分鐘早餐。','小安十分鐘前就開始吃早餐，現在還在吃。',['has been eating','have being eating'],['I','have','been','eating','breakfast','for ten minutes.']),
  soccer:example('We <mark>have been playing</mark> soccer for half an hour.','我們已經踢了半小時足球。','小安和朋友半小時前開始踢球，現在還在球場上踢。',['has been playing','have been play'],['We','have','been','playing','soccer','for half an hour.']),
  dog:example('He <mark>has been walking</mark> his dog for fifteen minutes.','他已經遛了十五分鐘小狗。','小安十五分鐘前開始遛狗，現在還在散步。',['have been walking','has be walking']),
  school:example('They <mark>have been walking</mark> to school for twenty minutes.','他們已經走了二十分鐘去上學。','孩子們二十分鐘前就出發，現在仍在去學校的路上。',['has been walking','have been walk'])
});

addLesson('past-perfect',{
  name:'過去完成式',short:'以前那時，之前已做',english:'PAST PERFECT',title:'以前那時，另一件事更早發生',
  description:'昨天媽媽打電話來之前，我已經吃過早餐了。兩件以前的事，先發生的那件可以用「過去完成式」。',
  formula:'主詞 ＋ <strong>had ＋ 過去分詞</strong>',
  detail:'不管主詞是誰，都用 had。eat 的過去式是 ate，但 had 後面的過去分詞要用 eaten。',
  clues:'before ... 在另一件事之前 · by the time ... 到那時',time:'BEFORE THEN · 以前那時之前',
  questionReason:'站在以前那個時間回頭看更早的事，用 had + 過去分詞。had 後面不能直接放動詞原形或 ate。'
},{
  breakfast:example('I <mark>had eaten</mark> breakfast before Mum called.','媽媽打電話來之前，我已經吃過早餐。','昨天先吃完早餐，後來媽媽才打電話來。',['had ate','had eat'],['I','had','eaten','breakfast','before Mum called.']),
  soccer:example('We <mark>had played</mark> soccer before we went home.','我們回家之前，已經踢過足球。','昨天先踢球，後來才回家。現在回想回家之前的事。',['had play','had playing'],['We','had','played','soccer','before we went home.']),
  dog:example('He <mark>had walked</mark> his dog before dinner.','晚餐之前，他已經遛過小狗。','昨天晚餐開始時，小安已經完成遛狗這件事。',['had walk','had walking']),
  school:example('They <mark>had arrived</mark> at school before the bell rang.','鐘響之前，他們已經到學校了。','昨天孩子們先到學校，後來上課鐘才響。',['had arrive','had arriving'])
});

addLesson('past-perfect-continuous',{
  name:'過去完成進行式',short:'以前那時，已持續多久',english:'PAST PERFECT CONTINUOUS',title:'在以前那時之前，已經做了一陣子',
  description:'昨天媽媽打電話來時，我已經吃了十分鐘早餐。把鏡頭放在以前，再回頭看那個動作已經持續多久。',
  formula:'主詞 ＋ <strong>had been ＋ 動詞-ing</strong>',
  detail:'had 說「從以前回頭看」；been + 動詞-ing 說「持續做」。不是每個動詞都適合進行式，例如 know 通常不用 knowing。',
  clues:'for ... when ... 已做多久，另一件事發生 · since ... before ...',time:'UP TO THEN · 持續到以前那時',
  questionReason:'活動在以前那時之前已開始，強調到那時已持續多久，用 had been + 動詞-ing。'
},{
  breakfast:example('I <mark>had been eating</mark> breakfast for ten minutes when Mum called.','媽媽打電話來時，我已經吃了十分鐘早餐。','昨天小安七點開始吃早餐，七點十分媽媽打電話來；到那時已吃了十分鐘。',['had being eating','had been eat'],['I','had','been','eating','breakfast','for ten minutes','when Mum called.']),
  soccer:example('We <mark>had been playing</mark> soccer for half an hour when it started to rain.','開始下雨時，我們已經踢了半小時足球。','昨天小安和朋友三點開始踢球，三點半下雨；到下雨那時已踢了半小時。',['had be playing','had been play'],['We','had','been','playing','soccer','for half an hour','when it started to rain.']),
  dog:example('He <mark>had been walking</mark> his dog for fifteen minutes when Dad called.','爸爸打電話來時，他已經遛了十五分鐘小狗。','昨天開始遛狗十五分鐘後，爸爸打電話來。回頭看到電話來時已遛了多久。',['had being walking','had been walk']),
  school:example('They <mark>had been walking</mark> to school for twenty minutes when they saw a friend.','他們遇見朋友時，已經走了二十分鐘去上學。','昨天孩子們出發二十分鐘後遇到朋友；在遇到朋友之前已一直走路。',['had been walk','had be walking'])
});

addLesson('future-continuous',{
  name:'未來進行式',short:'以後那時正在做',english:'FUTURE CONTINUOUS',title:'想像未來某一刻，正在做',
  description:'想像明天四點的球場：我那時會正在踢球。說未來某一刻進行中的動作，可以用「未來進行式」。',
  formula:'主詞 ＋ <strong>will be ＋ 動詞-ing</strong>',
  detail:'主詞不同也一樣用 will be，不能寫 will is。進行中的動詞用 eating、playing、walking。',
  clues:'at eight tomorrow 明天八點 · this time tomorrow 明天這個時候',time:'AT THAT FUTURE TIME · 未來那一刻',
  questionReason:'說未來某一刻正在做的事，用 will be + 動詞-ing。be 用原形，不能換成 is 或 being。'
},{
  breakfast:example('I <mark>will be eating</mark> breakfast at eight tomorrow.','明天八點，我會正在吃早餐。','小安想像明天八點的自己，那時早餐還在吃。',['will being eating','will be eat'],['I','will','be','eating','breakfast','at eight tomorrow.']),
  soccer:example('We <mark>will be playing</mark> soccer at four tomorrow.','明天四點，我們會正在踢足球。','小安和朋友想像明天四點，那時會在球場上踢球。',['will is playing','will be play'],['We','will','be','playing','soccer','at four tomorrow.']),
  dog:example('He <mark>will be walking</mark> his dog at five tomorrow.','明天五點，他會正在遛小狗。','小安想像明天五點，那時會正在公園裡遛狗。',['will be walk','will being walking']),
  school:example('They <mark>will be walking</mark> to school at seven tomorrow.','明天七點，他們會正在走路去上學。','孩子們想像明天七點，那時還在去學校的路上。',['will are walking','will be walk'])
});

addLesson('future-perfect',{
  name:'未來完成式',short:'以後那時，之前已做',english:'FUTURE PERFECT',title:'到了未來那時，回頭看已經做過',
  description:'「到明天八點，我就已經吃過早餐了。」把自己放到明天八點，再回頭看之前已經發生的事。',
  formula:'主詞 ＋ <strong>will have ＋ 過去分詞</strong>',
  detail:'will 後面固定用原形 have，不用 has。主動動作的例句使用 eaten、played、walked、arrived。',
  clues:'by eight tomorrow 到明天八點為止 · by the time ... 到那時',time:'BY THEN · 到未來那時',
  questionReason:'想像到了未來那時，回頭看之前的事，用 will have + 過去分詞。這裡的 have 不能變成 has。'
},{
  breakfast:example('I <mark>will have eaten</mark> breakfast by eight tomorrow.','到明天八點，我就已經吃過早餐了。','小安預計明天七點半吃完早餐，所以到八點回頭看時已經吃過。',['will has eaten','will have ate'],['I','will','have','eaten','breakfast','by eight tomorrow.']),
  soccer:example('We <mark>will have played</mark> soccer twice by tomorrow evening.','到明天傍晚，我們就已經踢過兩次足球了。','小安和朋友預計明天早上踢一次、下午再踢一次，到傍晚累積兩次。',['will have play','will has played'],['We','will','have','played','soccer','twice','by tomorrow evening.']),
  dog:example('He <mark>will have walked</mark> his dog by six tomorrow.','到明天六點，他就已經遛過小狗了。','小安預計明天五點半遛完狗，所以到六點時已經遛過。',['will have walk','will has walked']),
  school:example('They <mark>will have arrived</mark> at school by eight tomorrow.','到明天八點，他們就已經到學校了。','孩子們預計明天七點五十分到校，所以到八點回頭看時已經到校。',['will has arrived','will have arrive'])
});

addLesson('future-perfect-continuous',{
  name:'未來完成進行式',short:'以後那時，已持續多久',english:'FUTURE PERFECT CONTINUOUS',title:'到了未來那時，已經做了多久',
  description:'「明天八點時，我就已經吃了十分鐘早餐。」想像未來的某一刻，回頭算活動已經持續了多久。',
  formula:'主詞 ＋ <strong>will have been ＋ 動詞-ing</strong>',
  detail:'四個小積木依序放：will → have → been → eating。for 加持續多久；by 加我們回頭看的未來時間。',
  clues:'for ten minutes by eight tomorrow 到明天八點時已持續十分鐘',time:'DURATION BY THEN · 到未來那時已多久',
  questionReason:'計算到未來那時活動已持續多久，用 will have been + 動詞-ing。have、been、動詞-ing 都要留下來。'
},{
  breakfast:example('I <mark>will have been eating</mark> breakfast for ten minutes by eight tomorrow.','到明天八點，我就已經吃了十分鐘早餐。','小安預計明天七點五十分開始吃早餐，吃到八點時已持續十分鐘。',['will have being eating','will has been eating'],['I','will','have','been','eating','breakfast','for ten minutes','by eight tomorrow.']),
  soccer:example('We <mark>will have been playing</mark> soccer for half an hour by five tomorrow.','到明天五點，我們就已經踢了半小時足球。','小安和朋友預計明天四點半開始踢球，到五點回頭看時已踢了半小時。',['will have been play','will has been playing'],['We','will','have','been','playing','soccer','for half an hour','by five tomorrow.']),
  dog:example('He <mark>will have been walking</mark> his dog for fifteen minutes by six tomorrow.','到明天六點，他就已經遛了十五分鐘小狗。','小安預計明天五點四十五分開始遛狗，到六點時已遛了十五分鐘。',['will have being walking','will have been walk']),
  school:example('They <mark>will have been walking</mark> to school for twenty minutes by seven tomorrow.','到明天七點，他們就已經走了二十分鐘去上學。','孩子們預計明天六點四十分出發，到七點時已走了二十分鐘。',['will has been walking','will have been walk'])
});

addLesson('past-future',{
  name:'過去未來簡單式',short:'以前說，以後會做',english:'FUTURE IN THE PAST · SIMPLE',title:'回到以前，說當時的「以後」',
  description:'小安昨天說：「我八點會吃早餐。」今天轉述昨天的話，可以說 he said he would eat。這裡的「以後」是從昨天說話時來看。',
  formula:'過去的說話動詞 ＋ 主詞 ＋ <strong>would ＋ 動詞原形</strong>',
  detail:'轉述時常把 will 改成 would；人稱、時間用語也要依情境調整。這裡練轉述，不是 would 的所有用法。',
  clues:'He said ... 他當時說 · We thought ... 我們當時想',time:'FUTURE FROM THEN · 當時的未來',
  questionReason:'轉述以前說「以後會做」的話，這裡用 would + 動詞原形。它說的是當時的預期，沒有保證後來成真。'
},{
  breakfast:example('He said he <mark>would eat</mark> breakfast at eight.','他當時說，他八點會吃早餐。','小安昨天七點說自己八點會吃早餐。現在轉述他當時的話。',['would eats','would ate'],['He said','he','would','eat','breakfast','at eight.']),
  soccer:example('We said we <mark>would play</mark> soccer at four.','我們當時說，我們四點會踢足球。','我們昨天三點說自己四點會踢球。現在轉述當時的話。',['would plays','would played'],['We said','we','would','play','soccer','at four.']),
  dog:example('He said he <mark>would walk</mark> his dog at five.','他當時說，他五點會遛小狗。','小安昨天下午說自己五點會遛狗。現在轉述他當時的預期。',['would walks','would walked']),
  school:example('They said they <mark>would go</mark> to school the next day.','他們當時說，他們隔天會去上學。','孩子們前天說「明天會去上學」。現在轉述時，用 the next day 表示當時說的隔天。',['would goes','would went'])
});

addLesson('past-future-continuous',{
  name:'過去未來進行式',short:'以前說，以後正在做',english:'FUTURE IN THE PAST · CONTINUOUS',title:'以前說：之後那時，會正在做',
  description:'昨天小安想像八點的自己，說那時會正在吃早餐。現在轉述這個「以後正在做」的想法，用 would be eating。',
  formula:'過去的說話動詞 ＋ 主詞 ＋ <strong>would be ＋ 動詞-ing</strong>',
  detail:'把 will be eating 的 will 換成 would，保留 be + eating。不是說現在正在做。',
  clues:'He said ... at eight 他當時說八點時 · the next day 當時說的隔天',time:'IN PROGRESS AFTER THEN · 當時預計正在做',
  questionReason:'轉述以前預計「之後某刻正在做」，用 would be + 動詞-ing。be 是原形，後面動詞加 ing。'
},{
  breakfast:example('He said he <mark>would be eating</mark> breakfast at eight.','他當時說，八點時他會正在吃早餐。','小安昨天七點預計八點會還在吃早餐。現在轉述這個想法。',['would being eating','would be eat'],['He said','he','would','be','eating','breakfast','at eight.']),
  soccer:example('We said we <mark>would be playing</mark> soccer at four.','我們當時說，四點時我們會正在踢足球。','我們昨天三點預計四點會正在球場上踢球。現在轉述當時的預期。',['would are playing','would be play'],['We said','we','would','be','playing','soccer','at four.']),
  dog:example('He said he <mark>would be walking</mark> his dog at five.','他當時說，五點時他會正在遛小狗。','小安昨天下午預計五點會正在遛狗。現在轉述當時的想法。',['would being walking','would be walk']),
  school:example('They said they <mark>would be walking</mark> to school at seven the next day.','他們當時說，隔天七點會正在走路去上學。','孩子們前天預計隔天七點會在去學校的路上。現在轉述。',['would were walking','would be walk'])
});

addLesson('past-future-perfect',{
  name:'過去未來完成式',short:'以前說，到時已經做',english:'FUTURE IN THE PAST · PERFECT',title:'以前預計：到之後那時，已經做過',
  description:'昨天七點，小安說到八點就會吃過早餐。現在轉述這個「到時之前已做」的預期，用 would have eaten。',
  formula:'過去的說話動詞 ＋ 主詞 ＋ <strong>would have ＋ 過去分詞</strong>',
  detail:'這裡把 will have eaten 轉述為 would have eaten。相同形式也能出現在假設句；要看情境，不能只看 would have。',
  clues:'He said ... by eight 他當時說到八點為止 · by the following evening 到當時說的隔天傍晚',time:'EXPECTED BY THEN · 當時預計到那時',
  questionReason:'轉述以前預期「到之後那時已經做過」，用 would have + 過去分詞。這裡不是在描述沒實現的假設條件。'
},{
  breakfast:example('He said he <mark>would have eaten</mark> breakfast by eight.','他當時說，到八點就會已經吃過早餐。','小安昨天七點預計七點半吃完，因此說到八點會已吃過早餐。現在轉述這個預期。',['would has eaten','would have ate'],['He said','he','would','have','eaten','breakfast','by eight.']),
  soccer:example('We said we <mark>would have played</mark> soccer twice by the following evening.','我們當時說，到隔天傍晚就會踢過兩次足球。','我們前天預計隔天早上和下午各踢一次球。現在轉述當時預計的累積次數。',['would have play','would has played'],['We said','we','would','have','played','soccer','twice','by the following evening.']),
  dog:example('He said he <mark>would have walked</mark> his dog by six.','他當時說，到六點就會已經遛過小狗。','小安昨天下午預計五點半遛完狗，因此說到六點會已經遛過。現在轉述。',['would have walk','would has walked']),
  school:example('They said they <mark>would have arrived</mark> at school by eight the next day.','他們當時說，到隔天八點就會已經到校。','孩子們前天預計隔天七點五十分到校，因此說到八點會已經到校。現在轉述預期。',['would has arrived','would have arrive'])
});

addLesson('past-future-perfect-continuous',{
  name:'過去未來完成進行式',short:'以前說，到時已做多久',english:'FUTURE IN THE PAST · PERFECT CONTINUOUS',title:'以前預計：到之後那時，已持續多久',
  description:'昨天七點，小安說自己七點五十分開始吃，到八點時就會已經吃了十分鐘。現在轉述這個預期，用 would have been eating。',
  formula:'過去的說話動詞 ＋ 主詞 ＋ <strong>would have been ＋ 動詞-ing</strong>',
  detail:'這是進階的轉述組合：would → have → been → eating。要同時看「以前說」「之後那時」「持續多久」。',
  clues:'He said ... for ten minutes by eight 他當時說到八點時已做十分鐘',time:'EXPECTED DURATION · 當時預計持續多久',
  questionReason:'轉述以前預計「到之後那時已持續多久」，用 would have been + 動詞-ing。這裡說的是當時預期，沒有斷定實際結果。'
},{
  breakfast:example('He said he <mark>would have been eating</mark> breakfast for ten minutes by eight.','他當時說，到八點就會已經吃了十分鐘早餐。','小安昨天七點預計七點五十分開始吃，到八點已吃十分鐘。現在轉述他當時的預期。',['would have being eating','would has been eating'],['He said','he','would','have','been','eating','breakfast','for ten minutes','by eight.']),
  soccer:example('We said we <mark>would have been playing</mark> soccer for half an hour by five.','我們當時說，到五點就會已經踢了半小時足球。','我們昨天三點預計四點半開始踢球，到五點已踢半小時。現在轉述這個預期。',['would have been play','would has been playing'],['We said','we','would','have','been','playing','soccer','for half an hour','by five.']),
  dog:example('He said he <mark>would have been walking</mark> his dog for fifteen minutes by six.','他當時說，到六點就會已經遛了十五分鐘小狗。','小安昨天下午預計五點四十五分開始遛狗，到六點已遛十五分鐘。現在轉述。',['would have being walking','would have been walk']),
  school:example('They said they <mark>would have been walking</mark> to school for twenty minutes by seven the next day.','他們當時說，到隔天七點就會已經走了二十分鐘去上學。','孩子們前天預計隔天六點四十分出發，到七點已走二十分鐘。現在轉述當時的預期。',['would has been walking','would have been walk'])
});

return { curriculumGroups, coreTenseKeys, allTenseKeys, aspectLabels, beginnerKeys, extraLessons, extraQuestions, timelineData };
})();
