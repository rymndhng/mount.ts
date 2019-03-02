import { defstate } from "../mount";
import { config } from "./config";

export var worker: any = defstate("worker", () => {
  return { worker: config().worker };
});
