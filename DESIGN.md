# GrammarMock — Design System & Visual Specification

## Aesthetic World: Pure Monochromatic Terminal / Bauhaus
GrammarMock adopts a stark, high-contrast Bauhaus engineering aesthetic. Built for engineers who value mathematical rigor and precision over decorative fluff.

### 1. Color Palette
- **Monochrome Core**:
  - Ink Primary: `#0a0a0a` (Light) / `#f5f5f5` (Dark)
  - Ink Secondary: `#525252` (Light) / `#a3a3a3` (Dark)
  - Ink Muted: `#737373` (Light) / `#737373` (Dark)
  - Surface Background: `#ffffff` (Light) / `#0d0d0d` (Dark)
  - Canvas Background: `#f8f8f9` (Light) / `#050505` (Dark)
  - Technical Grid Borders: `#e5e5e7` (Light) / `#222224` (Dark)
  - Strong Border Highlight: `#000000` (Light) / `#ffffff` (Dark)
- **Functional Accent**:
  - Mathematical / Verified Green: `#16a34a` (Light) / `#22c55e` (Dark)
  - Formal Syntax Error Red: `#dc2626` (Light) / `#ef4444` (Dark)
  - State Node & Graph Accent: Stark geometric black & white with bold contrast.

### 2. Typography
- **Monospace Voice**: `'DM Mono'`, `'JetBrains Mono'`, `'Space Mono'`, monospace.
  - Applied to: Regular expressions, AST tree, NFA state labels ($q_n$), Grammar production rules ($A \to aB$), generated mock records, and numeric metrics.
- **Structural Grotesque**: `'Space Grotesk'`, `'Inter'`, system sans-serif.
  - Applied to: Window titlebar, tabs, field labels, button actions, and summary metrics.
- **Strict Hierarchy**:
  - App Header: 18px / 600 weight, uppercase tracking `+0.05em`.
  - Section Titles: 14px / 600 weight.
  - Standard Labels: 12px / 500 weight.
  - Code & Editor: 13px with 1.65 line-height.
  - Tabular numerics: `font-variant-numeric: tabular-nums`.

### 3. Layout Grid & Bauhaus Architectural Panels
- **Split Reactive Workbench**:
  - Master Header / HUD: Status indicator, theme switcher (Dark / Light), keyboard shortcuts cheat sheet toggle, preset carousel.
  - Left Pane (Editor & Traversal Controls, 380px fixed or 38%):
    - Multi-line regex input with live `/ ... /` syntax delimiters.
    - Quick-preset categorized pills.
    - Parameter matrix: Record count, Generation Mode (Random Walk vs Chronological Shortlex), Max Kleene repeat, Seed, Output format.
    - Primary "EXECUTE GENERATION" tactile button (`Cmd+Enter`).
  - Right Pane (Multi-View Workspace, 62% flexible):
    - Tab Bar:
      1. `[1] AUTOMATA GRAPH` — Interactive SVG state diagram with zoom/fit, animated traversal path, and collapsible $\delta(q, a)$ Transition Matrix.
      2. `[2] DATA STREAM` — Line-numbered virtual records stream, live filter, stats bar (entropy, character length distribution, 100% regex validity check), format exporter.
      3. `[3] GRAMMAR INSPECTOR` — Right-Linear Grammar productions table, non-terminals, start variable, and parsed AST tree view.

### 4. Craft Floor Compliance
- **Zero Kickers/Eyebrows**: Section headings speak for themselves with crisp typography.
- **No Muddy Shadows or Faux Glass**: Hairline 1px technical borders, sharp geometric boundaries.
- **Custom Browser Surfaces**: Styled scrollbars, focused input outlines with high contrast, themed `::selection`.
- **Authored SVG Icons**: Unified 1.75px geometric stroke icons throughout the UI.
