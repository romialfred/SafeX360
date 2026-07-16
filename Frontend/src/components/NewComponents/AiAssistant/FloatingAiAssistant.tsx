import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    IconX,
    IconSend,
    IconMicrophone,
    IconMicrophoneOff,
    IconMinimize,
    IconMaximize,
    IconRobot,
    IconUser,
    IconSparkles,
    IconVolume,
    IconVolumeOff,
    IconCopy,
    IconThumbUp,
    IconChartBar,
    IconHelmet,
    IconAlertTriangle,
    IconBulb,
} from '@tabler/icons-react';
import { matchDemoProcedure, WorkflowDiagram, type WorkflowStep } from './demoProcedures';

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: string;
    isTyping?: boolean;
    /** Workflow d'étapes colorées rendu sous le markdown (procédures HSE). */
    workflow?: WorkflowStep[];
    workflowTitle?: string;
    /** Résumé court lu par la synthèse vocale (à la place du markdown complet). */
    speechSummary?: string;
}

interface QuickAction {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    prompt: string;
    color: string;
}

const quickActions: QuickAction[] = [
    {
        id: 'proc-hauteur',
        label: 'Travail en hauteur',
        icon: IconHelmet,
        prompt: 'Quelle est la procédure de travail en hauteur ?',
        color: 'text-cyan-700'
    },
    {
        id: 'proc-evac',
        label: 'Évacuation toxique',
        icon: IconAlertTriangle,
        prompt: "Quelle est la procédure d'évacuation en cas de contamination toxique de l'air ?",
        color: 'text-rose-600'
    },
    {
        id: 'analyze-kpis',
        label: 'Analyze KPIs',
        icon: IconChartBar,
        prompt: 'Can you analyze our current safety KPIs?',
        color: 'text-blue-600'
    },
    {
        id: 'incident-report',
        label: 'Incident Report',
        icon: IconAlertTriangle,
        prompt: "Generate a summary of this month's incidents",
        color: 'text-red-600'
    },
    {
        id: 'ppe-status',
        label: 'PPE Status',
        icon: IconHelmet,
        prompt: 'What is the status of pending PPE requests?',
        color: 'text-purple-600'
    },
    {
        id: 'help-guide',
        label: 'Help Guide',
        icon: IconBulb,
        prompt: 'How can I use this platform effectively?',
        color: 'text-yellow-600'
    }
];

const FloatingAIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const speechSynthesis = window.speechSynthesis;
    const location = useLocation();
    const navigate = useNavigate();

    // Normalize content for Markdown rendering (convert leading • bullets)
    const preprocessContent = (text: string) =>
        text
            .replace(/\r\n/g, '\n')
            .split('\n')
            .map((line) => line.replace(/^\s*•\s+/, '- '))
            .join('\n');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Text-to-Speech function
    const speak = (text: string) => {
        if (isMuted || !speechSynthesis) return;

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.1;
        utterance.pitch = 1.8;
        utterance.volume = 0.9;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        // Try to select a female voice if available
        const voices = speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice =>
            voice.lang.startsWith('en') &&
            (voice.name.toLowerCase().includes('female') ||
                voice.name.toLowerCase().includes('samantha') ||
                voice.name.toLowerCase().includes('victoria') ||
                voice.name.toLowerCase().includes('google us english'))
        );

        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }

        speechSynthesis.speak(utterance);
    };

    // Welcome message when opening for the first time
    const handleFirstOpen = () => {
        if (!hasSpokenWelcome) {
            const welcomeMessage: Message = {
                id: '1',
                type: 'ai',
                content: "Hello! I'm SafeX Assist, your Health & Safety Assistant. How can I help you today?",
                timestamp: new Date().toISOString()
            };

            setMessages([welcomeMessage]);

            // Speak welcome message after a short delay
            setTimeout(() => {
                speak("Hello! I'm SafeX Assist, your Health and Safety Assistant. How can I help you today?");
            }, 500);

            setHasSpokenWelcome(true);
        }
    };

    const handleToggleOpen = () => {
        if (!isOpen) {
            setIsOpen(true);
            handleFirstOpen();
        } else {
            setIsOpen(false);
            // Stop any ongoing speech when closing
            speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = generateAIResponse(inputValue);
            setMessages(prev => [...prev, aiResponse]);
            setIsLoading(false);

            // Speak the AI response (résumé court pour les procédures longues)
            speak(aiResponse.speechSummary ?? aiResponse.content);
        }, 1500);
    };

    const generateAIResponse = (userInput: string): Message => {
        const input = userInput.toLowerCase();

        // Procédures HSE complètes (base de connaissances) — prioritaire
        const procedure = matchDemoProcedure(userInput);
        if (procedure) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: procedure.markdown,
                timestamp: new Date().toISOString(),
                workflow: procedure.workflow,
                workflowTitle: procedure.workflowTitle,
                speechSummary: procedure.speechSummary,
            };
        }

        if (input.includes('kpi') || input.includes('analyser') || input.includes('analyze') || input.includes('performance')) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `📊 **Current KPI Analysis**

**Key Indicators:**
• LTIFR: 1.2 (Target: 2.0) ✅ Below target
• TRIR: 2.8 (Target: 3.5) ✅ Excellent performance
• Training: 96% ✅ Above target
• Days without incident: 47 days 🎯

**Trends:**
📈 LTIFR improving (-0.8 vs last month)
📈 Training completion rising (+4%)

**Recommendations:**
1. Continue current initiatives
2. Analyze the increase in near misses for insights
3. Recognize the team for 47 incident-free days`,
                timestamp: new Date().toISOString()
            };
        }

        if (input.includes('incident') || input.includes('rapport') || input.includes('report')) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `🚨 **Incident Summary - January 2024**

**Total:** 23 incidents (↓ 3 vs December)

**By Category:**
• Slips/Trips/Falls: 8 incidents (35%)
• Chemical Exposure: 4 incidents (17%)
• Equipment Related: 6 incidents (26%)
• Near Misses: 5 incidents (22%)

**Investigation Status:**
• Closed: 16 (70%)
• Ongoing: 5 (22%)
• Pending: 2 (8%)

**Priority Actions:**
1. Improve housekeeping
2. Additional PPE training
3. Review equipment maintenance`,
                timestamp: new Date().toISOString()
            };
        }

        if (input.includes('epi') || input.includes('ppe') || input.includes('équipement') || input.includes('equipment')) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `🦺 **PPE Status - Pending Requests**

**Awaiting Approval:** 5 requests
• Safety helmets (25 units) - Construction team
• Chemical gloves (50 pairs) - Laboratory
• Safety goggles (15 units) - Maintenance
• Respirators (8 units) - Painting

**Budget:**
• Monthly budget: €5,000
• Spent: €3,200 (64%)
• Remaining: €1,800 (36%)

**⚠️ Action Required:**
2 requests are approaching the deadline (24h)`,
                timestamp: new Date().toISOString()
            };
        }

        if (input.includes('aide') || input.includes('help') || input.includes('utiliser') || input.includes('guide') || input.includes('use')) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `💡 **Quick Start Guide**

**Navigation:**
• **Home:** Overview of modules
• **Dashboard:** Real-time metrics
• **Modules:** Specialized features

**Core Functions:**
🔍 **Search:** Global search across the platform
📊 **Reports:** Detailed analytics and KPIs
👥 **Users:** Access management
⚙️ **Settings:** System configuration

**Tips:**
• Use filters to refine data
• Export reports to PDF/Excel
• Configure important notifications
• Use inline help (question mark icon)

**Common questions:**
• "How to create an incident report?"
• "Where to see overdue actions?"
• "How to approve a PPE request?"`,
                timestamp: new Date().toISOString()
            };
        }

        // Default response
        return {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: `I understand your question about "${userInput}".

🎯 **I can help with:**
• **KPI analyses** and safety metrics
• **Incident reports** and investigations
• **Action status** and PPE requests
• **Platform navigation**
• **Searching** for specific information

💬 **Example prompts:**
• "Analyze this month's KPIs"
• "Status of pending PPE requests"
• "How to create an incident report?"
• "Show overdue actions"

How can I assist more precisely?`,
            timestamp: new Date().toISOString()
        };
    };

    const handleQuickAction = (action: QuickAction) => {
        setInputValue(action.prompt);
        inputRef.current?.focus();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleVoiceInput = () => {
        setIsListening(!isListening);
        // Voice input implementation would go here
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (!isMuted) {
            speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    // Hide the floating assistant on the full Assistant page
    if (location.pathname === '/ai-assistant') {
        return null;
    }

    // Floating Button
    if (!isOpen) {
        return (
            <div className="fixed right-3 top-1/2 -translate-y-1/2 z-50">
                <button
                    onClick={handleToggleOpen}
                    aria-label="Ouvrir l'assistant SafeX"
                    className="group relative w-16 h-16 bg-gradient-to-r from-teal-500 to-sky-500 rounded-full shadow-2xl hover:shadow-teal-500/30 transition-all duration-300 hover:scale-110 animate-pulse"
                >
                    {/* Ripple Effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-sky-400 opacity-75 animate-ping"></div>

                    {/* Main Icon */}
                    <div className="relative flex items-center justify-center w-full h-full">
                        {/* Floating Button main icon */}
                        <IconSparkles className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />
                    </div>

                    {/* Notification Badge */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-xs text-white">AI</span>
                    </div>

                    {/* Tooltip — à GAUCHE de la bulle (elle est collée au bord droit),
                        non-cliquable pour ne jamais intercepter un clic sur le contenu. */}
                    <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        SafeX Assist — Assistant Santé &amp; Sécurité
                        <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900"></div>
                    </div>
                </button>
            </div>
        );
    }

    // Chat Window
    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* max-h + flex-col : sans plafond, sur écran court (< ~630px) l'en-tête
                (fermer/réduire) sortait du viewport et l'utilisateur était piégé. */}
            <div className={`
        bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300
        max-h-[calc(100vh-3rem)] flex flex-col
        ${isMinimized ? 'w-80 h-16' : 'w-96 '}
      `}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-sky-500 rounded-t-2xl">
                    <div className="flex items-center">
                        <div className="relative">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                                {/* Header avatar icon */}
                                <IconRobot className="w-6 h-6 text-purple-600" />
                            </div>
                            {isSpeaking && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
                            )}
                        </div>
                        {!isMinimized && (
                            <div>
                                <h3 className="text-white">SafeX Assist</h3>
                                <p className="text-purple-100 text-sm">Health & Safety Assistant</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        {!isMinimized && (
                            <>
                                {/* Open full Assistant page */}
                                <button
                                    onClick={() => { setIsOpen(false); setIsMinimized(false); navigate('/ai-assistant'); }}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Open Assistant"
                                >
                                    <IconMaximize className="w-4 h-4 text-white" />
                                </button>
                                {/* Mute toggle icons */}
                                <button
                                    onClick={toggleMute}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title={isMuted ? 'Enable sound' : 'Mute'}
                                >
                                    {isMuted ? (
                                        <IconVolumeOff className="w-4 h-4 text-white" />
                                    ) : (
                                        <IconVolume className="w-4 h-4 text-white" />
                                    )}
                                </button>
                                {/* Minimize/Maximize buttons */}
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Minimize"
                                >
                                    <IconMinimize className="w-4 h-4 text-white" />
                                </button>
                            </>
                        )}
                        {isMinimized && (
                            <button
                                onClick={() => setIsMinimized(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="Maximize"
                            >
                                <IconMaximize className="w-4 h-4 text-white" />
                            </button>
                        )}
                        {/* Close button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            title="Close"
                        >
                            <IconX className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 max-h-96 min-h-0 bg-gradient-to-b from-gray-50 to-white">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gradient-to-r from-teal-100 to-sky-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        {/* Empty-messages icon */}
                                        <IconSparkles className="w-8 h-8 text-purple-600" />
                                    </div>
                                    <h4 className="text-lg text-gray-900 mb-2">Hello!</h4>
                                    <p className="text-gray-600 text-sm">I'm SafeX Assist, your AI assistant for Health & Safety.</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* Avatar */}
                                            <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user'
                                                    ? 'bg-blue-500'
                                                    : 'bg-gradient-to-r from-teal-500 to-sky-500'
                                                    }`}>
                                                    {message.type === 'user' ? (
                                                        <IconUser className="w-4 h-4 text-white" />
                                                    ) : (
                                                        <IconRobot className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                            </div>


                                            {/* Message Content */}
                                            <div className={`${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                                                <div className={`inline-block p-3 rounded-2xl ${message.type === 'user'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                                                    }`}>
                                                    {message.type === 'ai' ? (
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                h1: (props: any) => <h1 className="text-lg mb-2" {...props} />,
                                                                h2: (props: any) => <h2 className="text-lg mt-3 mb-2" {...props} />,
                                                                h3: (props: any) => <h3 className="text-base mt-3 mb-2" {...props} />,
                                                                p: (props: any) => <p className="mb-2 leading-relaxed" {...props} />,
                                                                ul: (props: any) => <ul className="list-disc pl-5 space-y-1 mb-2" {...props} />,
                                                                ol: (props: any) => <ol className="list-decimal pl-5 space-y-1 mb-2" {...props} />,
                                                                li: (props: any) => <li className="leading-relaxed" {...props} />,
                                                                strong: (props: any) => <strong className="font-medium" {...props} />,
                                                                a: (props: any) => <a className="text-blue-600 underline hover:text-blue-700" target="_blank" rel="noopener noreferrer" {...props} />,
                                                                code: ({ inline, children, ...props }: any) => (
                                                                    inline ? (
                                                                        <code className="bg-gray-100 rounded px-1 py-0.5 text-[0.95em]" {...props}>{children}</code>
                                                                    ) : (
                                                                        <pre className="bg-gray-950 text-gray-100 rounded-lg p-3 overflow-x-auto text-sm">
                                                                            <code {...props}>{children}</code>
                                                                        </pre>
                                                                    )
                                                                ),
                                                                hr: (props: any) => <hr className="my-3 border-gray-200" {...props} />,
                                                                table: (props: any) => <div className="overflow-x-auto mb-3"><table className="min-w-full text-[13px] border border-gray-200 rounded-lg" {...props} /></div>,
                                                                thead: (props: any) => <thead className="bg-gray-50" {...props} />,
                                                                th: (props: any) => <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200" {...props} />,
                                                                td: (props: any) => <td className="px-3 py-2 text-gray-700 border-b border-gray-100 align-top" {...props} />,
                                                            } as any}
                                                        >
                                                            {preprocessContent(message.content)}
                                                        </ReactMarkdown>
                                                    ) : (
                                                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                                    )}

                                                    {/* Workflow coloré (procédures HSE) */}
                                                    {message.type === 'ai' && message.workflow && (
                                                        <WorkflowDiagram title={message.workflowTitle ?? 'Workflow'} steps={message.workflow} />
                                                    )}
                                                </div>

                                                {/* Message Actions */}
                                                <div className={`flex items-center mt-2 space-x-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'
                                                    }`}>
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(message.timestamp)}
                                                    </span>
                                                    {message.type === 'ai' && (
                                                        <>
                                                            {/* Message action icons */}
                                                            <button
                                                                onClick={() => copyMessage(message.content)}
                                                                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                                                title="Copy"
                                                            >
                                                                <IconCopy className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => speak(message.content)}
                                                                className="p-1 text-gray-400 hover:text-purple-600 rounded transition-colors"
                                                                title="Listen"
                                                            >
                                                                <IconVolume className="w-3 h-3" />
                                                            </button>
                                                            <button className="p-1 text-gray-400 hover:text-green-600 rounded transition-colors">
                                                                <IconThumbUp className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Loading Message */}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="flex max-w-[85%]">
                                            <div className="flex-shrink-0 mr-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-sky-500 flex items-center justify-center">
                                                    {/* Loading indicator icon */}
                                                    <IconRobot className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    </div>
                                                    <span className="text-gray-500 text-sm">SafeX Assist is thinking...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Quick Actions */}
                        {messages.length <= 1 && (
                            <div className="px-4 py-1 border-t border-gray-100 bg-gray-50">
                                <div className="text-xs text-gray-600 mb-2">Quick actions:</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {quickActions.map((action) => (
                                        <button
                                            key={action.id}
                                            onClick={() => handleQuickAction(action)}
                                            className="flex items-center p-2 bg-white border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 group"
                                        >
                                            <action.icon className={`w-4 h-4 ${action.color} mr-2 group-hover:scale-110 transition-transform`} />
                                            <span className="text-xs text-gray-700 group-hover:text-purple-700">
                                                {action.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-2 border-t border-gray-200 bg-white rounded-b-2xl">
                            <div className="flex items-center space-x-3">
                                <div className="flex-1">
                                    <textarea
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask SafeX Assist your question..."
                                        className="w-full  resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
                                        rows={1}
                                        style={{ minHeight: '40px', maxHeight: '100px' }}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={toggleVoiceInput}
                                        className={`p-2 rounded-lg transition-colors ${isListening
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        title={isListening ? 'Stop listening' : 'Voice input'}
                                    >
                                        {/* Voice input toggle */}
                                        {isListening ? <IconMicrophoneOff className="w-4 h-4" /> : <IconMicrophone className="w-4 h-4" />}
                                    </button>

                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isLoading}
                                        className="p-2 bg-gradient-to-r from-teal-500 to-sky-500 text-white rounded-lg hover:from-teal-600 hover:to-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                                        title="Send"
                                    >
                                        <IconSend className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Status Indicators */}
                            <div className="flex items-center justify-between  text-xs text-gray-500">
                                <div className="flex items-center space-x-3">
                                    {isSpeaking && (
                                        <div className="flex items-center text-green-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                                            SafeX Assist speaking...
                                        </div>
                                    )}
                                    {isListening && (
                                        <div className="flex items-center text-red-600">
                                            <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                                            Listening...
                                        </div>
                                    )}
                                </div>
                                {/* <div className="flex items-center space-x-2">
                                    <span>🔒 Sécurisé</span>
                                    <span>•</span>
                                    <span>⚡ Temps réel</span>
                                </div> */}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FloatingAIAssistant;
