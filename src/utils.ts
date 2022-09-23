import manifestJSON from "__STATIC_CONTENT_MANIFEST";
const assetManifest = JSON.parse(manifestJSON);
import { Env } from ".";

/**
 *
 * @param resp Response that hit cache
 * @returns Response with X-Worker-Cache Header
 */
export function HandleCachedResponse(resp: Response): Response {
  const newHeaders = new Headers(resp.headers);
  newHeaders.set("X-Worker-Cache", "HIT");
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: newHeaders,
  });
}

/**
 * Turns the array buffer from crypto into a string. Stolen from stackoverflow
 * @param buffer Crypto Buffer
 * @returns Hex string
 */
export function hex(buffer: ArrayBuffer): string {
  const hexCodes = [];
  const view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i += 4) {
    //Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    // const value =
    // toString(16) will give the hex representation of the number without padding
    const stringValue = view.getUint32(i).toString(16);
    // We use concatenation and slice for padding
    const padding = "00000000";
    const paddedValue = (padding + stringValue).slice(-padding.length);
    hexCodes.push(paddedValue);
  }
  // Join all the hex strings into one

  return hexCodes.join("");
}

interface JSONResponseOptions {
  status?: number;
  extra_headers?: Record<string, string>;
}

/**
 * Creates a JSON response
 * @param ResponseData Object to turn into JSON data
 * @param options Extra options for
 * @returns JSON Response
 */
export function JSONResponse(
  ResponseData: string | unknown,
  options?: JSONResponseOptions
): Response {
  let status;
  if (options === undefined || options.status === undefined) {
    status = 200;
  } else {
    status = options.status;
  }
  const send_headers = new Headers({
    "content-type": "application/json; charset=UTF-8",
  });
  if (options?.extra_headers) {
    for (const key of Object.keys(options.extra_headers)) {
      send_headers.append(key, options.extra_headers[key]);
    }
  }
  return new Response(JSON.stringify(ResponseData), {
    status: status,
    headers: send_headers,
  });
}

export async function GetFileFromKV(
  env: Env,
  fileName: string
): Promise<Response> {
  const body: ArrayBuffer = await env.__STATIC_CONTENT.get(
    assetManifest[fileName],
    "arrayBuffer"
  );
  return new Response(body);
}
