import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Sliders,
  Square,
  RotateCcw,
  Terminal,
  ChevronRight,
  Activity
} from 'lucide-react';
import {
  VOICE_SPEAKERS,
  synthesizeSpeech,
  createSpeechRecognizer,
  queryVayuBrain
} from '../../services/voiceAgentService';

const QUICK_PROMPTS = [
  {
    id: 'briefing',
    label: 'Sortie Readiness Briefing',
    prompt: 'Give me a full sortie clearance and 4-ship formation readiness briefing.'
  },
  {
    id: 'sb024',
    label: 'Tail SB-024 AOG Status',
    prompt: 'Why is tail SB-024 grounded at AFS Thanjavur and what is the depot ETA?'
  },
  {
    id: 'kh204_rb004',
    label: 'Grounded Tails KH-204 & RB-004',
    prompt: 'What is the status of grounded tails KH-204 at Sulur and RB-004 at Ambala?'
  },
  {
    id: 'cmapss',
    label: 'C-MAPSS & RLS Drift Metrics',
    prompt: 'Show NASA C-MAPSS benchmark RMSE scores and Online RLS sensor drift metrics.'
  }
];

export default function TacticalVoiceCopilot({ isDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `VAYU-OPS Comms Drawer active. 13 of 20 airframes are Mission Ready, 4 in Scheduled Maintenance, and 3 Grounded (SB-024, KH-204, RB-004).

Select a quick dispatch below or push the microphone to query flight-line readiness.`,
      spokenText: 'VAYU-OPS Comms Drawer online. 13 of 20 airframes are mission ready. Ready for voice or text query.',
      formulaCard: {
        title: 'Fleet Readiness Gate',
        formula: '13/20 Ready (65.0%) | 3 AOG Grounded'
      },
      suggestions: [
        'Why is tail SB-024 grounded at AFS Thanjavur?',
        'What is the status of grounded tails KH-204 and RB-004?',
        'Show NASA C-MAPSS benchmark and RLS drift metrics'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState('shubh');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [sarvamKey, setSarvamKey] = useState(() => localStorage.getItem('SARVAM_API_KEY') || 'sk_juwntjqd_5YbJNbqu4Bs1YIuz474ftfh3');
  const [showSettings, setShowSettings] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const chatEndRef = useRef(null);
  const currentAudioRef = useRef(null);
  const recognizerRef = useRef(null);
  const handleSendRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isProcessing]);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      if (typeof currentAudioRef.current.pause === 'function') {
        currentAudioRef.current.pause();
      }
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakResponse = useCallback(async (textToSpeak) => {
    try {
      stopAudio();
      setIsSpeaking(true);
      const audioObj = await synthesizeSpeech(textToSpeak, {
        apiKey: sarvamKey,
        speaker: selectedSpeaker
      });

      currentAudioRef.current = audioObj;

      if (audioObj instanceof Audio) {
        audioObj.onended = () => setIsSpeaking(false);
        audioObj.onerror = () => setIsSpeaking(false);
        await audioObj.play();
      } else if (audioObj && typeof audioObj.play === 'function') {
        await audioObj.play();
        setIsSpeaking(false);
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsSpeaking(false);
    }
  }, [sarvamKey, selectedSpeaker, stopAudio]);

  const handleSendMessage = useCallback(async (customPrompt) => {
    const promptText = typeof customPrompt === 'string' ? customPrompt : inputText;
    if (!promptText || !promptText.trim()) return;

    const cleanPrompt = promptText.trim();
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLiveTranscript('');
    setIsProcessing(true);

    setTimeout(async () => {
      const response = queryVayuBrain(cleanPrompt);
      const assistantMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: response.displayText,
        spokenText: response.spokenText,
        formulaCard: response.formulaCard,
        suggestions: response.suggestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);

      if (autoSpeak) {
        await speakResponse(response.spokenText);
      }
    }, 280);
  }, [inputText, autoSpeak, speakResponse]);

  useEffect(() => {
    handleSendRef.current = handleSendMessage;
  }, [handleSendMessage]);

  useEffect(() => {
    recognizerRef.current = createSpeechRecognizer({
      onResult: (transcript, isFinal) => {
        setLiveTranscript(transcript);
        setInputText(transcript);
        if (isFinal && transcript.trim().length > 0) {
          setIsListening(false);
          if (handleSendRef.current) {
            handleSendRef.current(transcript.trim());
          }
        }
      },
      onError: () => {
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const toggleListening = () => {
    if (!recognizerRef.current) {
      alert('Speech recognition is supported in Chrome, Edge, and Safari.');
      return;
    }

    if (isListening) {
      recognizerRef.current.stop();
      setIsListening(false);
    } else {
      stopAudio();
      setLiveTranscript('');
      try {
        recognizerRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleSaveKey = (val) => {
    setSarvamKey(val);
    localStorage.setItem('SARVAM_API_KEY', val);
  };

  const renderMessageContent = (msg) => {
    const paragraphs = msg.text.split('\n\n');

    return (
      <div className="space-y-3">
        <div className="space-y-2.5">
          {paragraphs.map((para, pIdx) => {
            const lines = para.split('\n');
            const isList = lines.some(l => l.trim().startsWith('•') || l.trim().startsWith('-'));

            if (isList) {
              const headerLine = !lines[0].trim().startsWith('•') && !lines[0].trim().startsWith('-') ? lines[0] : null;
              const listLines = headerLine ? lines.slice(1) : lines;

              return (
                <div key={pIdx} className="space-y-1">
                  {headerLine && (
                    <div className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {headerLine}
                    </div>
                  )}
                  <ul className="space-y-1">
                    {listLines.map((line, lIdx) => {
                      const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
                      return (
                        <li key={lIdx} className="flex items-start gap-2 text-xs leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{cleanLine}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            }

            return (
              <p key={pIdx} className={`text-xs leading-relaxed ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {para}
              </p>
            );
          })}
        </div>

        {msg.formulaCard && (
          <div className={`p-2.5 rounded-lg border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-[10px] font-mono uppercase tracking-wider mb-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {msg.formulaCard.title}
            </div>
            <div className={`text-xs font-mono font-semibold tabular-nums ${
              isDark ? 'text-sky-400' : 'text-blue-700'
            }`}>
              {msg.formulaCard.formula}
            </div>
          </div>
        )}

        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className={`pt-2 border-t flex flex-col gap-1 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            {msg.suggestions.slice(0, 2).map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                className={`text-left text-[11px] px-2.5 py-1.5 rounded border transition-colors flex items-center justify-between gap-2 ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span className="truncate">{s}</span>
                <ChevronRight className="w-3 h-3 text-blue-500 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating Tactical Comms Button */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-mono font-semibold shadow-lg transition-colors ${
              isDark
                ? 'bg-slate-900/95 border-slate-700 text-slate-200 hover:border-blue-500'
                : 'bg-white/95 border-slate-300 text-slate-800 hover:border-blue-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>VAYU-OPS VOICE COMMS</span>
          </button>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-lg border ${
            isOpen
              ? 'bg-slate-800 border-slate-700 text-white'
              : 'bg-blue-700 hover:bg-blue-600 border-blue-500/40 text-white'
          }`}
          title="Toggle VAYU-OPS Comms Drawer"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Terminal className="w-5 h-5" />}
        </button>
      </div>

      {/* Right-Docked Comms Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-20 right-5 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[80vh] rounded-xl border shadow-2xl flex flex-col overflow-hidden ${
            isDark
              ? 'bg-slate-900/98 border-slate-700/80 text-white'
              : 'bg-white border-slate-300 text-slate-900'
          }`}
        >
          {/* Drawer Header */}
          <div className={`px-4 py-3 border-b flex items-center justify-between ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight">VAYU-OPS COMMS</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    LIVE
                  </span>
                </div>
                <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Sarvam bulbul:v3 • 20 Airframes Synced
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isSpeaking && (
                <button
                  onClick={stopAudio}
                  className="p-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-mono"
                  title="Stop Audio"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
              <button
                onClick={() => {
                  if (isSpeaking) stopAudio();
                  setAutoSpeak(!autoSpeak);
                }}
                className={`p-1.5 rounded border transition-colors ${
                  autoSpeak
                    ? isDark ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-white border-slate-200 text-emerald-700'
                    : isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
                title={autoSpeak ? 'Mute Auto Voice' : 'Enable Auto Voice'}
              >
                {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded border transition-colors ${
                  showSettings
                    ? 'bg-blue-700 border-blue-500 text-white'
                    : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                }`}
                title="Voice Settings"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  stopAudio();
                  setMessages([messages[0]]);
                }}
                className={`p-1.5 rounded border transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                }`}
                title="Reset Log"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Settings Drawer */}
          {showSettings && (
            <div className={`p-3 border-b space-y-2.5 text-xs ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Briefing Officer Voice
                </label>
                <select
                  value={selectedSpeaker}
                  onChange={(e) => setSelectedSpeaker(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded border text-xs outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {VOICE_SPEAKERS.map((spk) => (
                    <option key={spk.id} value={spk.id}>
                      {spk.name} — {spk.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Sarvam API Key
                </label>
                <input
                  type="password"
                  value={sarvamKey}
                  onChange={(e) => handleSaveKey(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded border text-xs font-mono outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Quick Prompt Bar */}
          <div className={`px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q.id}
                onClick={() => handleSendMessage(q.prompt)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap border transition-colors ${
                  isDark
                    ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    {msg.role === 'user' ? 'COMMANDER' : 'VAYU-OPS'} • {msg.timestamp}
                  </span>
                  {msg.role === 'assistant' && msg.spokenText && (
                    <button
                      onClick={() => speakResponse(msg.spokenText)}
                      className="text-[10px] font-mono text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      <Volume2 className="w-2.5 h-2.5" /> Replay
                    </button>
                  )}
                </div>
                <div
                  className={`max-w-[92%] rounded-xl p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-700 text-white'
                      : isDark
                      ? 'bg-slate-950/90 border border-slate-800 text-slate-200'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                  ) : (
                    renderMessageContent(msg)
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 px-2">
                <Activity className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                <span>Analyzing telemetry...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <div className={`p-3 border-t ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            {isListening && (
              <div className="mb-2 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-mono">
                MIC LIVE: {liveTranscript || 'Listening...'}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-lg border transition-colors shrink-0 ${
                  isListening
                    ? 'bg-red-600 text-white border-red-500'
                    : isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
                title="Voice Input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-500" />}
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask SB-024, KH-204, RB-004, C-MAPSS..."
                className={`flex-1 px-3 py-2 rounded-lg text-xs border outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                }`}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-2 rounded-lg transition-colors shrink-0 ${
                  inputText.trim()
                    ? 'bg-blue-700 hover:bg-blue-600 text-white'
                    : isDark
                    ? 'bg-slate-900 text-slate-600 border border-slate-800'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
