import { useMemo, useState } from 'react';
import type { Navigate, PeriodEntry, Profile } from '../types';
import { daysBetween, formatDate, todayInput } from '../utils/dates';
import { Arrow, Button } from '../components/Button';
import { PageIntro } from '../components/PageIntro';
import { ProfileSetup } from '../components/ProfileSetup';

const flows = ['Spotting', 'Light', 'Medium', 'Heavy'];

const symptoms = ['Bloating', 'Headache', 'Fatigue', 'Breast tenderness', 'Mood changes', 'No other symptoms', 'Other'];

function CycleTimeline({ entry, cycleLength = 28, onInsights }: { entry?: PeriodEntry; cycleLength?: number; onInsights?: () => void }) {
  if (!entry) {
    return <section className="cycle-overview" aria-labelledby="cycle-title"><div className="section-heading"><span className="eyebrow">YOUR RHYTHM</span><h2 id="cycle-title">Your Cycle at a Glance.</h2></div><div className="timeline-empty"><span aria-hidden="true">○</span><div><h3>Your estimate will appear here.</h3><p>Save a period entry to see an estimated cycle day and phase. More entries can help make future estimates more useful.</p></div></div></section>;
  }

  const start = new Date(`${entry.startDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceStart = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
  const cycleDay = (daysSinceStart % cycleLength) + 1;
  const phases = [
    { name: 'Menstrual Phase', range: 'Days 1–5', active: cycleDay <= 5, className: 'menstrual', copy: 'Your body may benefit from extra rest, warmth, hydration, and gentle movement during this phase.' },
    { name: 'Follicular Phase', range: 'Days 6–13', active: cycleDay >= 6 && cycleDay <= 13, className: 'follicular', copy: 'Energy may begin to shift as your body prepares for its estimated fertile window.' },
    { name: 'Ovulation', range: 'Days 14–16', active: cycleDay >= 14 && cycleDay <= 16, className: 'ovulation', copy: 'This is an estimated window only; a calendar calculation cannot confirm that ovulation occurred.' },
    { name: 'Luteal Phase', range: 'Days 17–28', active: cycleDay >= 17, className: 'luteal', copy: 'You may notice changes in energy, mood, appetite, or comfort as your next period approaches.' },
  ];
  const current = phases.find(phase => phase.active) ?? phases[0];

  return <section className="cycle-overview" aria-labelledby="cycle-title">
    <div className="section-heading"><span className="eyebrow">YOUR RHYTHM</span><h2 id="cycle-title">Your Cycle at a Glance.</h2></div>
    <div className="cycle-summary"><div><span>You’re currently in your estimated…</span><h3>{current.name}</h3><p>{current.copy}</p></div><strong><small>Cycle</small>Day {cycleDay}</strong></div>
    <div className="timeline-scroll"><div className="phase-timeline">{phases.map(phase => <div className={`phase ${phase.className} ${phase.active ? 'active' : ''}`} key={phase.name}><i></i><strong>{phase.name}</strong><span>{phase.range}</span>{phase.active && <b>Estimated now</b>}</div>)}</div></div>
    <p className="estimate-note">Based on a {cycleLength}-day cycle and your most recent entry. This estimate is educational and is not a medically confirmed assessment.</p>
    {onInsights && <div className="insights-action"><Button kind="outline" onClick={onInsights}>Explore My Patterns <Arrow /></Button></div>}
  </section>;
}

function PeriodTracker({ onConcerns, onInsights, onBack, profile, entries, onAddEntry }: { onConcerns: () => void; onInsights: () => void; onBack: () => void; profile: Profile; entries: PeriodEntry[]; onAddEntry: (entry: PeriodEntry) => void }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ongoing, setOngoing] = useState(false);
  const [flow, setFlow] = useState('');
  const [pain, setPain] = useState(0);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [otherSymptom, setOtherSymptom] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ startDate?: string; endDate?: string; flow?: string }>({});
  const [saved, setSaved] = useState(false);

  const toggleSymptom = (symptom: string) => {
    setSaved(false);
    if (symptom === 'No other symptoms') {
      setSelectedSymptoms(selectedSymptoms.includes(symptom) ? [] : [symptom]);
      setOtherSymptom('');
      return;
    }
    const withoutNone = selectedSymptoms.filter(item => item !== 'No other symptoms');
    setSelectedSymptoms(withoutNone.includes(symptom) ? withoutNone.filter(item => item !== symptom) : [...withoutNone, symptom]);
    if (symptom === 'Other' && withoutNone.includes('Other')) setOtherSymptom('');
  };

  const saveEntry = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!startDate) nextErrors.startDate = 'Choose the first day of your period.';
    if (!ongoing && !endDate) nextErrors.endDate = 'Choose an end date or select “My period is still going on.”';
    if (startDate && endDate && !ongoing && endDate < startDate) nextErrors.endDate = 'The end date cannot be earlier than the start date.';
    if (startDate && entries.some(entry => entry.startDate === startDate)) nextErrors.startDate = 'An entry with this start date already exists in this session.';
    if (!flow) nextErrors.flow = 'Select the flow intensity that fits best.';
    setErrors(nextErrors);
    setSaved(false);
    if (Object.keys(nextErrors).length) return;
    const entry: PeriodEntry = { id: Date.now(), startDate, endDate: ongoing ? '' : endDate, ongoing, flow, pain, symptoms: selectedSymptoms, otherSymptom, notes };
    onAddEntry(entry);
    setSaved(true);
  };

  const latestEntry = entries[entries.length - 1];

  return <>
    <section className="tracker-shell" id="period-form">
      <Button kind="text" onClick={onBack}>← Back to home</Button>
      <div className="tracker-heading"><span className="eyebrow">CYCLE TRACKER</span><h1>Log Your <em>Period.</em></h1><p>A few details today can help you understand your cycle better.</p></div>
      <form className="period-form" onSubmit={saveEntry} noValidate>
        <div className="form-section dates-section">
          <div className="field-group"><label htmlFor="period-start">When did your period start? <b>Required</b></label><input id="period-start" type="date" value={startDate} max={todayInput()} aria-invalid={!!errors.startDate} onChange={event => { setStartDate(event.target.value); setErrors({ ...errors, startDate: undefined }); setSaved(false); }} />{errors.startDate && <span className="field-error">{errors.startDate}</span>}</div>
          <div className="field-group"><label htmlFor="period-end">When did your period end? <b>Required unless ongoing</b></label><input id="period-end" type="date" value={endDate} min={startDate || undefined} max={todayInput()} disabled={ongoing} aria-invalid={!!errors.endDate} onChange={event => { setEndDate(event.target.value); setErrors({ ...errors, endDate: undefined }); setSaved(false); }} />{errors.endDate && <span className="field-error">{errors.endDate}</span>}</div>
          <label className="toggle-row"><input type="checkbox" checked={ongoing} onChange={event => { setOngoing(event.target.checked); setEndDate(''); setErrors({ ...errors, endDate: undefined }); setSaved(false); }} /><span className="toggle-control" aria-hidden="true"></span><span>My period is still going on.</span></label>
        </div>

        <fieldset className="form-section"><legend>How heavy was your flow? <b>Required</b></legend><div className="choice-grid flow-grid">{flows.map(option => <button type="button" className={flow === option ? 'selected' : ''} aria-pressed={flow === option} onClick={() => { setFlow(option); setErrors({ ...errors, flow: undefined }); setSaved(false); }} key={option}><i aria-hidden="true"></i>{option}</button>)}</div>{errors.flow && <span className="field-error">{errors.flow}</span>}</fieldset>

        <fieldset className="form-section"><legend>How much pain or cramping did you experience?</legend><div className="pain-labels"><span>No pain</span><span>Severe</span></div><div className="pain-scale">{[0, 1, 2, 3, 4, 5].map(value => <button type="button" className={pain === value ? 'selected' : ''} aria-pressed={pain === value} onClick={() => { setPain(value); setSaved(false); }} key={value}>{value}</button>)}</div></fieldset>

        <fieldset className="form-section"><legend>What other symptoms did you notice?</legend><p className="field-help">Select all that apply.</p><div className="symptom-grid">{symptoms.map(symptom => <button type="button" className={selectedSymptoms.includes(symptom) ? 'selected' : ''} aria-pressed={selectedSymptoms.includes(symptom)} onClick={() => toggleSymptom(symptom)} key={symptom}>{symptom}</button>)}</div>{selectedSymptoms.includes('Other') && <div className="other-field"><label htmlFor="other-symptom">Tell us a little more</label><input id="other-symptom" type="text" value={otherSymptom} placeholder="Add another symptom" onChange={event => setOtherSymptom(event.target.value)} /></div>}</fieldset>

        <div className="form-section field-group"><label htmlFor="period-notes">Anything else you noticed? <b>Optional</b></label><textarea id="period-notes" value={notes} rows={3} placeholder="Changes in sleep, energy, appetite, or anything else…" onChange={event => { setNotes(event.target.value); setSaved(false); }} /></div>
        <div className="save-row"><Button type="submit">Save Entry <Arrow /></Button><span>Your answers stay in this session only.</span></div>
        {saved && <div className="save-success" role="status"><strong>Entry saved.</strong><span>Your cycle estimate has been updated below.</span></div>}
        {entries.length > 0 && <div className="session-entries"><h3>Entries this session</h3>{entries.map(entry => <article key={entry.id}><div><strong>{formatDate(entry.startDate)}</strong><span>{entry.ongoing ? 'Ongoing period' : `Ended ${formatDate(entry.endDate)}`}</span></div><span>{entry.flow} flow · Pain {entry.pain}/5</span></article>)}</div>}
      </form>
    </section>
    <CycleTimeline entry={latestEntry} cycleLength={Number(profile.cycleLength) || 28} onInsights={onInsights} />
    <section className="explore-card"><div><span className="eyebrow">GO FURTHER, AT YOUR PACE</span><h2>Your Cycle, Beyond the Calendar</h2><p>There's more to your cycle than dates. Discover the patterns behind it.</p></div><div className="calendar-swish" aria-label="Educational cycle pattern guidance, not a diagnosis"><svg viewBox="0 0 120 110" aria-hidden="true"><rect className="calendar-body" x="15" y="20" width="82" height="72" rx="14" /><path className="calendar-top" d="M15 42h82" /><path className="calendar-ring" d="M36 13v16M75 13v16" /><path className="calendar-date" d="M35 58h9M54 58h9M73 58h9M35 74h9M54 74h9" /><path className="swish-page page-one" d="M94 34c17 4 21 15 8 28" /><path className="swish-page page-two" d="M98 47c15 6 17 17 2 28" /><path className="swish-page page-three" d="M95 61c12 7 10 18-5 25" /></svg><strong>Educational pattern guidance</strong><span>Not a diagnosis</span></div><Button onClick={onConcerns}>Explore More <Arrow /></Button></section>
  </>;
}

export function AnalyseCyclePage({ profile, entries, onAddEntry, onProfileSave, navigate }: { profile: Profile | null; entries: PeriodEntry[]; onAddEntry: (entry: PeriodEntry) => void; onProfileSave: (profile: Profile) => void; navigate: Navigate }) {
  if (!profile) return <ProfileSetup onSave={onProfileSave} onBack={() => navigate('home')} />;
  return <PeriodTracker profile={profile} entries={entries} onAddEntry={onAddEntry} onBack={() => navigate('home')} onConcerns={() => navigate('concerns')} onInsights={() => navigate('insights')} />;
}

export function CycleInsightsPage({ entries, onBack }: { entries: PeriodEntry[]; onBack: () => void }) {
  const insights = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const cycleLengths = sorted.slice(1).map((entry, index) => daysBetween(sorted[index].startDate, entry.startDate)).filter(length => length > 0);
    const periodDurations = sorted.filter(entry => entry.endDate && !entry.ongoing).map(entry => daysBetween(entry.startDate, entry.endDate) + 1);
    const symptomCounts = new Map<string, number>();
    sorted.forEach(entry => entry.symptoms.filter(symptom => symptom !== 'No other symptoms' && symptom !== 'Other').forEach(symptom => symptomCounts.set(symptom, (symptomCounts.get(symptom) ?? 0) + 1)));
    const recurring = [...symptomCounts.entries()].sort((a, b) => b[1] - a[1]);
    return { cycleLengths, periodDurations, recurring };
  }, [entries]);
  const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  const hasPatterns = insights.cycleLengths.length || insights.periodDurations.length || insights.recurring.length;
  return <section className="insights-page"><PageIntro eyebrow="CYCLE INSIGHTS" title="Explore My Patterns" text="Review the cycle lengths, period durations, and recurring symptoms available from entries saved during this session." onBack={onBack} />{!hasPatterns ? <div className="insights-empty"><span aria-hidden="true">○</span><h2>More entries will reveal more useful patterns.</h2><p>Log at least two period start dates to compare cycle lengths. Completed entries can also show period duration and recurring symptoms.</p><Button onClick={onBack}>Return to My Cycle</Button></div> : <div className="insights-grid"><article><span>Recorded cycle lengths</span><strong>{average(insights.cycleLengths) ? `${average(insights.cycleLengths)} days` : 'More entries needed'}</strong><p>{insights.cycleLengths.length ? insights.cycleLengths.map(value => `${value} days`).join(' · ') : 'Two period start dates are needed to calculate a cycle length.'}</p></article><article><span>Completed period durations</span><strong>{average(insights.periodDurations) ? `${average(insights.periodDurations)} days` : 'No completed periods yet'}</strong><p>{insights.periodDurations.length ? insights.periodDurations.map(value => `${value} days`).join(' · ') : 'Add an end date when a period is complete.'}</p></article><article><span>Recurring symptoms</span><strong>{insights.recurring[0]?.[0] ?? 'No recurring symptom yet'}</strong><p>{insights.recurring.length ? insights.recurring.map(([symptom, count]) => `${symptom} (${count})`).join(' · ') : 'Symptoms will appear here when they are recorded.'}</p></article><div className="insights-note"><strong>Patterns, not conclusions.</strong><p>These summaries reflect only the entries in this session. They are not a diagnosis or prediction.</p></div></div>}</section>;
}
