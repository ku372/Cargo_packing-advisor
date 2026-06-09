/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute((self as unknown as { __WB_MANIFEST: Array<{ url: string; revision: string | null }> }).__WB_MANIFEST)

const SHARE_CACHE = 'packing-shared-v1'

self.addEventListener('fetch', (event) => {
  const ev  = event as FetchEvent
  const url = new URL(ev.request.url)
  if (url.pathname === '/share-target' && ev.request.method === 'POST') {
    ev.respondWith(handleShareTarget(ev.request))
  }
})

async function handleShareTarget(request: Request): Promise<Response> {
  try {
    const formData = await request.formData()
    const file = (formData.get('file') ?? formData.get('pdf')) as File | null
    if (file && file.type === 'application/pdf') {
      const cache = await caches.open(SHARE_CACHE)
      await cache.put('/__shared_pdf__', new Response(file, {
        headers: { 'X-File-Name': file.name, 'Content-Type': 'application/pdf' },
      }))
    }
  } catch { /* ignore */ }
  return Response.redirect('/?shared=1', 303)
}
