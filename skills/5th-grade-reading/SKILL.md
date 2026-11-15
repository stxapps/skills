---
name: 5th-grade-reading
description: Check, fix or rewrite text so a 5th-grade reader can follow it, using short sentences, plain everyday words, active voice and one idea at a time, without changing what it means. Use this skill whenever someone wants text to be simpler, plainer, clearer or easier to read. That includes asks to cut jargon, lower the reading level, check readability or a Flesch-Kincaid grade, "explain it like I'm 10", or polish docs, help pages, README files, UI copy, error messages, emails, notices or release notes for a general audience, even if they never say "5th grade".
---

# 5th-grade reading

Make text easy to read. A 5th grader is about 10 years old. They should be
able to read it once and know what it says and what to do. So should a tired
adult, a person reading in their second language, or someone on a small
screen.

Easy is not childish. Write for adults who are busy, not for kids. Keep the
tone the writer chose. Don't add cheer, praise or exclamation marks.

## Pick the job

| They say                                       | Job         | You change                        |
| ---------------------------------------------- | ----------- | --------------------------------- |
| check, verify, review, grade, "is this clear?" | **check**   | nothing; you report               |
| fix, polish, tidy, edit, tighten               | **fix**     | only what breaks the rules below  |
| rewrite, simplify, "make this plain"           | **rewrite** | as much as it takes; same meaning |

If the ask is unclear and the text is someone's file, do a **check** first.
Then offer to fix it. A check never edits the file.

## The rules

These are what make text easy. Each one says why, so you can judge the cases
the rule doesn't fit.

1. **Short sentences.** Aim for 8 to 15 words. Go over 20 only when a list
   or a name forces it. A reader holds a short sentence in their head at once.
2. **One idea per sentence.** If a sentence has "and", "which" or a semicolon
   joining two thoughts, split it. Two short sentences beat one long one.
3. **Plain words.** Use the word you'd say out loud to a friend: "use", not
   "utilize"; "help", not "facilitate"; "about", not "approximately".
   `references/word-swaps.md` lists common swaps. Read the sentence before you
   swap. Keep a hard word if the plain one changes the meaning.
4. **Active voice.** Say who does what: "We delete the file", not "The file is
   deleted". The reader needs to know who acts, often to know if it's them.
5. **Verbs, not nouns made from verbs.** "Decide", not "make a decision".
   "Install it", not "perform the installation".
6. **Talk to the reader.** Use "you" for the reader, and "we" for the writer
   when it's an organization. Use "must" for what they have to do.
7. **Lead with the point.** Put the action or the answer first and the reason
   after it. "Save your work before you close the app. You'll lose it
   otherwise."
8. **Be concrete.** Swap a vague claim for the fact behind it. "It's fast"
   tells little. "It opens in 1 second" tells more. Add a short example when an
   idea is abstract.
9. **Steps go in a numbered list,** one action per step, in the order they
   happen. Use bullets for things that have no order. Keep paragraphs to 2
   to 4 sentences.
10. **Cut what adds nothing.** "Please note that", "It is important to
    remember", "basically", "simply", "very". If a word can go and the meaning
    stays, it goes.
11. **Use digits for numbers** ("3 days", not "three days"). Readers spot them
    while scanning.
12. **Same thing, same word.** If you call it a "folder" once, don't call it a
    "directory" later. A new word makes the reader think it's a new thing.

## Don't change these

- **Code, commands, file names, paths, URLs, and keys.** Copy them exactly.
- **Names on screen.** If a button says "Sign in", write "Sign in", even if
  you'd say "log in". The reader looks for those words.
- **Product, brand and people's names.** Keep their spelling and case.
- **Quotes.** Someone else's words stay theirs.
- **Terms the reader needs.** If they must learn "DNS" or "password manager"
  to do the task, keep the term. Explain it in plain words the first time it
  appears, then use it the same way after that.
- **Legal text and contracts.** Plain words can change what a clause means in
  law. Flag hard parts and suggest plain versions, but tell the person to check
  the change with whoever owns the text. Don't swap them in silently.

## Keep the meaning

This is where simple writing goes wrong. A short sentence that says something
false is worse than a long one that's true. After every fix or rewrite, read
the old and new versions side by side and check:

- **Every fact is still there:** each number, date, name, price, limit and
  step.
- **Every condition is still there:** "if", "unless", "only", "until",
  "except". These are the words most often lost.
- **Negatives point the same way.** "Not", "never", "no longer" didn't
  flip or drop.
- **How sure it is stays the same.** "May" didn't become "will". "Must" didn't
  become "should". "Some" didn't become "all". Don't make a claim stronger to
  make it shorter.
- **Warnings stay strong and stay first.** If the old text warned about data
  loss, cost or safety, the new one does too, before the reader acts.
- **Nothing new was added.** No facts, promises or reasons the writer didn't
  give. If the old text was vague and you can't tell what it meant, ask. Don't
  guess.

If you can't make a sentence simple without changing what it means, leave it
longer and say why.

## Measure

`scripts/readability.mjs` scores English text and points at what to fix. It
needs Node 18 or newer and nothing else. Run it from this skill's folder:

```bash
node <skill-folder>/scripts/readability.mjs page.md          # a file or several
pbpaste | node <skill-folder>/scripts/readability.mjs        # or stdin
node <skill-folder>/scripts/readability.mjs page.md --json   # for you to read back
```

It reports the Flesch-Kincaid grade and lists what pulls it up: sentences over
20 words, words from the swap list, phrases that may be passive, and words of 3
or more syllables. Each comes with its line number. It skips code blocks, tables, front matter, URLs and inline code,
so Markdown docs can be checked as they are. `--target 6` changes the goal.
`--max-words 25` changes the long-sentence limit. `--check` exits with 1 when a
file is over target, which is useful in CI.

Grade 5 passes while the score is under 6.0. Use the score as a guide, not a
goal:

- It only counts sentence length and syllables. It can't tell if a sentence
  makes sense, or if "the" and "therefore" are in the right place.
- **Don't chase the number.** Choppy fragments and baby talk score well and
  read badly. If the text is clear and the score is 6.5, that's fine; say so.
- Some long words are easy ("everyone", "family", "computer"). Some needed
  terms are long ("encryption"). Swap a long word only when a shorter common
  one means the same.
- Under 100 words, the score is a loose guess. Read it yourself.
- It works for English only. For other languages, use the rules and the
  meaning check, and skip the score. Tell the person you did.

If Node isn't there, skip the score and say so. The rules and the meaning
check are the real work.

## What to give back

**Check.** Start with one line: the grade, and whether it's easy to read. Then
list the top problems, worst first, each with its line (or a short quote) and a
fixed version:

> **Grade 9.4, hard to read.** 6 long sentences, 4 hard words.
>
> 1. L12, 31 words: "When you are setting up the account for the first time,
>    which you only need to do once, …" → "You set up your account once. Do it
>    the first time you sign in."

Stop after about 10 items. If there are more, say how many and which kind.

**Fix.** Edit the file in place, or return the edited text if it came in the
chat. Then give the score before and after, and a short list of what changed.
Say if you left anything hard on purpose, and why.

**Rewrite.** Return the new text. Then give the score before and after, and
anything from the meaning check you weren't sure of. Put the questions there,
not inside the text.

## Examples

**Before** (grade 17):

> In order to ensure the continued security of your account, it is
> recommended that users periodically update their password, as failure to do
> so may result in unauthorized access.

**After** (grade 2):

> Change your password now and then. This keeps other people out of your
> account.

Same facts: a reason (security), an action (update the password), a risk
(someone gets in). "May" stays soft: "keeps people out" doesn't promise
anything new. "Recommended" became a plain request, which is what it was.

**Before** (an error message, grade 13):

> Authentication failed due to invalid credentials. Please verify your
> information and attempt the operation again.

**After** (grade 3):

> That username or password is wrong. Check them and try again.

**A case to leave alone:**

> Run `npm run build` before you deploy.

It's short and clear. The command stays as it is. Don't touch it.
