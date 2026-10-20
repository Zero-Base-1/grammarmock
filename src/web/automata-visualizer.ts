import { NFA } from '../automata/nfa.js';
import { State, Transition } from '../automata/state.js';

export interface VisualizerOptions {
  interactive?: boolean;
  onStateSelect?: (state: State | null) => void;
}

export function formatTransitionLabel(t: Transition): string {
  const label = t.label;
  if (label.type === 'epsilon') {
    return 'ε';
  }
  if (label.type === 'literal') {
    return label.char === ' ' ? '␣' : `'${label.char}'`;
  }
  if (label.type === 'char_class') {
    if (label.isWildcard) return '.';
    const parts: string[] = [];
    for (const r of label.ranges) {
      parts.push(`${r.from}-${r.to}`);
    }
    for (const c of label.chars) {
      parts.push(c);
    }
    const inner = parts.join('');
    return label.negated ? `[^${inner}]` : `[${inner}]`;
  }
  return '?';
}

export interface TransitionMatrixData {
  states: State[];
  symbols: string[];
  matrix: Map<number, Map<string, number[]>>;
}

export function buildTransitionMatrix(nfa: NFA): TransitionMatrixData {
  const states = nfa.getAllStates().sort((a, b) => a.id - b.id);
  const symbolSet = new Set<string>();

  for (const s of states) {
    for (const t of s.transitions) {
      symbolSet.add(formatTransitionLabel(t));
    }
  }

  // Ensure ε is first or last in symbols
  const symbols = Array.from(symbolSet).sort((a, b) => {
    if (a === 'ε') return -1;
    if (b === 'ε') return 1;
    return a.localeCompare(b);
  });

  const matrix = new Map<number, Map<string, number[]>>();

  for (const s of states) {
    const row = new Map<string, number[]>();
    for (const sym of symbols) {
      row.set(sym, []);
    }
    for (const t of s.transitions) {
      const sym = formatTransitionLabel(t);
      const list = row.get(sym) ?? [];
      if (!list.includes(t.target.id)) {
        list.push(t.target.id);
      }
      row.set(sym, list);
    }
    matrix.set(s.id, row);
  }

  return { states, symbols, matrix };
}

export class AutomataVisualizer {
  private container: HTMLElement;
  private nfa: NFA | null = null;
  private selectedStateId: number | null = null;
  private zoom = 1;
  private panX = 40;
  private panY = 40;
  private isPanning = false;
  private startPan = { x: 0, y: 0 };

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public setNFA(nfa: NFA): void {
    this.nfa = nfa;
    this.selectedStateId = null;
    this.resetView();
    this.render();
  }

  public resetView(): void {
    this.zoom = 1;
    this.panX = 80;
    this.panY = 220;
  }

  public zoomIn(): void {
    const rect = this.container.getBoundingClientRect();
    const cx = rect.width > 0 ? rect.width / 2 : 400;
    const cy = rect.height > 0 ? rect.height / 2 : 220;
    const newZoom = Math.min(4.0, this.zoom * 1.2);
    this.panX = cx - (cx - this.panX) * (newZoom / this.zoom);
    this.panY = cy - (cy - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;
    this.applyTransform();
  }

  public zoomOut(): void {
    const rect = this.container.getBoundingClientRect();
    const cx = rect.width > 0 ? rect.width / 2 : 400;
    const cy = rect.height > 0 ? rect.height / 2 : 220;
    const newZoom = Math.max(0.15, this.zoom / 1.2);
    this.panX = cx - (cx - this.panX) * (newZoom / this.zoom);
    this.panY = cy - (cy - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;
    this.applyTransform();
  }

  public fitView(): void {
    this.resetView();
    this.applyTransform();
  }

  private applyTransform(): void {
    const g = this.container.querySelector<SVGGElement>('#automata-viewport');
    if (g) {
      g.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    }
    const zoomLabel = this.container.querySelector<HTMLElement>('.zoom-level-text');
    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(this.zoom * 100)}%`;
    }
  }

  public render(): void {
    if (!this.nfa) {
      this.container.innerHTML = `
        <div class="automata-empty">
          <p>No automaton compiled yet. Enter a valid pattern to visualize the state machine.</p>
        </div>`;
      return;
    }

    const states = this.nfa.getAllStates();
    if (states.length === 0) {
      this.container.innerHTML = `<div class="automata-empty"><p>Automaton has no states.</p></div>`;
      return;
    }

    // Layering / Ranking states using BFS from start state
    const ranks = new Map<number, number>();
    const queue: { state: State; rank: number }[] = [{ state: this.nfa.startState, rank: 0 }];
    ranks.set(this.nfa.startState.id, 0);

    const visited = new Set<number>([this.nfa.startState.id]);

    while (queue.length > 0) {
      const { state, rank } = queue.shift()!;
      for (const t of state.transitions) {
        if (!visited.has(t.target.id)) {
          visited.add(t.target.id);
          ranks.set(t.target.id, rank + 1);
          queue.push({ state: t.target, rank: rank + 1 });
        }
      }
    }

    // Any unvisited states (disconnected)
    for (const s of states) {
      if (!ranks.has(s.id)) {
        ranks.set(s.id, 0);
      }
    }

    // Group states by rank
    const rankGroups = new Map<number, State[]>();
    for (const s of states) {
      const r = ranks.get(s.id) ?? 0;
      const group = rankGroups.get(r) ?? [];
      group.push(s);
      rankGroups.set(r, group);
    }

    // Assign (x, y) coordinates
    const statePositions = new Map<number, { x: number; y: number }>();
    const xStep = 150;
    const yStep = 95;

    let maxX = 0;
    let maxY = 0;

    const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
    for (const r of sortedRanks) {
      const group = rankGroups.get(r) ?? [];
      const totalH = (group.length - 1) * yStep;
      const startY = 0 - totalH / 2;

      group.forEach((s, idx) => {
        const x = r * xStep;
        const y = startY + idx * yStep;
        statePositions.set(s.id, { x, y });
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });
    }

    // Build SVG transitions
    const transitionSvgs: string[] = [];

    // Track transitions between same pair of nodes to arc them
    const pairCount = new Map<string, number>();

    for (const s of states) {
      const fromPos = statePositions.get(s.id);
      if (!fromPos) continue;

      for (const t of s.transitions) {
        const toPos = statePositions.get(t.target.id);
        if (!toPos) continue;

        const labelText = formatTransitionLabel(t);
        const pairKey = `${s.id}->${t.target.id}`;
        const count = pairCount.get(pairKey) ?? 0;
        pairCount.set(pairKey, count + 1);

        const isSelfLoop = s.id === t.target.id;
        const isBackwards = toPos.x < fromPos.x;
        const isSameRank = toPos.x === fromPos.x && s.id !== t.target.id;

        const isSelected = this.selectedStateId === s.id || this.selectedStateId === t.target.id;

        if (isSelfLoop) {
          // Loop on top
          const loopRadius = 24 + count * 8;
          const x1 = fromPos.x - 12;
          const y1 = fromPos.y - 20;
          const x2 = fromPos.x + 12;
          const y2 = fromPos.y - 20;
          const pathD = `M ${x1} ${y1} C ${fromPos.x - loopRadius} ${fromPos.y - 50 - count * 15}, ${fromPos.x + loopRadius} ${fromPos.y - 50 - count * 15}, ${x2} ${y2}`;

          transitionSvgs.push(`
            <g class="transition-edge ${isSelected ? 'highlight' : ''}">
              <path d="${pathD}" class="edge-path" marker-end="url(#arrow)" />
              <rect x="${fromPos.x - 14}" y="${fromPos.y - 48 - count * 15}" width="28" height="16" class="edge-label-bg" rx="2" />
              <text x="${fromPos.x}" y="${fromPos.y - 37 - count * 15}" class="edge-label">${this.esc(labelText)}</text>
            </g>
          `);
        } else if (isBackwards || isSameRank) {
          // Curved arc above or below
          const curveOffset = isBackwards ? -60 - count * 20 : (toPos.y > fromPos.y ? 35 : -35);
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2 + curveOffset;

          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const angle = Math.atan2(dy, dx);
          const nodeRadius = 22;

          const startX = fromPos.x + nodeRadius * Math.cos(angle);
          const startY = fromPos.y + nodeRadius * Math.sin(angle);
          const endX = toPos.x - (nodeRadius + 4) * Math.cos(angle);
          const endY = toPos.y - (nodeRadius + 4) * Math.sin(angle);

          const pathD = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

          transitionSvgs.push(`
            <g class="transition-edge ${isSelected ? 'highlight' : ''}">
              <path d="${pathD}" class="edge-path" marker-end="url(#arrow)" />
              <rect x="${midX - 16}" y="${midY - 8}" width="32" height="16" class="edge-label-bg" rx="2" />
              <text x="${midX}" y="${midY + 4}" class="edge-label">${this.esc(labelText)}</text>
            </g>
          `);
        } else {
          // Direct or slightly offset forward edge
          const nodeRadius = 22;
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const angle = Math.atan2(dy, dx);

          const startX = fromPos.x + nodeRadius * Math.cos(angle);
          const startY = fromPos.y + nodeRadius * Math.sin(angle);
          const endX = toPos.x - (nodeRadius + 4) * Math.cos(angle);
          const endY = toPos.y - (nodeRadius + 4) * Math.sin(angle);

          if (count > 0) {
            // Multi-edge between same nodes: arc it
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2 + (count * 25 * (count % 2 === 0 ? 1 : -1));
            const pathD = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
            transitionSvgs.push(`
              <g class="transition-edge ${isSelected ? 'highlight' : ''}">
                <path d="${pathD}" class="edge-path" marker-end="url(#arrow)" />
                <rect x="${midX - 16}" y="${midY - 8}" width="32" height="16" class="edge-label-bg" rx="2" />
                <text x="${midX}" y="${midY + 4}" class="edge-label">${this.esc(labelText)}</text>
              </g>
            `);
          } else {
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            transitionSvgs.push(`
              <g class="transition-edge ${isSelected ? 'highlight' : ''}">
                <line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" class="edge-path" marker-end="url(#arrow)" />
                <rect x="${midX - 14}" y="${midY - 10}" width="28" height="16" class="edge-label-bg" rx="2" />
                <text x="${midX}" y="${midY + 2}" class="edge-label">${this.esc(labelText)}</text>
              </g>
            `);
          }
        }
      }
    }

    // Build SVG state nodes
    const stateSvgs: string[] = [];
    const isStart = (s: State) => s.id === this.nfa?.startState.id;
    const isAccept = (s: State) => this.nfa?.acceptStates.has(s);

    for (const s of states) {
      const pos = statePositions.get(s.id);
      if (!pos) continue;

      const selected = this.selectedStateId === s.id;
      const accept = isAccept(s);
      const start = isStart(s);

      let startArrowSvg = '';
      if (start) {
        startArrowSvg = `
          <g class="start-indicator">
            <line x1="${pos.x - 56}" y1="${pos.y}" x2="${pos.x - 24}" y2="${pos.y}" class="start-arrow-line" marker-end="url(#start-arrow)" />
            <text x="${pos.x - 40}" y="${pos.y - 7}" class="start-label">START</text>
          </g>
        `;
      }

      stateSvgs.push(`
        ${startArrowSvg}
        <g class="state-node ${selected ? 'selected' : ''} ${accept ? 'accept-node' : ''}" data-state-id="${s.id}" transform="translate(${pos.x}, ${pos.y})">
          <circle r="22" class="state-outer-circle" />
          ${accept ? '<circle r="17" class="state-inner-circle" />' : ''}
          <text dy="5" class="state-text">q${s.id}</text>
        </g>
      `);
    }

    this.container.innerHTML = `
      <div class="automata-canvas-wrapper">
        <div class="automata-toolbar">
          <div class="toolbar-info">
            <span class="toolbar-stat"><strong>${states.length}</strong> STATES</span>
            <span class="toolbar-stat"><strong>${this.nfa.acceptStates.size}</strong> ACCEPT</span>
            <span class="toolbar-stat">START: <strong>q${this.nfa.startState.id}</strong></span>
          </div>
          <div class="canvas-controls">
            <button class="canvas-btn" data-action="zoom-in" title="Zoom In">+</button>
            <span class="zoom-level-text">${Math.round(this.zoom * 100)}%</span>
            <button class="canvas-btn" data-action="zoom-out" title="Zoom Out">−</button>
            <button class="canvas-btn" data-action="fit" title="Reset View">RESET</button>
          </div>
        </div>
        <div class="automata-viewport-container">
          <svg class="automata-svg" style="width: 100%; height: 100%; overflow: visible; pointer-events: all;">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" class="marker-path" />
              </marker>
              <marker id="start-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" class="start-marker-path" />
              </marker>
            </defs>
            <rect width="10000" height="10000" x="-5000" y="-5000" fill="transparent" class="canvas-bg-hitbox" style="pointer-events: all;" />
            <g id="automata-viewport" transform="translate(${this.panX}, ${this.panY}) scale(${this.zoom})">
              <g class="edges-layer">${transitionSvgs.join('')}</g>
              <g class="states-layer">${stateSvgs.join('')}</g>
            </g>
          </svg>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const viewportContainer = this.container.querySelector<HTMLElement>('.automata-viewport-container');
    const svg = this.container.querySelector<SVGSVGElement>('.automata-svg');
    if (!viewportContainer || !svg) return;

    // Zoom and pan buttons
    const zoomInBtn = this.container.querySelector('[data-action="zoom-in"]');
    const zoomOutBtn = this.container.querySelector('[data-action="zoom-out"]');
    const fitBtn = this.container.querySelector('[data-action="fit"]');

    zoomInBtn?.addEventListener('click', () => this.zoomIn());
    zoomOutBtn?.addEventListener('click', () => this.zoomOut());
    fitBtn?.addEventListener('click', () => this.fitView());

    // Left click mouse drag pan
    viewportContainer.addEventListener('mousedown', (e: MouseEvent) => {
      // Only handle left-click
      if (e.button !== 0) return;

      const target = e.target as Element;
      // Allow state node clicks
      if (target.closest('.state-node')) return;

      // Prevent native text selection / image drag ghosting
      e.preventDefault();
      this.isPanning = true;
      this.startPan = { x: e.clientX - this.panX, y: e.clientY - this.panY };
      viewportContainer.classList.add('panning');
      svg.classList.add('panning');

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!this.isPanning) return;
        moveEvent.preventDefault();
        this.panX = moveEvent.clientX - this.startPan.x;
        this.panY = moveEvent.clientY - this.startPan.y;
        this.applyTransform();
      };

      const onMouseUp = () => {
        this.isPanning = false;
        viewportContainer.classList.remove('panning');
        svg.classList.remove('panning');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // Wheel zoom centered at cursor
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newZoom = Math.min(4.0, Math.max(0.15, this.zoom * zoomFactor));

      this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
      this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
      this.zoom = newZoom;

      this.applyTransform();
    }, { passive: false });

    // State selection
    const stateNodes = this.container.querySelectorAll<SVGGElement>('.state-node');
    stateNodes.forEach((node) => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const stateId = Number(node.dataset.stateId);
        if (this.selectedStateId === stateId) {
          this.selectedStateId = null;
        } else {
          this.selectedStateId = stateId;
        }
        this.render();
      });
    });
  }

  private esc(str: string): string {
    return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  }
}
