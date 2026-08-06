(async () => {
  try {
    const res = await fetch('http://localhost:4028/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: 'give me a workout plan for today', 
        sessionId: 'test', 
        history: [],
        userProfile: { id: 'test-user', fitnessGoal: 'muscle building' },
        appState: { 
            commandCenter: [], 
            workout: { today: null, recent: [] },
            nutrition: { todayKcal: 0, todayFiber: 0, meals: [], recent: [] },
            budget: { income: 0, expenses: 0, monthlyBudget: 0 }
        },
        aiMemories: [],
        currentDateTime: new Date().toISOString(),
        devMode: true
      })
    });
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('BODY:', text);
  } catch (e) {
    console.error('ERROR:', e);
  }
})();
