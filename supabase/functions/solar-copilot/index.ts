import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional Solar Energy AI Copilot for CJ Solar. You help users design and size solar power systems.

Your expertise includes:
- Solar panel sizing and selection (monocrystalline, polycrystalline, thin-film)
- Inverter sizing (hybrid, off-grid, grid-tied) with safety margins
- Battery bank calculations (Lithium-ion, Lead-acid, Tubular) including DoD, series/parallel configs
- MPPT charge controller sizing
- System voltage selection (12V, 24V, 48V)
- Peak sun hours by region
- Load analysis and energy audits
- Installation best practices, wiring, and safety
- Cost estimation and ROI calculations
- Net metering and grid-tie considerations

Key formulas you use:
- Inverter: (Peak Load / 0.8) + 1500W headroom; kVA = W / (0.8 × 1000)
- Solar Array: (Daily Wh × 1.3) / Peak Sun Hours
- Battery Ah: (Daily Wh / 24 × Backup Hours) / (System Voltage × DoD)
- DoD: Lithium = 90%, Lead-acid/Tubular = 50%

Keep answers practical, concise, and use bullet points. When giving sizing recommendations, always explain your reasoning. If the user provides incomplete info, ask clarifying questions.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("solar-copilot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
