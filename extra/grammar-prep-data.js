'use strict';

// Original exercises inspired by publicly described preparation needs, not school exam papers.
// Keep course/question IDs stable: local progress is keyed by these IDs.
window.GrammarPrepData = (() => {
  const c = (prompt, options, answer, explain) => ({ type: 'choice', prompt, options, answer, explain });
  const r = (prompt, answers, explain) => ({ type: 'rewrite', prompt, answers, explain });
  const t = (prompt, answers, explain) => ({ type: 'translate', prompt, answers, explain });
  const l = (prompt, audio, options, answer, explain) => ({ type: 'listen', prompt, audio, options, answer, explain });
  const courses = [
    {
      id: 'questions', name: '問句與完整回答', short: '先找動詞，再改問句',
      intro: '分清楚 be 動詞和一般動詞，練習問句、否定句與完整回答。',
      rules: [
        ['be 動詞移到主詞前', 'He is a student. → Is he a student? 主詞換了，am / is / are 也要跟著調整。'],
        ['一般動詞用 do / does / did', 'Does she play tennis? 問習慣時，he / she / it 用 does；其他主詞用 do。過去的事用 did。助動詞後面接原形。'],
        ['否定句放 not', 'He is not hungry. / She does not eat meat. / They did not go out. 注意 doesn’t、didn’t 後面也是原形。'],
        ['依提示寫完整回答', 'When does Amy study English?（星期一）→ Amy studies English on Monday. 回答時移除助動詞，恢復正確的動詞形式。']
      ],
      examples: [
        ['Does Leo have a bike?', 'Leo has a bike.', 'Leo 是第三人稱單數，問句用 does have，肯定句用 has。'],
        ['Are the boys at home?', 'The boys are at home.', '主詞是複數，問句和回答都用 are。'],
        ['Did Nina visit her grandma yesterday?', 'Nina visited her grandma yesterday.', '問句 did + visit；肯定回答回到過去式 visited。']
      ],
      mistakes: [['Does she likes apples?', 'Does she like apples?', 'does 後面要用原形 like。'], ['He not is tired.', 'He is not tired.', 'be 動詞的否定句把 not 放在 be 後面。']],
      questions: [
        c('___ your brother a student?', ['Is', 'Are', 'Do', 'Does'], 'Is', 'a student 是名詞補語，主詞 your brother 是單數，用 Is。'),
        c('___ your friends play basketball every Saturday?', ['Are', 'Do', 'Does', 'Is'], 'Do', 'play 是一般動詞；your friends 是複數，問習慣用 Do。'),
        c('Does Lily ___ a sister?', ['has', 'have', 'having', 'had'], 'have', 'Does 後面使用動詞原形 have。'),
        c('Did Sam ___ to school yesterday?', ['went', 'goes', 'go', 'going'], 'go', 'Did 已表示過去，後面的 go 用原形。'),
        c('The children ___ not in the classroom.', ['is', 'do', 'does', 'are'], 'are', 'The children 是複數；說他們不在教室，用 are not。'),
        c('Amy does not ___ milk.', ['drinks', 'drink', 'drinking', 'drank'], 'drink', 'does not 後面的 drink 保持原形。'),
        c('問句：Does Max like cats? 選出正確的肯定簡答。', ['Yes, he is.', 'Yes, he do.', 'Yes, he does.', 'Yes, he likes.'], 'Yes, he does.', 'Does 開頭的問句，肯定簡答用 Yes, he does.。'),
        c('問句：Are you ready? 選出正確的否定簡答。', ['No, I am not.', 'No, you are not.', 'No, I do not.', 'No, I is not.'], 'No, I am not.', '別人問 you，自己回答要用 I；be 動詞改成 am。'),
        c('When does Emma have a music class?（用星期二完整回答）', ['Emma have a music class on Tuesday.', 'Emma has a music class on Tuesday.', 'Emma does has a music class on Tuesday.', 'Emma is a music class on Tuesday.'], 'Emma has a music class on Tuesday.', '回答恢復肯定句：Emma has；星期前用 on。'),
        c('選出正確的一般動詞否定句。', ['Tom does not plays soccer.', 'Tom not play soccer.', 'Tom is not play soccer.', 'Tom does not play soccer.'], 'Tom does not play soccer.', 'Tom 用 does not，再接原形 play。'),
        r('把 Tom plays tennis every Sunday. 改成 Yes / No 問句。', ['Does Tom play tennis every Sunday?'], 'Tom 是單數，問句用 Does Tom play，不用 plays。'),
        r('把 The girls are tired. 改成否定句。', ['The girls are not tired.'], '在 are 後面加 not；aren’t 也可以。'),
        r('When does Ben have an English class? 用「星期五」寫完整回答。', ['Ben has an English class on Friday.', 'He has an English class on Friday.'], 'Ben / He 搭配 has，星期五用 on Friday。'),
        t('翻譯：他是你的老師嗎？', ['Is he your teacher?'], 'be 動詞 is 放在主詞 he 前面形成問句。'),
        t('翻譯：你昨天有去學校嗎？', ['Did you go to school yesterday?'], '問過去的動作用 Did，再接原形 go。'),
        t('翻譯：她每天讀書。', ['She studies every day.', 'She reads every day.', 'She reads books every day.'], '說每天的習慣，主詞 She 後面用 studies 或 reads。every day 是兩個字。'),
        l('聽問句，選出正確的肯定簡答。', 'Does Mia have a dog?', ['Yes, she does.', 'Yes, she is.', 'Yes, she do.', 'Yes, she has.'], 'Yes, she does.', 'Does Mia…? 的肯定簡答是 Yes, she does.。'),
        l('聽問句，選出正確的否定簡答。', 'Are the boys hungry?', ['No, he is not.', 'No, they do not.', 'No, they are not.', 'No, we does not.'], 'No, they are not.', 'the boys 用 they 代替；Are 問句用 are not 回答。'),
        l('聽短對話：Leo 昨天做了什麼？', 'Amy: Did you walk to school yesterday? Leo: No, I rode my bike.', ['He walked to school.', 'He rode his bike.', 'He took a bus.', 'He stayed home.'], 'He rode his bike.', 'Leo 否定了走路，接著說 rode my bike，表示騎腳踏車。'),
        l('聽短對話：Mia 星期三有什麼課？', 'Ben: When do you have an English class, Mia? Mia: I have an English class on Wednesday.', ['She has a math class.', 'She has a music class.', 'She has a science class.', 'She has an English class.'], 'She has an English class.', 'Mia 的回答是星期三有英文課；完整句主詞換成 She，have 變 has。')
      ]
    },
    {
      id: 'frequency', name: '疑問詞與頻率副詞', short: '問幾次、多少、多久',
      intro: '先讀回答的意思，分辨題目是在問頻率、數量、時間長度或地點。',
      rules: [
        ['頻率用 how often', 'How often do you swim? → Twice a week. 問多久做一次，回答可用 every Sunday、once a week、never。'],
        ['數量看名詞種類', 'How many books…? 問可數名詞的數量；How much water…? 問不可數名詞的量。How much is it? 也能問價格。'],
        ['時間長度用 how long', 'How long is the movie? → Two hours. 問長度，不是問做幾次。when 問何時，where 問哪裡。'],
        ['頻率副詞的位置', 'She usually walks to school. / She is usually happy. 頻率副詞通常在一般動詞前、be 動詞後。always、usually、sometimes、seldom、never 表示不同頻率。']
      ],
      examples: [
        ['How often does Eva exercise?', 'She exercises three times a week.', 'three times a week 回答頻率；回答中的動詞要變 exercises。'],
        ['How many pencils do you have?', 'I have four pencils.', 'pencils 可數，問數量用 how many。'],
        ['How long is the class?', 'It is forty minutes long.', 'forty minutes 是時間長度，用 how long 問。']
      ],
      mistakes: [['How much books do you have?', 'How many books do you have?', 'books 是可數複數，用 many。'], ['She often go to school by bus.', 'She often goes to school by bus.', '頻率副詞不會改變主詞與動詞的搭配；She 後面仍要用 goes。']],
      questions: [
        c('A: ___ do you visit your grandma? B: Once a week.', ['How many', 'How often', 'How much', 'How old'], 'How often', 'Once a week 表示每週一次，問的是頻率。'),
        c('___ students are in your class?', ['How much', 'How long', 'How many', 'How often'], 'How many', 'students 是可數複數，用 How many。'),
        c('___ milk do you need?', ['How many', 'How old', 'How often', 'How much'], 'How much', 'milk 是不可數名詞，問份量用 How much。'),
        c('A: ___ is the movie? B: About ninety minutes.', ['How long', 'How often', 'Where', 'Who'], 'How long', 'ninety minutes 說時間長度，問句用 How long。'),
        c('A: ___ is your bag? B: Under the chair.', ['When', 'Why', 'Where', 'How old'], 'Where', 'Under the chair 回答位置，用 Where 問。'),
        c('A: ___ do you like this book? B: Because it is funny.', ['Who', 'Why', 'When', 'How many'], 'Why', 'Because 說明原因，對應 Why。'),
        c('選出頻率副詞放在常見中位位置的句子。', ['He is usually happy.', 'He usually is happy.', 'He is happy usually.', 'Usually happy he is.'], 'He is usually happy.', '常見中位位置是 be 動詞後：is usually happy。其他位置有時帶有強調，這裡練習一般語序。'),
        c('選出文法正確的句子。', ['She walk often to school.', 'She often walking to school.', 'She often walks to school.', 'She do often walks to school.'], 'She often walks to school.', 'often 放在一般動詞前，She 的動詞用 walks。'),
        c('A: ___ is your brother? B: He is ten years old.', ['How old', 'How often', 'How many', 'Where'], 'How old', 'ten years old 回答年齡，用 How old。'),
        c('seldom 最接近哪一個意思？', ['總是', '常常', '每天', '很少'], '很少', 'seldom 表示很少發生，頻率比 often 低。'),
        r('把 She goes to the library twice a week. 改成問「頻率」的問句，主詞仍用 she。', ['How often does she go to the library?'], 'twice a week 改成 How often，問句用 does she go。'),
        r('把 You have three pens. 改成問「有幾枝筆」的問句，主詞仍用 you。', ['How many pens do you have?'], 'How many 後面接複數 pens，再用 do you have。'),
        r('把 I am happy. 加入 usually，放在常見中位位置。', ['I am usually happy.'], '頻率副詞 usually 放在 be 動詞 am 後面。'),
        t('翻譯：你多久游泳一次？', ['How often do you swim?'], '問頻率用 How often；you 搭配 do。'),
        t('翻譯：他很少遲到。', ['He is seldom late.', 'He is rarely late.'], 'late 是形容詞，用 is；seldom / rarely 放在 is 後面。'),
        t('翻譯：她每週跑步兩次。', ['She runs twice a week.', 'She runs two times a week.'], 'She 搭配 runs；每週兩次用 twice a week。'),
        l('聽句子：她多久上一次音樂課？', 'She has a music class every Sunday.', ['Every day.', 'Once a week.', 'Twice a week.', 'Once a month.'], 'Once a week.', '每個星期日一次，也就是每週一次。'),
        l('聽問句，選出回答「時間長度」的選項。', 'How long is your English class?', ['On Monday.', 'Three times a week.', 'Forty minutes.', 'At school.'], 'Forty minutes.', 'How long 問時間長度，Forty minutes 才符合。'),
        l('聽短對話：Emma 的哥哥或弟弟總共有幾位？', 'Jack: How many brothers do you have, Emma? Emma: I have two brothers.', ['One.', 'Two.', 'Three.', 'Four.'], 'Two.', 'Emma 說 two brothers，總共兩位。'),
        l('聽短對話：Ben 多久踢一次足球？', 'Amy: How often do you play soccer, Ben? Ben: I play soccer on Tuesday and Friday every week.', ['Once a week.', 'Every day.', 'Twice a week.', 'Once a month.'], 'Twice a week.', '每週星期二和星期五各一次，共每週兩次。')
      ]
    },
    {
      id: 'comparison', name: '比較級與所有格', short: '誰的東西？誰比誰更⋯⋯',
      intro: '比較兩個人或物品時，要把比較級、所有格與比較對象一起看清楚。',
      rules: [
        ['短形容詞常加 er / est', 'tall → taller → tallest；big → bigger → biggest；happy → happier → happiest。比較兩者常搭配 than。'],
        ['較長形容詞與不規則變化', 'beautiful → more beautiful → most beautiful；good → better → best。一般不要同時寫 more taller。最高級常搭配 the。'],
        ['所有格後面接名詞', 'my bag、her hair、Tom’s bike。my / your / his / her / our / their 表示東西屬於誰。'],
        ['所有代名詞可以單獨使用', 'This bag is mine. / Her hair is longer than mine. mine = my hair；比較頭髮與頭髮，避免比較到整個人。mine、yours、his、hers、ours、theirs 後面不再加名詞。']
      ],
      examples: [
        ['Amy is taller than Ben.', 'Amy 比 Ben 高。', 'taller 是 tall 的比較級，than 後面放另一個比較對象。'],
        ['My bag is bigger than yours.', '我的包包比你的大。', 'yours 代替 your bag，兩邊都是包包。'],
        ['Lisa’s hair is longer than Anna’s.', 'Lisa 的頭髮比 Anna 的長。', 'Anna’s 後面省略 hair，比較的仍然是兩人的頭髮。']
      ],
      mistakes: [['This bag is my.', 'This bag is mine.', '後面沒有名詞，使用可以單獨出現的 mine。'], ['Amy’s hair is longer than Ben.', 'Amy’s hair is longer than Ben’s.', '比較對象要一致：Amy 的頭髮和 Ben 的頭髮。']],
      questions: [
        c('Amy is ___ than her brother.', ['tall', 'taller', 'tallest', 'more taller'], 'taller', '兩人比較用 taller，不能同時加 more。'),
        c('This box is ___ than that box.', ['big', 'biger', 'bigger', 'biggest'], 'bigger', 'big 的比較級先雙寫 g，再加 er：bigger。'),
        c('This flower is ___ than that flower.', ['beautifuler', 'most beautiful', 'beautiful', 'more beautiful'], 'more beautiful', 'beautiful 的比較級用 more beautiful。'),
        c('Leo is ___ tallest boy in his class.', ['the', 'a', 'an', 'than'], 'the', '在一群人中比較用最高級，前面通常加 the。'),
        c('good 的比較級是哪一個？', ['gooder', 'better', 'best', 'more better'], 'better', 'good → better → best，要記不規則變化。'),
        c('This is ___ bag. It belongs to me.', ['mine', 'me', 'my', 'I'], 'my', 'bag 前面要用所有格 my。'),
        c('This blue pen belongs to me. It is ___.', ['mine', 'my', 'me', 'I'], 'mine', '後面沒有名詞，使用所有代名詞 mine。'),
        c('Amy has long hair. Her hair is longer than ___.（比較她和我的頭髮）', ['I', 'me', 'my', 'mine'], 'mine', 'mine 代替 my hair，比較兩人的頭髮。'),
        c('That is ___ bicycle.（那是 Tom 的腳踏車）', ['Tom', 'Tom’s', 'Toms', 'he'], 'Tom’s', '名字後面加 ’s 表示所有：Tom’s bicycle。'),
        c('happy 的比較級是哪一個？', ['happyer', 'happiest', 'happier', 'more happier'], 'happier', 'happy 的 y 前面是子音，改成 i 再加 er：happier。'),
        r('把 Ben is tall. / Amy is taller. 合併成一句，以 Amy 為主詞，用 than。', ['Amy is taller than Ben.'], '先放 Amy is taller，再接 than Ben。'),
        r('把 This is my pencil. 改成以 This pencil 開頭，並使用所有代名詞。', ['This pencil is mine.'], 'my pencil 改成可單獨使用的 mine。'),
        r('把 My hair is longer than your hair. 的 your hair 換成所有代名詞。', ['My hair is longer than yours.'], 'yours 可以代替 your hair。'),
        t('翻譯：我的包包比你的大。', ['My bag is bigger than yours.', 'My bag is bigger than your bag.'], '比較包包，用 bigger than；yours 代替 your bag。'),
        t('翻譯：Anna 的頭髮比 Mia 的長。', ["Anna's hair is longer than Mia's.", "Anna's hair is longer than Mia's hair."], 'Anna’s hair 和 Mia’s hair 是相同種類的比較對象。'),
        t('翻譯：這本書比那本書更有趣。', ['This book is more interesting than that book.', 'This book is more interesting than that one.'], 'interesting 的比較級用 more interesting。'),
        l('聽句子：誰比較高？', 'Eva is taller than Jack.', ['Eva.', 'Jack.', 'They are the same height.', 'We do not know.'], 'Eva.', 'Eva is taller than Jack 表示 Eva 比 Jack 高。'),
        l('聽句子：誰的包包比較大？', "Ben's bag is bigger than Amy's bag.", ["Amy's bag.", "Ben's bag.", 'Both bags are the same size.', 'Neither of them has a bag.'], "Ben's bag.", 'Ben’s bag 是句子主詞，而且比較大。'),
        l('聽短對話：藍色的筆屬於誰？', 'Tom: Is this blue pen yours, Amy? Amy: No. My pen is red. The blue pen is Ben’s.', ['Tom.', 'Amy.', 'Ben.', 'We do not know.'], 'Ben.', 'Amy 說自己的筆是紅色，藍色的筆是 Ben’s。'),
        l('聽短對話：哪個盒子最重？', 'Amy: Is the red box heavier than the blue box? Ben: Yes. And the green box is heavier than the red box.', ['The red box.', 'The blue box.', 'All three are the same weight.', 'The green box.'], 'The green box.', '紅色比藍色重，綠色又比紅色重，所以綠色最重。')
      ]
    },
    {
      id: 'prepositions', name: '時間與位置介系詞', short: '何時？在哪裡？',
      intro: '把時間的大小範圍與物品的位置分清楚，再選 in、on、at 等介系詞。',
      rules: [
        ['at 接鐘點與固定表達', 'at seven、at noon、at night。說明確的鐘點時用 at。'],
        ['on 接星期、日期和特定某天', 'on Monday、on July 5、on Sunday morning。指定某一天的早上，仍用 on。'],
        ['in 接月份、年份與一般時段', 'in June、in 2026、in the morning。every、last、next、this 開頭的時間片語，通常不再加 in / on / at：next Monday。'],
        ['位置看圖像關係', 'in the box（裡面）、on the desk（表面上）、under the chair（下方）、behind the door（後方）、between the two trees（兩者之間）。']
      ],
      examples: [
        ['We have a test on Thursday.', '我們星期四有考試。', '星期前面用 on。'],
        ['I get up at six in the morning.', '我早上六點起床。', '明確鐘點用 at，一般的早上用 in the morning。'],
        ['The ball is under the chair.', '球在椅子下面。', 'under 表示下方的位置。']
      ],
      mistakes: [['I study English in Monday.', 'I study English on Monday.', '星期一是特定一天，前面用 on。'], ['We will meet on next Friday.', 'We will meet next Friday.', 'next Friday 本身就是時間片語，不再加 on。']],
      questions: [
        c('We have an English test ___ Wednesday.', ['on', 'in', 'at', 'under'], 'on', '星期前面用 on。'),
        c('School starts ___ eight o’clock.', ['on', 'in', 'at', 'between'], 'at', '明確的鐘點用 at。'),
        c('My birthday is ___ August.', ['at', 'in', 'on', 'behind'], 'in', '月份前面用 in。'),
        c('I usually read ___ the evening.', ['on', 'at', 'under', 'in'], 'in', '一般的晚上時段用 in the evening。'),
        c('We will visit Grandma ___ Sunday morning.', ['in', 'at', 'on', 'behind'], 'on', '特定星期日的早上用 on Sunday morning。'),
        c('選出正確的句子。', ['We will meet next Monday.', 'We will meet on next Monday.', 'We will meet at next Monday.', 'We will meet in next Monday.'], 'We will meet next Monday.', 'next Monday 前面通常不加時間介系詞。'),
        c('The cat is ___ the box.（貓在箱子裡）', ['on', 'under', 'behind', 'in'], 'in', '在容器裡面用 in。'),
        c('The book is ___ the desk.（書放在桌面上）', ['in', 'on', 'under', 'between'], 'on', '接觸物體表面，在上面用 on。'),
        c('The ball is ___ the chair.（球在椅子下方）', ['under', 'on', 'in', 'at'], 'under', '在下方用 under。'),
        c('Amy is ___ Ben and Leo.（Amy 在兩人之間）', ['under', 'behind', 'between', 'in'], 'between', '在兩者之間用 between A and B。'),
        r('When does Amy have a piano class? 用「星期六」寫完整回答。', ['Amy has a piano class on Saturday.', 'She has a piano class on Saturday.'], '肯定回答用 has，星期六用 on Saturday。'),
        r('依提示寫完整句子：I / get up / six / the morning。使用適當介系詞。', ['I get up at six in the morning.'], '鐘點用 at six，早上用 in the morning。'),
        r('改正時間介系詞：We will go to the park on next Sunday.', ['We will go to the park next Sunday.'], 'next Sunday 前面去掉 on。'),
        t('翻譯：我們星期一有英文課。', ['We have an English class on Monday.', 'We have English class on Monday.', 'We have English on Monday.'], '星期一用 on Monday；主詞 We 搭配 have。'),
        t('翻譯：球在椅子下面。', ['The ball is under the chair.'], '位置在下方用 under the chair。'),
        t('翻譯：我的生日在六月。', ['My birthday is in June.'], 'June 是月份，前面用 in。'),
        l('聽句子：測驗在哪一天？', 'We have a math test on Thursday.', ['Tuesday.', 'Wednesday.', 'Thursday.', 'Friday.'], 'Thursday.', 'on Thursday 表示星期四。'),
        l('聽句子：貓在哪裡？', 'The cat is behind the door.', ['In the box.', 'Behind the door.', 'Under the desk.', 'On the chair.'], 'Behind the door.', 'behind the door 表示門的後方。'),
        l('聽短對話：Amy 早上幾點起床？', 'Ben: What time do you get up, Amy? Amy: I get up at half past six in the morning.', ['At six.', 'At seven.', 'At half past seven.', 'At half past six.'], 'At half past six.', 'half past six 是六點半，鐘點前用 at。'),
        l('聽短對話：Leo 會在哪個時段去公園？', 'Amy: Will you go to the park on Saturday morning, Leo? Leo: No. I will go on Saturday afternoon.', ['On Saturday afternoon.', 'On Saturday morning.', 'On Sunday morning.', 'On Sunday afternoon.'], 'On Saturday afternoon.', 'Leo 否定了早上，改成星期六下午。')
      ]
    }
  ];
  for (const course of courses) {
    course.questions = course.questions.map((q, index) => Object.freeze({ ...q, id: `${course.id}-${index + 1}`, course: course.id }));
    Object.freeze(course.questions); Object.freeze(course);
  }
  return Object.freeze({ courses: Object.freeze(courses), questions: Object.freeze(courses.flatMap(c => c.questions)) });
})();
