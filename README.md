# mount.ts

"Just-enough" opinionated glue for wiring stateful modules in TypeScript. Heavily inspired by [tolitus/mount](https://github.com/tolitius/mount).

# Why
Real world applications need to manage lifecycle of stateful objects, such as
connection pools, http servers, background workers all these sorts of things.

`mount.ts` provides enough glue for declaring these stateful objects by tapping into the same mechanism for module resolution.

# How

Creating state is easy. You provide a name, and a function of 0-arguments that constructors a connection.

``` typescript
import { defstate } from 'mount-ts'

export const conn = defstate(
  "conn",
  () => createConnection())
```

In the case where the `defstate` needs clean up, add an additional argument that takes the state as a parameter.

``` typescript
export const conn = defstate(
  "conn",
  () => createConnection(),
  (conn) => connection.close())
```

## Using State

Any app that relies on the state can import and dereference it for use.

``` typescript
import { conn } from "./conn"

conn() // Invoke as function to dereference
```


## Dependency Management

`mount.ts` is a sweet spot where the stateful parts of the application compromise of mainly low-level components of the application, i.e. (I/O, queues, connections). Your system tends to have simple dependency graphs. Application logic is built on top of the stateful layer.

Real world applications can specify dependencies by de-referencing `defstate` from dependent modules. Example:

``` typescript
// in config.ts
import { defstate } from "mount-ts"

export const config = defstate("config", () => loadConfig());

// in database.ts
import { defstate } from "mount-ts";
import { config } from "./config"
export const pool = defstate("db.pool", () => db.createPool(config().db))
```

## Start and Stop Order
Dependencies are injected by `require`-ing or `import`-ing modules. `mount.ts` relies on module load order to determine which order of sequence is appropriate to load in the correct order.

`start()` executes the start function of each state in order.
`stop()` executes the stop function (if present) of each state in reverse order.

# Examples
See the `examples/` folder for how a system is wired together.
