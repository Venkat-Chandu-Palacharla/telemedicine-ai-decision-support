import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Mental health analysis request from user:', userId);

    const { input } = await req.json();

    // Validate input object
    if (!input || typeof input !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid input data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate mental health indicators with proper ranges
    const { stressLevel, anxietyLevel, sleepHours, moodRating } = input;

    if (typeof stressLevel !== 'number' || stressLevel < 0 || stressLevel > 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid stress level (must be 0-10)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof anxietyLevel !== 'number' || anxietyLevel < 0 || anxietyLevel > 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid anxiety level (must be 0-10)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof sleepHours !== 'number' || sleepHours < 0 || sleepHours > 24) {
      return new Response(
        JSON.stringify({ error: 'Invalid sleep hours (must be 0-24)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof moodRating !== 'number' || moodRating < 0 || moodRating > 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid mood rating (must be 0-10)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a mental health AI assistant. Analyze the following mental health indicators and provide an assessment.

Mental Health Indicators:
- Stress Level: ${input.stressLevel}/10
- Anxiety Level: ${input.anxietyLevel}/10
- Sleep Hours: ${input.sleepHours} hours
- Mood Rating: ${input.moodRating}/10

Provide a comprehensive mental health assessment including:
1. Overall status (Good, Moderate Concern, or High Concern)
2. Wellness score (0-100)
3. Key insights about their mental state
4. Personalized recommendations for improvement

Respond in JSON format:
{
  "status": "Good" | "Moderate Concern" | "High Concern",
  "score": number,
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}

Be supportive and constructive. Focus on actionable advice.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a supportive mental health AI assistant. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ error: 'Unable to process your request. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      // Calculate a simple score based on inputs
      const avgStressAnxiety = (input.stressLevel + input.anxietyLevel) / 2;
      const sleepFactor = input.sleepHours >= 7 ? 1 : input.sleepHours / 7;
      const moodFactor = input.moodRating / 10;
      const score = Math.round((1 - avgStressAnxiety / 10) * 40 + sleepFactor * 30 + moodFactor * 30);
      
      result = {
        status: score >= 70 ? "Good" : score >= 50 ? "Moderate Concern" : "High Concern",
        score,
        insights: [
          input.sleepHours < 7 ? "Your sleep duration is below the recommended 7-9 hours" : "Your sleep duration is within healthy range",
          input.stressLevel > 6 ? "Your stress levels are elevated" : "Your stress levels are manageable",
          input.anxietyLevel > 6 ? "Consider anxiety management techniques" : "Your anxiety levels appear controlled"
        ],
        recommendations: [
          "Practice deep breathing exercises for 5-10 minutes daily",
          "Maintain a consistent sleep schedule",
          "Engage in regular physical activity",
          "Connect with friends and family regularly",
          "Consider mindfulness or meditation practices"
        ]
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
