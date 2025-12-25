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

    // We Wish You A Merry Christmas Melody
    // We wish you a merry Christmas
    // D4 | G4 G4 A4 G4 F#4 | E4 E4 E4 | A4 A4 B4 A4 G4 | F#4 D4 D4 | B4 B4 C5 B4 A4 | G4 E4 D4 D4 | E4 A4 F#4 | G4
    const melody = [
      // Pickup
      { time: "0:0", note: "D4", dur: "2n" }, // Legato
      
      // Bar 1: G G A G F#
      { time: "0:1", note: "G4", dur: "4n" },
      { time: "0:2", note: "G4", dur: "4n" }, { time: "0:2:2", note: "A4", dur: "4n" },
      { time: "0:3", note: "G4", dur: "4n" }, { time: "0:3:2", note: "F#4", dur: "4n" },
      
      // Bar 2: E E E
      { time: "1:0", note: "E4", dur: "2n" }, { time: "1:1", note: "E4", dur: "2n" }, { time: "1:2", note: "E4", dur: "2n" },
      
      // Bar 3: A A B A G
      { time: "2:0", note: "A4", dur: "2n" },
      { time: "2:1", note: "A4", dur: "4n" }, { time: "2:1:2", note: "B4", dur: "4n" },
      { time: "2:2", note: "A4", dur: "4n" }, { time: "2:2:2", note: "G4", dur: "4n" },
      
      // Bar 4: F# D D
      { time: "3:0", note: "F#4", dur: "2n" }, { time: "3:1", note: "D4", dur: "2n" }, { time: "3:2", note: "D4", dur: "2n" },
      
      // Bar 5: B B C5 B A
      { time: "4:0", note: "B4", dur: "2n" },
      { time: "4:1", note: "B4", dur: "4n" }, { time: "4:1:2", note: "C5", dur: "4n" },
      { time: "4:2", note: "B4", dur: "4n" }, { time: "4:2:2", note: "A4", dur: "4n" },
      
      // Bar 6: G E D D
      { time: "5:0", note: "G4", dur: "2n" }, { time: "5:1", note: "E4", dur: "2n" },
      { time: "5:2", note: "D4", dur: "4n" }, { time: "5:2:2", note: "D4", dur: "4n" },
      
      // Bar 7: E A F#
      { time: "6:0", note: "E4", dur: "2n" }, { time: "6:1", note: "A4", dur: "2n" }, { time: "6:2", note: "F#4", dur: "2n" },
      
      // Bar 8: G
      { time: "7:0", note: "G4", dur: "1n" }, { time: "7:2", note: null, dur: "2n" }
    ];

    // Simple Accompaniment (Chords) - Slower and Sustained
    const bassLine = [
      { time: "0:0", note: ["G3", "B3", "D4"] },
      { time: "1:0", note: ["C3", "E3", "G3"] },
      { time: "2:0", note: ["D3", "F#3", "A3"] },
      { time: "3:0", note: ["B2", "D3", "F#3"] },
      { time: "4:0", note: ["G3", "B3", "D4"] },
      { time: "5:0", note: ["C3", "E3", "G3"] },
      { time: "6:0", note: ["D3", "A3", "C4"] },
      { time: "7:0", note: ["G2", "B2", "D3", "G3"] }
    ];

    const part = new Tone.Part((time, event) => {
      if (event.note) {
        this.bgmSynth?.triggerAttackRelease(event.note, event.dur, time);
      }
    }, melody);
    part.loop = true;
    part.loopEnd = "8:0";
    part.start(0);

    const bassPart = new Tone.Part((time, event) => {
      bassSynth.triggerAttackRelease(event.note, "1n", time);
    }, bassLine);
    bassPart.loop = true;
    bassPart.loopEnd = "8:0";
    bassPart.start(0);

    Tone.Transport.bpm.value = 140; // Waltz tempo

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
