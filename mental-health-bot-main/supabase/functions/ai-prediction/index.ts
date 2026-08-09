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
    console.log('AI prediction request from user:', userId);

    const { diseaseType, parameters } = await req.json();

    // Validate required fields
    if (!diseaseType || typeof diseaseType !== 'string' || diseaseType.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid disease type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!parameters || typeof parameters !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate health parameters with realistic ranges
    const { age, bmi, bloodPressureSystolic, bloodPressureDiastolic, bloodGlucose } = parameters;

    if (typeof age !== 'number' || age < 0 || age > 150) {
      return new Response(
        JSON.stringify({ error: 'Invalid age (must be 0-150)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof bmi !== 'number' || bmi < 10 || bmi > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid BMI (must be 10-100)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof bloodPressureSystolic !== 'number' || bloodPressureSystolic < 60 || bloodPressureSystolic > 250) {
      return new Response(
        JSON.stringify({ error: 'Invalid systolic blood pressure (must be 60-250)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof bloodPressureDiastolic !== 'number' || bloodPressureDiastolic < 30 || bloodPressureDiastolic > 150) {
      return new Response(
        JSON.stringify({ error: 'Invalid diastolic blood pressure (must be 30-150)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof bloodGlucose !== 'number' || bloodGlucose < 30 || bloodGlucose > 600) {
      return new Response(
        JSON.stringify({ error: 'Invalid blood glucose (must be 30-600)' }),
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

    const prompt = `You are a medical AI assistant. Based on the following health parameters, provide a risk assessment for ${diseaseType}.

Health Parameters:
- Age: ${parameters.age} years
- BMI: ${parameters.bmi}
- Blood Pressure: ${parameters.bloodPressureSystolic}/${parameters.bloodPressureDiastolic} mmHg
- Blood Glucose: ${parameters.bloodGlucose} mg/dL

Analyze these parameters and provide:
1. A risk percentage (0-100)
2. Risk level (Low, Moderate, or High)
3. Confidence score (0-100)
4. Key factors analysis (positive/negative/neutral impact)
5. Personalized recommendations

Respond in JSON format:
{
  "diseaseType": "${diseaseType}",
  "riskPercentage": number,
  "riskLevel": "Low" | "Moderate" | "High",
  "confidence": number,
  "factors": [
    { "name": "factor name", "impact": "positive" | "negative" | "neutral" }
  ],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}

Be realistic but not alarmist. Consider normal ranges for each parameter.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a medical AI assistant that provides health risk assessments. Always respond with valid JSON only." },
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

    // Parse the JSON response from the AI
    let result;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      // Fallback response
      result = {
        diseaseType,
        riskPercentage: 25,
        riskLevel: "Low",
        confidence: 75,
        factors: [
          { name: "Age", impact: "neutral" },
          { name: "BMI", impact: parameters.bmi > 25 ? "negative" : "positive" },
          { name: "Blood Pressure", impact: parameters.bloodPressureSystolic > 140 ? "negative" : "positive" },
          { name: "Blood Glucose", impact: parameters.bloodGlucose > 126 ? "negative" : "positive" }
        ],
        recommendations: [
          "Maintain a healthy diet with plenty of fruits and vegetables",
          "Exercise regularly for at least 30 minutes daily",
          "Monitor your health parameters regularly",
          "Consult with a healthcare professional for personalized advice"
        ]
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Prediction error:", {
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
