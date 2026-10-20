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
  Settings2,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Shield,
  Activity,
  Layers
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  synthesizeSpeech,
  createSpeechRecognizer,
  queryVayuBrain,
  VOICE_SPEAKERS
} from '../../services/voiceAgentService';

export default function TacticalVoiceCopilot() {
  const { isDark, isVoiceAgentOpen, setIsVoiceAgentOpen, activeTab } = useTheme();

  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'agent',
      time: 'Just now',
      isGreetingCard: true,
      headline: 'Jai Hind, Commander.',
      subhead: 'Tactical Flight-Line Briefing Console Active',
      overview: 'Monitoring 20 frontline combat airframes, 5-stage gas-path thermodynamic telemetry, and forward base spares logistics.',
      metrics: [
        { label: 'Fleet Readiness', value: '13 / 20 Ready', status: 'ready' },
        { label: 'Sortie Clearance', value: '65.0% Fleet-wide', status: 'ready' },
        { label: 'AOG Maintenance Hold', value: 'SB-024 (HPC Wear 21.2%)', status: 'alert' },
        { label: 'Depot Supply Pipeline', value: '3 Active Convoys', status: 'neutral' },
      ],
      promptHint: 'Press the microphone to speak, or tap a flight-line directive below.',
      spokenText: 'Jai Hind, Commander. Tactical flight-line briefing console is active. Thirteen combat aircraft are mission ready, and tail SB-024 is on maintenance hold at Thanjavur. Awaiting your flight directive.'
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState('shubh');
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('sarvam_api_key') || import.meta.env.VITE_SARVAM_API_KEY || 'REDACTED_SARVAM_KEY';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);

  const messagesEndRef = useRef(null);
  const recognizerRef = useRef(null);

  const quickPrompts = [
    { label: 'Sortie Clearance Briefing', prompt: 'Give me a sortie clearance briefing' },
    { label: 'Why is SB-024 Grounded?', prompt: 'Why is tail SB-024 grounded?' },
    { label: '5-Stage Engine Telemetry', prompt: 'Explain the 5-stage thermodynamic turbofan twin' },
    { label: 'Conformal RUL Calculation', prompt: 'How does conformal RUL calculation work?' },
    { label: 'Spares & Depot Logistics', prompt: 'What is the status of base spares and central depot logistics?' },
    { label: 'Pilot Snag Log Fusion', prompt: 'Explain the multi-modal NLP snag-to-sensor fusion' },
  ];

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
  }, [selectedSpeaker, apiKey, autoSpeak]);

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
        apiKey: apiKey
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
      console.error('Audio playback error:', err);
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
      displayText: query
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
        displayText: response.displayText,
        spokenText: response.spokenText
      };

      setMessages((prev) => [...prev, agentMsg]);

      if (autoSpeak && response.spokenText) {
        playVoice(response.spokenText);
      }
    }, 150);
  };

  // Helper to cleanly parse and render inline text without raw asterisks or math code
  const formatInline = (text) => {
    if (!text) return null;
    const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^\$]+\$)/g);
    return tokens.map((token, i) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white tracking-tight">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code key={i} className="font-mono text-[11px] px-1 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/25">
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('$') && token.endsWith('$')) {
        return (
          <span key={i} className="font-mono text-[11px] font-semibold text-cyan-300 bg-cyan-950/30 px-1 py-0.2 rounded border border-cyan-500/20">
            {token.slice(1, -1)}
          </span>
        );
      }
      return token;
    });
  };

  // Structured message line formatter
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        return (
          <div key={idx} className="mt-2.5 mb-1.5 flex items-center gap-2">
            <div className="w-1.5 h-3.5 rounded-full bg-cyan-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-300 font-sans">
              {trimmed.replace('### ', '')}
            </h4>
          </div>
        );
      }

      if (trimmed.startsWith('#### ')) {
        return (
          <h5 key={idx} className="font-bold text-xs text-blue-300 mt-2 mb-1">
            {trimmed.replace('#### ', '')}
          </h5>
        );
      }

      if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
        const content = trimmed.replace(/^[•\-]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 my-1 pl-1 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
            <div className="flex-1">{formatInline(content)}</div>
          </div>
        );
      }

      if (trimmed.startsWith('|')) {
        return (
          <div key={idx} className="font-mono text-[11px] text-slate-300 bg-slate-950/80 px-2 py-1 rounded overflow-x-auto whitespace-pre my-1 border border-white/5">
            {line}
          </div>
        );
      }

      if (trimmed.startsWith('$$')) {
        return (
          <div key={idx} className="font-mono text-xs text-cyan-300 bg-slate-950/90 px-3 py-1.5 rounded-lg my-1.5 border border-cyan-500/30 text-center shadow-inner">
            {trimmed.replace(/\$\$/g, '')}
          </div>
        );
      }

      if (!trimmed) return <div key={idx} className="h-1" />;

      return (
        <p key={idx} className="text-xs text-slate-200 my-1 leading-relaxed">
          {formatInline(line)}
        </p>
      );
    });
  };

  return (
    <>
      {/* 1. Tactical Flight-Line Comms Trigger (Bottom-Right) */}
      {!isVoiceAgentOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 group">
          <div className="hidden sm:flex flex-col items-end pr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="text-[11px] font-bold text-cyan-300 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/30 shadow-lg">
              Flight-Line Audio Briefing
            </span>
            <span className="text-[9px] text-slate-400 pr-1">Encrypted CAS Voice Channel</span>
          </div>

          <button
            onClick={() => setIsVoiceAgentOpen(true)}
            aria-label="Open Tactical Flight-Line Briefing"
            className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0075FF] to-[#00D5FF] shadow-vision-glow hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border border-cyan-400/30"
          >
            <Radio className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-sm animate-pulse" />
          </button>
        </div>
      )}

      {/* 2. Tactical Operations Briefing Panel */}
      {isVoiceAgentOpen && (
        <div
          className={`fixed bottom-4 right-3 sm:right-6 z-50 w-[95vw] sm:w-[540px] h-[640px] max-h-[88vh] rounded-2xl shadow-2xl flex flex-col border backdrop-blur-2xl transition-all duration-300 ${
            isDark
              ? 'bg-[#0B1437]/95 border-cyan-500/30 text-white shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
              : 'bg-white/95 border-slate-200 text-[#1B2559] shadow-[0_20px_50px_rgba(0,117,255,0.15)]'
          }`}
        >
          {/* Tactical Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-gradient-to-r from-blue-900/40 to-cyan-900/20 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0075FF] to-[#00D5FF] flex items-center justify-center shadow-vision-glow shrink-0">
                <Radio className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight">
                <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
                  Flight-Line Tactical Briefing
                </h3>
                <p className="text-[10px] text-slate-300 flex items-center gap-1 font-sans mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Operational Comms &bull; Air Power Command
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1.5">
              {/* Speaker Select */}
              <div className="relative">
                <select
                  value={selectedSpeaker}
                  onChange={(e) => setSelectedSpeaker(e.target.value)}
                  className={`text-[11px] font-semibold py-1 px-2 pr-6 rounded-lg appearance-none cursor-pointer border ${
                    isDark
                      ? 'bg-slate-900/90 text-cyan-300 border-white/15'
                      : 'bg-slate-100 text-blue-900 border-slate-300'
                  }`}
                  title="Select Tactical Voice Officer"
                >
                  {VOICE_SPEAKERS.map((sp) => (
                    <option key={sp.id} value={sp.id} className="bg-slate-900 text-white">
                      {sp.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>

              {/* Audio Play/Stop Toggle */}
              <button
                onClick={stopAudio}
                className={`p-1.5 rounded-lg border text-xs transition ${
                  isPlayingAudio
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                    : isDark
                    ? 'border-white/10 hover:bg-white/10 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title={isPlayingAudio ? 'Stop Voice Playback' : 'Audio Status'}
              >
                {isPlayingAudio ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Settings Toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg border text-xs transition ${
                  showSettings
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : isDark
                    ? 'border-white/10 hover:bg-white/10 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="Comms Settings"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  stopAudio();
                  setIsVoiceAgentOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Sub-Drawer */}
          {showSettings && (
            <div className="px-4 py-2.5 bg-slate-950/95 border-b border-white/10 text-xs flex flex-col gap-2 shrink-0 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Voice Synthesis Engine</span>
                <span className="text-[10px] text-cyan-400 font-mono">Sarvam AI (bulbul:v3) &bull; Verified</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Automatically read aloud agent briefings</span>
                </label>
                <button
                  onClick={() => playVoice('Tactical flight-line communications verified. Ready for combat mission briefing.')}
                  className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 text-[10px] font-bold transition"
                >
                  Test Audio
                </button>
              </div>
            </div>
          )}

          {/* Equalizer Sound Wave Indicator */}
          {(isPlayingAudio || isListening) && (
            <div className="px-4 py-1.5 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300 font-sans">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                <span>{isListening ? 'Listening via tactical microphone...' : 'Transmitting flight-line audio...'}</span>
              </div>
              <div className="flex items-center gap-0.5 h-3.5">
                {[4, 8, 12, 6, 14, 10, 5, 11, 7, 13, 9, 6].map((h, i) => (
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

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 font-sans">
            {messages.map((msg) => {
              if (msg.isGreetingCard) {
                /* AUTHENTIC MILITARY BRIEFING GREETING CARD (Zero AI-slop) */
                return (
                  <div
                    key={msg.id}
                    className="p-4 rounded-2xl bg-gradient-to-b from-[#141C2E] to-[#0F172A] border border-cyan-500/30 shadow-vision-card"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <span className="font-extrabold text-xs text-white uppercase tracking-wider">
                          {msg.headline}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{msg.time}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {msg.overview}
                    </p>

                    {/* Operational Status Chips */}
                    <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
                      {msg.metrics.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-slate-900/80 border border-white/5 flex flex-col justify-between"
                        >
                          <span className="text-[10px] font-medium text-slate-400">{m.label}</span>
                          <span className={`text-xs font-bold mt-0.5 ${
                            m.status === 'alert'
                              ? 'text-red-400'
                              : m.status === 'ready'
                              ? 'text-emerald-400'
                              : 'text-cyan-300'
                          }`}>
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-cyan-300/80 font-medium italic">
                      {msg.promptHint}
                    </p>

                    {/* Listen Aloud Button */}
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                      <button
                        onClick={() => playVoice(msg.spokenText)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Listen to Briefing</span>
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">Channel: Commander Shubh</span>
                    </div>
                  </div>
                );
              }

              /* STANDARD CHAT MESSAGE */
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'agent' && (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#0075FF] to-[#00D5FF] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <Radio className="w-3 h-3 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-md transition-all ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-[#0075FF] to-[#0052D4] text-white rounded-tr-none'
                        : isDark
                        ? 'bg-[#141C2E]/90 border border-white/10 text-slate-100 rounded-tl-none'
                        : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 opacity-70 text-[10px]">
                      <span className="font-bold tracking-wider uppercase">
                        {msg.sender === 'user' ? 'Flight Commander' : 'Tactical Flight-Line Control'}
                      </span>
                      <span>{msg.time}</span>
                    </div>

                    <div className="leading-relaxed">
                      {msg.sender === 'agent' ? renderFormattedText(msg.displayText) : msg.displayText}
                    </div>

                    {/* Listen Aloud Button */}
                    {msg.sender === 'agent' && msg.spokenText && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                        <button
                          onClick={() => playVoice(msg.spokenText)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold transition active:scale-95"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Listen Aloud</span>
                        </button>
                        <span className="text-[9px] text-slate-400 font-mono">Audio: Sarvam Voice</span>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <User className="w-3 h-3 text-slate-200" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Directive Pills */}
          <div className="px-3 py-2 border-t border-white/5 bg-slate-950/40 shrink-0 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.prompt)}
                className={`text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap border shrink-0 transition active:scale-95 ${
                  isDark
                    ? 'bg-slate-900/90 hover:bg-cyan-500/20 border-white/10 hover:border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-100 hover:bg-blue-50 border-slate-300 hover:border-blue-400 text-blue-900'
                }`}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Action Bar */}
          <div className="p-3 border-t border-white/10 bg-slate-950/70 rounded-b-2xl shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500/30 border-red-500 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    : isDark
                    ? 'bg-slate-900 hover:bg-cyan-500/20 border-white/10 hover:border-cyan-500/40 text-cyan-400'
                    : 'bg-slate-100 hover:bg-blue-100 border-slate-300 text-blue-600'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak via Microphone'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={isListening ? 'Listening via microphone...' : 'Ask about sortie clearance, tail SB-024, RUL, engine twin...'}
                className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition ${
                  isDark
                    ? 'bg-slate-900/90 border-white/15 text-white placeholder-slate-500 focus:border-cyan-400'
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                }`}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-tr from-[#0075FF] to-[#00D5FF] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-vision-glow active:scale-95 transition"
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
