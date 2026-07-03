import type { PuzzleData } from '../../models/PuzzleData';
import type { ConstraintTransferLogic } from '../../engines/ConstraintTransferEngine';
import type { IPuzzleLayout, PuzzleLayoutCallbacks, PuzzleRenderParams } from './IPuzzleLayout';

export class ConstraintTransferLayout implements IPuzzleLayout {
  private wrapper!: HTMLElement;
  private logic!: ConstraintTransferLogic;
  private callbacks: PuzzleLayoutCallbacks | null = null;
  private theme: any;
  
  // State
  private entityLocations: Record<string, 'LOC_START' | 'LOC_END' | 'CARRIER'> = {};
  private carrierLocation: 'LOC_START' | 'LOC_END' = 'LOC_START';

  mount(container: HTMLElement): void {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'constraint-transfer-layout';
    this.wrapper.style.width = '100%';
    this.wrapper.style.height = '100%';
    this.wrapper.style.display = 'flex';
    this.wrapper.style.flexDirection = 'column';
    this.wrapper.style.alignItems = 'center';
    this.wrapper.style.justifyContent = 'center';
    this.wrapper.style.background = '#1a1a2e'; // Dark theme
    this.wrapper.style.color = '#fff';
    container.appendChild(this.wrapper);
  }

  destroy(): void {
    if (this.wrapper && this.wrapper.parentElement) {
      this.wrapper.parentElement.removeChild(this.wrapper);
    }
  }

  setCallbacks(cbs: PuzzleLayoutCallbacks): void {
    this.callbacks = cbs;
  }

  render(params: PuzzleRenderParams): void {
    this.logic = params.puzzle.initial_state as ConstraintTransferLogic;
    this.theme = params.puzzle.theme;
    
    // Initialize state
    this.logic.entities.forEach(e => this.entityLocations[e] = 'LOC_START');
    this.carrierLocation = 'LOC_START';

    this.draw();
  }

  private draw(): void {
    this.wrapper.innerHTML = '';

    const title = document.createElement('h2');
    title.innerText = this.theme.title;
    this.wrapper.appendChild(title);

    const rules = document.createElement('p');
    rules.innerText = this.theme.rules_description;
    rules.style.maxWidth = '600px';
    rules.style.textAlign = 'center';
    rules.style.marginBottom = '20px';
    this.wrapper.appendChild(rules);

    // Main play area
    const playArea = document.createElement('div');
    playArea.style.display = 'flex';
    playArea.style.width = '800px';
    playArea.style.height = '400px';
    playArea.style.border = '2px solid #444';
    playArea.style.background = '#2a2a4a';
    this.wrapper.appendChild(playArea);

    // Left Bank
    const leftBank = this.createZone('LOC_START', 'Start');
    // Middle (River/Path)
    const middle = document.createElement('div');
    middle.style.flex = '1';
    middle.style.display = 'flex';
    middle.style.flexDirection = 'column';
    middle.style.alignItems = 'center';
    middle.style.justifyContent = 'center';
    middle.style.background = '#111';
    // Right Bank
    const rightBank = this.createZone('LOC_END', 'End');

    // Carrier
    const carrier = document.createElement('div');
    carrier.style.width = '150px';
    carrier.style.minHeight = '100px';
    carrier.style.border = '2px dashed #f1c40f';
    carrier.style.display = 'flex';
    carrier.style.flexWrap = 'wrap';
    carrier.style.padding = '10px';
    carrier.style.marginTop = this.carrierLocation === 'LOC_START' ? '20px' : '200px';
    carrier.style.transition = 'margin-top 0.5s ease-in-out';
    
    // Draw entities
    this.logic.entities.forEach(entityId => {
      const el = this.createEntityElement(entityId);
      if (this.entityLocations[entityId] === 'LOC_START') leftBank.appendChild(el);
      else if (this.entityLocations[entityId] === 'LOC_END') rightBank.appendChild(el);
      else if (this.entityLocations[entityId] === 'CARRIER') carrier.appendChild(el);
    });

    middle.appendChild(carrier);

    const moveBtn = document.createElement('button');
    moveBtn.innerText = 'Move Carrier';
    moveBtn.style.marginTop = '20px';
    moveBtn.style.padding = '10px 20px';
    moveBtn.style.fontSize = '16px';
    moveBtn.style.cursor = 'pointer';
    moveBtn.onclick = () => this.tryMoveCarrier();
    middle.appendChild(moveBtn);

    playArea.appendChild(leftBank);
    playArea.appendChild(middle);
    playArea.appendChild(rightBank);
  }

  private createZone(id: string, label: string): HTMLElement {
    const zone = document.createElement('div');
    zone.style.width = '200px';
    zone.style.height = '100%';
    zone.style.borderRight = id === 'LOC_START' ? '2px solid #444' : 'none';
    zone.style.borderLeft = id === 'LOC_END' ? '2px solid #444' : 'none';
    zone.style.display = 'flex';
    zone.style.flexDirection = 'column';
    zone.style.padding = '10px';
    zone.style.boxSizing = 'border-box';
    return zone;
  }

  private createEntityElement(entityId: string): HTMLElement {
    const el = document.createElement('div');
    el.style.padding = '10px';
    el.style.margin = '5px';
    el.style.background = '#3498db';
    el.style.borderRadius = '5px';
    el.style.cursor = 'pointer';
    el.style.textAlign = 'center';
    el.innerText = this.theme.entity_map[entityId] || entityId;
    
    el.onclick = () => this.handleEntityClick(entityId);
    return el;
  }

  private handleEntityClick(entityId: string): void {
    const loc = this.entityLocations[entityId];
    
    if (loc === 'CARRIER') {
      // Move back to current bank
      this.entityLocations[entityId] = this.carrierLocation;
    } else if (loc === this.carrierLocation) {
      // Move into carrier if space permits
      const currentlyInCarrier = Object.values(this.entityLocations).filter(l => l === 'CARRIER').length;
      if (currentlyInCarrier < this.logic.carrier.capacity) {
        this.entityLocations[entityId] = 'CARRIER';
      } else {
        alert("Carrier is full!");
      }
    }
    this.draw();
  }

  private tryMoveCarrier(): void {
    // 1. Check pilot
    const inCarrier = Object.entries(this.entityLocations).filter(([_, loc]) => loc === 'CARRIER').map(([id]) => id);
    if (this.logic.carrier.requiresPilot) {
      const hasPilot = inCarrier.some(id => this.logic.carrier.pilotEntities.includes(id));
      if (!hasPilot) {
        alert("Carrier requires a pilot to move!");
        return;
      }
    }

    // 2. Check conflicts on the bank being left behind
    const leftBehind = Object.entries(this.entityLocations)
      .filter(([_, loc]) => loc === this.carrierLocation)
      .map(([id]) => id);

    // If pilot/safeguard is left behind, it prevents conflicts.
    const hasSafeguard = leftBehind.some(id => this.logic.carrier.pilotEntities.includes(id));
    
    if (!hasSafeguard) {
      for (const conflict of this.logic.conflicts) {
        if (leftBehind.includes(conflict.predator) && leftBehind.includes(conflict.prey)) {
          const predName = this.theme.entity_map[conflict.predator];
          const preyName = this.theme.entity_map[conflict.prey];
          alert(`Game Over! The ${predName} destroyed the ${preyName}!`);
          this.reset();
          return;
        }
      }
    }

    // Move
    this.carrierLocation = this.carrierLocation === 'LOC_START' ? 'LOC_END' : 'LOC_START';
    this.draw();

    this.checkWin();
  }

  private checkWin(): void {
    const allAtEnd = this.logic.entities.every(e => 
      this.entityLocations[e] === 'LOC_END' || (this.entityLocations[e] === 'CARRIER' && this.carrierLocation === 'LOC_END')
    );
    if (allAtEnd) {
      setTimeout(() => {
        alert("You won!");
        if (this.callbacks) this.callbacks.onWin();
      }, 100);
    }
  }

  private reset(): void {
    this.logic.entities.forEach(e => this.entityLocations[e] = 'LOC_START');
    this.carrierLocation = 'LOC_START';
    this.draw();
  }
}
