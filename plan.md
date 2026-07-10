# Home Page Restyling Plan — Apply `design.md` "Neo-Noir Canvas" Theme

## Goal
Revise the landing page (`app/(marketing)/page.tsx` and all its component sections) to match the styling defined in `design.md` while keeping all content, layout, and animations intact.

## Source of Truth
`design.md` — Kombai Style Guide. Key tokens:

| Token | Value |
|---|---|
| `bg-canvas` | `#0A0A0A` / `#000000` |
| `bg-surface` | `#121212` |
| `border-grid` | `#1A1A1A` / `#222222` |
| `line-separator` | `#2D2D2D` |
| `accent-primary` | `#CCFF00` (Lime) |
| `text-muted` | `#8E8E93` |

## Files to Modify (26 files total)

### 1. Foundation — CSS Layer
**`app/globals.css`** — Update `.dark` theme block to design.md palette, add blueprint grid utility, add crosshair line-separator utility, add `#CCFF00` lime as `--color-accent`, set sharp border radii.

**`app/(marketing)/landing.css`** — Add `.bg-blueprint-grid` (32px grid at `rgba(255,255,255,0.03)`), add `.separator-line` with crosshair `○` in lime, update noise overlay.

### 2. Navigation
**`components/landing/navigation.tsx`** — Update nav bar accent colors from violet to lime, update button styles, update dropdown menu borders/accents.

**`components/landing/navigation-server.tsx`** — Mirror nav accent updates for server-rendered fallback.

### 3. Hero
**`components/landing/hero-section.tsx`** — Gradient text → solid `text-[#CCFF00]`, stat cards → `rounded-sm`, badge → lime accent, background orbs → lime-tinted, grid → blueprint spec.

**`components/landing/hero-workflow-visual.tsx`** — Stage cards → sharp corners, particle colors → lime, pulse color → lime, grid → blueprint spec, glow orbs → lime.

### 4. Ecosystem / Problem / Example
**`components/landing/tools-strip-section.tsx`** — Section borders → line-separator style, pills → sharp corners (keep pill shape).

**`components/landing/problem-section.tsx`** — Cards → `rounded-sm`, remove multi-colored glows → lime, backdrop orbs → lime, update backdrop grid.

**`components/landing/problem-section-client.tsx`** — Wrapper, update loading skeleton border.

**`components/landing/real-example-section.tsx`** — Grid → blueprint spec, stage cards → sharp corners, promise badges → lime accent, gradient text → solid lime, connector pulse → lime.

### 5. How It Works / Features
**`components/landing/how-it-works-section.tsx`** — Code terminal → match IDE window mockup from design.md (sharp corners, `#121212` bar), step buttons → sharp corners, update icon colors.

**`components/landing/features-section.tsx`** — Cards → `rounded-sm`, gradient text → lime, remove per-feature multi-colored accents → all lime, crawler visual → sharp corners, terminal snippet box → sharp corners.

### 6. Outcomes / Use Cases
**`components/landing/why-teams-section.tsx`** — Cards → `rounded-sm`, gradient text → lime, per-outcome accent gradients → lime.

**`components/landing/use-cases-section.tsx`** — Cards → `rounded-sm`, per-use-case accents → lime, trust row → sharp corners.

### 7. Comparison / Enterprise
**`components/landing/comparison-section.tsx`** — Table → sharp corners, competitor cards → sharp corners, gradient text → lime, badges → lime, stat tiles → sharp corners, comparison callout boxes → lime accent.

**`components/landing/enterprise-section.tsx`** — Cards → `rounded-sm`, grid → blueprint spec, gradient text → lime, badge → lime.

### 8. Why Now / Social Proof / Pricing
**`components/landing/why-now-section.tsx`** — Cards → `rounded-sm`, quote block → sharp corners, gradient text → lime, badges → lime, backdrop orbs → lime.

**`components/landing/social-proof-section.tsx`** — Pills → sharp corners with pill shape kept, quote block → sharp corners, trust cards → sharp corners.

**`components/landing/pricing-section.tsx`** — Cards → `rounded-sm`, cycle/currency toggles → sharp corners, highlighted card → lime border vs violet, update badges.

### 9. FAQ / CTA / Footer
**`components/landing/faq-section.tsx`** — Accordion items → sharp corners, backdrop glow → lime.

**`components/landing/cta-section.tsx`** — Gradient text → lime, badge → lime, gradient glow → lime.

**`components/landing/footer-section.tsx`** — Link column headers → design.md style, sponsor button → lime accent, social links → update styles.

### 10. Structural Line Separators
Add `border-b` or `separator-line` elements between major sections (hero→tools, tools→problem, etc.) per design.md §2: 1px `#2D2D2D` lines with centered `○` crosshair in `#CCFF00`.

## Consistent Per-Component Pattern

| Current | Replacement |
|---|---|
| `rounded-2xl` / `rounded-3xl` on cards | `rounded-sm` (max 4px) |
| `rounded-xl` on icon containers | `rounded` (4px) |
| `bg-violet-500/xx` highlights | `bg-[#CCFF00]/xx` lime |
| Gradient text `from-sky-400 via-violet-500 to-fuchsia-500` | Solid `text-[#CCFF00]` |
| Multi-colored glows | Single lime-tinted glow |
| `border-violet-500/xx` borders | `border-[#CCFF00]/xx` |
| Violet backdrop orbs | Lime backdrop orbs |

## What Stays Identical
- All content (headlines, copy, stats, images, icons, links)
- All layout (grid structures, section order, responsive breakpoints)
- All animations (fade-in, marquee, character animation, crawler scanner)
- All component hierarchy and imports in `page.tsx`
