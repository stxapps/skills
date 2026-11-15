# stxapps/skills

Free Agent Skills from STX Apps, published as a Claude Code plugin marketplace.
Public, MIT. No dependencies: scripts are Node 18+ built-ins only.

- **Layout.** One folder per skill in `skills/<name>/`: `SKILL.md`, plus
  `scripts/` and `references/` when it needs them. A skill's tests go in
  `tests/<name>.test.mjs`, not in its folder, so they don't ship with it.
  `npm test` runs them all.
- **Plugins.** `.claude-plugin/marketplace.json` lists them. The `stxapps`
  plugin holds the writing skills, so the command is `/stxapps:<skill>`. A
  new writing skill goes in its `skills` array. A skill that isn't about
  writing gets a new plugin named for its topic (`stxapps-<topic>`), so no one
  installs a skill they didn't ask for. Bump the plugin's `version` when its
  skills change.
- **Names.** Lowercase letters, digits and hyphens, the same in the folder and
  in `name:`. Renaming a skill breaks every install of it, so pick once.
- **Plain writing.** `README.md` and every `SKILL.md` must pass
  `node skills/5th-grade-reading/scripts/readability.mjs --check`. CI runs it.
  A skill about plain writing has to be written plainly.
- **Claims.** Say only what the skill does. A readability score is a guide,
  not proof that a text is easy, accessible or compliant with any standard.
- **The page.** Each skill can have a page on stxapps.com, which lives in its
  own repo. The page describes the skill and links here; it never copies the
  files, so there is one source.
