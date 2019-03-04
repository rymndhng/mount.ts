import { defstate } from "mount-ts";
import * as db from "./db";
import { config } from "./config";

import { Server } from "http";
import micro from "micro";

const handler = async (req, res) => {
  const accountsCount = await db.getAccounts(db.db());
  return `Total accounts: ${JSON.stringify(accountsCount)}`;
};

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
