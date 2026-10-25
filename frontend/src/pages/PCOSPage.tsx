import { useState } from 'react';
import { estimatePsoc, type PsocPayload, type PsocResponse } from '../api/insync';
import type { PeriodEntry, Profile } from '../types';
import { Button } from '../components/Button';
import { ChoiceGroup, TextField } from '../components/FormFields';
import { HealthContext } from '../components/HealthContext';
import { PageIntro } from '../components/PageIntro';

export function PCOSPage({ profile, entries, onBack, onInformation }: { profile: Profile | null; entries: PeriodEntry[]; onBack: () => void; onInformation: () => void }) {
  const sections = ['Cycle context', 'Skin, hair & body changes', 'Measurements & routine', 'Clinical report details', 'Review'];
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [values, setValues] = useState<Record<string, string>>({ age: profile?.age ?? '', weight: profile?.weight ?? '', cycleLength: profile?.cycleLength ?? '' });
  const set = (name: string, value: string) => {
    setValues(previous => ({ ...previous, [name]: value }));
    setError('');
  };
  const next = () => {
    const numericChecks: Record<number, { key: string; min: number; max: number; label: string }[]> = {
      0: [{ key: 'age', min: 10, max: 100, label: 'age' }, { key: 'weight', min: 20, max: 350, label: 'weight' }, { key: 'bmi', min: 10, max: 80, label: 'BMI' }, { key: 'cycleLength', min: 15, max: 90, label: 'cycle length' }],
      2: [{ key: 'waist', min: 10, max: 100, label: 'waist measurement' }, { key: 'hip', min: 10, max: 100, label: 'hip measurement' }],
      3: [{ key: 'amh', min: 0, max: 100, label: 'AMH result' }, { key: 'follicleRight', min: 0, max: 100, label: 'right ovarian follicle count' }, { key: 'follicleLeft', min: 0, max: 100, label: 'left ovarian follicle count' }],
    };
    const invalid = (numericChecks[step] ?? []).find(check => values[check.key] && (Number(values[check.key]) < check.min || Number(values[check.key]) > check.max));
    if (invalid) {
      setError(`Check the ${invalid.label}. Enter a value between ${invalid.min} and ${invalid.max}, or leave it blank.`);
      return;
    }
    setStep(current => Math.min(4, current + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const labels: Record<string, string> = {
    age: 'Age', weight: 'Weight', bmi: 'BMI', cycleLength: 'Usual cycle length', cyclePattern: 'Cycle pattern',
    skinDarkening: 'Darkened or thickened skin patches', hairGrowth: 'Increased coarse facial or body hair', weightGain: 'Recent weight gain',
    pimples: 'Persistent or worsening acne or pimples', hairLoss: 'Scalp hair thinning or increased hair loss',
    waist: 'Waist measurement', hip: 'Hip measurement', fastFood: 'Fast food in usual eating routine',
    amh: 'AMH result', follicleRight: 'Right ovarian follicle count', follicleLeft: 'Left ovarian follicle count', reportDate: 'Clinical report date',
  };
  const [estimate, setEstimate] = useState<PsocResponse | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState('');
  const num = (key: string) => values[key] !== undefined && values[key] !== '' && Number.isFinite(Number(values[key])) ? Number(values[key]) : null;
  const yn = (key: string) => { const value = values[key]; return value === 'Yes' ? 1 : value === 'No' ? 0 : null; };
  const buildPayload = (): PsocPayload => {
    // Profile height is stored in centimetres.
    const heightCm = Number(profile?.height);
    let bmi = num('bmi');
    const weight = num('weight');
    if (bmi === null && weight !== null && heightCm > 0) bmi = Math.round((weight / (heightCm / 100) ** 2) * 10) / 10;
    return {
      'Age (yrs)': num('age'), 'Weight (Kg)': weight, 'BMI': bmi, 'Cycle length(days)': num('cycleLength'),
      'Waist(inch)': num('waist'), 'Hip(inch)': num('hip'), 'AMH(ng/mL)': num('amh'), 'Follicle No. (R)': num('follicleRight'), 'Follicle No. (L)': num('follicleLeft'),
      'Skin darkening (Y/N)': yn('skinDarkening'), 'hair growth(Y/N)': yn('hairGrowth'), 'Weight gain(Y/N)': yn('weightGain'), 'Pimples(Y/N)': yn('pimples'), 'Hair loss(Y/N)': yn('hairLoss'),
      'Fast food (Y/N)': values.fastFood === 'Yes' || values.fastFood === 'Sometimes' ? 1 : values.fastFood === 'No' ? 0 : null,
      'Cycle(R/I)': values.cyclePattern === 'Usually regular' ? 2 : values.cyclePattern === 'Often irregular' ? 4 : null,
    };
  };
  const getEstimate = async () => {
    setEstimating(true);
    setEstimateError('');
    setEstimate(null);
    try {
      setEstimate(await estimatePsoc(buildPayload()));
    } catch (caught) {
      setEstimateError(`${(caught as Error).message || 'The estimate could not be produced.'} Your summary above is unaffected.`);
    } finally {
      setEstimating(false);
    }
  };
  const reported = Object.entries(values).filter(([, value]) => value);

  return <section className="pcos-page criteria-pcos-page">
    <PageIntro eyebrow="MENSTRUAL HEALTH CONCERNS" title="Understanding PCOS" icon="pcos" onBack={onBack} text="Organise cycle information, PCOS-associated signs, optional measurements, and findings from existing clinical reports in one respectful summary." />
    <div className="medical-disclaimer"><strong>Educational tracking, not diagnosis.</strong><p>No single response, body measurement, hormone result, or ultrasound finding can diagnose PCOS. A qualified healthcare professional considers symptoms, history, examination, and appropriate clinical tests together.</p></div>
    <HealthContext profile={profile} entries={entries} />
    <div className="progress-wrap"><div className="progress-meta"><span>Section {step + 1} of {sections.length}</span><strong>{sections[step]}</strong></div><div className="progress-track"><i style={{ width: `${((step + 1) / sections.length) * 100}%` }}></i></div></div>
    <form className="health-questionnaire" onSubmit={event => event.preventDefault()}>
      {step === 0 && <div className="question-step"><h2>Cycle and personal context</h2><p>Profile values are filled in where available, so you do not need to remember or re-enter them. Every field remains optional.</p><div className="health-grid"><TextField label="Age in years" name="age" type="number" min={10} max={100} optional value={values.age ?? ''} onChange={set} /><TextField label="Weight in kilograms" name="weight" type="number" min={20} max={350} optional value={values.weight ?? ''} onChange={set} /><TextField label="BMI, if already known" name="bmi" type="number" min={10} max={80} optional value={values.bmi ?? ''} onChange={set} /><TextField label="Usual cycle length in days" name="cycleLength" type="number" min={15} max={90} optional value={values.cycleLength ?? ''} onChange={set} /></div><ChoiceGroup label="How would you describe your cycle pattern?" name="cyclePattern" value={values.cyclePattern ?? ''} options={['Usually regular', 'Often irregular', 'Unsure']} onChange={set} optional /><p className="criteria-note">Cycle length means the number of days from the first day of one period to the first day of the next. Your saved period history remains available above.</p></div>}
      {step === 1 && <div className="question-step"><h2>Skin, hair, and body changes</h2><p>Choose the response that best matches what you have noticed. These signs can have many causes and are not proof of PCOS.</p><ChoiceGroup label="Have you noticed darkened or thickened skin patches, such as around the neck or underarms?" name="skinDarkening" value={values.skinDarkening ?? ''} options={['Yes', 'No', 'Unsure', 'Prefer not to say']} onChange={set} optional /><ChoiceGroup label="Have you noticed increased coarse facial or body hair growth?" name="hairGrowth" value={values.hairGrowth ?? ''} options={['Yes', 'No', 'Unsure', 'Prefer not to say']} onChange={set} optional /><ChoiceGroup label="Have you noticed recent weight gain?" name="weightGain" value={values.weightGain ?? ''} options={['Yes', 'No', 'Unsure', 'Prefer not to say']} onChange={set} optional /><ChoiceGroup label="Have you experienced persistent or worsening acne or pimples?" name="pimples" value={values.pimples ?? ''} options={['Yes', 'No', 'Unsure', 'Prefer not to say']} onChange={set} optional /><ChoiceGroup label="Have you noticed scalp hair thinning or increased hair loss?" name="hairLoss" value={values.hairLoss ?? ''} options={['Yes', 'No', 'Unsure', 'Prefer not to say']} onChange={set} optional /></div>}
      {step === 2 && <div className="question-step"><h2>Optional measurements and eating routine</h2><p>These fields provide context only. Body size and food choices do not define PCOS and are not treated as causes.</p><div className="health-grid"><TextField label="Waist measurement in inches" name="waist" type="number" min={10} max={100} optional value={values.waist ?? ''} onChange={set} /><TextField label="Hip measurement in inches" name="hip" type="number" min={10} max={100} optional value={values.hip ?? ''} onChange={set} /></div><ChoiceGroup label="Is fast food regularly part of your usual eating routine?" name="fastFood" value={values.fastFood ?? ''} options={['Yes', 'No', 'Sometimes', 'Prefer not to say']} onChange={set} optional /><p className="criteria-note">This optional question provides general context only. InSync does not label foods as good or bad or assign responsibility for a health condition.</p></div>}
      {step === 3 && <div className="question-step clinical-step"><h2>Optional: findings from an existing clinical report</h2><p>Only enter values if they already appear on a clinician-provided laboratory or ultrasound report. InSync does not interpret them as normal, abnormal, or diagnostic.</p><details open><summary>Hormone result <span>Optional</span></summary><div className="health-grid"><TextField label="AMH (Anti-Müllerian hormone) result in ng/mL" name="amh" type="number" min={0} max={100} optional value={values.amh ?? ''} onChange={set} /><TextField label="Clinical report date" name="reportDate" type="date" optional value={values.reportDate ?? ''} onChange={set} /></div></details><details open><summary>Ultrasound follicle counts <span>Optional</span></summary><p className="detail-note">Enter only follicle counts explicitly stated in an existing ultrasound report. Follicle counts alone cannot diagnose PCOS.</p><div className="health-grid"><TextField label="Follicle count reported for the right ovary" name="follicleRight" type="number" min={0} max={100} optional value={values.follicleRight ?? ''} onChange={set} /><TextField label="Follicle count reported for the left ovary" name="follicleLeft" type="number" min={0} max={100} optional value={values.follicleLeft ?? ''} onChange={set} /></div></details></div>}
      {step === 4 && <div className="question-step review-step"><span className="review-mark">✓</span><h2>Your PCOS discussion summary is ready.</h2><p>This summary can help organise information for a healthcare appointment. It does not confirm or rule out PCOS. You can optionally request a research model estimate below; it is not a diagnosis.</p><div className="single-review">{reported.map(([key, value]) => <div key={key}><span>{labels[key] ?? key}</span><strong>{value}{key === 'weight' ? ' kg' : key === 'cycleLength' ? ' days' : key === 'waist' || key === 'hip' ? ' in' : key === 'amh' ? ' ng/mL' : ''}</strong></div>)}{!reported.length && <p>No optional entries were added. Your saved profile and period context remain available above.</p>}</div><div className="model-actions"><Button kind="outline" onClick={getEstimate} disabled={estimating}>{estimating ? 'Calculating estimate…' : 'Get research model estimate'}</Button></div>{estimateError && <div className="lab-error" role="alert">{estimateError}</div>}{estimate && <div className="model-estimate" role="status"><span className="sample-badge">Research model · not a diagnosis</span><h3>Research model estimate</h3><div className="estimate-value"><strong>{Math.round(estimate.pcos_probability * 100)}%</strong><span>model-estimated likelihood</span></div><p>This number comes from an experimental research model. It is not a diagnosis, does not confirm or rule out PCOS, and should not guide decisions about your care on its own. Please discuss your symptoms and any results with a clinician.</p><ul className="estimate-caveats"><li>The model was trained on a small clinical dataset from one population, so it may not reflect your situation.</li><li>{estimate.missing_fields.length ? `${estimate.missing_fields.length} field${estimate.missing_fields.length === 1 ? ' was' : 's were'} left blank and filled with typical values, which makes the estimate less reliable.` : 'All fields were provided.'}</li><li>Only Yes and No answers are used; Unsure, Sometimes (except fast food), and Prefer not to say are treated as blank.</li></ul></div>}<div className="step-actions"><Button kind="outline" onClick={() => setStep(0)}>Edit Responses</Button><Button onClick={onInformation}>Learn About PCOS <span aria-hidden="true">→</span></Button></div></div>}
      {error && <span className="field-error criteria-error">{error}</span>}
      {step < 4 && <div className="step-actions">{step > 0 && <Button kind="outline" onClick={() => { setStep(current => current - 1); setError(''); }}>Previous</Button>}<Button onClick={next}>{step === 3 ? 'Review My Entries' : 'Continue'} <span aria-hidden="true">→</span></Button></div>}
    </form>
  </section>;
}
