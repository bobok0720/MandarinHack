import { VocabCard } from '../types';
import { createNewCard } from './srsService';

const RAW_HSK6_DATA = [
  { hanzi: "哎哟", pinyin: "āi yō", definition: "ouch; ow; oh (expression of surprise or pain)", sentence: "哎哟，我的脚扭了一下。", translation: "Ouch, I twisted my ankle." },
  { hanzi: "挨", pinyin: "ái", definition: "to suffer; to endure; to drag out", sentence: "为了省钱，他经常挨饿。", translation: "To save money, he often goes hungry." },
  { hanzi: "癌症", pinyin: "ái zhèng", definition: "cancer", sentence: "早期发现癌症治愈率较高。", translation: "Early detection of cancer has a higher cure rate." },
  { hanzi: "爱不释手", pinyin: "ài bú shì shǒu", definition: "to love something too much to part with it", sentence: "他对这部新手机爱不释手。", translation: "He loves this new phone so much he can't put it down." },
  { hanzi: "爱戴", pinyin: "ài dài", definition: "to love and respect (a leader, teacher, etc.)", sentence: "这位校长深受学生们的爱戴。", translation: "This principal is deeply loved and respected by the students." },
  { hanzi: "暧昧", pinyin: "ài mèi", definition: "ambiguous; shady; dubious", sentence: "他们之间的关系有些暧昧。", translation: "The relationship between them is a bit ambiguous." },
  { hanzi: "安宁", pinyin: "ān níng", definition: "peaceful; tranquil; calm", sentence: "乡村的生活宁静而安宁。", translation: "Life in the countryside is quiet and peaceful." },
  { hanzi: "安详", pinyin: "ān xiáng", definition: "serene; composed", sentence: "老人安详地坐在摇椅上晒太阳。", translation: "The old man sat serenely in the rocking chair basking in the sun." },
  { hanzi: "安置", pinyin: "ān zhì", definition: "to find a place for; to arrange for; to resettle", sentence: "政府妥善安置了灾区的难民。", translation: "The government properly resettled the refugees from the disaster area." },
  { hanzi: "暗示", pinyin: "àn shì", definition: "to drop a hint; to suggest; suggestion", sentence: "由于他没有听懂我的暗示，我只好直说了。", translation: "Since he didn't catch my hint, I had to speak directly." },
  { hanzi: "案件", pinyin: "àn jiàn", definition: "legal case; case", sentence: "警察正在调查这起复杂的案件。", translation: "The police are investigating this complex case." },
  { hanzi: "案例", pinyin: "àn lì", definition: "case (law); example of case", sentence: "教授引用了一个经典的商业案例进行分析。", translation: "The professor cited a classic business case for analysis." },
  { hanzi: "按摩", pinyin: "àn mó", definition: "massage", sentence: "工作了一天，去按摩一下可以放松肌肉。", translation: "After a day of work, going for a massage can relax your muscles." },
  { hanzi: "昂贵", pinyin: "áng guì", definition: "expensive; costly", sentence: "这家餐厅的菜肴虽然美味，但价格昂贵。", translation: "Although the dishes at this restaurant are delicious, the prices are expensive." },
  { hanzi: "凹凸", pinyin: "āo tū", definition: "bump; uneven; concave and convex", sentence: "这条山路凹凸不平，非常难走。", translation: "This mountain road is uneven and very difficult to travel." },
  { hanzi: "巴不得", pinyin: "bā bu de", definition: "to be eager for; to look forward to", sentence: "我巴不得马上就能见到你。", translation: "I am eager to see you immediately." },
  { hanzi: "巴结", pinyin: "bā jie", definition: "to fawn on; to curry favor with", sentence: "他为了升职，整天巴结老板。", translation: "In order to get a promotion, he fawns on the boss all day." },
  { hanzi: "拔苗助长", pinyin: "bá miáo zhù zhǎng", definition: "to spoil things through excessive enthusiasm (lit. pull shoots to help them grow)", sentence: "教育孩子不能拔苗助长，要顺其自然。", translation: "Educating children should not be rushed; one must let nature take its course." },
  { hanzi: "把关", pinyin: "bǎ guān", definition: "to check on; to guard a pass", sentence: "质量检测员严格把关，确保产品合格。", translation: "Quality inspectors strictly check to ensure products are qualified." },
  { hanzi: "把手", pinyin: "bǎ shǒu", definition: "handle; grip; knob", sentence: "门把手坏了，打不开门。", translation: "The door handle is broken, and the door cannot be opened." },
  { hanzi: "罢工", pinyin: "bà gōng", definition: "strike (of workers)", sentence: "工人们举行罢工，要求提高工资。", translation: "The workers went on strike demanding higher wages." },
  { hanzi: "霸道", pinyin: "bà dào", definition: "overbearing; bossy; unreasonable", sentence: "他这种霸道的作风让人很难接受。", translation: "His overbearing style is hard for people to accept." },
  { hanzi: "掰", pinyin: "bāi", definition: "to break off with fingers/hands", sentence: "他把面包掰成两半，分给了弟弟。", translation: "He broke the bread in half and shared it with his younger brother." },
  { hanzi: "摆脱", pinyin: "bǎi tuō", definition: "to break away from; to cast off; to get rid of", sentence: "她终于摆脱了那段痛苦的回忆。", translation: "She finally broke away from those painful memories." },
  { hanzi: "败坏", pinyin: "bài huài", definition: "to ruin; to corrupt; to undermine", sentence: "这种行为会败坏社会的风气。", translation: "Wait behavior will corrupt the social atmosphere." },
  { hanzi: "拜访", pinyin: "bài fǎng", definition: "to visit; to call on", sentence: "周末我们要去拜访一位老朋友。", translation: "We are going to visit an old friend this weekend." },
  { hanzi: "拜年", pinyin: "bài nián", definition: "to pay a New Year call; to wish Happy New Year", sentence: "春节期间，大家互相拜年。", translation: "During the Spring Festival, everyone wishes each other a Happy New Year." },
  { hanzi: "拜托", pinyin: "bài tuō", definition: "to request; to entreat; please!", sentence: "这件事就拜托你了。", translation: "I'm counting on you for this matter." },
  { hanzi: "颁布", pinyin: "bān bù", definition: "to issue; to promulgate (laws, decrees)", sentence: "政府颁布了新的环保法规。", translation: "The government promulgated new environmental protection regulations." },
  { hanzi: "颁发", pinyin: "bān fā", definition: "to issue; to award", sentence: "校长亲自为获奖学生颁发证书。", translation: "The principal personally awarded certificates to the winning students." }
];

export const getInitialHSK6Cards = (): VocabCard[] => {
  return RAW_HSK6_DATA.map(item => createNewCard(
    item.hanzi,
    item.pinyin,
    item.definition,
    item.sentence,
    item.translation
  ));
};