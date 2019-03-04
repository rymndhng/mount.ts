import { defstate } from "mount-ts";
import { config } from "./config";

export var worker: any = defstate("worker", () => {
  return { worker: config().worker };
});
