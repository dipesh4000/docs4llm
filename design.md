# Kombai Style Guide & System Architecture (`design.md`)

This design document breaks down the distinctive, modern technical aesthetic used by **Kombai**. It covers the dark-mode framework, grid alignments, retro-futuristic background pattern mechanics, crisp line splitters, and typographical orchestration.

---

## 1. Core Visual Archetype: The "Neo-Noir Canvas"

The overall theme balances a sophisticated dark development landscape with vibrant structural details. It bridges modern AI tools with traditional engineering aesthetics (reminiscent of architectural blueprints, blueprint graph paper, and high-end IDE layout systems).

### Color Palette Matrix

| Token Name | Hex Value | Application Target |
| :--- | :--- | :--- |
| `bg-canvas` | `#0A0A0A` / `#000000` | Absolute primary layout floor. |
| `bg-surface` | `#121212` | Visual elevation wrapper (cards, modular sections). |
| `border-grid` | `#1A1A1A` / `#222222` | structural layout grid and bounding borders. |
| `line-separator` | `#2D2D2D` | Explicit visual partition line strikes. |
| `accent-primary` | `#CCFF00` (Lime) | Call-to-actions, terminal tags, dynamic emphasis markers. |
| `text-muted` | `#8E8E93` | Auxiliary copy, structural labels, technical parameters. |

---

## 2. Dynamic Structural Line Separators

Kombai leverages thin, clean layout partitions to group structural contexts cleanly instead of using heavy background blocks or floating margin gaps.

```
       [ Top Visual Layout Segment ]
───────────────────── ○ ─────────────────────  <-- line-separator (1px) with crosshair accent
       [ Bottom Visual Layout Segment ]
```

### Technical Specs
* **Weight & Tint:** `1px` thickness using `#2D2D2D`.
* **Behavior:** Flows across the width of the main layout column or bounds the section wrappers (`width: 100%`).
* **Crosshair Intersection Pattern:** Where vertical grids intersect with horizontal separators, a micro-pattern accent is placed:
    * A miniature filled circle (`5px` diameter) or a plus-sign crosshair `+` centered on the line to break up visual monotonicity.
    * **CSS Execution Pattern:**
        ```css
        .separator-line {
          position: relative;
          height: 1px;
          background-color: #2D2D2D;
          margin: 40px 0;
        }
        .separator-line::after {
          content: "○";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: #0A0A0A;
          padding: 0 8px;
          color: #CCFF00;
          font-size: 10px;
        }
        ```

---

## 3. Background Architecture: Linear & Matrix Grids

The background uses layered, low-opacity geometric structures to convey an engineered, "infinite design canvas" layout.

### A. The Blueprint Matrix (Dot & Infinite Grid)
* **Structure:** A continuous grid of soft lines (`1px` every `24px` or `32px`) running across both X and Y axes.
* **Color Scale:** Rendered with extremely faint transparency (`rgba(255, 255, 255, 0.02)` to `0.04`).
* **Implementation Archetype:**
    ```css
    .bg-blueprint-grid {
      background-size: 32px 32px;
      background-image: 
        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
    }
    ```

### B. Radial Accent Orbs (Sub-surface Glow)
* **Concept:** Large, soft radial gradients layered behind primary layout zones to highlight code snippets, terminal mocks, or feature boxes.
* **Tint Shift:** A desaturated, deeply masked neon hue (e.g., `#CCFF00` or `#00E5FF` at `5%` to `8%` opacity) bleeding outward from a center point over `600px`.

---

## 4. Layout Structural Blocks

Kombai frames code editors, design canvas screens, and marketing blocks using highly structured panels.

* **Panel Borders:** Sharp, zero-radius corners (`border-radius: 0px` or a tiny `4px` limit) framed with a explicit `1px solid #222222`.
* **The IDE Window Mockup:** * Top window chrome bar styled with a slight surface layout bump (`#121212`).
    * Minimalistic window control points (three small desaturated dots or micro-labels like `localhost:3000` or `ProductPage.vue`).
* **Zebra & Data Column Strips:** Alternating tables and rows utilize slight hue shifts between `#0A0A0A` and `#121212` instead of distinct color fills.

---

## 5. Typography Hierarchy

An explicit, high-readability sans-serif typeface combined with monospace technical markers completes the system.

### A. Display Headings
* **Scale:** Broad, high tracking metrics, with heavy weights.
* **Pattern:** Main layout highlights run with clean typographic styling where single keywords use the accent color (`#CCFF00`) or are enveloped inside a subtle rounded label block.

### B. The Code & Terminal Layer
* **Font Family:** Monospace family stack (`JetBrains Mono`, `Fira Code`, or native system `SF Mono`).
* **Application:** System outputs, file directory pathways (`ProductPage.canvas`), file structures, and code tokens. Includes a distinct color tint for code parameters to separate terminal layers from copy prose.
