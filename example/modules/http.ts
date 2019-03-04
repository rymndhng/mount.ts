import { Server } from "http";
import { send, default as micro } from "micro";
import * as r from "microrouter";
import { defstate } from "mount-ts";
import { config } from "./config";
import { requestAsData, recordRequest, store } from "./store";

const handler = r.router(
  r.get("/:id", async (req, res) => {
    const requestData = await requestAsData(req);
    if ((requestData.query || "").includes("inspect")) {
      send(res, 200, store()[requestData.pathname]);
    } else {
      recordRequest(store(), requestData);
      send(res, 200, "hello!");
    }
  }),
  r.post("/:id", async (req, res) => {
    const requestData = await requestAsData(req);
    recordRequest(store(), requestData);
    send(res, 201, "created!");
  }),
  r.get("/", (req, res) => {
    send(res, 200, "root!");
  }),
  r.get("/subscribe/:id", (req, res) => {})
);

// TODO: we need to have a data contract that allows us to map local development -> lambda
export const http = defstate<Server>(
  "http",
  () => {
    console.log("starting server on", config().http.port);
    return micro(handler).listen(config().http.port);
  },
  async server => {
    await server.close();
  }
);
