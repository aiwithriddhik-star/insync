import { Button } from './Button';
import { ConcernIcon } from './ConcernIcon';

export function PageIntro({ eyebrow, title, text, onBack, icon }: { eyebrow: string; title: string; text: string; onBack?: () => void; icon?: string }) {
  return <header className="health-page-intro">
    {onBack && <Button kind="text" onClick={onBack}>← Back</Button>}
    <div>{icon && <ConcernIcon type={icon} large />}<span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>
  </header>;
}
