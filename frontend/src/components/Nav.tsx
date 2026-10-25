import { useState } from 'react';
import type { Navigate, Page } from '../types';
import { Button } from './Button';
import { Logo } from './Logo';

const links: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' },
  { label: 'My Cycle', page: 'analysis' },
  { label: 'Care Budget', page: 'care-budget' },
  { label: 'Report Simplifier', page: 'lab-report' },
  { label: 'Learn More', page: 'info' },
];

export function Nav({ navigate, current, hasProfile = false }: { navigate: Navigate; current: Page; hasProfile?: boolean }) {
  const [open, setOpen] = useState(false);
  const go = (page: Page) => () => { setOpen(false); navigate(page); };
  return <nav>
    <Logo />
    <div className={`navlinks ${open ? 'open' : ''}`}>
      {links.map(link => <button key={link.page} onClick={go(link.page)} aria-current={current === link.page ? 'page' : undefined}>{link.label}</button>)}
      <a href="#about" onClick={() => setOpen(false)}>About Us</a>
    </div>
    <div className="nav-actions">
      <Button kind="outline" onClick={go('profile')}>{hasProfile ? 'Edit Profile' : 'Profile'}</Button>
      <Button onClick={go('analysis')}>Get Started</Button>
    </div>
    <button className="menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation">☰</button>
  </nav>;
}
