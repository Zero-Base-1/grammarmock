# GrammarMock — Product Brief

## Product Mission
GrammarMock is an automata-driven procedural mock data studio. Unlike conventional data generators that rely on regex inverse heuristics or brittle random scripts, GrammarMock compiles formal regular expressions into Chomsky Type-3 Right-Linear Grammars via Thompson's NFA construction and $\epsilon$-reduction. Every generated string is mathematically guaranteed to be 100% compliant with the original validation pattern.

## Core Personas & Use Case
- **Systems & Backend Engineers**: Generating valid localized employee IDs, serial numbers, SKU codes, custom API tokens, and structured identifiers for staging databases and automated test suites.
- **Frontend & QA Engineers**: Generating deterministic test fixtures with reproducible seeds, boundary checking, and shortlex chronological enumeration.
- **Language & Automata Students / Researchers**: Inspecting AST tokens, Thompson NFA state diagrams, epsilon reduction, and right-linear grammar productions.

## Surface Archetype & Mode
- **Mode**: Operate (Technical Workbench / Developer Studio)
- **Primary Form**: Split Reactive Workbench
  - Left Pane: High-precision Regex Editor, live token breakdown, parameter controls (Count, Mode: Random Walk vs Chronological Shortlex, Max Repeat, Seed, Format), categorized preset library, and history session cache.
  - Right Pane: Multi-view workspace with:
    1. **Automata Graph**: Interactive Bauhaus SVG state machine diagram ($q_0, q_1, \dots$), start/accept indicators, labeled transitions, step-by-step path trace, and formal transition matrix $\delta(q, a)$.
    2. **Data Stream Grid**: Line-numbered data stream, search/filter, length distribution & entropy metrics, regex compliance verification badge, and multi-format export (TXT, JSON, CSV, TypeScript snippet).
    3. **Grammar & AST Inspector**: Chomsky Type-3 productions table ($A \to aB \mid \epsilon$), Non-terminals, and AST tree inspector.

## Key Interaction Affordances
- Instant reactive compilation on keystroke with resilient error boundaries.
- Global hotkeys: `Cmd/Ctrl + Enter` (Generate), `/` (Focus Regex), `1-3` (Switch tabs), `Esc` (Clear search / Reset).
- 100% Client-side execution: Zero telemetry, zero backend round-trips, private data generation.
