# ProseFlow Design System (`DESIGN.md`)

This document is the single source of truth for ProseFlow’s visual language, typography, color tokens, layout discipline, and copywriting standards. Every new page or component must follow these rules to keep the product coherent and free of generic AI-template clichés.

---

## 1. Brand Palette (Strict Token Discipline)

Never invent arbitrary hex colors, neon glows, or purple/cyan gradients. All surfaces, ink, and accents come from these exact tokens defined in `src/app/globals.css`:

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--pf-bg` | `#FFFFFF` | Primary Pure White canvas (clean, high-contrast editorial background) |
| `--pf-surface` | `#F7F6F5` | Crisp Neutral Off-White secondary bands & table headers |
| `--pf-surface-pure` | `#FFFFFF` | Elevated panels, inputs, and interactive controls |
| `--pf-surface-2` | `#EEECEA` | Recessed surface chips & subtle dividers |
| `--pf-border` | `#E3E0DD` | 1px hairline architectural borders & dividers |
| `--pf-text` | `#181312` | Primary near-black ink (>= 16:1 contrast on white) |
| `--pf-muted` | `#5C5450` | Secondary copy & metadata (>= 7:1 contrast on white) |
| `--pf-accent` | `#7C3539` | Crimson / Oxblood primary CTAs, active states, & links |
| `--pf-accent-hover` | `#65292C` | Hover state for primary actions |
| `--pf-accent-soft` | `#F6EAEA` | Subtle blush-crimson tint for selected states |
| `--pf-espresso` | `#2A1412` | Deep Espresso dark editorial bands & high-contrast panels |
| `--pf-espresso-deep` | `#1E0D0C` | Deepest espresso gradient stop |
| `--pf-espresso-border` | `#4A2723` | Hairline borders inside dark Espresso sections |
| `--pf-espresso-muted` | `#B5A39E` | Secondary text on Deep Espresso backgrounds |

---

## 2. Typography

- **UI & Display Sans (`--font-sans`):** `DM Sans` — crisp geometric grotesk for navigation, headlines, buttons, and interface controls. Tight tracking (`-0.03em` to `-0.035em`) on large display headings.
- **Editorial Reading Serif (`--font-serif`):** `Newsreader` — reserved exclusively for long-form prose previews, Before/After refined samples, and editor output panes so users *feel* the difference between UI chrome and actual writing.
- **Technical Monospace (`--font-mono`):** `JetBrains Mono` — used strictly for numbers, metrics (`96.4%`), API endpoints, code blocks, and sequential step indices (`01`, `02`, `03`).

---

## 3. Anti-Slop Rules (What We Never Do)

1. **No Hero Status Pills with Pulsing Dots:** Never place a rounded capsule badge with a blinking dot (`● Live ...`) above an `H1`. Use clean plain-text uppercase tracking (`.pf-eyebrow`) or let the headline stand on its own.
2. **No Repeated Symbol / Emoji Eyebrows:** The ProseFlow asterisk mark belongs **exclusively** in the brand logo (`proseflow.`) and empty-state studio mark—never pasted in front of every section heading (`✳ Features`, `✳ Pricing`).
3. **No "One-Word Italic Serif" Headline Gimmick:** Never mix a single italic serif word into the middle of a sans-serif headline (`"Restoring *human cadence* to..."`). Keep headings solid, confident, and typographically consistent.
4. **No Arbitrary Section Numbering:** Only use `01`, `02`, `03` for truly sequential workflows (such as the 3-step *How It Works* flow). Do not prefix standalone sections (`Studio`, `Capabilities`, `Writers`) with fake numbers.
5. **No Bouncy Card Hover Lift:** Cards stay grounded. Use calm hairline border transitions (`border-color`), never `translateY(-3px)` bounce animations on every box.
6. **Break Uniform Card Grids:** Vary visual rhythm between open hairline-divided editorial columns (`divide-x`), asymmetric panels, and grounded dark Espresso contrast bands rather than repeating identical 3-column rounded cards.
7. **Photography Over Abstract Blobs:** All imagery must depict real writing craft (fountain pens, textured cotton paper, bound notebooks, walnut desks) matched to the `#DFDACC` / `#341815` / `#7C3539` palette—never abstract glowing spheres or stock gradients.

---

## 4. Copywriting & Compliance Standards

- **Concrete, Plain English:** Say exactly what the feature does (`"Rewrites 6 paragraphs at once in ~8 seconds"`, `"Keeps every quote and date intact"`). Ban hollow AI filler (*seamless, robust, elevate, empower, supercharge, unlock, landscape, effortless, craft*).
- **Compliance-Safe Positioning:** Public marketing pages describe ProseFlow strictly as a **Natural Writing & Voice Refiner** for bloggers, researchers, marketers, founders, and ESL writers. Never use detector-evasion or academic-cheating terms (enforced automatically by `tests/compliance.test.ts`).
