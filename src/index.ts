import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler'
import manifestJSON from '__STATIC_CONTENT_MANIFEST'
const assetManifest = JSON.parse(manifestJSON)
import { Hono, Context } from 'hono'
import { HandleCachedResponse } from './utils'
import { HandleUpload, Logout, SingleEntry, Start } from './api'
import { HandleAuth } from './auth'
// import { DBStart } from "./tables";

export interface Env {
    DB: D1Database
    BUCKET: R2Bucket
    __STATIC_CONTENT_MANIFEST: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

const cache = caches.default
const app = new Hono<{ Bindings: Env }>()

app.use('/api/auth/*', HandleAuth)
app.get('/api/auth/start', Start)
app.post('/api/auth/entry', SingleEntry)
app.get('/api/auth/logout', Logout)

app.post('/api/upload', HandleUpload)
app.all('*', GetAsset)

async function GetAsset(c: Context): Promise<Response> {
    // console.log(assetManifest)
    let request = c.req
    let resp = await cache.match(request)
    if (resp) {
        return HandleCachedResponse(resp)
    }
    try {
        const url = new URL(request.url)
        const pathname = url.pathname
        if (!pathname.includes('.') && pathname !== '/') {
            url.pathname = `${pathname}.html`
            request = new Request(url.toString(), c.req)
        }
        resp = await getAssetFromKV(
            {
                request,
                waitUntil(promise) {
                    return c.executionCtx.waitUntil(promise)
                },
            },
            {
                ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
                ASSET_MANIFEST: assetManifest,
            }
        )
        // resp.headers.set("Cache-Control", "max-age=3600, public")
        // await cache.put(request, resp.clone())
        return resp
    } catch (e) {
        if (e instanceof NotFoundError) {
            const pathname = new URL(c.req.url).pathname
            return new Response(`"${pathname}" not found`, {
                status: 404,
                statusText: 'not found',
            })
        } else {
            return new Response('An unexpected error occurred', { status: 500 })
        }
    }
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext) {
        // await DBStart(env.DB)
        return app.fetch(request, env, ctx)
    },
}
