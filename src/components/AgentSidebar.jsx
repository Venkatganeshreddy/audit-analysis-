import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ConversationalAgent } from '../agents';
import { addRipple } from '../utils/ripple';

export default function AgentSidebar({ seriesData, data, assessmentData, semester, isOpen, onToggle }) {
  const { isDark } = useTheme();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (seriesData && chatMessages.length === 0) {
      const allUnivs = Object.values(seriesData).flatMap(s => s.universities || []);
      setChatMessages([{
        role: 'agent',
        type: 'info',
        text: `Hi! I'm your NIAT Intelligence Agent.\n\nI've loaded data for ${allUnivs.length} universities.\n\nAsk me anything about university performance, courses, completion rates, delivery, comparisons, or type "help" to see everything I can do.`,
      }]);
    }
  }, [seriesData]);

  const sendMessage = useCallback(async (query) => {
    const q = query.trim();
    if (!q) return;
    setChatMessages(prev => [...prev, { role: 'user', text: q }]);
    setChatInput('');
    setIsTyping(true);
    try {
      const response = await ConversationalAgent.process(q, seriesData, data, assessmentData, null, null, semester);
      setChatMessages(prev => [...prev, { role: 'agent', ...response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'agent', type: 'warning', text: 'Something went wrong. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  }, [seriesData, data, assessmentData, semester]);

  const handleChat = useCallback(async (e) => {
    e.preventDefault();
    await sendMessage(chatInput);
  }, [chatInput, sendMessage]);

  const quickQuestions = [
    'top performers', 'at risk', 'practice completion', 'delivery rate',
    'list universities', 'total students', 'summary', 'recommendations',
  ];

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        onMouseDown={addRipple}
        className="ripple-btn touch-target fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        style={{ boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}
        aria-label="Open AI Agent Chat"
      >
        <span className="text-xl">🤖</span>
        <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          AI Agent Chat
        </span>
      </button>
    );
  }

  const sidebarBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200';

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="sidebar-backdrop md:hidden"
        onClick={onToggle}
        aria-hidden="true"
      />
      <div className="animate-slide-in-right fixed top-0 right-0 z-50 h-full w-full md:w-[420px]">
        <div className={`w-full h-full shadow-2xl flex flex-col border-l ${sidebarBg}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <h3 className="text-white font-bold text-sm">NIAT Intelligence Agent</h3>
                <p className="text-violet-200 text-[10px]">
                  AI-powered data analysis
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat - full height */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'agent' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1 text-[11px]">
                      🤖
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : msg.type === 'warning'
                      ? isDark
                        ? 'bg-amber-900/40 border border-amber-700/50 text-amber-200 rounded-tl-sm'
                        : 'bg-amber-50 border border-amber-200 text-gray-800 rounded-tl-sm'
                      : msg.type === 'success'
                      ? isDark
                        ? 'bg-emerald-900/40 border border-emerald-700/50 text-emerald-200 rounded-tl-sm'
                        : 'bg-emerald-50 border border-emerald-200 text-gray-800 rounded-tl-sm'
                      : isDark
                      ? 'bg-slate-700 text-slate-200 rounded-tl-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1 text-[11px]">
                    🤖
                  </div>
                  <div className={`rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <span className="typing-dot w-2 h-2 bg-indigo-400 rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-indigo-400 rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-indigo-400 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Questions */}
            <div className={`px-3 py-2 border-t flex-shrink-0 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
              <p className={`text-[10px] mb-1.5 font-medium uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Quick questions
              </p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className={`px-2 py-1 text-[10px] rounded-full border transition-all ${
                      isDark
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border-slate-600 hover:border-slate-500'
                        : 'bg-white hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 border-gray-200 hover:border-indigo-200'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={handleChat}
              className={`p-3 border-t flex-shrink-0 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything about the data..."
                  className={`flex-1 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 border transition-all ${
                    isDark
                      ? 'bg-slate-700 text-slate-200 placeholder-slate-500 border-slate-600 focus:bg-slate-600 focus:border-indigo-500'
                      : 'bg-gray-100 text-gray-800 placeholder-gray-400 border-transparent focus:bg-white focus:border-indigo-300'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
