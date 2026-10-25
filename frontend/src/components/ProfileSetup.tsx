import { useState } from 'react';
import type { Profile } from '../types';
import { todayInput } from '../utils/dates';
import { Button } from './Button';

export function ProfileSetup({ initial, onSave, onBack }: { initial?: Profile | null; onSave: (profile: Profile) => void; onBack?: () => void }) {
  const [values, setValues] = useState<Profile>(initial ?? { name: '', age: '', height: '', weight: '', firstPeriodDate: '', cycleLength: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const update = (key: keyof Profile, value: string) => {
    setValues(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: '' }));
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const age = Number(values.age);
    if (!values.name.trim()) next.name = 'Add the name you would like us to use.';
    if (!values.age) next.age = 'Add your age to continue.';
    else if (age < 10 || age > 100) next.age = 'Enter an age between 10 and 100.';
    if (values.height && (Number(values.height) < 80 || Number(values.height) > 250)) next.height = 'Enter a height between 80 and 250 cm.';
    if (values.weight && (Number(values.weight) < 20 || Number(values.weight) > 350)) next.weight = 'Enter a weight between 20 and 350 kg.';
    if (values.cycleLength && (Number(values.cycleLength) < 15 || Number(values.cycleLength) > 90)) next.cycleLength = 'Choose a cycle length between 15 and 90 days.';
    setErrors(next);
    if (!Object.keys(next).length) onSave({ ...values, name: values.name.trim() });
  };
  const field = (key: keyof Profile, label: string, type: string, optional = true, props: Record<string, string | number> = {}) => <label className="profile-field">{label} <span>{optional ? 'Optional' : 'Required'}</span><input type={type} value={values[key]} onChange={event => update(key, event.target.value)} aria-invalid={!!errors[key]} {...props} />{errors[key] && <small className="field-error">{errors[key]}</small>}</label>;

  return <section className="profile-setup">
    {onBack && <Button kind="text" onClick={onBack}>← Back</Button>}
    <div className="profile-welcome"><span className="eyebrow">YOUR INSYNC EXPERIENCE</span><h1>Let’s get to <em>know you.</em></h1><p>A few details will help us personalise your menstrual health tracking experience.</p></div>
    <form className="profile-card" onSubmit={submit} noValidate>
      <div className="profile-grid">
        {field('name', 'Name', 'text', false, { placeholder: 'Your name' })}
        {field('age', 'Age', 'number', false, { min: 10, max: 100, placeholder: 'e.g. 24' })}
        {field('height', 'Height (cm)', 'number', true, { min: 80, max: 250, placeholder: 'e.g. 165' })}
        {field('weight', 'Weight (kg)', 'number', true, { min: 20, max: 350, placeholder: 'e.g. 65' })}
        {field('firstPeriodDate', 'Date of first period', 'date', true, { max: todayInput() })}
        <div className="cycle-length-field">{field('cycleLength', 'Usual cycle length (days)', 'number', true, { min: 15, max: 90, placeholder: 'e.g. 28' })}<div className="cycle-help"><span aria-hidden="true">i</span><p><strong>What is cycle length?</strong> Your menstrual cycle is counted from the first day of one period to the first day of your next period. For example, if one period starts on the 1st and your next starts on the 29th, your cycle length is 28 days.</p></div></div>
      </div>
      <div className="profile-note"><strong>Your details stay in this session.</strong><p>Height and weight are always optional. InSync does not use body-size labels or make weight-based judgements.</p></div>
      <Button type="submit">{initial ? 'Save Profile' : 'Continue to My Cycle'} <span aria-hidden="true">→</span></Button>
    </form>
  </section>;
}
