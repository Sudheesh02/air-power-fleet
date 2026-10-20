import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Radio,
  User,
  ChevronDown,
  RotateCcw,
  Play,
  Square,
  Plane,
  Copy,
  Check,
  PlusCircle,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  synthesizeSpeech,
  createSpeechRecognizer,
  queryVayuBrain,
  VOICE_SPEAKERS
} from '../../services/voiceAgentService';

export default function TacticalVoiceCopilot() {
  const { isDark, isVoiceAgentOpen, setIsVoiceAgentOpen, activeTab, setActiveTab } = useTheme();

  const getContextLabel = (tab) => {
    switch (tab) {
      case 'overview':
        return 'Looking at Fleet Command Overview';
      case 'twin':
        return 'Looking at 5-Stage Digital Twin';
      case 'predictive':
        return 'Looking at Predictive AI & Sorties';
      case 'spares':
        return 'Looking at Spares & Depot Pipeline';
      case 'logs':
        return 'Looking at Maintenance Work Orders';
      default:
        return 'Looking at Fleet Operations';
    }
  };

  const initialGreetingMessage = {
    id: 'init-1',
    sender: 'agent',
    time: 'Just now',
    text: `I am the Air Power Copilot, your tactical flight-line guide for the Indian Air Force predictive maintenance platform. I monitor frontline combat airframe readiness, 5-stage gas-path digital twins, conformal RUL thresholds, and forward depot supply chains.

Explaining fleet capabilities:
I can explain real-time aircraft telemetry, diagnose conservative RUL safety bounds, inspect forward base spares inventory, and evaluate sortie clearance feasibility across our 20 frontline airframes.`,
    formulaCard: {
      title: "Fleet Availability Standard",
      formula: "Mission Ready (13) / Total Airframes (20) = 65.0% (MoD Target: 75.0%)"
    },
    spokenText: 'Jai Hind, Commander. Air Power Copilot is online. Thirteen combat aircraft are mission ready, and tail SB-024 is currently grounded at Thanjavur for compressor maintenance. Awaiting your flight directive.',
    suggestions: [
      'Give me a sortie clearance briefing',
      'Why is tail SB-024 grounded at AFS Thanjavur?',
      'Explain the 5-stage thermodynamic turbofan twin',
      'How does conformal RUL calculation work?'
    ]
  };

  const [messages, setMessages] = useState([initialGreetingMessage]);
  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState('shubh');
  const [copiedId, setCopiedId] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);

  const messagesEndRef = useRef(null);
  const recognizerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isVoiceAgentOpen]);

  // Speech Recognition initialization
  useEffect(() => {
    const recognizer = createSpeechRecognizer({
      onResult: (transcript, isFinal) => {
        setInputQuery(transcript);
        if (isFinal && transcript.trim()) {
          handleSendMessage(transcript.trim());
          setIsListening(false);
        }
      },
      onError: (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
    recognizerRef.current = recognizer;
  }, [selectedSpeaker, autoSpeak]);

  const toggleListening = () => {
    if (!recognizerRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }
    if (isListening) {
      recognizerRef.current.stop();
      setIsListening(false);
    } else {
      stopAudio();
      try {
        recognizerRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      if (currentAudio.currentTime) currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const playVoice = async (text) => {
    stopAudio();
    setIsPlayingAudio(true);
    try {
      const audioInstance = await synthesizeSpeech(text, {
        speaker: selectedSpeaker,
      });
      setCurrentAudio(audioInstance);

      if (audioInstance.play) {
        audioInstance.onended = () => setIsPlayingAudio(false);
        audioInstance.onerror = () => setIsPlayingAudio(false);
        const playPromise = audioInstance.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => setIsPlayingAudio(false));
        }
      } else {
        setIsPlayingAudio(false);
      }
    } catch (err) {
      console.error('Sarvam Audio playback error:', err);
      setIsPlayingAudio(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    stopAudio();
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // Generate military intelligence response
    setTimeout(async () => {
      const response = queryVayuBrain(query, { activeTab });
      const agentMsg = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: response.displayText,
        formulaCard: response.formulaCard,
        spokenText: response.spokenText,
        suggestions: response.suggestions
      };

      setMessages((prev) => [...prev, agentMsg]);

      if (autoSpeak && response.spokenText) {
        playVoice(response.spokenText);
      }
    }, 150);
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = () => {
    stopAudio();
    setMessages([initialGreetingMessage]);
  };

  // Helper to cleanly parse and render inline text
  const formatInline = (text) => {
    if (!text) return null;
    const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^\$]+\$)/g);
    return tokens.map((token, i) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={i} className={`font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code key={i} className="font-mono text-[11px] px-1 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-500/20">
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('$') && token.endsWith('$')) {
        return (
          <span key={i} className="font-mono text-[11px] font-semibold text-cyan-400 bg-cyan-950/20 px-1 py-0.2 rounded">
            {token.slice(1, -1)}
          </span>
        );
      }
      return token;
    });
  };

  // Structured message line formatter matching Vanna Assist typography
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className={`font-bold text-xs uppercase tracking-wider mt-3 mb-1.5 ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
            {trimmed.replace('### ', '')}
          </h4>
        );
      }

      if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
        const content = trimmed.replace(/^[•\-]\s+/, '');
        return (
          <div key={idx} className={`flex items-start gap-2 text-xs sm:text-[13px] my-1.5 pl-0.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
            <div className="flex-1">{formatInline(content)}</div>
          </div>
        );
      }

      if (!trimmed) return <div key={idx} className="h-1.5" />;

      // Header-like sentences (e.g. "Current Operational State:", "Explaining fleet capabilities:")
      if (trimmed.endsWith(':')) {
        return (
          <p key={idx} className={`font-semibold text-xs sm:text-[13px] mt-2.5 mb-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            {trimmed}
          </p>
        );
      }

      return (
        <p key={idx} className={`text-xs sm:text-[13px] my-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {formatInline(line)}
        </p>
      );
    });
  };

  return (
    <>
      {/* 1. Tactical Floating Trigger Button (Bottom-Right, hidden when on full copilot page) */}
      {!isVoiceAgentOpen && activeTab !== 'copilot' && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 group">
          <div className="hidden sm:flex flex-col items-end pr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shadow-lg ${
              isDark ? 'text-cyan-300 bg-slate-900/90 border-cyan-500/30' : 'text-blue-900 bg-white border-slate-200'
            }`}>
              Air Power Copilot
            </span>
            <span className="text-[9px] text-slate-400 pr-1">Sarvam bulbul:v3 &bull; Encrypted</span>
          </div>

          <button
            onClick={() => setIsVoiceAgentOpen(true)}
            aria-label="Open Air Power Copilot"
            className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0075FF] to-[#00D5FF] shadow-vision-glow hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border border-white/20"
          >
            <Plane className="w-5 h-5 text-white -rotate-45" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-sm animate-pulse" />
          </button>
        </div>
      )}

      {/* 2. Mobile Backdrop */}
      {isVoiceAgentOpen && (
        <div
          onClick={() => {
            stopAudio();
            setIsVoiceAgentOpen(false);
          }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden animate-fadeIn"
        />
      )}

      {/* 3. Vanna-Style Clean Docked Sidecar Drawer (Right-Docked) */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-full sm:w-[460px] md:w-[480px] h-full shadow-2xl flex flex-col border-l transition-transform duration-300 ease-in-out ${
          isVoiceAgentOpen ? 'translate-x-0' : 'translate-x-full'
        } ${
          isDark
            ? 'bg-[#0B1437]/98 border-white/10 text-white'
            : 'bg-white/98 border-slate-200 text-slate-900'
        } backdrop-blur-2xl`}
      >
        {/* Top Header Bar (Identical to Vanna Assist) */}
        <div className={`px-4 sm:px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-white/10' : 'border-slate-100'
        }`}>
          {/* Left: Brand Squircle + Title + Context Subtitle */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0075FF] to-[#00D5FF] flex items-center justify-center text-white shadow-vision-glow shrink-0">
              <Plane className="w-4 h-4 -rotate-45" />
            </div>
            <div className="min-w-0 leading-tight">
              <h3 className={`font-bold text-sm tracking-tight whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Air Power Copilot
              </h3>
              <p className="text-[10px] text-slate-400 font-sans truncate max-w-[125px] sm:max-w-[160px] mt-0.5">
                {getContextLabel(activeTab)}
              </p>
            </div>
          </div>

          {/* Right: Speaker Selector + New Chat + Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Voice Speaker Selector Pill */}
            <div className="relative">
              <select
                value={selectedSpeaker}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
                className={`text-[11px] font-semibold py-1 px-2 pr-6 rounded-lg appearance-none cursor-pointer border transition max-w-[100px] sm:max-w-[125px] truncate ${
                  isDark
                    ? 'bg-slate-900/90 text-cyan-300 border-white/15 hover:border-cyan-500/40'
                    : 'bg-slate-100 text-slate-800 border-slate-200 hover:border-blue-400'
                }`}
                title="Select Sarvam Audio Speaker"
              >
                {VOICE_SPEAKERS.map((sp) => (
                  <option key={sp.id} value={sp.id} className="bg-slate-900 text-white">
                    {sp.name.split(' ')[0]} ({sp.role.split(' ')[0]})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            {/* Audio Stop Button (if playing) */}
            {isPlayingAudio && (
              <button
                onClick={stopAudio}
                className="p-1.5 rounded-lg border bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse transition"
                title="Stop Audio"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Expand to Full Live Studio */}
            <button
              onClick={() => {
                stopAudio();
                setIsVoiceAgentOpen(false);
                setActiveTab('copilot');
              }}
              title="Open Fullscreen Live Voice Studio"
              className={`p-1.5 rounded-lg border text-xs font-medium transition ${
                isDark
                  ? 'border-white/10 hover:bg-white/10 text-cyan-300 hover:text-cyan-200'
                  : 'border-slate-200 hover:bg-slate-100 text-blue-600 hover:text-blue-800'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* "New chat" Button (Identical to Vanna Assist) */}
            <button
              onClick={handleNewChat}
              title="Start a fresh briefing"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                isDark
                  ? 'border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">New chat</span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                stopAudio();
                setIsVoiceAgentOpen(false);
              }}
              title="Close Copilot"
              className={`p-1.5 rounded-lg transition ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audio Equalizer Sound Wave Indicator (When Sarvam is speaking or listening) */}
        {(isPlayingAudio || isListening) && (
          <div className="px-5 py-2 bg-gradient-to-r from-blue-950/40 to-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 font-sans">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              <span>{isListening ? 'Listening via microphone...' : 'Transmitting via Sarvam bulbul:v3...'}</span>
            </div>
            <div className="flex items-center gap-0.5 h-3.5">
              {[4, 9, 13, 7, 15, 11, 6, 12, 8, 14, 10, 5].map((h, i) => (
                <span
                  key={i}
                  style={{
                    height: `${h}px`,
                    animationDelay: `${i * 0.08}s`
                  }}
                  className="w-1 bg-gradient-to-t from-cyan-400 to-blue-500 rounded-full animate-bounce"
                />
              ))}
            </div>
          </div>
        )}

        {/* Messages Body (Clean Vanna Assist Structure) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6 font-sans">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            if (isUser) {
              /* USER MESSAGE BUBBLE */
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className={`max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs sm:text-[13px] shadow-sm leading-relaxed ${
                    isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            }

            /* ASSISTANT MESSAGE (Clean Left-Aligned Vanna Assist Pattern) */
            return (
              <div key={msg.id} className="flex items-start gap-3">
                {/* Subtle Brand Squircle Avatar on Left */}
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#0075FF] to-[#00D5FF] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                  <Plane className="w-3.5 h-3.5 -rotate-45" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Message Content */}
                  <div className="space-y-1">
                    {renderFormattedText(msg.text)}
                  </div>

                  {/* Highlighted Formula / Stat Card (Identical to Vanna Assist Formula Card) */}
                  {msg.formulaCard && (
                    <div className={`my-3 p-3.5 rounded-xl border transition-all ${
                      isDark
                        ? 'bg-slate-900/80 border-white/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans mb-1">
                        {msg.formulaCard.title || 'Formula'}
                      </p>
                      <p className={`text-xs sm:text-[13px] font-mono font-semibold ${
                        isDark ? 'text-cyan-300' : 'text-blue-700'
                      }`}>
                        {msg.formulaCard.formula}
                      </p>
                    </div>
                  )}

                  {/* Actions Row: Copy & Listen Aloud (Sarvam) */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-sans">
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="flex items-center gap-1 hover:text-slate-200 transition py-1"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {msg.spokenText && (
                      <button
                        onClick={() => playVoice(msg.spokenText)}
                        className={`flex items-center gap-1 transition py-1 font-medium ${
                          isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Listen Aloud</span>
                      </button>
                    )}
                  </div>

                  {/* "Keep going" Suggested Follow-up Questions (Identical to Vanna Assist in Image 2) */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className={`mt-4 pt-3.5 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                      <p className={`text-xs font-semibold mb-2 font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Keep going
                      </p>
                      <div className="space-y-1.5">
                        {msg.suggestions.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(suggestion)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-[12.5px] border transition-all duration-200 font-medium leading-snug group flex items-center justify-between gap-2 ${
                              isDark
                                ? 'bg-slate-900/60 hover:bg-cyan-500/10 border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-200'
                                : 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700'
                            }`}
                          >
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area (Identical to Vanna Assist Floating Bar) */}
        <div className={`p-3.5 sm:p-4 border-t shrink-0 ${
          isDark ? 'border-white/10 bg-[#0B1437]/90' : 'border-slate-200 bg-white/95'
        }`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`flex items-center gap-2 p-1.5 pl-2.5 rounded-2xl border transition-all ${
              isDark
                ? 'bg-slate-900/90 border-white/10 focus-within:border-cyan-500/50 shadow-inner'
                : 'bg-slate-50 border-slate-200 focus-within:border-blue-400 shadow-sm'
            }`}
          >
            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-md'
                  : isDark
                  ? 'text-slate-400 hover:text-cyan-400 hover:bg-white/5'
                  : 'text-slate-500 hover:text-blue-600 hover:bg-slate-200/60'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak via Microphone'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Input Field */}
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything..."
              className={`flex-1 bg-transparent text-xs sm:text-sm focus:outline-none px-1 ${
                isDark ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'
              }`}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
