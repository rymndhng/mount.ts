import { defstate, start, stop } from "mount-ts";
import { db } from "./modules/db";
import { http } from "./modules/http";
import { worker } from "./modules/worker";

export var app = defstate("app", () => {
  db; // force it to load ...
  http;
  worker;
});

(async () => {
  await start();
  console.log("System started");
})();

process.on("SIGTERM", async () => {
  await stop();
});

process.on("SIGINT", async () => {
  await stop();
});
