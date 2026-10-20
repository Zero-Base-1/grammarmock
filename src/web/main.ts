import { compileGrammar, generateBulk } from '../index.js';
import { formatGrammar } from '../grammar/formatter.js';
import './styles.css';

type Page = 'Dashboard' | 'Generator' | 'Grammar Explorer' | 'Documentation';
type OutputFormat = 'text' | 'json' | 'csv';

interface Preset { name: string; pattern: string; category: string }
const presets: Preset[] = [
  { name: 'Product SKU', pattern: '^[A-Z]{2}-[0-9]{4}-[A-Z]{2}$', category: 'Inventory' },
  { name: 'Hex color', pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$', category: 'Design' },
  { name: 'API route', pattern: '^/(GET|POST|PUT)/api/v[1-3]/[a-z]{3,8}$', category: 'Development' },
  { name: 'Email handle', pattern: '^[a-z]{3,8}\\.[a-z]{3,8}@[a-z]{3,8}\\.(com|org|net)$', category: 'Identity' },
  { name: 'Employee ID', pattern: '^[A-Z]{3}-\\d{4}$', category: 'Identity' },
];
const state = {
  page: 'Dashboard' as Page, pattern: '', count: 10,
  mode: 'random' as 'random' | 'chronological', format: 'text' as OutputFormat,
  maxRepeat: 5, seed: '', records: [] as string[], error: '', runs: 0, generated: 0,
};
const app = document.querySelector<HTMLDivElement>('#app')!;

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
function icon(name: string): string {
  const paths: Record<string, string> = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    spark: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 14 1.1 2.4L22 17l-1.9.8L19 20l-.9-2.2L16 17l2.1-.6L19 14Z"/>',
    nodes: '<circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m10.8 7.2-3.6 8.6m5.9-8.6 3.6 8.6M8.5 18h7"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8m-8 4h6"/>',
    plus: '<path d="M12 5v14m-7-7h14"/>', arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3"/>',
    check: '<path d="m5 12 4 4L19 6"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? ''}</svg>`;
}
function sidebar(): string {
  const items: Array<[Page, string]> = [['Dashboard', 'grid'], ['Generator', 'spark'], ['Grammar Explorer', 'nodes'], ['Documentation', 'book']];
  return `<aside class="sidebar"><a class="brand" href="#dashboard" data-page="Dashboard"><span class="brand-mark">g<span>.</span></span><span>GrammarMock<small>MOCK DATA STUDIO</small></span></a><div class="nav-caption">WORKSPACE</div><nav class="nav-list" aria-label="Main navigation">${items.map(([label, glyph]) => `<button class="nav-link ${state.page === label ? 'active' : ''}" data-page="${label}">${icon(glyph)}<span>${label}</span></button>`).join('')}</nav><div class="sidebar-bottom"><div class="online"><span></span> Engine ready</div><div class="sidebar-note">Built for patterns that<br />need to be just right.</div><div class="version">GRAMMARM MOCK <span>v1.0.0</span></div></div></aside>`;
}
function header(title: string, subtitle: string, action = ''): string {
  return `<header class="page-header"><div><div class="eyebrow">YOUR WORKSPACE <span>/</span> ${esc(title.toUpperCase())}</div><h1>${esc(title)}</h1><p>${subtitle}</p></div>${action}</header>`;
}
function patternRows(): string {
  return presets.map((p, i) => `<div class="pattern-row"><div class="pattern-name"><span class="pattern-icon">${i === 0 ? '▦' : i === 1 ? '#' : '⌘'}</span><div><strong>${p.name}</strong><small>${p.category}</small></div></div><code>${esc(p.pattern)}</code><span class="pattern-meta">5 rules <span>·</span> 2–8 chars</span><button class="text-action" data-use-pattern="${i}">Use pattern ${icon('arrow')}</button></div>`).join('');
}
function formatRecords(records: string[], format: OutputFormat): string {
  if (format === 'json') return JSON.stringify(records, null, 2);
  if (format === 'csv') return ['value', ...records.map((r) => /[",\n]/.test(r) ? `"${r.replace(/"/g, '""')}"` : r)].join('\n');
  return records.join('\n');
}
function outputBlock(): string {
  if (state.error) return `<div class="error-banner" role="alert">${esc(state.error)}</div>`;
  if (!state.records.length) return '';
  return `<section class="card output-card"><div class="section-heading"><div><div class="section-kicker">YOUR RESULTS</div><h2>Generated records <span class="count-pill">${state.records.length}</span></h2></div><div class="output-actions"><button class="button button-quiet button-small" data-copy>${icon('copy')} Copy</button><button class="button button-quiet button-small" data-download>${icon('download')} Export</button></div></div><pre class="results">${esc(formatRecords(state.records, state.format))}</pre><div class="success-line">${icon('check')} All ${state.records.length} records match your expression</div></section>`;
}
function generatorForm(): string {
  return `<form class="card generator-card" id="generator-form"><div class="form-topline"><div><div class="section-kicker">PATTERN CONFIGURATION</div><h2>Define your pattern</h2><p>Enter a regular expression, then customize your output.</p></div><span class="secure-badge">${icon('check')} Runs locally</span></div><label class="field-label" for="pattern-input">Regular expression <span class="required">*</span><span class="field-hint">JavaScript regex syntax</span></label><div class="pattern-input-wrap"><span class="regex-slash">/</span><textarea id="pattern-input" name="pattern" rows="2" placeholder="^[A-Z]{3}-\\d{4}$" required>${esc(state.pattern)}</textarea><span class="regex-slash">/</span></div><div class="form-grid"><label class="field-label" for="count-input">Number of records<input id="count-input" type="number" min="1" max="1000" value="${state.count}" /></label><label class="field-label" for="mode-input">Generation order<select id="mode-input"><option value="random" ${state.mode === 'random' ? 'selected' : ''}>Random</option><option value="chronological" ${state.mode === 'chronological' ? 'selected' : ''}>Chronological</option></select></label><label class="field-label" for="format-input">Output format<select id="format-input"><option value="text" ${state.format === 'text' ? 'selected' : ''}>Plain text</option><option value="json" ${state.format === 'json' ? 'selected' : ''}>JSON</option><option value="csv" ${state.format === 'csv' ? 'selected' : ''}>CSV</option></select></label><label class="field-label" for="repeat-input">Max repeat <span class="field-hint">for * and +</span><input id="repeat-input" type="number" min="1" max="100" value="${state.maxRepeat}" /></label></div><details class="advanced-options"><summary>Advanced options <span>Optional seed for reproducible results</span></summary><label class="field-label" for="seed-input">Random seed<input id="seed-input" type="number" placeholder="Leave blank for a random seed" value="${esc(state.seed)}" /></label></details><div class="form-footer"><span class="form-assurance">${icon('check')} Your data never leaves this browser</span><button class="button button-primary" type="submit">${icon('spark')} Generate records</button></div></form>${outputBlock()}`;
}
function dashboard(): string {
  const action = `<button class="button button-primary" data-page="Generator">${icon('plus')} New generation</button>`;
  const activeBody = state.pattern ? `<div class="active-pattern">/${esc(state.pattern)}/</div><div class="active-card-footer"><span>Last generated ${state.records.length ? `${state.records.length} records` : 'Not yet'}</span><button class="button button-primary button-small" data-page="Generator">Open generator ${icon('arrow')}</button></div>` : `<p class="muted">Paste a regular expression to define your generator. It’s summarized and tested as you work.</p><div class="starter-row"><button class="button button-primary button-small" data-use-pattern="4">${icon('spark')} Try employee ID</button><button class="button button-outline button-small" data-page="Generator">Write my own</button></div>`;
  const recent = state.records.length ? `<div class="recent-run"><span class="run-icon">${icon('clock')}</span><div><strong>Generated ${state.records.length} records</strong><small>/${esc(state.pattern)}/ · ${state.mode} order</small></div><span class="run-time">Just now</span></div>` : `<div class="empty-state"><span class="empty-icon">${icon('nodes')}</span><strong>No runs yet</strong><p>Each generation is logged here in this session, so you can reproduce the exact same dataset later.</p><button class="text-action" data-page="Generator">Go to Generator ${icon('arrow')}</button></div>`;
  return `${header('Dashboard', 'Your active patterns, this session’s runs, and patterns ready to load.', action)}<div class="dashboard-grid"><section class="card active-card"><div class="section-heading"><div><div class="section-kicker">ACTIVE PATTERN</div><h2>${state.pattern ? 'Ready to generate' : 'Start with a pattern'}</h2></div><span class="status-pill"><span></span>${state.pattern ? 'Configured' : 'No pattern'}</span></div>${activeBody}</section><section class="card stats-card"><div class="section-kicker">THIS SESSION</div><div class="stats-number">${state.generated}</div><div class="stats-label">strings generated</div><div class="stat-list"><div><span>Generation runs</span><strong>${state.runs}</strong></div><div><span>Grammars parsed</span><strong>${state.runs}</strong></div><div><span>Distinct patterns</span><strong>${state.runs ? Math.min(state.runs, state.generated) : 0}</strong></div><div><span>Validity rate</span><strong>${state.generated ? '100%' : '—'}</strong></div></div><p class="tiny-note">Session data lives in memory and resets on reload.</p></section></div><section class="card recent-card"><div class="section-heading"><div><div class="section-kicker">ACTIVITY</div><h2>Recent runs</h2></div>${state.records.length ? '<button class="text-action" data-page="Generator">View generator →</button>' : ''}</div>${recent}</section><section class="card library-card"><div class="section-heading"><div><div class="section-kicker">GET A HEAD START</div><h2>Pattern library</h2><p>Ready-made patterns, compiled live to show the grammar each one produces.</p></div><button class="button button-quiet button-small" data-page="Grammar Explorer">Browse all ${icon('arrow')}</button></div><div class="pattern-list">${patternRows()}</div></section>`;
}
function grammarExplorer(): string {
  let grammar = ''; let error = '';
  if (state.pattern) try { grammar = formatGrammar(compileGrammar(state.pattern)); } catch (cause) { error = cause instanceof Error ? cause.message : 'Could not parse this pattern.'; }
  return `${header('Grammar Explorer', 'See how a regular expression becomes a right-linear grammar.')}<section class="card explorer-card"><div class="section-kicker">LIVE COMPILER</div><h2>Explore your grammar</h2><p class="muted">Choose a library pattern or enter one in the generator to inspect its productions.</p>${state.pattern ? `<div class="active-pattern">/${esc(state.pattern)}/</div>` : ''}${error ? `<div class="error-banner">${esc(error)}</div>` : grammar ? `<pre class="grammar-output">${esc(grammar)}</pre>` : `<div class="empty-state compact"><span class="empty-icon">${icon('nodes')}</span><strong>No pattern selected</strong><button class="text-action" data-page="Generator">Open the generator ${icon('arrow')}</button></div>`}</section><section class="card library-card"><div class="section-heading"><div><div class="section-kicker">START EXPLORING</div><h2>Pattern library</h2></div></div><div class="pattern-list">${patternRows()}</div></section>`;
}
function documentation(): string {
  return `${header('Documentation', 'A quick guide to getting the most out of GrammarMock.')}<div class="docs-grid"><section class="card docs-card"><div class="section-kicker">GETTING STARTED</div><h2>From pattern to production-ready data</h2><p>GrammarMock turns regular expressions into grammars and uses them to generate strings that match your format.</p><ol class="steps"><li><span>01</span><div><strong>Define a pattern</strong><p>Use JavaScript regular expression syntax, such as <code>^[A-Z]{3}-\\d{4}$</code>.</p></div></li><li><span>02</span><div><strong>Choose your options</strong><p>Pick a record count, random or chronological order, and a text, JSON, or CSV format.</p></div></li><li><span>03</span><div><strong>Generate and export</strong><p>Copy results to your clipboard or download a file. Everything runs locally in your browser.</p></div></li></ol><button class="button button-primary" data-page="Generator">Open generator ${icon('arrow')}</button></section><section class="card docs-card"><div class="section-kicker">SUPPORTED SYNTAX</div><h2>Regular expressions</h2><div class="syntax-list"><div><code>[A-Z]</code><span>Character ranges and classes</span></div><div><code>\\d · \\w · .</code><span>Shorthand classes and wildcard</span></div><div><code>a|b</code><span>Alternation</span></div><div><code>* · + · ?</code><span>Repetition and optional matches</span></div><div><code>{2,5}</code><span>Bounded quantifiers</span></div><div><code>(…)</code><span>Grouping</span></div></div><div class="notice">Lookarounds and backreferences are not supported because they cannot be represented by regular grammars.</div></section></div>`;
}
function render(): void {
  const content = state.page === 'Generator' ? `${header('Generator', 'Configure a regular expression and create compliant mock records.')}${generatorForm()}` : state.page === 'Grammar Explorer' ? grammarExplorer() : state.page === 'Documentation' ? documentation() : dashboard();
  app.innerHTML = `<div class="app-shell">${sidebar()}<main class="main-content"><div class="mobile-brand">${icon('spark')} GrammarMock</div><div class="content-wrap">${content}<footer class="page-footer"><span><span class="footer-dot"></span> All systems operational</span><span>Made for patterns that matter <span class="footer-heart">✳</span></span></footer></div></main></div><div class="toast" role="status" aria-live="polite"></div>`;
}
function usePattern(pattern: string): void { state.pattern = pattern; state.error = ''; state.page = 'Generator'; render(); }
function showToast(message: string): void {
  const toast = app.querySelector<HTMLElement>('.toast'); if (!toast) return;
  toast.textContent = message; toast.classList.add('visible'); window.setTimeout(() => toast.classList.remove('visible'), 2400);
}
app.addEventListener('click', async (event) => {
  const target = event.target as HTMLElement;
  const pageButton = target.closest<HTMLElement>('[data-page]');
  const patternButton = target.closest<HTMLElement>('[data-use-pattern]');
  if (pageButton) { state.page = pageButton.dataset.page as Page; render(); return; }
  if (patternButton) { const preset = presets[Number(patternButton.dataset.usePattern)]; if (preset) usePattern(preset.pattern); return; }
  if (target.closest('[data-copy]')) {
    try { await navigator.clipboard.writeText(formatRecords(state.records, state.format)); showToast('Copied results to clipboard'); }
    catch { showToast('Clipboard access is unavailable in this browser'); }
  }
  if (target.closest('[data-download]')) {
    const blob = new Blob([formatRecords(state.records, state.format)], { type: state.format === 'json' ? 'application/json' : 'text/plain' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `grammarmock-results.${state.format === 'text' ? 'txt' : state.format}`; link.click(); URL.revokeObjectURL(link.href); showToast('Your export is ready');
  }
});
app.addEventListener('submit', (event) => {
  if ((event.target as HTMLElement).id !== 'generator-form') return;
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  state.pattern = String(new FormData(form).get('pattern') ?? '').trim();
  state.count = Math.min(1000, Math.max(1, Number((form.querySelector('#count-input') as HTMLInputElement).value) || 1));
  state.mode = (form.querySelector('#mode-input') as HTMLSelectElement).value as 'random' | 'chronological';
  state.format = (form.querySelector('#format-input') as HTMLSelectElement).value as OutputFormat;
  state.maxRepeat = Math.min(100, Math.max(1, Number((form.querySelector('#repeat-input') as HTMLInputElement).value) || 5));
  state.seed = (form.querySelector('#seed-input') as HTMLInputElement).value;
  try {
    if (!state.pattern) throw new Error('Enter a regular expression to generate records.');
    const records = generateBulk(state.pattern, state.count, { mode: state.mode, maxRepeat: state.maxRepeat, ...(state.seed ? { seed: Number(state.seed) } : {}) });
    const regex = new RegExp(state.pattern);
    if (records.some((record) => !regex.test(record))) throw new Error(`A generated record did not match /${state.pattern}/. Try a different pattern.`);
    state.records = records; state.runs++; state.generated += records.length; state.error = '';
  } catch (cause) { state.records = []; state.error = cause instanceof Error ? cause.message : 'Could not generate records. Check your regular expression.'; }
  render();
});
render();
