import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    IconSend,
    IconMicrophone,
    IconMicrophoneOff,
    IconSparkles,
    IconChartBar,
    IconFileText,
    IconAlertTriangle,
    IconCircleCheck,
    IconCopy,
    IconThumbUp,
    IconThumbDown,
    IconBulb,
    IconRobot,
    IconUser,
    IconChevronDown,
    IconChevronUp,
    IconHelmet,
    IconPointFilled,
} from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { matchDemoProcedure, WorkflowDiagram, type WorkflowStep } from './demoProcedures';
import {
    TRANSPARENCY_NOTE,
    WELCOME_MESSAGE,
    classifyQuestion,
    loadOhsSnapshot,
    buildLoadErrorAnswer,
    buildKpiAnswer,
    buildIncidentsAnswer,
    buildAlertsAnswer,
    buildPpeAnswer,
    buildNotTrackedAnswer,
    buildHelpAnswer,
    buildUnknownAnswer,
    buildLtifrDefinitionAnswer,
} from './assistantAnswers';


interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: string;
    category?: 'analysis' | 'report' | 'definition' | 'status' | 'general';
    attachments?: Attachment[];
    actions?: QuickAction[];
    /** Workflow d'étapes colorées rendu sous le markdown (procédures HSE). */
    workflow?: WorkflowStep[];
    workflowTitle?: string;
}

interface Attachment {
    id: string;
    name: string;
    type: 'chart' | 'report' | 'document';
    url: string;
}

interface QuickAction {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    action: () => void;
}

interface SuggestedPrompt {
    id: string;
    text: string;
    category: string;
    icon: React.ComponentType<any>;
    color: string;
}


const suggestedPrompts: SuggestedPrompt[] = [
    {
        id: 'proc-hauteur',
        text: 'Quelle est la procédure de travail en hauteur ?',
        category: 'Procédures',
        icon: IconHelmet,
        color: 'text-cyan-700'
    },
    {
        id: 'proc-evac',
        text: "Quelle est la procédure d'évacuation en cas de contamination toxique de l'air ?",
        category: 'Urgences',
        icon: IconAlertTriangle,
        color: 'text-rose-600'
    },
    {
        id: 'situation-hse',
        text: 'Quelle est la situation HSE de la mine cette année ?',
        category: 'Indicateurs',
        icon: IconChartBar,
        color: 'text-blue-600'
    },
    {
        id: 'incidents',
        text: "Combien d'incidents et de quasi-accidents cette année ?",
        category: 'Incidents',
        icon: IconFileText,
        color: 'text-green-600'
    },
    {
        id: 'alertes',
        text: 'Quelles sont les alertes HSE en cours ?',
        category: 'Alertes',
        icon: IconCircleCheck,
        color: 'text-orange-600'
    },
    {
        id: 'ltifr-def',
        text: "Qu'est-ce que le LTIFR et comment se calcule-t-il ?",
        category: 'Définitions',
        icon: IconBulb,
        color: 'text-yellow-600'
    }
];

const AIAssistant = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'ai',
            content: WELCOME_MESSAGE,
            timestamp: new Date().toISOString(),
            category: 'general'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Convert common bullets and clean lines for nicer Markdown rendering
    const preprocessContent = (text: string) => {
        return text
            .replace(/\r\n/g, '\n')
            // Turn leading • bullets into Markdown list items
            .split('\n')
            .map((line) => line.replace(/^\s*•\s+/, '- '))
            .join('\n');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
        setShowSuggestions(false);

        // Le délai simulé a disparu : l'attente est celle du vrai chargement
        // des données de la mine (ou immédiate pour le savoir HSE).
        const aiResponse = await generateAIResponse(inputValue);
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
    };


    /**
     * Deux sources, jamais mélangées :
     *  - le SAVOIR (procédures HSE, définitions/formules) : local, vrai en
     *    toutes circonstances ;
     *  - les MESURES de la mine : lues sur le serveur via getOhsDashboard, ou
     *    refusées explicitement. Aucune valeur de repli.
     */
    const generateAIResponse = async (userInput: string): Promise<Message> => {
        const base = { id: (Date.now() + 1).toString(), type: 'ai' as const, timestamp: new Date().toISOString() };

        // Procédures HSE complètes (base de connaissances) — prioritaire :
        // « travail en hauteur », « évacuation contamination toxique »…
        const procedure = matchDemoProcedure(userInput);
        if (procedure) {
            return {
                ...base,
                content: procedure.markdown,
                category: 'definition',
                workflow: procedure.workflow,
                workflowTitle: procedure.workflowTitle,
            };
        }

        const kind = classifyQuestion(userInput);

        // Réponses sans données de la mine (savoir / refus / aide).
        if (kind === 'ltifr-definition') {
            return { ...base, content: buildLtifrDefinitionAnswer().markdown, category: 'definition' };
        }
        if (kind === 'not-tracked') {
            return { ...base, content: buildNotTrackedAnswer().markdown, category: 'general' };
        }
        if (kind === 'help') {
            return { ...base, content: buildHelpAnswer().markdown, category: 'general' };
        }
        if (kind === 'unknown') {
            return { ...base, content: buildUnknownAnswer(userInput).markdown, category: 'general' };
        }

        // Mesures : elles viennent du serveur, ou pas du tout.
        const snapshot = await loadOhsSnapshot();
        if (!snapshot.ok) {
            return { ...base, content: buildLoadErrorAnswer(snapshot.error).markdown, category: 'general' };
        }

        if (kind === 'incidents') {
            return { ...base, content: buildIncidentsAnswer(snapshot.data).markdown, category: 'report' };
        }
        if (kind === 'alerts') {
            return { ...base, content: buildAlertsAnswer(snapshot.data).markdown, category: 'status' };
        }
        if (kind === 'ppe') {
            return { ...base, content: buildPpeAnswer(snapshot.data).markdown, category: 'status' };
        }
        return { ...base, content: buildKpiAnswer(snapshot.data).markdown, category: 'analysis' };
    };

    const handleSuggestedPrompt = (prompt: string) => {
        setInputValue(prompt);
        setShowSuggestions(false);
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

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col gap-5 p-5">
            <div className="bg-gradient-to-r  rounded-xl p-2  flex justify-between items-center">
                <div className="flex items-center gap-1">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl mr-4">
                        <IconSparkles className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                            Assistant SafeX
                        </h1>
                        <p className="text-gray-600 max-w-2xl">
                            {TRANSPARENCY_NOTE}
                        </p>
                    </div>

                </div>


                <Button size="xs"
                    variant="light"
                    color="green"
                    className='!bg-green-100 !border !border-green-300 !text-green-700 hover:!bg-green-200'
                    leftSection={<IconPointFilled />}> Assistant actif</Button>



            </div>


            {/* Chat Container */}
            <div className=" p-8 flex flex-col border border-gray-300 rounded-xl shadow-sm">

                {/* Suggested Prompts */}
                {showSuggestions && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg text-gray-900">Questions suggérées</h2>
                            <button
                                onClick={() => setShowSuggestions(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <IconChevronUp className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {suggestedPrompts.map((prompt) => (
                                <div
                                    key={prompt.id}
                                    onClick={() => handleSuggestedPrompt(prompt.text)}
                                    className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200 group"
                                >
                                    <div className="flex items-start">
                                        <div className={`p-2 rounded-lg bg-gray-50 mr-3 group-hover:bg-blue-50 transition-colors`}>
                                            <prompt.icon className={`w-5 h-5 ${prompt.color} group-hover:text-blue-600 transition-colors`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-900 mb-1">{prompt.category}</div>
                                            <div className="text-sm text-gray-600">{prompt.text}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!showSuggestions && (
                    <button
                        onClick={() => setShowSuggestions(true)}
                        className="mb-4 flex items-center text-blue-600 hover:text-blue-700 text-sm"
                    >
                        <IconChevronDown className="w-4 h-4 mr-1" />
                        Afficher les questions suggérées
                    </button>
                )}

                {/* Messages */}
                <div className="flex-1 space-y-6 mb-6">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${message.type === 'user'
                                        ? 'bg-blue-500'
                                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
                                        }`}>
                                        {message.type === 'user' ? (
                                            <IconUser className="w-5 h-5 text-white" />
                                        ) : (
                                            <IconRobot className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                </div>

                                {/* Message Content */}
                                <div className={`flex-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                                    <div className={`inline-block p-4 rounded-2xl ${message.type === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white border border-gray-200 text-gray-900'
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
                                            <div className="whitespace-pre-wrap">{message.content}</div>
                                        )}

                                        {/* Workflow coloré (procédures HSE) */}
                                        {message.type === 'ai' && message.workflow && (
                                            <WorkflowDiagram title={message.workflowTitle ?? 'Workflow'} steps={message.workflow} />
                                        )}

                                        {/* Quick Actions */}
                                        {message.actions && message.actions.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                                                {message.actions.map((action) => (
                                                    <button
                                                        key={action.id}
                                                        onClick={action.action}
                                                        className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                                                    >
                                                        <action.icon className="w-4 h-4 mr-2" />
                                                        {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Actions */}
                                    <div className={`flex items-center mt-2 space-x-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'
                                        }`}>
                                        <span className="text-xs text-gray-500">
                                            {formatTimestamp(message.timestamp)}
                                        </span>
                                        {message.type === 'ai' && (
                                            <>
                                                <button
                                                    onClick={() => copyMessage(message.content)}
                                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                                >
                                                    <IconCopy className="w-4 h-4" />
                                                </button>
                                                <button className="p-1 text-gray-400 hover:text-green-600 rounded">
                                                    <IconThumbUp className="w-4 h-4" />
                                                </button>
                                                <button className="p-1 text-gray-400 hover:text-red-600 rounded">
                                                    <IconThumbDown className="w-4 h-4" />
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
                            <div className="flex max-w-3xl">
                                <div className="flex-shrink-0 mr-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                                        <IconRobot className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="inline-block p-4 rounded-2xl bg-white border border-gray-200">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                            <span className="text-gray-500 text-sm">Consultation des données de la mine…</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
                    <div className="p-4">
                        <div className="flex items-end space-x-4">
                            <div className="flex-1">
                                <textarea
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Posez votre question : indicateurs, incidents, alertes, procédure HSE…"
                                    className="w-full resize-none border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500"
                                    rows={1}
                                    style={{ minHeight: '24px', maxHeight: '120px' }}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={toggleVoiceInput}
                                    className={`p-3 rounded-xl transition-colors ${isListening
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {isListening ? <IconMicrophoneOff className="w-5 h-5" /> : <IconMicrophone className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    <IconSend className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Bar */}
                    <div className="px-4 pb-4">
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-500">Actions rapides :</span>
                            <button
                                onClick={() => handleSuggestedPrompt('Quelle est la situation HSE de la mine cette année ?')}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                Situation HSE
                            </button>
                            <button
                                onClick={() => handleSuggestedPrompt("Combien d'incidents et de quasi-accidents cette année ?")}
                                className="px-3 py-1 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors"
                            >
                                Incidents
                            </button>
                            <button
                                onClick={() => handleSuggestedPrompt('Quelles sont les alertes HSE en cours ?')}
                                className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full hover:bg-orange-100 transition-colors"
                            >
                                Alertes en cours
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center text-xs text-gray-500 mt-4">
                    <div className="flex items-center justify-center space-x-4">
                        <span>Données internes à la mine active</span>
                        <span>•</span>
                        <span>Base de procédures HSE</span>
                        <span>•</span>
                        <span>Aucune analyse prédictive</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
