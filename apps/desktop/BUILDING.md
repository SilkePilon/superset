# Development

Run the dev server without env validation or auth:

```bash
SKIP_ENV_VALIDATION=1 bun run dev
```

This skips environment variable validation and the sign-in screen, useful for local development without credentials.

# Release

When building for release, make sure `node-pty` is built for the correct architecture with `bun run install:deps`, then run `bun run release`.

# Linux (AppImage) local build

From `apps/desktop`:

```bash
bun run clean:dev
bun run compile:app
bun run package -- --publish never --config electron-builder.ts
```

Expected outputs in `apps/desktop/release/`:

- `*.AppImage`
- `*-linux.yml` (Linux auto-update manifest)

# Linux auto-update verification (local)

From `apps/desktop` after packaging:

```bash
ls -la release/*.AppImage
ls -la release/*-linux.yml
```

If both files exist, packaging produced the Linux artifact + updater metadata that `electron-updater` expects.

# Windows (NSIS installer) local build

## Prerequisites

- **Visual C++ Build Tools** – required for native modules (`node-pty`, `better-sqlite3`).
  Install via `winget install Microsoft.VisualStudio.2022.BuildTools` or the
  [Visual Studio Build Tools installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
  Select the "Desktop development with C++" workload.
- **Python 3** – needed by `node-gyp` (ships with Build Tools if you check the Python option).

## Build

From `apps/desktop`:

```powershell
bun run clean:dev
bun run compile:app
bun run package -- --publish never --config electron-builder.ts
```

Expected outputs in `apps/desktop/release/`:

- `Superset-<version>-x64.exe` (NSIS installer)
- `latest.yml` (Windows auto-update manifest)

## Windows auto-update verification (local)

From `apps/desktop` after packaging:

```powershell
Get-ChildItem release/*.exe
Get-ChildItem release/*latest*.yml
```

If both files exist, packaging produced the Windows artifact + updater metadata that `electron-updater` expects.
