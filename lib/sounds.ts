"use client"

// Premium Web Audio API sound synthesizer for casino sounds
// Creates rich, satisfying, and relaxing audio feedback

class PremiumSoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private volume: number = 0.6
  private ambientNode: AudioBufferSourceNode | null = null
  private ambientGain: GainNode | null = null
  private ambientEnabled: boolean = false
  private masterGain: GainNode | null = null
  private reverbNode: ConvolverNode | null = null

  constructor() {
    if (typeof window !== "undefined") {
      const storedEnabled = localStorage.getItem("lockslot_sound_enabled")
      const storedVolume = localStorage.getItem("lockslot_sound_volume")
      
      if (storedEnabled !== null) this.enabled = storedEnabled === "true"
      if (storedVolume !== null) this.volume = parseFloat(storedVolume)
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.setupMasterChain()
    }
    return this.audioContext
  }

  private setupMasterChain() {
    const ctx = this.audioContext
    if (!ctx) return

    // Master gain for overall volume control
    this.masterGain = ctx.createGain()
    this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime)
    this.masterGain.connect(ctx.destination)

    // Create impulse response for subtle reverb
    this.createReverb()
  }

  private createReverb() {
    const ctx = this.audioContext
    if (!ctx) return

    const length = ctx.sampleRate * 1.5
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5)
      }
    }

    this.reverbNode = ctx.createConvolver()
    this.reverbNode.buffer = impulse
  }

  private playTone(options: {
    frequency: number
    type?: OscillatorType
    duration: number
    volume?: number
    attack?: number
    decay?: number
    sustain?: number
    release?: number
    detune?: number
    useReverb?: boolean
    pan?: number
  }) {
    const ctx = this.getContext()
    if (!ctx || !this.enabled || !this.masterGain) return

    const {
      frequency,
      type = "sine",
      duration,
      volume = 0.3,
      attack = 0.01,
      decay = 0.1,
      sustain = 0.7,
      release = 0.2,
      detune = 0,
      useReverb = false,
      pan = 0
    } = options

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const panner = ctx.createStereoPanner()

    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    osc.detune.setValueAtTime(detune, ctx.currentTime)
    panner.pan.setValueAtTime(pan, ctx.currentTime)

    // ADSR envelope for smoother sound
    const now = ctx.currentTime
    const peakVolume = volume * this.volume
    const sustainVolume = peakVolume * sustain

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(peakVolume, now + attack)
    gain.gain.linearRampToValueAtTime(sustainVolume, now + attack + decay)
    gain.gain.setValueAtTime(sustainVolume, now + duration - release)
    gain.gain.linearRampToValueAtTime(0.001, now + duration)

    osc.connect(gain)
    gain.connect(panner)

    if (useReverb && this.reverbNode) {
      const reverbGain = ctx.createGain()
      reverbGain.gain.setValueAtTime(0.3, ctx.currentTime)
      panner.connect(this.reverbNode)
      this.reverbNode.connect(reverbGain)
      reverbGain.connect(this.masterGain)
    }

    panner.connect(this.masterGain)

    osc.start()
    osc.stop(ctx.currentTime + duration + 0.1)
  }

  private playNoise(options: {
    duration: number
    volume?: number
    filterFreq?: number
    filterType?: BiquadFilterType
    attack?: number
    release?: number
  }) {
    const ctx = this.getContext()
    if (!ctx || !this.enabled || !this.masterGain) return

    const {
      duration,
      volume = 0.2,
      filterFreq = 2000,
      filterType = "lowpass",
      attack = 0.01,
      release = 0.1
    } = options

    const bufferSize = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1)
      }
    }

    const noise = ctx.createBufferSource()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    filter.type = filterType
    filter.frequency.setValueAtTime(filterFreq, ctx.currentTime)
    filter.Q.setValueAtTime(1, ctx.currentTime)

    noise.buffer = buffer

    const now = ctx.currentTime
    const peakVolume = volume * this.volume
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(peakVolume, now + attack)
    gain.gain.setValueAtTime(peakVolume, now + duration - release)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start()
    noise.stop(ctx.currentTime + duration)
  }

  private playChime(baseFreq: number, volume: number = 0.3) {
    // Bell-like chime with harmonics
    const harmonics = [1, 2, 2.4, 3, 4.2, 5.4]
    const volumes = [1, 0.5, 0.3, 0.25, 0.2, 0.15]

    harmonics.forEach((h, i) => {
      this.playTone({
        frequency: baseFreq * h,
        type: "sine",
        duration: 0.8 - i * 0.1,
        volume: volume * volumes[i],
        attack: 0.002,
        decay: 0.3,
        sustain: 0.2,
        release: 0.4,
        useReverb: true
      })
    })
  }

  // === PREMIUM CASINO SOUND EFFECTS ===

  spinStart() {
    if (!this.enabled) return
    
    // Satisfying whoosh with rising energy
    this.playNoise({ duration: 0.4, volume: 0.15, filterFreq: 3000, attack: 0.02 })
    
    // Rising sweep - builds anticipation
    const ctx = this.getContext()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = "sine"
    osc.frequency.setValueAtTime(150, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.35)
    
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.25 * this.volume, ctx.currentTime + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(ctx.currentTime + 0.45)

    // Soft click at start
    setTimeout(() => {
      this.playTone({ frequency: 1200, duration: 0.05, volume: 0.15, attack: 0.001 })
    }, 50)
  }

  reelTick() {
    if (!this.enabled) return
    // Soft satisfying tick - like a reel clicking
    this.playTone({
      frequency: 1800 + Math.random() * 400,
      type: "triangle",
      duration: 0.03,
      volume: 0.08,
      attack: 0.001,
      decay: 0.01,
      sustain: 0.3,
      release: 0.01,
      pan: (Math.random() - 0.5) * 0.6
    })
  }

  reelStop(reelIndex: number = 0) {
    if (!this.enabled) return
    
    // Each reel has slightly different pitch for variety
    const basePitch = 200 + reelIndex * 30
    const pan = (reelIndex - 1) * 0.4
    
    // Satisfying thunk with subtle resonance
    this.playTone({
      frequency: basePitch,
      type: "sine",
      duration: 0.2,
      volume: 0.35,
      attack: 0.005,
      decay: 0.15,
      sustain: 0.1,
      release: 0.05,
      pan
    })
    
    // Mechanical click layer
    this.playTone({
      frequency: 800 + reelIndex * 100,
      type: "square",
      duration: 0.03,
      volume: 0.1,
      attack: 0.001,
      pan
    })
    
    // Subtle air/noise
    this.playNoise({
      duration: 0.1,
      volume: 0.08,
      filterFreq: 1500
    })
  }

  spinStop() {
    if (!this.enabled) return
    // Final stop - satisfying conclusion
    this.reelStop(1)
  }

  winLegendary() {
    if (!this.enabled) return
    
    // Elegant emerald win - triumphant but classy
    // Main fanfare chord progression: C major to G major
    const chords = [
      [523, 659, 784],      // C5, E5, G5
      [587, 740, 880],      // D5, F#5, A5
      [659, 784, 988],      // E5, G5, B5
      [784, 988, 1175]      // G5, B5, D6
    ]

    chords.forEach((chord, chordIndex) => {
      setTimeout(() => {
        chord.forEach((freq, noteIndex) => {
          this.playTone({
            frequency: freq,
            type: "sine",
            duration: 0.6,
            volume: 0.25 - noteIndex * 0.05,
            attack: 0.02,
            decay: 0.2,
            sustain: 0.6,
            release: 0.3,
            useReverb: true,
            detune: Math.random() * 5 - 2.5
          })
        })
      }, chordIndex * 150)
    })

    // Sparkle overlay - magical shimmer
    setTimeout(() => {
      for (let i = 0; i < 12; i++) {
        setTimeout(() => {
          this.playTone({
            frequency: 2000 + Math.random() * 2500,
            type: "sine",
            duration: 0.15,
            volume: 0.08,
            attack: 0.005,
            decay: 0.05,
            sustain: 0.3,
            release: 0.1,
            pan: (Math.random() - 0.5) * 1.5
          })
        }, i * 45)
      }
    }, 400)

    // Coin cascade
    setTimeout(() => this.coinCascade(6), 600)
  }

  winMythic() {
    if (!this.enabled) return
    
    // Epic mythic win - dramatic and powerful
    // Deep bass impact
    this.playTone({
      frequency: 55,
      type: "sine",
      duration: 1.2,
      volume: 0.5,
      attack: 0.02,
      decay: 0.3,
      sustain: 0.4,
      release: 0.6
    })

    // Sub-bass rumble
    this.playTone({
      frequency: 35,
      type: "sine",
      duration: 1.5,
      volume: 0.35,
      attack: 0.1,
      decay: 0.4,
      sustain: 0.3,
      release: 0.7
    })

    // Epic ascending arpeggio
    const notes = [392, 494, 587, 698, 784, 988, 1175, 1480]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone({
          frequency: freq,
          type: "sine",
          duration: 0.7 - i * 0.05,
          volume: 0.3,
          attack: 0.01,
          decay: 0.2,
          sustain: 0.5,
          release: 0.3,
          useReverb: true
        })
        // Octave doubling for richness
        this.playTone({
          frequency: freq * 2,
          type: "sine",
          duration: 0.5,
          volume: 0.12,
          attack: 0.02,
          useReverb: true
        })
      }, i * 80)
    })

    // Magical shimmer burst
    setTimeout(() => {
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          this.playTone({
            frequency: 1500 + Math.random() * 3500,
            type: "sine",
            duration: 0.2,
            volume: 0.1,
            attack: 0.002,
            decay: 0.08,
            sustain: 0.3,
            release: 0.1,
            pan: (Math.random() - 0.5) * 2
          })
        }, i * 35)
      }
    }, 500)

    // Coin cascade - big win!
    setTimeout(() => this.coinCascade(12), 700)
    
    // Final triumphant chord
    setTimeout(() => {
      [784, 988, 1175, 1568].forEach((freq, i) => {
        this.playTone({
          frequency: freq,
          type: "sine",
          duration: 1.2,
          volume: 0.2,
          attack: 0.05,
          decay: 0.3,
          sustain: 0.6,
          release: 0.5,
          useReverb: true
        })
      })
    }, 800)
  }

  winHot() {
    if (!this.enabled) return
    // Nice win but not as big - warm and satisfying
    const notes = [523, 659, 784]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone({
          frequency: freq,
          type: "sine",
          duration: 0.4,
          volume: 0.25,
          attack: 0.02,
          decay: 0.15,
          sustain: 0.5,
          release: 0.2,
          useReverb: true
        })
      }, i * 100)
    })

    // Small sparkle
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          this.playTone({
            frequency: 2000 + Math.random() * 1500,
            type: "sine",
            duration: 0.1,
            volume: 0.06,
            pan: (Math.random() - 0.5)
          })
        }, i * 50)
      }
    }, 250)

    this.coinCascade(3)
  }

  lose() {
    if (!this.enabled) return
    // Gentle, non-punishing - just a soft acknowledgment
    // Subtle descending tone - calming not discouraging
    this.playTone({
      frequency: 350,
      type: "sine",
      duration: 0.25,
      volume: 0.15,
      attack: 0.02,
      decay: 0.1,
      sustain: 0.4,
      release: 0.15
    })
    
    setTimeout(() => {
      this.playTone({
        frequency: 280,
        type: "sine",
        duration: 0.3,
        volume: 0.12,
        attack: 0.02,
        decay: 0.15,
        sustain: 0.3,
        release: 0.2
      })
    }, 120)

    // Soft breath/whoosh - like "ah well"
    this.playNoise({
      duration: 0.2,
      volume: 0.05,
      filterFreq: 800,
      attack: 0.05,
      release: 0.15
    })
  }

  click() {
    if (!this.enabled) return
    // Satisfying UI click - crisp but soft
    this.playTone({
      frequency: 800,
      type: "sine",
      duration: 0.06,
      volume: 0.18,
      attack: 0.002,
      decay: 0.03,
      sustain: 0.2,
      release: 0.02
    })
    // Subtle high harmonic
    this.playTone({
      frequency: 1600,
      type: "sine",
      duration: 0.03,
      volume: 0.06,
      attack: 0.001
    })
  }

  hover() {
    if (!this.enabled) return
    // Very subtle hover feedback
    this.playTone({
      frequency: 1400,
      type: "sine",
      duration: 0.04,
      volume: 0.04,
      attack: 0.005,
      decay: 0.02,
      sustain: 0.3,
      release: 0.01
    })
  }

  buttonPress() {
    if (!this.enabled) return
    // Satisfying button press
    this.playTone({
      frequency: 600,
      type: "sine",
      duration: 0.08,
      volume: 0.2,
      attack: 0.002,
      decay: 0.04,
      sustain: 0.3,
      release: 0.03
    })
    this.playTone({
      frequency: 900,
      type: "triangle",
      duration: 0.05,
      volume: 0.08,
      attack: 0.001
    })
  }

  deposit() {
    if (!this.enabled) return
    // Positive deposit - money going in
    // Rising chime
    this.playChime(880, 0.25)
    
    setTimeout(() => {
      this.playChime(1100, 0.2)
    }, 100)

    // Coin sounds
    this.coinDrop()
    setTimeout(() => this.coinDrop(), 80)
  }

  withdraw() {
    if (!this.enabled) return
    // Smooth withdrawal sound
    this.playTone({
      frequency: 500,
      type: "sine",
      duration: 0.2,
      volume: 0.2,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.4,
      release: 0.1
    })
    
    setTimeout(() => {
      this.playTone({
        frequency: 380,
        type: "sine",
        duration: 0.25,
        volume: 0.15,
        attack: 0.02,
        decay: 0.15,
        sustain: 0.3,
        release: 0.1
      })
    }, 100)

    // Subtle whoosh
    this.playNoise({
      duration: 0.25,
      volume: 0.08,
      filterFreq: 1200
    })
  }

  claim() {
    if (!this.enabled) return
    // Happy cha-ching! - reward claimed
    // Bright ascending chimes
    const notes = [880, 1100, 1320, 1760]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playChime(freq, 0.2 - i * 0.03)
      }, i * 70)
    })

    // Coin cascade
    setTimeout(() => this.coinCascade(8), 200)
  }

  coinDrop() {
    if (!this.enabled) return
    // Single coin drop - metallic and satisfying
    const baseFreq = 2200 + Math.random() * 600

    this.playTone({
      frequency: baseFreq,
      type: "sine",
      duration: 0.12,
      volume: 0.2,
      attack: 0.001,
      decay: 0.05,
      sustain: 0.3,
      release: 0.06,
      pan: (Math.random() - 0.5) * 0.8
    })

    // Harmonic overtone
    this.playTone({
      frequency: baseFreq * 2.4,
      type: "sine",
      duration: 0.08,
      volume: 0.08,
      attack: 0.001
    })

    // Tiny metallic noise
    this.playNoise({
      duration: 0.04,
      volume: 0.05,
      filterFreq: 6000,
      filterType: "highpass"
    })
  }

  coinCascade(count: number = 5) {
    if (!this.enabled) return
    // Multiple coins falling - jackpot feeling
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.coinDrop()
      }, i * (40 + Math.random() * 30))
    }
  }

  notification() {
    if (!this.enabled) return
    // Gentle notification chime
    this.playChime(1047, 0.2)
    setTimeout(() => {
      this.playTone({
        frequency: 1319,
        type: "sine",
        duration: 0.3,
        volume: 0.15,
        attack: 0.01,
        useReverb: true
      })
    }, 120)
  }

  success() {
    if (!this.enabled) return
    // General success sound
    const notes = [523, 659, 784]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone({
          frequency: freq,
          type: "sine",
          duration: 0.2,
          volume: 0.2,
          attack: 0.01,
          useReverb: true
        })
      }, i * 60)
    })
  }

  error() {
    if (!this.enabled) return
    // Gentle error - not harsh
    this.playTone({
      frequency: 280,
      type: "sine",
      duration: 0.15,
      volume: 0.15,
      attack: 0.01
    })
    setTimeout(() => {
      this.playTone({
        frequency: 220,
        type: "sine",
        duration: 0.2,
        volume: 0.12,
        attack: 0.01
      })
    }, 100)
  }

  levelUp() {
    if (!this.enabled) return
    // Exciting level up / achievement
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone({
          frequency: freq,
          type: "sine",
          duration: 0.3,
          volume: 0.25,
          attack: 0.01,
          useReverb: true
        })
        this.playTone({
          frequency: freq * 2,
          type: "sine",
          duration: 0.2,
          volume: 0.1,
          attack: 0.02,
          useReverb: true
        })
      }, i * 80)
    })

    // Sparkles
    setTimeout(() => {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          this.playTone({
            frequency: 2500 + Math.random() * 2000,
            type: "sine",
            duration: 0.1,
            volume: 0.08,
            pan: (Math.random() - 0.5) * 1.5
          })
        }, i * 40)
      }
    }, 350)
  }

  // Ambient background - relaxing casino atmosphere
  startAmbient() {
    if (!this.enabled || this.ambientEnabled) return
    const ctx = this.getContext()
    if (!ctx || !this.masterGain) return

    this.ambientEnabled = true

    // Create a subtle ambient pad
    const playAmbientPad = () => {
      if (!this.ambientEnabled || !ctx || !this.masterGain) return

      // Soft chord pad
      const notes = [130.81, 164.81, 196, 261.63] // C3, E3, G3, C4
      notes.forEach(freq => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()

        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, ctx.currentTime)

        filter.type = "lowpass"
        filter.frequency.setValueAtTime(400, ctx.currentTime)

        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.02 * this.volume, ctx.currentTime + 2)
        gain.gain.setValueAtTime(0.02 * this.volume, ctx.currentTime + 6)
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 8)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.masterGain!)

        osc.start()
        osc.stop(ctx.currentTime + 8)
      })
    }

    playAmbientPad()
    // Loop ambient
    const ambientInterval = setInterval(() => {
      if (!this.ambientEnabled) {
        clearInterval(ambientInterval)
        return
      }
      playAmbientPad()
    }, 7500)
  }

  stopAmbient() {
    this.ambientEnabled = false
  }

  // Settings
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      this.stopAmbient()
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("lockslot_sound_enabled", String(enabled))
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime)
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("lockslot_sound_volume", String(this.volume))
    }
  }

  isEnabled() { return this.enabled }
  getVolume() { return this.volume }
  isAmbientEnabled() { return this.ambientEnabled }

  resume() {
    this.audioContext?.resume()
  }
}

// Singleton
let soundManagerInstance: PremiumSoundManager | null = null

function getSoundManager(): PremiumSoundManager | null {
  if (typeof window === "undefined") return null
  if (!soundManagerInstance) {
    soundManagerInstance = new PremiumSoundManager()
  }
  return soundManagerInstance
}

// Export convenience functions
export const gameSounds = {
  spinStart: () => getSoundManager()?.spinStart(),
  reelTick: () => getSoundManager()?.reelTick(),
  reelStop: (index?: number) => getSoundManager()?.reelStop(index),
  spinStop: () => getSoundManager()?.spinStop(),
  winLegendary: () => getSoundManager()?.winLegendary(),
  winMythic: () => getSoundManager()?.winMythic(),
  winHot: () => getSoundManager()?.winHot(),
  lose: () => getSoundManager()?.lose(),
  click: () => getSoundManager()?.click(),
  hover: () => getSoundManager()?.hover(),
  buttonPress: () => getSoundManager()?.buttonPress(),
  deposit: () => getSoundManager()?.deposit(),
  withdraw: () => getSoundManager()?.withdraw(),
  claim: () => getSoundManager()?.claim(),
  coinDrop: () => getSoundManager()?.coinDrop(),
  coinCascade: (count?: number) => getSoundManager()?.coinCascade(count),
  notification: () => getSoundManager()?.notification(),
  success: () => getSoundManager()?.success(),
  error: () => getSoundManager()?.error(),
  levelUp: () => getSoundManager()?.levelUp(),
  startAmbient: () => getSoundManager()?.startAmbient(),
  stopAmbient: () => getSoundManager()?.stopAmbient(),
}

export const setSoundEnabled = (enabled: boolean) => getSoundManager()?.setEnabled(enabled)
export const setSoundVolume = (volume: number) => getSoundManager()?.setVolume(volume)
export const isSoundEnabled = () => getSoundManager()?.isEnabled() ?? true
export const getSoundVolume = () => getSoundManager()?.getVolume() ?? 0.6
export const isAmbientEnabled = () => getSoundManager()?.isAmbientEnabled() ?? false
export const resumeAudio = () => getSoundManager()?.resume()
