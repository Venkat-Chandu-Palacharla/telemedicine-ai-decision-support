import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  appointmentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Authentication: Validate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user-scoped client to validate token and get user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Send reminder request from user:', userId);

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { appointmentId }: ReminderRequest = await req.json();

    // Validate appointmentId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!appointmentId || !uuidRegex.test(appointmentId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid appointment ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch appointment details
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('*, patient_id, doctor_id, scheduled_at, type')
      .eq('id', appointmentId)
      .single();

    if (aptError || !appointment) {
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authorization: Verify caller is the patient, doctor, or an admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const isPatient = appointment.patient_id === userId;
    const isDoctor = appointment.doctor_id === userId;
    const isAdmin = userRole?.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to send reminders for this appointment' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch patient profile
    const { data: patient, error: patientError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', appointment.patient_id)
      .single();

    if (patientError || !patient || !patient.email) {
      throw new Error('Patient email not found');
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

    let emailResponse = null;

    // Send email reminder if RESEND_API_KEY is configured
    if (resendApiKey) {
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
              <h2 style="color: #1e293b; margin: 0 0 20px 0;">Hello ${patient.full_name}!</h2>
              
              <p style="color: #64748b; line-height: 1.6; margin-bottom: 30px;">
                This is a friendly reminder about your upcoming appointment. Please make sure you're ready at the scheduled time.
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

      emailResponse = await res.json();
      console.log("Reminder email sent:", emailResponse);
    }

    // Also create an in-app notification
    await supabase
      .from('notifications')
      .insert({
        user_id: appointment.patient_id,
        type: 'appointment_reminder',
        title: 'Appointment Reminder',
        message: `You have a ${consultationType.toLowerCase()} with Dr. ${doctorName} on ${formattedDate} at ${formattedTime}`
      });

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-appointment-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
