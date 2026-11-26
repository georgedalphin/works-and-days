/**
 * Sound: everything synthesized in the browser, no recordings.
 *
 * The soundscape follows the place, season, hour and weather: wind, birdsong, cicadas in the summer heat,
 * crickets and frogs at night, rain, waves on the shore, drips in caves, the smithy's hammer, the hearth fire.
 * The music is a plucked lyre in an old mode, sparse and unhurried; when something turns on you,
 * a frame drum, a lyre ostinato and a reedy aulos come in, and fade again when the danger passes.
 *
 * M mutes everything; N turns the music alone off and on.
 */

export interface SoundState {
  scene: string; // Farm, Wild, Village, House, Cave, Title…
  terrain: number;
  season: string;
  day: boolean;
  dusk: boolean;
  weather: string;
  danger: boolean;
  /** A festival in the village today: music in the square. */
  festival?: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
/** E Phrygian (the ancients' Dorian): E F G A B C D, around E3–E5, as frequencies. */
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const CALM = [52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71]; // E3 … B4
const TENSE = [40, 41, 43, 44, 47, 48, 50, 52]; // E2 … E3, with the sharp-edged Ab and the half step to F

export class SoundScape {
  ctx?: BaseAudioContext;
  master?: GainNode; music?: GainNode; amb?: GainNode; fx?: GainNode; danger?: GainNode; verb?: DelayNode;
  noise?: AudioBuffer;
  layers: Record<string, GainNode> = {};
  muted = false; musicOn = true;
  timers: Record<string, number> = { bird: 2, cricket: 0, frog: 3, drip: 1, clink: 4, crackle: 0, phrase: 3 };
  beat = 0; nextBeat = 0; dangerLevel = 0; lastDanger = -99;
  st?: SoundState;

  /** Browsers only allow sound after the player does something: call this on the first key or click. */
  start(given?: BaseAudioContext) {
    if (this.ctx && !given) { if (this.ctx.state === "suspended") (this.ctx as AudioContext).resume?.(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC && !given) return;
    const ctx = (this.ctx = given ?? new AC());
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 1; this.master.connect(ctx.destination);
    // A simple echo stands in for a room, a valley, a cave.
    this.verb = ctx.createDelay(1); this.verb.delayTime.value = 0.23;
    const fb = ctx.createGain(); fb.gain.value = 0.28; const vlp = ctx.createBiquadFilter(); vlp.type = "lowpass"; vlp.frequency.value = 2200;
    this.verb.connect(vlp); vlp.connect(fb); fb.connect(this.verb); vlp.connect(this.master);
    this.music = this.bus(0.9); this.amb = this.bus(0.5); this.fx = this.bus(0.6);
    this.danger = ctx.createGain(); this.danger.gain.value = 0; this.danger.connect(this.music);
    // A shared buffer of noise for wind, rain, waves, insects and drums.
    const len = ctx.sampleRate * 2, buf = (this.noise = ctx.createBuffer(1, len, ctx.sampleRate)), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.makeLayers();
  }

  bus(level: number) { const g = this.ctx!.createGain(); g.gain.value = level; g.connect(this.master!); const s = this.ctx!.createGain(); s.gain.value = 0.22; g.connect(s); s.connect(this.verb!); return g; }
  toggleMute() { this.muted = !this.muted; if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.1); return this.muted; }
  toggleMusic() { this.musicOn = !this.musicOn; if (this.music && this.ctx) this.music.gain.setTargetAtTime(this.musicOn ? 0.9 : 0, this.ctx.currentTime, 0.3); return this.musicOn; }

  /** Continuous beds of sound: noise shaped into wind, rain, waves and cicadas, faded in and out as needed. */
  makeLayers() {
    const ctx = this.ctx!;
    const bed = (name: string, type: BiquadFilterType, freq: number, q: number, lfoRate = 0, lfoDepth = 0, amRate = 0) => {
      const src = ctx.createBufferSource(); src.buffer = this.noise!; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f);
      let out: AudioNode = f;
      if (amRate) { // insects: a fast flutter of amplitude
        const am = ctx.createGain(); am.gain.value = 0.5; const o = ctx.createOscillator(); o.frequency.value = amRate; const og = ctx.createGain(); og.gain.value = 0.5; o.connect(og); og.connect(am.gain); o.start(); f.connect(am); out = am;
      }
      if (lfoRate) { const o = ctx.createOscillator(); o.frequency.value = lfoRate; const og = ctx.createGain(); og.gain.value = lfoDepth; o.connect(og); og.connect(f.frequency); o.start(); }
      out.connect(g); g.connect(this.amb!); src.start();
      this.layers[name] = g;
    };
    bed("wind", "bandpass", 420, 0.7, 0.07, 260);
    bed("rain", "highpass", 1800, 0.4);
    bed("waves", "lowpass", 520, 0.6, 0.09, 380);
    bed("cicada", "bandpass", 5600, 9, 0.17, 400, 31);
    bed("cave", "lowpass", 160, 0.8, 0.05, 60);
  }

  fade(name: string, level: number) { const g = this.layers[name]; if (g && this.ctx) g.gain.setTargetAtTime(level, this.ctx.currentTime, 1.2); }

  // ------------------------------------------------------------------ voices
  /** A plucked lyre string: a quick bright attack and a long fall, a touch of the octave. */
  pluck(freq: number, when: number, vol = 0.18, dest?: AudioNode, len = 2.2) {
    const ctx = this.ctx!, g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.setValueAtTime(3200, when); lp.frequency.exponentialRampToValueAtTime(700, when + len * 0.6);
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    for (const [mult, type, lvl] of [[1, "triangle", 1], [2, "sine", 0.35], [3, "sine", 0.12]] as [number, OscillatorType, number][]) {
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = freq * mult * (1 + rand(-0.002, 0.002)); og.gain.value = lvl;
      o.connect(og); og.connect(lp); o.start(when); o.stop(when + len + 0.05);
    }
    lp.connect(g); g.connect(dest ?? this.music!);
  }
  /** The aulos: a reedy double pipe, with breath and a slow vibrato. */
  aulos(freq: number, when: number, dur: number, vol = 0.07) {
    const ctx = this.ctx!, o = ctx.createOscillator(), o2 = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sawtooth"; o2.type = "square"; o.frequency.value = freq; o2.frequency.value = freq * 1.003;
    const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.2; vg.gain.value = freq * 0.012; vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    bp.type = "bandpass"; bp.frequency.value = freq * 2.4; bp.Q.value = 1.4;
    g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(vol, when + 0.08); g.gain.setValueAtTime(vol, when + dur - 0.12); g.gain.linearRampToValueAtTime(0.0001, when + dur);
    o.connect(bp); o2.connect(bp); bp.connect(g); g.connect(this.danger!);
    for (const x of [o, o2, vib]) { x.start(when); x.stop(when + dur + 0.05); }
  }
  /**
   * One note of music the player makes, or hears: a hummed voice (two vowel resonances and a little vibrato),
   * the lyre, the reed pipes, the aulos; a bird's whistle or a nymph's high singing.
   */
  note(freq: number, sound: "voice" | "lyre" | "syrinx" | "aulos" | "bird" | "nymph", dur = 0.62, vol = 1) {
    this.start(); const ctx = this.ctx; if (!ctx || !this.fx) return;
    const t = ctx.currentTime + 0.01, dest = this.fx;
    if (sound === "lyre") { this.pluck(freq, t, 0.22 * vol, dest, 2.4); return; }
    const g = ctx.createGain(); g.connect(dest);
    const env = (a: number, peak: number, rel: number) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + Math.max(a, dur - rel)); g.gain.linearRampToValueAtTime(0.0001, t + dur); };
    const osc = (type: OscillatorType, f: number, to: AudioNode, lvl = 1) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = f; og.gain.value = lvl; o.connect(og); og.connect(to); o.start(t); o.stop(t + dur + 0.05); return o; };
    const vibrato = (os: OscillatorNode[], rate: number, depth: number) => { const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = rate; vg.gain.value = depth; v.connect(vg); for (const o of os) vg.connect(o.frequency); v.start(t + 0.12); v.stop(t + dur + 0.05); };
    if (sound === "voice" || sound === "nymph") {
      // A closed-mouth hum: a soft buzz shaped by two formants ("mm", "oo"); a nymph sings higher, brighter, airier.
      const nymph = sound === "nymph", mix = ctx.createGain(); mix.gain.value = 1;
      const f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter();
      f1.type = "bandpass"; f1.frequency.value = nymph ? 650 : 420; f1.Q.value = 3; f2.type = "bandpass"; f2.frequency.value = nymph ? 1500 : 950; f2.Q.value = 5;
      lp.type = "lowpass"; lp.frequency.value = nymph ? 3500 : 1600;
      mix.connect(f1); mix.connect(f2); const fo = ctx.createGain(); fo.gain.value = 2.2; f1.connect(fo); f2.connect(fo); fo.connect(lp); lp.connect(g);
      const direct = ctx.createGain(); direct.gain.value = 0.35; mix.connect(direct); direct.connect(lp);
      const os = [osc("triangle", freq, mix), osc("sawtooth", freq, mix, 0.18), osc("sine", freq * 2, mix, 0.12)];
      vibrato(os, nymph ? 6 : 5, freq * (nymph ? 0.012 : 0.008));
      env(nymph ? 0.12 : 0.07, (nymph ? 0.11 : 0.13) * vol, 0.22);
      if (nymph) this.noiseHit(t, freq * 3, dur, 0.012 * vol, dest, "bandpass", 2);
      return;
    }
    if (sound === "syrinx") {
      // Reed pipes: a nearly pure tone with breath around it.
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = freq * 3; lp.connect(g);
      const os = [osc("sine", freq, lp), osc("triangle", freq * 2, lp, 0.08)];
      vibrato(os, 4.5, freq * 0.004);
      env(0.05, 0.16 * vol, 0.18);
      this.noiseHit(t, freq * 2, dur * 0.9, 0.035 * vol, dest, "bandpass", 3);
      return;
    }
    if (sound === "aulos") {
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq * 2.4; bp.Q.value = 1.4; bp.connect(g);
      const os = [osc("sawtooth", freq, bp), osc("square", freq * 1.003, bp, 0.8)];
      vibrato(os, 5.2, freq * 0.01);
      env(0.06, 0.1 * vol, 0.12);
      return;
    }
    // A bird: a quick whistled glide around the note, an octave or two up.
    const o = osc("sine", freq * 2, g); o.frequency.setValueAtTime(freq * 1.9, t); o.frequency.exponentialRampToValueAtTime(freq * 2.15, t + dur * 0.4); o.frequency.exponentialRampToValueAtTime(freq * 2, t + dur);
    env(0.02, 0.08 * vol, dur * 0.5);
  }
  /** Quiet the background music while you sing or play. */
  duck(on: boolean) { if (this.music && this.ctx) this.music.gain.setTargetAtTime(this.musicOn ? (on ? 0.25 : 0.9) : 0, this.ctx.currentTime, 0.2); }
  /** A frame drum (tympanon): a low thump that drops in pitch, with a slap of skin. */
  drum(when: number, vol = 0.32, low = true) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(low ? 110 : 190, when); o.frequency.exponentialRampToValueAtTime(low ? 48 : 90, when + 0.18);
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.35);
    o.connect(g); g.connect(this.danger!); o.start(when); o.stop(when + 0.4);
    this.noiseHit(when, low ? 900 : 2200, 0.06, vol * 0.5, this.danger!);
  }
  noiseHit(when: number, freq: number, dur: number, vol: number, dest: AudioNode, type: BiquadFilterType = "bandpass", q = 1) {
    const ctx = this.ctx!, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = this.noise!; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(when, Math.random() * 1.5); s.stop(when + dur + 0.02);
  }
  chirp(when: number, f0: number, f1: number, dur: number, vol: number, type: OscillatorType = "sine") {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, when); o.frequency.exponentialRampToValueAtTime(f1, when + dur);
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + dur * 0.2); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(this.amb!); o.start(when); o.stop(when + dur + 0.02);
  }

  // ------------------------------------------------------------------ the frame loop
  update(dt: number, st: SoundState) {
    if (!this.ctx || this.ctx.state !== "running") return;
    this.st = st;
    const now = this.ctx.currentTime, out = ["Farm", "Wild", "Village", "Gym"].includes(st.scene), rain = st.weather === "rain";
    const windy = st.weather === "wind" || [7, 10, 12, 9].includes(st.terrain);
    // Beds.
    this.fade("wind", out ? (windy ? 0.22 : 0.07) : st.scene === "House" ? 0.02 : 0);
    this.fade("rain", out && rain ? 0.07 : st.scene === "House" && rain ? 0.025 : 0);
    this.fade("waves", out && st.terrain === 7 ? 0.2 : out && st.terrain === 5 ? 0.04 : 0);
    this.fade("cicada", out && st.day && !rain && st.season === "Summer" && [1, 2, 3, 4, 8, 10, 11, 12].includes(st.terrain) ? 0.05 : 0);
    this.fade("cave", st.scene === "Cave" ? 0.25 : 0);

    const tick = (k: string, every: [number, number], go: () => void) => { if ((this.timers[k] -= dt) <= 0) { this.timers[k] = rand(...every); go(); } };
    // Birds by day, out of the rain.
    if (out && st.day && !rain) tick("bird", st.season === "Winter" ? [5, 12] : [1.5, 5], () => {
      const base = rand(2200, 3600), n = 1 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) this.chirp(now + i * rand(0.09, 0.16), base, base * rand(1.1, 1.5), rand(0.05, 0.1), 0.035);
    });
    // Crickets at night in the warm months.
    if (out && !st.day && st.season !== "Winter") tick("cricket", [0.6, 1.4], () => {
      for (let i = 0; i < 3; i++) this.chirp(now + i * 0.07, 4600, 4700, 0.04, 0.02, "sine");
    });
    // Frogs in the marsh from dusk.
    if (out && st.terrain === 5 && (st.dusk || !st.day)) tick("frog", [0.8, 2.5], () => {
      const f = rand(140, 220); for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) this.chirp(now + i * 0.11, f, f * 0.8, 0.08, 0.05, "square");
    });
    // Drips in the caves, ringing in the dark.
    if (st.scene === "Cave") tick("drip", [0.8, 3], () => { const f = rand(900, 1600); this.chirp(now, f * 1.6, f, 0.12, 0.06); });
    // The smithy's hammer, and the hearth fire.
    if (st.scene === "Village" && st.day) tick("clink", [3, 8], () => { for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) { const t = now + i * 0.42; this.chirp(t, 1850, 1800, 0.25, 0.03, "triangle"); this.chirp(t, 2790, 2700, 0.18, 0.015); } });
    if (st.scene === "House") tick("crackle", [0.05, 0.35], () => this.noiseHit(now, rand(1500, 4000), rand(0.01, 0.04), rand(0.02, 0.06), this.amb!, "highpass"));

    // Danger music swells in when something comes at you, and ebbs a few seconds after.
    if (st.danger) this.lastDanger = now;
    const want = st.danger || now - this.lastDanger < 4 ? 1 : 0;
    this.dangerLevel += (want - this.dangerLevel) * Math.min(1, dt * (want ? 1.2 : 0.35));
    this.danger!.gain.setTargetAtTime(this.dangerLevel, now, 0.1);
    if (this.dangerLevel > 0.02) this.scheduleDanger(now);
    else { this.nextBeat = 0; this.beat = 0; }

    // The calm lyre: a short phrase, then a long quiet; slower and lower by night; silent in danger.
    if (st.festival && st.scene === "Village" && st.day && this.dangerLevel < 0.3) { this.festivalMusic(now); return; }
    if (this.dangerLevel < 0.3) tick("phrase", st.day ? [8, 18] : [12, 24], () => this.calmPhrase(now + 0.05, st));
  }

  /** A few notes wandering stepwise in the old mode, now and then a held drone note under them. */
  /** Festival music in the square: a frame drum, a lyre dancing in the Phrygian, now and then the aulos. */
  festBeat = 0; nextFest = 0; festNote = 4;
  festivalMusic(now: number) {
    const ctx = this.ctx!, beat = 0.34, SCALE = [57, 59, 60, 62, 64, 66, 67, 69, 71, 72]; // A Phrygian (the ancients' name for this octave)
    if (this.nextFest < now) this.nextFest = now + 0.05;
    while (this.nextFest < now + 0.4) {
      const t = this.nextFest, b = this.festBeat++ % 8;
      if (b === 0 || b === 3 || b === 6) { // the tympanon, to the music bus
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(b === 0 ? 120 : 180, t); o.frequency.exponentialRampToValueAtTime(b === 0 ? 50 : 85, t + 0.16);
        g.gain.setValueAtTime(b === 0 ? 0.3 : 0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        o.connect(g); g.connect(this.music!); o.start(t); o.stop(t + 0.32);
        this.noiseHit(t, 1800, 0.05, 0.05, this.music!);
      }
      if (Math.random() < 0.8) { this.festNote = Math.max(0, Math.min(SCALE.length - 1, this.festNote + pick([-2, -1, 1, 1, 2, 0]))); this.pluck(midi(SCALE[this.festNote]), t + rand(-0.01, 0.01), 0.15, undefined, 1.2); }
      if (b === 0 && Math.random() < 0.5) this.pluck(midi(45), t, 0.12, undefined, 2);
      this.nextFest += beat;
    }
  }
  calmPhrase(t: number, st: SoundState) {
    const scale = st.day ? CALM : CALM.slice(0, 8);
    let i = Math.floor(rand(2, scale.length - 3));
    const n = 3 + Math.floor(Math.random() * 4), gap = st.day ? rand(0.42, 0.62) : rand(0.6, 0.9);
    const vol = st.scene === "House" || st.scene === "Cave" ? 0.16 : 0.2;
    if (Math.random() < 0.4) this.pluck(midi(40), t, vol * 0.8, undefined, 3.5); // low E under it
    for (let k = 0; k < n; k++) {
      this.pluck(midi(scale[i]), t + k * gap + rand(-0.03, 0.03), vol);
      if (Math.random() < 0.2 && k < n - 1) this.pluck(midi(scale[Math.max(0, i - 2)]), t + k * gap + gap / 2, vol * 0.6); // a grace note
      i = Math.max(0, Math.min(scale.length - 1, i + pick([-2, -1, -1, 1, 1, 2])));
    }
    // End on the home note, or the fifth above it.
    this.pluck(midi(pick([52, 59, 64])), t + n * gap + 0.2, vol * 0.9, undefined, 3);
  }

  /** Adventure: 112 beats a minute. Drum on the beat, a lyre ostinato in eighths, the aulos holding long tense notes. */
  scheduleDanger(now: number) {
    const spb = 60 / 112;
    if (this.nextBeat < now) this.nextBeat = now + 0.05;
    while (this.nextBeat < now + 0.25) {
      const t = this.nextBeat, b = this.beat % 16; // two bars of eight eighths
      if (b % 4 === 0) this.drum(t, 0.42, true);
      if (b === 3 || b === 6 || b === 11 || b === 14) this.drum(t, 0.22, false);
      const ost = [0, 1, 0, 3, 0, 1, 4, 3]; // E F E Ab E F B Ab, round and round
      this.pluck(midi(TENSE[ost[b % 8]] + 12), t, 0.09, this.danger!, 0.5);
      if (b === 0) { const phrase = pick([[64, 65, 64, 62], [67, 65, 64, 65], [64, 68, 67, 65], [71, 69, 68, 64]]); phrase.forEach((m, k) => this.aulos(midi(m), t + k * spb * 2, spb * 2 - 0.04)); }
      this.nextBeat += spb / 2; this.beat++;
    }
  }

  // ------------------------------------------------------------------ small sounds
  sfx(name: "pickup" | "hit" | "loose" | "hurt" | "omen" | "find" | "sign" | "chop" | "talk") {
    if (!this.ctx || this.ctx.state !== "running") return;
    const t = this.ctx.currentTime + 0.01, fx = this.fx!;
    switch (name) {
      case "pickup": this.pluck(midi(76), t, 0.08, fx, 0.5); break;
      case "find": [64, 68, 71, 76].forEach((m, i) => this.pluck(midi(m), t + i * 0.09, 0.1, fx, 1.4)); break;
      case "sign": [52, 59, 64].forEach((m, i) => this.pluck(midi(m), t + i * 0.25, 0.1, fx, 2.5)); break;
      case "omen": [52, 55, 59, 62].forEach((m) => this.pluck(midi(m), t, 0.07, fx, 3)); break;
      case "talk": this.pluck(midi(pick([67, 69, 71])), t, 0.04, fx, 0.3); break;
      case "hit": this.noiseHit(t, 700, 0.09, 0.18, fx, "lowpass"); break;
      case "chop": this.noiseHit(t, 400, 0.12, 0.25, fx, "lowpass"); this.chirp(t, 220, 140, 0.1, 0.05, "triangle"); break;
      case "loose": this.noiseHit(t, 2500, 0.18, 0.08, fx, "bandpass", 2); break;
      case "hurt": { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.2); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); o.connect(g); g.connect(fx); o.start(t); o.stop(t + 0.3); this.noiseHit(t, 300, 0.1, 0.2, fx, "lowpass"); break; }
    }
  }
}

/** One soundscape for the whole game. */
export const SOUND = new SoundScape();
