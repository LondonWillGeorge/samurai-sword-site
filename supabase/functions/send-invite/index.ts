import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get("RESEND_FROM") || "Tenshin Warrior <onboarding@resend.dev>";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Verify the calling user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callingUser }, error: userError } = await adminClient.auth.getUser(token)
    if (userError || !callingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    // Check admin role
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders })
    }

    const { email, redirectTo } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400, headers: corsHeaders })
    }

    // Record the invitation
    const { error: inviteError } = await adminClient
      .from('invitations')
      .insert({ email, invited_by: callingUser.id })

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), { status: 400, headers: corsHeaders })
    }

    // Generate the invite link without sending Supabase's default email
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo },
    })

    if (linkError) {
      return new Response(JSON.stringify({ error: linkError.message }), { status: 400, headers: corsHeaders })
    }

    const inviteLink = linkData?.properties?.action_link
    if (!inviteLink) {
      return new Response(JSON.stringify({ error: 'Failed to generate invite link' }), { status: 500, headers: corsHeaders })
    }

    // Send invite email via Resend
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'You have been invited to Tenshin Warrior Members Area',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px;">
            <h1 style="color: #8B0000; margin-bottom: 5px;">天心武士</h1>
            <p style="color: #666; font-size: 14px;">Tenshin Ryu - Traditional Japanese Swordsmanship</p>
          </div>

          <div style="padding: 20px;">
            <p>You have been invited to join the Tenshin Warrior members area.</p>
            <p>Click the button below to accept your invitation and set up your password:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background: #8B0000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-size: 16px; display: inline-block;">
                Accept Invitation
              </a>
            </div>

            <p style="color: #666; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #666; font-size: 12px; word-break: break-all;">${inviteLink}</p>

            <p style="margin-top: 30px;">
              With respect,<br />
              <strong>The Tenshin Warrior Team</strong>
            </p>
          </div>

          <div style="background: #1a1a1a; color: #fff; padding: 20px; text-align: center; margin-top: 30px;">
            <p style="margin: 0 0 10px 0;">
              <a href="mailto:tenshinryu@hotmail.co.uk" style="color: #c9a227; text-decoration: none;">tenshinryu@hotmail.co.uk</a>
              &nbsp;|&nbsp;
              <a href="tel:07715255150" style="color: #c9a227; text-decoration: none;">0771 5255150</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #999;">
              Tenshin Ryu - Teaching traditional Japanese martial arts in South London
            </p>
          </div>
        </div>
      `,
    })

    if (emailError) {
      return new Response(JSON.stringify({ error: (emailError as any).message }), { status: 400, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: corsHeaders })
  }
})
