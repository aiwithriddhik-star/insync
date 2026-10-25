import { useEffect, useState } from 'react';
import { PAGE_IDS, type Navigate, type Page, type PeriodEntry, type Profile } from './types';
import { Footer } from './components/Footer';
import { Nav } from './components/Nav';
import { ProfileSetup } from './components/ProfileSetup';
import { AnalyseCyclePage, CycleInsightsPage } from './pages/AnalyseCyclePage';
import { BeyondCalendarPage, ConcernDetailPage } from './pages/BeyondCalendarPage';
import { ChatPage } from './pages/ChatPage';
import { CareBudgetPage } from './pages/CareBudgetPage';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { PCOSPage } from './pages/PCOSPage';
import { ReportPage } from './pages/ReportPage';

const pageFromHash = (): Page | null => {
  const value = location.hash.slice(1) as Page;
  return PAGE_IDS.includes(value) ? value : null;
};

export default function App() {
  const [page, setPage] = useState<Page>(() => pageFromHash() ?? 'home');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<PeriodEntry[]>([]);
  const [learnFocus, setLearnFocus] = useState<string>();

  const navigate: Navigate = (next, focus) => {
    setLearnFocus(focus);
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keep the URL hash and the visible page in sync, so the browser back button works.
  useEffect(() => { if (location.hash.slice(1) !== page) location.hash = page; }, [page]);
  useEffect(() => {
    const onHashChange = () => {
      const next = pageFromHash();
      if (next && next !== page) setPage(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [page]);

  const saveProfile = (value: Profile) => { setProfile(value); navigate('analysis'); };
  const addEntry = (entry: PeriodEntry) => setEntries(previous => [...previous, entry]);

  let content: React.ReactNode;
  switch (page) {
    case 'home':
      content = <HomePage navigate={navigate} />;
      break;
    case 'analysis':
      content = <AnalyseCyclePage profile={profile} entries={entries} onAddEntry={addEntry} onProfileSave={saveProfile} navigate={navigate} />;
      break;
    case 'profile':
      content = <ProfileSetup initial={profile} onBack={() => navigate(profile ? 'analysis' : 'home')} onSave={saveProfile} />;
      break;
    case 'insights':
      content = <CycleInsightsPage entries={entries} onBack={() => navigate('analysis')} />;
      break;
    case 'concerns':
      content = <BeyondCalendarPage navigate={navigate} onBack={() => navigate('analysis')} />;
      break;
    case 'pcos':
      content = <PCOSPage profile={profile} entries={entries} onBack={() => navigate('concerns')} onInformation={() => navigate('info', 'pcos-education')} />;
      break;
    case 'info':
      content = <LearnPage focus={learnFocus} onBack={() => navigate('concerns')} />;
      break;
    case 'care-budget':
      content = <CareBudgetPage onBack={() => navigate('home')} />;
      break;
    case 'chat':
      content = <ChatPage onBack={() => navigate('home')} />;
      break;
    case 'lab-report':
      content = <ReportPage onBack={() => navigate('home')} />;
      break;
    default:
      content = <ConcernDetailPage kind={page} profile={profile} entries={entries} onBack={() => navigate('concerns')} />;
  }

  return <main className={page === 'home' ? undefined : 'analysis-page'}>
    <Nav navigate={navigate} current={page} hasProfile={!!profile} />
    {content}
    <Footer navigate={navigate} />
  </main>;
}
