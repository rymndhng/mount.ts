import { EventEmitter } from "events";

type Status = "started" | "stopped" | "error";

interface State<S> {
  name: string;
  status: Status;
  start: () => S;
  stop: () => void;
  order: number;
  get: () => S;
}

type Deref<S> = () => S;

// -- module internals  -------------------------------------------------------
let stateSeq = 0;
const registeredStates: { [name: string]: State<any> } = {};

const nextStateSeq = () => {
  stateSeq++;
  return stateSeq;
};

// -- Public API  --------------------------------------------------------------

/**
 * Create a new state.
 *
 * States are started/stopped invoking this modules [[start()]] and [[stop(0)]]
 * functions.
 *
 * ``` typescript
 * const state = defstate("my.state", () => {foo: "bar"})
 * ````
 *
 * @param start   A function to create a new state.
 * @param stop    A function to shutdown the state.
 * @returns An instance of [[Deref]]
 */
export function defstate<S>(
  name: string,
  start: () => S,
  stop?: (s: S) => void
): Deref<S> {
  if (registeredStates.hasOwnProperty(name)) {
    console.warn(`warning! replacing an existing defstate`, { name });
  }

  var derefValue: S;
  const state = {
    name,
    start: async () => {
      derefValue = await start();
    },
    stop: async () => {
      if (stop) {
        await stop(derefValue);
      }
    },
    status: "stopped" as Status,
    order: nextStateSeq(),
    get: () => derefValue
  };

  registeredStates[name] = state;
  return state.get;
}

/**
 * Gets a started state.
 *
 * ```typescript
 * const db = getState<Config>("db");
 * ```
 *
 * Precondition: the states must be already started via [[start()]].
 */
export function getState<S>(name: string): S {
  return registeredStates[name].get();
}

const orderedStates = () => {
  return Object.entries(registeredStates)
    .sort(([_, a], [__, b]) => a.order - b.order)
    .map(([_, state]) => state);
};

export async function start() {
  if (process.env.MOUNT_DEBUG) {
    console.debug("Loading hooks:", registeredStates);
  }

  for (const state of orderedStates()) {
    const { start } = state;
    emitter.emit('start', state);
    if (state.status !== "started") {
      await start();
      state.status = "started";
    }
  }
}

export async function stop() {
  for (const state of orderedStates().reverse()) {
    const { stop } = state;
    emitter.emit('stop', state);
    if (state.status !== "stopped") {
      await stop();
      state.status = "stopped";
    }
  }
}

// -- EventEmitter  ------------------------------------------------------------
type Events = {
  'start': (state: State<unknown>) => void,
  'stop': (state: State<unknown>) => void;
}

declare interface StateChangeEmitter {
  on<U extends keyof Events>(event: U, listener: Events[U]): this;
  emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>): boolean;
  addListener<U extends keyof Events>(event: U, listener: Events[U]): this;
  prependListener<U extends keyof Events>(event: U, listener: Events[U]): this;
  prependOnceListener<U extends keyof Events>(event: U, listener: Events[U]): this;
  removeListener<U extends keyof Events>(event: U, listener: Events[U]): this;
  removeAllListeners(event?: keyof Events): this;
  once<U extends keyof Events>(event: U, listener: Events[U]): this;
  on<U extends keyof Events>(event: U, listener: Events[U]): this;
  off<U extends keyof Events>(event: U, listener: Events[U]): this;
  eventNames<U extends keyof Events>(): U[];
  listenerCount(type: keyof Events): number;
  listeners<U extends keyof Events>(type: U): Events[U][];
  rawListeners<U extends keyof Events>(type: U): Events[U][];
  getMaxListeners(): number;
  setMaxListeners(n: number): this;
}

class StateChangeEmitter extends EventEmitter {
  constructor() {
    super();
  }
}

export const emitter = new StateChangeEmitter();

/**
 * Enable basic logging to show when states are started.
 *
 */
export const enableDebugLogs = () => {
  emitter.on('start', (s) => console.debug(`<< [mount] ${s.order} - Starting ${s.name}`));
  emitter.on('stop', (s) => console.debug(`>> [mount] ${s.order} - Stopping ${s.name}`));
}
