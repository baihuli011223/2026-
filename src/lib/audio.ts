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

    // Auld Lang Syne (New Year Song) - Optimized
    // 使用 Tone.Part 可能导致调度压力大，改用更简单的 scheduling 或优化 Part 参数
    // 同时限制复音数和 Release 时间

    // 1. 设置 LookAhead (牺牲一点延迟换取稳定)
    Tone.context.lookAhead = 0.1;

    // 2. 更柔和的钢琴音色，减少复音
    this.bgmSynth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 6, // 限制最大复音数，防止 CPU 过载
      oscillator: { type: "triangle" }, 
      envelope: { 
        attack: 0.02, 
        decay: 0.1,    
        sustain: 0.3,  
        release: 0.8   // 进一步缩短 Release
      },
      volume: -10 
    }); 
    
    // Bass Synth - Monophonic is usually enough for bass
    const bassSynth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 4,
      oscillator: { type: "sine" }, 
      envelope: { 
        attack: 0.05, 
        decay: 0.2, 
        sustain: 0.4, 
        release: 1.0 
      },
      volume: -8
    });

    const lowPass = new Tone.Filter(800, "lowpass");
    // 减少混响开销
    const reverb = new Tone.Reverb({ decay: 2.0, preDelay: 0.01, wet: 0.15 });

    this.bgmSynth.chain(lowPass, reverb, limiter);
    bassSynth.chain(lowPass, reverb, limiter);
    
    // Auld Lang Syne Melody - C Major
    const melody = [
      // Pickup
      { time: "0:0", note: "G4", dur: "4n" }, 
      
      // Bar 1
      { time: "0:1", note: "C5", dur: "2n." }, 
      { time: "0:3:2", note: "B4", dur: "8n" }, 
      { time: "0:3:3", note: "C5", dur: "8n" }, 
      
      // Bar 2
      { time: "1:0", note: "C5", dur: "2n" }, { time: "1:2", note: "E5", dur: "2n" },
      
      // Bar 3
      { time: "2:0", note: "D5", dur: "2n" }, { time: "2:2", note: "C5", dur: "4n" }, { time: "2:3", note: "D5", dur: "4n" },
      
      // Bar 4
      { time: "3:0", note: "E5", dur: "2n" }, { time: "3:2", note: "G5", dur: "2n" },
      
      // Bar 5
      { time: "4:0", note: "A5", dur: "1n" },
      
      // Bar 6
      { time: "5:0", note: "A5", dur: "2n" }, { time: "5:2", note: "G5", dur: "2n" },
      
      // Bar 7
      { time: "6:0", note: "E5", dur: "2n" }, { time: "6:2", note: "D5", dur: "4n" }, { time: "6:3", note: "C5", dur: "4n" },
      
      // Bar 8
      { time: "7:0", note: "D5", dur: "2n" }, { time: "7:2", note: "E5", dur: "2n" },
      
      // Bar 9
      { time: "8:0", note: "C5", dur: "2n" }, { time: "8:2", note: "A4", dur: "2n" },
      { time: "9:0", note: "G4", dur: "2n" }, { time: "9:2", note: "B4", dur: "2n" },
      
      // End
      { time: "10:0", note: "C5", dur: "1n" }
    ];

    // Simplified Bass Line (Root notes mainly)
    const bassLine = [
      { time: "0:0", note: "C3" },
      { time: "2:0", note: "G3" },
      { time: "4:0", note: "F3" },
      { time: "6:0", note: "C3" },
      { time: "8:0", note: "F3" },
      { time: "9:0", note: "G3" },
      { time: "10:0", note: "C3" }
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
