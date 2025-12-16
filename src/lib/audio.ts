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

    // Create BGM Synth (Bell-like for melody)
    this.bgmSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
    }).toDestination();
    
    // Bass/Chords Synth
    const bassSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.2 }
    }).toDestination();

    // Effect Synth
    this.effectSynth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.effectSynth.volume.value = -5;
    
    // Add reverb
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.3 }).toDestination();
    this.bgmSynth.connect(reverb);
    bassSynth.connect(reverb);
    this.effectSynth.connect(reverb);
    bassSynth.volume.value = -8;

    // Jingle Bells Melody (Chorus)
    // E4 E4 E4 | E4 E4 E4 | E4 G4 C4 D4 | E4
    // F4 F4 F4 F4 | F4 E4 E4 E4 | E4 D4 D4 E4 | D4 G4
    const melody = [
      { time: "0:0", note: "E4", dur: "4n" }, { time: "0:1", note: "E4", dur: "4n" }, { time: "0:2", note: "E4", dur: "2n" },
      { time: "1:0", note: "E4", dur: "4n" }, { time: "1:1", note: "E4", dur: "4n" }, { time: "1:2", note: "E4", dur: "2n" },
      { time: "2:0", note: "E4", dur: "4n" }, { time: "2:1", note: "G4", dur: "4n" }, { time: "2:2", note: "C4", dur: "4n" }, { time: "2:3", note: "D4", dur: "4n" },
      { time: "3:0", note: "E4", dur: "1n" },
      
      { time: "4:0", note: "F4", dur: "4n" }, { time: "4:1", note: "F4", dur: "4n" }, { time: "4:2", note: "F4", dur: "4n" }, { time: "4:3", note: "F4", dur: "8n" }, { time: "4:3:2", note: "F4", dur: "8n" },
      { time: "5:0", note: "F4", dur: "4n" }, { time: "5:1", note: "E4", dur: "4n" }, { time: "5:2", note: "E4", dur: "4n" }, { time: "5:3", note: "E4", dur: "8n" }, { time: "5:3:2", note: "E4", dur: "8n" },
      { time: "6:0", note: "E4", dur: "4n" }, { time: "6:1", note: "D4", dur: "4n" }, { time: "6:2", note: "D4", dur: "4n" }, { time: "6:3", note: "E4", dur: "4n" },
      { time: "7:0", note: "D4", dur: "2n" }, { time: "7:2", note: "G4", dur: "2n" }
    ];

    // Simple Accompaniment
    const bassLine = [
      { time: "0:0", note: ["C3", "G3"] },
      { time: "1:0", note: ["C3", "G3"] },
      { time: "2:0", note: ["C3", "G3"] },
      { time: "3:0", note: ["C3", "E3", "G3"] },
      { time: "4:0", note: ["F3", "A3", "C4"] },
      { time: "5:0", note: ["C3", "G3"] },
      { time: "6:0", note: ["G3", "B3", "D4"] },
      { time: "7:0", note: ["G3", "D4"] }
    ];

    const part = new Tone.Part((time, event) => {
      this.bgmSynth?.triggerAttackRelease(event.note, event.dur, time);
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

    this.bgmLoop = new Tone.Loop(() => {}, "8n"); // Dummy loop to keep transport happy if needed, or rely on Parts
    
    Tone.Transport.bpm.value = 160; // Upbeat tempo
    Tone.Transport.start();
    
    this.bgmSynth.volume.value = -10;

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
