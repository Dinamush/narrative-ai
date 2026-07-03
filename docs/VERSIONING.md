# Versioning policy

Narrative AI uses **three coordinated version numbers**. Keep them in sync when releasing.

## Single source of truth

[`version.json`](../version.json) at the repo root:

```json
{
  "version": "0.1.0",
  "schemaVersion": "1.1.0",
  "codename": "Scriptorium"
}
```

| Field | Meaning |
|-------|---------|
| `version` | Application & npm package semver |
| `schemaVersion` | `NarrativeWork` / `NarrativeGraph` export format |
| `codename` | Optional release nickname (shown in UI) |

After editing `version.json`, run:

```bash
npm run version:sync
```

This updates all `package.json` files and regenerates `apps/web/lib/app-meta.ts`.

## Semantic versioning (app & packages)

We follow [SemVer](https://semver.org):

| Bump | When |
|------|------|
| **MAJOR** | Breaking graph export, removed API routes, incompatible pipeline output |
| **MINOR** | New features, new views, new extraction modes (backward compatible) |
| **PATCH** | Bug fixes, prompt tuning, stopword lists, docs |

Record changes in [CHANGELOG.md](../CHANGELOG.md).

## Graph schema version

The `schemaVersion` field on every `NarrativeWork` document (currently `1.1.0`) tracks **serialized graph shape**.

Bump `schemaVersion` when:

- Zod schemas in `packages/graph-schema` change required fields
- Export/import `.narrative.json` format breaks backward compatibility

When bumping schema:

1. Update `version.json` → `schemaVersion`
2. Update `packages/graph-schema/src/narrative-graph.ts` (Zod literal)
3. Update `packages/graph-schema/src/factories.ts` default
4. Run `npm run version:sync`
5. Document migration notes in CHANGELOG

## Release checklist

1. Update `version.json` and CHANGELOG
2. `npm run version:sync`
3. `npm run build && npm run analyze:sample`
4. Commit: `chore(release): v0.x.x`
5. Tag: `git tag v0.x.x && git push origin v0.x.x`
6. Create GitHub Release from tag (attach CHANGELOG section)

## Runtime surfaces

| Surface | Location |
|---------|----------|
| UI footer / TopBar | `APP_VERSION` from `app-meta.ts` |
| Health API | `GET /api/health` |
| Exported JSON | `NarrativeWork.schemaVersion` |
