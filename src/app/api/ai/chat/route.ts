import { NextResponse } from "next/server";
import { orchestrator } from "@/lib/llm-orchestrator/Orchestrator";
import { telemetryEngine } from "@/services/telemetryEngine";
import { getSystemContract } from "@/lib/llm-orchestrator/config/systemContract";
import { AVA_TOOLS } from "@/lib/llm-orchestrator/config/toolDefinitions";
import { classifyIntentAndContext, filterAppState } from "@/lib/llm-orchestrator/pipeline";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      prompt,
      requestId: clientRequestId,
      userProfile,
      image,
      history,
      appState,
      preferredLanguage,
      aiMemories,
      currentDateTime,
      devMode,
    } = body;
    const requestId = clientRequestId || telemetryEngine.generateRequestId();

    telemetryEngine.logEvent({
      user_id: userProfile?.id || "anonymous",
      request_id: requestId,
      event_type: "PROMPT_RECEIVED",
      module: "AI Orchestrator",
      payload: { prompt, hasImage: !!image },
      status: "INFO",
    });

    if (!prompt && !image) {
      telemetryEngine.logEvent({
        user_id: userProfile?.id,
        request_id: requestId,
        event_type: "ERROR",
        module: "AI Orchestrator",
        status: "FAILED",
        payload: { error: "No prompt or image" },
      });
      return NextResponse.json(
        { error: "Prompt or image is required", requestId },
        { status: 400 },
      );
    }

    const hasAnyKey =
      process.env.GEMINI_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENAI_API_KEY;
    if (!hasAnyKey) {
      telemetryEngine.logEvent({
        user_id: userProfile?.id,
        request_id: requestId,
        event_type: "ERROR",
        module: "AI Orchestrator",
        status: "FAILED",
        payload: { error: "No API Keys Configured" },
      });
      return NextResponse.json(
        { error: "No AI API Keys are configured on the server", requestId },
        { status: 500 },
      );
    }

    // Child Mode Feature Gating (Under 18)
    let isUnder18 = false;
    if (userProfile?.dob) {
      const dob = new Date(userProfile.dob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      isUnder18 = age < 18;
    }

    // Step 1: Pre-Action Context Pipeline
    const classification = await classifyIntentAndContext(prompt, image);
    const filteredAppState = filterAppState(appState, classification.domains);

    // Step 2: Generate System Contract (Intent & Gate instructions)
    const systemInstruction = getSystemContract(
      currentDateTime || new Date().toLocaleString(),
      userProfile,
      aiMemories,
      filteredAppState,
      isUnder18
    );

    if (hasAnyKey) {
      try {
        const contents: any[] = [];

        if (Array.isArray(history) && history.length > 0) {
          history.forEach((msg: any) => {
            if (!msg || (!msg.text && !msg.imageUrl)) return;
            const parts: any[] = [];
            if (
              msg.imageUrl &&
              typeof msg.imageUrl === "string" &&
              msg.imageUrl.startsWith("data:image")
            ) {
              const matches = msg.imageUrl.match(
                /^data:(image\/[a-zA-Z+]+);base64,(.+)$/,
              );
              if (matches && matches.length === 3) {
                parts.push({
                  inlineData: { mimeType: matches[1], data: matches[2] },
                });
              }
            }
            if (msg.text) {
              parts.push({ text: msg.text });
            }
            if (parts.length > 0) {
              const role =
                msg.role === "model" ||
                msg.role === "ava" ||
                msg.role === "assistant"
                  ? "model"
                  : "user";
              contents.push({ role, parts });
            }
          });
        }

        const currentParts: any[] = [];
        if (
          image &&
          typeof image === "string" &&
          image.startsWith("data:image")
        ) {
          const matches = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            currentParts.push({
              inlineData: { mimeType: matches[1], data: matches[2] },
            });
          }
        }
        if (prompt) {
          currentParts.push({ text: prompt });
        }

        if (currentParts.length > 0) {
          const lastContent = contents[contents.length - 1];
          const isDuplicate =
            lastContent &&
            lastContent.role === "user" &&
            lastContent.parts.some((p: any) => p.text === prompt);
          if (!isDuplicate) {
            contents.push({ role: "user", parts: currentParts });
          }
        }

        if (contents.length === 0) {
          contents.push({ role: "user", parts: [{ text: prompt || "Hello" }] });
        }

        const mappedHistory = contents.map((c) => ({
          role: c.role as "user" | "model",
          text: c.parts.map((p: any) => p.text).join("\n") || "",
        }));
        const currentPromptObj = mappedHistory.pop();

        const response = await orchestrator.generateContent({
          requestId,
          systemInstruction,
          prompt: currentPromptObj?.text || prompt,
          history: mappedHistory,
          image,
          tools: [
            {
              functionDeclarations: AVA_TOOLS,
            },
          ],
          temperature: 0.7,
          maxOutputTokens: 800,
        });

        if (response.text || response.functionCall) {
          telemetryEngine.logEvent({
            user_id: userProfile?.id,
            request_id: requestId,
            event_type: "ORCHESTRATOR_RESPONSE",
            module: "AI Orchestrator",
            status: "SUCCESS",
            payload: {
              source: response.sourceModel,
              hasFunction: !!response.functionCall,
              functionName: response.functionCall?.name,
              latencyMs: response.latencyMs,
            },
            latency_ms: response.latencyMs,
          });
          return NextResponse.json({
            result: response.text || "Done.",
            source: response.sourceModel,
            functionCall: response.functionCall,
            requestId,
          });
        } else {
          telemetryEngine.logEvent({
            user_id: userProfile?.id,
            request_id: requestId,
            event_type: "ORCHESTRATOR_RESPONSE",
            module: "AI Orchestrator",
            status: "FAILED",
            payload: { error: "Empty Content" },
          });
          return NextResponse.json(
            { error: "LLM Returned Empty Content", requestId },
            { status: 500 },
          );
        }
      } catch (err: any) {
        console.error("Orchestrator API call failed:", err);
        telemetryEngine.logEvent({
          user_id: userProfile?.id,
          request_id: requestId,
          event_type: "ERROR",
          module: "AI Orchestrator",
          status: "FAILED",
          payload: { error: err.message, stack: err.stack },
        });
        return NextResponse.json(
          {
            error: `Orchestrator error: ${err.message}`,
            requestId,
            devDetails: { message: err.message, stack: err.stack },
          },
          { status: 500 },
        );
      }
    }

    // Offline fallback
    const lower = prompt.toLowerCase();
    let verdict = "మితమైన ఎంపిక / మితంగా తీసుకోవచ్చు";
    let macros = "అంచనా: 450 kcal | 20g ప్రోటీన్ | 55g కార్బ్స్ | 18g కొవ్వు";
    let advice = `మీ రోజువారీ ${userProfile?.calorieGoal || 2400} kcal లక్ష్యంలో భాగమైతే ఇది మంచిదే. మెరుగైన రికవరీ కోసం ప్రోటీన్‌తో కలిపి తీసుకోండి!`;

    if (lower.includes("pizza") || lower.includes("పిజ్జా")) {
      verdict = "2 ముక్కలు ఆస్వాదించండి (వ్యాయామం తర్వాత మంచిది)";
      macros = "అంచనా: 560 kcal | 24g ప్రోటీన్ | 64g కార్బ్స్ | 22g కొవ్వు";
      advice = `తీవ్రమైన వ్యాయామం తర్వాత గ్లైకోజెన్‌ను తిరిగి నింపడానికి అద్భుతమైనది! మీ లక్ష్యానికి (${userProfile?.fitnessGoal || "కండరాల నిర్మాణం"}) అనుగుణంగా ఉండటానికి, ప్రోటీన్ షేక్ లేదా గ్రిల్ చేసిన చికెన్‌ను జోడించండి.`;
    } else if (
      lower.includes("burger") ||
      lower.includes("fast food") ||
      lower.includes("బర్గర్")
    ) {
      verdict = "మితమైన ఎంపిక";
      macros = "అంచనా: 650 kcal | 30g ప్రోటీన్ | 48g కార్బ్స్ | 35g కొవ్వు";
      advice = `డబుల్ బీఫ్ ప్యాటీ మంచి ప్రోటీన్‌ను ఇస్తుంది, కానీ అధిక సోడియం మరియు కొవ్వుల పట్ల జాగ్రత్తగా ఉండండి. మీ లక్ష్యంలో ఉండటానికి అదనపు ఫ్రైస్‌ను దాటవేయండి!`;
    } else if (
      lower.includes("chicken") ||
      lower.includes("eggs") ||
      lower.includes("protein") ||
      lower.includes("salmon") ||
      lower.includes("చికెన్") ||
      lower.includes("గుడ్లు")
    ) {
      verdict = "వ్యాయామానికి అద్భుతమైన ఎంపిక";
      macros = "అంచనా: 320 kcal | 42g ప్రోటీన్ | 0g కార్బ్స్ | 12g కొవ్వు";
      advice = `అత్యుత్తమ లీన్ ప్రోటీన్ మూలం! కండరాల నిర్మాణానికి మరియు రోజంతా కడుపు నిండినట్లు అనిపించడానికి పర్ఫెక్ట్.`;
    }

    const fallbackResponse = `### ${verdict}\n\n**పోషకాల వివరాలు:**\n• ${macros}\n\n**సలహాదారు గమనిక:**\n${advice}`;
  } catch (error: any) {
    const errorId = `ORCH-${Math.floor(1000 + Math.random() * 9000)}`;
    let requestId = "UNKNOWN";
    let devMode = false;

    try {
      // We can parse it from req if we hadn't consumed it, but since it's already consumed,
      // we will just assume devMode might be false unless we can tell otherwise.
      // But wait, we can't reliably read it.
    } catch (e) {}

    console.error(
      `[${errorId}] Fatal Request Error in Chat API:`,
      error.stack || error,
    );

    return NextResponse.json(
      {
        error: `Request failed. Error ID: ${errorId}`,
        requestId,
        devDetails: { message: error.message, stack: error.stack },
      },
      { status: 500 },
    );
  }
}
