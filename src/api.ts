import { Context } from "hono";
import { GetFileFromKV, HandleCachedResponse, hex, JSONResponse } from "./utils";
import { GenerateQuery, QueryType } from "d1-orm";



export async function HandleUpload(c: Context): Promise<Response> {
  const formdata = await c.req.formData();
  const uploaded_file = formdata.get("har_file");
  if (!(uploaded_file instanceof File)) {
    return c.redirect("/upload");
  }
  const har_file_name = uploaded_file.name;
  const file_hash = hex(
    await crypto.subtle.digest("SHA-256", await uploaded_file.arrayBuffer())
  );
  await c.env.BUCKET.put(file_hash, uploaded_file.stream());
  const DB: D1Database = c.env.DB;
  const token = crypto.randomUUID();
  const statement = GenerateQuery(QueryType.INSERT, "sessions", {
    data: {
      token: token,
      hash: file_hash,
      filename: har_file_name,
    },
  });
  // console.log(`Statement '${statement.query}', Bindings '${statement.bindings}'`)
  const { error } = await DB.prepare(statement.query)
    .bind(...statement.bindings)
    .run();
  if (error) {
    console.error(`D1 Error: ${error}`);
    return JSONResponse(
      { message: "Internal error", error: error },
      { status: 500 }
    );
  }
  c.cookie("har_token", token, {
    path: "/api",
    httpOnly: true,
    sameSite: "Strict",
  });
  c.cookie("har_file", har_file_name, {
    path: "/api",
    httpOnly: true,
    sameSite: "Strict",
  });

  return c.redirect("/results");
}

export async function Start(c: Context): Promise<Response> {
  const file_name = c.get("file");
  // console.log(`File hash: ${file_name}`)
  if (!file_name) {
    return c.notFound();
  }
  const file: R2ObjectBody = await c.env.BUCKET.get(file_name);
  return JSONResponse(await file.json());
}

export async function SingleEntry(c: Context): Promise<Response> {
    const entry_cache =  await caches.open("entry-cache");
    const entry_number = (await c.req.json())["entry_id"];
    const file_name = c.get("file");
    const cache_id = `http://${file_name}/${entry_number}`
    console.log("Cache ID", cache_id)
    var response = await entry_cache.match(cache_id)
    if (response) {
        console.log("Hit cache")
        return HandleCachedResponse(response)
    }
    // console.log(`File hash: ${file_name}`)
    if (!file_name) {
        return c.notFound();
    }
    const file: R2ObjectBody = await c.env.BUCKET.get(file_name);
    const body = await file.json();

    response = JSONResponse(body["log"]["entries"][entry_number], {extra_headers: {"Cache-Control": "max-age=360"}})
    c.executionCtx.waitUntil(entry_cache.put(cache_id, response.clone()))
    return response
}

export async function Logout(c: Context): Promise<Response> {
  // console.log("Running token")
  const token = c.get("token");
  // console.log("Token: ", token)
  const statement = GenerateQuery(QueryType.DELETE, "sessions", {
    where: {
      token: token,
    },
  });
  // console.log("Query", statement.query, "Bindings", statement.bindings)
  const { error } = await c.env.DB.prepare(statement.query)
    .bind(...statement.bindings)
    .run();
  if (error) {
    return JSONResponse({ error: error }, { status: 500 });
  }
  const expires = new Date("1970-01-01");
  c.cookie("har_token", "", { expires: expires });
  c.cookie("har_file", "", { expires: expires });
  return await GetFileFromKV(c.env, "logout.html");
}
