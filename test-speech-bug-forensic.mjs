// test-speech-bug-forensic.mjs
// Deterministic state machine tests for SpeechRecognition

function processEvent(e) {
    let finalSessionText = '';
    let interimSessionText = '';
    
    // We can't trust e.resultIndex on all platforms.
    // We also can't trust that interim results are updated in place (Android bug).
    // Algorithm: 
    // 1. Concatenate all final results in the current session array.
    // 2. Take ONLY the very last interim result in the array, ignoring historical snapshots.
    
    for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
            finalSessionText += e.results[i][0].transcript + ' ';
        }
    }
    
    for (let i = e.results.length - 1; i >= 0; i--) {
        if (!e.results[i].isFinal) {
            interimSessionText = e.results[i][0].transcript;
            break;
        }
    }
    
    return (finalSessionText + interimSessionText).trim();
}

const tests = [
    {
        name: "Desktop Chrome Behavior (updates in place)",
        events: [
            { results: [ [{transcript: "I"}] ], resultIndex: 0 },
            { results: [ [{transcript: "I am"}] ], resultIndex: 0 },
            { results: [ [{transcript: "I am ready"}] ], resultIndex: 0 }
        ],
        expectedFinal: "I am ready"
    },
    {
        name: "Buggy Android Chrome Behavior (appends snapshots)",
        events: [
            { results: [ [{transcript: "I"}] ], resultIndex: 0 },
            { results: [ [{transcript: "I"}], [{transcript: "I am"}] ], resultIndex: 0 },
            { results: [ [{transcript: "I"}], [{transcript: "I am"}], [{transcript: "I am ready"}] ], resultIndex: 0 }
        ],
        expectedFinal: "I am ready"
    },
    {
        name: "Desktop Chrome with multiple sentences",
        events: [
            { results: [ [{transcript: "hello"}], [{transcript: "I am ready"}] ], resultIndex: 1 }
        ],
        setup: (e) => { e.results[0].isFinal = true; },
        expectedFinal: "hello I am ready"
    },
    {
        name: "Buggy Android Chrome with final and new snapshots",
        events: [
            { results: [ 
                [{transcript: "hello"}], // index 0 (final)
                [{transcript: "I"}],     // index 1 (interim snapshot)
                [{transcript: "I am"}],  // index 2 (interim snapshot)
                [{transcript: "I am ready"}] // index 3 (latest interim)
            ], resultIndex: 0 }
        ],
        setup: (e) => { e.results[0].isFinal = true; },
        expectedFinal: "hello I am ready"
    }
];

let allPassed = true;

for (const test of tests) {
    console.log(`\nRunning Test: ${test.name}`);
    let finalOutput = "";
    
    for (const [index, event] of test.events.entries()) {
        // Ensure all results default to isFinal = false unless specified
        event.results.forEach(r => { if (r.isFinal === undefined) r.isFinal = false; });
        if (test.setup) test.setup(event);
        
        finalOutput = processEvent(event);
        console.log(`  Event ${index + 1} output: "${finalOutput}"`);
    }
    
    if (finalOutput === test.expectedFinal) {
        console.log(`  ✅ PASSED`);
    } else {
        console.log(`  ❌ FAILED. Expected "${test.expectedFinal}", got "${finalOutput}"`);
        allPassed = false;
    }
}

if (allPassed) {
    console.log("\n✅ ALL TESTS PASSED. Algorithm is safe for production.");
} else {
    console.log("\n❌ SOME TESTS FAILED.");
    process.exit(1);
}
