import React, { useState, useEffect, useRef } from 'react';
import { MentorMessage } from '../types';
import { api } from '../services/api';
import {
  Bot,
  Sparkles,
  Send,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Headphones,
  Square,
  Radio,
  X,
  Play,
  ExternalLink,
} from 'lucide-react';

interface Props {
  onSelectConcept: (conceptName: string) => void;
  voiceMode?: boolean;
  onToggleVoiceMode?: () => void;
}

// Clean markdown, LaTeX math formulas, citations, and symbols for natural text-to-speech
function cleanTextForSpeech(raw: string): string {
  return raw
    // LaTeX math blocks: replace with clear spoken phrase
    .replace(/\$\$[\s\S]*?\$\$/g, ' mathematical formulation ')
    .replace(/\$[^\$]+?\$/g, ' ')
    // Citations e.g. [Attention Is All You Need (Vaswani et al.)] -> Attention Is All You Need by Vaswani et al
    .replace(/\[([^\]]+)\]/g, '$1')
    // Markdown formatting (bold, italic, backticks, hashes)
    .replace(/[*_#`~]/g, '')
    // Bullet dashes
    .replace(/^[-*•]\s+/gm, '')
    // URLs
    .replace(/https?:\/\/\S+/g, '')
    // Extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export const MentorPage: React.FC<Props> = ({
  onSelectConcept,
  voiceMode: propVoiceMode,
  onToggleVoiceMode,
}) => {
  const [messages, setMessages] = useState<MentorMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: `Hello Alex! I am your **Grounded AI Mentor** in MindGraph X.\n\nI answer your questions strictly grounded in your ingested research papers and cross-reference your live knowledge graph state. I estimate forgetting probability and identify prerequisite bottlenecks without hallucinations.\n\nYou can ask questions by typing or by tapping the **microphone button inside the input bar**. You can also toggle **Voice Mode** in the header for a hands-free conversation. What would you like to explore today?`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});

  // Voice Interaction State
  const [internalVoiceMode, setInternalVoiceMode] = useState(false);
  const voiceMode = propVoiceMode !== undefined ? propVoiceMode : internalVoiceMode;

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [autoRead, setAutoRead] = useState(false); // Global toggle in header: Auto-read responses
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceModeRef = useRef<boolean>(false);
  const loadingRef = useRef<boolean>(false);
  const speakingRef = useRef<boolean>(false);

  // Sync refs
  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    speakingRef.current = speakingMessageId !== null;
  }, [speakingMessageId]);

  const samplePrompts = [
    'Why is Attention considered my active bottleneck right now?',
    'How does RAG synthesize parametric and non-parametric memory?',
    'What are my weakest prerequisites before studying Transformers?',
  ];

  // Initialize Web Speech API (SpeechRecognition)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = navigator.language || 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setMicError(null);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const currentText = finalTranscript || interimTranscript;
          if (currentText) {
            setInputValue(currentText);
          }

          // In Full Voice Conversation Mode, auto-submit when user finishes speaking
          if (finalTranscript && voiceModeRef.current) {
            handleSend(finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setMicError('Microphone permission was denied. Please allow microphone access in your browser settings.');
          } else if (event.error !== 'no-speech') {
            setMicError(`Voice error: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        setSpeechSupported(true);
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
        setSpeechSupported(false);
      }
    } else if (navigator.mediaDevices && window.MediaRecorder) {
      // Fallback MediaRecorder for unsupported browsers
      setSpeechSupported(true);
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-To-Speech function using SpeechSynthesis
  const speakMessage = (msg: MentorMessage) => {
    if (!('speechSynthesis' in window)) return;

    // Stop current speech if any
    window.speechSynthesis.cancel();

    if (speakingMessageId === msg.id) {
      setSpeakingMessageId(null);
      return;
    }

    const cleaned = cleanTextForSpeech(msg.text);
    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = navigator.language || 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setSpeakingMessageId(msg.id);
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
      // In Full Voice Conversation Mode: auto-start listening after AI finishes speaking!
      if (voiceModeRef.current && !loadingRef.current) {
        setTimeout(() => {
          startListening();
        }, 350);
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
  };

  const startListening = () => {
    if (speakingRef.current) {
      stopSpeaking();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        return;
      } catch (e) {
        // Recognition may already be running or restarting
      }
    }

    // MediaRecorder fallback if Web Speech API isn't present
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          setIsListening(true);
          setMicError(null);
          audioChunksRef.current = [];
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          recorder.onstop = async () => {
            stream.getTracks().forEach((track) => track.stop());
            setIsListening(false);
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const formData = new FormData();
              formData.append('audio', audioBlob, 'recording.webm');
              try {
                const res = await fetch('/api/mentor/transcribe', {
                  method: 'POST',
                  body: formData,
                });
                const data = await res.json();
                if (data.text) {
                  setInputValue(data.text);
                  if (voiceModeRef.current) {
                    handleSend(data.text);
                  }
                }
              } catch (err) {
                console.error('Audio transcribe fallback failed:', err);
              }
            }
          };

          recorder.start();
        })
        .catch((err) => {
          console.error('Mic access error:', err);
          setMicError('Microphone permission was denied. Please allow microphone access.');
          setIsListening(false);
        });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
  };

  const requestMicPermission = async () => {
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError('Your browser does not support microphone capture.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted! Stop the stream tracks immediately
      stream.getTracks().forEach((track) => track.stop());
      setMicError(null);
      // Now start listening cleanly
      setTimeout(() => {
        startListening();
      }, 150);
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      setMicError('Microphone permission was denied. Please allow microphone access in your browser settings (click the lock/tune icon in the address bar).');
      if (voiceModeRef.current) {
        handleToggleVoiceMode();
      }
    }
  };

  const simulateVoiceDemo = (samplePrompt?: string, autoSend: boolean = true) => {
    setMicError(null);
    const demoText = samplePrompt || 'Why is Attention considered my active bottleneck right now?';
    setIsListening(true);
    setInputValue('');

    let charIdx = 0;
    const interval = setInterval(() => {
      charIdx += 2;
      setInputValue(demoText.slice(0, charIdx));
      if (charIdx >= demoText.length) {
        clearInterval(interval);
        setInputValue(demoText);
        setIsListening(false);
        if (autoSend || voiceModeRef.current) {
          setTimeout(() => {
            handleSend(demoText);
          }, 300);
        }
      }
    }, 30);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Toggle Voice Mode
  const handleToggleVoiceMode = () => {
    if (onToggleVoiceMode) {
      onToggleVoiceMode();
    } else {
      setInternalVoiceMode(!internalVoiceMode);
    }

    const nextMode = !voiceMode;
    if (!nextMode) {
      stopListening();
      stopSpeaking();
    } else {
      setMicError(null);
      if (!loading && speakingMessageId === null) {
        setTimeout(() => {
          startListening();
        }, 200);
      }
    }
  };

  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputValue).trim();
    if (!text || loading) return;

    // Guard: stop listening while generating response
    stopListening();

    const userMsg: MentorMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toISOString(),
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await api.askMentor(text);
      const assistantMsg: MentorMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: res.answer,
        evidence: res.evidence,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setExpandedEvidence((prev) => ({ ...prev, [assistantMsg.id]: true }));

      // Auto-read response if Auto-read is ON or Voice Mode is ON
      if (autoRead || voiceModeRef.current) {
        setTimeout(() => {
          speakMessage(assistantMsg);
        }, 150);
      }
    } catch (err) {
      console.error(err);
      const errorMsg: MentorMessage = {
        id: `asst-err-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: 'I encountered an issue retrieving passages or checking grounding against the vector index.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleEvidence = (msgId: string) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-hidden">
      {/* Top Banner Notice & Controls */}
      <div className="p-4 border-b border-border-subtle bg-bg-surface flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple font-semibold border border-border-accent">
              Strictly Grounded Retrieval
            </span>
            <span className="text-xs text-text-muted">Zero-Hallucination Guardrails &bull; User ID Scoped</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Explanations adapt to your current knowledge profile while citing verified source documents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Factual Grounding Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-success bg-success-bg border border-success/30 px-2.5 py-1 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            <span>Grounding Active</span>
          </div>

          {/* Auto-read responses Toggle */}
          <button
            onClick={() => setAutoRead(!autoRead)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              autoRead
                ? 'bg-accent-purple/20 border-accent-purple text-accent-purple shadow-sm font-semibold'
                : 'bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-accent'
            }`}
            title="Toggle auto-read assistant answers aloud"
            aria-label="Toggle auto-read assistant answers aloud"
          >
            {autoRead ? <Volume2 className="w-3.5 h-3.5 text-accent-purple" /> : <VolumeX className="w-3.5 h-3.5 text-text-muted" />}
            <span className="hidden sm:inline">Auto-read:</span>
            <span>{autoRead ? 'ON' : 'OFF'}</span>
          </button>

          {/* Voice-mode Toggle (Headphone icon) in Mentor Header */}
          <button
            onClick={handleToggleVoiceMode}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              voiceMode
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-500/40'
                : 'bg-bg-surface hover:bg-bg-elevated border-border-subtle hover:border-border-accent text-text-secondary'
            }`}
            title="Toggle Hands-Free Voice Conversation Mode"
            aria-label="Toggle Hands-Free Voice Conversation Mode"
          >
            <Headphones className={`w-3.5 h-3.5 ${voiceMode ? 'animate-bounce text-white' : 'text-accent-purple'}`} />
            <span>{voiceMode ? 'Voice Call Active' : 'Voice Mode'}</span>
            {voiceMode && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
          </button>
        </div>
      </div>

      {/* FULL VOICE CONVERSATION MODE BANNER */}
      {voiceMode && (
        <div className="px-6 py-3 bg-gradient-to-r from-purple-950/90 via-indigo-950/80 to-purple-900 border-b border-purple-500/40 flex items-center justify-between gap-4 animate-fade-in shadow-lg text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-400 flex items-center justify-center text-purple-300">
              <Radio className="w-4 h-4 animate-pulse text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Hands-Free Voice Conversation Active</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-semibold">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-purple-200/80">
                {isListening
                  ? 'Listening for your question... (Speak now)'
                  : speakingMessageId
                  ? 'AI Mentor speaking grounded answer...'
                  : loading
                  ? 'Grounding answer against research papers...'
                  : 'Ready for continuous voice conversation.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live recording indicator / waveform */}
            {isListening && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40">
                <span className="w-1 bg-rose-400 rounded-full animate-pulse h-3"></span>
                <span className="w-1 bg-purple-400 rounded-full animate-pulse h-5" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 bg-indigo-400 rounded-full animate-pulse h-2" style={{ animationDelay: '300ms' }}></span>
                <span className="w-1 bg-rose-400 rounded-full animate-pulse h-4" style={{ animationDelay: '450ms' }}></span>
                <span className="text-[10px] font-mono text-purple-200 ml-1">Listening</span>
              </div>
            )}

            <button
              onClick={handleToggleVoiceMode}
              className="px-3 py-1.5 rounded-xl bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-xs font-mono text-text-primary transition-colors cursor-pointer"
            >
              Exit Voice Mode
            </button>
          </div>
        </div>
      )}

      {/* Mic Permission Denied / Error Notification */}
      {micError && (
        <div className="mx-6 mt-3 p-4 rounded-2xl bg-danger-bg border border-danger/50 text-xs text-danger flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in shadow-xl">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary">{micError}</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-danger-bg text-danger border border-danger/30">
                  Browser Security
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                If running inside the AI Studio preview iframe, browsers restrict microphone access unless opened in a top-level tab. You can also test speech input with the instant Voice Demo below.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-text-primary text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
              title="Open app in a new browser tab for direct hardware microphone access"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3 h-3 text-text-muted" />
            </a>
            <button
              onClick={() => simulateVoiceDemo('Why is Attention considered my active bottleneck right now?', true)}
              className="px-2.5 py-1.5 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-md shadow-purple-600/30 cursor-pointer"
              title="Simulate speech query and test grounded answer + speech readout"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Voice Demo</span>
            </button>
            <button
              onClick={requestMicPermission}
              className="px-2.5 py-1.5 rounded-lg bg-danger/20 hover:bg-danger/30 border border-danger/50 text-danger text-[11px] font-medium transition-colors cursor-pointer"
            >
              Retry Access
            </button>
            <button
              onClick={() => setMicError(null)}
              className="p-1 rounded hover:bg-danger/10 text-danger cursor-pointer ml-1"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isEvidenceOpen = expandedEvidence[msg.id];
          const isThisSpeaking = speakingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-accent-purple/15 border border-border-accent flex items-center justify-center text-accent-purple shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed relative ${
                  isUser
                    ? 'bg-accent-purple text-white rounded-tr-none shadow-md'
                    : 'bg-bg-surface border border-border-subtle text-text-primary rounded-tl-none shadow-sm'
                } ${isThisSpeaking ? 'ring-2 ring-accent-purple' : ''}`}
              >
                {/* Assistant Message Header Bar with Speaker/Play Control */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle">
                    <span className="text-[10px] font-mono text-accent-purple font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-accent-purple" />
                      Grounded Synthesis
                    </span>

                    {/* Speaker / Read Aloud Button in top-right corner of response */}
                    <div className="flex items-center gap-1.5">
                      {isThisSpeaking && (
                        <div className="flex items-center gap-0.5 h-3 mr-1">
                          <span className="w-0.5 bg-accent-purple rounded-full animate-pulse h-2"></span>
                          <span className="w-0.5 bg-accent-purple rounded-full animate-pulse h-3" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-0.5 bg-accent-purple rounded-full animate-pulse h-1.5" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      )}
                      <button
                        onClick={() => speakMessage(msg)}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                          isThisSpeaking
                            ? 'bg-accent-purple border-accent-purple text-white animate-pulse'
                            : 'bg-bg-elevated border-border-subtle text-text-muted hover:text-accent-purple hover:border-border-accent'
                        }`}
                        title={isThisSpeaking ? 'Stop speaking' : 'Read answer aloud (Text-to-Speech)'}
                        aria-label={isThisSpeaking ? 'Stop speaking' : 'Read answer aloud (Text-to-Speech)'}
                      >
                        {isThisSpeaking ? (
                          <>
                            <Square className="w-2.5 h-2.5 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-2.5 h-2.5" />
                            <span>Play</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Text formatting with basic bold support */}
                <div className="whitespace-pre-wrap space-y-2">
                  {msg.text.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx}>
                      {paragraph.split('**').map((chunk, cIdx) =>
                        cIdx % 2 === 1 ? <strong key={cIdx} className={`font-semibold ${isUser ? 'text-white' : 'text-text-primary'}`}>{chunk}</strong> : chunk
                      )}
                    </p>
                  ))}
                </div>

                {/* Evidence Drawer for Assistant Messages */}
                {msg.evidence && (
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <button
                      onClick={() => toggleEvidence(msg.id)}
                      className="flex items-center justify-between w-full text-[11px] font-mono text-accent-purple hover:underline transition-colors py-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-success" />
                        Evidence & Semantic Grounding (Score: {Math.round(msg.evidence.grounding_score * 100)}%)
                      </span>
                      {isEvidenceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isEvidenceOpen && (
                      <div className="mt-2.5 space-y-3 bg-bg-elevated p-3 rounded-xl border border-border-accent text-[11px]">
                        {/* Mentioned Concept States */}
                        {msg.evidence.concepts_used.length > 0 && (
                          <div>
                            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                              Referenced Knowledge Graph Nodes:
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {msg.evidence.concepts_used.map((cu) => (
                                <button
                                  key={cu.name}
                                  onClick={() => onSelectConcept(cu.name)}
                                  className="px-2 py-0.5 rounded bg-bg-surface border border-border-subtle text-[10px] text-text-primary hover:border-border-accent transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>{cu.name}</span>
                                  <span className="font-mono text-accent-purple font-semibold">
                                    {Math.round(cu.confidence * 100)}%
                                  </span>
                                  {cu.is_bottleneck && (
                                    <span className="text-[9px] text-danger font-bold">[BOTTLENECK]</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Cited Passages */}
                        <div>
                          <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                            Retrieved Passages & Citations:
                          </span>
                          <div className="space-y-2 mt-1">
                            {msg.evidence.sources_cited.map((source, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-2.5 rounded-lg bg-bg-surface border border-border-subtle text-[11px] text-text-secondary"
                              >
                                <div className="flex items-center justify-between text-[10px] text-accent-purple font-medium">
                                  <span>{source.doc_title}</span>
                                  <span className="font-mono text-success">
                                    Similarity: {source.similarity_score}
                                  </span>
                                </div>
                                <p className="mt-1 text-text-muted italic">"{source.text_snippet}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-accent-purple flex items-center justify-center text-white shrink-0 mt-0.5 font-bold text-xs shadow-sm">
                  AM
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-accent-purple/15 border border-border-accent flex items-center justify-center text-accent-purple shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-bg-surface border border-border-subtle text-xs text-text-muted flex items-center gap-2 shadow-sm">
              <div className="w-3 h-3 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
              <span>Searching Qdrant vectors and verifying grounding against Neo4j concepts...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested prompts footer */}
      <div className="px-6 py-2 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-mono text-text-muted shrink-0">Suggested:</span>
          {samplePrompts.map((sp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sp)}
              className="px-3 py-1 rounded-full bg-bg-surface hover:bg-bg-elevated border border-border-subtle hover:border-border-accent text-[11px] text-text-secondary whitespace-nowrap transition-colors cursor-pointer"
            >
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Bar with Microphone LEFT INSIDE the Input Bar */}
      <div className="p-4 border-t border-border-subtle bg-bg-surface max-w-4xl mx-auto w-full">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2.5"
        >
          {/* Input Box with Mic button LEFT inside */}
          <div
            className={`flex-1 relative flex items-center rounded-2xl bg-bg-elevated border transition-all ${
              isListening
                ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20'
                : 'border-border-subtle focus-within:border-border-accent'
            }`}
          >
            {/* Mic icon button: left inside the input bar */}
            {speechSupported ? (
              <button
                type="button"
                onClick={toggleListening}
                disabled={loading}
                className={`ml-2 p-2 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 ring-2 ring-rose-400 animate-pulse'
                    : 'text-text-muted hover:text-accent-purple hover:bg-bg-surface'
                }`}
                title={isListening ? 'Stop recording voice' : 'Speak your question (Voice Input)'}
                aria-label={isListening ? 'Stop recording voice' : 'Speak your question (Voice Input)'}
              >
                {isListening ? (
                  <div className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <MicOff className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div
                className="ml-2 p-2 rounded-xl text-text-muted shrink-0"
                title="Voice input not supported in this browser"
              >
                <MicOff className="w-4 h-4" />
              </div>
            )}

            {/* Input field */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? "Listening to your voice... Speak your question" : "Ask a technical question about your curriculum or active bottlenecks..."}
              className="flex-1 py-3.5 px-3 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />

            {/* Live recording indicator / Waveform animation inside input */}
            {isListening && (
              <div className="mr-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/70 border border-rose-500/40">
                <span className="w-1 bg-rose-400 rounded-full animate-pulse h-3"></span>
                <span className="w-1 bg-rose-400 rounded-full animate-pulse h-4.5" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 bg-rose-400 rounded-full animate-pulse h-2.5" style={{ animationDelay: '300ms' }}></span>
                <span className="text-[10px] font-mono text-rose-400 font-semibold tracking-wider">REC</span>
              </div>
            )}
          </div>

          {/* Send Button right of input */}
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="p-3.5 rounded-2xl bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-40 text-white shadow-lg shadow-purple-600/30 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            title="Send question to Grounded AI Mentor"
            aria-label="Send question to Grounded AI Mentor"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
