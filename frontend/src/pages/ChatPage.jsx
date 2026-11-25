import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  SlidersHorizontal,
  X,
  MessageSquare,
  Sparkles,
  Bot,
  User,
  Globe,
  Database,
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useDocuments } from '../context/DocumentContext';
import { useMode } from '../context/ModeContext';
import { LANGUAGES, VOICE_LANGUAGES } from '../utils/constants';
import { Alert, SpeakButton } from '../components';
import VoiceRecorder from '../components/VoiceRecorder';

const QUICK_PROMPTS = [
  'धान की फसल में पत्ती पीली पड़ने का जैविक और सही इलाज क्या है?',
  'Best organic fertilizer schedule for paddy in Kerala?',
  'PM-KISAN और फसल बीमा योजना के लिए कौन से दस्तावेज़ चाहिए?',
  'How do I prevent coconut bud rot and pepper wilt during monsoon?',
];

const ChatPage = () => {
  const {
    currentThreadId,
    messageHistory,
    chatThreads,
    language,
    loading,
    error,
    pendingInput,
    createNewThread,
    loadThread,
    sendMessage,
    sendVoiceQuery,
    setLanguage,
    clearError,
    setPendingInput,
  } = useChat();

  const { processingStatus } = useDocuments();
  const { appLanguage, t } = useMode();

  const [inputValue, setInputValue] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState(appLanguage || 'Hindi');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setLanguage(appLanguage);
    setVoiceLanguage(appLanguage);
  }, [appLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageHistory, loading]);

  useEffect(() => {
    if (pendingInput) {
      setInputValue(pendingInput);
      setPendingInput('');
      inputRef.current?.focus();
    }
  }, [pendingInput, setPendingInput]);

  const handleSendMessage = async (textOverride) => {
    const text = (textOverride ?? inputValue).trim();
    if (!text || loading) return;
    if (!textOverride) setInputValue('');
    await sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full gap-4 overflow-y-auto pr-0.5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
          {t('Controls & Voice', 'नियंत्रण और आवाज़')}
        </h2>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          createNewThread();
          setMobileDrawerOpen(false);
        }}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t('New Conversation', 'नई बातचीत शुरू करें')}
      </button>

      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-emerald-200/80 uppercase tracking-wider">
          <Globe className="w-3.5 h-3.5 text-emerald-500" />
          {t('Response Language', 'उत्तर की भाषा')}
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="input-field"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            🎤 {t('Voice Assistant', 'आवाज़ से सवाल पूछें')}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            {t('Record your question in Hindi, Malayalam, or English.', 'हिंदी या अपनी भाषा में बोलकर सवाल पूछें।')}
          </p>
        </div>

        <select
          value={voiceLanguage}
          onChange={(e) => setVoiceLanguage(e.target.value)}
          className="input-field py-1.5 text-xs"
        >
          {VOICE_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        <VoiceRecorder
          onVoiceQuery={sendVoiceQuery}
          voiceLanguage={voiceLanguage}
          disabled={loading}
        />
      </div>

      <div className="bg-slate-100/80 dark:bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            Knowledge Base
          </span>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
            {processingStatus.processed_chunks > 0 ? 'RAG Active' : 'Local Files'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-white/70 dark:bg-slate-950/60 rounded-xl p-2">
            <div className="text-base font-bold">{processingStatus.total_documents}</div>
            <div className="text-[11px] text-slate-500">Docs</div>
          </div>
          <div className="bg-white/70 dark:bg-slate-950/60 rounded-xl p-2">
            <div className="text-base font-bold">{processingStatus.processed_chunks}</div>
            <div className="text-[11px] text-slate-500">Chunks</div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[120px] flex flex-col">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Recent Chats ({chatThreads.length})
        </h3>
        <div className="space-y-1.5 overflow-y-auto max-h-48 pr-1">
          {chatThreads.slice(0, 15).map((threadId) => (
            <button
              key={threadId}
              type="button"
              onClick={() => {
                loadThread(threadId);
                setMobileDrawerOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors ${
                threadId === currentThreadId
                  ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/35'
                  : 'bg-slate-100 dark:bg-slate-900/50 hover:bg-emerald-500/10 border border-transparent'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
              <span className="truncate font-mono">{threadId.slice(0, 14)}...</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 h-[calc(100vh-110px)] min-h-[540px] flex flex-col lg:flex-row gap-4">
      <section className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden min-h-0">
        <div className="px-4 sm:px-5 py-3 border-b border-emerald-700/15 dark:border-emerald-500/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <h2 className="text-sm sm:text-base font-semibold truncate">
              {t('AgroSathi AI & Voice Assistant', 'एग्रोसाथी AI और आवाज़ सहायक')}
            </h2>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
              {language}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={createNewThread}
              className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-medium"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Voice & Controls
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 pt-3">
            <Alert type="error" onClose={clearError}>{error}</Alert>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messageHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-3 py-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mb-4">
                <Bot className="w-7 h-7 text-emerald-600 dark:text-emerald-300" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1.5">
                {t('Ask AgroSathi AI Anything About Farming', 'खेती से जुड़ा कोई भी सवाल पूछें')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mb-6">
                {t(
                  'Type or record your voice in Hindi or regional languages. Click "Listen" on any answer to hear audio guidance.',
                  'हिंदी या अपनी भाषा में टाइप करें या बोलें। किसी भी जवाब को सुनने के लिए "Listen" बटन दबाएं।'
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl w-full">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="text-left p-3 rounded-xl bg-white/75 dark:bg-slate-900/70 hover:bg-emerald-500/15 border border-emerald-700/15 dark:border-emerald-500/20 text-xs sm:text-sm transition-all"
                  >
                    “{prompt}”
                  </button>
                ))}
              </div>
            </div>
          )}

          {messageHistory.map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <div key={index} className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                  </div>
                )}

                <div className="max-w-[85%] sm:max-w-[75%] space-y-1.5">
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-br from-emerald-600 to-green-700 text-white rounded-br-sm'
                        : 'bg-white dark:bg-slate-900/85 border border-emerald-700/15 dark:border-emerald-500/20 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  {!isUser && message.content && (
                    <div className="flex justify-start">
                      <SpeakButton text={message.content} language={language} label={t('Listen', 'सुनें')} />
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-end gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div className="bg-white dark:bg-slate-900/85 border border-emerald-500/20 rounded-2xl px-4 py-3">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 sm:p-4 border-t border-emerald-700/15 dark:border-emerald-500/20">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('Ask about crops, pests, fertilizers, or schemes...', 'फसल, खाद, कीट या सरकारी योजना के बारे में पूछें...')}
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || loading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-40 transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </section>

      <aside className="hidden lg:flex w-80 xl:w-96 glass-panel rounded-2xl p-4 flex-col min-h-0">
        {renderSidebarContent()}
      </aside>

      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xs h-full bg-white dark:bg-slate-950 border-l border-emerald-500/25 p-4 flex flex-col">
            {renderSidebarContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
