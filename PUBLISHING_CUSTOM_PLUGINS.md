# Publishing Custom Backstage Plugins to Nexus

This guide documents the process for publishing custom-scoped Backstage plugins (`@bip-bih/*`) to the internal Nexus npm registry.

## Prerequisites

- VPN connection to VA network
- Nexus authentication configured in `~/.npmrc`
- Node.js and npm installed
- Access to the Nexus npm registry at `https://nexus.dev.bip.va.gov/repository/npm-internal/`

## Overview

The process involves:

1. Renaming packages to use the `@bip-bih` scope
2. Building the packages to generate `dist/` files
3. Resolving workspace dependencies to actual version numbers
4. Updating package.json to point to built files
5. Publishing to Nexus

## Step-by-Step Process

### 1. Rename Package to Custom Scope

Update the plugin's `package.json`:

```json
{
  "name": "@bip-bih/plugin-scaffolder",
  "version": "1.34.7",
  "publishConfig": {
    "access": "public",
    "registry": "https://nexus.dev.bip.va.gov/repository/npm-internal/"
  }
}
```

Update the `pluginPackages` array to reference the new name:

```json
"backstage": {
  "pluginPackages": [
    "@bip-bih/plugin-scaffolder",
    "@bip-bih/plugin-scaffolder-react"
  ]
}
```

### 2. Build the Package

Build the package to generate TypeScript declarations and bundled JavaScript:

```bash
yarn tsc          # Generate type declarations
cd plugins/your-plugin
yarn run prepack  # Run backstage-cli prepack
yarn run build    # Build the plugin
```

This creates the `dist/` directory with compiled files.

### 3. Resolve Workspace Dependencies

**Critical Issue**: Backstage uses `workspace:^` dependencies which must be resolved to actual version numbers before publishing.

Create a reference by checking the `package/` directory after running `yarn pack`:

```bash
yarn pack
tar -xzf package.tgz
cat package/package.json | grep -A 15 '"dependencies"'
```

Copy the resolved dependencies from `package/package.json` back to the source `package.json`, replacing all `workspace:^` references with actual versions like `^1.12.0`.

**Example transformation**:

```json
// Before (source package.json)
"dependencies": {
  "@backstage/catalog-client": "workspace:^",
  "@backstage/core-plugin-api": "workspace:^"
}

// After (resolved from package/package.json)
"dependencies": {
  "@backstage/catalog-client": "^1.12.0",
  "@backstage/core-plugin-api": "^1.11.1"
}
```

### 4. Update Package Entry Points

**Critical Issue**: The default package.json points to source files (`src/`) but must point to built files (`dist/`) for publication.

Update these fields in `package.json`:

```json
{
  "exports": {
    ".": "./dist/index.esm.js",
    "./alpha": "./dist/alpha.esm.js",
    "./package.json": "./package.json"
  },
  "main": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "typesVersions": {
    "*": {
      "alpha": ["dist/alpha.d.ts"],
      "package.json": ["package.json"]
    }
  },
  "files": ["dist"]
}
```

### 5. Publish to Nexus

Ensure you're connected to the VA VPN, then:

```bash
cd plugins/your-plugin
npm publish
```

The package will be published to Nexus using the registry specified in `publishConfig`.

### 6. Verify Publication

Check that the published package has resolved dependencies:

```bash
npm view @bip-bih/your-plugin@version dependencies --json
```

Ensure there are **no** `workspace:^` references in the output.

## Common Issues and Solutions

### Issue 1: `workspace:^` Dependencies in Published Package

**Symptom**: After publishing, consumers get errors like:

```
Error: @backstage/catalog-client@workspace:^: Workspace not found
```

**Cause**: The package was published with unresolved workspace dependencies.

**Solution**:

1. Run `yarn pack` to generate `package.tgz`
2. Extract and inspect `package/package.json`
3. Copy the resolved dependency versions back to source `package.json`
4. Bump version and republish

### Issue 2: Module Not Found Errors

**Symptom**: Consumers get errors like:

```
Module not found: Can't resolve './plugin' in 'node_modules/@bip-bih/plugin-scaffolder/src'
```

**Cause**: The package.json points to source files (`src/`) instead of built files (`dist/`).

**Solution**: Update `main`, `types`, `exports`, and `typesVersions` fields to point to `dist/` paths as shown in Step 4 above.

### Issue 3: SSL/TLS Certificate Errors

**Symptom**:

```
RequestError: unable to get local issuer certificate
```

**Solution**: Disable SSL verification (temporary, for internal registry):

- Add to `.yarnrc.yml`: `enableStrictSsl: false`
- Add to `.npmrc`: `strict-ssl=false`
- Or set environment variable: `NODE_TLS_REJECT_UNAUTHORIZED=0`

### Issue 4: Repository Does Not Allow Updating Assets

**Symptom**:

```
npm error 400 Bad Request - Repository does not allow updating assets
```

**Cause**: Attempting to republish the same version.

**Solution**: Bump the version number in `package.json` before republishing.

### Issue 5: VPN Connection Required

**Symptom**:

```
npm error errno ENOTFOUND
npm error network request to https://nexus.dev.bip.va.gov failed
```

**Cause**: Not connected to VA VPN.

**Solution**: Connect to VA VPN and retry the publish command.

## Package Dependencies

When publishing multiple related packages:

1. Publish dependencies first (e.g., `plugin-scaffolder-react`)
2. Update consuming packages to reference the published version
3. Then publish consuming packages (e.g., `plugin-scaffolder`)

**Example**:

```json
// In plugin-scaffolder/package.json
"dependencies": {
  "@bip-bih/plugin-scaffolder-react": "^1.19.7"
}
```

## Published Packages

Current published versions:

- `@bip-bih/plugin-scaffolder-react@1.19.7`
- `@bip-bih/plugin-scaffolder@1.34.7`

## Automation Script

For repeated publishing, consider this workflow:

```bash
#!/bin/bash
set -e

PLUGIN_DIR=$1
VERSION=$2

cd "$PLUGIN_DIR"

# Build
yarn tsc
yarn run prepack
yarn run build

# Update version
npm version "$VERSION" --no-git-tag-version

# Publish
npm publish

echo "Published $(jq -r .name package.json)@$VERSION"
```

## Security Notes

- Never commit `.npmrc` files containing authentication tokens to git
- The `.npmrc` and `.yarnrc.yml` files are in `.gitignore`
- Authentication is stored in `~/.npmrc` with base64 encoded credentials
- Credentials format: `//nexus.dev.bip.va.gov/repository/npm-internal/:_auth=<base64>`

## References

- [Backstage Plugin Publishing Documentation](https://backstage.io/docs/plugins/publishing)
- [Yarn Workspaces](https://yarnpkg.com/features/workspaces)
- [npm Publishing](https://docs.npmjs.com/cli/v8/commands/npm-publish)
