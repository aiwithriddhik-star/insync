export type Profile = {
  name: string;
  age: string;
  height: string;
  weight: string;
  firstPeriodDate: string;
  cycleLength: string;
};

export type PeriodEntry = {
  id: number;
  startDate: string;
  endDate: string;
  ongoing: boolean;
  flow: string;
  pain: number;
  symptoms: string[];
  otherSymptom: string;
  notes: string;
};

export type Page =
  | 'home'
  | 'analysis'
  | 'profile'
  | 'concerns'
  | 'pcos'
  | 'endometriosis'
  | 'dysmenorrhea'
  | 'heavy-bleeding'
  | 'irregular'
  | 'info'
  | 'insights'
  | 'care-budget'
  | 'lab-report'
  | 'chat';

export const PAGE_IDS: Page[] = ['home', 'analysis', 'profile', 'concerns', 'pcos', 'endometriosis', 'dysmenorrhea', 'heavy-bleeding', 'irregular', 'info', 'insights', 'care-budget', 'lab-report', 'chat'];

export type ConcernKind = 'endometriosis' | 'dysmenorrhea' | 'heavy-bleeding' | 'irregular';

/** Every page navigates through this. `focus` is an element id to scroll to on the Learn page. */
export type Navigate = (page: Page, focus?: string) => void;
