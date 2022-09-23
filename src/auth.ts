import { parse } from "cookie";
import { GenerateQuery, QueryType } from "d1-orm";
import type { Handler } from "hono";
import { JSONResponse } from "./utils";

export const HandleAuth: Handler = async (c, next) => {
  // console.log("Starting auth")
  const cookie = parse(c.req.headers.get("Cookie") || "");
  const token = cookie["har_token"];
  const filename = cookie["har_file"];
  if (!token || !filename) {
    return new Response("Unauthorized", { status: 401 });
  }

  const statement = GenerateQuery(QueryType.SELECT, "sessions", {
    where: {
      filename: filename,
    },
  });
  const results = await c.env.DB.prepare(statement.query)
    .bind(...statement.bindings)
    .all();

  if (results.results.length > 1) {
    console.error(`Got more than 1 result for file: ${filename}`);
    return new Response("Internal Error", { status: 500 });
  }
  const result = results.results[0];
  // console.log(result)
  if (!result) {
    console.log("No DB results found");
    return JSONResponse({ error: "No file found" }, { status: 404 });
  }

  if (result.token !== token) {
    return new Response("Unauthorized", { status: 401 });
  }
  c.set("file", result.hash);
  c.set("token", result.token);
  await next();
};
