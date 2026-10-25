import { useEffect, useRef, useState } from 'react';
import { sendChat, type ChatSource, type ChatTurn } from '../api/insync';
import { Button } from './Button';
import { RichText } from './RichText';

type Message = ChatTurn & { sources?: ChatSource[] };

const HISTORY_TURNS = 6;

/** Chat box that talks to the local InSync assistant. Pass `sourceId` to scope answers to one uploaded report. */
export function ChatPanel({ sourceId = null, starters = [], placeholder = 'Ask a question…', compact = false }: { sourceId?: string | null; starters?: string[]; placeholder?: string; compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(starters);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => { if (messages.length) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, loading]);

  const ask = async (text: string) => {
    const query = text.trim();
    if (!query || loading) return;
    const history = messages.slice(-HISTORY_TURNS).map(({ role, content }) => ({ role, content }));
    setMessages(previous => [...previous, { role: 'user', content: query }]);
    setInput('');
    setError('');
    setSuggestions([]);
    setLoading(true);
    abortRef.current = new AbortController();
    try {
      const response = await sendChat(query, history, sourceId, abortRef.current.signal);
      setMessages(previous => [...previous, { role: 'assistant', content: response.answer, sources: response.sources }]);
      setSuggestions(response.suggestions ?? []);
    } catch (caught) {
      if ((caught as Error).name === 'AbortError') return;
      setError((caught as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <div className={`chat-panel ${compact ? 'compact' : ''}`}>
    <div className="chat-messages" aria-live="polite">
      {!messages.length && !loading && <p className="chat-empty">Ask in your own words. Answers come from the research and documents loaded into InSync on this machine.</p>}
      {messages.map((message, index) => <div key={index} className={`chat-message ${message.role}`}>
        <span className="chat-role">{message.role === 'user' ? 'You' : 'InSync'}</span>
        {message.role === 'user' ? <p>{message.content}</p> : <RichText text={message.content} />}
        {!!message.sources?.length && <div className="chat-sources"><span>Sources</span><ul>{message.sources.map((source, sourceIndex) => <li key={`${source.source_id}-${source.page}-${sourceIndex}`}>{source.filename}{source.page !== null && source.page !== undefined ? ` · page ${source.page}` : ''}</li>)}</ul></div>}
      </div>)}
      {loading && <div className="chat-message assistant chat-loading" role="status"><span className="chat-role">InSync</span><p>Thinking<i>.</i><i>.</i><i>.</i></p></div>}
      <div ref={endRef} />
    </div>
    {error && <div className="lab-error" role="alert">{error}</div>}
    {!loading && !!suggestions.length && <div className="chat-suggestions">{suggestions.map(suggestion => <button type="button" key={suggestion} onClick={() => ask(suggestion)}>{suggestion}</button>)}</div>}
    <form className="chat-form" onSubmit={event => { event.preventDefault(); ask(input); }}>
      <input aria-label="Your question" value={input} onChange={event => setInput(event.target.value)} placeholder={placeholder} disabled={loading} maxLength={2000} />
      <Button type="submit" disabled={loading || !input.trim()}>{loading ? 'Thinking…' : 'Ask'}</Button>
    </form>
    <p className="chat-disclaimer">InSync gives general educational information from research papers and your documents. It can be wrong, does not diagnose, and is not a substitute for a clinician.</p>
  </div>;
}
