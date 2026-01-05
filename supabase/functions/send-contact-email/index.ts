import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message }: ContactRequest = await req.json();

    console.log("Received contact form submission:", { name, email, phone, messageLength: message?.length });

    // Validate required fields
    if (!name || !email) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email to Tenshin Ryu
    const notificationEmail = await resend.emails.send({
      from: "Tenshin Ryu <onboarding@resend.dev>",
      to: ["info@tenshinryu.co.uk"],
      subject: `Free Trial Request from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8B0000; border-bottom: 2px solid #8B0000; padding-bottom: 10px;">
            New Free Trial Request
          </h1>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
          </div>
          
          ${message ? `
            <div style="margin: 20px 0;">
              <h3 style="color: #333;">Message:</h3>
              <p style="white-space: pre-wrap; background: #fff; padding: 15px; border-left: 3px solid #8B0000;">${message}</p>
            </div>
          ` : '<p><em>No additional message provided.</em></p>'}
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="color: #666; font-size: 12px;">
            This email was sent from the Tenshin Ryu website contact form.
          </p>
        </div>
      `,
    });

    console.log("Notification email sent:", notificationEmail);

    // Send acknowledgement email to the sender
    const acknowledgementEmail = await resend.emails.send({
      from: "Tenshin Ryu <onboarding@resend.dev>",
      to: [email],
      subject: "Thank you for your interest in Tenshin Ryu",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px;">
            <h1 style="color: #8B0000; margin-bottom: 5px;">天心武士</h1>
            <p style="color: #666; font-size: 14px;">Tenshin Ryu - Traditional Japanese Swordsmanship</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Dear ${name},</p>
            
            <p>Thank you for your interest in Tenshin Ryu and for requesting a free trial lesson.</p>
            
            <p>We have received your enquiry and one of our instructors will be in touch with you shortly 
            to discuss your trial lesson and answer any questions you may have.</p>
            
            <p>In the meantime, here's what you can expect:</p>
            
            <ul style="line-height: 1.8;">
              <li>No prior martial arts experience is required</li>
              <li>All training equipment is provided for beginners</li>
              <li>Wear comfortable, loose-fitting clothing</li>
              <li>Sessions typically last around 2 hours</li>
            </ul>
            
            <p>We look forward to meeting you and introducing you to the art of Tenshin Ryu.</p>
            
            <p style="margin-top: 30px;">
              With respect,<br />
              <strong>The Tenshin Ryu Team</strong>
            </p>
          </div>
          
          <div style="background: #1a1a1a; color: #fff; padding: 20px; text-align: center; margin-top: 30px;">
            <p style="margin: 0 0 10px 0;">
              <a href="mailto:info@tenshinryu.co.uk" style="color: #c9a227; text-decoration: none;">info@tenshinryu.co.uk</a>
              &nbsp;|&nbsp;
              <a href="tel:07715255150" style="color: #c9a227; text-decoration: none;">0771 5255150</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #999;">
              Yodokan UK - Teaching traditional Japanese martial arts in South London
            </p>
          </div>
        </div>
      `,
    });

    console.log("Acknowledgement email sent:", acknowledgementEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Emails sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
