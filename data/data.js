(function () {
/**
 * 青山学院大学 陸上競技部 データベース — デモデータ（虚构演示数据）
 *
 * 注意：本文件中的所有选手、高校、大会、成绩均为虚构，
 * 仅用于演示网站功能。替换本文件（保持相同结构）即可使用真实数据。
 *
 * 成绩记录由下面的确定性生成器在加载时展开（同一份定义永远生成同样的数据），
 * 无需手工罗列数百条记录。
 */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseScore(raw) {
  const s = String(raw).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?$/);
  if (!m) return null;
  const a = +m[1], b = +m[2];
  const c = m[3] != null ? +m[3] : null;
  const frac = m[4] != null ? +("0." + m[4]) : 0;
  return (c != null ? a * 3600 + b * 60 + c : a * 60 + b) + frac;
}

function fmt(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec - h * 3600) / 60);
  const s = Math.floor(sec - h * 3600 - m * 60);
  const cs = Math.round((sec - Math.floor(sec)) * 100);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return (h ? h + ":" : "") + mm + ":" + String(s).padStart(2, "0") + (cs ? "." + String(cs).padStart(2, "0") : "");
}

function academicYear(dateStr) {
  const y = +String(dateStr).slice(0, 4);
  const m = +String(dateStr).slice(5, 7);
  return m >= 4 ? y : y - 1;
}

/* ---------------- 高校 ---------------- */
const SCHOOLS = [
  { id: 1, name: "明誠学園高校", pref: "東京都" },
  { id: 2, name: "神南学院高校", pref: "神奈川県" },
  { id: 3, name: "東都大附属高校", pref: "東京都" },
  { id: 4, name: "武蔵野実業高校", pref: "東京都" },
  { id: 5, name: "湘南工業高校", pref: "神奈川県" },
  { id: 6, name: "常磐台高校", pref: "埼玉県" },
  { id: 7, name: "駿河台学園高校", pref: "静岡県" },
  { id: 8, name: "清流学園高校", pref: "長野県" },
  { id: 9, name: "桜丘学院高校", pref: "東京都" },
  { id: 10, name: "北陽学園高校", pref: "千葉県" },
  { id: 11, name: "港南高校", pref: "神奈川県" },
  { id: 12, name: "緑丘学園高校", pref: "東京都" },
  { id: 13, name: "双葉実業高校", pref: "群馬県" },
  { id: 14, name: "南星学院高校", pref: "愛知県" },
  { id: 15, name: "青葉学園高校", pref: "宮城県" },
  { id: 16, name: "光陵学園高校", pref: "兵庫県" },
  { id: 17, name: "富士見丘学園高校", pref: "福岡県" },
  { id: 18, name: "柏台高校", pref: "千葉県" },
  { id: 19, name: "榛名学園高校", pref: "群馬県" },
  { id: 20, name: "汐見台高校", pref: "神奈川県" },
];

/* ---------------- 大会テンプレート（m=男子 / w=女子） ---------------- */
const MEETS = {
  m_rec04: { name: "関東学生記録会（4月）", m: 4, d: 9, loc: "相模原ギオンスタジアム", kind: "record" },
  m_kanto: { name: "関東学生対校選手権（関東インカレ）", m: 5, d: 12, loc: "国立競技場", kind: "univ" },
  m_jp: { name: "日本選手権", m: 6, d: 9, loc: "ヤンマースタジアム長居", kind: "champ" },
  m_hokuren: { name: "ホクレン・ディスタンスチャレンジ", m: 7, d: 9, loc: "千歳青葉陸上競技場", kind: "dist" },
  m_rec08: { name: "関東学生記録会（8月）", m: 8, d: 20, loc: "駒沢オリンピック公園総合運動場", kind: "record" },
  m_inter: { name: "日本学生対校選手権（日本インカレ）", m: 9, d: 8, loc: "えがお健康スタジアム", kind: "univ" },
  m_rec10: { name: "関東学生記録会（10月）", m: 10, d: 15, loc: "駒沢オリンピック公園総合運動場", kind: "record" },
  m_yosen: { name: "箱根駅伝予選会", m: 10, d: 19, loc: "陸上自衛隊立川駐屯地", kind: "half" },
  m_rec11: { name: "関東学生記録会（11月）", m: 11, d: 12, loc: "駒沢オリンピック公園総合運動場", kind: "record" },
  m_nit: { name: "日体大長距離記録会", m: 11, d: 28, loc: "日本体育大学健志台", kind: "record" },
  m_marugame: { name: "香川丸亀国際ハーフマラソン", m: 2, d: 5, loc: "香川県立丸亀競技場", kind: "half" },
  m_osaka: { name: "大阪マラソン", m: 2, d: 25, loc: "大阪城公園", kind: "marathon" },
  w_rec04: { name: "関東女子学生記録会（4月）", m: 4, d: 9, loc: "相模原ギオンスタジアム", kind: "record" },
  w_kanto: { name: "関東学生対校選手権（女子）", m: 5, d: 12, loc: "国立競技場", kind: "univ" },
  w_jp: { name: "日本選手権", m: 6, d: 9, loc: "ヤンマースタジアム長居", kind: "champ" },
  w_rec07: { name: "記録会（7月）", m: 7, d: 13, loc: "駒沢オリンピック公園総合運動場", kind: "record" },
  w_inter: { name: "日本学生対校選手権（女子）", m: 9, d: 8, loc: "えがお健康スタジアム", kind: "univ" },
  w_rec10: { name: "記録会（10月）", m: 10, d: 15, loc: "駒沢オリンピック公園総合運動場", kind: "record" },
  w_rec11: { name: "記録会（11月）", m: 11, d: 12, loc: "駒沢オリンピック公園総合運動場", kind: "record" },
  w_marugame: { name: "香川丸亀国際ハーフマラソン", m: 2, d: 5, loc: "香川県立丸亀競技場", kind: "half" },
};

const ITEM_MEETS = {
  fifteen_1500m: ["rec04", "kanto", "jp", "hokuren", "inter"],
  three_3000m: ["rec04", "kanto", "jp", "rec07", "inter", "rec10", "rec11"],
  five_5000m: ["rec04", "kanto", "jp", "hokuren", "rec08", "inter", "rec10", "rec11", "nit"],
  ten_10000m: ["rec04", "kanto", "jp", "hokuren", "rec08", "inter", "rec10", "rec11", "nit"],
  half_marathon: ["yosen", "marugame"],
  marathon: ["osaka"],
};

const STEP = {
  fifteen_1500m: 3.5, three_3000m: 7, five_5000m: 12,
  ten_10000m: 25, half_marathon: 75, marathon: 150,
};

/* ---------------- 選手定義 ----------------
 * n=名前, k=かな, e=英語, s=性別, y=入学年, h=高校id, st=状態, pos=役職, ld=退部日,
 * p=pbs: i=種目, t=記録, m=大会キー, y=樹立年（高校時代のPBは入学前の年）
 */
const STUDENT_DEFS = [
  // ---- 2020年入学（OB） ----
  { id: 1, n: "佐々木 翔", k: "ささき しょう", e: "Sasaki Sho", s: "男", y: 2020, h: 1, p: [
    { i: "five_5000m", t: "13:21.85", m: "nit", y: 2022 },
    { i: "ten_10000m", t: "27:52.31", m: "rec08", y: 2023 },
    { i: "half_marathon", t: "1:02:15", m: "yosen", y: 2022 },
    { i: "marathon", t: "2:09:48", m: "osaka", y: 2024 },
  ] },
  { id: 2, n: "中村 大和", k: "なかむら やまと", e: "Nakamura Yamato", s: "男", y: 2020, h: 2, p: [
    { i: "five_5000m", t: "13:30.21", m: "rec11", y: 2022 },
    { i: "ten_10000m", t: "28:05.44", m: "nit", y: 2022 },
    { i: "half_marathon", t: "1:03:12", m: "marugame", y: 2023 },
  ] },
  { id: 3, n: "吉野 洸", k: "よしの ひろ", e: "Yoshino Hiro", s: "男", y: 2020, h: 3, p: [
    { i: "five_5000m", t: "13:28.76", m: "rec10", y: 2022 },
    { i: "ten_10000m", t: "27:58.90", m: "inter", y: 2022 },
    { i: "half_marathon", t: "1:02:50", m: "yosen", y: 2022 },
  ] },
  // ---- 2021年入学（OB） ----
  { id: 4, n: "小林 航平", k: "こばやし こうへい", e: "Kobayashi Kohei", s: "男", y: 2021, h: 1, p: [
    { i: "five_5000m", t: "13:19.58", m: "nit", y: 2023 },
    { i: "ten_10000m", t: "27:41.23", m: "rec08", y: 2023 },
    { i: "half_marathon", t: "1:01:42", m: "yosen", y: 2023 },
    { i: "marathon", t: "2:08:11", m: "osaka", y: 2025 },
  ] },
  { id: 5, n: "石川 隼人", k: "いしかわ はやと", e: "Ishikawa Hayato", s: "男", y: 2021, h: 5, p: [
    { i: "five_5000m", t: "13:25.10", m: "rec11", y: 2022 },
    { i: "ten_10000m", t: "28:00.74", m: "inter", y: 2023 },
    { i: "half_marathon", t: "1:02:33", m: "marugame", y: 2024 },
  ] },
  { id: 6, n: "三浦 樹", k: "みうら いつき", e: "Miura Itsuki", s: "男", y: 2021, h: 4, p: [
    { i: "five_5000m", t: "13:31.44", m: "hokuren", y: 2023 },
    { i: "ten_10000m", t: "28:12.05", m: "rec10", y: 2023 },
    { i: "half_marathon", t: "1:03:05", m: "yosen", y: 2023 },
  ] },
  { id: 7, n: "松田 直樹", k: "まつだ なおき", e: "Matsuda Naoki", s: "男", y: 2021, h: 6, p: [
    { i: "five_5000m", t: "13:36.87", m: "nit", y: 2022 },
    { i: "ten_10000m", t: "28:18.66", m: "rec08", y: 2023 },
    { i: "half_marathon", t: "1:03:41", m: "marugame", y: 2023 },
  ] },
  { id: 8, n: "藤井 健太", k: "ふじい けんた", e: "Fujii Kenta", s: "男", y: 2021, h: 7, p: [
    { i: "five_5000m", t: "13:33.29", m: "inter", y: 2022 },
    { i: "ten_10000m", t: "28:09.12", m: "nit", y: 2022 },
    { i: "half_marathon", t: "1:03:28", m: "yosen", y: 2022 },
  ] },
  // ---- 2022年入学（OB・2026年3月卒業） ----
  { id: 9, n: "山本 蓮", k: "やまもと れん", e: "Yamamoto Ren", s: "男", y: 2022, h: 8, p: [
    { i: "five_5000m", t: "13:26.73", m: "nit", y: 2024 },
    { i: "ten_10000m", t: "27:48.55", m: "rec08", y: 2024 },
    { i: "half_marathon", t: "1:01:58", m: "yosen", y: 2024 },
  ] },
  { id: 10, n: "高橋 悠真", k: "たかはし ゆうま", e: "Takahashi Yuma", s: "男", y: 2022, h: 9, p: [
    { i: "five_5000m", t: "13:34.20", m: "rec11", y: 2023 },
    { i: "ten_10000m", t: "28:06.31", m: "inter", y: 2024 },
    { i: "half_marathon", t: "1:02:48", m: "marugame", y: 2025 },
  ] },
  { id: 11, n: "鈴木 拓海", k: "すずき たくみ", e: "Suzuki Takumi", s: "男", y: 2022, h: 10, p: [
    { i: "five_5000m", t: "13:39.55", m: "hokuren", y: 2024 },
    { i: "ten_10000m", t: "28:15.20", m: "nit", y: 2024 },
    { i: "half_marathon", t: "1:03:15", m: "yosen", y: 2024 },
  ] },
  { id: 12, n: "渡辺 颯", k: "わたなべ はやて", e: "Watanabe Hayate", s: "男", y: 2022, h: 11, p: [
    { i: "five_5000m", t: "13:42.11", m: "rec10", y: 2023 },
    { i: "ten_10000m", t: "28:22.47", m: "rec08", y: 2024 },
    { i: "half_marathon", t: "1:03:52", m: "marugame", y: 2024 },
  ] },
  { id: 13, n: "伊藤 陸", k: "いとう りく", e: "Ito Riku", s: "男", y: 2022, h: 12, p: [
    { i: "fifteen_1500m", t: "3:45.12", m: "hokuren", y: 2023 },
    { i: "five_5000m", t: "13:47.33", m: "rec11", y: 2023 },
    { i: "ten_10000m", t: "28:35.90", m: "inter", y: 2024 },
  ] },
  { id: 14, n: "木村 悠人", k: "きむら ゆうと", e: "Kimura Yuto", s: "男", y: 2022, h: 13, p: [
    { i: "five_5000m", t: "13:51.02", m: "nit", y: 2023 },
    { i: "ten_10000m", t: "28:44.37", m: "rec08", y: 2024 },
    { i: "half_marathon", t: "1:04:25", m: "yosen", y: 2023 },
  ] },
  // ---- 2023年入学（現4年） ----
  { id: 15, n: "佐藤 蒼真", k: "さとう そうま", e: "Sato Soma", s: "男", y: 2023, h: 1, pos: "main", p: [
    { i: "five_5000m", t: "13:24.66", m: "nit", y: 2025 },
    { i: "ten_10000m", t: "27:44.18", m: "rec08", y: 2025 },
    { i: "half_marathon", t: "1:01:35", m: "yosen", y: 2025 },
  ] },
  { id: 16, n: "田中 陽翔", k: "たなか はると", e: "Tanaka Haruto", s: "男", y: 2023, h: 5, pos: "sub_main", p: [
    { i: "five_5000m", t: "13:29.87", m: "rec11", y: 2024 },
    { i: "ten_10000m", t: "27:56.44", m: "nit", y: 2025 },
    { i: "half_marathon", t: "1:02:05", m: "marugame", y: 2026 },
  ] },
  { id: 17, n: "加藤 湊", k: "かとう みなと", e: "Kato Minato", s: "男", y: 2023, h: 14, p: [
    { i: "five_5000m", t: "13:35.28", m: "hokuren", y: 2025 },
    { i: "ten_10000m", t: "28:09.72", m: "inter", y: 2024 },
    { i: "half_marathon", t: "1:02:44", m: "yosen", y: 2024 },
  ] },
  { id: 18, n: "井上 湊斗", k: "いのうえ みなと", e: "Inoue Minato", s: "男", y: 2023, h: 15, pos: "leader", p: [
    { i: "fifteen_1500m", t: "3:46.85", m: "hokuren", y: 2024 },
    { i: "five_5000m", t: "13:40.19", m: "nit", y: 2024 },
    { i: "ten_10000m", t: "28:18.33", m: "rec08", y: 2025 },
  ] },
  { id: 19, n: "小野 樹生", k: "おの たつき", e: "Ono Tatsuki", s: "男", y: 2023, h: 16, p: [
    { i: "five_5000m", t: "13:44.52", m: "rec10", y: 2024 },
    { i: "ten_10000m", t: "28:27.96", m: "nit", y: 2025 },
    { i: "half_marathon", t: "1:03:36", m: "yosen", y: 2025 },
  ] },
  { id: 20, n: "山口 廉", k: "やまぐち れん", e: "Yamaguchi Ren", s: "男", y: 2023, h: 17, st: "withdraw", ld: "2025-04-01", p: [
    { i: "five_5000m", t: "13:48.90", m: "rec11", y: 2024 },
    { i: "ten_10000m", t: "28:39.12", m: "rec08", y: 2024 },
  ] },
  // ---- 2024年入学（現3年） ----
  { id: 21, n: "林 颯太", k: "はやし そうた", e: "Hayashi Sota", s: "男", y: 2024, h: 1, p: [
    { i: "five_5000m", t: "13:25.92", m: "inter", y: 2026 },
    { i: "ten_10000m", t: "27:50.66", m: "rec08", y: 2026 },
    { i: "half_marathon", t: "1:01:49", m: "marugame", y: 2026 },
  ] },
  { id: 22, n: "森 悠雅", k: "もり ゆうが", e: "Mori Yuga", s: "男", y: 2024, h: 2, p: [
    { i: "five_5000m", t: "13:31.78", m: "nit", y: 2025 },
    { i: "ten_10000m", t: "28:02.15", m: "rec08", y: 2025 },
    { i: "half_marathon", t: "1:02:20", m: "yosen", y: 2025 },
  ] },
  { id: 23, n: "原田 凌", k: "はらだ りょう", e: "Harada Ryo", s: "男", y: 2024, h: 3, p: [
    { i: "five_5000m", t: "13:37.24", m: "hokuren", y: 2025 },
    { i: "ten_10000m", t: "28:11.48", m: "nit", y: 2025 },
    { i: "half_marathon", t: "1:02:58", m: "marugame", y: 2026 },
  ] },
  { id: 24, n: "岡田 岳", k: "おかだ がく", e: "Okada Gaku", s: "男", y: 2024, h: 4, p: [
    { i: "five_5000m", t: "13:42.75", m: "rec11", y: 2025 },
    { i: "ten_10000m", t: "28:21.09", m: "inter", y: 2025 },
    { i: "half_marathon", t: "1:03:27", m: "yosen", y: 2025 },
  ] },
  { id: 25, n: "川村 光希", k: "かわむら こうき", e: "Kawamura Koki", s: "男", y: 2024, h: 11, st: "withdraw", ld: "2026-07-01", p: [
    { i: "fifteen_1500m", t: "3:47.30", m: "hokuren", y: 2025 },
    { i: "five_5000m", t: "13:46.18", m: "nit", y: 2025 },
    { i: "ten_10000m", t: "28:33.54", m: "rec08", y: 2025 },
  ] },
  { id: 26, n: "岩田 碧", k: "いわた あお", e: "Iwata Ao", s: "男", y: 2024, h: 6, p: [
    { i: "five_5000m", t: "13:50.32", m: "rec10", y: 2024 },
    { i: "ten_10000m", t: "28:41.87", m: "inter", y: 2025 },
    { i: "half_marathon", t: "1:04:12", m: "yosen", y: 2024 },
  ] },
  // ---- 2025年入学（現2年） ----
  { id: 27, n: "野村 誠", k: "のむら まこと", e: "Nomura Makoto", s: "男", y: 2025, h: 1, p: [
    { i: "five_5000m", t: "13:29.14", m: "rec11", y: 2025 },
    { i: "ten_10000m", t: "28:01.23", m: "rec08", y: 2026 },
  ] },
  { id: 28, n: "平野 大地", k: "ひらの だいち", e: "Hirano Daichi", s: "男", y: 2025, h: 5, p: [
    { i: "five_5000m", t: "13:33.86", m: "nit", y: 2025 },
    { i: "ten_10000m", t: "28:10.77", m: "hokuren", y: 2026 },
    { i: "half_marathon", t: "1:03:02", m: "marugame", y: 2026 },
  ] },
  { id: 29, n: "藤本 奏", k: "ふじもと かなで", e: "Fujimoto Kanade", s: "男", y: 2025, h: 8, p: [
    { i: "five_5000m", t: "13:38.42", m: "inter", y: 2026 },
    { i: "ten_10000m", t: "28:17.95", m: "rec08", y: 2026 },
  ] },
  { id: 30, n: "大西 修平", k: "おおにし しゅうへい", e: "Onishi Shuhei", s: "男", y: 2025, h: 10, p: [
    { i: "five_5000m", t: "13:43.67", m: "hokuren", y: 2026 },
    { i: "ten_10000m", t: "28:26.41", m: "nit", y: 2025 },
    { i: "half_marathon", t: "1:03:48", m: "yosen", y: 2025 },
  ] },
  { id: 31, n: "安藤 快", k: "あんどう かい", e: "Ando Kai", s: "男", y: 2025, h: 9, p: [
    { i: "fifteen_1500m", t: "3:48.12", m: "hokuren", y: 2025 },
    { i: "five_5000m", t: "13:47.55", m: "rec10", y: 2025 },
    { i: "ten_10000m", t: "28:38.20", m: "rec08", y: 2026 },
  ] },
  { id: 32, n: "前田 蒼", k: "まえだ あおい", e: "Maeda Aoi", s: "男", y: 2025, h: 17, p: [
    { i: "five_5000m", t: "13:52.30", m: "rec11", y: 2025 },
    { i: "ten_10000m", t: "28:47.16", m: "inter", y: 2026 },
  ] },
  // ---- 2026年入学（現1年・PBは高校時代） ----
  { id: 33, n: "西村 翼", k: "にしむら つばさ", e: "Nishimura Tsubasa", s: "男", y: 2026, h: 1, p: [
    { i: "five_5000m", t: "13:45.23", m: "rec08", y: 2025 },
    { i: "fifteen_1500m", t: "3:49.02", m: "inter", y: 2025 },
  ] },
  { id: 34, n: "古川 慧", k: "ふるかわ けい", e: "Furukawa Kei", s: "男", y: 2026, h: 14, p: [
    { i: "five_5000m", t: "13:50.11", m: "nit", y: 2025 },
    { i: "ten_10000m", t: "28:52.30", m: "rec08", y: 2025 },
  ] },
  { id: 35, n: "松本 晴", k: "まつもと はる", e: "Matsumoto Haru", s: "男", y: 2026, h: 15, p: [
    { i: "five_5000m", t: "13:55.48", m: "rec10", y: 2025 },
    { i: "fifteen_1500m", t: "3:50.55", m: "hokuren", y: 2025 },
  ] },
  { id: 36, n: "池田 大翔", k: "いけだ ひろと", e: "Ikeda Hiroto", s: "男", y: 2026, h: 16, p: [
    { i: "five_5000m", t: "13:58.92", m: "rec11", y: 2025 },
  ] },

  // ---- 女子 ----
  // 2022年入学（OB）
  { id: 37, n: "山田 美咲", k: "やまだ みさき", e: "Yamada Misaki", s: "女", y: 2022, h: 9, p: [
    { i: "fifteen_1500m", t: "4:27.15", m: "jp", y: 2024 },
    { i: "three_3000m", t: "9:22.40", m: "rec07", y: 2024 },
    { i: "five_5000m", t: "15:58.66", m: "rec11", y: 2023 },
  ] },
  { id: 38, n: "佐伯 結衣", k: "さえき ゆい", e: "Saeki Yui", s: "女", y: 2022, h: 3, p: [
    { i: "fifteen_1500m", t: "4:31.02", m: "inter", y: 2023 },
    { i: "five_5000m", t: "16:12.45", m: "rec10", y: 2023 },
    { i: "ten_10000m", t: "33:48.12", m: "rec11", y: 2024 },
  ] },
  { id: 39, n: "大塚 凛", k: "おおつか りん", e: "Otsuka Rin", s: "女", y: 2022, h: 8, p: [
    { i: "three_3000m", t: "9:35.78", m: "rec07", y: 2024 },
    { i: "five_5000m", t: "16:20.33", m: "kanto", y: 2023 },
    { i: "half_marathon", t: "1:14:22", m: "marugame", y: 2025 },
  ] },
  // 2023年入学（現4年）
  { id: 40, n: "高橋 琴音", k: "たかはし ことね", e: "Takahashi Kotone", s: "女", y: 2023, h: 1, pos: "main", p: [
    { i: "fifteen_1500m", t: "4:24.58", m: "jp", y: 2025 },
    { i: "three_3000m", t: "9:18.12", m: "rec07", y: 2025 },
    { i: "five_5000m", t: "15:52.30", m: "rec11", y: 2025 },
  ] },
  { id: 41, n: "中島 花音", k: "なかじま かのん", e: "Nakajima Kanon", s: "女", y: 2023, h: 5, p: [
    { i: "fifteen_1500m", t: "4:29.71", m: "inter", y: 2024 },
    { i: "five_5000m", t: "16:05.84", m: "rec11", y: 2024 },
    { i: "ten_10000m", t: "33:29.60", m: "rec11", y: 2025 },
  ] },
  { id: 42, n: "石田 彩", k: "いしだ あや", e: "Ishida Aya", s: "女", y: 2023, h: 11, p: [
    { i: "three_3000m", t: "9:28.45", m: "rec07", y: 2024 },
    { i: "five_5000m", t: "16:15.22", m: "kanto", y: 2025 },
    { i: "half_marathon", t: "1:13:38", m: "marugame", y: 2026 },
  ] },
  // 2024年入学（現3年）
  { id: 43, n: "加藤 菜々", k: "かとう なな", e: "Kato Nana", s: "女", y: 2024, h: 1, p: [
    { i: "fifteen_1500m", t: "4:26.93", m: "jp", y: 2026 },
    { i: "three_3000m", t: "9:20.66", m: "rec07", y: 2025 },
    { i: "five_5000m", t: "15:56.10", m: "rec11", y: 2025 },
  ] },
  { id: 44, n: "森田 ひなた", k: "もりた ひなた", e: "Morita Hinata", s: "女", y: 2024, h: 10, p: [
    { i: "fifteen_1500m", t: "4:32.40", m: "inter", y: 2025 },
    { i: "five_5000m", t: "16:09.35", m: "rec10", y: 2025 },
    { i: "ten_10000m", t: "33:41.27", m: "rec11", y: 2025 },
  ] },
  { id: 45, n: "吉田 葵", k: "よしだ あおい", e: "Yoshida Aoi", s: "女", y: 2024, h: 6, p: [
    { i: "three_3000m", t: "9:33.62", m: "rec07", y: 2025 },
    { i: "five_5000m", t: "16:18.77", m: "kanto", y: 2026 },
    { i: "half_marathon", t: "1:14:55", m: "marugame", y: 2026 },
  ] },
  // 2025年入学（現2年）
  { id: 46, n: "田村 杏", k: "たむら あん", e: "Tamura An", s: "女", y: 2025, h: 9, p: [
    { i: "fifteen_1500m", t: "4:30.15", m: "inter", y: 2026 },
    { i: "three_3000m", t: "9:25.31", m: "rec07", y: 2026 },
    { i: "five_5000m", t: "16:02.48", m: "rec11", y: 2025 },
  ] },
  { id: 47, n: "小松 澪", k: "こまつ みお", e: "Komatsu Mio", s: "女", y: 2025, h: 14, p: [
    { i: "three_3000m", t: "9:38.90", m: "rec07", y: 2025 },
    { i: "five_5000m", t: "16:11.76", m: "rec10", y: 2025 },
    { i: "ten_10000m", t: "33:52.44", m: "rec11", y: 2025 },
  ] },
  // 2026年入学（現1年・PBは高校時代）
  { id: 48, n: "上野 愛", k: "うえの あい", e: "Ueno Ai", s: "女", y: 2026, h: 1, p: [
    { i: "fifteen_1500m", t: "4:28.77", m: "inter", y: 2025 },
    { i: "three_3000m", t: "9:30.14", m: "rec07", y: 2025 },
  ] },
  { id: 49, n: "藤田 心", k: "ふじた こころ", e: "Fujita Kokoro", s: "女", y: 2026, h: 8, p: [
    { i: "fifteen_1500m", t: "4:33.52", m: "jp", y: 2025 },
    { i: "five_5000m", t: "16:14.39", m: "rec11", y: 2025 },
  ] },
];

/* ---------------- 三大駅伝 ---------------- */
const EKIDEN_ITEMS = [
  { id: 1, name: "出雲駅伝", legs: 6, dist: [8.0, 5.8, 8.5, 6.2, 6.4, 10.2] },
  { id: 2, name: "全日本大学駅伝", legs: 8, dist: [9.5, 11.1, 13.4, 12.8, 13.6, 13.9, 12.8, 19.7] },
  { id: 3, name: "箱根駅伝", legs: 10, dist: [21.3, 23.1, 21.4, 20.9, 20.8, 20.8, 21.3, 21.4, 23.1, 23.0] },
];

/* legs: [選手id, タイム, 区間順位, remark?] */
const EKIDEN_ROUNDS = [
  { item: 1, round: "第35回", date: "2023-10-09", rank: 2, legs: [
    [9, "23:45", 3], [15, "16:48", 1, "区間賞"], [10, "24:58", 2], [16, "18:20", 2], [11, "19:02", 1, "区間賞"], [17, "30:31", 4],
  ] },
  { item: 2, round: "第55回", date: "2023-11-05", rank: 2, legs: [
    [9, "27:42", 5], [10, "32:18", 3], [11, "39:02", 4], [15, "37:05", 1, "区間賞"], [16, "39:38", 2], [17, "40:31", 4], [12, "37:28", 6], [18, "57:46", 2],
  ] },
  { item: 3, round: "第100回", date: "2024-01-02", rank: 2, legs: [
    [4, "1:01:52", 4], [5, "1:07:35", 3], [6, "1:03:02", 5], [9, "1:01:24", 1, "区間賞"], [10, "1:11:28", 2],
    [11, "59:02", 2], [12, "1:04:18", 4], [15, "1:04:45", 2], [16, "1:08:22", 3], [17, "1:08:48", 3],
  ] },
  { item: 1, round: "第36回", date: "2024-10-14", rank: 1, legs: [
    [15, "23:28", 1, "区間賞"], [9, "16:52", 3], [21, "24:41", 1, "区間賞"], [16, "18:12", 1, "区間賞"], [22, "18:55", 2], [10, "30:18", 2],
  ] },
  { item: 2, round: "第56回", date: "2024-11-03", rank: 3, legs: [
    [15, "27:18", 1, "区間賞"], [9, "32:22", 5], [21, "38:44", 2], [16, "37:18", 3], [22, "39:52", 4], [10, "40:44", 5], [23, "37:36", 4], [18, "58:18", 3],
  ] },
  { item: 3, round: "第101回", date: "2025-01-02", rank: 1, legs: [
    [15, "1:01:18", 1, "区間賞"], [9, "1:07:02", 2], [21, "1:02:44", 1, "区間賞"], [5, "1:01:36", 3], [6, "1:10:44", 1, "区間賞"],
    [10, "58:42", 1, "区間賞"], [11, "1:03:55", 2], [16, "1:04:12", 1, "区間賞"], [22, "1:08:05", 1, "区間賞"], [12, "1:08:34", 2],
  ] },
  { item: 1, round: "第37回", date: "2025-10-13", rank: 1, legs: [
    [21, "23:19", 1, "区間賞"], [27, "16:44", 2], [15, "24:33", 1, "区間賞"], [22, "18:08", 1, "区間賞"], [16, "18:50", 1, "区間賞"], [23, "30:05", 1, "区間賞"],
  ] },
  { item: 2, round: "第57回", date: "2025-11-02", rank: 1, legs: [
    [21, "27:05", 1, "区間賞"], [27, "32:05", 2], [15, "38:28", 1, "区間賞"], [22, "36:58", 1, "区間賞"], [16, "39:25", 1, "区間賞"], [28, "40:15", 2], [23, "37:02", 1, "区間賞"], [18, "57:27", 1, "区間賞"],
  ] },
  { item: 3, round: "第102回", date: "2026-01-02", rank: 1, legs: [
    [9, "1:01:05", 1, "区間賞"], [15, "1:06:18", 1, "区間賞", "区間新"], [27, "1:02:36", 1, "区間賞"], [21, "1:01:15", 1, "区間賞"], [10, "1:11:02", 2],
    [16, "58:38", 1, "区間賞"], [22, "1:03:47", 1, "区間賞"], [18, "1:04:28", 2], [28, "1:08:14", 1, "区間賞"], [17, "1:08:15", 2],
  ] },
];

/* ---------------- 生成 ---------------- */
const MAX_DATE = "2026-10-06";
const CURRENT_AY = 2026;

function meetDate(key, ay) {
  const tpl = MEETS[key];
  const y = tpl.m >= 4 ? ay : ay + 1;
  return `${y}-${String(tpl.m).padStart(2, "0")}-${String(tpl.d).padStart(2, "0")}`;
}

function build() {
  const students = [];
  const records = [];
  const competitions = [];
  const compMap = new Map();
  let recId = 1, compId = 1;

  const getComp = (key, date) => {
    const tpl = MEETS[key];
    const ck = key + "|" + date;
    if (!compMap.has(ck)) {
      compMap.set(ck, "c" + compId);
      competitions.push({ id: "c" + compId, name: tpl.name, date, location: tpl.loc, kind: tpl.kind });
      compId++;
    }
    return compMap.get(ck);
  };

  const pushRec = (r) => {
    r.id = recId++;
    records.push(r);
  };

  const mkRec = (def, pb, date, sec, rng, remark, isPB) => {
    let rank = null, isFinished = true, score = fmt(sec);
    if (!isPB && rng() < 0.05) {
      isFinished = false; rank = null; score = null; remark = "DNF";
    } else if (!isPB && rng() < 0.10) {
      rank = null;
    } else {
      const p = rng();
      rank = isPB ? 1 + Math.floor(rng() * 6) : (p < 0.6 ? 1 + Math.floor(rng() * 8) : 9 + Math.floor(rng() * 40));
    }
    return {
      studentId: def.id, competitionId: getComp((def.s === "男" ? "m_" : "w_") + pb.m, date),
      item: pb.i, score, seconds: score != null ? parseScore(score) : null,
      date, rank, isFinished, remark,
    };
  };

  for (const def of STUDENT_DEFS) {
    const st = {
      id: def.id, name: def.n, kana: def.k, en: def.e, sex: def.s,
      enrollmentYear: def.y, graduationYear: def.y + 4,
      highSchoolId: def.h, status: def.st || "player", position: def.pos || "none",
      leftDate: def.ld || null,
    };
    students.push(st);

    const rng = mulberry32(def.id * 7919 + 13);
    const maxSeason = Math.min(4, CURRENT_AY - def.y + 1);
    const leftDate = def.ld || null;
    const sexKey = def.s === "男" ? "m_" : "w_";

    for (const pb of def.p) {
      const pbKey = sexKey + pb.m;
      const pbDate = `${pb.y}-${String(MEETS[pbKey].m).padStart(2, "0")}-${String(MEETS[pbKey].d).padStart(2, "0")}`;
      const pbSec = parseScore(pb.t);
      const pbSeason = academicYear(pbDate) - def.y + 1;
      const step = STEP[pb.i];
      const baseKeys = ITEM_MEETS[pb.i] || [];

      for (let s = 1; s <= maxSeason; s++) {
        const from = `${def.y + s - 1}-04-01`;
        const to = `${def.y + s}-03-31`;
        const seasonMeets = baseKeys
          .map((k) => sexKey + k)
          .filter((k) => MEETS[k])
          .map((k) => ({ k, date: meetDate(k, def.y + s - 1) }))
          .filter((x) => x.date >= from && x.date <= to
            && x.date <= MAX_DATE && (!leftDate || x.date < leftDate));

        if (s === pbSeason && pbDate >= from && pbDate <= to
          && pbDate <= MAX_DATE && (!leftDate || pbDate < leftDate)) {
          pushRec(mkRec(def, pb, pbDate, pbSec, rng, "PB", true));
        }
        const pool = s === pbSeason ? seasonMeets.filter((x) => x.date < pbDate) : seasonMeets;
        const n = s === pbSeason ? 1 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 2);
        let count = 0;
        for (const x of pool) {
          if (count >= n) break;
          if (s === pbSeason && x.date === pbDate) continue;
          const sec = s < pbSeason
            ? pbSec + (pbSeason - s) * step * (0.7 + rng() * 0.6)
            : pbSec + step * (0.08 + rng() * 0.45);
          pushRec(mkRec(def, pb, x.date, sec, rng, null, false));
          count++;
        }
      }
      // 高校時代のPB（入学前に樹立）は大会不明として1件だけ残す
      if (pbSeason <= 0) {
        const r = mkRec(def, pb, pbDate, pbSec, rng, null, true);
        r.competitionId = null;
        r.competitionName = "高校時代";
        r.rank = null;
        pushRec(r);
      }
    }
  }

  // 駅伝
  const ekidenRounds = [];
  const ekidenRecords = [];
  let ekId = 1, ekRecId = 1;
  for (const round of EKIDEN_ROUNDS) {
    const item = EKIDEN_ITEMS.find((x) => x.id === round.item);
    const total = round.legs.reduce((acc, l) => acc + parseScore(l[1]), 0);
    const rid = "e" + ekId++;
    ekidenRounds.push({
      id: rid, ekidenItemId: round.item, round: round.round,
      date: round.date, teamRank: round.rank, time: fmt(total),
    });
    round.legs.forEach((leg, i) => {
      const [sid, score, legRank, remark] = leg;
      const extra = Array.isArray(remark) ? remark : (remark ? [remark] : []);
      ekidenRecords.push({
        id: ekRecId++, studentId: sid, ekidenRoundId: rid,
        interval: i + 1, distance: item.dist[i],
        score, seconds: parseScore(score), date: round.date,
        intervalRank: legRank, remark: extra.join(" "),
      });
    });
  }

  return {
    meta: { generatedAt: "2026-10-06T10:00:00+09:00", source: "demo" },
    students,
    schools: SCHOOLS,
    staff: [],
    competitions,
    records,
    ekidenItems: EKIDEN_ITEMS,
    ekidenRounds,
    ekidenRecords,
    teams: [],
  };
}

window.AGU_DATA = build();
})();
