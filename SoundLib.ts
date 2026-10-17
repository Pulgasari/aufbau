// =========================
// 🎧 Mini Audio Engine (TS)
// =========================

export type ScheduledSource = {
    src: AudioScheduledSourceNode;
    offset: number; // seconds from start
    duration: number;
    schedule?: (startTime: number) => void;
};

export type SoundNode = {
    node: AudioNode;
    duration: number;
    sources: ScheduledSource[];
};

export type Sound = (ctx: AudioContext) => SoundNode;

// -------------------------
// 🔊 Audio Context
// -------------------------
let audioCtx: AudioContext | null = null;
let hasPrimedAudioGraph = false;

const PLAY_SCHEDULE_LOOKAHEAD_SEC = 0.02;
const FIRST_PLAY_EXTRA_LOOKAHEAD_SEC = 0.06;

function getCtx(): AudioContext {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
        // Fire-and-forget resume; play() also schedules with lookahead to avoid clipped attacks.
        void audioCtx.resume();
    }
    return audioCtx;
}

/**
 * Unlock audio from a user interaction (e.g. a start-button click).
 * Safe to call repeatedly; play() also initializes audio automatically.
 */
export function initAudio(): AudioContext {
    const ctx = getCtx();
    getMasterChain(ctx);
    if (!hasPrimedAudioGraph) {
        primeAudioGraph(ctx);
        hasPrimedAudioGraph = true;
    }
    return ctx;
}

function primeAudioGraph(ctx: AudioContext) {
    const master = getMasterChain(ctx);
    const silence = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
    silence.buffer = buf;

    const silentGain = ctx.createGain();
    silentGain.gain.value = 0;

    silence.connect(silentGain);
    silentGain.connect(master);

    const t = ctx.currentTime + 0.001;
    silence.start(t);
    silence.stop(t + 0.01);
}

// -------------------------
// 🎚 Master Bus (Limiter)
// -------------------------
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let reverbConvolver: ConvolverNode | null = null;
let reverbMix: GainNode | null = null;
let reverbSend: GainNode | null = null;

function getMasterChain(ctx: AudioContext) {
    if (!masterGain) {
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.9;
    }

    if (!compressor) {
        compressor = ctx.createDynamicsCompressor();

        compressor.threshold.value = -10;
        compressor.knee.value = 10;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        getMasterReverb(ctx);

        masterGain.connect(reverbSend!);
        masterGain.connect(compressor);

        reverbMix!.connect(compressor);
        compressor.connect(ctx.destination);
    }

    return masterGain;
}

function getMasterReverb(ctx: AudioContext) {
    if (!reverbConvolver) {
        reverbConvolver = ctx.createConvolver();
        reverbConvolver.buffer = createRoomImpulse(ctx, 0.7, 0.7);
    }

    if (!reverbSend) {
        reverbSend = ctx.createGain();
        reverbSend.gain.value = 0.20; // audible small room
        reverbSend.connect(reverbConvolver);
    }

    if (!reverbMix) {
        reverbMix = ctx.createGain();
        reverbMix.gain.value = 0.5;
        reverbConvolver.connect(reverbMix);
    }

    return reverbConvolver;
}

export function setReverb({
    send,
    mix,
    seconds,
    decay
}: {
    send?: number;
    mix?: number;
    seconds?: number;
    decay?: number;
} = {}) {
    const ctx = getCtx();
    getMasterChain(ctx);

    if (reverbSend && typeof send === "number") reverbSend.gain.value = send;
    if (reverbMix && typeof mix === "number") reverbMix.gain.value = mix;

    if (reverbConvolver && (typeof seconds === "number" || typeof decay === "number")) {
        const s = typeof seconds === "number" ? seconds : 1.2;
        const d = typeof decay === "number" ? decay : 0.7;
        reverbConvolver.buffer = createRoomImpulse(ctx, s, d);
    }
}

// -------------------------
// 🎲 Variation helper
// -------------------------
export function vary(value: number, amount: number = 0.1): number {
    return value * (1 + (Math.random() * 2 - 1) * amount);
}

export function jitter(amount: number): number {
    return (Math.random() * 2 - 1) * amount;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function createRoomImpulse(
    ctx: AudioContext,
    seconds: number = 1.0,
    decay: number = 0.6
): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = ctx.createBuffer(2, length, rate);

    for (let ch = 0; ch < impulse.numberOfChannels; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
            const t = i / rate;
            const env = Math.pow(1 - t / seconds, decay * 2.2);
            data[i] = (Math.random() * 2 - 1) * env;
        }
    }

    return impulse;
}

// -------------------------
// 🔹 Primitives
// -------------------------
export type NoiseType = "white" | "pink" | "brown";

export function Noise(duration: number = 0.05, type: NoiseType = "white"): Sound {
    return (ctx) => {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === "white") {
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        } else if (type === "pink") {
            // Voss-McCartney inspired filter
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < data.length; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                b6 = white * 0.115926;
                data[i] = pink * 0.11;
            }
        } else {
            // brown noise (integrated white)
            let last = 0;
            for (let i = 0; i < data.length; i++) {
                const white = Math.random() * 2 - 1;
                last = (last + white * 0.02) / 1.02;
                data[i] = last * 3.5;
            }
        }

        const src = ctx.createBufferSource();
        src.buffer = buffer;

        return {
            node: src,
            duration,
            sources: [{ src, offset: 0, duration }]
        };
    };
}

export function Osc(
    type: OscillatorType = "sine",
    freq: number = 440,
    duration: number = 0.1
): Sound {
    return (ctx) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = freq;

        return {
            node: o,
            duration,
            sources: [{ src: o, offset: 0, duration }]
        };
    };
}

// -------------------------
// 🎛 Modifiers
// -------------------------
export function GainEnv({
    attack = 0.005,
    decay = 0.1,
    peak = 1
}: {
    attack?: number;
    decay?: number;
    peak?: number;
}) {
    return (ctx: AudioContext, input: SoundNode): SoundNode => {
        const g = ctx.createGain();
        const schedule = (t: number) => {
            g.gain.cancelScheduledValues(t);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(peak, t + attack);
            g.gain.exponentialRampToValueAtTime(0.01, t + decay);
        };

        input.node.connect(g);

        return {
            node: g,
            duration: decay,
            sources: input.sources.map((s) => ({
                ...s,
                schedule: (t: number) => {
                    s.schedule?.(t);
                    schedule(t);
                }
            }))
        };
    };
}

export function Filter(
    type: BiquadFilterType = "lowpass",
    freq: number = 1000,
    Q: number = 1
) {
    return (ctx: AudioContext, input: SoundNode): SoundNode => {
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;
        f.Q.value = Q;

        input.node.connect(f);

        return {
            node: f,
            duration: input.duration,
            sources: input.sources
        };
    };
}

export function Gain(amount: number = 1) {
    return (ctx: AudioContext, input: SoundNode): SoundNode => {
        const g = ctx.createGain();
        g.gain.value = amount;

        input.node.connect(g);

        return {
            node: g,
            duration: input.duration,
            sources: input.sources
        };
    };
}

export function Pan(amount: number = 0) {
    return (ctx: AudioContext, input: SoundNode): SoundNode => {
        if (!("createStereoPanner" in ctx)) {
            return input;
        }

        const p = ctx.createStereoPanner();
        p.pan.value = clamp(amount, -1, 1);

        input.node.connect(p);

        return {
            node: p,
            duration: input.duration,
            sources: input.sources
        };
    };
}

export function PitchEnv({
    ratioStart = 1,
    ratioEnd = 0.5,
    time = 0.04
}: {
    ratioStart?: number;
    ratioEnd?: number;
    time?: number;
}) {
    return (_ctx: AudioContext, input: SoundNode): SoundNode => {
        const sources = input.sources.map((s) => {
            const osc = s.src as OscillatorNode;
            if (!("frequency" in osc)) return s;

            return {
                ...s,
                schedule: (t: number) => {
                    s.schedule?.(t);
                    const f0 = osc.frequency.value || 440;
                    osc.frequency.setValueAtTime(Math.max(1, f0 * ratioStart), t);
                    osc.frequency.exponentialRampToValueAtTime(
                        Math.max(1, f0 * ratioEnd),
                        t + time
                    );
                }
            };
        });

        return {
            node: input.node,
            duration: input.duration,
            sources
        };
    };
}

export function Detune(cents: number = 0) {
    return (_ctx: AudioContext, input: SoundNode): SoundNode => {
        const sources = input.sources.map((s) => {
            const osc = s.src as OscillatorNode;
            if (!("detune" in osc)) return s;

            return {
                ...s,
                schedule: (t: number) => {
                    s.schedule?.(t);
                    osc.detune.setValueAtTime(cents, t);
                }
            };
        });

        return {
            node: input.node,
            duration: input.duration,
            sources
        };
    };
}

export function Saturate(amount: number = 0.5) {
    return (ctx: AudioContext, input: SoundNode): SoundNode => {
        const shaper = ctx.createWaveShaper();
        const k = Math.max(0.01, amount) * 50;
        const curve = new Float32Array(44100);
        for (let i = 0; i < curve.length; i++) {
            const x = (i * 2) / (curve.length - 1) - 1;
            curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
        }
        shaper.curve = curve;
        shaper.oversample = "2x";

        input.node.connect(shaper);

        return {
            node: shaper,
            duration: input.duration,
            sources: input.sources
        };
    };
}

export function EarlyReflections({
    taps = [
        [0.012, 0.18],
        [0.019, 0.12],
        [0.027, 0.08]
    ],
    lowpass = 6000
}: {
    taps?: Array<[time: number, gain: number]>;
    lowpass?: number;
}) {
    return (ctx: AudioContext, input: SoundNode): SoundNode => {
        const out = ctx.createGain();
        const dry = ctx.createGain();
        dry.gain.value = 1;
        input.node.connect(dry);
        dry.connect(out);

        taps.forEach(([time, gain]) => {
            const d = ctx.createDelay(0.1);
            d.delayTime.value = time;
            const lp = ctx.createBiquadFilter();
            lp.type = "lowpass";
            lp.frequency.value = lowpass;
            const g = ctx.createGain();
            g.gain.value = gain;

            input.node.connect(d);
            d.connect(lp);
            lp.connect(g);
            g.connect(out);
        });

        const extra = taps.reduce((m, t) => Math.max(m, t[0]), 0);

        return {
            node: out,
            duration: input.duration + extra,
            sources: input.sources
        };
    };
}

export function ModalHit(
    modes: Array<[freq: number, amp: number, decay: number]>,
    attack: number = 0.002
): Sound {
    return (ctx) => {
        const g = ctx.createGain();
        let maxDur = 0;
        const sources: ScheduledSource[] = [];

        modes.forEach(([freq, amp, decay]) => {
            const o = ctx.createOscillator();
            o.type = "sine";
            o.frequency.value = freq;

            const og = ctx.createGain();
            og.gain.value = 0.0001;

            o.connect(og);
            og.connect(g);

            const duration = Math.max(0.02, decay + 0.01);
            maxDur = Math.max(maxDur, duration);

            sources.push({
                src: o,
                offset: 0,
                duration,
                schedule: (t: number) => {
                    og.gain.cancelScheduledValues(t);
                    og.gain.setValueAtTime(0.0001, t);
                    og.gain.linearRampToValueAtTime(amp, t + attack);
                    og.gain.exponentialRampToValueAtTime(0.0001, t + decay);
                }
            });
        });

        return {
            node: g,
            duration: maxDur,
            sources
        };
    };
}

// -------------------------
// 🔗 Combinators
// -------------------------
export function chain(
    source: Sound,
    ...mods: Array<(ctx: AudioContext, input: SoundNode) => SoundNode>
): Sound {
    return (ctx) => {
        let current = source(ctx);
        for (const mod of mods) {
            current = mod(ctx, current);
        }
        return current;
    };
}

export function mix(...sounds: Sound[]): Sound {
    return (ctx) => {
        const g = ctx.createGain();
        let maxDuration = 0;
        let sources: ScheduledSource[] = [];

        sounds.forEach((s) => {
            const res = s(ctx);
            res.node.connect(g);

            maxDuration = Math.max(maxDuration, res.duration);
            sources.push(...res.sources);
        });

        return {
            node: g,
            duration: maxDuration,
            sources
        };
    };
}

export function sequence(
    events: Array<[time: number, sound: Sound]>
): Sound {
    return (ctx) => {
        const g = ctx.createGain();
        let maxTime = 0;
        let sources: ScheduledSource[] = [];

        events.forEach(([time, sound]) => {
            const res = sound(ctx);
            res.node.connect(g);

            res.sources.forEach((s) => {
                sources.push({
                    src: s.src,
                    offset: s.offset + time,
                    duration: s.duration,
                    schedule: s.schedule
                });
            });

            maxTime = Math.max(maxTime, time + res.duration);
        });

        return {
            node: g,
            duration: maxTime,
            sources
        };
    };
}

// -------------------------
// ▶️ Play (single scheduler)
// -------------------------
export function play(sound: Sound) {
    const isFirstPlay = !hasPrimedAudioGraph;
    const ctx = initAudio();
    const res = sound(ctx);

    const master = getMasterChain(ctx);
    res.node.connect(master);

    const startTime = ctx.currentTime
        + PLAY_SCHEDULE_LOOKAHEAD_SEC
        + (isFirstPlay ? FIRST_PLAY_EXTRA_LOOKAHEAD_SEC : 0);

    res.sources.forEach(({ src, offset, duration, schedule }) => {
        const t = startTime + offset;
        schedule?.(t);
        src.start(t);
        src.stop(t + duration);
    });
}

