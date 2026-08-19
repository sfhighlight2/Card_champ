# Navy redesign — Figma → app mapping

Source: Figma file `n1ByQX5S9eqY1KxWxxcoLD` ("Card Champs", 2026-08-19 version).
The navy phone frames are the target design; the light frames in the file are the
previous look, kept by the designer as "OLD FRAMES".

## Palette (extracted from the file, not eyeballed)

| Token | Value | Where the design uses it |
| --- | --- | --- |
| page background | `linear-gradient(180deg, #111f3b 0%, #0e1014 100%)` | every screen |
| panel (solid) | `#101828` | floating footer pill, containers |
| panel (section) | `linear-gradient(180deg, #111621, #101828)` + 1px border `rgba(33,50,85,.6)→#12203c` | thread cards, "What are they chasing" |
| surface | `#1d2534`, r=14 | search bar, icon buttons |
| active pill | `linear-gradient(180deg, #1d2e4e, #11203e)`, white text | tabs, footer buttons, CTAs |
| inactive pill text | `#8492ac` / `#bbbbbb` | footer, tabs |
| stat card | transparent, 0.6px border `#39558e`, r=16 | Cards / Value / Connections row |
| text | white headings, `#dce4f6` accent, `#99a1af` mid, `#8492ac` dim, `#6a7282` faint | throughout |
| chase card | `linear-gradient(135deg, #008f31, #152648)`, border `#bbf7d0→#101828` | chase list |
| chase pill (active tab) | `linear-gradient(180deg, #16a34a, #134342)` | Chase dropdown pill |
| CHASING label | `#5bf092` | chase cards |
| DM button | `linear-gradient(135deg, #16a34a, #22c55e)` | connections chasing rows |
| hot/orange | `#ff6900` hot tag, `#e8821a` topic tag | community |
| tier tags | PRO `white→#75ebf7` stroke `#3ca3c3` · HOF `white→#ef9ff6` stroke `#833cc3` · RKE `white→#76ffda` stroke `#00b98e` | gradient text + icon |

Fonts: Google Sans / Google Sans Flex (already the app's stack); the design uses
weights up to 900 for emphasis.

## Assets (exported from the file, in `src/imports/`)

- `gem-{silver,gold,bronze,diamond}.png` — laurel-wreath medals (avatar medal, level panel)
- `medal-{silver,gold,bronze,diamond}.png` — plain coin badges (peer avatars, awards)
- `medal-chase.png` — green lightning coin (chase cards)

## Screen mapping

| Figma frame | App surface |
| --- | --- |
| START - CARDS | App.tsx dashboard (header, stats row, tabs, grid, footer) |
| CHASE | ChaseView |
| COMMUNITY | CommunityView (+ topics rail) |
| CONNECTIONS | PeersView |
| \<NAME\> - PROFILE / EXPANDED PROFILE | PeerProfileSheet |
| MAIN PROFILE - AC | ProfileView |
| VARIABLES section | component states (pills, dropdown, badges) |

## Deliberate decisions

- The navy design is the app's **single theme**. The old light/dark toggle is
  removed — the design defines one identity, and maintaining a parallel light
  skin would mean inventing a second design the file doesn't contain.
- Functionality is untouched: every handler, hook, query, and mutation keeps its
  wiring. Anything in the design implying *new* behavior (e.g. a "Connect"
  footer with no selected peer) keeps its current, working action set.
- The reskin leans on `theme.css`'s utility-override layer: the light utility
  vocabulary (`bg-white`, `text-gray-900`, …) is remapped to the navy palette in
  one place; distinctive structures (stat cards, medals, chase cards, topic
  tiles) are hand-built.
