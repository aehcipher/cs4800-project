import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { dateTime } from '../utils/format.js';

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(searchParams.get('conversationId') || '');
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api.get('/messages/conversations').then((data) => {
      if (!mounted) return;
      setConversations(data.conversations || []);
      if (!activeConversationId && data.conversations?.length) setActiveConversationId(data.conversations[0].id);
    }).catch((err) => { if (mounted) setError(err.message); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;
    let mounted = true;
    api.get(`/messages/conversations/${activeConversationId}`).then((data) => { if (mounted) setThread(data.conversation); }).catch((err) => { if (mounted) setError(err.message); });
    return () => { mounted = false; };
  }, [activeConversationId]);

  async function handleSend(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    try {
      await api.post(`/messages/conversations/${activeConversationId}`, { body: draft.trim() });
      setDraft('');
      const data = await api.get(`/messages/conversations/${activeConversationId}`);
      setThread(data.conversation);
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="container page-pad page-stack">
      <div><span className="eyebrow">In-app messaging</span><h1>Conversations</h1></div>
      {error ? <div className="alert error-alert">{error}</div> : null}
      <div className="messages-layout">
        <aside className="panel page-stack compact-gap">
          <h2>Threads</h2>
          {!conversations.length ? <p className="muted">No conversations yet. A thread is created when a booking is requested.</p> : null}
          {conversations.map((conversation) => <button key={conversation.id} className={`conversation-item ${conversation.id === activeConversationId ? 'conversation-item-active' : ''}`} onClick={() => setActiveConversationId(conversation.id)}><strong>{conversation.listingTitle}</strong><span className="muted">Booking {conversation.bookingId.slice(0, 8)}</span></button>)}
        </aside>
        <section className="panel page-stack">
          <h2>{thread?.listingTitle || 'Select a conversation'}</h2>
          <div className="message-thread">
            {!thread?.messages?.length ? <p className="muted">No messages yet.</p> : null}
            {thread?.messages?.map((message) => <div key={message.id} className="message-bubble"><strong>{message.senderName}</strong><span className="muted">{dateTime(message.createdAt)}</span><p>{message.body}</p></div>)}
          </div>
          {activeConversationId ? <form className="message-form" onSubmit={handleSend}><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." /><button className="solid-button">Send</button></form> : null}
        </section>
      </div>
    </div>
  );
}
