# STX Apps skills

Free [Agent Skills](https://agentskills.io) for Claude Code and other AI agents.
Each skill is a folder with a `SKILL.md` file that teaches the agent one job.

| skill                                              | what it does                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`5th-grade-reading`](./skills/5th-grade-reading/) | Checks, fixes or rewrites text so a 5th grader can follow it, and keeps the meaning. |

## Install in Claude Code

Add this repo as a plugin marketplace, then install the `stxapps` plugin:

```text
/plugin marketplace add stxapps/skills
/plugin install stxapps@stxapps-skills
```

The skills then show up as `/stxapps:<skill>`, for example
`/stxapps:5th-grade-reading`. You don't have to type the command. Claude uses a
skill on its own when your ask fits it.

**Want the short command?** Copy the folder instead of installing the plugin.
Then it's just `/5th-grade-reading`:

```bash
git clone https://github.com/stxapps/skills.git stxapps-skills
cp -R stxapps-skills/skills/5th-grade-reading ~/.claude/skills/
```

Use a project's `.claude/skills/` folder instead of `~/.claude/skills/` to add
it to one project only.

## Use it somewhere else

- **Claude apps.** Download
  [5th-grade-reading.zip](https://github.com/stxapps/skills/releases/latest/download/5th-grade-reading.zip)
  and upload it in Claude's skill settings.
- **Other agents.** Any agent that reads Agent Skills can use the folder as it
  is. Copy it to where that agent looks for skills.

## 5th-grade-reading

Ask in your own words:

- "Check if docs/setup.md is easy to read."
- "Fix the long sentences in this email."
- "Rewrite this error message so anyone gets it."

It has three jobs. A **check** reports problems and changes nothing. A **fix**
changes only what breaks its rules. A **rewrite** changes as much as it takes.
After a fix or a rewrite, it compares the old and new text. It looks for lost
facts, conditions ("if", "unless", "only") and warnings, and for claims that
got stronger.

It comes with a scorer you can also run yourself. It needs Node 18 or newer
and nothing else:

```bash
node skills/5th-grade-reading/scripts/readability.mjs page.md
```

The scorer gives the Flesch-Kincaid grade. It lists long sentences, hard words
with plain ones to try, and phrases that may be passive, each with its line
number. It skips code, tables and links, so you can run it on Markdown as it
is. Add `--check` to exit with an error when a file is over grade 5, for use
in CI.

**Limits.** The score only counts sentence length and syllables, so treat it
as a guide. It can't tell if a sentence makes sense. It works for English only.
In other languages the skill still uses its rules, but skips the score.

## Work on this repo

```bash
npm test
```

There are no packages to install. The tests use Node's own test runner. CI
also checks that this README and every `SKILL.md` pass the 5th-grade check.
`CLAUDE.md` has the rules for adding a skill.

## License

[MIT](./LICENSE). Made by [STX Apps](https://stxapps.com), a small software
company in Bangkok. We also make [Bracemark](https://bracemark.com), an
end-to-end encrypted bookmark manager.
