# Mobile Code Cloud

Cloud IDE architecture for the Mobile Code project.

## Runtime

- GitHub: source control
- Vercel: web application
- Vercel Sandbox: isolated persistent Linux workspace
- Browser terminal: direct sandbox terminal on exposed port 7681

Vercel Sandbox is used because the IDE requires real Linux execution while avoiding a self-managed VPS.

## Current milestone

The repository contains the cloud runtime foundation. The next UI migration keeps the existing Mobile Code v6.4 editor/explorer and connects its terminal and workspace operations to the per-user sandbox instead of the local filesystem.

Do not expose Vercel credentials to the sandbox. Keep sandbox network policy and project authentication server-side.
