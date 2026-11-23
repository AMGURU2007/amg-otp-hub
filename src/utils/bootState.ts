// Shared in-memory session tracking for the 3-stage sequential boot machine.
// Resets to false on browser page reload / pressing Enter on the URL bar.
// Remains true across client-side router transitions.

export type BootStage = 'STAGE_1_SHATTER' | 'STAGE_2_ACTIVE' | 'STAGE_3_READY';

class BootStateManager {
  private _hasColdBooted = false;
  private _listeners: Set<(stage: BootStage) => void> = new Set();

  get hasColdBooted(): boolean {
    return this._hasColdBooted;
  }

  set hasColdBooted(val: boolean) {
    this._hasColdBooted = val;
  }

  subscribe(listener: (stage: BootStage) => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  triggerStage(stage: BootStage): void {
    this._listeners.forEach(fn => fn(stage));
  }

  triggerWelcomeRoll(): void {
    this.triggerStage('STAGE_2_ACTIVE');
  }
}

export const bootManager = new BootStateManager();
