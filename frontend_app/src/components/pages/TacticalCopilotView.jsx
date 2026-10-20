import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Radio,
  Shield,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Activity,
  RotateCcw,
  Play,
  Square,
  MessageSquare,
  Terminal,
  Plane,
  Wrench,
  Cpu,
  ChevronRight
} from 'lucide-react';
import GlassCard from '../common/GlassCard';
import {
  VOICE_SPEAKERS,
  synthesizeSpeech,
  createSpeechRecognizer,
  queryVayuBrain
} from '../../services/voiceAgentService';

const QUICK_MISSIONS = [
  {
    id: 'briefing',
    title: 'Squadron Sortie & 4-Ship Formation Briefing',
    prompt: 'Give me a full sortie clearance and 4-ship formation readiness briefing.',
    category: 'FLIGHT OPS',
    metric: '13/20 READY',
    icon: Plane
  },
  {
    id: 'sb024',
    title: 'AOG Diagnostic: Tail SB-024 (AFS Thanjavur)',
    prompt: 'Why is tail SB-024 grounded at AFS Thanjavur and what is the depot ETA?',
    category: 'AOG TRIAGE',
    metric: 'HPC 21.2%',
    icon: AlertTriangle
  },
  {
    id: 'kh204_rb004',
    title: 'Grounded Fleet Audit: KH-204 & RB-004',
    prompt: 'What is the status of grounded tails KH-204 at Sulur and RB-004 at Ambala?',
    category: 'HANGAR HOLD',
    metric: '2 TAILS HOLD',
    icon: Wrench
  },
  {
    id: 'cmapss',
    title: 'NASA C-MAPSS (FD001-FD004) & Online RLS Drift',
    prompt: 'Show NASA C-MAPSS benchmark RMSE scores and Online RLS sensor drift metrics.',
    category: 'ML VALIDATION',
    metric: '100% CATCH',
    icon: Cpu
  },
  {
    id: 'twin',
    title: '5-Stage Gas Path Thermodynamic Stations',
    prompt: 'Explain the 5-stage thermodynamic turbofan twin stations and residuals.',
    category: 'PROPULSION',
    metric: 'STN 2 TO 50',
    icon: Activity
  },
  {
    id: 'conformal',
    title: 'Split Conformal 90% Lower Bound Formulation',
    prompt: 'How does the Conformal RUL 90% confidence lower bound prevent in-flight failure?',
    category: 'SAFETY GATE',
    metric: '90% COVERAGE',
    icon: Shield
  }
];

const GROUNDED_WATCHLIST = [
  {
    tail: 'SB-024',
    type: 'Su-30MKI',
    base: 'AFS Thanjavur',
    fault: 'Station 30 HPC Blade Erosion',
    stageHealth: '21.2%',
    consRul: '16.4h',
    prompt: 'Why is tail SB-024 grounded at AFS Thanjavur?'
  },
  {
    tail: 'KH-204',
    type: 'Tejas Mk1A',
    base: 'AFS Sulur',
    fault: 'Station 24 LPC & Fuel Metering',
    stageHealth: '28.0%',
    consRul: '19.5h',
    prompt: 'What is the status of grounded tail KH-204 at Sulur?'
  },
  {
    tail: 'RB-004',
    type: 'Rafale EH',
    base: 'AFS Ambala',
    fault: 'Station 50 LPT Thermal Creep',
    stageHealth: '24.0%',
    consRul: '17.8h',
    prompt: 'What is the status of grounded tail RB-004 at Ambala?'
  }
];

export default function TacticalCopilotView({ isDark }) {
  // 'briefing' (Structured Comms & Telemetry Console) or 'voice' (Live Acoustic Push-to-Talk Console)
  const [mode, setMode] = useState('briefing');

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `VAYU-OPS Flight Line Intelligence is online and synchronized with all 20 frontline airframes.

Active Fleet Snapshot:
• Readiness: 13 Mission Ready (65.0%) | 4 Scheduled Maintenance | 3 Grounded (AOG)
• Grounded Airframes:
  - SB-024 (Su-30MKI, Thanjavur): Station 30 HPC erosion (21.2% stage health, 16.4h Cons. RUL)
  - KH-204 (Tejas Mk1A, Sulur): Station 24 LPC & fuel metering fault (28.0% stage health, 19.5h Cons. RUL)
  - RB-004 (Rafale, Ambala): Station 50 LPT thermal creep (24.0% stage health, 17.8h Cons. RUL)
• Validated Prognostics: NASA C-MAPSS FD001–FD004 (100% critical failure catch rate) + Online RLS Drift Filter (λ = 0.992).`,
      spokenText: "VAYU-OPS Flight Line Intelligence online. Across 20 frontline airframes, 13 are mission ready, 4 are in scheduled maintenance, and 3 are grounded: SB-024 at Thanjavur, KH-204 at Sulur, and RB-004 at Ambala. Ready for voice or text query.",
      formulaCard: {
        title: "Fleet Readiness & Prognostic Gate",
        formula: "13/20 Mission Ready (65.0%) | 3 AOG (SB-024, KH-204, RB-004)"
      },
      suggestions: [
        "Give me a sortie clearance briefing",
        "Why is tail SB-024 grounded at AFS Thanjavur?",
        "What is the status of grounded tails KH-204 and RB-004?",
        "Show NASA C-MAPSS benchmark and RLS drift metrics"
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
  const [sarvamKey, setSarvamKey] = useState(() => localStorage.getItem('SARVAM_API_KEY') || 'REDACTED_SARVAM_KEY');
  const [showSettings, setShowSettings] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speechError, setSpeechError] = useState(null);

  const chatEndRef = useRef(null);
  const currentAudioRef = useRef(null);
  const recognizerRef = useRef(null);
  const handleSendRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

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
    setSpeechError(null);
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

      if (autoSpeak || mode === 'voice') {
        await speakResponse(response.spokenText);
      }
    }, 280);
  }, [inputText, autoSpeak, mode, speakResponse]);

  // Keep latest handleSendMessage in ref so SpeechRecognition never suffers from stale closure
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
      onError: (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
        if (err === 'not-allowed') {
          setSpeechError('Microphone permission denied by browser. Use text input or enable mic access.');
        }
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
    setSpeechError(null);
    if (!recognizerRef.current) {
      setSpeechError('Speech recognition requires Chrome, Edge, or Safari.');
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

  const resetConversation = () => {
    stopAudio();
    setMessages([messages[0]]);
    setLiveTranscript('');
    setSpeechError(null);
  };

  const renderMessageContent = (msg) => {
    const paragraphs = msg.text.split('\n\n');

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {paragraphs.map((para, pIdx) => {
            const lines = para.split('\n');
            const isList = lines.some(l => l.trim().startsWith('•') || l.trim().startsWith('-'));

            if (isList) {
              const headerLine = !lines[0].trim().startsWith('•') && !lines[0].trim().startsWith('-') ? lines[0] : null;
              const listLines = headerLine ? lines.slice(1) : lines;

              return (
                <div key={pIdx} className="space-y-1.5">
                  {headerLine && (
                    <div className={`text-xs font-semibold uppercase tracking-wider ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {headerLine}
                    </div>
                  )}
                  <ul className="space-y-1.5 pl-1">
                    {listLines.map((line, lIdx) => {
                      const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
                      const colonIndex = cleanLine.indexOf(':');
                      if (colonIndex !== -1 && colonIndex < 42) {
                        const label = cleanLine.slice(0, colonIndex);
                        const rest = cleanLine.slice(colonIndex + 1);
                        return (
                          <li key={lIdx} className="flex items-start gap-2.5 text-sm leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                              <strong className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{label}:</strong>
                              {rest}
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li key={lIdx} className="flex items-start gap-2.5 text-sm leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{cleanLine}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            }

            return (
              <p key={pIdx} className={`text-sm leading-relaxed ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {para}
              </p>
            );
          })}
        </div>

        {/* Clean Engineering Specification Box */}
        {msg.formulaCard && (
          <div className={`p-3.5 rounded-lg border ${
            isDark
              ? 'bg-slate-950/90 border-slate-800'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-mono uppercase tracking-widest ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {msg.formulaCard.title}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isDark ? 'bg-slate-900 text-sky-400 border border-slate-800' : 'bg-white text-blue-700 border border-slate-200'
              }`}>
                VERIFIED RULE
              </span>
            </div>
            <div className={`text-xs sm:text-sm font-mono font-semibold tracking-tight tabular-nums ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {msg.formulaCard.formula}
            </div>
          </div>
        )}

        {/* Follow-up Tactical Queries */}
        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className={`pt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <div className={`text-[10px] font-mono uppercase tracking-wider mb-2 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Follow-Up Operational Queries
            </div>
            <div className="flex flex-wrap gap-1.5">
              {msg.suggestions.map((suggestion, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => handleSendMessage(suggestion)}
                  className={`text-left text-xs px-3 py-1.5 rounded-md border transition-colors flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-blue-500/50'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <span>{suggestion}</span>
                  <ChevronRight className="w-3 h-3 text-blue-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const activeMessage = [...messages].reverse().find(m => m.role === 'assistant') || messages[0];
  const activeSpeakerObj = VOICE_SPEAKERS.find(s => s.id === selectedSpeaker) || VOICE_SPEAKERS[0];

  return (
    <div className="space-y-5">
      {/* Top Command Header Bar */}
      <GlassCard className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-blue-700 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  VAYU-OPS Flight Line Intelligence & Voice Terminal
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                  isDark
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  SARVAM BULBUL:V3 TTS
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Bilingual Indian-English acoustic briefing terminal synchronized with 20 aircraft digital twins, C-MAPSS prognostics, and depot pipelines
              </p>
            </div>
          </div>

          {/* Mode Switcher & Audio Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`p-1 rounded-lg border flex items-center gap-1 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setMode('briefing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  mode === 'briefing'
                    ? 'bg-blue-700 text-white'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Briefing Log</span>
              </button>
              <button
                onClick={() => setMode('voice')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  mode === 'voice'
                    ? 'bg-blue-700 text-white'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Acoustic PTT Console</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (isSpeaking) stopAudio();
                setAutoSpeak(!autoSpeak);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                autoSpeak
                  ? isDark
                    ? 'bg-slate-900 border-slate-700 text-emerald-400'
                    : 'bg-white border-slate-200 text-emerald-700'
                  : isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-400'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
              title="Toggle automatic voice synthesis on response"
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{autoSpeak ? 'Voice Out: ON' : 'Voice Out: MUTE'}</span>
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                showSettings
                  ? 'bg-blue-700 border-blue-500 text-white'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Voice Officer</span>
            </button>

            <button
              onClick={resetConversation}
              className={`p-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Reset Comms Log"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Voice Officer & API Key Drawer */}
        {showSettings && (
          <div className={`mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div>
              <label className={`block text-[11px] font-mono uppercase tracking-wider mb-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Briefing Officer Voice Profile (Sarvam en-IN)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {VOICE_SPEAKERS.map((spk) => (
                  <button
                    key={spk.id}
                    onClick={() => setSelectedSpeaker(spk.id)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      selectedSpeaker === spk.id
                        ? isDark
                          ? 'bg-blue-950/50 border-blue-500/60 text-white'
                          : 'bg-blue-50 border-blue-500 text-slate-900'
                        : isDark
                          ? 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{spk.name}</span>
                      <span className="text-[10px] font-mono text-sky-400">{spk.callsign}</span>
                    </div>
                    <div className="text-[11px] opacity-75 truncate mt-0.5">{spk.role}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-mono uppercase tracking-wider mb-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Sarvam AI Subscription Key (Fallback to Web Speech API if empty)
              </label>
              <input
                type="password"
                value={sarvamKey}
                onChange={(e) => handleSaveKey(e.target.value)}
                placeholder="sk_..."
                className={`w-full px-3 py-2 rounded-lg text-xs font-mono border outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                }`}
              />
              <p className={`text-[11px] mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Uses Sarvam <code className="font-mono">bulbul:v3</code> neural Indian-English synthesis with automatic browser Web Speech API failover.
              </p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Main Content Layout: 8-Col Comms Terminal + 4-Col Operational Dispatch & Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Columns: Active Mode View */}
        <div className="lg:col-span-8">
          {mode === 'briefing' ? (
            <GlassCard className="flex flex-col h-[640px] overflow-hidden">
              {/* Console Status Bar */}
              <div className={`px-5 py-3 border-b flex items-center justify-between ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${
                    isSpeaking ? 'bg-emerald-400' : isListening ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <span className={`text-xs font-mono font-semibold uppercase tracking-wider ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {activeSpeakerObj.callsign} • {activeSpeakerObj.name} ({activeSpeakerObj.role})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isSpeaking && (
                    <button
                      onClick={stopAudio}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop Audio</span>
                    </button>
                  )}
                  <span className={`text-[11px] font-mono tabular-nums ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {messages.length} LOG ENTRIES
                  </span>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
                        msg.role === 'user'
                          ? 'text-blue-400'
                          : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {msg.role === 'user' ? 'COMMANDER QUERY' : `${activeSpeakerObj.callsign} BRIEFING`}
                      </span>
                      <span className={`text-[10px] font-mono tabular-nums ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {msg.timestamp}
                      </span>
                      {msg.role === 'assistant' && msg.spokenText && (
                        <button
                          onClick={() => speakResponse(msg.spokenText)}
                          className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                            isDark
                              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                          title="Replay voice briefing"
                        >
                          <Volume2 className="w-3 h-3 text-blue-500" />
                          <span>Replay</span>
                        </button>
                      )}
                    </div>

                    <div
                      className={`max-w-[92%] rounded-xl p-4 ${
                        msg.role === 'user'
                          ? 'bg-blue-700 text-white border border-blue-500/40'
                          : isDark
                          ? 'bg-slate-900/95 border border-slate-800 text-slate-100'
                          : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                      ) : (
                        renderMessageContent(msg)
                      )}
                    </div>
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex items-center gap-2.5 text-xs font-mono text-slate-400 px-2">
                    <Activity className="w-4 h-4 text-blue-500 animate-spin" />
                    <span>Correlating C-MAPSS prognostic vectors & base inventory...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Command Bar */}
              <div className={`p-3.5 border-t ${
                isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {speechError && (
                  <div className="mb-2 px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center justify-between">
                    <span>{speechError}</span>
                    <button onClick={() => setSpeechError(null)} className="text-[10px] underline ml-2">Dismiss</button>
                  </div>
                )}

                {isListening && (
                  <div className="mb-2 px-3 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center justify-between">
                    <span>MIC LIVE: {liveTranscript || 'Listening for aircraft tail number or tactical query...'}</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold">Speak Now</span>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`px-3.5 py-2.5 rounded-lg border flex items-center gap-2 text-xs font-semibold transition-colors shrink-0 ${
                      isListening
                        ? 'bg-red-600 text-white border-red-500'
                        : isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                    title={isListening ? 'Stop Microphone' : 'Push to Speak Query'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-500" />}
                    <span className="hidden sm:inline">{isListening ? 'Stop Mic' : 'Voice Mic'}</span>
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask about SB-024, KH-204, RB-004, 4-ship formation clearance, or C-MAPSS RMSE..."
                    className={`flex-1 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm border outline-none transition-colors ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                    }`}
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className={`px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 ${
                      inputText.trim()
                        ? 'bg-blue-700 hover:bg-blue-600 text-white border border-blue-500/40'
                        : isDark
                        ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Transmit</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </GlassCard>
          ) : (
            /* Acoustic Push-To-Talk Console Mode (Clean, Hardware-Grade, No Neon Toy Rings) */
            <GlassCard className="p-6 flex flex-col justify-between h-[640px]">
              {/* Top Acoustic Channel Header */}
              <div className={`flex flex-wrap items-center justify-between gap-3 pb-4 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-blue-500 font-semibold">
                    ACOUSTIC CHANNEL • {activeSpeakerObj.callsign}
                  </div>
                  <h3 className={`text-base font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activeSpeakerObj.name} — {activeSpeakerObj.role}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
                    isListening
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : isSpeaking
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : isDark
                      ? 'bg-slate-900 text-slate-400 border-slate-800'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {isListening ? 'STATE: MIC RECEIVING' : isSpeaking ? 'STATE: TRANSMITTING AUDIO' : 'STATE: STANDBY'}
                  </span>
                </div>
              </div>

              {/* Center Push-to-Talk Hardware Control & Live Telemetry Transcript */}
              <div className="my-auto flex flex-col items-center text-center max-w-xl mx-auto w-full py-6">
                <button
                  onClick={isSpeaking ? stopAudio : toggleListening}
                  className={`w-28 h-28 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${
                    isListening
                      ? 'bg-red-600/20 border-red-500 text-red-400 ring-4 ring-red-500/15'
                      : isSpeaking
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 ring-4 ring-emerald-500/15'
                      : isDark
                      ? 'bg-slate-900 border-slate-700 hover:border-blue-500 text-slate-200'
                      : 'bg-slate-100 border-slate-300 hover:border-blue-600 text-slate-800'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-8 h-8" />
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold">End PTT</span>
                    </>
                  ) : isSpeaking ? (
                    <>
                      <Square className="w-7 h-7 fill-current" />
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Halt Audio</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-8 h-8 text-blue-500" />
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Push To Talk</span>
                    </>
                  )}
                </button>

                <div className="mt-5 w-full">
                  <div className={`text-xs font-mono uppercase tracking-wider mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {isListening
                      ? 'Live Speech-to-Text Capture'
                      : isSpeaking
                      ? 'Active Voice Transmission'
                      : 'Latest Tactical Briefing Output'}
                  </div>

                  <div className={`p-4 rounded-xl border text-left ${
                    isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <p className={`text-sm leading-relaxed ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {isListening
                        ? (liveTranscript || 'Listening... Ask about SB-024, KH-204, RB-004, or sortie readiness.')
                        : (activeMessage?.spokenText || activeMessage?.text)}
                    </p>

                    {activeMessage?.formulaCard && !isListening && (
                      <div className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
                        isDark ? 'border-slate-800 text-sky-400' : 'border-slate-200 text-blue-700'
                      }`}>
                        <span>{activeMessage.formulaCard.title}:</span>
                        <span className="font-bold">{activeMessage.formulaCard.formula}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Instant Voice Dispatch Buttons */}
              <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className={`text-[10px] font-mono uppercase tracking-wider mb-2.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  One-Click Acoustic Briefing Dispatches
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {QUICK_MISSIONS.slice(0, 3).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSendMessage(m.prompt)}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        isDark
                          ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="text-[10px] font-mono text-blue-500 font-semibold">{m.category}</div>
                      <div className="text-xs font-semibold truncate mt-0.5">{m.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right 4 Columns: Grounded Tail Watchlist & Structured Tactical Dispatch Matrix */}
        <div className="lg:col-span-4 space-y-5">
          {/* Grounded Airframe Live Watchlist */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-semibold block">
                  AOG HANGAR WATCHLIST
                </span>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  3 Grounded Combat Airframes
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                STRICT NO-GO
              </span>
            </div>

            <div className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {GROUNDED_WATCHLIST.map((item) => (
                <div key={item.tail} className="py-3 first:pt-1 last:pb-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold whitespace-nowrap ${
                        isDark ? 'text-sky-400' : 'text-blue-700'
                      }`}>
                        {item.tail}
                      </span>
                      <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {item.type}
                      </span>
                      <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        • {item.base}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSendMessage(item.prompt)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-blue-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-500'
                      }`}
                    >
                      Inspect
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{item.fault}</span>
                    <span className="font-mono tabular-nums text-red-400 font-semibold">
                      {item.stageHealth} | {item.consRul} RUL
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Tactical Briefing Presets */}
          <GlassCard className="p-5">
            <div className="mb-3">
              <span className={`text-[10px] font-mono uppercase tracking-widest font-semibold block ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                DIRECT QUERY DISPATCH
              </span>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Standard Flight Line Briefings
              </h3>
            </div>

            <div className="space-y-2">
              {QUICK_MISSIONS.map((m) => {
                const IconComp = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSendMessage(m.prompt)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors flex items-start justify-between gap-3 ${
                      isDark
                        ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <IconComp className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold leading-snug ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}>
                          {m.title}
                        </div>
                        <div className={`text-[11px] truncate mt-0.5 ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {m.prompt}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0 tabular-nums ${
                      isDark ? 'bg-slate-950 text-slate-300 border border-slate-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {m.metric}
                    </span>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
