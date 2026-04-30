export default class SoundManager {
  constructor() {
    this.ctx = null; this.masterGain = null;
    this.enabled = true; this.currentTheme = 'neon';
    this._ambientOsc = null; this._ambientLfo = null; this._ambientGain = null;
    this._init();
  }
  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.38;
      this.masterGain.connect(this.ctx.destination);
    } catch(e) { this.enabled = false; }
  }
  _resume() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }
  toggle() {
    this.enabled = !this.enabled;
    if (this.masterGain) this.masterGain.gain.value = this.enabled ? 0.38 : 0;
    if (!this.enabled) this.stopAmbient();
    return this.enabled;
  }
  setTheme(t) { this.currentTheme = t; }

  // ── Core synth ─────────────────────────────────────────────────────
  _tone(freq, type, dur, vol, start, endFreq) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = start ?? this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.connect(g); g.connect(this.masterGain);
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t+dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+dur);
    o.start(t); o.stop(t+dur+0.02);
  }
  _noise(dur, vol, start, cutoff) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = start ?? this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate*dur, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
    if (cutoff) {
      const f = this.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=cutoff;
      src.connect(f); f.connect(g);
    } else { src.connect(g); }
    g.connect(this.masterGain);
    src.buffer = buf;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+dur);
    src.start(t);
  }
  _now() { return this.ctx?.currentTime ?? 0; }

  // ── JUMP — very distinct per theme ─────────────────────────────────
  jump() {
    const t = this._now();
    const th = {
      // Neon: electric zap upward
      neon:   ()=>{ this._tone(80,'square',0.05,0.3,t,600); this._tone(300,'square',0.1,0.25,t+0.03,800); this._noise(0.04,0.1,t+0.02); },
      // Ocean: deep watery bubble blop
      ocean:  ()=>{ this._tone(120,'sine',0.18,0.28,t,60); this._tone(200,'sine',0.08,0.12,t+0.05,100); this._noise(0.08,0.04,t,200); },
      // Lava: heavy volcanic thud whoosh
      lava:   ()=>{ this._noise(0.06,0.3,t,2000); this._tone(60,'sawtooth',0.12,0.35,t,180); this._tone(220,'sawtooth',0.06,0.15,t+0.04,440); },
      // Space: clean sci-fi beep glide
      space:  ()=>{ this._tone(880,'sine',0.12,0.18,t,1760); this._tone(440,'sine',0.06,0.1,t+0.04,880); },
      // Jungle: boing + rustling leaves
      jungle: ()=>{ this._tone(160,'triangle',0.18,0.3,t,480); this._noise(0.05,0.08,t,800); this._tone(240,'triangle',0.06,0.12,t+0.06,320); },
    };
    (th[this.currentTheme]||th.neon)();
  }

  doubleJump() {
    const t = this._now();
    const th = {
      neon:   ()=>{ [0,0.05].forEach((o,i)=>this._tone(600+i*300,'square',0.08,0.22,t+o,1200+i*300)); this._noise(0.04,0.12,t+0.05); },
      ocean:  ()=>{ this._tone(80,'sine',0.22,0.3,t,40); this._noise(0.12,0.06,t,150); this._tone(160,'sine',0.1,0.15,t+0.08,80); },
      lava:   ()=>{ this._noise(0.1,0.4,t,3000); this._tone(55,'sawtooth',0.14,0.4,t,30); this._tone(110,'sawtooth',0.08,0.2,t+0.06,55); },
      space:  ()=>{ [0,0.07,0.14].forEach((o,i)=>this._tone(1100+i*330,'sine',0.08,0.18,t+o)); },
      jungle: ()=>{ this._tone(320,'triangle',0.15,0.28,t,720); this._tone(480,'triangle',0.1,0.18,t+0.07,960); this._noise(0.06,0.1,t+0.04,600); },
    };
    (th[this.currentTheme]||th.neon)();
  }

  // ── COIN — very distinct per theme ─────────────────────────────────
  coin() {
    const t = this._now();
    const th = {
      // Neon: classic arcade high beep
      neon:   ()=>{ this._tone(1046,'square',0.06,0.22,t); this._tone(1318,'square',0.08,0.18,t+0.07); },
      // Ocean: soft chime blub
      ocean:  ()=>{ this._tone(523,'sine',0.14,0.2,t,1046); this._noise(0.04,0.03,t,300); },
      // Lava: clang of metal on rock
      lava:   ()=>{ this._tone(300,'sawtooth',0.04,0.25,t,150); this._noise(0.06,0.15,t,2000); },
      // Space: digital ping series
      space:  ()=>{ [0,0.05,0.1].forEach((o,i)=>this._tone(1320+i*440,'sine',0.05,0.18,t+o)); },
      // Jungle: hollow wood knock + high bird
      jungle: ()=>{ this._noise(0.04,0.2,t,400); this._tone(880,'triangle',0.08,0.18,t+0.02); this._tone(1108,'triangle',0.06,0.12,t+0.07); },
    };
    (th[this.currentTheme]||th.neon)();
  }

  // ── HIT ────────────────────────────────────────────────────────────
  hit() {
    const t = this._now();
    const th = {
      neon:   ()=>{ this._noise(0.12,0.4,t); this._tone(100,'square',0.15,0.35,t,50); },
      ocean:  ()=>{ this._noise(0.18,0.28,t,500); this._tone(60,'sine',0.2,0.3,t,30); },
      lava:   ()=>{ this._noise(0.14,0.55,t,4000); this._tone(80,'sawtooth',0.18,0.45,t,40); },
      space:  ()=>{ this._tone(180,'sawtooth',0.08,0.3,t,45); this._noise(0.1,0.18,t); },
      jungle: ()=>{ this._noise(0.1,0.38,t,900); this._tone(120,'triangle',0.12,0.28,t,60); },
    };
    (th[this.currentTheme]||th.neon)();
  }

  // ── STOMP ──────────────────────────────────────────────────────────
  stomp() {
    const t = this._now();
    const th = {
      neon:   ()=>{ this._tone(160,'square',0.05,0.32,t,80); this._noise(0.05,0.2,t); },
      ocean:  ()=>{ this._noise(0.12,0.22,t,350); this._tone(100,'sine',0.1,0.22,t,50); },
      lava:   ()=>{ this._noise(0.08,0.45,t,1800); this._tone(70,'sawtooth',0.08,0.35,t,35); },
      space:  ()=>{ this._tone(260,'sawtooth',0.05,0.28,t,65); this._noise(0.06,0.14,t); },
      jungle: ()=>{ this._noise(0.07,0.32,t,600); this._tone(90,'triangle',0.08,0.22,t,45); },
    };
    (th[this.currentTheme]||th.neon)();
  }

  // ── DEATH ──────────────────────────────────────────────────────────
  death() {
    const t = this._now();
    const th = {
      // Neon: electric crash, descending buzz
      neon:   ()=>{ this._tone(440,'sawtooth',0.08,0.4,t,55); this._tone(220,'sawtooth',0.18,0.35,t+0.1,28); this._noise(0.25,0.35,t+0.08); },
      // Ocean: deep reverberant thud, descending moan
      ocean:  ()=>{ this._tone(200,'sine',0.25,0.35,t,25); this._noise(0.3,0.22,t,400); this._tone(100,'sine',0.2,0.25,t+0.15,12); },
      // Lava: explosion rumble
      lava:   ()=>{ this._noise(0.2,0.6,t,5000); this._tone(120,'sawtooth',0.12,0.5,t,15); this._tone(60,'sawtooth',0.25,0.4,t+0.12,8); },
      // Space: alien screech fade
      space:  ()=>{ this._tone(880,'sine',0.1,0.35,t,22); this._noise(0.18,0.15,t); this._tone(440,'sine',0.2,0.3,t+0.12,11); },
      // Jungle: crashing timber + shriek
      jungle: ()=>{ this._noise(0.15,0.45,t,1200); this._tone(150,'triangle',0.2,0.35,t,19); this._tone(300,'triangle',0.1,0.2,t+0.1,150); },
    };
    (th[this.currentTheme]||th.neon)();
  }

  // ── LAND ──────────────────────────────────────────────────────────
  land() {
    const t = this._now();
    const th = {
      neon:   ()=>{ this._noise(0.04,0.14,t); },
      ocean:  ()=>{ this._noise(0.07,0.09,t,250); this._tone(55,'sine',0.06,0.1,t,28); },
      lava:   ()=>{ this._noise(0.07,0.22,t,1600); this._tone(70,'sawtooth',0.04,0.18,t,35); },
      space:  ()=>{ this._tone(180,'sine',0.04,0.08,t,90); },
      jungle: ()=>{ this._noise(0.05,0.14,t,700); },
    };
    (th[this.currentTheme]||th.neon)();
  }

  // ── POWERUP / AIR ITEMS ────────────────────────────────────────────
  powerup() {
    const t = this._now();
    [0,0.07,0.14,0.21].forEach((o,i)=>this._tone(440*Math.pow(1.26,i),'sine',0.1,0.2,t+o));
  }
  boostPad() {
    const t = this._now();
    this._tone(220,'square',0.04,0.3,t,880); this._tone(440,'square',0.04,0.22,t+0.03,1760); this._noise(0.06,0.15,t);
  }
  warpRing() {
    const t = this._now();
    [0,0.04,0.08,0.12,0.16].forEach((o,i)=>this._tone(330*Math.pow(1.3,i),'sine',0.08,0.2,t+o));
  }
  star() {
    const t = this._now();
    [0,0.05,0.1,0.15,0.2].forEach((o,i)=>this._tone(660+i*220,'sine',0.06,0.18,t+o));
  }
  gem() {
    const t = this._now();
    [0,0.04,0.08,0.12,0.16,0.2].forEach((o,i)=>this._tone(880+i*220,'triangle',0.07,0.2,t+o));
    this._tone(2640,'sine',0.15,0.14,t+0.1);
  }
  mystery() {
    const t = this._now();
    [330,440,550,660,440,770].forEach((f,i)=>this._tone(f,'square',0.05,0.15,t+i*0.06));
  }

  // ── UI ─────────────────────────────────────────────────────────────
  select() { const t=this._now(); this._tone(440,'sine',0.06,0.2,t); this._tone(660,'sine',0.08,0.18,t+0.06); }
  hover()  { this._tone(330,'sine',0.03,0.1); }
  submit() { const t=this._now(); [0,0.08,0.16,0.24,0.32].forEach((o,i)=>this._tone(330*Math.pow(1.2,i),'sine',0.1,0.15,t+o)); }

  // ── Ambient loop — very distinct per theme ─────────────────────────
  startAmbient(themeId) {
    if (!this.enabled || !this.ctx) return;
    this.stopAmbient();
    this.currentTheme = themeId;
    this._resume();

    const g = this.ctx.createGain();
    g.gain.value = 0.055;
    g.connect(this.masterGain);
    this._ambientGain = g;

    const cfgs = {
      // Neon: gritty industrial drone
      neon:   { base:55, type:'sawtooth', filterFreq:180, filterType:'lowpass', lfoRate:0.4, lfoDepth:0.6 },
      // Ocean: slow deep sine, very low, calming
      ocean:  { base:36, type:'sine',     filterFreq:120, filterType:'lowpass', lfoRate:0.1, lfoDepth:0.5 },
      // Lava:  heavy sub rumble
      lava:   { base:28, type:'sawtooth', filterFreq:250, filterType:'lowpass', lfoRate:0.07,lfoDepth:0.8 },
      // Space: pure high sine, thin atmosphere
      space:  { base:55, type:'sine',     filterFreq:800, filterType:'bandpass',lfoRate:0.05,lfoDepth:0.4 },
      // Jungle:triangle mid, rhythmic
      jungle: { base:65, type:'triangle', filterFreq:500, filterType:'lowpass', lfoRate:0.25,lfoDepth:0.6 },
    };
    const cfg = cfgs[themeId] || cfgs.neon;

    const osc = this.ctx.createOscillator();
    osc.type = cfg.type;
    osc.frequency.value = cfg.base;

    const filter = this.ctx.createBiquadFilter();
    filter.type = cfg.filterType;
    filter.frequency.value = cfg.filterFreq;
    if (cfg.filterType === 'bandpass') filter.Q.value = 2;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = cfg.lfoRate;
    const lfoG = this.ctx.createGain();
    lfoG.gain.value = cfg.lfoDepth;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);

    osc.connect(filter);
    filter.connect(g);
    osc.start(); lfo.start();
    this._ambientOsc = osc; this._ambientLfo = lfo;

    // Add 2nd harmonic for richness
    if (themeId !== 'space') {
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = cfg.base * 2;
      const g2 = this.ctx.createGain(); g2.gain.value = 0.02;
      osc2.connect(g2); g2.connect(this.masterGain);
      osc2.start();
      this._ambientOsc2 = osc2;
    }
  }

  stopAmbient() {
    ['_ambientOsc','_ambientLfo','_ambientOsc2'].forEach(k => {
      try { this[k]?.stop(); } catch(e){} this[k] = null;
    });
    this._ambientGain = null;
  }

  playThemeStinger(themeId) {
    const t = this._now();
    this.currentTheme = themeId;
    const seqs = {
      neon:   [[220,'square'],[330,'square'],[440,'square'],[660,'square']],
      ocean:  [[150,'sine'],[200,'sine'],[267,'sine'],[150,'sine']],
      lava:   [[100,'sawtooth'],[150,'sawtooth'],[200,'sawtooth'],[100,'sawtooth']],
      space:  [[440,'sine'],[550,'sine'],[660,'sine'],[880,'sine']],
      jungle: [[196,'triangle'],[247,'triangle'],[330,'triangle'],[247,'triangle']],
    };
    (seqs[themeId]||seqs.neon).forEach(([f,type],i)=>this._tone(f,type,0.15,0.22,t+i*0.12));
  }
}

export const sound = new SoundManager();
