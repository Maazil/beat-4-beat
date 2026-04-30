# Skills Authoring Guide

Skills are on-demand context files that Claude loads when relevant. They extend `AGENTS.md` with deep-dive workflows, code templates, and verification steps.

## Core Principles

### Conciseness is key

Claude is already very smart. Only add context it doesn't already have. Challenge each piece of information:

- "Does Claude really need this explanation?"
- "Can I assume Claude knows this?"
- "Does this paragraph justify its token cost?"

At startup only metadata (name + description) is pre-loaded. SKILL.md is read when the skill becomes relevant, and additional files only as needed — but once loaded, every token competes with conversation history.

### Token budget

Keep SKILL.md body **under 500 lines**. If content exceeds this, split into separate files using progressive disclosure (see below).

### Match specificity to fragility (degrees of freedom)

- **High freedom** (text instructions) — when multiple approaches are valid and decisions depend on context. Example: code review guidelines.
- **Medium freedom** (pseudocode/templates with params) — when a preferred pattern exists but some variation is acceptable. Example: report generation.
- **Low freedom** (exact scripts, no params) — when operations are fragile and consistency is critical. Example: database migrations that must run in exact sequence.

Think of Claude as a robot on a path: narrow bridge with cliffs = low freedom (exact instructions), open field = high freedom (general direction).

## When to Create a Skill

Create a skill when content is:
- **Too detailed for AGENTS.md** (code templates, multi-step workflows, diagnostic procedures)
- **Only relevant for specific tasks** (not every session needs it)
- **Self-contained enough to load independently**

Do NOT create a skill for:
- One-liner rules or guardrails (keep those in AGENTS.md)
- Content every agent session needs (that's what AGENTS.md is for)
- Simple facts without actionable steps

## File Structure

```
.claude/skills/
├── my-skill/
│   └── SKILL.md          # Required: frontmatter + content
│   └── workflow.md        # Optional: supplementary files
│   └── examples.md        # Optional: referenced from SKILL.md
└── README.md              # This file
```

## SKILL.md Format

```yaml
---
name: my-skill
description: >
  What this skill covers and when to use it. Include key file names,
  concepts, and trigger phrases so Claude can match user intent to this
  skill. This is the primary field Claude uses for auto-activation.
---
```

### Supported Frontmatter Fields

All fields are optional. Only `description` is recommended so Claude knows when to use the skill.

| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | Display name. If omitted, defaults to the skill's directory name. Max 64 characters, lowercase letters/numbers/hyphens only; reserved words `anthropic` and `claude` are not allowed. |
| `description` | Recommended | What the skill does and when to use it. **This is how Claude decides to auto-load the skill.** Hard cap of 1024 characters; the combined `description` + `when_to_use` text is truncated at 1,536 characters in the skill listing, so front-load the key use case. |
| `when_to_use` | No | Additional triggers — example phrases or scenarios. Appended to `description` in the skill listing and counts toward the 1,536-character cap. |
| `argument-hint` | No | Hint shown in autocomplete (e.g. `[issue-number]`, `[filename] [format]`). |
| `arguments` | No | Named positional arguments for `$name` substitution. Space-separated string or YAML list; names map to argument positions in order. |
| `user-invocable` | No | Set to `false` to hide from the `/` slash-command menu. Claude can still load it. |
| `disable-model-invocation` | No | Set to `true` to prevent Claude from auto-triggering. Skill stays user-invocable via `/name`. |
| `allowed-tools` | No | Tools Claude can use without permission while this skill is active. |
| `model` | No | Model override for the skill. |
| `effort` | No | Effort level (`low`, `medium`, `high`, `xhigh`, `max`). Overrides session effort while the skill is active. |
| `context` | No | Set to `fork` to run in an isolated subagent context. |
| `agent` | No | Subagent type to use with `context: fork`. |
| `paths` | No | Glob patterns that scope auto-activation to matching files (useful for monorepo layouts). |
| `hooks` | No | Hooks scoped to this skill's lifecycle. |
| `shell` | No | `bash` (default) or `powershell` for `` !`command` `` blocks executed during skill rendering. |

Only use fields from this table. Unknown fields are ignored by Claude Code.

### Writing Good Descriptions

The `description` is the single most important field. Claude uses it to decide when to auto-load the skill. Include:

- **What the skill covers** (the topic)
- **When to use it** (the trigger scenario)
- **Key file names** mentioned in the skill (e.g. `config-shared.ts`, `entry-base.ts`)
- **Key concepts/keywords** a user or agent might mention (e.g. "DCE", "feature flag", "vendored React")

**Front-load the key use case.** `description` is hard-capped at 1024 characters, and the combined `description` + `when_to_use` text is truncated at 1,536 characters in the skill listing — anything past that cap is invisible to Claude when it's deciding whether to load your skill. Put the trigger and core purpose in the first sentence.

**Always write in third person.** The description is injected into the system prompt, and inconsistent point-of-view causes discovery problems.

- Good: "Processes Excel files and generates reports"
- Avoid: "I can help you process Excel files"
- Avoid: "You can use this to process Excel files"

```yaml
# Bad: too vague, won't match well
description: Helps with flags.

# Good: specific, includes file names and keywords
description: >
  How to add or modify Next.js experimental feature flags end-to-end.
  Use when editing config-shared.ts, config-schema.ts, define-env-plugin.ts,
  next-server.ts, export/worker.ts, or module.compiled.js.
```

## Content Guidelines

### Relationship to AGENTS.md

AGENTS.md holds **always-loaded guardrails** (one-liner rules every session needs). Skills hold **deep-dive content** loaded on demand.

- AGENTS.md should have a one-liner version of any critical rule
- Skills expand on those rules with verification steps, code examples, and context
- AGENTS.md points to skills via `$skill-name` references
- Skills should not duplicate AGENTS.md content; they should go deeper

### Structure a Skill for Action

Skills should tell the agent what to **do**, not just what to **know**:

- Lead with a clear "Use this skill when..." statement
- Include step-by-step procedures where applicable
- Add code templates ready to adapt
- End with verification commands
- Cross-reference related skills with a "Related Skills" section

### Naming

- Prefer **gerund form** (verb + -ing) to clearly describe the activity: `building-forms`, `processing-pdfs`, `managing-databases`
- Acceptable alternatives: noun phrases (`pdf-processing`), action-oriented (`process-pdfs`)
- Avoid vague names: `helper`, `utils`, `tools`, `documents`
- No repo-name prefix (skills are already scoped to this repo by being in `.claude/skills/`)
- Use hyphens for multi-word names, lowercase only
- **Format constraints** (apply to both directory names and any explicit `name` field): max 64 characters, lowercase letters/numbers/hyphens only. Reserved words `anthropic` and `claude` are not allowed.

### Supplementary Files

For complex skills, split into a hub SKILL.md + detail files:

```
pr-status-triage/
├── SKILL.md         # Overview + quick commands
├── workflow.md      # Detailed prioritization and patterns
└── local-repro.md   # CI env matching guide
```

Reference detail files from SKILL.md with relative links. Keep SKILL.md scannable as an entry point.

## Progressive Disclosure Patterns

SKILL.md serves as an overview that points Claude to detailed materials as needed. Use these patterns to organize growing skills:

### Pattern 1: High-level guide with references

```markdown
# PDF Processing

## Quick start
[core instructions here]

## Advanced features
**API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
```

### Pattern 2: Domain-specific organization

For skills with multiple domains, organize by domain to avoid loading irrelevant context:

```
bigquery-skill/
├── SKILL.md (overview and navigation)
└── reference/
    ├── finance.md
    ├── sales.md
    └── product.md
```

### Pattern 3: Conditional details

```markdown
**Creating new content?** → Follow "Creation workflow" below
**Editing existing content?** → Follow "Editing workflow" below
```

If workflows become large, push them into separate files and tell Claude to read the appropriate file based on the task.

### Keep references one level deep

All reference files should link directly from SKILL.md. Avoid chains like SKILL.md → advanced.md → details.md — Claude may only partially read deeply nested files.

### Table of contents for long files

For reference files longer than 100 lines, include a TOC at the top so Claude can see the full scope even when previewing.

## Workflow & Feedback Patterns

### Checklist pattern

For complex multi-step skills, provide a checklist Claude can copy into its response and check off as it progresses:

```markdown
Copy this checklist into your response and tick items off as you complete them:

- [ ] Step 1: Read the relevant config files
- [ ] Step 2: Apply the change
- [ ] Step 3: Run `pnpm ts` to verify types
- [ ] Step 4: Run `pnpm lint` to verify style
- [ ] Step 5: Confirm the dev server still starts cleanly
```

Clear steps prevent Claude from skipping critical validation.

### Feedback loop pattern

For quality-critical tasks, include a validate → fix → repeat loop:

```markdown
1. Make your changes
2. **Validate immediately**: `npm run ts`
3. If validation fails:
   - Review the error
   - Fix the issue
   - Run validation again
4. **Only proceed when validation passes**
```

### Template pattern

Provide templates for output format. Use strict templates when consistency is critical, flexible templates when adaptation is useful:

```markdown
## Strict (API responses, data formats)
ALWAYS use this exact structure: ...

## Flexible (analysis, reports)
Here is a sensible default, but adjust as needed: ...
```

### Examples pattern

Provide input/output pairs when output quality depends on seeing examples — this helps Claude understand the desired style better than descriptions alone.

## Anti-patterns

- **No Windows-style paths** — Always use forward slashes (`reference/guide.md`, not `reference\guide.md`). Unix paths work cross-platform.
- **Don't offer too many options** — Provide a default approach with an escape hatch for edge cases, not a menu of 5 libraries to choose from.
- **No time-sensitive info** — Don't write "before August 2025, use X". Use a "Legacy / old patterns" collapsible section instead.
- **Consistent terminology** — Pick one term and use it throughout (e.g., always "field", not a mix of "field", "box", "element", "control").
