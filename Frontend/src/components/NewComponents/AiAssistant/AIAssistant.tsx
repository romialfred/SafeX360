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
    IconDownload,
    IconShare,
    IconBulb,
    IconRobot,
    IconUser,
    IconChevronDown,
    IconChevronUp,
    IconHelmet,
    IconPointFilled,
    IconBook,
    IconSearch,
    IconBuilding,
    IconFolderOpen,
    IconFlask,
} from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { matchDemoProcedure, WorkflowDiagram, type WorkflowStep } from './demoProcedures';


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
        id: '1',
        text: 'Analyze our safety KPIs for this month',
        category: 'Analysis',
        icon: IconChartBar,
        color: 'text-blue-600'
    },
    {
        id: '2',
        text: 'Generate incident report summary',
        category: 'Reports',
        icon: IconFileText,
        color: 'text-green-600'
    },
    {
        id: '3',
        text: 'What is LTIFR and how is it calculated?',
        category: 'Definitions',
        icon: IconBulb,
        color: 'text-yellow-600'
    },
    {
        id: '4',
        text: 'Show status of pending PPE requests',
        category: 'Status',
        icon: IconHelmet,
        color: 'text-purple-600'
    },
    {
        id: '5',
        text: 'Create risk assessment checklist',
        category: 'Templates',
        icon: IconCircleCheck,
        color: 'text-orange-600'
    },
    {
        id: '6',
        text: 'Identify overdue safety actions',
        category: 'Tracking',
        icon: IconAlertTriangle,
        color: 'text-red-600'
    },
    {
        id: '7',
        text: 'Search work processes for chemical handling',
        category: 'Documents',
        icon: IconFileText,
        color: 'text-blue-600'
    },
    {
        id: '8',
        text: 'Find ISO standards related to risk assessment',
        category: 'Standards',
        icon: IconBook,
        color: 'text-green-600'
    },
    {
        id: '9',
        text: 'Show all documents containing "PPE"',
        category: 'Search',
        icon: IconSearch,
        color: 'text-purple-600'
    },
    {
        id: '10',
        text: 'List work processes by department',
        category: 'Organization',
        icon: IconBuilding,
        color: 'text-orange-600'
    }
];

const AIAssistant = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'ai',
            content: 'Hello! I\'m your AI Safety Assistant. I can help you analyze KPIs, generate reports, provide definitions, track action statuses, and much more. How can I assist you today?',
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

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = generateAIResponse(inputValue);
            setMessages(prev => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1500);
    };


    const generateAIResponse = (userInput: string): Message => {
        const input = userInput.toLowerCase();

        // Procédures HSE complètes (base de connaissances) — prioritaire :
        // « travail en hauteur », « évacuation contamination toxique »…
        const procedure = matchDemoProcedure(userInput);
        if (procedure) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: procedure.markdown,
                timestamp: new Date().toISOString(),
                category: 'definition',
                workflow: procedure.workflow,
                workflowTitle: procedure.workflowTitle,
            };
        }

        // Work Process queries
        if (input.includes('work process') || input.includes('processus') || input.includes('procedure')) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `**Work Processes Search Results**

I found several work processes related to your query:

**🏗️ Construction & Height Work:**
• Work at Height Safety Procedure
• Fall Protection Protocol
• Scaffold Inspection Checklist
• Personal Fall Arrest Systems

**🧪 Chemical Handling:**
• Chemical Storage Procedures
• Hazardous Material Handling
• Spill Response Protocol
• Chemical Risk Assessment Process

**🔧 Maintenance Procedures:**
• Lockout/Tagout (LOTO) Procedures
• Equipment Maintenance Safety
• Hot Work Permit Process
• Confined Space Entry

**📋 General Safety:**
• Incident Reporting Process
• Emergency Response Procedures
• PPE Selection Guidelines
• Safety Training Requirements

**Quick Actions:**
• View detailed work process diagrams
• Download procedure documents
• Check compliance status
• Schedule training sessions`,
                timestamp: new Date().toISOString(),
                category: 'analysis',
                actions: [
                    {
                        id: '1',
                        label: 'View Work Processes',
                        icon: IconFileText,
                        action: () => console.log('Navigate to work processes')
                    },
                    {
                        id: '2',
                        label: 'Download Procedures',
                        icon: IconDownload,
                        action: () => console.log('Download procedures')
                    }
                ]
            };
        }

        // Document search queries
        if (input.includes('document') || input.includes('search') || input.includes('find')) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `**Document Search Results**

**📄 Recent Documents:**
• Safety Manual v2.3 (Updated Jan 2024)
• Emergency Response Plan
• Chemical Inventory Register
• Training Records Database

**📋 ISO Standards:**
• ISO 45001:2018 - OH&S Management Systems
• ISO 19011:2018 - Auditing Guidelines
• ISO 9001:2015 - Quality Management
• ISO 14001:2015 - Environmental Management

**🔍 Search by Category:**
• **PPE Documents:** 23 documents found
• **Risk Assessments:** 45 documents found
• **Training Materials:** 67 documents found
• **Procedures:** 89 documents found

**📊 Document Statistics:**
• Total Documents: 1,247
• Recently Updated: 34 (this month)
• Pending Review: 12
• Expired: 3 (require immediate attention)

**Advanced Search Options:**
• Search by department, date, or document type
• Filter by approval status or version
• Full-text search across all documents`,
                timestamp: new Date().toISOString(),
                category: 'analysis',
                actions: [
                    {
                        id: '1',
                        label: 'Advanced Search',
                        icon: IconSearch,
                        action: () => console.log('Open advanced search')
                    },
                    {
                        id: '2',
                        label: 'Document Manager',
                        icon: IconFolderOpen,
                        action: () => console.log('Open document manager')
                    }
                ]
            };
        }

        // ISO Standards queries
        if (input.includes('iso') || input.includes('standard') || input.includes('norme')) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `**ISO Standards Information**

**🏆 Available Standards:**

**ISO 45001:2018 - Occupational Health & Safety**
• 10 main clauses covering OH&S management
• Leadership and worker participation requirements
• Risk assessment and opportunity identification
• Performance evaluation and improvement

**ISO 19011:2018 - Auditing Management Systems**
• Principles of auditing (integrity, fair presentation)
• Managing audit programmes
• Conducting audits and evaluating auditors
• Competence requirements for audit teams

**ISO 9001:2015 - Quality Management Systems**
• Process approach and risk-based thinking
• Customer focus and leadership commitment
• Continual improvement methodology
• Evidence-based decision making

**🔍 Quick References:**
• Clause-by-clause navigation
• Cross-references between standards
• Implementation guidance and examples
• Compliance checklists and templates

**📈 Compliance Status:**
• ISO 45001: 94% compliant (6 minor gaps)
• ISO 19011: 98% compliant (audit program active)
• ISO 9001: 91% compliant (improvement plan in progress)`,
                timestamp: new Date().toISOString(),
                category: 'definition',
                actions: [
                    {
                        id: '1',
                        label: 'View ISO Documents',
                        icon: IconBook,
                        action: () => console.log('Navigate to ISO documents')
                    },
                    {
                        id: '2',
                        label: 'Compliance Dashboard',
                        icon: IconChartBar,
                        action: () => console.log('View compliance dashboard')
                    }
                ]
            };
        }

        // Platform-wide search queries
        if (input.includes('search platform') || input.includes('find in system') || input.includes('recherche globale')) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `**Platform-Wide Search Capabilities**

I can search across all modules and data in the platform:

**🔍 Searchable Content:**
• **Documents:** Policies, procedures, manuals, reports
• **Work Processes:** Step-by-step procedures and workflows
• **Risk Assessments:** Chemical, operational, and environmental risks
• **Incident Reports:** Historical incident data and investigations
• **Training Records:** Completion status, certifications, competencies
• **Audit Reports:** Findings, recommendations, corrective actions
• **PPE Records:** Inventory, requests, maintenance schedules
• **Compliance Data:** Requirements, assignments, validation status
• **User Activities:** Actions, sessions, performance metrics
• **ISO Standards:** Full-text search within standard documents

**🎯 Search Examples:**
• "Show all chemical risks in Laboratory department"
• "Find PPE requests from last month"
• "List overdue training for Production team"
• "Search incidents involving fall protection"
• "Find ISO 45001 clauses about worker participation"

**⚡ Advanced Features:**
• Natural language queries
• Cross-module data correlation
• Trend analysis and insights
• Automated report generation
• Real-time data updates`,
                timestamp: new Date().toISOString(),
                category: 'general',
                actions: [
                    {
                        id: '1',
                        label: 'Try Advanced Search',
                        icon: IconSearch,
                        action: () => console.log('Open advanced search')
                    },
                    {
                        id: '2',
                        label: 'View Search Tips',
                        icon: IconBulb,
                        action: () => console.log('Show search tips')
                    }
                ]
            };
        }

        // KPI queries
        if (input.includes('kpi') || input.includes('analyze') || input.includes('metrics')) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `Based on your current safety data, here's the KPI analysis:

**Key Safety Metrics (Current Month):**
• LTIFR: 1.2 (Target: 2.0) ✅ **Below target**
• TRIR: 2.8 (Target: 3.5) ✅ **Below target**  
• Near Miss Rate: 45/month ⚠️ **Above target (40)**
• Training Completion: 96% ✅ **Above target (95%)**
• Days Without Incident: 47 days ✅ **Exceeding target**

**Trends:**
📈 **Improving:** LTIFR decreased by 0.8 from last month
📈 **Improving:** Training completion up 4%
⚠️ **Attention needed:** Near miss reporting increased (good sign of safety culture)

**Recommendations:**
1. Continue current safety initiatives - metrics are trending positively
2. Investigate the increase in near miss reports to identify common themes
3. Consider recognizing the team for 47 days without incident`,
                timestamp: new Date().toISOString(),
                category: 'analysis',
                actions: [
                    {
                        id: '1',
                        label: 'Download Full Report',
                        icon: IconDownload,
                        action: () => console.log('Download report')
                    },
                    {
                        id: '2',
                        label: 'View Detailed Charts',
                        icon: IconChartBar,
                        action: () => console.log('View charts')
                    }
                ]
            };
        }

        // Chemical and risk queries
        if (input.includes('chemical') || input.includes('risk') || input.includes('hazard')) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `**Chemical & Risk Management Overview**

**🧪 Chemical Register Status:**
• Total Chemicals: 156 registered
• High Risk: 12 chemicals (7.7%)
• Medium Risk: 34 chemicals (21.8%)
• Low Risk: 110 chemicals (70.5%)

**⚠️ Risk Assessment Summary:**
• Active Risk Assessments: 89
• Pending Reviews: 15
• Overdue Assessments: 3 (require immediate attention)
• New Risks Identified: 7 (this month)

**🏭 By Department:**
• **Laboratory:** 45 chemicals, 12 high-risk
• **Production:** 67 chemicals, 8 medium-risk
• **Maintenance:** 23 chemicals, 5 low-risk
• **Warehouse:** 21 chemicals, 3 medium-risk

**📋 Recent Activities:**
• Sulfuric Acid risk assessment updated (Jan 20)
• New solvent handling procedure approved
• Chemical spill response drill completed
• PPE requirements updated for 5 chemicals

**🎯 Recommendations:**
• Review overdue assessments immediately
• Update chemical inventory quarterly
• Conduct refresher training for high-risk chemicals
• Implement additional controls for medium-risk items`,
                timestamp: new Date().toISOString(),
                category: 'analysis',
                actions: [
                    {
                        id: '1',
                        label: 'View Chemical Register',
                        icon: IconFlask,
                        action: () => console.log('Navigate to chemical register')
                    },
                    {
                        id: '2',
                        label: 'Risk Assessment Dashboard',
                        icon: IconAlertTriangle,
                        action: () => console.log('View risk dashboard')
                    }
                ]
            };
        }

        // Incident report queries
        if (input.includes('incident') && input.includes('report')) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `**Incident Report Summary - January 2024**

**Total Incidents:** 23 (↓ 3 from December)

**By Category:**
• Slips/Trips/Falls: 8 incidents (35%)
• Chemical Exposure: 4 incidents (17%)
• Equipment Related: 6 incidents (26%)
• Near Misses: 5 incidents (22%)

**By Severity:**
• Minor: 18 incidents (78%)
• Moderate: 4 incidents (17%)
• Major: 1 incident (4%)
• Critical: 0 incidents ✅

**Investigation Status:**
• Completed: 16 investigations (70%)
• In Progress: 5 investigations (22%)
• Pending: 2 investigations (8%)

**Top Recommendations:**
1. Improve housekeeping in warehouse areas (slip prevention)
2. Additional PPE training for chemical handling
3. Equipment maintenance schedule review

Would you like me to generate a detailed report for any specific category?`,
                timestamp: new Date().toISOString(),
                category: 'report',
                actions: [
                    {
                        id: '1',
                        label: 'Generate PDF Report',
                        icon: IconFileText,
                        action: () => console.log('Generate PDF')
                    },
                    {
                        id: '2',
                        label: 'Share with Team',
                        icon: IconShare,
                        action: () => console.log('Share report')
                    }
                ]
            };
        }

        // LTIFR definition queries
        if (input.includes('ltifr') || input.includes('definition')) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `**LTIFR - Lost Time Injury Frequency Rate**

**Definition:**
LTIFR measures the number of lost time injuries per 200,000 hours worked. It's a key safety performance indicator used globally.

**Formula:**
LTIFR = (Number of Lost Time Injuries × 200,000) ÷ Total Hours Worked

**Example Calculation:**
• Lost Time Injuries: 3
• Total Hours Worked: 500,000
• LTIFR = (3 × 200,000) ÷ 500,000 = 1.2

**Industry Benchmarks:**
• Excellent: < 1.0
• Good: 1.0 - 2.0
• Average: 2.0 - 5.0
• Needs Improvement: > 5.0

**Your Current LTIFR: 1.2** ✅ (Good performance)

**Related Metrics:**
• TRIR (Total Recordable Incident Rate)
• DART (Days Away, Restricted, or Transfer)
• EMR (Experience Modification Rate)`,
                timestamp: new Date().toISOString(),
                category: 'definition'
            };
        }

        // PPE status queries
        if (input.includes('ppe') && (input.includes('status') || input.includes('request'))) {
            return {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `**PPE Request Status Overview**

**Pending Approvals:** 5 requests
• Safety Helmets (25 units) - Construction Team - Due: Jan 25
• Chemical Gloves (50 pairs) - Lab Team - Due: Jan 24  
• Safety Goggles (15 units) - Maintenance - Due: Jan 26
• Respirators (8 units) - Painting Crew - Due: Jan 27
• High-Vis Vests (30 units) - Warehouse - Due: Jan 28

**Recently Approved:** 3 requests
• Steel-toe Boots (20 pairs) - Approved Jan 20
• Ear Protection (40 units) - Approved Jan 19
• Fall Harnesses (6 units) - Approved Jan 18

**In Transit:** 2 orders
• Hard Hats - Expected delivery: Jan 24
• Safety Gloves - Expected delivery: Jan 25

**Budget Status:**
• Monthly Budget: $5,000
• Spent: $3,200 (64%)
• Remaining: $1,800 (36%)

**Action Required:**
⚠️ 2 requests are approaching deadline (within 24 hours)`,
                timestamp: new Date().toISOString(),
                category: 'status',
                actions: [
                    {
                        id: '1',
                        label: 'Approve Pending Requests',
                        icon: IconCircleCheck,
                        action: () => console.log('Approve requests')
                    },
                    {
                        id: '2',
                        label: 'View Full PPE Dashboard',
                        icon: IconHelmet,
                        action: () => console.log('View PPE dashboard')
                    }
                ]
            };
        }

        // Default fallback
        return {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: `I understand you're asking about "${userInput}". I can help you with:

🔍 **Analysis & KPIs:** Safety metrics, trends, performance indicators
📊 **Reports:** Incident summaries, compliance reports, audit findings  
📚 **Definitions:** Safety terms, regulations, best practices
📋 **Status Tracking:** Actions, requests, investigations, audits
⚡ **Quick Actions:** Generate templates, checklists, procedures

Could you be more specific about what you'd like me to help you with? For example:
• "Show me this month's safety KPIs"
• "Generate an incident report for Building A"
• "What's the status of action ACT-2024-007?"
• "Define TRIR and show our current rate"`,
            timestamp: new Date().toISOString(),
            category: 'general'
        };
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
                            AI Safety Assistant
                        </h1>
                        <p className="text-gray-600 ">
                            Intelligent analysis, reporting, and assistance
                        </p>
                    </div>

                </div>


                <Button size="xs"
                    variant="light"
                    color="green"
                    className='!bg-green-100 !border !border-green-300 !text-green-700 hover:!bg-green-200'
                    leftSection={<IconPointFilled />}> AI Online</Button>



            </div>


            {/* Chat Container */}
            <div className=" p-8 flex flex-col border border-gray-300 rounded-xl shadow-sm">

                {/* Suggested Prompts */}
                {showSuggestions && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg text-gray-900">Suggested Prompts</h2>
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
                        Show suggested prompts
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
                                            <span className="text-gray-500 text-sm">AI is thinking...</span>
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
                                    placeholder="Ask me anything about safety, KPIs, reports, or get help with your tasks..."
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
                            <span className="text-gray-500">Quick actions:</span>
                            <button
                                onClick={() => handleSuggestedPrompt('Analyze current safety KPIs')}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                📊 Analyze KPIs
                            </button>
                            <button
                                onClick={() => handleSuggestedPrompt('Generate monthly safety report')}
                                className="px-3 py-1 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors"
                            >
                                📄 Generate Report
                            </button>
                            <button
                                onClick={() => handleSuggestedPrompt('Show pending actions status')}
                                className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full hover:bg-orange-100 transition-colors"
                            >
                                ⏳ Check Status
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center text-xs text-gray-500 mt-4">
                    <div className="flex items-center justify-center space-x-4">
                        <span>🔒 Secure & Private</span>
                        <span>•</span>
                        <span>🎯 Platform-Specific AI</span>
                        <span>•</span>
                        <span>⚡ Real-time Analysis</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
