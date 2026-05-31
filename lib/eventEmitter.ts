type EventMap = Record<string, any>;

export default class EventEmitter<TEvents extends EventMap> {
  private listeners: Map<keyof TEvents, Set<(data: any) => void>> = new Map();

  on<Key extends keyof TEvents>(
    event: Key,
    callback: (data: TEvents[Key]) => void,
  ) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  emit<Key extends keyof TEvents>(event: Key, data: TEvents[Key]) {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error in listener for "${String(event)}":`, err);
      }
    });
  }

  once<Key extends keyof TEvents>(
    event: Key,
    callback: (data: TEvents[Key]) => void,
  ) {
    const wrapper = (data: TEvents[Key]) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  off<Key extends keyof TEvents>(
    event: Key,
    callback: (data: TEvents[Key]) => void,
  ) {
    this.listeners.get(event)?.delete(callback);
  }

  getListenersCount<Key extends keyof TEvents>(event?: Key): number {
    if (event !== undefined) {
      return this.listeners.get(event)?.size ?? 0;
    }

    let total = 0;
    this.listeners.forEach((set) => (total += set.size));
    return total;
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
