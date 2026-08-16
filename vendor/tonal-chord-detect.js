// Vendored bundle of @tonaljs/chord-detect@4.9.1 (MIT, https://github.com/tonaljs/tonal)
// Regenerate: pnpm dlx esbuild node_modules/@tonaljs/chord-detect/dist/index.mjs --bundle --format=esm --outfile=vendor/tonal-chord-detect.js
// node_modules/.pnpm/@tonaljs+collection@4.9.0/node_modules/@tonaljs/collection/dist/index.mjs
function rotate(times, arr) {
  const len = arr.length;
  const n = (times % len + len) % len;
  return arr.slice(n, len).concat(arr.slice(0, n));
}
function compact(arr) {
  return arr.filter((n) => n === 0 || n);
}

// node_modules/.pnpm/@tonaljs+pitch@5.0.2/node_modules/@tonaljs/pitch/dist/index.mjs
function isNamedPitch(src) {
  return src !== null && typeof src === "object" && "name" in src && typeof src.name === "string" ? true : false;
}
function isPitch(pitch2) {
  return pitch2 !== null && typeof pitch2 === "object" && "step" in pitch2 && typeof pitch2.step === "number" && "alt" in pitch2 && typeof pitch2.alt === "number" && !isNaN(pitch2.step) && !isNaN(pitch2.alt) ? true : false;
}
var FIFTHS = [0, 2, 4, -1, 1, 3, 5];
var STEPS_TO_OCTS = FIFTHS.map(
  (fifths) => Math.floor(fifths * 7 / 12)
);
function coordinates(pitch2) {
  const { step, alt, oct, dir = 1 } = pitch2;
  const f = FIFTHS[step] + 7 * alt;
  if (oct === void 0) {
    return [dir * f];
  }
  const o = oct - STEPS_TO_OCTS[step] - 4 * alt;
  return [dir * f, dir * o];
}

// node_modules/.pnpm/@tonaljs+pitch-interval@6.1.0/node_modules/@tonaljs/pitch-interval/dist/index.mjs
var fillStr = (s, n) => Array(Math.abs(n) + 1).join(s);
var NoInterval = Object.freeze({
  empty: true,
  name: "",
  num: NaN,
  q: "",
  type: "",
  step: NaN,
  alt: NaN,
  dir: NaN,
  simple: NaN,
  semitones: NaN,
  chroma: NaN,
  coord: [],
  oct: NaN
});
var INTERVAL_TONAL_REGEX = "([-+]?\\d+)(d{1,4}|m|M|P|A{1,4})";
var INTERVAL_SHORTHAND_REGEX = "(AA|A|P|M|m|d|dd)([-+]?\\d+)";
var REGEX = new RegExp(
  "^" + INTERVAL_TONAL_REGEX + "|" + INTERVAL_SHORTHAND_REGEX + "$"
);
function tokenizeInterval(str) {
  const m = REGEX.exec(`${str}`);
  if (m === null) {
    return ["", ""];
  }
  return m[1] ? [m[1], m[2]] : [m[4], m[3]];
}
var cache = {};
function interval(src) {
  return typeof src === "string" ? cache[src] || (cache[src] = parse(src)) : isPitch(src) ? interval(pitchName(src)) : isNamedPitch(src) ? interval(src.name) : NoInterval;
}
var SIZES = [0, 2, 4, 5, 7, 9, 11];
var TYPES = "PMMPPMM";
function parse(str) {
  const tokens = tokenizeInterval(str);
  if (tokens[0] === "") {
    return NoInterval;
  }
  const num = +tokens[0];
  const q = tokens[1];
  const step = (Math.abs(num) - 1) % 7;
  const t = TYPES[step];
  if (t === "M" && q === "P") {
    return NoInterval;
  }
  const type = t === "M" ? "majorable" : "perfectable";
  const name = "" + num + q;
  const dir = num < 0 ? -1 : 1;
  const simple = num === 8 || num === -8 ? num : dir * (step + 1);
  const alt = qToAlt(type, q);
  const oct = Math.floor((Math.abs(num) - 1) / 7);
  const semitones = dir * (SIZES[step] + alt + 12 * oct);
  const chroma = (dir * (SIZES[step] + alt) % 12 + 12) % 12;
  const coord = coordinates({ step, alt, oct, dir });
  return {
    empty: false,
    name,
    num,
    q,
    step,
    alt,
    dir,
    type,
    simple,
    semitones,
    chroma,
    coord,
    oct
  };
}
function qToAlt(type, q) {
  return q === "M" && type === "majorable" || q === "P" && type === "perfectable" ? 0 : q === "m" && type === "majorable" ? -1 : /^A+$/.test(q) ? q.length : /^d+$/.test(q) ? -1 * (type === "perfectable" ? q.length : q.length + 1) : 0;
}
function pitchName(props) {
  const { step, alt, oct = 0, dir } = props;
  if (!dir) {
    return "";
  }
  const calcNum = step + 1 + 7 * oct;
  const num = calcNum === 0 ? step + 1 : calcNum;
  const d = dir < 0 ? "-" : "";
  const type = TYPES[step] === "M" ? "majorable" : "perfectable";
  const name = d + num + altToQ(type, alt);
  return name;
}
function altToQ(type, alt) {
  if (alt === 0) {
    return type === "majorable" ? "M" : "P";
  } else if (alt === -1 && type === "majorable") {
    return "m";
  } else if (alt > 0) {
    return fillStr("A", alt);
  } else {
    return fillStr("d", type === "perfectable" ? alt : alt + 1);
  }
}

// node_modules/.pnpm/@tonaljs+pitch-note@6.1.0/node_modules/@tonaljs/pitch-note/dist/index.mjs
var fillStr2 = (s, n) => Array(Math.abs(n) + 1).join(s);
var NoNote = Object.freeze({
  empty: true,
  name: "",
  letter: "",
  acc: "",
  pc: "",
  step: NaN,
  alt: NaN,
  chroma: NaN,
  height: NaN,
  coord: [],
  midi: null,
  freq: null
});
var cache2 = /* @__PURE__ */ new Map();
var stepToLetter = (step) => "CDEFGAB".charAt(step);
var altToAcc = (alt) => alt < 0 ? fillStr2("b", -alt) : fillStr2("#", alt);
var accToAlt = (acc) => acc[0] === "b" ? -acc.length : acc.length;
function note(src) {
  const stringSrc = JSON.stringify(src);
  const cached = cache2.get(stringSrc);
  if (cached) {
    return cached;
  }
  const value = typeof src === "string" ? parse2(src) : isPitch(src) ? note(pitchName2(src)) : isNamedPitch(src) ? note(src.name) : NoNote;
  cache2.set(stringSrc, value);
  return value;
}
var REGEX2 = /^([a-gA-G]?)(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)$/;
function tokenizeNote(str) {
  const m = REGEX2.exec(str);
  return m ? [m[1].toUpperCase(), m[2].replace(/x/g, "##"), m[3], m[4]] : ["", "", "", ""];
}
var mod = (n, m) => (n % m + m) % m;
var SEMI = [0, 2, 4, 5, 7, 9, 11];
function parse2(noteName) {
  const tokens = tokenizeNote(noteName);
  if (tokens[0] === "" || tokens[3] !== "") {
    return NoNote;
  }
  const letter = tokens[0];
  const acc = tokens[1];
  const octStr = tokens[2];
  const step = (letter.charCodeAt(0) + 3) % 7;
  const alt = accToAlt(acc);
  const oct = octStr.length ? +octStr : void 0;
  const coord = coordinates({ step, alt, oct });
  const name = letter + acc + octStr;
  const pc = letter + acc;
  const chroma = (SEMI[step] + alt + 120) % 12;
  const height = oct === void 0 ? mod(SEMI[step] + alt, 12) - 12 * 99 : SEMI[step] + alt + 12 * (oct + 1);
  const midi = height >= 0 && height <= 127 ? height : null;
  const freq = oct === void 0 ? null : Math.pow(2, (height - 69) / 12) * 440;
  return {
    empty: false,
    acc,
    alt,
    chroma,
    coord,
    freq,
    height,
    letter,
    midi,
    name,
    oct,
    pc,
    step
  };
}
function pitchName2(props) {
  const { step, alt, oct } = props;
  const letter = stepToLetter(step);
  if (!letter) {
    return "";
  }
  const pc = letter + altToAcc(alt);
  return oct || oct === 0 ? pc + oct : pc;
}

// node_modules/.pnpm/@tonaljs+pcset@4.10.1/node_modules/@tonaljs/pcset/dist/index.mjs
var EmptyPcset = {
  empty: true,
  name: "",
  setNum: 0,
  chroma: "000000000000",
  normalized: "000000000000",
  intervals: []
};
var setNumToChroma = (num2) => Number(num2).toString(2).padStart(12, "0");
var chromaToNumber = (chroma2) => parseInt(chroma2, 2);
var REGEX3 = /^[01]{12}$/;
function isChroma(set) {
  return REGEX3.test(set);
}
var isPcsetNum = (set) => typeof set === "number" && set >= 0 && set <= 4095;
var isPcset = (set) => set && isChroma(set.chroma);
var cache3 = { [EmptyPcset.chroma]: EmptyPcset };
function get(src) {
  const chroma2 = isChroma(src) ? src : isPcsetNum(src) ? setNumToChroma(src) : Array.isArray(src) ? listToChroma(src) : isPcset(src) ? src.chroma : EmptyPcset.chroma;
  return cache3[chroma2] = cache3[chroma2] || chromaToPcset(chroma2);
}
var IVLS = [
  "1P",
  "2m",
  "2M",
  "3m",
  "3M",
  "4P",
  "5d",
  "5P",
  "6m",
  "6M",
  "7m",
  "7M"
];
function chromaToIntervals(chroma2) {
  const intervals2 = [];
  for (let i = 0; i < 12; i++) {
    if (chroma2.charAt(i) === "1") intervals2.push(IVLS[i]);
  }
  return intervals2;
}
function modes(set, normalize = true) {
  const pcs = get(set);
  const binary = pcs.chroma.split("");
  return compact(
    binary.map((_, i) => {
      const r = rotate(i, binary);
      return normalize && r[0] === "0" ? null : r.join("");
    })
  );
}
function chromaRotations(chroma2) {
  const binary = chroma2.split("");
  return binary.map((_, i) => rotate(i, binary).join(""));
}
function chromaToPcset(chroma2) {
  const setNum = chromaToNumber(chroma2);
  const normalizedNum = chromaRotations(chroma2).map(chromaToNumber).filter((n) => n >= 2048).sort()[0];
  const normalized = setNumToChroma(normalizedNum);
  const intervals2 = chromaToIntervals(chroma2);
  return {
    empty: false,
    name: "",
    setNum,
    chroma: chroma2,
    normalized,
    intervals: intervals2
  };
}
function listToChroma(set) {
  if (set.length === 0) {
    return EmptyPcset.chroma;
  }
  let pitch2;
  const binary = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < set.length; i++) {
    pitch2 = note(set[i]);
    if (pitch2.empty) pitch2 = interval(set[i]);
    if (!pitch2.empty) binary[pitch2.chroma] = 1;
  }
  return binary.join("");
}

// node_modules/.pnpm/@tonaljs+chord-type@5.1.1/node_modules/@tonaljs/chord-type/dist/index.mjs
var CHORDS = [
  // ==Major==
  ["1P 3M 5P", "major", "M ^  maj"],
  ["1P 3M 5P 7M", "major seventh", "maj7 \u0394 ma7 M7 Maj7 ^7"],
  ["1P 3M 5P 7M 9M", "major ninth", "maj9 \u03949 ^9"],
  ["1P 3M 5P 7M 9M 13M", "major thirteenth", "maj13 Maj13 ^13"],
  ["1P 3M 5P 6M", "sixth", "6 add6 add13 M6"],
  ["1P 3M 5P 6M 9M", "sixth added ninth", "6add9 6/9 69 M69"],
  ["1P 3M 6m 7M", "major seventh flat sixth", "M7b6 ^7b6"],
  [
    "1P 3M 5P 7M 11A",
    "major seventh sharp eleventh",
    "maj#4 \u0394#4 \u0394#11 M7#11 ^7#11 maj7#11"
  ],
  // ==Minor==
  // '''Normal'''
  ["1P 3m 5P", "minor", "m min -"],
  ["1P 3m 5P 7m", "minor seventh", "m7 min7 mi7 -7"],
  [
    "1P 3m 5P 7M",
    "minor/major seventh",
    "m/ma7 m/maj7 mM7 mMaj7 m/M7 -\u03947 m\u0394 -^7 -maj7"
  ],
  ["1P 3m 5P 6M", "minor sixth", "m6 -6"],
  ["1P 3m 5P 7m 9M", "minor ninth", "m9 -9"],
  ["1P 3m 5P 7M 9M", "minor/major ninth", "mM9 mMaj9 -^9"],
  ["1P 3m 5P 7m 9M 11P", "minor eleventh", "m11 -11"],
  ["1P 3m 5P 7m 9M 13M", "minor thirteenth", "m13 -13"],
  // '''Diminished'''
  ["1P 3m 5d", "diminished", "dim \xB0 o"],
  ["1P 3m 5d 7d", "diminished seventh", "dim7 \xB07 o7"],
  ["1P 3m 5d 7m", "half-diminished", "m7b5 \xF8 -7b5 h7 h"],
  // ==Dominant/Seventh==
  // '''Normal'''
  ["1P 3M 5P 7m", "dominant seventh", "7 dom"],
  ["1P 3M 5P 7m 9M", "dominant ninth", "9"],
  ["1P 3M 5P 7m 9M 13M", "dominant thirteenth", "13"],
  ["1P 3M 5P 7m 11A", "lydian dominant seventh", "7#11 7#4"],
  // '''Altered'''
  ["1P 3M 5P 7m 9m", "dominant flat ninth", "7b9"],
  ["1P 3M 5P 7m 9A", "dominant sharp ninth", "7#9"],
  ["1P 3M 7m 9m", "altered", "alt7"],
  // '''Suspended'''
  ["1P 4P 5P", "suspended fourth", "sus4 sus"],
  ["1P 2M 5P", "suspended second", "sus2"],
  ["1P 4P 5P 7m", "suspended fourth seventh", "7sus4 7sus"],
  ["1P 5P 7m 9M 11P", "eleventh", "11"],
  [
    "1P 4P 5P 7m 9m",
    "suspended fourth flat ninth",
    "b9sus phryg 7b9sus 7b9sus4"
  ],
  // ==Other==
  ["1P 5P", "fifth", "5"],
  ["1P 3M 5A", "augmented", "aug + +5 ^#5"],
  ["1P 3m 5A", "minor augmented", "m#5 -#5 m+"],
  ["1P 3M 5A 7M", "augmented seventh", "maj7#5 maj7+5 +maj7 ^7#5"],
  [
    "1P 3M 5P 7M 9M 11A",
    "major sharp eleventh (lydian)",
    "maj9#11 \u03949#11 ^9#11"
  ],
  // ==Legacy==
  ["1P 2M 4P 5P", "", "sus24 sus4add9"],
  ["1P 3M 5A 7M 9M", "", "maj9#5 Maj9#5"],
  ["1P 3M 5A 7m", "", "7#5 +7 7+ 7aug aug7"],
  ["1P 3M 5A 7m 9A", "", "7#5#9 7#9#5 7alt"],
  ["1P 3M 5A 7m 9M", "", "9#5 9+"],
  ["1P 3M 5A 7m 9M 11A", "", "9#5#11"],
  ["1P 3M 5A 7m 9m", "", "7#5b9 7b9#5"],
  ["1P 3M 5A 7m 9m 11A", "", "7#5b9#11"],
  ["1P 3M 5A 9A", "", "+add#9"],
  ["1P 3M 5A 9M", "", "M#5add9 +add9"],
  ["1P 3M 5P 6M 11A", "", "M6#11 M6b5 6#11 6b5"],
  ["1P 3M 5P 6M 7M 9M", "", "M7add13"],
  ["1P 3M 5P 6M 9M 11A", "", "69#11"],
  ["1P 3m 5P 6M 9M", "", "m69 -69"],
  ["1P 3M 5P 6m 7m", "", "7b6"],
  ["1P 3M 5P 7M 9A 11A", "", "maj7#9#11"],
  ["1P 3M 5P 7M 9M 11A 13M", "", "M13#11 maj13#11 M13+4 M13#4"],
  ["1P 3M 5P 7M 9m", "", "M7b9"],
  ["1P 3M 5P 7m 11A 13m", "", "7#11b13 7b5b13"],
  ["1P 3M 5P 7m 13M", "", "7add6 67 7add13"],
  ["1P 3M 5P 7m 9A 11A", "", "7#9#11 7b5#9 7#9b5"],
  ["1P 3M 5P 7m 9A 11A 13M", "", "13#9#11"],
  ["1P 3M 5P 7m 9A 11A 13m", "", "7#9#11b13"],
  ["1P 3M 5P 7m 9A 13M", "", "13#9"],
  ["1P 3M 5P 7m 9A 13m", "", "7#9b13"],
  ["1P 3M 5P 7m 9M 11A", "", "9#11 9+4 9#4"],
  ["1P 3M 5P 7m 9M 11A 13M", "", "13#11 13+4 13#4"],
  ["1P 3M 5P 7m 9M 11A 13m", "", "9#11b13 9b5b13"],
  ["1P 3M 5P 7m 9m 11A", "", "7b9#11 7b5b9 7b9b5"],
  ["1P 3M 5P 7m 9m 11A 13M", "", "13b9#11"],
  ["1P 3M 5P 7m 9m 11A 13m", "", "7b9b13#11 7b9#11b13 7b5b9b13"],
  ["1P 3M 5P 7m 9m 13M", "", "13b9"],
  ["1P 3M 5P 7m 9m 13m", "", "7b9b13"],
  ["1P 3M 5P 7m 9m 9A", "", "7b9#9"],
  ["1P 3M 5P 9M", "", "Madd9 2 add9 add2"],
  ["1P 3M 5P 9m", "", "Maddb9"],
  ["1P 3M 5d", "", "Mb5"],
  ["1P 3M 5d 6M 7m 9M", "", "13b5"],
  ["1P 3M 5d 7M", "", "M7b5"],
  ["1P 3M 5d 7M 9M", "", "M9b5"],
  ["1P 3M 5d 7m", "", "7b5"],
  ["1P 3M 5d 7m 9M", "", "9b5"],
  ["1P 3M 7m", "", "7no5"],
  ["1P 3M 7m 13m", "", "7b13"],
  ["1P 3M 7m 9M", "", "9no5"],
  ["1P 3M 7m 9M 13M", "", "13no5"],
  ["1P 3M 7m 9M 13m", "", "9b13"],
  ["1P 3m 4P 5P", "", "madd4"],
  ["1P 3m 5P 6m 7M", "", "mMaj7b6"],
  ["1P 3m 5P 6m 7M 9M", "", "mMaj9b6"],
  ["1P 3m 5P 7m 11P", "", "m7add11 m7add4"],
  ["1P 3m 5P 9M", "", "madd9"],
  ["1P 3m 5d 6M 7M", "", "o7M7"],
  ["1P 3m 5d 7M", "", "oM7"],
  ["1P 3m 6m 7M", "", "mb6M7"],
  ["1P 3m 6m 7m", "", "m7#5"],
  ["1P 3m 6m 7m 9M", "", "m9#5"],
  ["1P 3m 5A 7m 9M 11P", "", "m11A"],
  ["1P 3m 6m 9m", "", "mb6b9"],
  ["1P 2M 3m 5d 7m", "", "m9b5"],
  ["1P 4P 5A 7M", "", "M7#5sus4"],
  ["1P 4P 5A 7M 9M", "", "M9#5sus4"],
  ["1P 4P 5A 7m", "", "7#5sus4"],
  ["1P 4P 5P 7M", "", "M7sus4"],
  ["1P 4P 5P 7M 9M", "", "M9sus4"],
  ["1P 4P 5P 7m 9M", "", "9sus4 9sus"],
  ["1P 4P 5P 7m 9M 13M", "", "13sus4 13sus"],
  ["1P 4P 5P 7m 9m 13m", "", "7sus4b9b13 7b9b13sus4"],
  ["1P 4P 7m 10m", "", "4 quartal"],
  ["1P 5P 7m 9m 11P", "", "11b9"]
];
var data_default = CHORDS;
var NoChordType = {
  ...EmptyPcset,
  name: "",
  quality: "Unknown",
  intervals: [],
  aliases: []
};
var dictionary = [];
var index = {};
function all() {
  return dictionary.slice();
}
function add(intervals, aliases, fullName) {
  const quality = getQuality(intervals);
  const chord = {
    ...get(intervals),
    name: fullName || "",
    quality,
    intervals,
    aliases
  };
  dictionary.push(chord);
  if (chord.name) {
    index[chord.name] = chord;
  }
  index[chord.setNum] = chord;
  index[chord.chroma] = chord;
  chord.aliases.forEach((alias) => addAlias(chord, alias));
}
function addAlias(chord, alias) {
  index[alias] = chord;
}
function getQuality(intervals) {
  const has = (interval2) => intervals.indexOf(interval2) !== -1;
  return has("5A") ? "Augmented" : has("3M") ? "Major" : has("5d") ? "Diminished" : has("3m") ? "Minor" : "Unknown";
}
data_default.forEach(
  ([ivls, fullName, names2]) => add(ivls.split(" "), names2.split(" "), fullName)
);
dictionary.sort((a, b) => a.setNum - b.setNum);

// node_modules/.pnpm/@tonaljs+chord-detect@4.9.1/node_modules/@tonaljs/chord-detect/dist/index.mjs
var namedSet = (notes) => {
  const pcToName = notes.reduce((record, n) => {
    const chroma = note(n).chroma;
    if (chroma !== void 0) {
      record[chroma] = record[chroma] || note(n).name;
    }
    return record;
  }, {});
  return (chroma) => pcToName[chroma];
};
function detect(source, options = {}) {
  const notes = source.map((n) => note(n).pc).filter((x) => x);
  if (note.length === 0) {
    return [];
  }
  const found = findMatches(notes, 1, options);
  return found.filter((chord) => chord.weight).sort((a, b) => b.weight - a.weight).map((chord) => chord.name);
}
var BITMASK = {
  // 3m 000100000000
  // 3M 000010000000
  anyThirds: 384,
  // 5P 000000010000
  perfectFifth: 16,
  // 5d 000000100000
  // 5A 000000001000
  nonPerfectFifths: 40,
  anySeventh: 3
};
var testChromaNumber = (bitmask) => (chromaNumber) => Boolean(chromaNumber & bitmask);
var hasAnyThird = testChromaNumber(BITMASK.anyThirds);
var hasPerfectFifth = testChromaNumber(BITMASK.perfectFifth);
var hasAnySeventh = testChromaNumber(BITMASK.anySeventh);
var hasNonPerfectFifth = testChromaNumber(BITMASK.nonPerfectFifths);
function hasAnyThirdAndPerfectFifthAndAnySeventh(chordType) {
  const chromaNumber = parseInt(chordType.chroma, 2);
  return hasAnyThird(chromaNumber) && hasPerfectFifth(chromaNumber) && hasAnySeventh(chromaNumber);
}
function withPerfectFifth(chroma) {
  const chromaNumber = parseInt(chroma, 2);
  return hasNonPerfectFifth(chromaNumber) ? chroma : (chromaNumber | 16).toString(2);
}
function findMatches(notes, weight, options) {
  const tonic = notes[0];
  const tonicChroma = note(tonic).chroma;
  const noteName = namedSet(notes);
  const allModes = modes(notes, false);
  const found = [];
  allModes.forEach((mode, index2) => {
    const modeWithPerfectFifth = options.assumePerfectFifth && withPerfectFifth(mode);
    const chordTypes = all().filter((chordType) => {
      if (options.assumePerfectFifth && hasAnyThirdAndPerfectFifthAndAnySeventh(chordType)) {
        return chordType.chroma === modeWithPerfectFifth;
      }
      return chordType.chroma === mode;
    });
    chordTypes.forEach((chordType) => {
      const chordName = chordType.aliases[0];
      const baseNote = noteName(index2);
      const isInversion = index2 !== tonicChroma;
      if (isInversion) {
        found.push({
          weight: 0.5 * weight,
          name: `${baseNote}${chordName}/${tonic}`
        });
      } else {
        found.push({ weight: 1 * weight, name: `${baseNote}${chordName}` });
      }
    });
  });
  return found;
}
var chord_detect_default = { detect };
export {
  chord_detect_default as default,
  detect
};
