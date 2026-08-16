# AI DISCLOSURE & RISK ACKNOWLEDGEMENT

**Last Updated:** August 2026

Workout OS utilizes generative Large Language Models (LLMs) to power the "AI Copilot," an intelligent assistant capable of parsing your voice notes, tracking your tasks, analyzing your meals, and recommending workflows. 

Because AI is an experimental and non-deterministic technology, we require all users to understand and acknowledge the following operational realities and risks before using the AI Copilot.

## 1. Third-Party Processing
Your inputs to the AI Copilot—including text messages, voice transcripts, and uploaded food images—are transmitted via API to third-party AI providers (e.g., Google GenAI, OpenRouter).
- **Zero-Retention Commitment:** We configure our API connections to request that these third-party providers do **not** use your data to train their foundational models, and that they discard your prompt data after generating a response.
- **Data in Transit:** However, your data must physically leave our servers and be processed by these third-party servers to generate the response. If you are uncomfortable with this, do not use the AI Copilot feature.

## 2. Autonomous Database Actions
Unlike a standard chatbot, the AI Copilot is agentic. It has permission to execute actions directly on your database, including:
- Creating, editing, or completing tasks in your planner.
- Logging meals, calories, and macronutrients based on photos.
- Saving permanent "AI Memories" about your behavioral patterns.

**Your Responsibility:** You must review your dashboard to verify that the AI has executed your instructions accurately. We are not responsible for tasks missed because the AI failed to log them correctly.

## 3. Risk of Hallucination and Inaccuracy
The AI Copilot operates probabilistically. It does not "know" facts; it predicts text. Therefore, it may produce **hallucinations**—statements that sound highly confident but are entirely false or inaccurate.
- **Nutritional Inaccuracy:** When analyzing a food photo, the AI may drastically under- or over-estimate portion sizes, ingredients, or caloric content. You must manually verify all AI-logged meals.
- **Fitness Inaccuracy:** The AI may suggest exercises or repetition schemes that are inappropriate or dangerous for your specific physical condition.

## 4. No Professional Advice
The AI Copilot is programmed to act as an "Execution Coach" and "Analyst." 
- It is **not** a doctor, physical therapist, psychologist, financial advisor, or registered dietician.
- Any advice the AI provides regarding calorie deficits, weight loss, sleep hygiene, injury management, or budget planning must be treated as informational entertainment.
- You must not use the AI Copilot for medical diagnosis, treatment planning, or crisis intervention.

## 5. Behavioral Profiling (AI Memory)
To provide personalized coaching, the AI Copilot generates and stores inferred profiles about your behavior (e.g., "User consistently fails to complete tasks scheduled after 8 PM"). 
- These insights are stored securely in your database under Row Level Security.
- You have the right to view, edit, and delete these "AI Memories" at any time through the application settings.
- If you do not wish to be behaviorally profiled, you must disable the AI Memory feature.
