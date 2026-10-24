# Design — customer app

> **Status**: living document · **Last updated**: 2026-10-24

## Direction

The project owner asked for an interface that is **very soft** ("très douce"),
user-friendly, and that conveys the **eco-social** identity of the project
together with **convenience and time saved**.

Principles:

- **Soft shapes**: generous corner radii (14 / 20 / 28 px), cushioned cards
  with diffuse shadows, no hard toolbars, pill-shaped chips.
- **Calm, green palette**: pale leaf-tinted ground, deep pine for text, one
  leaf-green accent for what to act on; a warm sun tone only for the inside
  of the door that opens.
- **Rounded type**: Nunito (variable, bundled with the app so it works offline
  and in the Android app).
- **Show, don't explain**: the locker is drawn; the door the customer will use
  glows and gently swings open; sizes are shown with pictograms (watch, shoe,
  laundry bag, hanger).
- **Accessible**: visible keyboard focus, doors reachable with the keyboard,
  motion disabled when the user prefers reduced motion, text contrast kept on
  both light and dark themes.

## Tokens

Defined once in `packages/ui/src/theme.css` (shared by every frontend) (light and dark values) and
mapped onto Ionic's colour variables. Components only use these tokens.

| Token | Role |
|---|---|
| `--cg-ground` | Page background |
| `--cg-surface`, `--cg-surface-soft` | Cards and sheets; chips and inactive controls |
| `--cg-ink`, `--cg-ink-soft` | Main and secondary text |
| `--cg-leaf`, `--cg-leaf-soft` | Accent (actions, selected, available) and its background |
| `--cg-pine` | Strong text on soft backgrounds |
| `--cg-sun` | Inside of the opening door |
| `--cg-locker-*` | Locker drawing |
| `--cg-radius-*`, `--cg-shadow*` | Shapes and depth |

## Brand

The product name is not final (see `docs/PRODUCT.md`); colours and wording are
placeholders until it is chosen.
