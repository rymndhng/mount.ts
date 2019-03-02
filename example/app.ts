import { defstate } from "../mount";
import { db } from "./db";
import { http } from "./http";
import { worker } from "./worker";

export var app = defstate("app", () => {
  db; // force it to load ...
  http;
  worker;
});
