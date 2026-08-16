// test-speech-bug.mjs
// Simulates the Android Chrome SpeechRecognition bug where an instance retains its e.results history across starts

class MockBuggySpeechRecognition {
    constructor() {
        this.results = [];
        this.continuous = false;
        this.interimResults = false;
    }

    start() {
        // On Android, starting an existing instance DOES NOT clear `this.results`!
        // We simulate firing an event after a short delay
        setTimeout(() => {
            // User speaks "hey"
            this.results.push([{ transcript: 'hey' }]);
            this.results[this.results.length - 1].isFinal = true;
            
            if (this.onresult) {
                this.onresult({ results: this.results, resultIndex: 0 });
            }
            
            if (this.onend) {
                this.onend();
            }
        }, 10);
    }
}

// 1. OLD BUGGY IMPLEMENTATION
function runOldImplementation() {
    return new Promise((resolve) => {
        const recognition = new MockBuggySpeechRecognition();
        let finalRef = "";
        let restartCount = 0;

        recognition.onresult = (e) => {
            let sessionText = '';
            // The old code looped from 0 to length
            for (let i = 0; i < e.results.length; i++) {
                sessionText += e.results[i][0].transcript + ' ';
            }
            // And then it appended the ENTIRE history to finalRef!
            finalRef = (finalRef + ' ' + sessionText).trim();
            console.log(`[OLD] onresult fired. rawTranscript is now: "${finalRef}"`);
        };

        recognition.onend = () => {
            restartCount++;
            if (restartCount < 3) {
                // Bug: reusing the SAME instance
                recognition.start();
            } else {
                resolve();
            }
        };

        recognition.start();
    });
}

// 2. NEW FIXED IMPLEMENTATION
function runNewImplementation() {
    return new Promise((resolve) => {
        let finalRef = "";
        let restartCount = 0;
        let currentSessionTranscript = '';

        function spawnRecognition() {
            // Fix: Create a BRAND NEW instance every time
            const recognition = new MockBuggySpeechRecognition();
            
            recognition.onresult = (e) => {
                let sessionText = '';
                for (let i = 0; i < e.results.length; i++) {
                    sessionText += e.results[i][0].transcript + ' ';
                }
                currentSessionTranscript = sessionText.trim();
                console.log(`[NEW] onresult fired. rawTranscript is now: "${(finalRef + ' ' + currentSessionTranscript).trim()}"`);
            };

            recognition.onend = () => {
                if (currentSessionTranscript) {
                    finalRef = (finalRef + ' ' + currentSessionTranscript).trim();
                    currentSessionTranscript = '';
                }
                
                restartCount++;
                if (restartCount < 3) {
                    // Fix: spawn a new one instead of calling start() on the old one
                    spawnRecognition();
                } else {
                    resolve();
                }
            };
            
            recognition.start();
        }

        spawnRecognition();
    });
}

async function main() {
    console.log("=== RUNNING OLD BUGGY IMPLEMENTATION ===");
    await runOldImplementation();
    
    console.log("\n=== RUNNING NEW FIXED IMPLEMENTATION ===");
    await runNewImplementation();
}

main();
