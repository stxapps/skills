#!/usr/bin/env node
// Measures how hard an English text is to read, and points at what to fix.
//
//   node readability.mjs [file ...] [--target 5] [--max-words 20] [--json] [--check]
//
// Reads stdin when no file is given. Node 18+, no dependencies. Markdown is
// understood: code, URLs, tables and front matter are left out of the count.
// The grade is Flesch-Kincaid, which only looks at sentence length and syllables
// per word. It is a rough guide, not a judge.

import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SWAPS_FILE = new URL('../references/word-swaps.md', import.meta.url);

// Abbreviations whose dot must not end a sentence.
const ABBREVIATIONS = /\b(?:e\.g|i\.e|etc|vs|mr|mrs|ms|dr|st|no|approx|fig|inc|ltd|co)\.(?=\s)/gi;

const BE = '(?:am|is|are|was|were|be|been|being)';
const IRREGULAR =
  'made|done|sent|built|kept|held|told|found|given|shown|known|seen|taken|written|chosen|paid|lost|left|put|set|shut|cut|read|run|won';
const PASSIVE = new RegExp(`\\b${BE}\\s+(?:\\w+ly\\s+)?(?:\\w+ed|${IRREGULAR})\\b`, 'gi');

/** Rough English syllable count. Exact for common words, off by one now and then. */
export function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 1; // a number, or a word in another script
  if (w.length <= 3) return 1;
  // A y before a vowel is a consonant: yellow, player.
  let n = (w.replace(/y(?=[aeiou])/g, 'x').match(/[aeiouy]+/g) ?? []).length;
  if (/[^aeiouy]ed$/.test(w) && !/[td]ed$/.test(w))
    n -= 1; // jumped, but not wanted
  else if (/[^aeiouy]es$/.test(w) && !/(?:[sxz]|ch|sh|ge|ce)es$/.test(w))
    n -= 1; // makes, not boxes
  else if (/[^aeiouy]e$/.test(w) && !/[^aeiouy]le$/.test(w)) n -= 1; // make, not table
  return Math.max(1, n);
}

/** The words in a sentence: letters and digits, with inner apostrophes and hyphens. */
export function words(text) {
  return text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
}

function syllablesOf(word) {
  return word.split('-').reduce((sum, part) => sum + countSyllables(part), 0);
}

/**
 * Turns Markdown or plain text into prose blocks: paragraphs, list items and
 * headings, each with the line it starts on. Code and tables are dropped.
 */
export function blocks(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let current = null;
  let fence = null;
  const flush = () => {
    if (current && current.text.trim()) out.push(current);
    current = null;
  };

  // Skip YAML front matter.
  let start = 0;
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1);
    if (end > 0) start = end + 1;
  }

  for (let i = start; i < lines.length; i++) {
    const raw = lines[i];
    const line = i + 1;
    const fenceMatch = raw.match(/^\s*(```|~~~)/);
    if (fence) {
      if (fenceMatch && fenceMatch[1] === fence) fence = null;
      continue;
    }
    if (fenceMatch) {
      flush();
      fence = fenceMatch[1];
      continue;
    }
    if (!raw.trim() || /^\s*\|/.test(raw)) {
      flush(); // blank line or table row
      continue;
    }
    const heading = raw.match(/^\s*#{1,6}\s+(.*)$/);
    if (heading) {
      flush();
      out.push({ kind: 'heading', line, text: heading[1] });
      continue;
    }
    const item = raw.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (item) {
      flush();
      current = { kind: 'prose', line, text: item[1] };
      continue;
    }
    if (!current && /^\s{4,}\S/.test(raw)) continue; // indented code
    const quoted = raw.replace(/^\s*(?:>\s?)*/, '');
    if (current) current.text += '\n' + quoted;
    else current = { kind: 'prose', line, text: quoted };
  }
  flush();
  return out.map((b) => ({ ...b, text: clean(b.text) }));
}

// Strips inline Markdown and HTML but keeps every newline, so line numbers hold.
function clean(text) {
  return text
    .replace(/<[^>\n]+>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`[^`\n]+`/g, 'code')
    .replace(/https?:\/\/\S+/g, 'link')
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, 'email')
    .replace(/\*+|~~/g, '')
    .replace(/(^|[^\p{L}\p{N}])_+|_+(?=[^\p{L}\p{N}]|$)/gu, '$1');
}

/** Splits a block into sentences, each with the line it starts on. */
export function sentences(block) {
  const text = block.text.replace(ABBREVIATIONS, (m) => m.replace(/\./g, ''));
  const out = [];
  const boundary = /[.!?…]+["'”’)\]]*(?=\s|$)/g;
  let from = 0;
  const push = (to) => {
    const piece = text.slice(from, to);
    const trimmed = piece.trim();
    if (words(trimmed).length) {
      const lead = piece.length - piece.trimStart().length;
      const before = text.slice(0, from + lead);
      out.push({ line: block.line + (before.match(/\n/g) ?? []).length, text: trimmed });
    }
    from = to;
  };
  for (const m of text.matchAll(boundary)) push(m.index + m[0].length);
  push(text.length);
  return out;
}

/** Reads the swap table: `| hard words | plain words |` rows under a header. */
export function parseSwaps(markdown) {
  const swaps = [];
  for (const row of markdown.split('\n')) {
    const cells = row.split('|').map((c) => c.trim());
    if (cells.length < 4) continue;
    const [, from, to] = cells;
    if (!from || !to || /^-+$/.test(from) || from === 'instead of') continue;
    swaps.push({ from: from.toLowerCase(), to });
  }
  return swaps;
}

function swapPattern(from) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (from.includes(' ')) return new RegExp(`\\b${esc(from).replace(/ /g, '\\s+')}\\b`, 'gi');
  let body;
  if (from.endsWith('e')) body = `${esc(from.slice(0, -1))}(?:e|es|ed|ing)`;
  else if (/[^aeiou]y$/.test(from)) body = `${esc(from.slice(0, -1))}(?:y|ies|ied|ying)`;
  else body = `${esc(from)}(?:s|es|ed|ing)?`;
  return new RegExp(`\\b${body}\\b`, 'gi');
}

let defaultSwaps;
function loadDefaultSwaps() {
  defaultSwaps ??= parseSwaps(readFileSync(SWAPS_FILE, 'utf8'));
  return defaultSwaps;
}

/**
 * Scores a text. `target` is the grade to reach: grade 5 passes while the
 * Flesch-Kincaid grade is under 6.0, since 5.x reads as 5th grade.
 */
export function analyze(text, { target = 5, maxWords = 20, swaps = loadDefaultSwaps() } = {}) {
  const all = blocks(text);
  const prose = all.filter((b) => b.kind === 'prose').flatMap(sentences);
  let wordCount = 0;
  let syllableCount = 0;
  const longWords = new Map();
  const longSentences = [];
  const passive = [];

  for (const s of prose) {
    const ws = words(s.text);
    wordCount += ws.length;
    for (const w of ws) {
      const syl = syllablesOf(w);
      syllableCount += syl;
      if (syl >= 3 && /\p{L}/u.test(w)) {
        const key = w.toLowerCase();
        longWords.set(key, (longWords.get(key) ?? 0) + 1);
      }
    }
    if (ws.length > maxWords) longSentences.push({ line: s.line, words: ws.length, text: s.text });
    for (const m of s.text.matchAll(PASSIVE))
      passive.push({ line: s.line, text: m[0].replace(/\s+/g, ' ') });
  }

  // Swaps are checked in headings too: a hard word is hard wherever it sits.
  const hits = [];
  for (const b of all) {
    for (const { from, to } of swaps) {
      for (const m of b.text.matchAll(swapPattern(from))) {
        const line = b.line + (b.text.slice(0, m.index).match(/\n/g) ?? []).length;
        hits.push({ line, found: m[0], try: to });
      }
    }
  }
  hits.sort((a, b) => a.line - b.line);

  const sentenceCount = prose.length;
  const wps = sentenceCount ? wordCount / sentenceCount : 0;
  const spw = wordCount ? syllableCount / wordCount : 0;
  const grade = sentenceCount ? round(0.39 * wps + 11.8 * spw - 15.59) : 0;
  const ease = sentenceCount ? round(206.835 - 1.015 * wps - 84.6 * spw) : 0;

  return {
    words: wordCount,
    sentences: sentenceCount,
    wordsPerSentence: round(wps),
    syllablesPerWord: round(spw, 2),
    grade,
    readingEase: ease,
    target,
    pass: sentenceCount > 0 && grade < target + 1,
    tooShort: wordCount < 100,
    longSentences,
    swaps: hits,
    passive,
    longWords: [...longWords]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([word, count]) => ({ word, count })),
  };
}

function round(n, places = 1) {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

function preview(text, n = 12) {
  const flat = text.replace(/\s+/g, ' ');
  const ws = flat.split(' ');
  return ws.length > n ? ws.slice(0, n).join(' ') + ' …' : flat;
}

export function report(name, r, { maxWords = 20 } = {}) {
  const out = [];
  const mark = r.pass ? 'PASS' : 'OVER';
  out.push(name);
  if (!r.sentences) {
    out.push('  No prose found to measure.');
    return out.join('\n');
  }
  out.push(
    `  Grade ${r.grade} (Flesch-Kincaid). Target grade ${r.target}, so under ${r.target + 1}.0. ${mark}`,
  );
  out.push(`  Reading ease ${r.readingEase} (90 and up reads as 5th grade)`);
  out.push(
    `  ${r.words} words, ${r.sentences} sentences, ${r.wordsPerSentence} words per sentence, ${r.syllablesPerWord} syllables per word`,
  );
  if (r.tooShort) out.push('  Under 100 words, so the grade is a loose guess.');

  out.push('', `  Long sentences (over ${maxWords} words): ${r.longSentences.length}`);
  for (const s of r.longSentences)
    out.push(`    L${s.line}  ${s.words} words  "${preview(s.text)}"`);

  out.push('', `  Plain-word swaps: ${r.swaps.length}`);
  for (const h of r.swaps) out.push(`    L${h.line}  ${h.found} -> ${h.try}`);

  out.push('', `  Maybe passive: ${r.passive.length}`);
  for (const p of r.passive) out.push(`    L${p.line}  "${p.text}"`);

  const top = r.longWords.slice(0, 20);
  out.push('', `  Words of 3+ syllables (${r.longWords.length} different), most used first:`);
  if (top.length)
    out.push('    ' + top.map((w) => (w.count > 1 ? `${w.word} x${w.count}` : w.word)).join(', '));
  return out.join('\n');
}

function parseArgs(argv) {
  const opts = { files: [], target: 5, maxWords: 20, json: false, check: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--check') opts.check = true;
    else if (a === '--target') opts.target = Number(argv[++i]);
    else if (a === '--max-words') opts.maxWords = Number(argv[++i]);
    else if (a === '-h' || a === '--help') opts.help = true;
    else opts.files.push(a);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !Number.isFinite(opts.target) || !Number.isFinite(opts.maxWords)) {
    console.log(
      'usage: node readability.mjs [file ...] [--target 5] [--max-words 20] [--json] [--check]\n' +
        'Reads stdin when no file is given. --check exits 1 when a file is over its target.',
    );
    process.exit(opts.help ? 0 : 2);
  }
  const inputs = opts.files.length
    ? opts.files.map((f) => ({ name: f, text: readFileSync(f, 'utf8') }))
    : [{ name: '(stdin)', text: readFileSync(0, 'utf8') }];
  const results = inputs.map(({ name, text }) => ({ file: name, ...analyze(text, opts) }));
  if (opts.json) console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
  else console.log(results.map((r) => report(r.file, r, opts)).join('\n\n'));
  if (opts.check && results.some((r) => !r.pass)) process.exit(1);
}

// Run as a command, not when imported. realpath, because a skills folder is often a symlink.
if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) main();
