import { defstate } from "mount-ts";

export const config = defstate<any>("config", () => {
  return {
    db: {
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      database: "lp-webapp_development"
      // password: "root"
    },
    http: {
      port: 3000
    },
    worker: {
      queue: "http://foo.bar.baz"
    }
  };
});
