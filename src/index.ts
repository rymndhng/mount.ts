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
    const { name, start, order } = state;
    console.debug(`<< [mount] ${order} - Starting ${name}`);
    if (state.status !== "started") {
      await start();
      state.status = "started";
    }
  }
}

export async function stop() {
  for (const state of orderedStates().reverse()) {
    const { name, stop, order } = state;
    console.debug(`>> [mount] ${order} - Stopping ${name}`);
    if (state.status !== "stopped") {
      await stop();
      state.status = "stopped";
    }
  }
}
