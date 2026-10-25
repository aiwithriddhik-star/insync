import { useRef, useState } from 'react';
import { Button } from '../components/Button';
import { formatDate } from '../utils/dates';

type SelectedReport = { kind: 'user' | 'sample'; name: string; type: string; size: number };
type ReportHistory = { id: number; title: string; category: string; date: string };

const categories = ['Complete Blood Count (CBC)', 'Thyroid Function', 'Hormone Tests', 'Blood Glucose', 'Vitamin and Nutrient Tests', 'Other'];
const maxFileSize = 10 * 1024 * 1024;
const sampleTests = [
  { name: 'Haemoglobin', result: '11.2', unit: 'g/dL', range: '12.0–15.5 g/dL', status: 'Below the provided range', tone: 'below', measures: 'Haemoglobin is a protein in red blood cells that carries oxygen around the body.', meaning: 'In this fictional sample, the reported value is below the range printed by the sample laboratory. This does not identify a cause on its own.', ordered: 'A clinician may include it in a Complete Blood Count to review oxygen-carrying red blood cells.', factors: 'Hydration, menstrual blood loss, nutrition, pregnancy, medicines, and other health factors can affect the result.', limits: 'One haemoglobin result cannot diagnose the reason for a change or describe overall health.' },
  { name: 'White Blood Cell Count', result: '6.8', unit: '×10⁹/L', range: '4.0–11.0 ×10⁹/L', status: 'Within the provided range', tone: 'within', measures: 'White blood cells are part of the immune system and help the body respond to infection and inflammation.', meaning: 'This fictional value falls within the reference range printed on the sample report.', ordered: 'It is commonly included in a Complete Blood Count to review the number of circulating white blood cells.', factors: 'Infections, inflammation, stress, medicines, and the timing of a test can influence the result.', limits: 'A value within a range does not rule out illness or explain symptoms on its own.' },
  { name: 'Mean Corpuscular Volume (MCV)', result: '82', unit: 'fL', range: '80–100 fL', status: 'Within the provided range', tone: 'within', measures: 'MCV describes the average size of red blood cells.', meaning: 'This fictional value sits within the reference range supplied on the sample report.', ordered: 'Clinicians may review MCV alongside haemoglobin and other red-cell measurements when considering blood health.', factors: 'Iron, vitamin B12, folate, inherited traits, and several health conditions may influence red-cell size.', limits: 'MCV cannot explain a symptom or determine a diagnosis without other information.' },
  { name: 'Platelet Count', result: '430', unit: '×10⁹/L', range: '150–400 ×10⁹/L', status: 'Above the provided range', tone: 'above', measures: 'Platelets are small cell fragments involved in normal blood clotting.', meaning: 'In this fictional sample, the value is above the laboratory range printed on the report. A single result does not show why.', ordered: 'Platelets are usually included in a Complete Blood Count to review the cells involved in clotting.', factors: 'Recent illness, inflammation, iron status, medicines, and laboratory variation can affect a result.', limits: 'This result alone cannot identify a condition or determine whether treatment is needed.' },
  { name: 'Ferritin', result: '18', unit: 'ng/mL', range: '', status: 'Range not provided', tone: 'unknown', measures: 'Ferritin is a protein that stores iron and can provide information about the body’s iron stores.', meaning: 'The fictional sample does not provide a reference range, so InSync does not classify this value.', ordered: 'A clinician may order ferritin when reviewing iron stores, fatigue, or blood-loss history.', factors: 'Inflammation, infection, liver health, iron intake, supplements, and blood loss can influence ferritin.', limits: 'Ferritin requires clinical context and cannot be interpreted from the number alone.' },
];
const glossary = [
  { term: 'CBC', explanation: 'Complete Blood Count. A group of tests that measures several types of cells in the blood.', context: 'It commonly includes red blood cells, white blood cells, haemoglobin, and platelets.' },
  { term: 'Reference range', explanation: 'The interval a laboratory provides to help clinicians compare a result with values seen in a reference population.', context: 'Ranges can vary by laboratory, method, age, pregnancy status, and clinical context.' },
  { term: 'Haemoglobin', explanation: 'A protein in red blood cells that carries oxygen.', context: 'It appears in a CBC and is considered alongside symptoms and other red-cell measurements.' },
  { term: 'MCV', explanation: 'Mean Corpuscular Volume. It describes the average size of red blood cells.', context: 'Clinicians often interpret it together with haemoglobin and other measurements.' },
  { term: 'Ferritin', explanation: 'A protein that stores iron in the body.', context: 'Ferritin can be influenced by iron stores as well as inflammation and other health factors.' },
];
const initialQuestions = [
  'What does this result mean in the context of my symptoms?',
  'Is this result significant for my age and medical history?',
  'Do I need any follow-up testing?',
  'Could medications or other factors affect this result?',
];

function FileIcon() {
  return <svg className="report-file-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M17 7h21l10 10v40H17z" /><path d="M38 7v12h12M24 30h17M24 38h17M24 46h11" /></svg>;
}

export function ReportPage({ onBack }: { onBack: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<SelectedReport | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const [details, setDetails] = useState({ title: '', category: '', date: '' });
  const [analysis, setAnalysis] = useState<'none' | 'demo' | 'unavailable'>('none');
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [questions, setQuestions] = useState(initialQuestions);
  const [newQuestion, setNewQuestion] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [glossarySearch, setGlossarySearch] = useState('');

  const validateFile = (file?: File) => {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['pdf', 'jpg', 'jpeg', 'png'].includes(extension)) {
      setFileError('Choose a PDF, JPG, JPEG, or PNG file.');
      return;
    }
    if (file.size > maxFileSize) {
      setFileError('This file is larger than 10 MB. Choose a smaller file.');
      return;
    }
    setSelected({ kind: 'user', name: file.name, type: extension.toUpperCase(), size: file.size });
    setDetails({ title: '', category: '', date: '' });
    setAnalysis('none');
    setFileError('');
  };
  const removeFile = () => {
    setSelected(null);
    setDetails({ title: '', category: '', date: '' });
    setAnalysis('none');
    setFileError('');
    if (inputRef.current) inputRef.current.value = '';
  };
  const loadSample = () => {
    setSelected({ kind: 'sample', name: 'fictional-cbc-sample.pdf', type: 'PDF · Fictional demo', size: 428000 });
    setDetails({ title: 'Fictional CBC Wellness Panel', category: 'Complete Blood Count (CBC)', date: '2025-02-14' });
    setAnalysis('none');
    setFileError('');
  };
  const understand = () => {
    if (!selected) return;
    if (selected.kind === 'user') {
      setAnalysis('unavailable');
      return;
    }
    setAnalysis('demo');
    setHistory(previous => previous.some(report => report.title === (details.title || 'Fictional CBC Wellness Panel')) ? previous : [...previous, { id: Date.now(), title: details.title || 'Fictional CBC Wellness Panel', category: details.category || 'Complete Blood Count (CBC)', date: details.date }]);
    requestAnimationFrame(() => document.getElementById('report-results')?.scrollIntoView({ behavior: 'smooth' }));
  };
  const copyQuestions = async () => {
    try {
      await navigator.clipboard.writeText(questions.filter(Boolean).map(question => `• ${question}`).join('\n'));
      setCopyMessage('Questions copied to your clipboard.');
    } catch {
      setCopyMessage('Copy is unavailable in this browser. You can select the questions manually.');
    }
  };
  const filteredGlossary = glossary.filter(item => `${item.term} ${item.explanation}`.toLowerCase().includes(glossarySearch.toLowerCase()));

  return <section className="lab-page">
    <header className="lab-hero">
      <Button kind="text" onClick={onBack}>← Back</Button>
      <div className="lab-title-row"><div><span className="eyebrow">LAB REPORT SIMPLIFIER</span><h1>Understand Your <em>Lab Reports.</em></h1><p className="lab-subtitle">Medical reports can feel complicated. Turn your test results into clear, easy-to-understand information.</p><p>Upload a report to explore what the terms mean, understand the reference ranges, and prepare questions for your next appointment.</p></div><div className="privacy-seal"><span aria-hidden="true">i</span><strong>Private by design</strong><p>Your health information is personal. This prototype does not send your files to a server or provide a clinical diagnosis.</p></div></div>
    </header>

    <section className="lab-section upload-section">
      <div className="lab-section-heading"><span className="eyebrow">START HERE</span><h2>Upload a Lab Report</h2><p>Choose a report from your device or drag and drop it here.</p></div>
      <div className={`drop-zone ${dragging ? 'dragging' : ''} ${selected ? 'has-file' : ''}`} onDragEnter={event => { event.preventDefault(); setDragging(true); }} onDragOver={event => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); validateFile(event.dataTransfer.files[0]); }}>
        <FileIcon />
        {!selected ? <><h3>Drop your report here</h3><p>PDF, JPG, JPEG, or PNG · Maximum 10 MB</p><input ref={inputRef} id="lab-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={event => validateFile(event.target.files?.[0])} /><label className="btn primary" htmlFor="lab-file">Browse Files</label><button className="sample-report-button" onClick={loadSample}>Try a Sample Report</button></> : <div className="selected-report"><div><span>{selected.kind === 'sample' ? 'Fictional sample selected' : 'File ready on this device'}</span><strong>{selected.name}</strong><small>{selected.type} · {formatFileSize(selected.size)}</small></div><button onClick={removeFile}>Remove File</button></div>}
      </div>
      {fileError && <div className="lab-error" role="alert">{fileError}</div>}
      <p className="upload-caveat">Selecting a file does not read or analyse its contents. Nothing is uploaded or sent to another service.</p>
    </section>

    {selected && <section className="lab-section report-details">
      <div className="lab-section-heading"><span className="eyebrow">OPTIONAL CONTEXT</span><h2>Report details</h2><p>Add details to organise this report. You can leave every field blank.</p></div>
      <div className="report-detail-grid"><label>Report title <span>Optional</span><input value={details.title} onChange={event => setDetails({ ...details, title: event.target.value })} placeholder="e.g. Annual blood tests" /></label><label>Test category <span>Optional</span><select value={details.category} onChange={event => setDetails({ ...details, category: event.target.value })}><option value="">Select a category</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label>Report date <span>Optional</span><input type="date" value={details.date} onChange={event => setDetails({ ...details, date: event.target.value })} /></label></div>
      <div className="understand-action"><Button onClick={understand}>Understand My Report →</Button><small>{selected.kind === 'sample' ? 'Opens a fictional demonstration analysis.' : 'Your file will remain local; automated extraction is not connected.'}</small></div>
      {analysis === 'unavailable' && <div className="integration-notice" role="status"><span aria-hidden="true">i</span><div><strong>Automated analysis is not connected in this prototype.</strong><p>Your selected file has not been read. Secure text extraction and summarisation would require a future document-processing integration. Try the fictional sample report to explore the interface without using personal health information.</p><Button kind="outline" onClick={loadSample}>Try a Sample Report</Button></div></div>}
    </section>}

    {analysis === 'demo' && <div id="report-results">
      <section className="lab-section report-overview">
        <div><span className="sample-badge">Sample Analysis · Fictional</span><h2>Your Report, Simplified</h2><p>This fictional sample contains several blood test measurements. Each measurement is compared with the laboratory’s supplied reference range. Results outside a range do not automatically mean that something is wrong, and results inside a range do not describe overall health.</p></div><dl><div><dt>Report</dt><dd>{details.title || 'Fictional CBC Wellness Panel'}</dd></div><div><dt>Category</dt><dd>{details.category || 'Complete Blood Count (CBC)'}</dd></div>{details.date && <div><dt>Report date</dt><dd>{new Date(`${details.date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>}</dl>
      </section>

      <section className="lab-section">
        <div className="lab-section-heading"><span className="eyebrow">FICTIONAL SAMPLE DATA</span><h2>Your Results, Explained</h2><p>Statuses compare only with the reference range printed in this fictional sample.</p></div>
        <div className="test-results">{sampleTests.map(test => <article key={test.name}><div className="test-card-head"><div><span>Test measurement</span><h3>{test.name}</h3></div><span className={`range-status ${test.tone}`}>{test.status}</span></div><div className="test-numbers"><div><span>Reported result</span><strong>{test.result} <small>{test.unit}</small></strong></div><div><span>Laboratory reference range</span><strong>{test.range || 'Reference range unavailable'}</strong></div></div><p>{test.measures}</p><div className="plain-meaning"><strong>In simple language</strong><p>{test.meaning}</p></div><details><summary>Learn More</summary><dl><div><dt>What it measures</dt><dd>{test.measures}</dd></div><div><dt>Why it may be ordered</dt><dd>{test.ordered}</dd></div><div><dt>What can affect it</dt><dd>{test.factors}</dd></div><div><dt>What it cannot tell you alone</dt><dd>{test.limits}</dd></div></dl></details></article>)}</div>
      </section>

      <section className="lab-section terminology-section">
        <div className="lab-section-heading"><span className="eyebrow">PLAIN LANGUAGE</span><h2>Medical Terms, in Simple Language</h2><p>Search the fictional sample glossary or expand an entry for context.</p></div>
        <label className="glossary-search">Search the Medical Jargon Glossary<input value={glossarySearch} onChange={event => setGlossarySearch(event.target.value)} placeholder="Search terms such as MCV or ferritin" /></label>
        <div className="glossary-list">{filteredGlossary.map(item => <details key={item.term}><summary><strong>{item.term}</strong><span>{item.explanation}</span></summary><p>{item.context}</p></details>)}{!filteredGlossary.length && <div className="glossary-empty">No glossary terms match that search.</div>}</div>
      </section>

      <section className="lab-section takeaways-section">
        <div className="lab-section-heading"><span className="eyebrow">EDUCATIONAL SUMMARY</span><h2>Key Takeaways</h2></div>
        <div className="takeaway-grid"><article><span>2</span><div><strong>Within supplied ranges</strong><p>White Blood Cell Count and MCV fall within the ranges printed in this fictional report.</p></div></article><article><span>2</span><div><strong>Outside supplied ranges</strong><p>Haemoglobin is below and Platelet Count is above the fictional laboratory ranges. This does not identify a cause.</p></div></article><article><span>1</span><div><strong>Cannot be classified</strong><p>Ferritin has no reference range in the sample, so its value is not classified.</p></div></article><article><span>i</span><div><strong>Context still matters</strong><p>Reference ranges can vary by laboratory, age, pregnancy status, test method, and clinical context.</p></div></article></div>
      </section>

      <section className="lab-section questions-section">
        <div className="lab-section-heading"><div><span className="eyebrow">PREPARE FOR CARE</span><h2>Questions for Your Next Appointment</h2><p>Edit these suggestions or add your own. InSync does not recommend medication changes or treatment.</p></div><Button kind="outline" onClick={copyQuestions}>Copy Questions</Button></div>
        {copyMessage && <div className="copy-feedback" role="status">{copyMessage}</div>}
        <div className="question-editor">{questions.map((question, index) => <div key={index}><span>{String(index + 1).padStart(2, '0')}</span><input aria-label={`Question ${index + 1}`} value={question} onChange={event => setQuestions(previous => previous.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /><button onClick={() => setQuestions(previous => previous.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove question ${index + 1}`}>Remove</button></div>)}</div>
        <form className="add-question" onSubmit={event => { event.preventDefault(); if (newQuestion.trim()) { setQuestions(previous => [...previous, newQuestion.trim()]); setNewQuestion(''); } }}><label>Add your own question<input value={newQuestion} onChange={event => setNewQuestion(event.target.value)} placeholder="What would you like to ask?" /></label><Button type="submit">Add Question</Button></form>
      </section>
    </div>}

    <section className="lab-section reports-history">
      <div className="lab-section-heading"><div><span className="eyebrow">THIS SESSION ONLY</span><h2>My Reports</h2><p>Only fictional demo reports opened during this session appear here. No documents are stored permanently.</p></div></div>
      {!history.length ? <div className="lab-empty"><FileIcon /><h3>No demo reports opened yet.</h3><p>Try the fictional sample report to see how a simplified report could be organised.</p><Button kind="outline" onClick={loadSample}>Try a Sample Report</Button></div> : <div className="report-history-list">{history.map(report => <article key={report.id}><div><span className="sample-badge">Demo</span><h3>{report.title}</h3><p>{report.category}{report.date ? ` · ${formatDate(report.date)}` : ''}</p></div><div><button onClick={() => { setSelected({ kind: 'sample', name: 'fictional-cbc-sample.pdf', type: 'PDF · Fictional demo', size: 428000 }); setDetails({ title: report.title, category: report.category, date: report.date }); setAnalysis('demo'); requestAnimationFrame(() => document.getElementById('report-results')?.scrollIntoView({ behavior: 'smooth' })); }}>View Summary</button><button className="danger" onClick={() => setHistory(previous => previous.filter(item => item.id !== report.id))}>Remove</button></div></article>)}</div>}
    </section>

    <section className="lab-safety"><span aria-hidden="true">i</span><div><h2>Important medical and privacy information</h2><p>This educational demonstration does not diagnose conditions, interpret real uploaded files, recommend treatment, or replace a qualified healthcare professional. A result inside or outside a reference range needs clinical context. Discuss uncertain or concerning findings with a healthcare professional.</p></div></section>
  </section>;
}

function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
