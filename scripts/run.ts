import { start, stop } from "../mount";

(async () => {
  require("../example/app");
  await start();
  console.log("System started");
})();

process.on("SIGTERM", async () => {
  await stop();
});

process.on("SIGINT", async () => {
  await stop();
});
