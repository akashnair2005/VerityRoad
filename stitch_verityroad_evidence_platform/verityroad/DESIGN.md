---
name: VerityRoad
colors:
  surface: '#f4fbf4'
  surface-dim: '#d4dcd5'
  surface-bright: '#f4fbf4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef5ef'
  surface-container: '#e8f0e9'
  surface-container-high: '#e3eae3'
  surface-container-highest: '#dde4de'
  on-surface: '#161d19'
  on-surface-variant: '#404944'
  inverse-surface: '#2b322e'
  inverse-on-surface: '#ebf3ec'
  outline: '#707974'
  outline-variant: '#c0c9c2'
  surface-tint: '#346853'
  primary: '#003525'
  on-primary: '#ffffff'
  primary-container: '#174d3a'
  on-primary-container: '#87bda4'
  inverse-primary: '#9cd2b9'
  secondary: '#566159'
  on-secondary: '#ffffff'
  secondary-container: '#dae5db'
  on-secondary-container: '#5c675f'
  tertiary: '#492500'
  on-tertiary: '#ffffff'
  tertiary-container: '#693800'
  on-tertiary-container: '#f99c44'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b7efd4'
  primary-fixed-dim: '#9cd2b9'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#1a503c'
  secondary-fixed: '#dae5db'
  secondary-fixed-dim: '#bec9c0'
  on-secondary-fixed: '#141e18'
  on-secondary-fixed-variant: '#3f4942'
  tertiary-fixed: '#ffdcc2'
  tertiary-fixed-dim: '#ffb77a'
  on-tertiary-fixed: '#2e1500'
  on-tertiary-fixed-variant: '#6d3a00'
  background: '#f4fbf4'
  on-background: '#161d19'
  surface-variant: '#dde4de'
typography:
  display-hero:
    fontFamily: Newsreader
    fontSize: 56px
    fontWeight: '400'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 26px
    fontWeight: '500'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system reflects an ethos of institutional transparency, rigorous inquiry, and quiet confidence: "Evidence before assertion." The design bridges investigative journalism, cartographic intelligence, and civic infrastructure. The interface avoids ephemeral tech trends, neon accents, and artificial gradients, favoring archival permanence, measured pacing, and clear typographic hierarchy.

The visual style combines modern broadsheet editorial restraint with precision public-interest instrumentation. Crisp ruled lines, open column structures, structural borders, and dedicated evidentiary status markers ground the user in verifiable truth. The emotional tone is deliberate, objective, lucid, and unhurried.

## Colors

The palette establishes an authentic, parchment-meets-ledger foundation:

- **Canvas & Surfaces**: The base canvas is `#F7F6F2` (Warm Ivory). Neutral elevated surfaces leverage pure `#FFFFFF`, while recessed containers and panels utilize `#DCE7DD` (Muted Sage) at varied opacities.
- **Brand & Structural Text**: `#174D3A` (Deep Forest Green) acts as the commanding anchor for primary actions, verified state badges, key navigation motifs, and authoritative accents. Headings and primary copy render in `#202723` (Almost-Black Ink).
- **Secondary & Meta**: `#777D76` (Warm Neutral Grey) provides quiet contrast for timestamps, source attributions, citation index markers, and table schema headers.
- **Evidentiary Status Indicators**: 
  - Verified / Validated: `#174D3A` with `#DCE7DD` tint backgrounds.
  - Caution / Unverified: `#D9822B` (Soft Amber) on `#FEF3C7`.
  - Contested / Disproven / Error: `#B91C1C` (Restrained Crimson) on `#FEE2E2`.
- **Dividers & Structural Rules**: Surfaces are structured with hair-thin borders utilizing `#202723` at 10% to 15% opacity (`rgba(32, 39, 35, 0.12)`).

## Typography

The type system creates deliberate contrast between long-form editorial authority and dense civic metadata. 

- **Display & Headlines (`Newsreader`)**: Set with optical sizing enabled. Headlines evoke the gravitas of investigative broadsheets. Italic variations are reserved strictly for documentary excerpts, primary source quotes, and evidentiary commentary.
- **Interface & Text (`Inter`)**: A neutral, highly legible sans-serif handles data grids, body analysis, filter controls, map overlays, and operational inputs.
- **Labels & Micro-data**: Rendered with strict tabular numerals where quantities or coordinates appear, using uppercase tracked treatment for statuses, source indices, and categorization chips.

## Layout & Spacing

The layout is built on a structured 12-column grid system designed for deliberate asymmetry, echoing the juxtaposition of investigative dossiers and interactive map viewports:

- **Desktop (1024px+)**: 12 columns with 24px gutters and 48px canvas margins. Typical views feature an asymmetrical 8:4 or 7:5 split (primary evidence dossier / contextual map & metadata ledger).
- **Tablet (768px – 1023px)**: 8 columns with 20px gutters and 32px margins. Secondary panes collapse into stacked drawers or segmented bottom sheets.
- **Mobile (< 768px)**: 4 columns with 16px gutters and 20px outer margins. Dense tabular panels collapse into linear, structured card sequences.

Rhythm is maintained via strict vertical grid intervals, employing generous internal margins inside elevated cards to promote clarity and reading comprehension.

## Elevation & Depth

This design system avoids synthetic blur layers, heavy multi-tier drop shadows, and neon lighting. Spatial hierarchy is communicated through architectural surface shifts and hairline borders:

- **Level 0 (Canvas Base)**: `#F7F6F2` canvas. Flush, non-interactive documentary baseline.
- **Level 1 (Panels & Sub-cards)**: `#DCE7DD` with 40% opacity, framed by 1px solid `rgba(32, 39, 35, 0.10)`. No box shadow.
- **Level 2 (Elevated Dossiers & Cards)**: `#FFFFFF` surface framed by 1px solid `rgba(32, 39, 35, 0.12)`, supported by a calm ambient shadow: `0 2px 8px -2px rgba(32, 39, 35, 0.05), 0 1px 3px 0 rgba(32, 39, 35, 0.03)`.
- **Level 3 (Modals, Contextual Popovers, Map Floats)**: `#FFFFFF` surface with 1px solid `rgba(32, 39, 35, 0.16)` and a grounded directional shadow: `0 12px 32px -8px rgba(32, 39, 35, 0.08), 0 4px 12px -2px rgba(32, 39, 35, 0.04)`.

## Shapes

The geometric personality is sharp, structured, and architectural. A soft radius (`roundedness: 1` — 4px base, 8px for cards, 12px for primary structural modals) keeps the UI humane and accessible while preserving the crisp discipline of paper forms, dossiers, and archival envelopes. Status pills and tags maintain a tight 4px curve rather than circular capsules, ensuring alignment with dense editorial layouts.

## Components

- **Buttons**:
  - *Primary*: `#174D3A` fill, `#FFFFFF` text, 4px border radius. Sharp focus rings (`2px offset #174D3A`).
  - *Secondary*: Transparent background, `#202723` text, 1px border `rgba(32, 39, 35, 0.20)`. Hover shifts to `#DCE7DD` at 30% fill.
  - *Subtle / Ghost*: No border, `#174D3A` text with an underlined interaction on hover.
- **Input Fields & Search**:
  - `#FFFFFF` surface, 1px border `rgba(32, 39, 35, 0.18)`, `#202723` input text, `#777D76` placeholder. Focus state transitions border to `#174D3A` without glow rings.
- **Chips & Evidentiary Tags**:
  - Compact padding (4px vertical, 8px horizontal), typography set to `label-sm`.
  - *Verified*: `#DCE7DD` surface with `#174D3A` text.
  - *Needs Verification*: `#FEF3C7` surface with `#D9822B` text.
  - *Contested*: `#FEE2E2` surface with `#B91C1C` text.
- **Cards & Dossiers**:
  - Background `#FFFFFF`, 1px border `rgba(32, 39, 35, 0.12)`, 8px border radius. Header section punctuated by a hairline divider separating title/lead from source metadata.
- **Checkboxes & Radios**:
  - 16px square/circle with 1.5px stroke `rgba(32, 39, 35, 0.35)`. Selected state fills with `#174D3A` and a crisp white indicator mark.
- **Data Tables & Citation Ledger**:
  - Flush ivory-to-white alternating rows, zero vertical dividing lines, separated only by 1px horizontal rules `rgba(32, 39, 35, 0.08)`. Headers styled in `label-sm` with grey text `#777D76`.
- **Source Citation Footnotes**:
  - Monospaced bracketed numerical markers `[1]` in bold `#174D3A`, triggering an inline preview card of verified primary evidence when activated.