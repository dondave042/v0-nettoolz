---
name: skill-publishing-workflow
description: 'Create and publish a reusable SKILL.md from conversation context. Use for extracting workflows, drafting skill files, handling ambiguity, finalizing publication, and generating follow-up prompt examples.'
argument-hint: 'Describe the workflow topic and whether you want a checklist or a full multi-step process'
---

# Skill Publishing Workflow

## What It Produces

This skill creates and publishes a complete workspace skill under `.github/skills/<name>/SKILL.md`.

It outputs:
- A valid SKILL.md with correct frontmatter
- A structured workflow with branching decisions
- Quality checks for completion
- Example prompts to exercise the new skill

## When to Use

- You want to turn a repeated process into a reusable skill
- You need a project-scoped skill for your repository
- You want a publish-ready SKILL.md with minimal back-and-forth

## Procedure

1. Identify the source workflow
- Review conversation history and extract repeatable steps
- Capture decision points and expected outcomes
- If no clear workflow is present, switch to fallback intake

2. Fallback intake when workflow is unclear
- Ask for the target outcome
- Ask whether scope is workspace or personal
- Ask whether format is quick checklist or full multi-step workflow

3. Select publication scope
- Workspace scope: publish to `.github/skills/<skill-name>/SKILL.md`
- Personal scope: publish to `~/.copilot/skills/<skill-name>/SKILL.md`

4. Draft SKILL.md
- Add YAML frontmatter with:
  - `name` matching the folder name exactly
  - `description` with strong trigger keywords and use cases
  - optional `argument-hint` for slash invocation clarity
- Add body sections:
  - What it produces
  - When to use
  - Step-by-step procedure
  - Decision branches
  - Quality checks

5. Validate publication quality
- Confirm folder name equals frontmatter name
- Confirm YAML is syntactically valid and quoted where needed
- Confirm description is specific and discoverable
- Confirm steps are executable and ordered
- Confirm no missing dependencies or undefined references

6. Finalize and publish
- Save the file to the selected scope
- Summarize what the skill now does
- Provide 3 to 5 example prompts to test it
- Suggest related next customizations

## Decision Branches

- If workflow is clear from context: skip intake questions and draft directly
- If workflow is partial: draft first, then ask only the highest-impact clarification
- If user requests immediate publishing: use best defaults and note assumptions

## Quality Checks

- SKILL.md exists in the expected scope path
- Frontmatter fields are valid and complete
- Description includes trigger terms and practical use cases
- Procedure includes branching logic and completion criteria
- Published skill is ready for slash invocation

## Example Prompts

- "/skill-publishing-workflow Convert our release hotfix process into a reusable skill"
- "/skill-publishing-workflow Build a checklist-style skill for API incident triage"
- "/skill-publishing-workflow Create a full workflow skill for code review and regression checks"
- "/skill-publishing-workflow Publish a workspace skill for onboarding new contributors"
