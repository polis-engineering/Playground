# Figma Source Reference

## File

- **Name:** Polis--Works
- **URL:** https://www.figma.com/design/Ra39Tjy7Kcf74D4P7EmmJP/Polis--Works
- **fileKey:** `Ra39Tjy7Kcf74D4P7EmmJP`

## Key nodes

| Node ID | Name | Description |
|---------|------|-------------|
| `89:266` | section | Root section containing both frames |
| `88:174` | desktop 1.0 | Desktop frame — centered, 2-col grid |
| `89:233` | mobile 1.0 | Mobile frame — top-aligned, 1-col |
| `88:178` | container | Max 600px content container |
| `88:189` | div | Content grid (Writing/Projects/Clients + Links) |

## MCP sync commands

Use Figma MCP `get_design_context`:

```
fileKey: Ra39Tjy7Kcf74D4P7EmmJP
nodeId: 88:174   (desktop)
nodeId: 89:233   (mobile)
nodeId: 89:266   (section)
```

For targeted re-sync in chat:

```
@figma re-sync node:88:174
```

## Design tokens (from Figma)

| Token | Value |
|-------|-------|
| Font | Inter 15px / 21.75px line-height / -0.15px tracking |
| Primary text | `#202020` |
| Muted text | `#646464` |
| Container max-width | 600px |
| Container gap | 24px |
| Grid gap | 16px |
| Desktop padding | px 24, py 40 |
| Mobile padding | p 24 |

## Code mapping

See `src/figma/manifest.ts` for the full node → component path registry.
