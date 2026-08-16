import dotenv from 'dotenv';
dotenv.config();

async function testGemini() {
  const { GeminiProvider } = await import('./src/lib/llm-orchestrator/providers/GeminiProvider.js');
  const provider = new GeminiProvider({ id: 'gemini', provider: 'gemini', modelName: 'gemini-1.5-flash', isConfigured: true }, process.env.GEMINI_API_KEY!);
  
  try {
    const res = await provider.generateContent('gemini-1.5-flash', { prompt: "HEY", maxOutputTokens: 800 });
    console.log("GEMINI SUCCESS:", res.text);
  } catch(e) {
    console.error("GEMINI ERROR:", e);
  }
}
testGemini();
