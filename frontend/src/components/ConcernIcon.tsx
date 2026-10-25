export function ConcernIcon({ type, large = false }: { type: string; large?: boolean }) {
  return <svg className={`concern-icon ${large ? 'large' : ''}`} viewBox="0 0 96 96" role="img" aria-label={`${type} illustration`}>
    <circle cx="48" cy="48" r="44" className="icon-ground" />
    {type === 'pcos' && <><path className="icon-fill" d="M49 17c-6 12-19 28-19 42a19 19 0 0 0 38 0c0-14-13-30-19-42Z" /><circle className="icon-dot droplet-dot" cx="69" cy="24" r="5" /><path className="icon-line" d="M39 59c4 5 13 7 20 1" /></>}
    {type === 'endometriosis' && <><circle className="icon-line" cx="48" cy="48" r="23" /><path className="icon-line" d="M34 48c8-14 20-14 28 0-8 14-20 14-28 0Z" /><circle className="icon-dot" cx="48" cy="48" r="5" /></>}
    {type === 'dysmenorrhea' && <><path className="icon-line" d="M19 52c10-22 18 22 29 0s19 22 29 0" /><path className="icon-line soft" d="M23 67c9-15 17 15 26 0s16 15 24 0" /></>}
    {type === 'heavy-bleeding' && <><path className="icon-fill" d="M48 17c-6 14-20 28-20 43a20 20 0 0 0 40 0c0-15-14-29-20-43Z" /><path className="icon-line light" d="M38 62c4 6 13 8 20 2" /></>}
    {type === 'irregular' && <><circle className="icon-line" cx="48" cy="49" r="25" strokeDasharray="8 6" /><path className="icon-line" d="M48 33v17l12 8" /><circle className="icon-dot" cx="48" cy="49" r="4" /></>}
  </svg>;
}
