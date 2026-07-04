import { assertMechanismContract } from './contract.mjs';

export class MechanismRegistry {
  #entries = new Map();

  register(record, implementation) {
    assertMechanismContract(implementation);
    if (record.id !== implementation.id || record.version !== implementation.version || record.runtimeKernel !== implementation.runtimeKernel) {
      throw new Error(`Registry metadata mismatch for ${record.id}`);
    }
    if (this.#entries.has(record.id)) throw new Error(`Mechanism already registered: ${record.id}`);
    this.#entries.set(record.id, { record: structuredClone(record), implementation });
  }

  get(id) {
    const entry = this.#entries.get(id);
    if (!entry) throw new Error(`Unknown mechanism: ${id}`);
    return entry;
  }

  list() {
    return [...this.#entries.values()].map(entry => structuredClone(entry.record));
  }
}

