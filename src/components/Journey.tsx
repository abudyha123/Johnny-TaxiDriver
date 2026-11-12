import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock } from 'lucide-react';

/**
 * "בדרך אליכם" – a scroll-driven film made of the four real clips.
 * Scrolling down moves the clips forward, scrolling up moves them back.
 * Each clip is a separate shot; clips meet with a dissolve + light sweep,
 * never presented as one continuous take.
 */

type Chapter = { kicker: string; title: string; text: string; alt: string };

const CLIPS = [
  { id: 'drive', duration: 104 / 24 },
  { id: 'arrive', duration: 169 / 24 },
  { id: 'ramp', duration: 169 / 24 },
  { id: 'onward', duration: 69 / 24 },
] as const;

// share of the scroll each clip gets (longer clips get more room)
const WEIGHTS = [0.24, 0.27, 0.31, 0.18];
const STARTS = WEIGHTS.reduce<number[]>((acc, _w, i) => [...acc, i === 0 ? 0 : acc[i - 1] + WEIGHTS[i - 1]], []);
const FADE = 0.035; // half-width of a transition, in overall progress

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (x: number) => x * x * (3 - 2 * x);

const mediaBase = `${import.meta.env.BASE_URL}media/journey/`;

function useReducedMotion() {
  const [rm, setRm] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setRm(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return rm;
}

// window.__JT_MEDIA__ lets the single-file preview supply blob URLs; the site uses /media/journey/*
function srcFor(id: string, small: boolean, kind: 'mp4' | 'poster') {
  const w = window as unknown as { __JT_MEDIA__?: Record<string, string> };
  const key = kind === 'mp4' ? `${id}-${small ? '960' : '1600'}.mp4` : `${id}-poster${small ? '-960' : ''}.webp`;
  return w.__JT_MEDIA__?.[key] ?? mediaBase + key;
}

const Journey: React.FC = () => {
  const { t, i18n } = useTranslation();
  const chapters = t('journey.chapters', { returnObjects: true }) as Chapter[];
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const veilRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState<boolean[]>([false, false, false, false]);
  const [load, setLoad] = useState(false);
  const small = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    return window.matchMedia('(max-width: 820px)').matches || !!conn?.saveData;
  }, []);
  const rtl = i18n.dir() === 'rtl';

  // start downloading shortly before the scene is reached
  useEffect(() => {
    if (reduced || !sectionRef.current) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { setLoad(true); io.disconnect(); } }, { rootMargin: '150% 0px' });
    io.observe(sectionRef.current);
    return () => io.disconnect();
  }, [reduced]);

  // scroll → film
  useEffect(() => {
    if (reduced) return;
    let raf = 0, shown = 0, target = 0, last = -1;
    const read = () => {
      const el = sectionRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      target = clamp(-r.top / (total || 1));
    };
    const frame = () => {
      shown += (target - shown) * 0.16;            // gentle smoothing so seeking feels cinematic
      if (Math.abs(target - shown) < 0.0004) shown = target;
      const p = shown;
      let best = 0, bestO = -1;
      CLIPS.forEach((clip, k) => {
        const a = STARTS[k], b = STARTS[k] + WEIGHTS[k];
        const fadeIn = k === 0 ? 1 : smooth(clamp((p - (a - FADE)) / (2 * FADE)));
        const fadeOut = k === CLIPS.length - 1 ? 1 : 1 - smooth(clamp((p - (b - FADE)) / (2 * FADE)));
        const o = Math.min(fadeIn, fadeOut);
        const local = clamp((p - (a - (k === 0 ? 0 : FADE))) / (b + (k === CLIPS.length - 1 ? 0 : FADE) - (a - (k === 0 ? 0 : FADE))));
        const layer = layerRefs.current[k];
        if (layer) {
          layer.style.opacity = String(o);
          layer.style.visibility = o > 0.001 ? 'visible' : 'hidden';
          // slow push-in inside each shot; a slight overshoot while dissolving
          const s = 1.0 + 0.035 * local + 0.03 * (1 - o);
          layer.style.transform = `scale(${s.toFixed(4)})`;
        }
        const v = videoRefs.current[k];
        if (v && o > 0.001 && v.readyState >= 1) {
          const tt = Math.min(clip.duration - 0.05, local * clip.duration);
          if (!v.seeking && Math.abs(v.currentTime - tt) > 0.03) v.currentTime = tt;
        }
        const fill = fillRefs.current[k];
        if (fill) fill.style.transform = `scaleX(${clamp((p - a) / WEIGHTS[k]).toFixed(3)})`;
        if (o > bestO) { bestO = o; best = k; }
      });
      // transition veil + light sweep at each cut
      let tv = 0, sweep = -1;
      for (let k = 1; k < CLIPS.length; k++) {
        const c = STARTS[k]; const d = (p - (c - FADE)) / (2 * FADE);
        if (d > 0 && d < 1) { tv = Math.sin(d * Math.PI); sweep = d; }
      }
      if (veilRef.current) veilRef.current.style.opacity = String(0.55 * tv);
      if (sweepRef.current) {
        sweepRef.current.style.opacity = sweep >= 0 ? String(Math.sin(sweep * Math.PI)) : '0';
        const pos = (rtl ? 1 - Math.max(0, sweep) : Math.max(0, sweep)) * 140 - 40; // % of the frame width
        sweepRef.current.style.left = `${pos}%`;
      }
      if (best !== last) { last = best; setActive(best); }
      raf = Math.abs(target - shown) > 0 ? requestAnimationFrame(frame) : 0;
    };
    const onScroll = () => { read(); if (!raf) raf = requestAnimationFrame(frame); };
    read(); shown = target; frame();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [reduced, rtl]);

  const onReady = (k: number) => () => {
    setReady((r) => (r[k] ? r : r.map((v, i) => (i === k ? true : v))));
    const v = videoRefs.current[k];
    // iOS only paints seeked frames after the element has played once
    if (v && v.dataset.primed !== '1') { v.dataset.primed = '1'; v.play().then(() => v.pause()).catch(() => undefined); }
  };

  const ch = chapters[active] || chapters[0];

  if (reduced) {
    return (
      <section id="journey" aria-label={t('journey.sectionLabel')} className="bg-[#0b0f14] text-white py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="font-display text-4xl md:text-5xl font-black mb-10">{t('journey.heading')}</h2>
          <ol className="grid gap-8 md:grid-cols-2">
            {CLIPS.map((clip, k) => (
              <li key={clip.id} className="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <img src={srcFor(clip.id, small, 'poster')} alt={chapters[k]?.alt} className="w-full aspect-video object-cover" loading="lazy" />
                <div className="p-6">
                  <p className="text-yellow-400 font-display font-bold">{String(k + 1).padStart(2, '0')} · {chapters[k]?.kicker}</p>
                  <h3 className="font-display text-2xl font-bold mt-1">{chapters[k]?.title}</h3>
                  <p className="text-slate-300 mt-2">{chapters[k]?.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section id="journey" ref={sectionRef} aria-label={t('journey.sectionLabel')} className="journey relative bg-[#0b0f14] text-white">
      <div className="journey-stage sticky top-0 h-[100svh] overflow-hidden">
        <div className="journey-grid h-full container mx-auto px-4 md:px-6">
          {/* film */}
          <div className="journey-frame relative overflow-hidden rounded-[22px] md:rounded-[26px] bg-[#151b24] shadow-[0_40px_100px_rgba(0,0,0,.55)]">
            {CLIPS.map((clip, k) => (
              <div key={clip.id} ref={(el) => (layerRefs.current[k] = el)} className="absolute inset-0 will-change-[opacity,transform]" style={{ opacity: k === 0 ? 1 : 0 }}>
                <img src={srcFor(clip.id, small, 'poster')} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" decoding="async" />
                <video
                  ref={(el) => (videoRefs.current[k] = el)}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${ready[k] ? 'opacity-100' : 'opacity-0'}`}
                  src={load ? srcFor(clip.id, small, 'mp4') : undefined}
                  muted playsInline preload={load ? 'auto' : 'none'} disablePictureInPicture tabIndex={-1} aria-hidden="true"
                  onLoadedData={onReady(k)}
                />
              </div>
            ))}
            <div ref={veilRef} className="absolute inset-0 bg-[#0b0f14] pointer-events-none" style={{ opacity: 0 }} aria-hidden="true" />
            <div ref={sweepRef} className="journey-sweep absolute top-0 bottom-0 w-[40%] pointer-events-none" style={{ opacity: 0 }} aria-hidden="true" />
            <div className="absolute inset-0 pointer-events-none journey-vignette" aria-hidden="true" />
            {!ready[active] && (
              <div className="absolute bottom-3 start-3 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold" role="status">{t('journey.loading')}</div>
            )}
            <span className="sr-only">{ch?.alt}</span>
          </div>

          {/* copy – never on top of the film */}
          <div className="journey-copy">
            <p className="font-display text-yellow-400 font-bold tracking-wide text-sm md:text-base">{t('journey.heading')}</p>
            <div key={active} className="journey-chapter" aria-live="polite">
              <p className="font-display text-white/70 font-bold mt-3 md:mt-5 text-sm md:text-base">
                <span className="text-yellow-400">{String(active + 1).padStart(2, '0')}</span> · {ch?.kicker}
              </p>
              <h2 className="font-display font-black leading-[1.12] tracking-tight text-[30px] sm:text-4xl lg:text-[2.9rem] mt-1 md:mt-2">{ch?.title}</h2>
              <p className="text-slate-300 text-[17px] md:text-xl leading-relaxed mt-2 md:mt-4 max-w-[34rem]">{ch?.text}</p>
            </div>
            <ol className="journey-steps mt-4 md:mt-8" aria-label={t('journey.progress')}>
              {chapters.map((c, k) => (
                <li key={k} className={k === active ? 'is-active' : ''}>
                  <span className="journey-step-label">{c.kicker}</span>
                  <span className="journey-step-track"><span ref={(el) => (fillRefs.current[k] = el)} className="journey-step-fill" /></span>
                </li>
              ))}
            </ol>
            <div className="mt-4 md:mt-8 flex flex-wrap items-center gap-4">
              <a href="#booking" className="btn-yellow">
                <CalendarClock size={20} aria-hidden="true" />{t('journey.cta')}
              </a>
              <a href="#services" className="journey-skip">{t('journey.skip')}</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Journey;
