# AI-Assisted Backstage Upgrade Guide

## Quick Start: Upgrading with AI Agent

This guide explains how to use an AI agent to automatically manage Backstage upgrades while preserving your custom changes.

## What Problems Does This Solve?

❌ **Without this system:**

- Manual cherry-picking of 7 commits
- Easy to miss files and changes
- Conflicts across ~336 modified files
- 2-3 hours of error-prone manual work per upgrade

✅ **With this system:**

- Agent analyzes changes automatically
- Patches applied with conflict detection
- ~30 minutes of work, mostly testing
- Clear change inventory and automation rules

---

## The System Components

### 1. **Change Metadata (`.custom-changes-metadata.json`)**

Structured inventory of ALL custom modifications with:

- What changed and why
- Which files are affected
- How to apply changes (automated vs. manual)
- Test cases for validation
- Conflict risk assessment

### 2. **Git Patches (`.custom-patches/v1.44.2/`)**

Portable `.patch` files that can be applied to any Backstage version:

- `0001-updates-drop-down-for-scaffolder-react.patch` → TaskSteps accordion
- `0002-*.patch` + `0003-*.patch` → Namespace rebranding
- `0004-*.patch` + `0005-*.patch` → Nexus publishing
- `0007-adds-FormContextProvider.patch` → New feature

### 3. **Agent Instructions (`CUSTOM_UPGRADE_AGENT.md`)**

Detailed playbook for AI agents including:

- Decision tree for conflict resolution
- Automation rules per change type
- Testing requirements
- Common scenarios and resolutions

### 4. **Patch Documentation (`.custom-patches/README.md`)**

Human-readable guide to understanding patches:

- What each patch does
- Size and conflict risk
- How to apply and debug
- Troubleshooting guide

---

## How to Invoke the AI Upgrade Agent

### Option A: Using This Repository's Agent

**For GitHub Copilot / Claude in VS Code:**

1. Open the VS Code command palette (Cmd+Shift+P)
2. Type "Copilot: Ask"
3. Paste this prompt:

```markdown
I need to upgrade Backstage scaffolder plugins from v1.49.2 to v1.50.0.

I have custom modifications stored in:

- `.custom-changes-metadata.json` — Complete inventory of changes
- `.custom-patches/v1.44.2/` — Git patches for each modification
- `CUSTOM_UPGRADE_AGENT.md` — Detailed agent instructions

Please:

1. Read the metadata file to understand all 4 custom changes
2. Analyze what conflicts will occur on upgrade
3. Create a conflict risk report
4. Apply patches using appropriate strategies (automated vs. manual review)
5. Run full test suite (yarn test, yarn tsc)
6. Generate changesets for any publishable changes
7. Report success/failures and any manual review items needed

Work in branch `custom/v1.50.0` starting from master (which is at v1.50.0).
```

### Option B: Using Custom Agent (Recommended for Enterprise)

```bash
# Create your own agent context:
cat > .agent-context.txt << 'EOF'
Role: Backstage Upgrade Automation Agent
Task: Manage version upgrades of scaffolder plugins
Knowledge Base:
  - .custom-changes-metadata.json
  - CUSTOM_UPGRADE_AGENT.md
  - .custom-patches/README.md
  - .custom-patches/v1.44.2/*.patch

When invoked for upgrade to VERSION:
  1. Fetch upstream refs
  2. Analyze metadata for conflict risk
  3. Apply patches with error handling
  4. Execute test suite
  5. Generate changesets
  6. Report status
EOF
```

### Option C: Step-by-Step Manual with AI Assistance

For more control, use the agent in an assistant capacity:

```markdown
# Step 1: Analyze

I'm upgrading Backstage scaffolder from v1.49.2 to v1.50.0.
Based on .custom-changes-metadata.json, what conflicts should I expect?

# Step 2: Apply Patches

How should I apply these patches in order:

- 0001-updates-drop-down-for-scaffolder-react.patch
- 0007-adds-FormContextProvider.patch
- 0002 and 0003 (namespace rebranding)

# Step 3: Resolve Conflicts

The TaskSteps patch failed. How should I merge:

- Upstream version: [paste file]
- Custom version: [paste file]
- Keep Accordion wrapper but update to new APIs

# Step 4: Test & Validate

Tests are failing in Stepper component.
The error is: [error message]
How do I fix this?
```

---

## Detailed Upgrade Workflow

### Pre-Upgrade (5 minutes)

```bash
# 1. Update master to latest upstream
git checkout master
git pull upstream v1.50.0

# 2. Create custom branch
git checkout -b custom/v1.50.0

# 3. Verify patches exist
ls -la .custom-patches/v1.44.2/
# Should see 7 .patch files
```

### Agent Analysis Phase (Agent runs automatically)

Agent will:

1. Read `.custom-changes-metadata.json`
2. Check which files are in patches
3. See if upstream touches those files
4. Create conflict risk matrix

**Example output:**

```
CONFLICT ANALYSIS: v1.49.2 → v1.50.0

Change: FormContextProvider (formContext/*.tsx)
  Status: ✅ SAFE - not touched by upstream
  Risk: LOW
  Action: Apply patch directly

Change: TaskSteps Accordion
  Status: ⚠️ TaskSteps.tsx modified by upstream
  Risk: MEDIUM
  Action: Apply with --3way, manual review needed
  Conflict lines: 45-78

Change: Namespace Rebranding
  Status: ❌ 27 files touched by upstream
  Risk: CRITICAL
  Action: Automated regex replace after merge
  Strategy: find-and-replace all @backstage imports
```

### Apply Patches Phase (Agent + You)

#### For NEW FEATURES (Low Conflict)

Agent can do this fully automatically:

```bash
git apply --reject < .custom-patches/v1.44.2/0007-adds-FormContextProvider.patch
# Probably succeeds cleanly
```

#### For UI ENHANCEMENTS (Manual Review)

Agent assists with human review:

```bash
git show v1.50.0:plugins/scaffolder-react/src/next/components/TaskSteps/TaskSteps.tsx > /tmp/upstream.tsx
# Compare with current custom implementation
# Agent shows you the diff and suggests merging approach
```

#### For NAMESPACE REBRANDING (Automated Find-Replace)

Agent handles this completely:

```bash
find plugins/scaffolder* -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.yaml" \) | \
  xargs sed -i 's/@backstage\/plugin-scaffolder/@bip-bih\/plugin-scaffolder/g'
```

#### For PUBLISHING CONFIG (JSON Merge)

Agent automates this:

```bash
# Extract custom registry config
# Merge with new upstream package.json
# Preserve publishConfig.registry value
```

### Testing Phase (Fully Automated)

Agent runs:

```bash
# Build
yarn workspace @backstage/plugin-scaffolder build
yarn workspace @backstage/plugin-scaffolder-react build

# Test
CI=1 yarn test plugins/scaffolder
CI=1 yarn test plugins/scaffolder-react

# Type check
yarn tsc --noEmit

# Lint
yarn lint plugins/scaffolder plugins/scaffolder-react
```

Reports back:

- ✅ All builds passed
- ✅ All tests passed (47/47)
- ✅ No type errors
- ⚠️ 3 lint warnings (fixable)

### Changeset Generation (Agent or Manual)

Create changesets for published changes:

```bash
yarn changeset
# Answer: patch
# Description: "Upgrade scaffolder plugins to v1.50.0 with custom features preserved"
# Affected: @bip-bih/plugin-scaffolder-react
```

### Completion (5 minutes)

```bash
# Push branch
git push origin custom/v1.50.0

# Create PR
hub pull-request \
  -b master \
  -h custom/v1.50.0 \
  -t "Upgrade scaffolder to v1.50.0" \
  -d "Upgraded from v1.49.2 preserving custom FormContext, TaskSteps, and namespace"

# Agent reports:
# ✅ All checks passed
# ✅ Ready to merge
# 📋 Summary:
#    - 7 commits applied
#    - 336 files modified
#    - 0 manual conflicts
#    - 4 custom features preserved (FormContext, TaskSteps, @bip-bih namespace, Nexus config)
```

---

## File Reference for Agents/Humans

| File                              | Purpose                                     | When to Read                           |
| --------------------------------- | ------------------------------------------- | -------------------------------------- |
| `.custom-changes-metadata.json`   | Source of truth for custom changes          | When starting upgrade analysis         |
| `CUSTOM_UPGRADE_AGENT.md`         | Detailed agent instructions & decision tree | Agent reads this to understand process |
| `.custom-patches/README.md`       | Human-readable patch descriptions           | When understanding what patches do     |
| `.custom-patches/v1.44.2/*.patch` | Actual git patches                          | Agent applies these to new version     |
| `REVIEWING.md`                    | Project standards for PRs/changesets        | When generating changesets             |
| `STYLE.md`                        | Code style guidelines                       | After patches applied, for linting     |

---

## Configuration for Different Agents

### For Claude / Copilot

These agents understand the full context naturally:

```markdown
# Provide the prompt above with context

# They will read files and understand the patches
```

### For GitHub Actions / CI/CD

Create a workflow:

```yaml
name: Backstage Upgrade

on:
  workflow_dispatch:
    inputs:
      target-version:
        description: 'Target Backstage version (e.g., v1.50.0)'
        required: true

jobs:
  upgrade:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Read custom changes metadata
        id: metadata
        run: cat .custom-changes-metadata.json
      - name: Run upgrade agent
        run: |
          # Agent logic here
          # Uses .custom-patches/ and metadata.json
          # Applies patches with conflict handling
          # Runs test suite
```

### For Local CLI / Shell Script

```bash
#!/bin/bash
# Source .custom-changes-metadata.json
# Loop through patches
# Apply each with appropriate strategy
# Run tests after each
# Report status
```

---

## Future Version Upgrades (Ongoing)

After upgrading to v1.50.0, patches need to be regenerated:

```bash
# Generate NEW patches for v1.50.0
git format-patch v1.50.0..custom/v1.50.0 -o .custom-patches/v1.50.0/

# Next time you upgrade (v1.50.0 → v1.51.0):
# Agent uses new patches from .custom-patches/v1.50.0/
# Creates .custom-patches/v1.51.0/ for next upgrade
```

---

## Troubleshooting Agent Execution

| Issue                     | Cause                        | Solution                                                     |
| ------------------------- | ---------------------------- | ------------------------------------------------------------ |
| Agent can't read metadata | JSON syntax error            | Run `jq . .custom-changes-metadata.json` to validate         |
| Patches don't apply       | Upstream API changed         | Use `--3way` merge, agent assist with manual resolution      |
| Tests fail after patches  | Code incompatibility         | Agent updates code to match new APIs                         |
| Agent stuck on conflicts  | Too many simultaneous issues | Break into phases: apply patches one-by-one, test after each |

---

## Estimated Time Savings

**Manual approach (without patches):**

- Analyze changes: 45 minutes
- Apply patches: 60 minutes
- Resolve conflicts: 30 minutes
- Test and verify: 20 minutes
- **Total: ~3 hours**

**With AI Agent:**

- Setup (one-time): 2 minutes
- Agent analysis & application: 5 minutes
- Manual review (if needed): 10 minutes
- Testing: 10 minutes
- **Total: ~30 minutes per upgrade (87% time savings)**

---

## Questions for the Agent

When invoking the agent, you can ask:

```markdown
1. "What's the conflict risk for each custom change?"
2. "Can you apply the FormContext patch first?"
3. "How should I handle the TaskSteps conflicts?"
4. "Should I accept the upstream version or keep our accordion wrapper?"
5. "Why is test X failing after the patches?"
6. "Generate a changeset for published packages"
7. "What manual steps do I need to do?"
8. "Is the upgrade complete and safe to merge?"
```

---

## Success Checklist

After agent completes upgrade:

- [ ] All 7 patches applied or properly merged
- [ ] FormContextProvider hook works
- [ ] TaskSteps accordion renders
- [ ] @bip-bih imports all resolve
- [ ] Nexus publishing config intact
- [ ] `yarn build` succeeds
- [ ] `CI=1 yarn test` passes
- [ ] `yarn tsc --noEmit` passes
- [ ] No console errors on build
- [ ] Changesets created
- [ ] Branch ready for PR

---

## Next Steps

1. **Save these files to git:**

   ```bash
   git add .custom-changes-metadata.json \
           .custom-patches/ \
           CUSTOM_UPGRADE_AGENT.md \
           .custom-changes-inventory.md
   git commit -m "docs: Add AI-assisted upgrade system for custom plugins"
   git push origin master
   ```

2. **For next upgrade to v1.50.0, invoke agent:**

   ```markdown
   Upgrade Backstage scaffolder plugins from v1.49.2 → v1.50.0
   using AI-assisted patches in .custom-patches/
   ```

3. **Later, regenerate patches for new baseline:**
   ```bash
   git format-patch v1.50.0..custom/v1.50.0 -o .custom-patches/v1.50.0/
   ```
