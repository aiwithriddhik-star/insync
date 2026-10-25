export function ChoiceGroup({ label, name, value, options, onChange, optional = false }: { label: string; name: string; value: string; options: string[]; onChange: (name: string, value: string) => void; optional?: boolean }) {
  return <fieldset className="health-field"><legend>{label} {optional && <span>Optional</span>}</legend><div className="compact-choices">{options.map(option => <button type="button" aria-pressed={value === option} className={value === option ? 'selected' : ''} onClick={() => onChange(name, option)} key={option}>{option}</button>)}</div></fieldset>;
}

export function TextField({ label, name, value, onChange, type = 'text', optional = false, min, max, placeholder }: { label: string; name: string; value: string; onChange: (name: string, value: string) => void; type?: string; optional?: boolean; min?: number; max?: number; placeholder?: string }) {
  return <label className="health-field">{label} {optional && <span>Optional</span>}<input type={type} value={value} min={min} max={max} placeholder={placeholder} onChange={event => onChange(name, event.target.value)} /></label>;
}
