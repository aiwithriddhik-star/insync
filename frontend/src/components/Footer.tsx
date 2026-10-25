import type { Navigate } from '../types';
import { Logo } from './Logo';

const groups = [
  ['Explore', 'Cycle Health', 'Cycle Analysis', 'Symptom Tracking', 'Menstrual Health Basics'],
  ['Learn', 'Articles', 'Hormonal Health', 'Period Care', 'FAQs'],
  ['Company', 'About InSync', 'Contact', 'Privacy Policy', 'Terms of Use'],
  ['Support', 'Help Centre', 'Health Disclaimer', 'Data & Privacy'],
];

export function Footer({ navigate }: { navigate: Navigate }) {
  return <footer id="about">
    <div className="footer-grid">{groups.map(group => <div key={group[0]}><h4>{group[0]}</h4>{group.slice(1).map(item => item === 'Cycle Analysis'
      ? <a href="#analysis" onClick={event => { event.preventDefault(); navigate('analysis'); }} key={item}>{item}</a>
      : <a href="#" key={item}>{item}</a>)}</div>)}</div>
    <div className="footer-bottom"><Logo /><span>© 2025 InSync Health</span><span>Your health journey belongs to you.</span><span>○ ◇ ◎</span></div>
  </footer>;
}
