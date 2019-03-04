import { IncomingHttpHeaders } from "http";
import * as url from "url";
import { ServerRequest } from "microrouter";
import { text } from "micro";
import { defstate } from "mount-ts";

import { config } from "./config";

interface RequestData {
  pathname: string;
  query: string;
  headers: IncomingHttpHeaders;
  method: string;
  body: string;
  created_at: Date;
}

interface RequestBin {
  url: string;
  requests: RequestData[];
  updated_at: Date;
}

interface Store {
  [path: string]: RequestBin;
}

export async function requestAsData(
  request: ServerRequest
): Promise<RequestData> {
  const body = await text(request);
  const { pathname, query } = url.parse(request.url);
  return {
    body,
    pathname,
    query,
    headers: request.headers,
    method: request.method,
    created_at: new Date()
  };
}

export function recordRequest(store: Store, request: RequestData) {
  if (!store.hasOwnProperty(request.pathname)) {
    store[request.pathname] = {
      url: request.pathname,
      requests: [],
      updated_at: new Date()
    };
  }
  store[request.pathname].requests.push(request);
}

export function reapStore(store: Store, timeToLive: number) {
  const expireTime = new Date(Date.now() - timeToLive);
  console.log(`Reaping records older than ${expireTime.toISOString()}`);
  for (const [path, bin] of Object.entries(store)) {
    bin.requests = bin.requests.filter(
      request => expireTime < request.created_at
    );

    if (bin.requests.length == 0) {
      console.log(`Removing path with no records: ${path}`);
      delete store[path];
    }
  }
}

export var store = defstate("store", () => {
  return {};
});

defstate(
  "store.reaper",
  () => setInterval(reapStore, 60 * 1000, store(), config().store.cache_ttl),
  s => clearInterval(s)
);
