// Pins the 5th-grade-reading skill's scorer, skills/5th-grade-reading/scripts/readability.mjs.
// Node's own runner: `npm test`. The script ships inside the skill
// folder, so its test lives here and doesn't ship with it.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  analyze,
  blocks,
  countSyllables,
  parseSwaps,
  sentences,
} from '../skills/5th-grade-reading/scripts/readability.mjs';

const script = new URL('../skills/5th-grade-reading/scripts/readability.mjs', import.meta.url);
const swapsFile = new URL('../skills/5th-grade-reading/references/word-swaps.md', import.meta.url);

test('syllables: the common endings', () => {
  const cases = {
    cat: 1,
    make: 1,
    makes: 1,
    jumped: 1,
    wanted: 2,
    boxes: 2,
    uses: 2,
    table: 2,
    free: 1,
    yellow: 2,
    player: 2,
    simple: 2,
    reading: 2,
    computer: 3,
    application: 4,
    2026: 1,
  };
  for (const [word, n] of Object.entries(cases)) assert.equal(countSyllables(word), n, word);
});

test('blocks: code, tables and front matter are left out, line numbers kept', () => {
  const md = [
    '---',
    'title: x',
    '---',
    '# Start here',
    '',
    'One line',
    'wraps here.',
    '',
    '```',
    'not prose.',
    '```',
    '| a | b |',
    '- An item.',
    '  More of it.',
  ].join('\n');
  const got = blocks(md).map((b) => [b.kind, b.line, b.text]);
  assert.deepEqual(got, [
    ['heading', 4, 'Start here'],
    ['prose', 6, 'One line\nwraps here.'],
    ['prose', 13, 'An item.\nMore of it.'],
  ]);
});

test('blocks: inline code, links and emphasis become plain words', () => {
  const [b] = blocks('Run `npm i`, then see [the guide](https://x.y/z) or https://a.b **now**.');
  assert.equal(b.text, 'Run code, then see the guide or link now.');
});

test('blocks: snake_case survives emphasis stripping', () => {
  const [b] = blocks('Set _max_retries_ in the file.');
  assert.equal(b.text, 'Set max_retries in the file.');
});

test('sentences: split on end marks, not on e.g. or decimals', () => {
  const got = sentences({
    line: 1,
    text: 'Pick one, e.g. red. It costs 3.5 dollars!\nIs that ok?',
  });
  assert.deepEqual(got, [
    { line: 1, text: 'Pick one, eg red.' },
    { line: 1, text: 'It costs 3.5 dollars!' },
    { line: 2, text: 'Is that ok?' },
  ]);
});

test('the swap table parses, and every row has a suggestion', () => {
  const swaps = parseSwaps(readFileSync(swapsFile, 'utf8'));
  assert.ok(swaps.length > 80);
  assert.ok(swaps.some((s) => s.from === 'in order to' && s.to === 'to'));
  assert.ok(swaps.every((s) => s.from === s.from.toLowerCase() && s.to));
  assert.ok(!swaps.some((s) => s.from === 'instead of'));
});

test('swaps match word endings and phrases across a line wrap', () => {
  const r = analyze('We utilized it.\nWe are modifying it in order\nto win.');
  assert.deepEqual(
    r.swaps.map((h) => [h.line, h.found.replace(/\s+/g, ' '), h.try]),
    [
      [1, 'utilized', 'use'],
      [2, 'in order to', 'to'],
      [2, 'modifying', 'change'],
    ],
  );
});

test('plain text scores low, dense text scores high', () => {
  const plain = analyze('The cat sat on the mat. It was warm. We like the cat.');
  const dense = analyze(
    'Organizational stakeholders must collaboratively prioritize comprehensive infrastructure modernization initiatives, notwithstanding considerable implementation complexity.',
  );
  assert.ok(plain.grade < 2, `plain ${plain.grade}`);
  assert.ok(plain.pass);
  assert.ok(dense.grade > 16, `dense ${dense.grade}`);
  assert.ok(!dense.pass);
  assert.equal(dense.longWords[0].word.length > 0, true);
});

test('grade 5.x passes target 5; long sentences and passives are flagged', () => {
  const long = Array.from({ length: 25 }, () => 'word').join(' ') + '.';
  const r = analyze(`${long}\n\nThe file was saved by the app.`, { maxWords: 20 });
  assert.equal(r.longSentences.length, 1);
  assert.equal(r.longSentences[0].words, 25);
  assert.deepEqual(
    r.passive.map((p) => p.text),
    ['was saved'],
  );
  assert.equal(analyze('x.', { target: 5 }).pass, true);
});

test('a passive that wraps a line prints on one line', () => {
  assert.deepEqual(
    analyze('The file is\ndeleted.').passive.map((p) => p.text),
    ['is deleted'],
  );
});

test('scores stay on their scales for very easy and very hard text', () => {
  const easy = analyze('The cat sat on the mat.');
  assert.equal(easy.grade, 0);
  assert.equal(easy.readingEase, 100);
  const hard = analyze(
    'Organizational stakeholders must collaboratively prioritize comprehensive infrastructure modernization initiatives, notwithstanding considerable implementation complexity.',
  );
  assert.equal(hard.readingEase, 0);
});

test('nothing to measure is not a pass', () => {
  const r = analyze('```\ncode only\n```');
  assert.equal(r.sentences, 0);
  assert.equal(r.pass, false);
});

test('the command: --check exits 1 over target, --json prints one object', () => {
  const run = (args, input) => {
    try {
      return {
        code: 0,
        out: execFileSync('node', [script.pathname, ...args], { input }).toString(),
      };
    } catch (e) {
      return { code: e.status, out: e.stdout.toString() };
    }
  };
  const dense =
    'Organizational stakeholders must collaboratively prioritize comprehensive modernization.';
  assert.equal(run(['--check'], dense).code, 1);
  assert.equal(run(['--check'], 'The cat sat on the mat.').code, 0);
  const json = JSON.parse(run(['--json'], 'The cat sat.').out);
  assert.equal(json.file, '(stdin)');
  assert.equal(json.sentences, 1);
});
