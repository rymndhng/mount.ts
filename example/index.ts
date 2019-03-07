import { defstate, start, stop } from "mount-ts";
import { http } from "./modules/http";

export var app = defstate("app", async () => {
  // explicitly call module variable to force module to load load modules (because imports are by default lazy)
  // TODO: is there a way to eagerly load an import, to avoid doubly calling
  http;
});

(async () => {
  await start();
})();

process.on("SIGTERM", async () => {
  await stop();
});

process.on("SIGINT", async () => {
  await stop();
});
