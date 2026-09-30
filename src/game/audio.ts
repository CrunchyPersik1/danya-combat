type ToneType = 'sine' | 'square' | 'triangle' | 'sawtooth'

class Sfx {
  ctx: AudioContext | null = null
  master: GainNode | null = null
  musicGain: GainNode | null = null
  enabled = true
  volume = 0.5

  ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) return null
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume
      this.master.connect(this.ctx.destination)
      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = 0.55
      this.musicGain.connect(this.master)
    }
    if (this.ctx.state === 'suspended') { this.ctx.resume() }
    return this.ctx
  }

  setVolume(v: number) {
    this.volume = v
    if (this.master) this.master.gain.value = v
  }
  setEnabled(v: boolean) {
    this.enabled = v
    if (this.master) this.master.gain.value = v ? this.volume : 0
  }

  tone(freq: number, dur: number, type: ToneType, gain: number, delay: number, dest?: GainNode | null) {
    if (!this.enabled) return
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const t0 = ctx.currentTime + (delay || 0)
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type || 'sine'
    osc.frequency.setValueAtTime(freq, t0)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain || 0.15), t0 + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g)
    g.connect(dest || this.master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.05)
  }

  noise(dur: number, gain: number) {
    if (!this.enabled) return
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const len = Math.floor(ctx.sampleRate * dur)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    g.gain.value = gain
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 900
    src.connect(f); f.connect(g); g.connect(this.master)
    src.start()
  }

  click(pitch: number) {
    const p = pitch || 0
    this.tone(520 + p * 40, 0.09, 'triangle', 0.16, 0)
    this.tone(1040 + p * 80, 0.06, 'sine', 0.07, 0.01)
  }
  note(freq: number, dur: number, gain: number) {
    this.tone(freq, dur || 0.35, 'triangle', gain || 0.14, 0, this.musicGain)
  }
  coin() {
    this.tone(880, 0.07, 'square', 0.06, 0)
    this.tone(1320, 0.1, 'square', 0.05, 0.06)
  }
  buy() {
    this.tone(523.25, 0.1, 'sine', 0.12, 0)
    this.tone(659.25, 0.1, 'sine', 0.12, 0.08)
    this.tone(783.99, 0.16, 'sine', 0.12, 0.16)
  }
  deny() {
    this.tone(180, 0.18, 'sawtooth', 0.1, 0)
    this.tone(120, 0.22, 'sawtooth', 0.1, 0.09)
  }
  hit() {
    this.noise(0.13, 0.28)
    this.tone(120, 0.1, 'square', 0.12, 0)
  }
  heavy() {
    this.noise(0.24, 0.36)
    this.tone(80, 0.2, 'sawtooth', 0.16, 0)
  }
  crit() {
    this.tone(1500, 0.06, 'square', 0.1, 0)
    this.tone(700, 0.3, 'sawtooth', 0.12, 0.03)
  }
  win() {
    const n = [523.25, 659.25, 783.99, 1046.5]
    for (let i = 0; i < n.length; i++) this.tone(n[i], 0.28, 'triangle', 0.15, i * 0.11)
  }
  lose() {
    const n = [392, 329.63, 261.63, 196]
    for (let i = 0; i < n.length; i++) this.tone(n[i], 0.3, 'sawtooth', 0.12, i * 0.14)
  }
  box() {
    for (let i = 0; i < 6; i++) this.tone(300 + i * 130, 0.09, 'square', 0.07, i * 0.06)
  }
  levelUp() {
    const n = [659.25, 830.61, 987.77, 1318.5]
    for (let i = 0; i < n.length; i++) this.tone(n[i], 0.24, 'sine', 0.14, i * 0.08)
  }
}

export const sfx = new Sfx()
