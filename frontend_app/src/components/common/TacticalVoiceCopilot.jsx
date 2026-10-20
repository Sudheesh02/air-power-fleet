import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Sparkles,
  Bot,
  User,
  Settings2,
  ChevronDown,
  RotateCcw,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square
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
      displayText: `### 🇮🇳 Jai Hind! Vayu-AI Tactical Voice Copilot Online
Connected to **Sarvam AI Voice Engine** (\`bulbul:v3\`) and IAF Air Power Knowledge Core.
I have full tactical situational awareness of:
- **5-Stage Gas-Path Thermodynamic Twin** ($T_{30}, P_{30}, \\text{EGT}$ telemetry)
- **Conformal RUL Analytics** ($\\mu - 1.645\\sigma$ 90% confidence threshold)
- **In-Flight RLS Sensor Drift Calibration**
- **All 20 Combat Airframes** (Su-30MKI, Tejas Mk1A, Rafale, C-17, ALH Rudra)
- **Spares & Logistics Supply Chain** (FOB Thanjavur / Sulur / Ambala to Central Depots)

*Speak via microphone or tap a briefing button below!*`,
      spokenText: 'Jai Hind! Vayu-AI Tactical Voice Copilot is online and connected to the Air Power fleet system. How can I assist your mission briefing today?'
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [selectedSpeaker, setSelectedSpeaker] = useState('shubh');
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('sarvam_api_key') || import.meta.env.VITE_SARVAM_API_KEY || '';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);

  const messagesEndRef = useRef(null);
  const recognizerRef = useRef(null);

  const quickPrompts = [
    { label: '⚡ Sortie Clearance Briefing', prompt: 'Give me a sortie clearance briefing' },
    { label: '🔬 5-Stage Twin Physics', prompt: 'Explain the 5-stage thermodynamic turbofan twin' },
    { label: '🧮 Conformal RUL Math', prompt: 'How does conformal RUL calculation work?' },
    { label: '🚨 Why is SB-024 Grounded?', prompt: 'Why is tail SB-024 grounded?' },
    { label: '📡 In-Flight RLS Drift', prompt: 'Explain the in-flight RLS sensor drift filter' },
    { label: '🧠 NLP Snag Fusion', prompt: 'Explain the multi-modal NLP snag-to-sensor fusion' },
    { label: '📦 FOB Spares vs Depot', prompt: 'What is the status of base spares and central depot logistics?' },
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
    }, 200);
  };

  // Helper to render basic markdown formatting cleanly
  const renderFormattedText = (text) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-sm text-cyan-400 mt-2 mb-1 flex items-center gap-1.5">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h5 key={idx} className="font-semibold text-xs text-blue-300 mt-1 mb-0.5">
            {line.replace('#### ', '')}
          </h5>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300 my-0.5 pl-1 leading-relaxed">
            <span className="text-cyan-400 font-bold shrink-0">&bull;</span>
            <span>{line.replace('- ', '')}</span>
          </div>
        );
      }
      if (line.startsWith('|')) {
        return (
          <div key={idx} className="font-mono text-[11px] text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded overflow-x-auto whitespace-pre">
            {line}
          </div>
        );
      }
      if (line.startsWith('$$')) {
        return (
          <div key={idx} className="font-mono text-xs text-amber-300 bg-slate-950/80 px-2 py-1 rounded my-1 border border-amber-500/20 text-center">
            {line.replace(/\$\$/g, '')}
          </div>
        );
      }
      if (!line.trim()) return <div key={idx} className="h-1" />;
      return (
        <p key={idx} className="text-xs text-slate-200 my-0.5 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <>
      {/* 1. Floating Tactical Voice Orb (Bottom-Right) */}
      {!isVoiceAgentOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 group">
          <div className="hidden sm:flex flex-col items-end pr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="text-[11px] font-bold text-cyan-300 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/30 shadow-lg">
              Talk to Vayu-AI Voice Agent
            </span>
            <span className="text-[9px] text-slate-400 pr-1">Powered by Sarvam AI (bulbul:v3)</span>
          </div>

          <button
            onClick={() => setIsVoiceAgentOpen(true)}
            aria-label="Open Vayu-AI Voice Agent"
            className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#0052D4] via-[#4364F7] to-[#6FB1FC] p-0.5 shadow-[0_0_25px_rgba(0,117,255,0.6)] hover:shadow-[0_0_35px_rgba(0,213,255,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer"
          >
            <div className="w-full h-full rounded-full bg-slate-950/70 backdrop-blur-md flex items-center justify-center">
              <Bot className="w-6 h-6 text-cyan-300 animate-pulse" />
              {/* Radial ping ring */}
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-sm animate-ping opacity-75" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-sm" />
            </div>
          </button>
        </div>
      )}

      {/* 2. Interactive Tactical Voice Copilot Panel */}
      {isVoiceAgentOpen && (
        <div
          className={`fixed bottom-4 right-3 sm:right-6 z-50 w-[95vw] sm:w-[540px] h-[640px] max-h-[88vh] rounded-2xl shadow-2xl flex flex-col border backdrop-blur-2xl transition-all duration-300 ${
            isDark
              ? 'bg-[#12131C]/95 border-cyan-500/30 text-white shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
              : 'bg-white/95 border-blue-200 text-slate-900 shadow-[0_20px_50px_rgba(0,117,255,0.15)]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-gradient-to-r from-blue-900/30 to-cyan-900/10 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center shadow-md shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight">Vayu-AI Tactical Copilot</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    SARVAM v3
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Voice Link Active &bull; Indian Air Force Ops
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
                  className={`text-[11px] font-semibold py-1 px-2 pr-6 rounded-md appearance-none cursor-pointer border ${
                    isDark
                      ? 'bg-slate-900/90 text-cyan-300 border-white/15'
                      : 'bg-slate-100 text-blue-900 border-slate-300'
                  }`}
                  title="Select Voice Speaker"
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
                className={`p-1.5 rounded-md border text-xs transition ${
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

              {/* Settings Cog */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-md border text-xs transition ${
                  showSettings
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : isDark
                    ? 'border-white/10 hover:bg-white/10 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="Voice Agent Settings"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  stopAudio();
                  setIsVoiceAgentOpen(false);
                }}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Sub-Drawer */}
          {showSettings && (
            <div className="px-4 py-2.5 bg-slate-950/90 border-b border-white/10 text-xs flex flex-col gap-2 shrink-0 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Voice Synthesis Engine</span>
                <span className="text-[10px] text-cyan-400 font-mono">bulbul:v3 (Sarvam AI)</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-slate-400 shrink-0">Sarvam API Key:</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    localStorage.setItem('sarvam_api_key', e.target.value);
                  }}
                  placeholder="sk_..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Automatically speak responses aloud</span>
                </label>
                <button
                  onClick={() => playVoice('Tactical voice link verified. Ready for combat mission briefing.')}
                  className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 text-[10px] font-bold"
                >
                  Test Voice
                </button>
              </div>
            </div>
          )}

          {/* Equalizer Sound Wave Indicator (when speaking or listening) */}
          {(isPlayingAudio || isListening) && (
            <div className="px-4 py-1.5 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                <span>{isListening ? 'Listening to speech...' : 'Synthesizing voice briefing...'}</span>
              </div>
              <div className="flex items-center gap-0.5 h-3.5">
                {[4, 8, 12, 6, 14, 10, 5, 11, 7, 13, 9, 6].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 0.08}s`
                    }}
                    className="w-1 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-full animate-bounce"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 font-sans">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'agent' && (
                  <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs shadow-md transition-all ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-tr-none'
                      : isDark
                      ? 'bg-slate-900/80 border border-white/10 text-slate-100 rounded-tl-none'
                      : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 opacity-70 text-[10px]">
                    <span className="font-bold tracking-wider uppercase">
                      {msg.sender === 'user' ? 'Pilot / Commander' : 'Vayu-AI Tactical Copilot'}
                    </span>
                    <span>{msg.time}</span>
                  </div>

                  <div className="leading-relaxed">
                    {msg.sender === 'agent' ? renderFormattedText(msg.displayText) : msg.displayText}
                  </div>

                  {/* Listen Again Button */}
                  {msg.sender === 'agent' && msg.spokenText && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between">
                      <button
                        onClick={() => playVoice(msg.spokenText)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-cyan-300 hover:text-cyan-200 transition"
                      >
                        <Play className="w-2.5 h-2.5" />
                        <span>Listen Aloud</span>
                      </button>
                      <span className="text-[9px] text-slate-400 font-mono">Sarvam bulbul:v3</span>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <User className="w-3.5 h-3.5 text-slate-200" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-3 py-1.5 border-t border-white/5 bg-slate-950/40 shrink-0 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.prompt)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap border shrink-0 transition ${
                  isDark
                    ? 'bg-slate-900/90 hover:bg-cyan-500/20 border-white/10 hover:border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-100 hover:bg-blue-50 border-slate-300 hover:border-blue-400 text-blue-900'
                }`}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input & Microphone Action Bar */}
          <div className="p-3 border-t border-white/10 bg-slate-950/60 rounded-b-2xl shrink-0">
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
                title={isListening ? 'Stop Listening' : 'Click to Speak via Microphone'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={isListening ? 'Listening to voice...' : 'Ask about RUL, 5-stage twin, tail SB-024, sortie clearance...'}
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
                className="p-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(0,117,255,0.4)] active:scale-95 transition"
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
