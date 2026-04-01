# Custom Patches for Backstage Scaffolder Plugins

This directory contains git patches (`.patch` files) that represent all custom modifications made to the scaffolder plugins on the `1.44.2` branch.

## Why Patches?

Patches provide a **version-independent, git-native** way to track and reapply custom changes. They can be applied to any Backstage version, making upgrades easier.

## How to Apply Patches

```bash
# Apply a single patch
git apply --reject .custom-patches/v1.44.2/0001-*.patch

# Apply all patches in order
for patch in .custom-patches/v1.44.2/*.patch; do
  git apply --reject "$patch"
done

# Apply with 3-way merge (handles conflicts better)
git apply -p1 < .custom-patches/v1.44.2/0001-*.patch
```

## Patch Descriptions

### 0001-updates-drop-down-for-scaffolder-react.patch

**Size:** 5.1 KB  
**Change Type:** UI Enhancement  
**Files Modified:** 1

- **plugins/scaffolder-react/src/next/components/TaskSteps/TaskSteps.tsx**

**What it does:** Wraps the MuiStepper component in a Material-UI Accordion to make task steps collapsible. Adds accordion state management and imports.

**Lines changed:** +62/-35  
**Upstream conflict risk:** MEDIUM (stakeholder likely touches TaskSteps)  
**Critical to preserve:** YES (user-facing feature)

**Test cases:**

- Accordion expands/collapses when clicked
- Task steps display correctly in expanded state
- Stepper navigation still works properly

---

### 0002-updates-packages-remove-npm-rc-and-yarn-rc.patch

**Size:** 92 KB  
**Change Type:** Namespace Rebranding  
**Files Modified:** 14

**What it does:** Updates package names and imports from `@backstage` to `@bip-bih` namespace across multiple files. Mechanical find-and-replace of import statements.

**Examples:**

```
- import { formFieldsApiRef } from '@backstage/plugin-scaffolder-react/alpha'
+ import { formFieldsApiRef } from '@bip-bih/plugin-scaffolder-react/alpha'
```

**Upstream conflict risk:** CRITICAL (affects nearly every file)  
**Automation approach:** Use regex find-and-replace on all imports  
**Can be auto-resolved:** YES

**Test cases:**

- All `@backstage/plugin-scaffolder` imports resolve to `@bip-bih`
- No missing module errors on build
- Type checking passes

---

### 0003-updates-to-bid-bih.patch

**Size:** 277 KB  
**Change Type:** Namespace Rebranding (continued)  
**Files Modified:** 13

**What it does:** Additional namespace updates across scaffolder and scaffolder-react plugins.

**Upstream conflict risk:** CRITICAL  
**Automation approach:** Regex find-and-replace  
**Can be auto-resolved:** YES

---

### 0004-working-publication-to-nexus.patch & 0005-working-publication-to-nexus.patch

**Sizes:** 268 KB, 263 KB  
**Change Type:** Publishing Configuration  
**Purpose:** Configure plugins for publishing to internal Nexus registry

**What they do:**

- Restructure package/ directory layout for Nexus publication workflow
- Update package.json with Nexus registry configuration
- Generate CHANGELOG and README metadata for releases

**Notable changes:**

```json
{
  "publishConfig": {
    "registry": "https://nexus.dev.bip.va.gov/repository/npm-internal/"
  }
}
```

**Upstream conflict risk:** LOW (publishing is independent)  
**Can be auto-resolved:** YES (JSON merge)

**Test cases:**

- publishConfig.registry points to Nexus
- CHANGELOG.md exists and is properly formatted
- Package structure is correct for publication

---

### 0006-updates-docs-and-tsc-error.patch

**Size:** 1.0 KB  
**Change Type:** Minor Documentation Fix  
**Files Modified:** 1

**What it does:** Fixes a TypeScript test documentation comment.

**Upstream conflict risk:** VERY LOW  
**Can be auto-resolved:** YES

---

### 0007-adds-FormContextProvider.patch

**Size:** 270 KB  
**Change Type:** NEW FEATURE  
**Files Modified:** 3

- **plugins/scaffolder-react/src/formContext/FormContext.tsx** (NEW FILE)
- **plugins/scaffolder-react/src/formContext/index.ts** (NEW FILE)
- **plugins/scaffolder-react/src/index.ts** (MODIFIED)
- **plugins/scaffolder-react/src/next/components/Stepper/Stepper.tsx** (MODIFIED)
- **plugins/scaffolder/package.json** (MODIFIED)

**What it does:** Adds a new React Context provider for managing scaffolder form data across components.

**New exports:**

```typescript
export { FormContextProvider } from './formContext/FormContext';
export { useTemplateFormData } from './formContext/FormContext';
export type { ScaffolderUseTemplateFormData } from './formContext/FormContext';
```

**Usage:**

```typescript
<FormContextProvider initialFormData={data}>
  <YourComponent />
</FormContextProvider>;

// In component:
const { formData, setFormData } = useTemplateFormData();
```

**Upstream conflict risk:** LOW (new files don't exist in upstream)  
**Can be auto-resolved:** YES

**Test cases:**

- FormContextProvider wraps children without errors
- useTemplateFormData hook returns correct data
- setFormData updates context correctly
- Hook throws error when used outside provider
- Stepper integration works properly

---

## Applying Patches to New Versions

When upgrading to a new Backstage version (e.g., v1.49.2 → v1.50.0):

### Step 1: Analyze Conflicts

```bash
# Check if patches apply cleanly
for patch in .custom-patches/v1.44.2/*.patch; do
  git apply --check "$patch" || echo "CONFLICT in $patch"
done
```

### Step 2: Update Patches for Conflict Resolution

Some patches (especially namespace rebranding) need to be updated for new versions. This is typically done by:

1. Using `--3way` merge
2. Manually resolving conflicts for files that changed
3. Re-generating the patch file

### Step 3: Generate New Patches

After successfully applying all patches to the new version:

```bash
git format-patch v1.50.0..custom/v1.50.0 -o .custom-patches/v1.50.0/
```

This creates `.custom-patches/v1.50.0/` with all customizations on the new version.

---

## Patch Metadata Mapping

Each patch corresponds to a custom change defined in `.custom-changes-metadata.json`:

| Patch | Metadata ID                  | Type                 | Status      |
| ----- | ---------------------------- | -------------------- | ----------- |
| 0001  | tasksteps-accordion-wrapper  | ui-enhancement       | ✅ PRESERVE |
| 0002  | namespace-rebranding-bip-bih | namespace-rebranding | ✅ PRESERVE |
| 0003  | namespace-rebranding-bip-bih | namespace-rebranding | ✅ PRESERVE |
| 0004  | nexus-publishing-config      | publishing-config    | ✅ PRESERVE |
| 0005  | nexus-publishing-config      | publishing-config    | ✅ PRESERVE |
| 0006  | (minor fix)                  | documentation        | ✅ PRESERVE |
| 0007  | form-context-provider        | new-feature          | ✅ PRESERVE |

---

## Troubleshooting Patch Application

### Patch fails with "Hunk FAILED"

This means the context around the change has been modified by upstream.

**Resolution:**

1. Use `--3way` merge: `git apply --3way <patch>`
2. Or use `git apply --reject` to create `.rej` files
3. Manually edit the corresponding source file
4. Accept or reject the hunk interactively

### Patch applies but tests fail

The patch applied mechanically but the underlying code has API changes.

**Resolution:**

1. Identify which test fails: `CI=1 yarn test plugins/scaffolder-react`
2. Look at the error message to find the API change
3. Update the custom code to match new upstream APIs
4. Generate a new patch: `git format-patch v1.50.0..custom/v1.50.0`

### Namespace patches create conflicts everywhere

This is expected - the namespace rebranding is global.

**Resolution (automated):**

```bash
# After merging upstream, do find-and-replace
find plugins/scaffolder* -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.yaml" \) | \
  xargs sed -i 's/@backstage\/plugin-scaffolder/@bip-bih\/plugin-scaffolder/g'

# Verify
grep -r "@backstage/plugin-scaffolder" plugins/scaffolder* && echo "FAILED" || echo "✓ ALL REPLACED"
```

---

## Tools for Patch Management

### View patch contents

```bash
git show < .custom-patches/v1.44.2/0001-*.patch

# Or use patch tool
patch --dry-run < .custom-patches/v1.44.2/0001-*.patch
```

### Test if patch applies

```bash
git apply --check .custom-patches/v1.44.2/0001-*.patch
```

### Apply with interactive hunk selection

```bash
git apply .custom-patches/v1.44.2/0001-*.patch --reject
# Fix *.rej files manually
# git add and commit
```

### Update a patch after fixing conflicts

```bash
# After resolving conflicts and committing:
git format-patch v1.44.2..<commit-hash> -o .custom-patches/v1.44.2/
```

---

## For AI Agents / Automated Upgrade

When processing these patches:

1. **Read metadata first:** `.custom-changes-metadata.json` tells you what each patch does
2. **Check applicability:** Use `git apply --check` for each patch
3. **Handle by type:**
   - `new-feature` (0007): Straightforward, safe to apply
   - `ui-enhancement` (0001): May need manual review for API changes
   - `namespace-rebranding` (0002-0003): Use automated regex replace
   - `publishing-config` (0004-0005): Use JSON merge strategy
4. **Test thoroughly:** Run full test suite after applying
5. **Document changes:** Create changesets for publishable changes
