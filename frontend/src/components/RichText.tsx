import type { ReactNode } from 'react';

/** Inline **bold** only; everything else stays plain text (React escapes it). */
const inline = (text: string): ReactNode[] => text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <strong key={index}>{part.slice(2, -2)}</strong> : part);

/** Tiny safe renderer for model output: paragraphs, **bold**, and "-", "*" or "1." bullet lines. No raw HTML is ever injected. */
export function RichText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push(<p key={blocks.length}>{inline(paragraph.join(' '))}</p>);
    if (bullets.length) blocks.push(<ul key={blocks.length}>{bullets.map((item, index) => <li key={index}>{inline(item)}</li>)}</ul>);
    paragraph = [];
    bullets = [];
  };
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (!line) flush();
    else if (bullet) { if (paragraph.length) flush(); bullets.push(bullet[1]); }
    else { if (bullets.length) flush(); paragraph.push(line.replace(/^#+\s*/, '')); }
  }
  flush();
  return <div className="rich-text">{blocks}</div>;
}
