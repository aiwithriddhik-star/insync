import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ApiError, chartUrl, classifyQuestion, loadCloudImage, loadCloudTerms, loadPassages, type CloudTerm, type DrillDown, type ThemeMatch } from '../api/research';
import { createMeasurer, fontFor, layoutCloud } from '../utils/cloudLayout';
import { Arrow, Button } from './Button';

type CloudState = { status: 'loading' } | { status: 'ready'; terms: CloudTerm[]; source: 'api' | 'file' } | { status: 'error'; message: string };
type PassageState = { status: 'idle' } | { status: 'loading' } | { status: 'ready'; data: DrillDown } | { status: 'error'; message: string };
type MatchState = { status: 'idle' } | { status: 'loading' } | { status: 'ready'; data: ThemeMatch } | { status: 'error'; message: string };

const friendly = (error: unknown) => error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function excerpt(text: string, term: string) {
  if (text.length <= 340) return text;
  const at = text.toLowerCase().indexOf(term.toLowerCase());
  if (at < 0) return `${text.slice(0, 337).trim()}…`;
  const start = Math.max(0, at - 140);
  const end = Math.min(text.length, at + 200);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

function Highlight({ text, term }: { text: string; term: string }) {
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, 'ig'));
  return <>{parts.map((part, index) => index % 2 === 1 ? <mark key={index}>{part}</mark> : part)}</>;
}

/**
 * Word cloud of the terms that recur across the research papers, built from the BERTopic
 * service (insynccc.py). Words open passages (GET /drill-down); questions are matched to a
 * research theme (POST /classify).
 */
export function ResearchWordCloud() {
  const [cloud, setCloud] = useState<CloudState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [width, setWidth] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [passages, setPassages] = useState<PassageState>({ status: 'idle' });
  const [question, setQuestion] = useState('');
  const [match, setMatch] = useState<MatchState>({ status: 'idle' });
  const [chartsOpen, setChartsOpen] = useState(false);
  const [chart, setChart] = useState<'topic_barchart' | 'topic_hierarchy'>('topic_barchart');
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const passageRequest = useRef<AbortController | null>(null);
  const matchRequest = useRef<AbortController | null>(null);

  // GET /wordcloud
  useEffect(() => {
    const controller = new AbortController();
    setCloud({ status: 'loading' });
    loadCloudTerms(150, controller.signal)
      .then(result => setCloud({ status: 'ready', ...result }))
      .catch(error => { if (error.name !== 'AbortError') setCloud({ status: 'error', message: friendly(error) }); });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => () => { passageRequest.current?.abort(); matchRequest.current?.abort(); }, []);

  // Measure text with the real site fonts so words never overlap.
  useEffect(() => {
    let alive = true;
    const ready = () => alive && setFontsReady(true);
    const timer = window.setTimeout(ready, 1500);
    if (document.fonts?.load) Promise.all([document.fonts.load('400 40px "DM Serif Display"'), document.fonts.load('500 14px "DM Sans"')]).catch(() => undefined).then(ready);
    else ready();
    return () => { alive = false; window.clearTimeout(timer); };
  }, []);

  // Track the width of the stage so the layout fits phones and desktops alike.
  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    let timer = 0;
    setWidth(Math.floor(node.clientWidth));
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setWidth(Math.floor(node.clientWidth)), 120);
    });
    observer.observe(node);
    return () => { window.clearTimeout(timer); observer.disconnect(); };
  }, []);

  const height = Math.round(Math.min(540, Math.max(340, (width || 700) * 0.5)));
  const source = cloud.status === 'ready' ? cloud.source : null;
  const placed = useMemo(() => {
    if (cloud.status !== 'ready' || !fontsReady || width < 120 || typeof document === 'undefined') return [];
    return layoutCloud(cloud.terms, width, height, createMeasurer());
  }, [cloud, fontsReady, width, height]);

  // GET /drill-down
  const selectWord = (word: string, toggle: boolean) => {
    passageRequest.current?.abort();
    if (toggle && word === selected) {
      setSelected(null);
      setPassages({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    passageRequest.current = controller;
    setSelected(word);
    setPassages({ status: 'loading' });
    loadPassages(word, 5, controller.signal)
      .then(data => setPassages({ status: 'ready', data }))
      .catch(error => { if (error.name !== 'AbortError') setPassages({ status: 'error', message: friendly(error) }); });
  };

  // POST /classify
  const findTheme = (event: FormEvent) => {
    event.preventDefault();
    const text = question.trim();
    if (text.length < 3) {
      setMatch({ status: 'error', message: 'Type a few words about what you would like to understand.' });
      return;
    }
    matchRequest.current?.abort();
    const controller = new AbortController();
    matchRequest.current = controller;
    setMatch({ status: 'loading' });
    classifyQuestion(text, controller.signal)
      .then(data => setMatch({ status: 'ready', data }))
      .catch(error => { if (error.name !== 'AbortError') setMatch({ status: 'error', message: friendly(error) }); });
  };

  // GET /export-cloud-image
  const downloadImage = async () => {
    setImageBusy(true);
    setImageError('');
    try {
      const link = document.createElement('a');
      link.href = await loadCloudImage();
      link.download = 'insync-research-word-cloud.png';
      link.click();
    } catch (error) {
      setImageError(friendly(error));
    } finally {
      setImageBusy(false);
    }
  };

  const onKey = (word: string) => (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectWord(word, true);
    }
  };

  return <section className="research-section" aria-labelledby="research-heading">
    <div className="research-head">
      <span className="eyebrow">WHAT THE RESEARCH SAYS</span>
      <h2 id="research-heading">The words that <em>shape</em> menstrual health research.</h2>
      <p>We analysed a collection of published research papers and counted how many passages mention each term. Bigger words come up more often. Select a word to read where it appears, or ask a question to find the research theme closest to it.</p>
    </div>

    <div className={`research-layout${cloud.status === 'error' ? ' solo' : ''}`}>
      <div className="research-card">
        <div className="research-toolbar">
          {source && <span className={`source-pill ${source}`}>{source === 'api' ? 'Live from the research service' : 'Exported terms · service offline'}</span>}
          {!source && <span className="source-pill">Research terms</span>}
          {source === 'api' && <Button kind="outline" onClick={downloadImage} disabled={imageBusy}>{imageBusy ? 'Preparing…' : 'Download image'}</Button>}
        </div>

        <div className="cloud-stage" ref={stageRef} style={{ height }}>
          {cloud.status === 'loading' && <div className="cloud-state" role="status"><span className="pulse" aria-hidden="true"></span><p>Gathering terms from the research…</p></div>}
          {cloud.status === 'error' && <div className="cloud-state" role="alert">
            <span className="state-mark" aria-hidden="true">i</span>
            <h3>The research word cloud is unavailable right now.</h3>
            <p>{cloud.message} The rest of this page still works.</p>
            <Button kind="outline" onClick={() => setAttempt(value => value + 1)}>Try again</Button>
            <details><summary>Setup details</summary><p>Start the backend with <code>uvicorn main:app --port 8000</code>, or set <code>VITE_API_BASE</code> to its address. As a fallback, put the exported <code>cloud_terms.json</code> in the <code>public</code> folder.</p></details>
          </div>}
          {cloud.status === 'ready' && placed.length > 0 && <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="group" aria-label="Word cloud of terms that recur across menstrual health research">
            {placed.map(word => {
              const font = fontFor(word.size);
              const isSelected = selected === word.text;
              return <g key={word.text} className={`cloud-word${isSelected ? ' selected' : ''}${selected && !isSelected ? ' dim' : ''}`} role="button" tabIndex={0} aria-pressed={isSelected} aria-label={`${word.text}, mentioned in ${word.value} passages`} onClick={() => selectWord(word.text, true)} onKeyDown={onKey(word.text)}>
                <rect x={word.cx - word.width / 2} y={word.cy - word.height / 2} width={word.width} height={word.height} rx={8} fill={isSelected ? '#40232b' : 'transparent'} />
                <text x={word.cx} y={word.cy + word.size * 0.34} textAnchor="middle" fontSize={word.size} fontFamily={font.family} fontWeight={font.weight} fill={isSelected ? '#fffdf9' : word.color}>{word.text}</text>
              </g>;
            })}
          </svg>}
          {cloud.status === 'ready' && placed.length === 0 && <div className="cloud-state" role="status"><span className="pulse" aria-hidden="true"></span><p>{cloud.terms.length ? 'Arranging the words…' : 'No terms are available yet.'}</p></div>}
        </div>
        {imageError && <span className="field-error">{imageError}</span>}
        <p className="cloud-hint">Size shows how many passages mention a word. Use Tab and Enter to explore with a keyboard.</p>
      </div>

      {cloud.status !== 'error' && <aside className="research-side">
        <div className="passages-panel" aria-live="polite">
          {passages.status === 'idle' && <><span className="panel-label">READ THE RESEARCH</span><h3>Pick a word to see where it appears.</h3><p>Passages come straight from the papers, so you can see terms in context.</p></>}
          {passages.status === 'loading' && <><span className="panel-label">READ THE RESEARCH</span><h3>Finding passages for “{selected}”…</h3></>}
          {passages.status === 'error' && <><span className="panel-label">READ THE RESEARCH</span><h3>Passages for “{selected}” could not load.</h3><p>{passages.message}</p></>}
          {passages.status === 'ready' && <>
            <span className="panel-label">PASSAGES MENTIONING</span>
            <h3>“{passages.data.keyword}”</h3>
            {passages.data.results.length === 0
              ? <p>No passages mention this word.</p>
              : <><p className="passage-count">Showing {passages.data.results.length} of {passages.data.total_matched ?? passages.data.matched_count} passages.</p>
                <div className="passage-list">{passages.data.results.map((item, index) => <article key={item.chunk_id}><span>Passage {index + 1}</span><p><Highlight text={excerpt(item.content, passages.data.keyword)} term={passages.data.keyword} /></p></article>)}</div></>}
            <button className="panel-clear" onClick={() => selectWord(selected ?? '', true)}>Clear selection</button>
          </>}
          <small>Excerpts from research papers, for learning only. They are not personal medical advice.</small>
        </div>

        <form className="theme-finder" onSubmit={findTheme}>
          <span className="panel-label">FIND A RELATED THEME</span>
          <label htmlFor="theme-question">What would you like to understand?</label>
          <input id="theme-question" value={question} maxLength={300} onChange={event => { setQuestion(event.target.value); if (match.status === 'error') setMatch({ status: 'idle' }); }} placeholder="e.g. why are my periods so painful?" />
          <Button type="submit" disabled={match.status === 'loading'}>{match.status === 'loading' ? 'Matching…' : <>Find related research <Arrow /></>}</Button>
          <div aria-live="polite">
            {match.status === 'error' && <span className="field-error">{match.message}</span>}
            {match.status === 'ready' && (match.data.topic_id === -1 || !match.data.keywords.length
              ? <p className="match-note">{match.data.message ?? 'No close theme found. Try different or more specific words.'}</p>
              : <div className="match-result"><p>The closest research theme mentions:</p><div className="theme-chips">{match.data.keywords.slice(0, 8).map(keyword => <button type="button" key={keyword.text} onClick={() => selectWord(keyword.text, false)}>{keyword.text}</button>)}</div></div>)}
          </div>
          <small>Your question is sent to the InSync research service only to find a matching theme, and is not saved.</small>
        </form>
      </aside>}
    </div>

    {source === 'api' && <details className="chart-explorer" onToggle={event => setChartsOpen(event.currentTarget.open)}>
      <summary>Explore the topic charts <span aria-hidden="true">+</span></summary>
      <div className="chart-tabs" role="group" aria-label="Choose a chart">
        <button className={chart === 'topic_barchart' ? 'selected' : ''} aria-pressed={chart === 'topic_barchart'} onClick={() => setChart('topic_barchart')}>Top words by theme</button>
        <button className={chart === 'topic_hierarchy' ? 'selected' : ''} aria-pressed={chart === 'topic_hierarchy'} onClick={() => setChart('topic_hierarchy')}>How themes relate</button>
      </div>
      {chartsOpen && <iframe key={chart} src={chartUrl(chart)} title={chart === 'topic_barchart' ? 'Top words in each research theme' : 'How research themes relate to one another'} loading="lazy" />}
    </details>}
  </section>;
}
