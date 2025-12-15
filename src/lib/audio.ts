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

  public async init() {
    if (this.isInitialized) return;
    await Tone.start();
    
    // Set up Master volume
    Tone.Destination.volume.value = this.volume;

    // Create BGM Synth (Ambient Pad)
    this.bgmSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 2, decay: 1, sustain: 0.5, release: 2 }
    }).toDestination();
    
    // Add some reverb for atmosphere
    const reverb = new Tone.Reverb(3).toDestination();
    this.bgmSynth.connect(reverb);

    // Simple Christmas-y chord progression loop
    const chords = [
      ["C4", "E4", "G4"], // C Major
      ["F4", "A4", "C5"], // F Major
      ["G4", "B4", "D5"], // G Major
      ["C4", "E4", "G4"]  // C Major
    ];
    
    let index = 0;
    this.bgmLoop = new Tone.Loop((time) => {
      if (this.bgmSynth) {
        this.bgmSynth.triggerAttackRelease(chords[index], "2n", time);
        index = (index + 1) % chords.length;
      }
    }, "1n");

    this.bgmLoop.start(0);
    Tone.Transport.start();
    
    // Start with low volume for background
    this.bgmSynth.volume.value = -15;

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

  public playEffect(type: 'scatter' | 'tree' | 'heart') {
    if (!this.isInitialized) return;

    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.volume.value = -5;

    const now = Tone.now();

    switch (type) {
      case 'scatter':
        // Descending sparkly sound
        synth.set({ envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 } });
        synth.triggerAttackRelease(["C6", "G5", "E5", "C5"], "16n", now);
        synth.triggerAttackRelease(["B5", "F#5", "D#5", "B4"], "16n", now + 0.1);
        break;
      case 'tree':
        // Ascending magical sound
        synth.set({ envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 1 } });
        synth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "8n", now);
        synth.triggerAttackRelease(["E5", "G5", "C6"], "8n", now + 0.1);
        break;
      case 'heart':
        // Warm major 7th chord
        synth.set({ oscillator: { type: 'triangle' }, envelope: { attack: 0.5, decay: 1, sustain: 0.5, release: 2 } });
        synth.triggerAttackRelease(["F4", "A4", "C5", "E5"], "1n", now);
        break;
    }

    // Clean up synth after a few seconds
    setTimeout(() => {
      synth.dispose();
    }, 3000);
  }
}

export const audioManager = AudioManager.getInstance();
