import { defstate } from "mount-ts";

export const config = defstate<any>("config", () => {
  return {
    http: {
      port: 3000
    },
    store: {
      cache_ttl: 15 * 60 * 1000 // cache for 15 minutes
    }
  };
});
