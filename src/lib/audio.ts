import * as Tone from 'tone';

class AudioManager {
  private static instance: AudioManager;
  private bgmSynth: Tone.PolySynth | null = null;
  private bgmLoop: Tone.Loop | null = null;
  private isMuted: boolean = false;
  private volume: number = 0; // dB
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // Effect Synth (Reused to prevent lag)
  private effectSynth: Tone.PolySynth | null = null;

  public async init() {
    if (this.isInitialized) return;
    await Tone.start();
    
    // Set up Master volume
    Tone.Destination.volume.value = this.volume;

    // Master Limiter to prevent clipping/distortion
    const limiter = new Tone.Limiter(-1).toDestination();

    // Create BGM Synth (Smoother Piano-like)
    this.bgmSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" }, 
      envelope: { 
        attack: 0.02, 
        decay: 0.3,    
        sustain: 0.3,  
        release: 1.2   // Reduced release to prevent overlapping muddy sound
      },
      volume: -8 // Reduced volume
    }); 
    
    // Bass/Chords Synth (Deep Piano-like)
    const bassSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" }, 
      envelope: { 
        attack: 0.05, 
        decay: 0.3, 
        sustain: 0.4, 
        release: 1.5 // Reduced release
      },
      volume: -6 // Reduced volume
    });

    // Add a LowPass Filter to soften the sound
    const lowPass = new Tone.Filter(800, "lowpass");
    
    // Reverb for atmosphere (Concert Hall) - Reduced decay/wet
    const reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.01, wet: 0.2 });

    // Connect Chain: Synth -> Filter -> Reverb -> Limiter -> Destination
    this.bgmSynth.chain(lowPass, reverb, limiter);
    bassSynth.chain(lowPass, reverb, limiter);
    
    // Effect Synth
    this.effectSynth = new Tone.PolySynth(Tone.Synth);
    this.effectSynth.volume.value = -8;
    this.effectSynth.connect(reverb); // Share reverb

    // Auld Lang Syne (New Year Song)
    // Should auld acquaintance be forgot...
    // Melody adapted for 3/4 or 4/4 timing? 
    // Usually 4/4. Let's stick to 4/4 at 100 BPM for a warm feeling.
    
    // Key of F Major (for variety? or C Major? Let's use C Major for simplicity)
    // C Major: C D E F G A B C
    
    const melody = [
      // Pickup: "Should auld"
      { time: "0:0", note: "C4", dur: "4n" }, // Should (upbeat? Actually standard notation starts on beat 4 usually. Let's simplify to start at 0)
      
      // Bar 1: "acquaintance be forgot" -> F4 E4 F4 A4
      // Let's use simpler timing: 
      // | C4 | F4 . . E4 | F4 . A4 . | G4 . F4 G4 | A4 . . . |
      // Actually standard: 
      // Upbeat G3 or C4. 
      // Let's use standard version in F Major (Starts on C4)
      // C4 | F4 . . E4 | F4 . A4 . | G4 . F4 G4 | A4 . 
      
      // Let's use G Major (Starts on D4) - same range as previous song
      // Upbeat: D4
      // G4 G4 G4 B4 | A4 G4 A4 B4 | G4 G4 B4 D5 | E5
      
      // Let's just write C Major sequence directly without complex Part scheduling to ensure it loops simply like before.
      // But 'Part' is better for precise timing. I'll replace the melody array.
      
      // Pickup
      { time: "0:0", note: "G4", dur: "4n" }, 
      
      // Bar 1: C5 - - B4 | C5 - E5 -
      { time: "0:1", note: "C5", dur: "2n." }, 
      { time: "0:3:2", note: "B4", dur: "8n" }, // fast passing
      { time: "0:3:3", note: "C5", dur: "8n" }, 
      
      // Simplification for Tone.js scheduling
      // Bar 1
      { time: "1:0", note: "C5", dur: "2n" }, { time: "1:2", note: "E5", dur: "2n" },
      
      // Bar 2: D5 - C5 D5 | E5 - D5 -
      { time: "2:0", note: "D5", dur: "2n" }, { time: "2:2", note: "C5", dur: "4n" }, { time: "2:3", note: "D5", dur: "4n" },
      
      // Bar 3: E5 - G5 - | E5 - - -
      { time: "3:0", note: "E5", dur: "2n" }, { time: "3:2", note: "G5", dur: "2n" },
      
      // Bar 4: A5 - - - | A5 - - -
      { time: "4:0", note: "A5", dur: "1n" },
      
      // Bar 5: A5 - G5 - | E5 - - -
      { time: "5:0", note: "A5", dur: "2n" }, { time: "5:2", note: "G5", dur: "2n" },
      
      // Bar 6: E5 - C5 - | D5 - - -
      { time: "6:0", note: "E5", dur: "2n" }, { time: "6:2", note: "D5", dur: "4n" }, { time: "6:3", note: "C5", dur: "4n" },
      
      // Bar 7: D5 - E5 - | C5 - A4 -
      { time: "7:0", note: "D5", dur: "2n" }, { time: "7:2", note: "E5", dur: "2n" }, // Correction to fill
      
      // Bar 8: A4 - G4 - | C5 - - -
      { time: "8:0", note: "C5", dur: "2n" }, { time: "8:2", note: "A4", dur: "2n" },
      { time: "9:0", note: "G4", dur: "2n" }, { time: "9:2", note: "B4", dur: "2n" },
      
      // End
      { time: "10:0", note: "C5", dur: "1n" }
    ];

    // Simple Accompaniment (Chords) - Slow and Warm
    const bassLine = [
      { time: "0:0", note: ["C3", "E3"] },
      { time: "2:0", note: ["G3", "B3"] },
      { time: "4:0", note: ["F3", "A3"] },
      { time: "6:0", note: ["C3", "G3"] },
      { time: "8:0", note: ["F3", "A3"] },
      { time: "9:0", note: ["G3", "B3"] },
      { time: "10:0", note: ["C3", "G3", "C4"] }
    ];

    const part = new Tone.Part((time, event) => {
      if (event.note) {
        this.bgmSynth?.triggerAttackRelease(event.note, event.dur, time);
      }
    }, melody);
    part.loop = true;
    part.loopEnd = "11:0"; // Loop every 11 bars (approx)
    part.start(0);

    const bassPart = new Tone.Part((time, event) => {
      bassSynth.triggerAttackRelease(event.note, "1n", time);
    }, bassLine);
    bassPart.loop = true;
    bassPart.loopEnd = "11:0";
    bassPart.start(0);

    Tone.Transport.bpm.value = 100; // Slower, nostalgic tempo

    Tone.Transport.start();
    
    // this.bgmSynth.volume.value = -10;

    this.isInitialized = true;
  }

  public playBGM() {
    if (!this.isInitialized) return;
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
    // Ramp volume up if needed, but for now just ensure it's running
  }

  public stopBGM() {
    Tone.Transport.stop();
  }

  public setVolume(val: number) {
    // val is 0 to 1
    // Map to dB: 0 -> -Infinity, 1 -> 0
    this.isMuted = val === 0;
    if (this.isMuted) {
      Tone.Destination.mute = true;
    } else {
      Tone.Destination.mute = false;
      // Logarithmic volume control
      const db = 20 * Math.log10(val);
      Tone.Destination.volume.rampTo(db, 0.1);
    }
  }

  public playEffect(type: 'scatter' | 'tree' | 'heart' | 'saturn' | 'flower') {
    if (!this.isInitialized || !this.effectSynth) return;

    // Stop previous notes if any rapidly
    this.effectSynth.releaseAll();

    const now = Tone.now();

    switch (type) {
      case 'scatter':
        // Descending sparkly sound
        this.effectSynth.set({ envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 } });
        this.effectSynth.triggerAttackRelease(["C6", "G5", "E5", "C5"], "16n", now);
        this.effectSynth.triggerAttackRelease(["B5", "F#5", "D#5", "B4"], "16n", now + 0.1);
        break;
      case 'tree':
        // Ascending magical sound
        this.effectSynth.set({ envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 1 } });
        this.effectSynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "8n", now);
        this.effectSynth.triggerAttackRelease(["E5", "G5", "C6"], "8n", now + 0.1);
        break;
      case 'heart':
      case 'saturn':
      case 'flower':
        // 用户反馈音效刺耳，已移除特殊形状的切换音效
        break;
    }
  }
}

export const audioManager = AudioManager.getInstance();
