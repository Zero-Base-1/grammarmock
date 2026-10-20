import {
  Parser,
  ThompsonBuilder,
  NFA,
  nfaToRightLinearGrammar,
  formatGrammar,
  printAST,
  generateBulk,
  RightLinearGrammar,
  ASTNode,
} from '../index.js';
import { AutomataVisualizer, buildTransitionMatrix } from './automata-visualizer.js';
import './styles.css';

type ActiveTab = 'automata' | 'stream' | 'grammar' | 'guide';
type OutputFormat = 'text' | 'json' | 'csv' | 'ts';

interface Preset {
  name: string;
  pattern: string;
  category: string;
}

const PRESETS: Preset[] = [
  // Identity & HR
  { name: 'Employee ID', pattern: '^[A-Z]{3}-\\d{4}$', category: 'Identity & HR' },
  { name: 'Email Handle', pattern: '^[a-z]{3,8}\\.[a-z]{3,8}@[a-z]{3,8}\\.(com|org|net)$', category: 'Identity & HR' },

  // Commerce & Inventory
  { name: 'Product SKU', pattern: '^[A-Z]{2}-[0-9]{4}-[A-Z]{2}$', category: 'Commerce & Inventory' },
  { name: 'Credit Card', pattern: '^4[0-9]{3}-[0-9]{4}-[0-9]{4}-[0-9]{4}$', category: 'Commerce & Inventory' },
  { name: 'Invoice ID', pattern: '^INV-202[0-9]-[0-9]{5}$', category: 'Commerce & Inventory' },

  // Software & Development
  { name: 'UUID v4', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', category: 'Software & Dev' },
  { name: 'SemVer 2.0', pattern: '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(-(alpha|beta|rc)\\.[1-9])?$', category: 'Software & Dev' },
  { name: 'API Route', pattern: '^/(GET|POST|PUT)/api/v[1-3]/[a-z]{3,8}$', category: 'Software & Dev' },
  { name: 'Hex Color', pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$', category: 'Software & Dev' },

  // Network & Infrastructure
  { name: 'IPv4 CIDR', pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/(1[6-9]|2[0-9]|3[0-2])$', category: 'Network & Infra' },
  { name: 'MAC Address', pattern: '^([0-9A-F]{2}:){5}[0-9A-F]{2}$', category: 'Network & Infra' },
  { name: 'ISO Date', pattern: '^202[0-9]-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$', category: 'Network & Infra' },
];

const state = {
  pattern: '^[A-Z]{3}-\\d{4}$',
  count: 25,
  mode: 'random' as 'random' | 'chronological',
  format: 'text' as OutputFormat,
  maxRepeat: 5,
  seed: '',
  activeTab: 'automata' as ActiveTab,
  theme: (localStorage.getItem('gm_theme') || 'dark') as 'dark' | 'light',
  records: [] as string[],
  searchQuery: '',
  showShortcuts: false,
  showGuide: false,
  showMatrix: false,
  history: [] as Array<{ pattern: string; count: number; mode: string; time: string }>,
  ast: null as ASTNode | null,
  nfa: null as NFA | null,
  grammar: null as RightLinearGrammar | null,
  error: null as string | null,
};

const app = document.querySelector<HTMLDivElement>('#app')!;
let visualizer: AutomataVisualizer | null = null;

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function applyTheme(): void {
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('gm_theme', state.theme);
}

function toggleTheme(): void {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  render();
}

function compileCurrentPattern(): void {
  if (!state.pattern.trim()) {
    state.ast = null;
    state.nfa = null;
    state.grammar = null;
    state.error = null;
    return;
  }

  try {
    const ast = Parser.parse(state.pattern);
    const builder = new ThompsonBuilder();
    const nfa = builder.build(ast);
    const grammar = nfaToRightLinearGrammar(nfa, true);

    state.ast = ast;
    state.nfa = nfa;
    state.grammar = grammar;
    state.error = null;
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Pattern compilation failed.';
    state.ast = null;
    state.nfa = null;
    state.grammar = null;
  }
}

function runGeneration(): void {
  compileCurrentPattern();
  if (state.error || !state.pattern.trim()) {
    showToast('Fix pattern syntax before generating records.');
    return;
  }

  try {
    const genOptions = {
      mode: state.mode,
      maxRepeat: state.maxRepeat,
      ...(state.seed.trim() ? { seed: Number(state.seed) } : {}),
    };

    const records = generateBulk(state.pattern, state.count, genOptions);
    state.records = records;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    state.history.unshift({
      pattern: state.pattern,
      count: records.length,
      mode: state.mode,
      time: timeStr,
    });
    if (state.history.length > 5) {
      state.history.pop();
    }

    showToast(`Generated ${records.length} records`);
    render();
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Generation traversal failed.';
    render();
  }
}

function showToast(msg: string): void {
  const toast = document.querySelector<HTMLElement>('#toast-message');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 2200);
}

function formatExportData(records: string[], fmt: OutputFormat): string {
  if (fmt === 'json') {
    return JSON.stringify(records, null, 2);
  }
  if (fmt === 'csv') {
    return ['value', ...records.map((r) => (/[",\n]/.test(r) ? `"${r.replace(/"/g, '""')}"` : r))].join('\n');
  }
  if (fmt === 'ts') {
    const typeValues = records.slice(0, 100).map((r) => `  | ${JSON.stringify(r)}`).join('\n');
    return `/** Generated by GrammarMock (Chomsky Type-3 Automaton) */\nexport type GeneratedRecord =\n${typeValues};\n`;
  }
  return records.join('\n');
}

function calculateEntropy(records: string[]): string {
  if (records.length === 0) return '0.00';
  const joined = records.join('');
  if (joined.length === 0) return '0.00';

  const freqs = new Map<string, number>();
  for (const ch of joined) {
    freqs.set(ch, (freqs.get(ch) ?? 0) + 1);
  }

  let entropy = 0;
  const len = joined.length;
  for (const count of freqs.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy.toFixed(2);
}

function renderPresetDropdown(id = 'header-preset-select', className = 'header-preset-select'): string {
  const isPresetMatch = PRESETS.some((p) => p.pattern === state.pattern);
  const categories = Array.from(new Set(PRESETS.map((p) => p.category)));

  const options = categories.map((cat) => {
    const items = PRESETS.filter((p) => p.category === cat)
      .map(
        (p) => `<option value="${esc(p.pattern)}" ${state.pattern === p.pattern ? 'selected' : ''}>${esc(p.name)}</option>`
      )
      .join('');
    return `<optgroup label="── ${esc(cat.toUpperCase())}">${items}</optgroup>`;
  }).join('');

  return `
    <select id="${id}" class="${className}" aria-label="Pattern Presets">
      <option value="" disabled ${!isPresetMatch ? 'selected' : ''}>${!isPresetMatch ? 'Custom Pattern...' : 'Select Preset...'}</option>
      ${options}
    </select>
  `;
}

function renderHeader(): string {
  return `
    <header class="workbench-header">
      <div class="brand-section">
        <div class="brand-glyph">GM</div>
        <div class="brand-title">GrammarMock</div>
        <span class="brand-badge">CHOMSKY TYPE-3 STUDIO</span>
      </div>
      <div class="header-center">
        <div class="header-preset-section">
          <label class="header-preset-label" for="header-preset-select">PRESETS</label>
          ${renderPresetDropdown('header-preset-select', 'header-preset-select')}
        </div>
      </div>
      <div class="header-actions">
        <button class="icon-btn" id="guide-btn" title="How to Use Data Generation">
          <span>[i]</span> GUIDE
        </button>
        <button class="icon-btn" id="shortcuts-btn" title="View Keyboard Shortcuts">
          <span>[?]</span> KEYS
        </button>
        <button class="icon-btn theme-toggle-btn" id="theme-btn" title="Toggle Dark/Light Mode">
          <span>${state.theme === 'dark' ? '☀ LIGHT' : '● DARK'}</span>
        </button>
      </div>
    </header>
  `;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const modKey = isMac ? '⌘' : 'Ctrl';

function renderLeftPane(): string {
  const stateCount = state.nfa ? state.nfa.getAllStates().length : 0;
  const productionsCount = state.grammar ? state.grammar.productions.size : 0;

  const historyHtml = state.history.length > 0
    ? state.history.map((h) => `
        <div class="history-item">
          <span class="history-pattern" data-load-history="${esc(h.pattern)}" title="${esc(h.pattern)}">/${esc(h.pattern)}/</span>
          <span class="history-meta">${h.count} rec · ${h.time}</span>
        </div>
      `).join('')
    : '<div style="color: var(--ink-muted); font-size: 11px; font-family: var(--font-mono);">No previous runs in this session.</div>';

  return `
    <aside class="left-pane">
      <div class="left-pane-scroll">
        <div class="pane-section">
          <div class="section-title">
            <span>REGULAR EXPRESSION</span>
            ${renderPresetDropdown('pane-preset-select', 'pane-preset-select')}
          </div>
        <div class="regex-editor-wrap">
          <div class="regex-delimiters">
            <span class="regex-slash">/</span>
            <textarea
              id="pattern-input"
              class="regex-input"
              placeholder="^[A-Z]{3}-\\d{4}$"
              spellcheck="false"
              rows="2"
            >${esc(state.pattern)}</textarea>
            <span class="regex-slash">/</span>
          </div>
          <div class="editor-footer-status">
            <div class="compile-status ${state.error ? 'error' : 'valid'}">
              <span class="status-dot"></span>
              <span>${state.error ? 'SYNTAX ERROR' : 'VALID GRAMMAR'}</span>
            </div>
            <div class="ast-stat">
              ${state.error ? 'CHECK EXPRESSION' : `${stateCount} STATES · ${productionsCount} PRODUCTIONS`}
            </div>
          </div>
        </div>
        ${state.error ? `<div class="error-notice" role="alert">${esc(state.error)}</div>` : ''}

        <details class="input-instructions-box" open>
          <summary class="input-instructions-summary">
            <span>HOW & WHAT TO INPUT</span>
          </summary>
          <div class="input-instructions-content">
            <div class="instructions-rule">
              Enter regular expressions enclosed between <code>^</code> and <code>$</code>.
            </div>
            <div class="quick-tokens-grid">
              <button type="button" class="token-chip" data-insert="[A-Z]{3}" title="Insert 3 uppercase letters">
                <code>[A-Z]{3}</code>
                <span>Letters</span>
              </button>
              <button type="button" class="token-chip" data-insert="\\d{4}" title="Insert 4 digits">
                <code>\\d{4}</code>
                <span>Digits</span>
              </button>
              <button type="button" class="token-chip" data-insert="[a-z0-9]" title="Insert alphanumeric character">
                <code>[a-z0-9]</code>
                <span>Alphanum</span>
              </button>
              <button type="button" class="token-chip" data-insert="(US|CA|EU)" title="Insert alternation choices">
                <code>(A|B)</code>
                <span>Choices</span>
              </button>
              <button type="button" class="token-chip" data-insert="{2,5}" title="Insert repetition range">
                <code>{2,5}</code>
                <span>Range</span>
              </button>
              <button type="button" class="token-chip" data-insert="[0-9A-F]{2}" title="Insert 2 hex characters">
                <code>[0-9A-F]</code>
                <span>Hex</span>
              </button>
            </div>
            <div class="instructions-footer">
              <span>Need help? <a href="#" id="view-guide-tab-link">Open Full Input Guide (Tab 4) →</a></span>
            </div>
          </div>
        </details>
      </div>

      <div class="pane-section">
        <div class="section-title">
          <span>TRAVERSAL PARAMETERS</span>
        </div>
        <div class="params-grid">
          <div class="param-item">
            <label class="param-label" for="count-input">RECORD COUNT</label>
            <input id="count-input" class="param-input" type="number" min="1" max="10000" value="${state.count}" />
            <span class="param-hint">Number of strings (1 - 10,000)</span>
          </div>
          <div class="param-item">
            <label class="param-label" for="mode-input">TRAVERSAL ENGINE</label>
            <select id="mode-input" class="param-select">
              <option value="random" ${state.mode === 'random' ? 'selected' : ''}>Random Walk (Biased BFS)</option>
              <option value="chronological" ${state.mode === 'chronological' ? 'selected' : ''}>Chronological (Shortlex)</option>
            </select>
            <span class="param-hint">Random walk vs Sequential Shortlex</span>
          </div>
          <div class="param-item">
            <label class="param-label" for="format-input">EXPORT FORMAT</label>
            <select id="format-input" class="param-select">
              <option value="text" ${state.format === 'text' ? 'selected' : ''}>Plain Text (.txt)</option>
              <option value="json" ${state.format === 'json' ? 'selected' : ''}>JSON Array (.json)</option>
              <option value="csv" ${state.format === 'csv' ? 'selected' : ''}>CSV Format (.csv)</option>
              <option value="ts" ${state.format === 'ts' ? 'selected' : ''}>TypeScript Union (.ts)</option>
            </select>
            <span class="param-hint">File type for download or clipboard</span>
          </div>
          <div class="param-item">
            <label class="param-label" for="repeat-input">MAX REPEAT (* / +)</label>
            <input id="repeat-input" class="param-input" type="number" min="1" max="100" value="${state.maxRepeat}" />
            <span class="param-hint">Bounds loop depth for * and +</span>
          </div>
        </div>

        <details class="advanced-details">
          <summary class="advanced-summary">DETERMINISTIC SEEDING</summary>
          <div class="advanced-fields">
            <div class="param-item">
              <label class="param-label" for="seed-input">PRNG INTEGER SEED (OPTIONAL)</label>
              <input id="seed-input" class="param-input" type="number" placeholder="Leave blank for random" value="${esc(state.seed)}" />
              <span class="param-hint">Seed (e.g. 42) ensures 100% identical outputs</span>
            </div>
          </div>
        </details>
      </div>

        <div class="pane-section">
          <div class="section-title">
            <span>SESSION HISTORY</span>
          </div>
          <div class="history-list">${historyHtml}</div>
        </div>
      </div>

      <div class="execute-btn-wrap">
        <button id="generate-btn" class="execute-btn">
          <span>EXECUTE GENERATION</span>
          <span class="kbd-hint">${modKey} ↵</span>
        </button>
      </div>
    </aside>
  `;
}

function renderAutomataTab(): string {
  let matrixHtml = '';
  if (state.nfa && state.showMatrix) {
    const matrixData = buildTransitionMatrix(state.nfa);
    const thCols = matrixData.symbols.map((sym) => `<th>${esc(sym)}</th>`).join('');
    const rows = matrixData.states.map((s) => {
      const row = matrixData.matrix.get(s.id);
      const cells = matrixData.symbols.map((sym) => {
        const nexts = row?.get(sym) ?? [];
        return `<td>${nexts.length > 0 ? nexts.map((n) => `q${n}`).join(', ') : '—'}</td>`;
      }).join('');
      const acceptMark = state.nfa?.acceptStates.has(s) ? ' (ACCEPT)' : '';
      const startMark = state.nfa?.startState.id === s.id ? ' → ' : '';
      return `
        <tr>
          <td class="matrix-state-cell">${startMark}q${s.id}${acceptMark}</td>
          ${cells}
        </tr>
      `;
    }).join('');

    matrixHtml = `
      <section class="matrix-section">
        <div class="matrix-header">
          <span class="matrix-title">FORMAL TRANSITION MATRIX δ(q, σ)</span>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ink-muted);">STATES × SYMBOLS</span>
        </div>
        <div class="matrix-table-wrap">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="matrix-state-cell">STATE</th>
                ${thCols}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  return `
    <div class="automata-tab-view">
      <div id="automata-canvas-mount"></div>
      <div style="padding: 0 20px 16px; display: flex; justify-content: flex-end;">
        <button id="toggle-matrix-btn" class="icon-btn">
          ${state.showMatrix ? 'HIDE TRANSITION MATRIX' : 'SHOW TRANSITION MATRIX δ(q, σ)'}
        </button>
      </div>
      ${matrixHtml}
    </div>
  `;
}

function renderStreamTab(): string {
  if (state.records.length === 0) {
    return `
      <div class="stream-tab-view">
        <div class="automata-empty" style="border: 1px solid var(--border); background: var(--surface);">
          <p>No records generated yet. Click <strong>EXECUTE GENERATION</strong> (or press Cmd+Enter) to populate stream.</p>
        </div>
      </div>
    `;
  }

  const filtered = state.searchQuery.trim()
    ? state.records.filter((r) => r.toLowerCase().includes(state.searchQuery.toLowerCase()))
    : state.records;

  const lengths = state.records.map((r) => r.length);
  const minLen = Math.min(...lengths);
  const maxLen = Math.max(...lengths);
  const avgLen = (lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(1);
  const entropy = calculateEntropy(state.records);

  const rows = filtered.map((r, i) => {
    let highlightedVal = esc(r);
    if (state.searchQuery.trim()) {
      const q = esc(state.searchQuery);
      const re = new RegExp(q, 'gi');
      highlightedVal = highlightedVal.replace(re, (m) => `<mark>${m}</mark>`);
    }

    return `
      <div class="record-row">
        <span class="record-idx">${i + 1}</span>
        <span class="record-val">${highlightedVal}</span>
        <span class="record-meta">${r.length} chars</span>
      </div>
    `;
  }).join('');

  return `
    <div class="stream-tab-view">
      <div class="stream-summary-bar">
        <div class="summary-stats">
          <div class="summary-stat-group">
            <span class="summary-stat-label">TOTAL RECORDS</span>
            <span class="summary-stat-val">${state.records.length}</span>
          </div>
          <div class="summary-stat-group">
            <span class="summary-stat-label">LENGTH (MIN / AVG / MAX)</span>
            <span class="summary-stat-val">${minLen} / ${avgLen} / ${maxLen}</span>
          </div>
          <div class="summary-stat-group">
            <span class="summary-stat-label">SHANNON ENTROPY</span>
            <span class="summary-stat-val">${entropy} bits</span>
          </div>
          <div class="compliance-badge">
            <span>✓</span>
            <span>100% REGEX COMPLIANT</span>
          </div>
        </div>
        <div class="stream-actions">
          <button id="copy-stream-btn" class="icon-btn">COPY TO CLIPBOARD</button>
          <button id="export-stream-btn" class="icon-btn">DOWNLOAD FILE</button>
        </div>
      </div>

      <div class="stream-container">
        <div class="stream-filter-bar">
          <input
            id="stream-search-input"
            class="filter-input"
            type="text"
            placeholder="Search records in stream..."
            value="${esc(state.searchQuery)}"
          />
          <span class="filter-count">SHOWING ${filtered.length} OF ${state.records.length}</span>
        </div>
        <div class="records-feed">${rows}</div>
      </div>
    </div>
  `;
}

function renderGrammarTab(): string {
  if (!state.grammar || !state.ast) {
    return `
      <div class="grammar-tab-view">
        <div class="automata-empty" style="border: 1px solid var(--border); background: var(--surface);">
          <p>No grammar compiled. Enter a valid regular expression.</p>
        </div>
      </div>
    `;
  }

  const formattedGrammar = formatGrammar(state.grammar);
  const formattedAST = printAST(state.ast);

  const productionCards = Array.from(state.grammar.productions.entries()).map(([v, rules]) => {
    const isStart = v === state.grammar?.startVariable;
    const ruleItems = rules.map((r) => {
      if (r.type === 'step') {
        const term = r.terminal.type === 'literal' ? `'${r.terminal.char}'` : '[class]';
        return `<li>→ ${esc(term)} ${r.nextVariable}</li>`;
      }
      if (r.type === 'unit') {
        return `<li>→ ${r.nextVariable}</li>`;
      }
      return `<li>→ ε (halt)</li>`;
    }).join('');

    return `
      <div class="production-card">
        <div class="production-lhs">${v}${isStart ? ' (START)' : ''}</div>
        <ul class="production-rhs-list">${ruleItems}</ul>
      </div>
    `;
  }).join('');

  return `
    <div class="grammar-tab-view">
      <section class="grammar-panel">
        <div class="grammar-panel-header">
          <span class="grammar-panel-title">CHOMSKY TYPE-3 PRODUCTIONS (RIGHT-LINEAR GRAMMAR)</span>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ink-muted);">
            VARIABLES: ${state.grammar.variables.length} · START: ${state.grammar.startVariable}
          </span>
        </div>
        <div class="productions-grid">${productionCards}</div>
      </section>

      <section class="grammar-panel">
        <div class="grammar-panel-header">
          <span class="grammar-panel-title">FORMAL GRAMMAR NOTATION</span>
        </div>
        <pre class="grammar-code-block">${esc(formattedGrammar)}</pre>
      </section>

      <section class="grammar-panel">
        <div class="grammar-panel-header">
          <span class="grammar-panel-title">PARSED REGEX AST TREE</span>
        </div>
        <pre class="grammar-code-block">${esc(formattedAST)}</pre>
      </section>
    </div>
  `;
}

function renderWorkspaceTabs(): string {
  return `
    <div class="workspace-tabs-header">
      <nav class="tabs-nav">
        <button class="tab-btn ${state.activeTab === 'automata' ? 'active' : ''}" data-tab="automata">
          <span class="tab-key-badge">1</span>
          <span>AUTOMATA GRAPH</span>
        </button>
        <button class="tab-btn ${state.activeTab === 'stream' ? 'active' : ''}" data-tab="stream">
          <span class="tab-key-badge">2</span>
          <span>DATA STREAM</span>
          ${state.records.length > 0 ? `<span class="badge">(${state.records.length})</span>` : ''}
        </button>
        <button class="tab-btn ${state.activeTab === 'grammar' ? 'active' : ''}" data-tab="grammar">
          <span class="tab-key-badge">3</span>
          <span>GRAMMAR & AST</span>
        </button>
        <button class="tab-btn ${state.activeTab === 'guide' ? 'active' : ''}" data-tab="guide">
          <span class="tab-key-badge">4</span>
          <span>HOW TO INPUT</span>
        </button>
      </nav>
      <div class="tab-right-tools">
        <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ink-muted);">
          ENGINE: THOMPSON NFA
        </span>
      </div>
    </div>
  `;
}

function renderGuideTab(): string {
  const syntaxTokens = [
    { token: '\\d', name: 'Digit', desc: 'Any digit from 0 to 9', example: '^\\d{6}$', sample: '940182' },
    { token: '\\w', name: 'Word Character', desc: 'Alphanumeric and underscore [A-Za-z0-9_]', example: '^usr_\\w{6}$', sample: 'usr_a9k4z1' },
    { token: '\\s', name: 'Whitespace', desc: 'Space character', example: '^[A-Z]+\\s[A-Z]+$', sample: 'ALICE SMITH' },
    { token: '[A-Z]', name: 'Uppercase Set', desc: 'Any uppercase letter A through Z', example: '^[A-Z]{3}$', sample: 'LAX' },
    { token: '[a-z]', name: 'Lowercase Set', desc: 'Any lowercase letter a through z', example: '^[a-z]{5}$', sample: 'swift' },
    { token: '[0-9A-F]', name: 'Hexadecimal', desc: 'Hex digits 0-9 and uppercase A-F', example: '^0x[0-9A-F]{4}$', sample: '0x4F1B' },
    { token: '[^0-9]', name: 'Negated Class', desc: 'Matches any non-digit character', example: '^[^0-9]{4}$', sample: 'WXYZ' },
    { token: '{n}', name: 'Exact Count', desc: 'Matches preceding element exactly n times', example: '^[A-Z]{4}$', sample: 'CODE' },
    { token: '{min,max}', name: 'Range Count', desc: 'Matches between min and max occurrences', example: '^[a-z]{3,6}$', sample: 'python' },
    { token: '?', name: 'Optional', desc: 'Matches 0 or 1 occurrence', example: '^https?://api$', sample: 'http://api' },
    { token: '*', name: 'Zero or More', desc: 'Unbounded loop (bounded by Max Repeat)', example: '^A[0-9]*Z$', sample: 'A4819Z' },
    { token: '+', name: 'One or More', desc: '1 or more occurrences (bounded by Max Repeat)', example: '^word-\\d+$', sample: 'word-739' },
    { token: '(A|B)', name: 'Alternation', desc: 'Branch choice between two or more expressions', example: '^(USD|EUR|GBP)$', sample: 'EUR' },
    { token: '\\.', name: 'Escaped Literal', desc: 'Matches literal dot (and other specials: \\-, \\_)', example: '^v\\d+\\.\\d+$', sample: 'v2.1' },
  ];

  const syntaxRows = syntaxTokens.map((t) => `
    <tr>
      <td><code>${esc(t.token)}</code></td>
      <td><strong>${esc(t.name)}</strong></td>
      <td>${esc(t.desc)}</td>
      <td><code>${esc(t.example)}</code> <span style="color:var(--ink-muted); margin-left:6px;">→ "${esc(t.sample)}"</span></td>
      <td>
        <button class="btn-try-token" data-try-pattern="${esc(t.example)}" title="Load '${esc(t.example)}' into editor">
          Try Example
        </button>
      </td>
    </tr>
  `).join('');

  const templateCards = PRESETS.map((p) => `
    <div class="template-card">
      <div class="template-header">
        <span class="template-title">${esc(p.name)}</span>
        <span class="template-cat">${esc(p.category)}</span>
      </div>
      <div class="template-pattern">/${esc(p.pattern)}/</div>
      <button class="template-load-btn" data-try-pattern="${esc(p.pattern)}">
        Load Pattern ↵
      </button>
    </div>
  `).join('');

  return `
    <div class="guide-tab-view">
      <!-- 1. Rules: How to Input -->
      <section class="guide-panel">
        <div class="guide-panel-header">
          <span class="guide-panel-title">1. HOW TO INPUT PATTERNS (SYNTAX RULES)</span>
          <span class="guide-panel-badge">CHOMSKY TYPE-3 REGULAR GRAMMAR</span>
        </div>
        <div class="guide-panel-body">
          <div class="guide-rule-grid">
            <div class="guide-rule-card">
              <div class="rule-icon">📐</div>
              <div class="rule-content">
                <strong>Always Use Anchors (^ and $)</strong>
                <p>Wrap expressions with <code>^</code> (start) and <code>$</code> (end), e.g. <code>^[A-Z]{3}-\\d{4}$</code>. This guarantees exact string bounds rather than open-ended substrings.</p>
              </div>
            </div>
            <div class="guide-rule-card">
              <div class="rule-icon">⚙️</div>
              <div class="rule-content">
                <strong>No Outer Slashes in Textarea</strong>
                <p>Type raw regex syntax directly. The workbench already renders the surrounding <code>/ ... /</code> delimiters visually in the editor.</p>
              </div>
            </div>
            <div class="guide-rule-card">
              <div class="rule-icon">🛡️</div>
              <div class="rule-content">
                <strong>Regular vs Non-Regular Syntax</strong>
                <p>GrammarMock strictly compiles to finite state automata. Literals, sets, ranges, alternations, and repetitions are 100% compliant. Lookaheads <code>(?=...)</code> and backreferences <code>\\1</code> are rejected as non-regular.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. What to Input: Cheatsheet -->
      <section class="guide-panel">
        <div class="guide-panel-header">
          <span class="guide-panel-title">2. WHAT TO INPUT (REGEX SYNTAX CHEATSHEET)</span>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ink-muted);">CLICK "TRY EXAMPLE" TO LOAD INTO EDITOR</span>
        </div>
        <div class="guide-panel-body" style="overflow-x: auto;">
          <table class="guide-syntax-table">
            <thead>
              <tr>
                <th>TOKEN</th>
                <th>NAME</th>
                <th>WHAT IT MATCHES</th>
                <th>EXAMPLE PATTERN</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              ${syntaxRows}
            </tbody>
          </table>
        </div>
      </section>

      <!-- 3. What to Input for Parameters -->
      <section class="guide-panel">
        <div class="guide-panel-header">
          <span class="guide-panel-title">3. WHAT TO INPUT FOR PARAMETERS</span>
        </div>
        <div class="guide-panel-body">
          <div class="params-guide-grid">
            <div class="param-guide-card">
              <div class="param-guide-title">
                <span>RECORD COUNT</span>
                <span class="param-guide-tag">1 - 10,000</span>
              </div>
              <div class="param-guide-desc">
                Specifies how many mock records to generate in a single batch. Use 10-25 for quick preview, or 1,000-10,000 for database seed exports.
              </div>
            </div>

            <div class="param-guide-card">
              <div class="param-guide-title">
                <span>TRAVERSAL ENGINE</span>
                <span class="param-guide-tag">RANDOM / CHRONO</span>
              </div>
              <div class="param-guide-desc">
                <strong>Random Walk:</strong> Stochastic traversal through grammar branches. High entropy, varied mock data.<br/>
                <strong>Chronological (Shortlex):</strong> Exhaustive enumeration ordered by length, then alphabetical order (e.g. <code>AAA-0000</code>, <code>AAA-0001</code>).
              </div>
            </div>

            <div class="param-guide-card">
              <div class="param-guide-title">
                <span>MAX REPEAT (* / +)</span>
                <span class="param-guide-tag">1 - 100 (DEF: 5)</span>
              </div>
              <div class="param-guide-desc">
                Bounds the repetition depth of unbounded quantifiers like <code>*</code>, <code>+</code>, and <code>{min,}</code> during generation. Prevents infinite looping in cyclic grammars.
              </div>
            </div>

            <div class="param-guide-card">
              <div class="param-guide-title">
                <span>PRNG SEED</span>
                <span class="param-guide-tag">OPTIONAL INT</span>
              </div>
              <div class="param-guide-desc">
                Integer (e.g. <code>42</code> or <code>1001</code>). Using the same seed guarantees that GrammarMock reproduces the exact same sequence of records across multiple test runs.
              </div>
            </div>

            <div class="param-guide-card">
              <div class="param-guide-title">
                <span>EXPORT FORMAT</span>
                <span class="param-guide-tag">TXT / JSON / CSV / TS</span>
              </div>
              <div class="param-guide-desc">
                Choose the desired format for the Data Stream view: raw plain text lines, JSON array, CSV table, or a typed TypeScript string union.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Ready-to-Use Templates -->
      <section class="guide-panel">
        <div class="guide-panel-header">
          <span class="guide-panel-title">4. READY-TO-USE PATTERN TEMPLATES</span>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ink-muted);">1-CLICK LOAD INTO WORKBENCH</span>
        </div>
        <div class="guide-panel-body">
          <div class="templates-grid">
            ${templateCards}
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderShortcutsModal(): string {
  return `
    <div id="shortcuts-modal" class="modal-backdrop ${state.showShortcuts ? 'open' : ''}">
      <div class="modal-dialog">
        <div class="modal-header">
          <span class="modal-title">KEYBOARD SHORTCUTS</span>
          <button id="close-modal-btn" class="icon-btn" style="border:none;">✕</button>
        </div>
        <div class="modal-body">
          <div class="shortcut-row">
            <span>Execute generation run</span>
            <div class="shortcut-keys"><span class="shortcut-key">Cmd / Ctrl</span><span class="shortcut-key">Enter</span></div>
          </div>
          <div class="shortcut-row">
            <span>Focus pattern editor</span>
            <div class="shortcut-keys"><span class="shortcut-key">/</span></div>
          </div>
          <div class="shortcut-row">
            <span>Switch to Automata Graph</span>
            <div class="shortcut-keys"><span class="shortcut-key">1</span></div>
          </div>
          <div class="shortcut-row">
            <span>Switch to Data Stream</span>
            <div class="shortcut-keys"><span class="shortcut-key">2</span></div>
          </div>
          <div class="shortcut-row">
            <span>Switch to Grammar & AST</span>
            <div class="shortcut-keys"><span class="shortcut-key">3</span></div>
          </div>
          <div class="shortcut-row">
            <span>Switch to How to Input Guide</span>
            <div class="shortcut-keys"><span class="shortcut-key">4</span></div>
          </div>
          <div class="shortcut-row">
            <span>Toggle shortcuts HUD</span>
            <div class="shortcut-keys"><span class="shortcut-key">?</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGuideModal(): string {
  return `
    <div id="guide-modal" class="modal-backdrop ${state.showGuide ? 'open' : ''}">
      <div class="modal-dialog guide-dialog">
        <div class="modal-header">
          <span class="modal-title">📖 How to Use Data Generation</span>
          <button id="close-guide-btn" class="icon-btn" style="border:none;">✕</button>
        </div>
        <div class="modal-body guide-body">
          <div class="guide-section">
            <h4>1. Define or Select a Pattern</h4>
            <p>Type any standard regular expression in the left editor or choose an industry preset from the top dropdown (e.g. <code>Product SKU</code>, <code>Employee ID</code>, <code>UUID v4</code>, <code>SemVer</code>).</p>
            <div class="guide-callout">
              GrammarMock parses standard Type-3 regular expressions (literals, character classes <code>[a-z]</code>, ranges, shorthands <code>\\d</code>, <code>\\w</code>, <code>\\s</code>, quantifiers <code>*</code>, <code>+</code>, <code>?</code>, <code>{min,max}</code>, and alternation <code>(A|B)</code>).
            </div>
          </div>

          <div class="guide-section">
            <h4>2. Choose Generation Mode</h4>
            <ul>
              <li><strong>Random Walk:</strong> Generates stochastic mock records through probabilistic state transitions. Enter a <code>Seed</code> for 100% deterministic test fixtures.</li>
              <li><strong>Chronological:</strong> Enumerates strings in canonical <em>Shortlex</em> order (shortest strings first, followed by lexicographical order: <code>AAA-0000</code>, <code>AAA-0001</code>, <code>AAA-0002</code>...). Ideal for sequential identifiers.</li>
            </ul>
          </div>

          <div class="guide-section">
            <h4>3. Tune Parameters</h4>
            <ul>
              <li><strong>Count:</strong> Set the number of records to generate (1 to 10,000+).</li>
              <li><strong>Max Repeat:</strong> Sets the cycle-depth limit for unbounded quantifiers (<code>*</code> and <code>+</code>) to ensure finite strings.</li>
              <li><strong>PRNG Seed:</strong> Optional integer. Using the same seed reproduces the exact same records every time.</li>
            </ul>
          </div>

          <div class="guide-section">
            <h4>4. Generate & Export</h4>
            <p>Click <strong>GENERATE</strong> or press <code>Cmd/Ctrl + Enter</code>. In the <strong>Data Stream</strong> tab, you can search records, view entropy & length metrics, and export to <strong>TXT</strong>, <strong>JSON</strong>, <strong>CSV</strong>, or <strong>TypeScript</strong>.</p>
          </div>

          <div class="guide-section">
            <h4>5. Inspect Automata & Grammar</h4>
            <p>Switch tabs to explore the underlying formal models:</p>
            <ul>
              <li><strong>Automata Graph (Tab 1):</strong> Interactive Thompson NFA diagram with start/accept states, transition matrix, and step-by-step path tracer.</li>
              <li><strong>Grammar & AST (Tab 3):</strong> Formal Chomsky Right-Linear Grammar productions ($A \\to aB \\mid \\epsilon$) and parsed AST nodes.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

function render(): void {
  const content = state.activeTab === 'automata'
    ? renderAutomataTab()
    : state.activeTab === 'stream'
      ? renderStreamTab()
      : state.activeTab === 'grammar'
        ? renderGrammarTab()
        : renderGuideTab();

  app.innerHTML = `
    <div class="workbench-shell">
      ${renderHeader()}
      <div class="workbench-body">
        ${renderLeftPane()}
        <main class="right-pane">
          ${renderWorkspaceTabs()}
          <div class="tab-content">${content}</div>
        </main>
      </div>
      <div id="toast-message" class="toast-msg" role="status"></div>
      ${renderShortcutsModal()}
      ${renderGuideModal()}
    </div>
  `;

  attachEventListeners();

  // If in automata tab, mount the SVG canvas
  if (state.activeTab === 'automata') {
    const mount = app.querySelector<HTMLElement>('#automata-canvas-mount');
    if (mount) {
      visualizer = new AutomataVisualizer(mount);
      if (state.nfa) {
        visualizer.setNFA(state.nfa);
      } else {
        visualizer.render();
      }
    }
  }
}

function attachEventListeners(): void {
  // Theme toggle
  app.querySelector('#theme-btn')?.addEventListener('click', toggleTheme);

  // Guide modal
  app.querySelector('#guide-btn')?.addEventListener('click', () => {
    state.showGuide = true;
    render();
  });
  app.querySelector('#close-guide-btn')?.addEventListener('click', () => {
    state.showGuide = false;
    render();
  });
  app.querySelector('#guide-modal')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'guide-modal') {
      state.showGuide = false;
      render();
    }
  });

  // Shortcuts modal
  app.querySelector('#shortcuts-btn')?.addEventListener('click', () => {
    state.showShortcuts = true;
    render();
  });
  app.querySelector('#close-modal-btn')?.addEventListener('click', () => {
    state.showShortcuts = false;
    render();
  });
  app.querySelector('#shortcuts-modal')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'shortcuts-modal') {
      state.showShortcuts = false;
      render();
    }
  });

  // Preset Dropdowns (Header & Pane)
  const setupPresetSelect = (selector: string) => {
    const select = app.querySelector<HTMLSelectElement>(selector);
    if (!select) return;
    select.addEventListener('change', () => {
      const selected = select.value;
      if (selected) {
        state.pattern = selected;
        compileCurrentPattern();
        runGeneration();
      }
    });
  };

  setupPresetSelect('#header-preset-select');
  setupPresetSelect('#pane-preset-select');

  // History load
  app.querySelectorAll<HTMLElement>('[data-load-history]').forEach((item) => {
    item.addEventListener('click', () => {
      const p = item.dataset.loadHistory;
      if (p) {
        state.pattern = p;
        compileCurrentPattern();
        render();
      }
    });
  });

  // Pattern input
  const patternInput = app.querySelector<HTMLTextAreaElement>('#pattern-input');
  if (patternInput) {
    patternInput.addEventListener('input', () => {
      state.pattern = patternInput.value;
      compileCurrentPattern();

      // Sync preset dropdowns
      const isPreset = PRESETS.some((pr) => pr.pattern === state.pattern);
      const headerSelect = app.querySelector<HTMLSelectElement>('#header-preset-select');
      const paneSelect = app.querySelector<HTMLSelectElement>('#pane-preset-select');
      if (headerSelect) headerSelect.value = isPreset ? state.pattern : '';
      if (paneSelect) paneSelect.value = isPreset ? state.pattern : '';

      // Update footer status dynamically without blowing away input focus
      const statusWrap = app.querySelector('.compile-status');
      const astStat = app.querySelector('.ast-stat');
      if (statusWrap && astStat) {
        if (state.error) {
          statusWrap.className = 'compile-status error';
          statusWrap.innerHTML = '<span class="status-dot"></span><span>SYNTAX ERROR</span>';
          astStat.textContent = 'CHECK EXPRESSION';
        } else {
          statusWrap.className = 'compile-status valid';
          statusWrap.innerHTML = '<span class="status-dot"></span><span>VALID GRAMMAR</span>';
          const sc = state.nfa ? state.nfa.getAllStates().length : 0;
          const pc = state.grammar ? state.grammar.productions.size : 0;
          astStat.textContent = `${sc} STATES · ${pc} PRODUCTIONS`;
        }
      }
      if (state.activeTab === 'automata' && visualizer && state.nfa) {
        visualizer.setNFA(state.nfa);
      }
    });
  }

  // Parameters
  const countInput = app.querySelector<HTMLInputElement>('#count-input');
  countInput?.addEventListener('change', () => {
    state.count = Math.min(10000, Math.max(1, Number(countInput.value) || 10));
  });

  const modeInput = app.querySelector<HTMLSelectElement>('#mode-input');
  modeInput?.addEventListener('change', () => {
    state.mode = modeInput.value as 'random' | 'chronological';
  });

  const formatInput = app.querySelector<HTMLSelectElement>('#format-input');
  formatInput?.addEventListener('change', () => {
    state.format = formatInput.value as OutputFormat;
  });

  const repeatInput = app.querySelector<HTMLInputElement>('#repeat-input');
  repeatInput?.addEventListener('change', () => {
    state.maxRepeat = Math.min(100, Math.max(1, Number(repeatInput.value) || 5));
  });

  const seedInput = app.querySelector<HTMLInputElement>('#seed-input');
  seedInput?.addEventListener('input', () => {
    state.seed = seedInput.value;
  });

  // Generate button
  app.querySelector('#generate-btn')?.addEventListener('click', runGeneration);

  // Tabs
  app.querySelectorAll<HTMLElement>('[data-tab]').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      state.activeTab = tabBtn.dataset.tab as ActiveTab;
      render();
    });
  });

  // Matrix toggle
  app.querySelector('#toggle-matrix-btn')?.addEventListener('click', () => {
    state.showMatrix = !state.showMatrix;
    render();
  });

  // Stream search
  const searchInput = app.querySelector<HTMLInputElement>('#stream-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      state.searchQuery = searchInput.value;
      render();
      const updatedInput = app.querySelector<HTMLInputElement>('#stream-search-input');
      if (updatedInput) {
        updatedInput.focus();
        updatedInput.setSelectionRange(state.searchQuery.length, state.searchQuery.length);
      }
    });
  }

  // Copy records
  app.querySelector('#copy-stream-btn')?.addEventListener('click', async () => {
    try {
      const text = formatExportData(state.records, state.format);
      await navigator.clipboard.writeText(text);
      showToast('Copied records to clipboard');
    } catch {
      showToast('Clipboard unavailable');
    }
  });

  // Export records
  app.querySelector('#export-stream-btn')?.addEventListener('click', () => {
    const text = formatExportData(state.records, state.format);
    const mimeTypes: Record<OutputFormat, string> = {
      text: 'text/plain',
      json: 'application/json',
      csv: 'text/csv',
      ts: 'text/typescript',
    };
    const extensions: Record<OutputFormat, string> = {
      text: 'txt',
      json: 'json',
      csv: 'csv',
      ts: 'ts',
    };
    const blob = new Blob([text], { type: mimeTypes[state.format] });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `grammarmock-records.${extensions[state.format]}`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Download started');
  });

  // Token chips (insert syntax into pattern editor)
  app.querySelectorAll<HTMLElement>('.token-chip[data-insert]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const token = chip.dataset.insert;
      if (!token) return;
      let val = state.pattern;
      if (val.endsWith('$')) {
        val = val.slice(0, -1) + token + '$';
      } else {
        val = val + token;
      }
      state.pattern = val;
      compileCurrentPattern();
      runGeneration();
      showToast(`Inserted ${token}`);
    });
  });

  // Link to open Tab 4 (How to Input)
  app.querySelector('#view-guide-tab-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    state.activeTab = 'guide';
    render();
  });

  // Try pattern / load template buttons
  app.querySelectorAll<HTMLElement>('[data-try-pattern]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pat = btn.dataset.tryPattern;
      if (pat) {
        state.pattern = pat;
        compileCurrentPattern();
        runGeneration();
        showToast(`Loaded pattern: /${pat}/`);
      }
    });
  });
}

// Global hotkeys
window.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + Enter to generate
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    runGeneration();
    return;
  }

  // Don't intercept single key events when typing inside inputs or textareas
  const activeTag = document.activeElement?.tagName.toLowerCase();
  if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
    if (e.key === 'Escape') {
      (document.activeElement as HTMLElement)?.blur();
    }
    return;
  }

  if (e.key === '/') {
    e.preventDefault();
    app.querySelector<HTMLTextAreaElement>('#pattern-input')?.focus();
  } else if (e.key === '1') {
    state.activeTab = 'automata';
    render();
  } else if (e.key === '2') {
    state.activeTab = 'stream';
    render();
  } else if (e.key === '3') {
    state.activeTab = 'grammar';
    render();
  } else if (e.key === '4') {
    state.activeTab = 'guide';
    render();
  } else if (e.key === '?') {
    state.showShortcuts = !state.showShortcuts;
    render();
  } else if (e.key === 'Escape') {
    if (state.showShortcuts || state.showGuide) {
      state.showShortcuts = false;
      state.showGuide = false;
      render();
    }
  }
});

// Initial boot
applyTheme();
compileCurrentPattern();
runGeneration();
