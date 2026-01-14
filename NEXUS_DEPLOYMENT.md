# Deploying Plugins to Nexus

Quick guide for publishing Backstage plugins to the internal Nexus npm registry.

## Setup

### 1. Configure Authentication

Add to `~/.npmrc`:

```properties
registry=https://nexus.dev.bip.va.gov/repository/npm-internal/
//nexus.dev.bip.va.gov/repository/npm-internal/:_auth=<base64-encoded-credentials>
//nexus.dev.bip.va.gov/repository/npm-internal/:always-auth=true
strict-ssl=false
```

Generate base64 credentials:

```bash
echo -n 'username:password' | base64
```

### 2. Configure Proxy (if needed)

Add to `~/.npmrc`:

```properties
proxy=http://username:password@proxy-host:port
https-proxy=http://username:password@proxy-host:port
```

## Publishing a Plugin

### 1. Update package.json

```json
{
  "name": "@bip-bih/plugin-name",
  "version": "1.0.0"
}
```

### 2. Pack and Publish

```bash
cd plugins/plugin-name
npm pack        # Optional: verify package contents
npm publish
```

## Using Published Plugins

### 1. Update Dependencies

In consuming packages, change `package.json`:

```json
{
  "dependencies": {
    "@bip-bih/plugin-name": "^1.0.0"
  }
}
```

## Common Issues

**Connection failed**: Ensure VPN is connected

**Authentication failed**: Regenerate base64 credentials and update `~/.npmrc`
