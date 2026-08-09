import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication: This function should only be called by Supabase Cron or with a valid cron secret
    const cronSecret = req.headers.get('X-Cron-Secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');
    const supabaseCron = req.headers.get('X-Supabase-Cron');

    // Allow if called by Supabase Cron system OR with valid cron secret
    const isAuthorizedCron = supabaseCron === 'true';
    const hasValidSecret = expectedCronSecret && cronSecret === expectedCronSecret;

    if (!isAuthorizedCron && !hasValidSecret) {
      console.warn('Unauthorized attempt to call check-appointment-reminders');
      return new Response(
        JSON.stringify({ error: 'Unauthorized. This endpoint is for scheduled tasks only.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking for appointments in the next 24 hours...");

    // Get current time and 24 hours from now
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    // Find appointments scheduled between 23-24 hours from now
    // This ensures we only send one reminder per appointment
    const { data: appointments, error: aptError } = await supabase
      .from('appointments')
      .select('id, patient_id, doctor_id, scheduled_at, type')
      .eq('status', 'scheduled')
      .gte('scheduled_at', in23Hours.toISOString())
      .lte('scheduled_at', in24Hours.toISOString());

    if (aptError) {
      console.error("Error fetching appointments:", aptError);
      throw aptError;
    }

    console.log(`Found ${appointments?.length || 0} appointments to remind`);

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No appointments to remind", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results = [];

    for (const appointment of appointments) {
      try {
        // Fetch patient profile
        const { data: patient, error: patientError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', appointment.patient_id)
          .single();

        if (patientError || !patient) {
          console.error(`Patient not found for appointment ${appointment.id}`);
          continue;
        }

        // Fetch doctor profile
        const { data: doctor, error: doctorError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', appointment.doctor_id)
          .single();

        const doctorName = doctor?.full_name || 'Your Doctor';
        const appointmentDate = new Date(appointment.scheduled_at);
        const formattedDate = appointmentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const consultationType = appointment.type === 'video' ? 'Video Consultation' : 'In-Person Visit';

        // Create in-app notification
        await supabase
          .from('notifications')
          .insert({
            user_id: appointment.patient_id,
            type: 'appointment_reminder',
            title: 'Appointment Tomorrow',
            message: `Reminder: You have a ${consultationType.toLowerCase()} with Dr. ${doctorName} tomorrow at ${formattedTime}`
          });

        // Send email if Resend API key is configured and patient has email
        if (resendApiKey && patient.email) {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">TeleMed AI</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Appointment Reminder</p>
                </div>
                
                <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                  <h2 style="color: #1e293b; margin: 0 0 20px 0;">Hello ${patient.full_name || 'there'}!</h2>
                  
                  <p style="color: #64748b; line-height: 1.6; margin-bottom: 30px;">
                    This is a friendly reminder about your upcoming appointment tomorrow. Please make sure you're ready at the scheduled time.
                  </p>
                  
                  <div style="background: #f1f5f9; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; width: 40%;">Doctor:</td>
                        <td style="padding: 10px 0; color: #1e293b; font-weight: 600;">Dr. ${doctorName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b;">Date:</td>
                        <td style="padding: 10px 0; color: #1e293b; font-weight: 600;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b;">Time:</td>
                        <td style="padding: 10px 0; color: #1e293b; font-weight: 600;">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b;">Type:</td>
                        <td style="padding: 10px 0; color: #1e293b; font-weight: 600;">${consultationType}</td>
                      </tr>
                    </table>
                  </div>
                  
                  ${appointment.type === 'video' ? `
                  <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                    <p style="color: #065f46; margin: 0; font-size: 14px;">
                      <strong>📹 Video Consultation:</strong> Make sure you have a stable internet connection and your camera/microphone are working properly.
                    </p>
                  </div>
                  ` : ''}
                  
                  <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                    If you need to reschedule or cancel, please do so at least 2 hours before your appointment time.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                  
                  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                    This is an automated reminder from TeleMed AI. Please do not reply to this email.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: 'TeleMed AI <onboarding@resend.dev>',
              to: [patient.email],
              subject: `Appointment Reminder: ${consultationType} Tomorrow`,
              html: emailHtml
            })
          });

          const emailResponse = await res.json();
          console.log(`Email sent for appointment ${appointment.id}:`, emailResponse);
        }

        results.push({ appointmentId: appointment.id, success: true });
        console.log(`Reminder sent for appointment ${appointment.id}`);
      } catch (error) {
        console.error(`Error processing appointment ${appointment.id}:`, error);
        results.push({ appointmentId: appointment.id, success: false, error: String(error) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: results.length, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-appointment-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
