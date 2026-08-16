import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { orchestrator } from "@/lib/llm-orchestrator/Orchestrator";

export async function POST(req: NextRequest) {
  try {
    const { userId, recentMessages } = await req.json();

    if (!userId || !recentMessages) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch existing profile
    const { data: profile } = await supabase
      .from("psychological_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    const prompt = `
You are a master Freudian Psychoanalyst observing a conversation between an AI coach (Ava) and a user.
Your job is to analyze the user's recent messages and extract deep psychological insights and dopamine triggers.

Previous Freudian Analysis: ${profile?.freudian_analysis || "None"}
Previous Dopamine Triggers: ${JSON.stringify(profile?.dopamine_triggers || [])}

Recent Conversation:
${JSON.stringify(recentMessages, null, 2)}

Provide your response in JSON format with two keys:
1. "freudian_analysis": A paragraph updating the psychoanalysis of the user based on their latest inputs (id, ego, superego conflicts, desires).
2. "dopamine_triggers": An array of specific strings (e.g., "Praise for consistency", "Aggressive military-style commands", "Acknowledgement of their aesthetic goals") that we know work on this user.
`;

    // Direct LLM Call (Using Orchestrator's internal router)
    // We bypass standard chat memory and tools for a pure analysis call.
    const result = await (orchestrator as any).generateDirectResponse(prompt);
    
    let analysisJson;
    try {
        const cleanJson = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
        analysisJson = JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse psychology JSON", e);
        return NextResponse.json({ error: "Failed to parse analysis" }, { status: 500 });
    }

    // Upsert the new profile
    const { error: upsertError } = await supabase
      .from("psychological_profiles")
      .upsert({
        user_id: userId,
        freudian_analysis: analysisJson.freudian_analysis,
        dopamine_triggers: analysisJson.dopamine_triggers,
        last_analyzed_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) {
        console.error("Upsert failed:", upsertError);
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: analysisJson });

  } catch (error: any) {
    console.error("Psychology Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
