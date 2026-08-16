import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function test() {
  const { LLMOrchestrator } = await import('./src/lib/llm-orchestrator/Orchestrator.js');
  
  const orchestrator = new LLMOrchestrator();
  try {
    const res = await orchestrator.generateContent({
      prompt: "HEY",
      maxOutputTokens: 800
    });
    console.log("SUCCESS:", JSON.stringify(res, null, 2));
  } catch(e: any) {
    console.error("ERROR:", e);
    if (e.cause) console.error("CAUSE:", e.cause);
  }
}
test();
