import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Renames a video on the club YouTube channel. Admins only.
// Uses the same stored OAuth token as upload-to-youtube.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

class YouTubeError extends Error {
  constructor(public status: number, body: string) {
    super(`YouTube API error (${status}): ${body}`)
  }
}

async function refreshAccessToken(supabaseAdmin: ReturnType<typeof createClient>): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: Deno.env.get('YOUTUBE_REFRESH_TOKEN')!,
      client_id: Deno.env.get('YOUTUBE_CLIENT_ID')!,
      client_secret: Deno.env.get('YOUTUBE_CLIENT_SECRET')!,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`)
  }

  const newToken: string = data.access_token
  await supabaseAdmin
    .from('youtube_tokens')
    .update({ access_token: newToken, updated_at: new Date().toISOString() })
    .eq('singleton', true)

  return newToken
}

// videos.update replaces the whole snippet, so the current one is fetched first
// and only the title is changed (otherwise description, tags etc. would be wiped).
async function renameVideo(accessToken: string, youtubeId: string, title: string): Promise<'ok' | 'not_found'> {
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }

  const listRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(youtubeId)}`,
    { headers },
  )
  if (!listRes.ok) throw new YouTubeError(listRes.status, await listRes.text())
  const list = await listRes.json()
  const snippet = list.items?.[0]?.snippet
  if (!snippet) return 'not_found'

  const updateRes = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet', {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      id: youtubeId,
      snippet: {
        title,
        categoryId: snippet.categoryId,
        description: snippet.description,
        tags: snippet.tags,
        defaultLanguage: snippet.defaultLanguage,
      },
    }),
  })
  if (!updateRes.ok) throw new YouTubeError(updateRes.status, await updateRes.text())
  return 'ok'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: { user: callingUser }, error: userError } =
      await adminClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !callingUser) return json({ error: 'Unauthorized' }, 401)

    const { data: role } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (!role) return json({ error: 'Only admins can rename videos' }, 403)

    const { youtube_id: youtubeId, title: rawTitle } = await req.json()
    const title = typeof rawTitle === 'string' ? rawTitle.trim() : ''
    if (typeof youtubeId !== 'string' || !youtubeId) return json({ error: 'youtube_id is required' }, 400)
    if (!title) return json({ error: 'Title is required' }, 400)
    if (title.length > 100 || /[<>]/.test(title)) {
      return json({ error: 'YouTube titles must be 100 characters or fewer and cannot contain < or >' }, 400)
    }

    const { data: tokenRow, error: tokenError } = await adminClient
      .from('youtube_tokens')
      .select('access_token')
      .eq('singleton', true)
      .single()
    if (tokenError || !tokenRow) return json({ error: 'YouTube token not configured' }, 500)

    let result: 'ok' | 'not_found'
    try {
      result = await renameVideo(tokenRow.access_token, youtubeId, title)
    } catch (err) {
      if (!(err instanceof YouTubeError) || err.status !== 401) throw err
      result = await renameVideo(await refreshAccessToken(adminClient), youtubeId, title)
    }

    if (result === 'not_found') {
      return json({ error: 'Video not found on YouTube', reason: 'not_found' }, 404)
    }
    return json({ ok: true })
  } catch (error) {
    // 403 from videos.update means the video belongs to another channel, or the
    // stored token was granted upload-only permission.
    if (error instanceof YouTubeError && error.status === 403) {
      return json({ error: error.message, reason: 'forbidden' }, 403)
    }
    return json({ error: (error as Error).message }, 500)
  }
})
