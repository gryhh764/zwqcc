(function () {
/**
 * 数据层：基于 data/data.js 的静态数据提供「时点查询」等派生计算。
 * 全部在浏览器端完成，服务端零计算。
 */
const DATA = window.AGU_DATA;
const { t, onLang } = window.AGUi18n;

const ITEM_LABELS = {
  fifteen_1500m: "1500m",
  three_3000m: "3000m",
  five_5000m: "5000m",
  ten_10000m: "10000m",
  half_marathon: "ハーフマラソン",
  marathon: "マラソン",
  three_3000sc: "3000mSC",
  eight_800m: "800m",
  one_mile: "1マイル",
  two_mile: "2マイル",
  ten_mile: "10マイル",
  cross_country: "クロスカントリー",
  five_km: "ロード5km",
  ten_km: "ロード10km",
  twenty_km: "ロード20km",
  eight_km: "8km",
  fifteen_km: "15km",
  twenty_three_five_km: "23.5km",
  thirty_km: "30km",
};

const ITEM_ORDER = [
  "eight_800m", "fifteen_1500m", "one_mile", "three_3000m", "three_3000sc",
  "five_5000m", "five_km", "ten_10000m", "ten_km", "fifteen_km",
  "twenty_km", "twenty_three_five_km", "half_marathon", "thirty_km", "marathon", "two_mile", "eight_km",
  "ten_mile", "cross_country",
];

function parseScore(raw) {
  if (raw == null) return null;
  const s = String(raw).trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[:：]+$/, "");
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = m[3] != null ? Number(m[3]) : null;
  const frac = m[4] != null ? Number("0." + m[4]) : 0;
  return (c != null ? a * 3600 + b * 60 + c : a * 60 + b) + frac;
}

function formatScore(sec, withFraction = true) {
  if (sec == null || !Number.isFinite(sec)) return "—";
  const h = Math.floor(sec / 3600);
  const rest = sec - h * 3600;
  const m = Math.floor(rest / 60);
  const s = rest - m * 60;
  const ss = Math.floor(s);
  const cs = Math.round((s - ss) * 100);
  const frac = withFraction ? "." + String(cs).padStart(2, "0") : "";
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return (h ? h + ":" : "") + mm + ":" + String(ss).padStart(2, "0") + frac;
}

function scoreText(rec) {
  if (!rec) return "—";
  const raw = rec.score;
  if (raw == null) return rec.seconds == null ? "—" : formatScore(rec.seconds, false);
  const hasFraction = /\.\d{1,3}\s*$/.test(String(raw));
  return formatScore(rec.seconds, hasFraction);
}

function formatDiff(sec) {
  if (sec == null || !Number.isFinite(sec)) return "—";
  return (sec > 0 ? "+" : sec < 0 ? "−" : "±") + Math.abs(sec).toFixed(2);
}

function normalizeDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[年月]/g, "-").replace(/日/g, "").replace(/[./]/g, "-");
  const m = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, "0")}-${(m[3] || "1").padStart(2, "0")}`;
}

function toYear(dateStr) {
  return dateStr ? Number(String(dateStr).slice(0, 4)) : null;
}

/** 日本学年度：4月〜翌年3月 */
function academicYear(dateStr) {
  if (!dateStr) return null;
  const y = Number(String(dateStr).slice(0, 4));
  const m = Number(String(dateStr).slice(5, 7));
  if (!y || !m) return null;
  return m >= 4 ? y : y - 1;
}

function currentAcademicYear(now = new Date()) {
  const y = now.getFullYear();
  return now.getMonth() + 1 >= 4 ? y : y - 1;
}

function gradeAtDate(student, date) {
  const y = academicYear(date);
  const en = toYear(student && student.enrollmentYear);
  if (!y || !en) return null;
  const g = y - en + 1;
  return g >= 1 && g <= 4 ? g : null;
}

function seasonRange(ay) {
  return { from: `${ay}-04-01`, to: `${ay + 1}-03-31`, label: `${ay}年度`, year: ay };
}

function currentSeason(now = new Date()) {
  return seasonRange(currentAcademicYear(now));
}

const yearOf = toYear;

function isEnrolledRecord(r, student) {
  if (!student) return true;
  if (r.remark === "高校時代" || r.competitionName === "高校時代") return false;
  const en = yearOf(student.enrollmentYear);
  if (!en || !r.date) return true;
  return r.date >= `${en}-04-01`;
}

function isHighSchoolRecord(r, student) {
  if (!r) return false;
  if (r.remark === "高校時代" || r.competitionName === "高校時代") return true;
  if (!student) return false;
  const en = yearOf(student.enrollmentYear);
  if (!en || !r.date) return false;
  return r.date < `${en}-04-01`;
}

function onlyPersonalBests(list) {
  const best = new Map();
  for (const r of list) {
    if (r.isFinished === false || r.seconds == null) continue;
    const cur = best.get(r.item);
    if (!cur || r.seconds < cur.seconds) best.set(r.item, r);
  }
  return [...best.values()];
}

class Store {
  constructor(raw) {
    this.meta = raw.meta || {};
    this.students = raw.students || [];
    this.schools = raw.schools || [];
    this.staff = raw.staff || [];
    this.competitions = raw.competitions || [];
    this.records = raw.records || [];
    this.ekidenItems = raw.ekidenItems || [];
    this.ekidenRounds = raw.ekidenRounds || [];
    this.ekidenRecords = raw.ekidenRecords || [];
    this.teams = raw.teams || [];

    this.studentById = new Map(this.students.map((s) => [s.id, s]));
    this.schoolById = new Map(this.schools.map((s) => [s.id, s]));
    this.competitionById = new Map(this.competitions.map((c) => [c.id, c]));
    this.ekidenRoundById = new Map(this.ekidenRounds.map((r) => [r.id, r]));
    this.ekidenItemById = new Map(this.ekidenItems.map((i) => [i.id, i]));
    this.teamById = new Map(this.teams.map((t) => [t.id, t]));

    this.recordsByStudent = groupBy(this.records, (r) => r.studentId);
    this.ekidenRecordsByStudent = groupBy(this.ekidenRecords, (r) => r.studentId);
    this.ekidenRecordsByRound = groupBy(this.ekidenRecords, (r) => r.ekidenRoundId);
    this.recordsByCompetition = groupBy(this.records, (r) => r.competitionId);
    for (const list of this.recordsByStudent.values()) sortByDate(list);
    for (const list of this.ekidenRecordsByStudent.values()) {
      list.sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.interval - b.interval);
    }
    for (const list of this.ekidenRecordsByRound.values()) {
      list.sort((a, b) => a.interval - b.interval);
    }
    this.competitionsSorted = [...this.competitions].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    this.ekidenRoundsSorted = [...this.ekidenRounds].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    this.rosterSpan = computeSpan(this.students);
  }

  get generatedAt() { return this.meta.generatedAt || null; }

  student(id) { return this.studentById.get(id) ?? this.studentById.get(Number(id)) ?? null; }

  schoolName(id) {
    const s = this.schoolById.get(id);
    return s ? s.name : null;
  }

  schoolPref(id) {
    const s = this.schoolById.get(id);
    return s ? s.pref : null;
  }

  /** 種目名（item = null は種目なし） */
  itemLabel(key) {
    if (key == null) return t("item.none");
    return ITEM_LABELS[key] || key;
  }

  teamName(id) {
    const t = this.teamById.get(id);
    return t ? t.name : null;
  }

  recordsOf(studentId, { include = "all" } = {}) {
    const s = this.student(studentId);
    let list = this.recordsByStudent.get(studentId) ?? this.recordsByStudent.get(Number(studentId)) ?? [];
    if (include === "enrolled") list = list.filter((r) => isEnrolledRecord(r, s));
    else if (include === "pb") list = onlyPersonalBests(list);
    return list;
  }

  yearBests(studentId, { include = "all" } = {}) {
    const s = this.student(studentId);
    const en = yearOf(s && s.enrollmentYear);
    const out = new Map();
    for (const r of this.recordsOf(studentId, { include })) {
      if (r.isFinished === false || r.seconds == null) continue;
      let grade = 0;
      if (isEnrolledRecord(r, s)) {
        const ay = academicYear(r.date);
        if (ay && en) {
          grade = ay - en + 1;
          if (grade < 1 || grade > 4) continue;
        } else grade = 1;
      }
      const row = out.get(r.item) || {};
      if (!row[grade] || r.seconds < row[grade].seconds) row[grade] = r;
      out.set(r.item, row);
    }
    return out;
  }

  studentsBySex(sex) {
    return this.students.filter((s) => (s.sex || "男") === sex);
  }

  pbAsOf(studentId, item, asOf, { include = "all" } = {}) {
    const list = this.recordsOf(studentId, { include });
    let best = null;
    for (const r of list) {
      if (r.item !== item || r.isFinished === false || r.seconds == null) continue;
      if (asOf && (!r.date || r.date > asOf)) continue;
      if (!best || r.seconds < best.seconds) best = r;
    }
    return best;
  }

  pbHistory(studentId, item, asOf, { include = "all" } = {}) {
    const list = this.recordsOf(studentId, { include })
      .filter((r) => r.item === item && r.isFinished !== false && r.seconds != null)
      .filter((r) => !asOf || (r.date && r.date <= asOf))
      .sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.seconds - b.seconds);
    const out = [];
    let best = Infinity;
    for (const r of list) {
      if (r.seconds < best) {
        best = r.seconds;
        out.push(r);
      }
    }
    return out;
  }

  leaveDate(student) {
    if (!student) return null;
    if (student.leftDate) return String(student.leftDate);
    const gr = yearOf(student.graduationYear);
    if (gr) return `${gr}-04-01`;
    const en = yearOf(student.enrollmentYear);
    return en ? `${en + 4}-04-01` : null;
  }

  isMemberAt(student, date, { ignoreLeaving = false } = {}) {
    if (!student || !date) return false;
    const en = yearOf(student.enrollmentYear);
    if (!en) return false;
    if (String(date) < `${en}-04-01`) return false;
    if (ignoreLeaving) {
      const gr = yearOf(student.graduationYear) || en + 4;
      return String(date) < `${gr}-04-01`;
    }
    const left = this.leaveDate(student);
    return left ? String(date) < left : true;
  }

  isPlayerAt(student, date) {
    if (!this.isMemberAt(student, date)) return false;
    if ((student.status || "player") === "player") return true;
    return !!student.leftDate && String(date) < String(student.leftDate);
  }

  rosterAsOf(date, { includeWithdraw = false, sex = null } = {}) {
    const list = sex ? this.studentsBySex(sex) : this.students;
    if (!academicYear(date)) return list.slice();
    return list.filter((s) => (includeWithdraw
      ? this.isMemberAt(s, date, { ignoreLeaving: true })
      : this.isPlayerAt(s, date)));
  }

  gradeAt(student, date) {
    return gradeAtDate(student, date);
  }

  gradeOfRecord(record, student) {
    if (!record) return null;
    if (isHighSchoolRecord(record, student)) return 0;
    return this.gradeAt(student, record.date);
  }

  /**
   * 时点排名：某日期、某项目的队内 PB 排行。
   */
  rankingAsOf(date, item, { scope = "active", asOf = null, limit = null, include = "all", sex = null } = {}) {
    const ref = asOf || date;
    const pool = scope === "all"
      ? (sex ? this.studentsBySex(sex) : this.students)
      : this.rosterAsOf(date, { sex, includeWithdraw: scope === "member" });
    const rows = [];
    for (const s of pool) {
      const rec = this.pbAsOf(s.id, item, ref, { include });
      if (!rec) continue;
      rows.push({
        student: s,
        seconds: rec.seconds,
        record: rec,
        pbDate: rec.date,
        grade: this.gradeAt(s, date),
      });
    }
    rows.sort((a, b) => a.seconds - b.seconds || (a.pbDate || "").localeCompare(b.pbDate || ""));
    rows.forEach((r, i) => { r.rank = i + 1; });

    if (rows.length && rows.length <= 400) {
      const cache = new Map();
      for (const r of rows) {
        const key = r.pbDate;
        if (!cache.has(key)) {
          const snap = new Map();
          for (const s of pool) {
            const rec = this.pbAsOf(s.id, item, key, { include });
            if (rec) snap.set(s.id, rec.seconds);
          }
          const ordered = [...snap.entries()].sort((a, b) => a[1] - b[1]);
          const ranks = new Map();
          ordered.forEach(([sid], i) => ranks.set(sid, i + 1));
          cache.set(key, ranks);
        }
        r.rankAtPb = cache.get(key).get(r.student.id) ?? null;
      }
    }
    return limit ? rows.slice(0, limit) : rows;
  }

  allTimeRanking(item, { scope = "all", limit = null, sex = null } = {}) {
    return this.rankingAsOf("9999-12-31", item, { scope, limit, sex });
  }

  rankOf(studentId, item, date, scope = "active", include = "all", sex = null) {
    const pool = scope === "all"
      ? (sex ? this.studentsBySex(sex) : this.students)
      : this.rosterAsOf(date, { sex, includeWithdraw: scope === "member" });
    const target = this.pbAsOf(studentId, item, date, { include });
    if (!target) return null;
    let rank = 1;
    for (const s of pool) {
      if (s.id === Number(studentId)) continue;
      const rec = this.pbAsOf(s.id, item, date, { include });
      if (rec && (rec.seconds < target.seconds ||
          (rec.seconds === target.seconds && (rec.date || "") < (target.date || "")))) rank++;
    }
    return rank;
  }

  history(studentId, { include = "all" } = {}) {
    return this.recordsOf(studentId, { include })
      .slice()
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }

  ekidenHistory(studentId) {
    return (this.ekidenRecordsByStudent.get(studentId)
      ?? this.ekidenRecordsByStudent.get(Number(studentId)) ?? []).slice().reverse();
  }

  personalBests(studentId, asOf = null, { include = "all" } = {}) {
    const list = this.recordsOf(studentId, { include });
    const map = new Map();
    for (const r of list) {
      if (r.isFinished === false || r.seconds == null) continue;
      if (asOf && (!r.date || r.date > asOf)) continue;
      const cur = map.get(r.item);
      if (!cur || r.seconds < cur.seconds) map.set(r.item, r);
    }
    return ITEM_ORDER.filter((k) => map.has(k)).map((k) => ({
      item: k, label: ITEM_LABELS[k] || k, record: map.get(k), seconds: map.get(k).seconds,
    }));
  }

  timeline(studentId) {
    return this.recordsOf(studentId)
      .slice()
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }
}

function groupBy(arr, keyFn) {
  const m = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    if (k == null) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

function sortByDate(list) {
  list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

function computeSpan(students) {
  const years = students.map((s) => yearOf(s.enrollmentYear)).filter(Boolean);
  if (!years.length) return { min: null, max: null };
  return { min: Math.min(...years), max: Math.max(...years) + 4 };
}

let _store = null;
async function loadStore() {
  if (_store) return _store;
  _store = new Store(DATA);
  if (_store.meta && _store.meta.source === "demo") {
    let bar = null;
    const insert = () => {
      if (!bar) {
        bar = document.createElement("div");
        bar.className = "demo-banner";
        (document.querySelector("main") || document.body).prepend(bar);
      }
      bar.textContent = t("demo.banner");
    };
    insert();
    onLang(insert);
  }
  return _store;
}

window.AGUStore = {
  Store, loadStore, ITEM_LABELS, ITEM_ORDER,
  parseScore, formatScore, scoreText, formatDiff,
  normalizeDate, toYear, academicYear, currentAcademicYear,
  gradeAtDate, seasonRange, currentSeason, isHighSchoolRecord,
};
})();
