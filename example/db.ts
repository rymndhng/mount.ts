import { defstate } from "../mount";
import { config } from "./config";
import { QueryFunction } from "mysql";
import * as mysql from "mysql";

// -- This is library code to shim over the access patterns of the underlying mysql library
interface DB {
  query: QueryFunction;
}

interface DBResult<T> {
  result: T[];
  fields: any;
}

export function queryAsPromise<T>(
  db: DB,
  queryOptions: string | mysql.QueryOptions
): Promise<DBResult<T>> {
  var resolve0: any;
  var reject0: any;
  const p = new Promise<DBResult<T>>(function(resolve, reject) {
    resolve0 = resolve;
    reject0 = reject;
  });
  db.query(queryOptions, function(error, result, fields) {
    if (error) {
      reject0(error);
    } else {
      resolve0({ result, fields });
    }
  });
  return p;
}

export async function query<T> (
  db: DB,
  queryOptions: string | mysql.QueryOptions
): Promise<T[]> {
  return queryAsPromise<T>(db, queryOptions).then(({result}) => result);
}

export async function queryOne<T> (
  db: DB,
  queryOptions: string | mysql.QueryOptions
): Promise<T> {
  return queryAsPromise<T>(db, queryOptions).then(({ result}) => result[0]);
}

// -- This is application code  ------------------------------------------------
export interface Count {
  count: number;
}

export const getAccounts = async (db: DB) =>
    queryOne<Count>(db, "SELECT COUNT(*) as total FROM accounts")

export const db = defstate("db", () => {
  return mysql.createPool({
    ...(config().db as mysql.PoolConfig),
    connectionLimit: 10
  });
});
