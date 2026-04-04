import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-video-title, x-video-mime-type',
}

const MAX_FILE_SIZE = 104_857_600 // 100 MB

async function refreshAccessToken(supabaseAdmin: ReturnType<typeof createClient>): Promise<string> {
  const refreshToken = Deno.env.get('YOUTUBE_REFRESH_TOKEN')!
  const clientId = Deno.env.get('YOUTUBE_CLIENT_ID')!
  const clientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET')!

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
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

async function initiateResumableUpload(
  accessToken: string,
  title: string,
  mimeType: string,
  fileSize: number,
): Promise<string> {
  const res = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(fileSize),
      },
      body: JSON.stringify({
        snippet: { title, categoryId: '17' },
        status: { privacyStatus: 'unlisted' },
      }),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`YouTube API error (${res.status}): ${body}`)
  }

  const uploadUrl = res.headers.get('Location')
  if (!uploadUrl) {
    throw new Error('No upload URL returned by YouTube')
  }
  return uploadUrl
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callingUser }, error: userError } = await adminClient.auth.getUser(token)
    if (userError || !callingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const title = req.headers.get('X-Video-Title')
    const mimeType = req.headers.get('X-Video-Mime-Type') ?? 'video/mp4'

    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), { status: 400, headers: corsHeaders })
    }

    // Drain the body fully before any outbound calls — making outbound HTTP
    // requests while the inbound body is unconsumed can stall Deno's runtime
    console.log('Reading request body...')
    const fileBuffer = await req.arrayBuffer()
    const fileSize = fileBuffer.byteLength
    console.log(`Body read: ${fileSize} bytes`)

    if (!fileSize || fileSize > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File must be 100 MB or smaller' }), { status: 400, headers: corsHeaders })
    }

    const { data: tokenRow, error: tokenError } = await adminClient
      .from('youtube_tokens')
      .select('access_token')
      .eq('singleton', true)
      .single()

    if (tokenError || !tokenRow) {
      return new Response(JSON.stringify({ error: 'YouTube token not configured' }), { status: 500, headers: corsHeaders })
    }

    let accessToken: string = tokenRow.access_token

    let uploadUrl: string
    try {
      uploadUrl = await initiateResumableUpload(accessToken, title.trim(), mimeType, fileSize)
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('401') || msg.includes('Unauthorized')) {
        accessToken = await refreshAccessToken(adminClient)
        uploadUrl = await initiateResumableUpload(accessToken, title.trim(), mimeType, fileSize)
      } else {
        throw err
      }
    }

    console.log(`Uploading ${fileSize} bytes to YouTube...`)
    const ytUploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(fileBuffer.byteLength),
      },
      body: fileBuffer,
    })

    console.log(`YouTube upload response status: ${ytUploadRes.status}`)

    if (!ytUploadRes.ok) {
      const body = await ytUploadRes.text()
      return new Response(JSON.stringify({ error: `YouTube upload failed (${ytUploadRes.status}): ${body}` }), { status: 502, headers: corsHeaders })
    }

    const ytData = await ytUploadRes.json()
    if (!ytData.id) {
      return new Response(JSON.stringify({ error: 'No video ID in YouTube response' }), { status: 502, headers: corsHeaders })
    }

    const thumbnailUrl =
      ytData.snippet?.thumbnails?.high?.url ??
      ytData.snippet?.thumbnails?.medium?.url ??
      ytData.snippet?.thumbnails?.default?.url ??
      `https://img.youtube.com/vi/${ytData.id}/hqdefault.jpg`

    console.log(`Upload complete, YouTube ID: ${ytData.id}, thumbnail: ${thumbnailUrl}`)
    return new Response(
      JSON.stringify({ youtube_id: ytData.id, thumbnail_url: thumbnailUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: corsHeaders })
  }
})
