import type { PeriodEntry, Profile } from '../types';
import { formatDate } from '../utils/dates';

export function HealthContext({ profile, entries }: { profile: Profile | null; entries: PeriodEntry[] }) {
  const latest = entries[entries.length - 1];
  return <section className="health-context" aria-label="Information already available">
    <div><span className="eyebrow">ALREADY IN YOUR INSYNC HISTORY</span><h2>Your available context</h2><p>We use the information already entered in this session so you do not have to repeat it.</p></div>
    <div className="context-grid">
      <article><span>Profile</span><strong>{profile ? `${profile.name}, age ${profile.age}` : 'Not added yet'}</strong><small>{profile?.cycleLength ? `${profile.cycleLength}-day usual cycle` : 'No usual cycle length added'}</small></article>
      <article><span>Period history</span><strong>{entries.length ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : 'No entries yet'}</strong><small>{latest ? `Latest start: ${formatDate(latest.startDate)}` : 'You can still continue without an entry'}</small></article>
      <article><span>Latest tracked experience</span><strong>{latest ? `${latest.flow} flow · Pain ${latest.pain}/5` : 'No tracker data yet'}</strong><small>{latest?.symptoms.filter(item => item !== 'No other symptoms').join(', ') || 'No additional symptoms recorded'}</small></article>
    </div>
  </section>;
}
