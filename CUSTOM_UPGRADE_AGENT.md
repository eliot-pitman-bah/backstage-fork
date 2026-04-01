# Backstage Custom Plugin Upgrade Agent

This document provides instructions for an AI agent to manage upgrades of the Backstage scaffolder plugins while preserving custom modifications.

## Agent Purpose

Manage the process of upgrading Backstage from version X to version Y while:

1. Preserving 4 types of custom changes (FormContext, TaskSteps, namespace rebranding, publishing config)
2. Minimizing manual conflict resolution
3. Creating proper changesets for each modification
4. Validating that tests still pass

## Working with Custom Changes Metadata

All custom changes are documented in `.custom-changes-metadata.json`. This is the source of truth for what needs to be carried forward.

**Key fields for agent decision-making:**

- `type`: Determines handling strategy (ui-enhancement, new-feature, namespace-rebranding, publishing-config)
- `files`: Exact files that contain the change
- `upstreamCompatibility`: How likely to conflict on upgrade (low/medium/high)
- `automationRules`: How to apply this change programmatically

## Upgrade Workflow

### Phase 1: Pre-Upgrade Analysis

**Input:** Current version (e.g., v1.49.2), Target version (e.g., v1.50.0)

**Tasks:**

1. Fetch upstream version tags
2. Review `.custom-changes-metadata.json` for all customizations
3. Analyze what changed in upstream between current → target version
4. For EACH custom change, determine conflict probability:
   - Files touched by upstream → CONFLICT RISK
   - Files not touched → SAFE
5. Create conflict report

**Example Output:**

```markdown
## Upgrade Analysis: v1.49.2 → v1.50.0

### Conflict Risk Assessment

**HIGH RISK:**

- namespace-rebranding (upstream touches 14 files in plugins/scaffolder\*)
- Recommendation: Automated regex replace after merge

**MEDIUM RISK:**

- tasksteps-accordion-wrapper (TaskSteps.tsx modified by upstream)
- Recommendation: Manual 3-way merge review

**LOW RISK:**

- form-context-provider (new files, upstream doesn't touch formContext/)
- form-context-provider (Nexus config isolated to package.json)

### Suggested Approach

1. Create custom/v1.50.0 branch from master
2. Apply patches to custom/v1.50.0
3. Auto-resolve namespace rebranding with regex
4. Manual review for TaskSteps conflicts
5. Run tests and type checking
```

---

### Phase 2: Apply Custom Changes

**Strategy per change type:**

#### For `new-feature` (FormContext)

```bash
# 1. Check if the feature file still doesn't exist in upstream
git show v1.50.0:plugins/scaffolder-react/src/formContext/FormContext.tsx 2>/dev/null || echo "NOT IN UPSTREAM"

# 2. If not present, apply patch directly
git apply --reject patches/0002-FormContextProvider.patch

# 3. Fix any rejections (should be minimal)
# 4. Run tests
```

#### For `ui-enhancement` (TaskSteps)

```bash
# 1. Get 3-way merge view
git show v1.50.0:plugins/scaffolder-react/src/next/components/TaskSteps/TaskSteps.tsx > /tmp/upstream-TaskSteps.tsx

# 2. Compare with custom version
diff /tmp/upstream-TaskSteps.tsx plugins/scaffolder-react/src/next/components/TaskSteps/TaskSteps.tsx

# 3. Manually integrate accordion logic into new structure
# 4. Run tests to verify functionality

# Expected test cases:
# - Accordion expands/collapses
# - Task steps display correctly
# - Stepper handlers still work
```

#### For `namespace-rebranding` (Most Common Conflicts)

```bash
# Use automated regex replacement (SAFE - mechanical transformation)
find plugins/scaffolder* -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.yaml" | \
  xargs sed -i 's/@backstage\/plugin-scaffolder/@bip-bih\/plugin-scaffolder/g'

# Verify replacement
grep -r "@backstage/plugin-scaffolder" plugins/scaffolder* || echo "✓ All imports renamed"
```

#### For `publishing-config`

```bash
# Extract custom publishConfig from current package.json
jq '.publishConfig' plugins/scaffolder-react/package.json > /tmp/custom-publish-config.json

# After upstream merge, restore it
jq '.publishConfig = input' \
  plugins/scaffolder-react/package.json \
  /tmp/custom-publish-config.json > /tmp/temp.json && \
  mv /tmp/temp.json plugins/scaffolder-react/package.json
```

---

### Phase 3: Testing & Validation

**Run the verification suite:**

```bash
# 1. Build both plugins
yarn workspace @backstage/plugin-scaffolder build
yarn workspace @backstage/plugin-scaffolder-react build

# 2. Run tests
CI=1 yarn test plugins/scaffolder --passWithNoTests
CI=1 yarn test plugins/scaffolder-react --passWithNoTests

# 3. Type checking
yarn tsc --noEmit

# 4. Lint
yarn lint plugins/scaffolder plugins/scaffolder-react

# 5. Manual validations
- [ ] FormContext hook works: useTemplateFormData() returns data
- [ ] TaskSteps accordion UI renders: expandable/collapsible
- [ ] @bip-bih imports all resolve correctly
- [ ] No console errors about missing modules
```

**If tests fail:**

1. Identify which custom change is causing the failure
2. Update that change to match upstream API changes
3. Record the change in a new commit message
4. Re-run tests

---

### Phase 4: Commit & Changeset Generation

**Generate changesets for each custom change:**

The changes should be documented so they can be published.

```bash
# For FormContext (if modified)
yarn changeset
# - Major/minor/patch: patch (new optional feature)
# - Description: "Add FormContextProvider for cross-component form state management"
# - Affected: @backstage/plugin-scaffolder-react

# For TaskSteps (if modified)
# - Major/minor/patch: patch (UI enhancement)
# - Description: "Update TaskSteps accordion wrapper for v1.50.0 compatibility"

# For namespace rebranding (if not already documented)
# Note: This is not a typical changeset - it's part of custom namespace usage

# For Nexus config (if changed)
# Note: This is typically not versioned dependency change
```

---

## Decision Tree for Agent

```
START: Need to upgrade Backstage
  |
  ├─ ANALYZE Phase
  │   ├─ Fetch [current-version] and [target-version] tags
  │   ├─ Read .custom-changes-metadata.json
  │   ├─ For each change, check if upstream touches those files
  │   └─ Create conflict risk assessment
  │
  ├─ Is risk CRITICAL?
  │   ├─ YES → Require human review before proceeding
  │   └─ NO → Continue to apply changes
  │
  ├─ APPLY Phase
  │   ├─ For each change type:
  │   │   ├─ new-feature → git apply patch
  │   │   ├─ ui-enhancement → 3-way merge with manual review
  │   │   ├─ namespace-rebranding → automated regex replace
  │   │   └─ publishing-config → json merge with custom preservation
  │   │
  │   └─ Resolve conflicts as needed
  │
  ├─ TEST Phase
  │   ├─ Run builds: yarn build
  │   ├─ Run tests: CI=1 yarn test
  │   ├─ Run type checker: yarn tsc
  │   ├─ Run linter: yarn lint
  │   │
  │   └─ Are all tests passing?
  │       ├─ YES → Continue to commit
  │       └─ NO → Identify failing change, update it, re-test
  │
  ├─ COMMIT Phase
  │   ├─ Create branch: git checkout -b custom/v[TARGET-VERSION]
  │   ├─ Commit all changes with descriptive messages
  │   ├─ Push branch: git push origin custom/v[TARGET-VERSION]
  │   └─ Generate changesets for public publications
  │
  └─ DONE: Upgrade complete, ready for deployment
```

---

## Example: Agent Execution for v1.49.2 → v1.50.0

**Agent Invocation:**

```
Upgrade Backstage scaffolder plugins from v1.49.2 to v1.50.0 while preserving:
1. FormContextProvider newfeature
2. TaskSteps accordion wrapper
3. @bip-bih namespace rebranding
4. Nexus publishing configuration

Please:
1. Analyze conflict risk for each custom change
2. Create a detailed conflict report
3. Apply all changes with appropriate strategies
4. Run full test suite
5. Generate changesets
6. Report status and any manual reviews needed
```

**Expected Agent Output:**

- Conflict risk assessment
- List of files modified
- Test results
- Any manual review items
- Changeset files created
- Ready-to-commit branch name and commands

---

## Common Scenarios

### Scenario 1: TaskSteps.tsx Modified by Upstream

**Detection:** File appears in both custom changes and upstream diff

**Resolution:**

1. Get both versions: custom, upstream, common ancestor
2. Perform 3-way merge
3. Integrate Accordion wrapper into new TaskSteps structure
4. Manual review of test cases:
   - Accordion state management works
   - Stepper logic still functions
   - New upstream features are preserved

### Scenario 2: Namespace Conflict Explosion

**Detection:** Upstream adds 10+ new import statements from @backstage/plugin-scaffolder\*

**Resolution:**

1. After merging upstream, run regex replace for all @backstage → @bip-bih
2. Verify with: `grep -r "@backstage/plugin-scaffolder" plugins/scaffolder*`
3. No manual review needed - this is mechanical replacement

### Scenario 3: FormContext Not Touched by Upstream

**Detection:** formContext/ directory doesn't exist in upstream v1.50.0

**Resolution:**

1. Cherry-pick / apply patch - should merge cleanly
2. No conflict review needed
3. Verify hook still works: `grep -r "useTemplateFormData" plugins/scaffolder*`

---

## Error Handling

| Error                    | Cause                                        | Resolution                              |
| ------------------------ | -------------------------------------------- | --------------------------------------- |
| Patch fails to apply     | Upstream changed context lines               | Manual 3-way merge required             |
| Tests fail after changes | API changes in upstream                      | Update custom code to match new APIs    |
| Namespace conflicts      | Only 2-3 files touched by upstream           | Manually edit those specific files      |
| Circular dependency      | New upstream code conflicts with FormContext | Extract FormContext into separate layer |

---

## Agent Knowledge Base

**Files to reference:**

- `.custom-changes-metadata.json` - Source of truth for custom changes
- `plugins/scaffolder/package.json` - Version, namespace, registry config
- `plugins/scaffolder-react/package.json` - Version, namespace, registry config
- `REVIEWING.md` - Project standards for changesets and PRs
- `STYLE.md` - Code style guidelines

**Git commands to know:**

```bash
git format-patch <from>..<to> -o <output-dir>  # Generate patches
git apply <patch-file>                          # Apply patch
git apply --reject <patch-file>                 # Apply with rejections
git show <commit>:<file>                        # Get file from commit
git diff --no-index <file1> <file2>             # Compare files
git cherry-pick <commit>                        # Apply single commit
git rebase <branch>                             # Rebase changes
```

**Testing commands:**

```bash
yarn workspace @backstage/plugin-scaffolder build     # Build scaffolder
yarn workspace @backstage/plugin-scaffolder-react build  # Build scaffolder-react
CI=1 yarn test <path>                                 # Run tests
yarn tsc --noEmit                                      # Type check
yarn lint --fix                                        # Lint + fix
yarn prettier --write <paths>                          # Format code
```

---

## Success Criteria

Upgrade is complete when:

- ✅ All 4 custom changes are present and functional
- ✅ All upstream features from new version are preserved
- ✅ Tests pass: `yarn test plugins/scaffolder*`
- ✅ Type checking passes: `yarn tsc`
- ✅ No console errors about missing modules
- ✅ Changesets created for published packages
- ✅ Branch pushed and ready for PR review
