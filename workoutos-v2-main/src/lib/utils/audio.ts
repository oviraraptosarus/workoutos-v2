'use client';

// A simple Web Audio API synthesizer for UI sound effects
// These run entirely in the browser, no MP3s needed.

class UIAudio {
    private audioCtx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private initialized = false;

    private init() {
        if (typeof window === 'undefined') return;
        if (this.initialized) return;

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;

            this.audioCtx = new AudioContextClass();
            this.masterGain = this.audioCtx.createGain();
            
            // Keep UI sounds very subtle by default
            this.masterGain.gain.value = 0.15;
            this.masterGain.connect(this.audioCtx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported or failed to initialize');
        }
    }

    private async ensureContext() {
        this.init();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        return this.audioCtx && this.masterGain;
    }

    public async playSwoosh() {
        const ready = await this.ensureContext();
        if (!ready || !this.audioCtx || !this.masterGain) return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        
        // Quick frequency drop for a "swoosh/thump" sound
        osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioCtx.currentTime + 0.1);

        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.15);
    }

    public async playDing() {
        const ready = await this.ensureContext();
        if (!ready || !this.audioCtx || !this.masterGain) return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5

        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.6, this.audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.3);
    }

    public async playThud() {
        const ready = await this.ensureContext();
        if (!ready || !this.audioCtx || !this.masterGain) return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.audioCtx.currentTime + 0.1);

        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.8, this.audioCtx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    public async playTada() {
        const ready = await this.ensureContext();
        if (!ready || !this.audioCtx || !this.masterGain) return;

        // Note 1
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(440, this.audioCtx.currentTime); // A4
        gain1.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain1.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(this.audioCtx.currentTime);
        osc1.stop(this.audioCtx.currentTime + 0.15);

        // Note 2
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(554.37, this.audioCtx.currentTime + 0.15); // C#5
        gain2.gain.setValueAtTime(0, this.audioCtx.currentTime + 0.15);
        gain2.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(this.audioCtx.currentTime + 0.15);
        osc2.stop(this.audioCtx.currentTime + 0.5);
    }
}

// Singleton instance
export const audioManager = new UIAudio();
