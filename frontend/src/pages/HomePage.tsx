import { useEffect, useRef, useState } from 'react';
import type { Navigate } from '../types';
import { Arrow, Button } from '../components/Button';
import { Logo } from '../components/Logo';

const img = {
  hero: '/menstrual-health-illustration.png',
  analysis: '/cycle-analysis-illustration.png',
  group: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1200&q=85',
  calm: 'https://images.unsplash.com/photo-1769029174021-b305fa92f0ae?auto=format&fit=crop&w=1000&q=85',
  friends: 'https://images.unsplash.com/photo-1512291505839-65ba15729a48?auto=format&fit=crop&w=1000&q=85',
};

function PainStatistic({ visible }: { visible: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setCount(2);
    let frame = 0;
    const start = performance.now();
    const animate = (now: number) => {
      setCount(Math.round(Math.min(1, (now - start) / 1100) * 2));
      if (now - start < 1100) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [visible]);
  return <strong className={`count-stat ${visible ? 'is-visible' : ''}`} aria-label="More than 2 out of 3"><span>More than</span><b key={count}>{count}</b><i>out of</i><b>3</b></strong>;
}

function AnimatedPercent({ value, visible }: { value: number; visible: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setCount(value);
    let frame = 0;
    const start = performance.now();
    const animate = (now: number) => {
      setCount(Math.round(Math.min(1, (now - start) / 1100) * value));
      if (now - start < 1100) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [visible, value]);
  return <strong className={visible ? 'is-visible' : ''}>{count}%</strong>;
}

function Statistics() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: .35 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <section ref={ref} className="stats" id="intro">
    <div className="stat-display"><div className="stat-grid"><article className="pain-stat"><PainStatistic visible={visible} /><p>people who menstruate experience menstrual pain.</p></article><article className="school-stat"><span>Only</span><AnimatedPercent value={39} visible={visible} /><p>of global schools provide menstrual health education.</p></article></div><a className="who-source" href="https://www.who.int/news/item/28-05-2024-menstrual-health-and-hygiene" target="_blank" rel="noreferrer"><img src="https://www.who.int/ResourcePackages/WHO/assets/dist/images/logos/en/h-logo-blue.svg" alt="World Health Organization" /><span>Source: WHO / UNICEF Joint Monitoring Programme</span></a></div>
  </section>;
}

export function HomePage({ navigate }: { navigate: Navigate }) {
  const goAnalysis = () => navigate('analysis');
  return <>
    <section className="hero" id="home">
      <div className="hero-copy"><span className="eyebrow">MENSTRUAL HEALTH, IN YOUR RHYTHM</span><div className="hero-main-logo"><Logo /></div><h1 className="hero-tagline">Understand your cycle. <em>Understand yourself.</em></h1><p>Your cycle is more than a date on the calendar. Discover patterns, understand symptoms, and build a healthier relationship with your menstrual health.</p><div className="button-row"><Button kind="text" href="#cycle"><span className="play">▶</span> Discover InSync</Button></div></div>
      <div className="hero-visual"><div className="orb"></div><img src={img.hero} alt="Illustration showing menstrual symptoms and cycle experiences" /><div className="float-card"><strong>Know your rhythm</strong><span>Track · notice · learn</span></div><svg className="wave" viewBox="0 0 200 30"><path d="M0 15h40l8-10 10 20 10-15 9 5h123" /></svg></div>
    </section>

    <Statistics />

    <section className="analysis-cta" id="cycle">
      <div><span className="eyebrow">START WITH YOUR STORY</span><h2>Let us analyse your cycle. <em>Your journey begins now.</em></h2><p>Every cycle is different. Share a few details about your period and symptoms to begin exploring your cycle patterns and understanding your menstrual health.</p><Button onClick={goAnalysis}>Analyse My Cycle <Arrow /></Button><small>Your body. Your data. Your choice.</small></div>
      <div className="cta-image"><img src={img.analysis} alt="Illustration showing menstrual symptoms and cycle experiences" /><div className="circle one">↻<span>cycle</span></div><div className="circle two">✦<span>wellbeing</span></div></div>
    </section>

    <section className="features">
      <div className="feature-intro"><span className="eyebrow light">BUILT AROUND YOU</span><h2>Your health deserves better understanding.</h2><p>Small observations can help you recognise patterns, understand symptoms, and have more informed conversations about your health.</p></div>
      <div className="feature-grid">
        {[
          ['01', 'Cycle Insights', 'Understand menstrual phases and learn how cycle patterns can vary.'],
          ['02', 'Symptom Tracking', 'Record period flow, cramps, mood, energy, and other symptoms.'],
          ['03', 'Evidence-Based Learning', 'Explore accessible, reliable information about menstrual and hormonal health.']
        ].map(x => <article className="feature-card" key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p><b>↗</b></article>)}
        <article className="story-card"><img src={img.friends} alt="Two women standing together outdoors" /><div><h3>Every cycle tells a story.</h3><p>Pay attention to your patterns, not just your dates.</p></div></article>
      </div>
    </section>

    <section className="education" id="learn">
      <div><span className="eyebrow">LEARN AT YOUR PACE</span><h2>Knowledge makes a difference.</h2><p>Explore the science behind your cycle and discover practical ways to care for yourself.</p><div className="seal">Learn.<br />Understand.<br />Empower.</div><Button onClick={() => navigate('info')}>Explore Resources <Arrow /></Button></div>
      <div className="edu-cards"><article><img src={img.group} alt="Women connecting in a natural setting" /><span>Cycle Basics</span><h3>Understanding Your Cycle</h3><p>Learn about menstrual phases, hormones, and common cycle variations.</p></article><article><img src={img.calm} alt="Woman in a calm reflective moment" /><span>Symptom Guide</span><h3>Making Sense of Symptoms</h3><p>Explore cramps, flow changes, mood, and other menstrual symptoms.</p></article></div>
    </section>

    <section className="awareness">
      <div><span className="eyebrow">AWARENESS, NOT ASSUMPTIONS</span><h2>Get in sync with your body.</h2><p>Build awareness of your patterns, track changes over time, and learn when a conversation with a healthcare professional may help.</p><ul><li>Track your period and flow.</li><li>Notice symptoms and recurring patterns.</li><li>Learn with reliable guidance.</li></ul></div>
      <div className="abstract"><i></i><i></i><i></i><span>Your cycle, understood.</span></div>
    </section>
  </>;
}
