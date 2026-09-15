import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Only allow reset for known admin emails as a bootstrap mechanism
    const allowedEmails = ['will_croxford@hotmail.com', 'tenshinryu@hotmail.co.uk']
    if (!allowedEmails.includes(email.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Not allowed for this email' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Set APP_URL as a function secret to point reset links elsewhere.
    // Whatever this resolves to must be allow-listed under
    // Authentication -> URL Configuration -> Redirect URLs in the dashboard.
    const appUrl = Deno.env.get('APP_URL') ?? 'https://tenshinwarrior.com'
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${appUrl}/reset-password`,
      },
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const actionLink = data?.properties?.action_link

    return new Response(JSON.stringify({ 
      success: true, 
      link: actionLink,
      message: 'Open this link to reset your password. It expires in 24 hours.'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
