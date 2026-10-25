import { useEffect, useState } from 'react';
import { PageIntro } from '../components/PageIntro';
import { ResearchWordCloud } from '../components/ResearchWordCloud';

const articles = [
  { category: 'Cycle basics', title: 'Understanding cycle variation', text: 'Learn why cycle length and symptoms can differ from person to person.' },
  { category: 'Symptoms', title: 'When period pain affects daily life', text: 'Prepare useful notes for a supportive conversation with a healthcare professional.' },
  { category: 'Bleeding', title: 'Tracking changes in menstrual flow', text: 'Explore practical ways to record duration, flow, and changes over time.' },
  { category: 'Hormonal health', title: 'Understanding PCOS', text: 'Read an educational overview of PCOS symptoms, assessment, and supportive care.', id: 'pcos-education' },
  { category: 'Pelvic health', title: 'Endometriosis and pelvic pain', text: 'Learn about symptoms that may be useful to discuss with a clinician.' },
  { category: 'Appointments', title: 'Preparing for a health appointment', text: 'Turn your cycle notes into a clear, useful symptom history.' },
];


export function LearnPage({ onBack, focus }: { onBack: () => void; focus?: string }) {
  const [filter, setFilter] = useState('All topics');
  const topics = ['All topics', ...Array.from(new Set(articles.map(article => article.category)))];
  const visible = filter === 'All topics' ? articles : articles.filter(article => article.category === filter);

  useEffect(() => {
    if (focus) requestAnimationFrame(() => document.getElementById(focus)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }, [focus]);

  return <section className="information-page">
    <PageIntro eyebrow="INSYNC INFORMATION" title="Learn about your menstrual health." text="Explore clear, supportive information designed to help you understand patterns and prepare informed questions for a healthcare professional." onBack={onBack} />
    <ResearchWordCloud />
    <div className="article-filters">{topics.map(topic => <button className={filter === topic ? 'selected' : ''} aria-pressed={filter === topic} onClick={() => setFilter(topic)} key={topic}>{topic}</button>)}</div>
    <div className="article-grid">{visible.map(article => <article id={article.id} key={article.title}><span>{article.category}</span><h2>{article.title}</h2><p>{article.text}</p><button>Read article <i aria-hidden="true">→</i></button></article>)}</div>
    <div className="medical-disclaimer"><strong>Information supports, but does not replace, care.</strong><p>InSync provides educational information and does not diagnose conditions or replace personalised advice from a qualified healthcare professional.</p></div>
  </section>;
}
