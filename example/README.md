# Example App
The example app is a mini-service that captures HTTP requests.

You can start it with:

```
npm run start
```

## Running in a REPL

```
npx ts-node

import { start, stop } from "mount-ts";
import { http } from "./modules/http";
http;  // force lazy modules to load
start();

// when you're ready to tear down system
stop();
```
