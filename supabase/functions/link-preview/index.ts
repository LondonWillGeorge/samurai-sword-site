import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Resolves a preview image (and, where possible, a title/description) for an
// arbitrary URL pasted by a member on the Member Links page.
//
// Strategy, in order:
//   1. YouTube  -> i.ytimg.com thumbnail derived from the video id (no API key)
//   2. Vimeo    -> public oEmbed endpoint (no API key)
//   3. Anything -> fetch the page HTML and read og:image / twitter:image
//   4. Websites -> fall back to a rendered screenshot via WordPress mShots
//
// The browser is never allowed to do steps 3/4 itself because of CORS, hence
// this function. It requires a logged-in member (verify_jwt is off in
// config.toml so we check the bearer token by hand, as upload-to-youtube does).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FETCH_TIMEOUT_MS = 8000
const MAX_HTML_BYTES = 512_000 // only the <head> matters; stop well before huge pages

interface Preview {
  thumbnail_url: string | null
  title: string | null
  description: string | null
  detected_kind: 'video' | 'website'
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })

function normaliseUrl(raw: string): URL | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  // Block obvious SSRF targets — this function fetches whatever it is given.
  const host = url.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.startsWith('[')
  ) {
    return null
  }
  return url
}

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0]
    return /^[\w-]{11}$/.test(id) ? id : null
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const v = url.searchParams.get('v')
    if (v && /^[\w-]{11}$/.test(v)) return v
    // /embed/ID, /shorts/ID, /live/ID, /v/ID
    const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/)
    if (m) return m[1]
  }
  return null
}

function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  return fetch(url, {
    ...init,
    signal: controller.signal,
    redirect: 'follow',
    headers: {
      // Some sites serve no og: tags to unknown agents.
      'User-Agent': 'Mozilla/5.0 (compatible; TenshinWarriorBot/1.0; +https://tenshinwarrior.com)',
      'Accept': 'text/html,application/xhtml+xml',
      ...(init.headers ?? {}),
    },
  }).finally(() => clearTimeout(timer))
}

async function urlIsReachable(url: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

// Best available YouTube still: maxres only exists for some uploads, hq always does.
async function youtubeThumbnail(id: string): Promise<string> {
  const maxres = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
  if (await urlIsReachable(maxres)) return maxres
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .trim()
}

// Pull one meta tag's content, tolerating attribute order and quote style.
function metaContent(html: string, names: string[]): string | null {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["']`, 'i'),
    ]
    for (const re of patterns) {
      const m = html.match(re)
      if (m?.[1]) return decodeEntities(m[1])
    }
  }
  return null
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m?.[1] ? decodeEntities(m[1].replace(/\s+/g, ' ')) : null
}

async function readHtml(url: URL): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url.toString())
    if (!res.ok || !res.body) return null
    const type = res.headers.get('content-type') ?? ''
    if (!type.includes('html') && !type.includes('xml')) {
      await res.body.cancel()
      return null
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8', { fatal: false })
    let html = ''
    let bytes = 0
    while (bytes < MAX_HTML_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      html += decoder.decode(value, { stream: true })
      if (/<\/head>/i.test(html)) break // everything we need lives in <head>
    }
    await reader.cancel().catch(() => {})
    return html
  } catch {
    return null
  }
}

async function vimeoPreview(url: URL): Promise<Partial<Preview>> {
  try {
    const res = await fetchWithTimeout(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url.toString())}&width=1280`,
    )
    if (!res.ok) return {}
    const data = await res.json()
    return {
      thumbnail_url: data.thumbnail_url ?? null,
      title: data.title ?? null,
      description: data.description ?? null,
    }
  } catch {
    return {}
  }
}

// Free rendered screenshot, no API key. mShots renders on first request and
// serves a placeholder until it is ready, so the tile fills in shortly after.
function screenshotUrl(url: URL): string {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url.toString())}?w=1200&h=750`
}

function absolutise(candidate: string, base: URL): string | null {
  try {
    return new URL(candidate, base).toString()
  } catch {
    return null
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    // --- auth: members only -------------------------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: { user }, error: userError } = await adminClient.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (userError || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    // --- input --------------------------------------------------------------
    const body = await req.json().catch(() => ({}))
    const url = normaliseUrl(String(body.url ?? ''))
    if (!url) {
      return json({ error: 'Please enter a valid public http(s) link.' }, 400)
    }
    const requestedKind: 'video' | 'website' =
      body.kind === 'video' ? 'video' : 'website'

    // --- 1. YouTube ---------------------------------------------------------
    const ytId = youtubeId(url)
    if (ytId) {
      const preview: Preview = {
        thumbnail_url: await youtubeThumbnail(ytId),
        title: null,
        description: null,
        detected_kind: 'video',
      }
      const html = await readHtml(url)
      if (html) {
        preview.title = metaContent(html, ['og:title', 'twitter:title']) ?? titleTag(html)
        preview.description = metaContent(html, ['og:description', 'description'])
      }
      return json({ ...preview, url: url.toString() })
    }

    // --- 2. Vimeo -----------------------------------------------------------
    if (/(^|\.)vimeo\.com$/i.test(url.hostname)) {
      const vimeo = await vimeoPreview(url)
      if (vimeo.thumbnail_url) {
        return json({
          thumbnail_url: vimeo.thumbnail_url,
          title: vimeo.title ?? null,
          description: vimeo.description ?? null,
          detected_kind: 'video',
          url: url.toString(),
        })
      }
    }

    // --- 3. Open Graph / Twitter card ---------------------------------------
    const html = await readHtml(url)
    let thumbnail: string | null = null
    let title: string | null = null
    let description: string | null = null

    if (html) {
      title = metaContent(html, ['og:title', 'twitter:title']) ?? titleTag(html)
      description = metaContent(html, ['og:description', 'twitter:description', 'description'])
      const image = metaContent(html, [
        'og:image:secure_url',
        'og:image:url',
        'og:image',
        'twitter:image',
        'twitter:image:src',
      ])
      if (image) thumbnail = absolutise(image, url)
    }

    // --- 4. Screenshot fallback --------------------------------------------
    // Videos on other hosts rarely expose anything better than their page, so
    // a screenshot is a reasonable last resort for both kinds.
    if (!thumbnail) thumbnail = screenshotUrl(url)

    const detected: 'video' | 'website' =
      html && /og:type["'][^>]*content=["']video/i.test(html) ? 'video' : requestedKind

    return json({
      thumbnail_url: thumbnail,
      title,
      description,
      detected_kind: detected,
      url: url.toString(),
    })
  } catch (err) {
    console.error('link-preview failed:', err)
    return json({ error: (err as Error).message ?? 'Preview failed' }, 500)
  }
})
