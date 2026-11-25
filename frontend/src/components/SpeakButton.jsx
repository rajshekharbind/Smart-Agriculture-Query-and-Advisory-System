import React, { useState, useRef } from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';
import { agriService } from '../services';

const SpeakButton = ({ text, language = 'Hindi', label = 'Listen' }) => {
  const [status, setStatus] = useState('idle');
  const audioRef = useRef(null);

  const handleToggle = async () => {
    if (status === 'playing' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setStatus('idle');
      return;
    }
    if (!text) return;

    try {
      setStatus('loading');
      const url = await agriService.fetchTtsAudioUrl(text, language);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setStatus('idle');
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => setStatus('idle');
      await audio.play();
      setStatus('playing');
    } catch {
      setStatus('idle');
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={status === 'loading' || !text}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-600/25 transition-colors disabled:opacity-40"
      title={`Listen in ${language}`}
    >
      {status === 'loading' ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : status === 'playing' ? (
        <Square className="w-3.5 h-3.5" />
      ) : (
        <Volume2 className="w-3.5 h-3.5" />
      )}
      {status === 'playing' ? 'Stop' : label}
    </button>
  );
};

export default SpeakButton;
