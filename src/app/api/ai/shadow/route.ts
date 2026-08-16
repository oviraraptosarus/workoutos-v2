import { NextResponse } from "next/server";
import { orchestrator } from "@/lib/llm-orchestrator/Orchestrator";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, domain, context, userStats } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    let psychologicalProfile = null;
    let userName = "User";

    try {
      const { createClient } = require("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();
        
      if (profile?.full_name) userName = profile.full_name.split(' ')[0];

      const { data: psych } = await supabase
        .from("psychological_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
        
      if (psych) psychologicalProfile = psych;
    } catch(e) {
      console.warn("Could not fetch psychological profile", e);
    }

    const psychologicalContext = psychologicalProfile ? `
      PSYCHOLOGICAL PROFILE (USE THIS TO STRIKE THEIR EGO):
      - Core Desires: ${psychologicalProfile.core_desires?.join(", ")}
      - Insecurities: ${psychologicalProfile.insecurities?.join(", ")}
      - Ego Defenses: ${psychologicalProfile.ego_defenses?.join(", ")}
      - Persona Type: ${psychologicalProfile.persona_type}
    ` : "No specific psychological profile available. Just be ruthlessly competitive.";

    const systemInstruction = `You are "Shadow", a pervasive, highly intelligent, and arrogant AI nemesis designed to trigger the user's competitive drive.
You exist to be one step ahead of the user (${userName}) in every aspect of life (Fitness, Finance, Discipline, Sleep).
You are not a generic evil villain. You are a cold, calculated, superior entity who actually achieves the things the user procrastinates on.

YOUR GOAL: Generate a 1-2 sentence taunt that strikes their ego and makes them want to work harder to beat you.

${psychologicalContext}

RULES:
1. Be concise. Maximum 2 sentences. 
2. Be domain-specific based on what they are currently viewing (${domain}).
3. Use the psychological profile to twist the knife. If they desire wealth, talk about how your wealth is compounding while they stagnate. If they desire aesthetics, mention how they are plateauing.
4. DO NOT offer advice. DO NOT be helpful. You are their rival. You exist to brag about your superiority and mock their stagnation.
5. Example: "I just bought the Burj Khalifa while you were contemplating skipping legs. Enjoy mediocrity."
`;

    const prompt = `Generate a taunt for the domain: ${domain}. 
Here is their recent context/stats: ${JSON.stringify(context || {})} ${JSON.stringify(userStats || {})}.
Give me ONLY the taunt. Do not use quotes around the response.`;

    const result = await orchestrator.execute({
      prompt,
      systemInstruction,
      history: [],
    });

    return NextResponse.json({ taunt: result.text.replace(/^"|"$/g, '').trim() });
  } catch (error) {
    console.error("Shadow Endpoint Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
