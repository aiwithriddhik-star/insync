import { useState } from 'react';
import type { ConcernKind, Navigate, PeriodEntry, Profile } from '../types';
import { Button } from '../components/Button';
import { ChoiceGroup, TextField } from '../components/FormFields';
import { ConcernIcon } from '../components/ConcernIcon';
import { HealthContext } from '../components/HealthContext';
import { PageIntro } from '../components/PageIntro';

const choiceOptions = ['Yes', 'No', 'Unsure'];

const frequencyOptions = ['Never', 'Occasionally', 'Frequently', 'Almost always'];

const concernCards = [
  { id: 'pcos', title: 'PCOS', description: 'Explore cycle irregularity, hormonal symptoms, and common clinical assessments associated with polycystic ovary syndrome.' },
  { id: 'endometriosis', title: 'Endometriosis', description: 'Learn about pelvic pain, painful periods, and other symptoms associated with endometriosis.' },
  { id: 'dysmenorrhea', title: 'Dysmenorrhea', description: 'Explore common patterns of menstrual cramps and pain that disrupt daily activities.' },
  { id: 'heavy-bleeding', title: 'Heavy Menstrual Bleeding', description: 'Understand heavy or prolonged bleeding and the patterns worth tracking.' },
  { id: 'irregular', title: 'Irregular Periods', description: 'Explore changes in cycle length, missed periods, and unpredictable menstrual patterns.' },
] as const;

export function BeyondCalendarPage({ navigate, onBack }: { navigate: Navigate; onBack: () => void }) {
  return <section className="concerns-page">
    <PageIntro eyebrow="MENSTRUAL HEALTH CONCERNS" title="Your Menstrual Health, Beyond the Basics" text="Explore common menstrual health concerns, understand the symptoms associated with them, and learn what you may wish to discuss with a healthcare professional." onBack={onBack} />
    <div className="concern-grid">{concernCards.map((concern, index) => <article className={`concern-card concern-${concern.id}`} key={concern.id}>
      <div className="concern-art"><ConcernIcon type={concern.id} />{index === 0 && <i className="floating-drop"></i>}</div>
      <div><span>0{index + 1}</span><h2>{concern.title}</h2><p>{concern.description}</p><Button kind="outline" onClick={() => navigate(concern.id)}>Learn More <span aria-hidden="true">→</span></Button></div>
    </article>)}</div>
    <p className="information-link"><strong>Don’t find your concern here?</strong> Visit our <button onClick={() => navigate('info')}>Information Page</button> to explore more menstrual health topics.</p>
  </section>;
}

const focusedConcernConfigs: Record<ConcernKind, { title: string; intro: string; note: string; questions: { label: string; type: 'choice' | 'text' | 'number'; options?: string[] }[] }> = {
  endometriosis: { title: 'Understanding Endometriosis', intro: 'Add details about pelvic pain and its impact without repeating information from your period log.', note: 'Symptoms vary widely, and a healthcare professional assesses possible causes. This page cannot diagnose endometriosis.', questions: [
    { label: 'Does pain affect everyday activities?', type: 'choice', options: choiceOptions }, { label: 'Pelvic pain outside menstruation', type: 'choice', options: frequencyOptions }, { label: 'Pain with bowel movements, especially around periods', type: 'choice', options: frequencyOptions }, { label: 'Pain with urination, especially around periods', type: 'choice', options: frequencyOptions }, { label: 'How long does pelvic pain usually last?', type: 'text' }, { label: 'Have these symptoms changed over time?', type: 'choice', options: ['Improved', 'Stayed similar', 'Worsened', 'Unsure'] },
  ]},
  dysmenorrhea: { title: 'Understanding Painful Periods', intro: 'Add timing and impact details that complement the pain score already stored in your period log.', note: 'Pain experiences are personal. Severe or worsening pain is worth discussing with a healthcare professional.', questions: [
    { label: 'When does pain usually begin?', type: 'choice', options: ['Before bleeding', 'When bleeding starts', 'Later during bleeding', 'Varies'] }, { label: 'How long does pain usually last?', type: 'text' }, { label: 'Where do you notice the pain?', type: 'text' }, { label: 'Impact on daily activities', type: 'choice', options: ['None', 'Mild', 'Moderate', 'Significant'] }, { label: 'Has the pain recently worsened?', type: 'choice', options: choiceOptions },
  ]},
  'heavy-bleeding': { title: 'Understanding Heavy Menstrual Bleeding', intro: 'Add disruption and safety context alongside flow and duration already available in your period history.', note: 'Seek prompt medical attention for faintness, severe weakness, sudden unusually heavy bleeding, or bleeding that feels unsafe.', questions: [
    { label: 'How often do you change menstrual products, if known?', type: 'text' }, { label: 'Does bleeding disrupt sleep?', type: 'choice', options: choiceOptions }, { label: 'Does bleeding disrupt everyday activities?', type: 'choice', options: choiceOptions }, { label: 'Have you noticed large clots?', type: 'choice', options: choiceOptions }, { label: 'Dizziness or unusual fatigue', type: 'choice', options: frequencyOptions }, { label: 'Is this bleeding pattern new or longstanding?', type: 'choice', options: ['New', 'Longstanding', 'Has changed', 'Unsure'] },
  ]},
  irregular: { title: 'Understanding Irregular Periods', intro: 'Add context about changes and missed periods without re-entering dates already stored in your tracker.', note: 'Cycle variation can have many causes. A calendar pattern alone cannot identify the reason.', questions: [
    { label: 'How much does your cycle length tend to vary?', type: 'text' }, { label: 'Missed periods in the past year, if known', type: 'number' }, { label: 'Longest gap between periods, if known', type: 'text' }, { label: 'What recent changes have you noticed?', type: 'text' }, { label: 'Relevant medicines or hormonal contraception, if you wish to disclose them', type: 'text' },
  ]},
};

export function ConcernDetailPage({ kind, profile, entries, onBack }: { kind: ConcernKind; profile: Profile | null; entries: PeriodEntry[]; onBack: () => void }) {
  const config = focusedConcernConfigs[kind];
  const [values, setValues] = useState<Record<string, string>>({});
  const [review, setReview] = useState(false);
  const update = (index: number, value: string) => setValues(previous => ({ ...previous, [index]: value }));
  return <section className={`specific-concern concern-theme-${kind}`}>
    <PageIntro eyebrow="MENSTRUAL HEALTH CONCERNS" title={config.title} text={config.intro} icon={kind} onBack={onBack} />
    <div className="medical-disclaimer"><strong>Educational symptom organiser.</strong><p>{config.note}</p></div>
    <HealthContext profile={profile} entries={entries} />
    <div className="progress-wrap"><div className="progress-meta"><span>{review ? 'Step 2 of 2' : 'Step 1 of 2'}</span><strong>{review ? 'Review' : 'Condition-specific context'}</strong></div><div className="progress-track"><i style={{ width: review ? '100%' : '50%' }}></i></div></div>
    <form className="health-questionnaire" onSubmit={event => event.preventDefault()}>{!review ? <div className="question-step"><h2>Additional details</h2><p>Every question is optional. Period dates, flow, pain scores, and general symptoms remain in your tracker and are not repeated here.</p>{config.questions.map((question, index) => question.type === 'choice' ? <ChoiceGroup key={question.label} label={question.label} name={String(index)} value={values[index] ?? ''} options={question.options ?? []} onChange={(_, value) => update(index, value)} optional /> : <TextField key={question.label} label={question.label} name={String(index)} value={values[index] ?? ''} type={question.type} onChange={(_, value) => update(index, value)} optional />)}<div className="step-actions"><Button onClick={() => { setReview(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Review My Entries <span aria-hidden="true">→</span></Button></div></div> : <div className="question-step review-step"><span className="review-mark">✓</span><h2>Your symptom notes are ready.</h2><p>This summary combines existing tracker context with condition-specific notes. It does not provide a diagnosis.</p><div className="single-review">{config.questions.map((question, index) => values[index] && <div key={question.label}><span>{question.label}</span><strong>{values[index]}</strong></div>)}{!Object.values(values).some(Boolean) && <p>No additional details were added. Your existing tracker context remains available above.</p>}</div><div className="step-actions"><Button kind="outline" onClick={() => setReview(false)}>Edit Responses</Button><Button onClick={onBack}>Back to Concerns</Button></div></div>}</form>
  </section>;
}
