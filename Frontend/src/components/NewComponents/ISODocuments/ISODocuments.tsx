import { useState, useMemo } from 'react';
import {
    IconFileText,
    IconSearch,
    IconDownload,
    IconChevronRight,
    IconChevronDown,
    IconEye,
    IconEyeOff,
    IconBook,
    IconList
} from '@tabler/icons-react';
import { Breadcrumbs, Button, Center, SegmentedControl, Text } from '@mantine/core';
import { Link } from 'react-router-dom';

// ... (DocumentSection, ISODocument interfaces and isoDocuments array remain unchanged)
interface DocumentSection {
    id: string;
    number: string;
    title: string;
    content: string;
    subsections?: DocumentSection[];
}

interface ISODocument {
    id: string;
    title: string;
    subtitle: string;
    year: string;
    color: string;
    bgColor: string;
    sections: DocumentSection[];
}

const isoDocuments: ISODocument[] = [
    {
        id: 'iso-45001',
        title: 'ISO 45001:2018',
        subtitle: 'Occupational Health & Safety Management Systems',
        year: '2018',
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        sections: [
            {
                id: 'scope',
                number: '1',
                title: 'Scope',
                content: 'This document specifies requirements for an occupational health and safety (OH&S) management system, and gives guidance for its use, to enable organizations to provide safe and healthy workplaces by preventing work-related injury and ill health, as well as by proactively improving its OH&S performance.',
                subsections: [
                    {
                        id: 'scope-1-1',
                        number: '1.1',
                        title: 'General requirements',
                        content: 'This document is applicable to any organization that wishes to establish, implement and maintain an OH&S management system to improve occupational health and safety, eliminate hazards and minimize OH&S risks (including system deficiencies), take advantage of OH&S opportunities, and address OH&S management system nonconformities associated with its activities.'
                    }
                ]
            },
            {
                id: 'normative-references',
                number: '2',
                title: 'Normative references',
                content: 'There are no normative references in this document. This clause is included to maintain clause numbering alignment with other management system standards.',
                subsections: []
            },
            {
                id: 'terms-definitions',
                number: '3',
                title: 'Terms and definitions',
                content: 'For the purposes of this document, the following terms and definitions apply. ISO and IEC maintain terminological databases for use in standardization.',
                subsections: [
                    {
                        id: 'terms-3-1',
                        number: '3.1',
                        title: 'Organization',
                        content: 'Person or group of people that has its own functions with responsibilities, authorities and relationships to achieve its objectives.'
                    },
                    {
                        id: 'terms-3-2',
                        number: '3.2',
                        title: 'Interested party (stakeholder)',
                        content: 'Person or organization that can affect, be affected by, or perceive itself to be affected by a decision or activity.'
                    }
                ]
            },
            {
                id: 'context',
                number: '4',
                title: 'Context of the organization',
                content: 'The organization shall determine external and internal issues that are relevant to its purpose and that affect its ability to achieve the intended outcome(s) of its OH&S management system.',
                subsections: [
                    {
                        id: 'context-4-1',
                        number: '4.1',
                        title: 'Understanding the organization and its context',
                        content: 'The organization shall determine external and internal issues that are relevant to its purpose and that affect its ability to achieve the intended outcome(s) of its OH&S management system.'
                    },
                    {
                        id: 'context-4-2',
                        number: '4.2',
                        title: 'Understanding the needs and expectations of workers and other interested parties',
                        content: 'The organization shall determine the interested parties that are relevant to the OH&S management system and the relevant needs and expectations of these interested parties.'
                    }
                ]
            },
            {
                id: 'leadership',
                number: '5',
                title: 'Leadership and worker participation',
                content: 'Top management shall demonstrate leadership and commitment with respect to the OH&S management system.',
                subsections: [
                    {
                        id: 'leadership-5-1',
                        number: '5.1',
                        title: 'Leadership and commitment',
                        content: 'Top management shall demonstrate leadership and commitment with respect to the OH&S management system by taking overall responsibility and accountability for the prevention of work-related injury and ill health, as well as the provision of safe and healthy workplaces and activities.'
                    },
                    {
                        id: 'leadership-5-2',
                        number: '5.2',
                        title: 'OH&S policy',
                        content: 'Top management shall establish, implement and maintain an OH&S policy that includes a commitment to provide safe and healthy working conditions for the prevention of work-related injury and ill health.'
                    }
                ]
            }
        ]
    },
    {
        id: 'iso-19011',
        title: 'ISO 19011:2018',
        subtitle: 'Guidelines for auditing management systems',
        year: '2018',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        sections: [
            {
                id: 'scope',
                number: '1',
                title: 'Scope',
                content: 'This document provides guidance on auditing management systems, including the principles of auditing, managing an audit programme and conducting management system audits, as well as guidance on the evaluation of competence of individuals involved in the audit process.',
                subsections: []
            },
            {
                id: 'normative-references',
                number: '2',
                title: 'Normative references',
                content: 'There are no normative references in this document.',
                subsections: []
            },
            {
                id: 'terms-definitions',
                number: '3',
                title: 'Terms and definitions',
                content: 'For the purposes of this document, the terms and definitions given in ISO 9000 and the following apply. ISO and IEC maintain terminological databases for use in standardization.',
                subsections: [
                    {
                        id: 'terms-3-1',
                        number: '3.1',
                        title: 'Audit',
                        content: 'Systematic, independent and documented process for obtaining objective evidence and evaluating it objectively to determine the extent to which the audit criteria are fulfilled.'
                    },
                    {
                        id: 'terms-3-2',
                        number: '3.2',
                        title: 'Audit criteria',
                        content: 'Set of requirements used as a reference against which objective evidence is compared.'
                    }
                ]
            },
            {
                id: 'principles',
                number: '4',
                title: 'Principles of auditing',
                content: 'Auditing is characterized by reliance on a number of principles. These principles should help make auditing an effective and reliable tool in support of management policies and controls.',
                subsections: [
                    {
                        id: 'principles-4-1',
                        number: '4.1',
                        title: 'Integrity',
                        content: 'The foundation of professionalism. Auditors should perform their work with honesty, diligence and responsibility.'
                    },
                    {
                        id: 'principles-4-2',
                        number: '4.2',
                        title: 'Fair presentation',
                        content: 'The obligation to report truthfully and accurately. Audit findings, audit conclusions and audit reports should reflect truthfully and accurately the audit activities.'
                    }
                ]
            },
            {
                id: 'managing-programme',
                number: '5',
                title: 'Managing an audit programme',
                content: 'An audit programme includes one or more audits planned for a specific time frame and directed towards a specific purpose.',
                subsections: [
                    {
                        id: 'programme-5-1',
                        number: '5.1',
                        title: 'General',
                        content: 'An organization should establish, implement, monitor, review and improve an audit programme that can include one or more management systems.'
                    },
                    {
                        id: 'programme-5-2',
                        number: '5.2',
                        title: 'Establishing the audit programme',
                        content: 'Top management should ensure that the audit programme objectives are established and that resources are provided for the establishment, implementation, monitoring, review and improvement of the audit programme.'
                    }
                ]
            },
            {
                id: 'conducting-audit',
                number: '6',
                title: 'Conducting an audit',
                content: 'This clause provides guidance on the activities of a typical management system audit.',
                subsections: [
                    {
                        id: 'conducting-6-1',
                        number: '6.1',
                        title: 'General',
                        content: 'This clause provides guidance on the activities of a typical management system audit. These activities are generally applicable to all audits, although their extent can vary depending on the scope, complexity and objectives of a specific audit.'
                    },
                    {
                        id: 'conducting-6-2',
                        number: '6.2',
                        title: 'Initiating the audit',
                        content: 'The audit should be initiated by the audit programme manager or other designated person responsible for the audit programme.'
                    }
                ]
            },
            {
                id: 'competence-evaluation',
                number: '7',
                title: 'Competence and evaluation of auditors',
                content: 'This clause provides guidance on the competence and evaluation of auditors and audit team leaders.',
                subsections: [
                    {
                        id: 'competence-7-1',
                        number: '7.1',
                        title: 'General',
                        content: 'Auditors should have the competence necessary to achieve the objectives of the audits they are assigned to conduct.'
                    },
                    {
                        id: 'competence-7-2',
                        number: '7.2',
                        title: 'Determining auditor competence',
                        content: 'The evaluation process should consider the personal attributes, knowledge and skills of the auditor, as described in this clause.'
                    }
                ]
            }
        ]
    },
    {
        id: 'iso-9001',
        title: 'ISO 9001:2015',
        subtitle: 'Quality Management Systems - Requirements',
        year: '2015',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        sections: [
            {
                id: 'scope',
                number: '1',
                title: 'Scope',
                content: 'This International Standard specifies requirements for a quality management system when an organization needs to demonstrate its ability to consistently provide products and services that meet customer and applicable statutory and regulatory requirements.',
                subsections: []
            },
            {
                id: 'normative-references',
                number: '2',
                title: 'Normative references',
                content: 'The following documents are referred to in the text in such a way that some or all of their content constitutes requirements of this document.',
                subsections: []
            },
            {
                id: 'terms-definitions',
                number: '3',
                title: 'Terms and definitions',
                content: 'For the purposes of this document, the terms and definitions given in ISO 9000 apply.',
                subsections: []
            },
            {
                id: 'context',
                number: '4',
                title: 'Context of the organization',
                content: 'The organization shall determine external and internal issues that are relevant to its purpose and its strategic direction and that affect its ability to achieve the intended result(s) of its quality management system.',
                subsections: [
                    {
                        id: 'context-4-1',
                        number: '4.1',
                        title: 'Understanding the organization and its context',
                        content: 'The organization shall determine external and internal issues that are relevant to its purpose and its strategic direction and that affect its ability to achieve the intended result(s) of its quality management system.'
                    },
                    {
                        id: 'context-4-2',
                        number: '4.2',
                        title: 'Understanding the needs and expectations of interested parties',
                        content: 'The organization shall determine the interested parties that are relevant to the quality management system and the requirements of these interested parties that are relevant to the quality management system.'
                    }
                ]
            },
            {
                id: 'leadership',
                number: '5',
                title: 'Leadership',
                content: 'Top management shall demonstrate leadership and commitment with respect to the quality management system.',
                subsections: [
                    {
                        id: 'leadership-5-1',
                        number: '5.1',
                        title: 'Leadership and commitment',
                        content: 'Top management shall demonstrate leadership and commitment with respect to the quality management system by taking accountability for the effectiveness of the quality management system.'
                    },
                    {
                        id: 'leadership-5-2',
                        number: '5.2',
                        title: 'Policy',
                        content: 'Top management shall establish, implement and maintain a quality policy that is appropriate to the purpose and context of the organization and supports its strategic direction.'
                    }
                ]
            },
            {
                id: 'planning',
                number: '6',
                title: 'Planning',
                content: 'When planning for the quality management system, the organization shall consider the issues referred to in 4.1 and the requirements referred to in 4.2 and determine the risks and opportunities.',
                subsections: [
                    {
                        id: 'planning-6-1',
                        number: '6.1',
                        title: 'Actions to address risks and opportunities',
                        content: 'When planning for the quality management system, the organization shall consider the issues referred to in 4.1 and the requirements referred to in 4.2 and determine the risks and opportunities that need to be addressed.'
                    },
                    {
                        id: 'planning-6-2',
                        number: '6.2',
                        title: 'Quality objectives and planning to achieve them',
                        content: 'The organization shall establish quality objectives at relevant functions, levels and processes needed for the quality management system.'
                    }
                ]
            },
            {
                id: 'support',
                number: '7',
                title: 'Support',
                content: 'The organization shall determine and provide the resources needed for the establishment, implementation, maintenance and continual improvement of the quality management system.',
                subsections: [
                    {
                        id: 'support-7-1',
                        number: '7.1',
                        title: 'Resources',
                        content: 'The organization shall determine and provide the resources needed for the establishment, implementation, maintenance and continual improvement of the quality management system.'
                    },
                    {
                        id: 'support-7-2',
                        number: '7.2',
                        title: 'Competence',
                        content: 'The organization shall determine the necessary competence of person(s) doing work under its control that affects the performance and effectiveness of the quality management system.'
                    }
                ]
            },
            {
                id: 'operation',
                number: '8',
                title: 'Operation',
                content: 'The organization shall plan, implement and control the processes needed to meet the requirements for the provision of products and services.',
                subsections: [
                    {
                        id: 'operation-8-1',
                        number: '8.1',
                        title: 'Operational planning and control',
                        content: 'The organization shall plan, implement and control the processes needed to meet the requirements for the provision of products and services, and to implement the actions determined in Clause 6.'
                    },
                    {
                        id: 'operation-8-2',
                        number: '8.2',
                        title: 'Requirements for products and services',
                        content: 'The organization shall determine, review and confirm customer requirements before acceptance.'
                    }
                ]
            },
            {
                id: 'performance-evaluation',
                number: '9',
                title: 'Performance evaluation',
                content: 'The organization shall determine what needs to be monitored and measured, the methods for monitoring, measurement, analysis and evaluation.',
                subsections: [
                    {
                        id: 'performance-9-1',
                        number: '9.1',
                        title: 'Monitoring, measurement, analysis and evaluation',
                        content: 'The organization shall determine what needs to be monitored and measured; the methods for monitoring, measurement, analysis and evaluation needed to ensure valid results.'
                    },
                    {
                        id: 'performance-9-2',
                        number: '9.2',
                        title: 'Internal audit',
                        content: 'The organization shall conduct internal audits at planned intervals to provide information on whether the quality management system conforms to the organization\'s own requirements for its quality management system.'
                    }
                ]
            },
            {
                id: 'improvement',
                number: '10',
                title: 'Improvement',
                content: 'The organization shall determine and select opportunities for improvement and implement any necessary actions to meet customer requirements and enhance customer satisfaction.',
                subsections: [
                    {
                        id: 'improvement-10-1',
                        number: '10.1',
                        title: 'General',
                        content: 'The organization shall determine and select opportunities for improvement and implement any necessary actions to meet customer requirements and enhance customer satisfaction.'
                    },
                    {
                        id: 'improvement-10-2',
                        number: '10.2',
                        title: 'Nonconformity and corrective action',
                        content: 'When a nonconformity occurs, including any arising from complaints, the organization shall react to the nonconformity and, as applicable, take action to control and correct it.'
                    }
                ]
            }
        ]
    }
];
const ISODocuments = () => {
    const [selectedDocument, setSelectedDocument] = useState<string>('iso-45001');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'toc' | 'full'>('toc'); // 'toc' for table of contents, 'full' for full document


    const currentDocument = isoDocuments.find(doc => doc.id === selectedDocument);

    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    const toggleAllSections = () => {
        if (!currentDocument) return;

        const allSectionIds = new Set<string>();
        currentDocument.sections.forEach(section => {
            allSectionIds.add(section.id);
            section.subsections?.forEach(subsection => {
                allSectionIds.add(subsection.id);
            });
        });

        if (expandedSections.size === allSectionIds.size) {
            setExpandedSections(new Set());
        } else {
            setExpandedSections(allSectionIds);
        }
    };

    const filteredSections = useMemo(() => {
        if (!currentDocument || !searchTerm) return currentDocument?.sections || [];

        return currentDocument.sections.filter(section => {
            const sectionMatch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                section.content.toLowerCase().includes(searchTerm.toLowerCase());

            const subsectionMatch = section.subsections?.some(subsection =>
                subsection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                subsection.content.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return sectionMatch || subsectionMatch;
        });
    }, [currentDocument, searchTerm]);

    const totalSections = currentDocument?.sections.length || 0;
    const totalSubsections = currentDocument?.sections.reduce((acc, section) =>
        acc + (section.subsections?.length || 0), 0) || 0;
    const searchResults = filteredSections.length;

    const renderSection = (section: DocumentSection, level: number = 0) => {
        const isExpanded = expandedSections.has(section.id);
        const hasSubsections = section.subsections && section.subsections.length > 0;
        const isSelected = selectedSection === section.id;

        return (
            <div key={section.id} className={`${level > 0 ? 'ml-6' : ''}`}>
                <div
                    className={`
            flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200
            ${isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
            ${level > 0 ? 'border-l-2 border-gray-200' : ''}
          `}
                    onClick={() => {
                        if (hasSubsections) toggleSection(section.id);
                        setSelectedSection(section.id);
                    }}
                >
                    <div className="flex items-center flex-1">
                        {hasSubsections && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSection(section.id);
                                }}
                                className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                                {isExpanded ? (
                                    <IconChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                    <IconChevronRight className="w-4 h-4 text-gray-600" />
                                )}
                            </button>
                        )}
                        <div className="flex-1">
                            <div className="text-gray-900">
                                {section.number}. {section.title}
                            </div>
                            {viewMode === 'full' && (
                                <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                                    {section.content}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isExpanded && hasSubsections && (
                    <div className="mt-2">
                        {section.subsections!.map(subsection => renderSection(subsection, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (!currentDocument) return null;

    return (
        <div className="flex flex-col gap-5 p-5">
            <div className="flex justify-between items-center  ">
                <div>
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text ">ISO Documents Review</div>
                    <Breadcrumbs className="" mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Text variant="gradient">ISO Documents Review</Text>
                    </Breadcrumbs>
                </div>
                <Button
                    onClick={() => {/* Handle PDF download */ }}
                    leftSection={<IconDownload />}
                >
                    Download PDF
                </Button>
            </div>

            <p className=' italic'>International standards documentation and guidelines</p>


            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-32">
                        <h2 className="text-lg text-gray-900 mb-4">ISO Standards</h2>
                        <div className="space-y-3">
                            {isoDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className={`
                      p-3 rounded-lg cursor-pointer transition-all duration-200 border-2
                      ${selectedDocument === doc.id
                                            ? `${doc.bgColor} border-current`
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }
                    `}
                                    onClick={() => {
                                        setSelectedDocument(doc.id);
                                        setSelectedSection(null);
                                        setExpandedSections(new Set());
                                    }}
                                >
                                    <div className="flex items-center">
                                        <IconFileText className={`w-5 h-5 ${doc.color} mr-3`} />
                                        <div>
                                            <div className={`${selectedDocument === doc.id ? doc.color : 'text-gray-900'}`}>
                                                {doc.title}
                                            </div>
                                            <div className="text-sm text-gray-500">{doc.subtitle}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">

                        {/* Document Header */}
                        <div className={`p-6 border-b border-gray-200 ${currentDocument.bgColor}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <IconFileText className={`w-8 h-8 ${currentDocument.color} mr-4`} />
                                    <div>
                                        <h2 className={`text-2xl ${currentDocument.color}`}>
                                            {currentDocument.title}
                                        </h2>
                                        <p className="text-gray-600 mt-1">{currentDocument.subtitle}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <SegmentedControl
                                        value={viewMode}
                                        color='primary'
                                        onChange={(value: string) => setViewMode(value as 'toc' | 'full')}
                                        data={[
                                            {
                                                value: 'toc',
                                                label: (
                                                    <Center style={{ gap: 8 }}>
                                                        <IconList size={16} />
                                                        <span>Table of Contents</span>
                                                    </Center>
                                                ),
                                            },
                                            {
                                                value: 'full',
                                                label: (
                                                    <Center style={{ gap: 8 }}>
                                                        <IconBook size={16} />
                                                        <span>Full Document</span>
                                                    </Center>
                                                ),
                                            },
                                        ]}
                                    />



                                    {/* Expand/Collapse All */}
                                    <Button
                                        onClick={toggleAllSections}
                                        variant="white"
                                        leftSection={expandedSections.size > 0 ? <IconEyeOff /> : <IconEye />}
                                    >
                                        {expandedSections.size > 0 ? 'Collapse All' : 'Expand All'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="relative">
                                <IconSearch className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search within document..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Document Content */}
                        <div className="p-6">
                            {viewMode === 'toc' ? (
                                <div className="space-y-2">{filteredSections.map(section => renderSection(section))}</div>
                            ) : (
                                <div className="space-y-8">
                                    {filteredSections.map(section => (
                                        <div key={section.id} className="border-b border-gray-100 pb-8 last:border-b-0">
                                            <h3 className="text-lg text-gray-900 mb-4">{section.number}. {section.title}</h3>
                                            <div className="text-gray-700 leading-relaxed mb-6">{section.content}</div>
                                            {section.subsections && section.subsections.length > 0 && (
                                                <div className="ml-6 space-y-6">
                                                    {section.subsections.map(subsection => (
                                                        <div key={subsection.id}>
                                                            <h4 className="text-lg text-gray-800 mb-3">{subsection.number} {subsection.title}</h4>
                                                            <div className="text-gray-700 leading-relaxed">{subsection.content}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'toc' && selectedSection && (
                                <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                                    <h3 className="text-lg text-blue-500 mb-4">Section Content</h3>
                                    {(() => {
                                        const section = currentDocument.sections.find(s => s.id === selectedSection) ||
                                            currentDocument.sections.flatMap(s => s.subsections || []).find(s => s.id === selectedSection);
                                        return section ? (
                                            <div className="text-blue-800 leading-relaxed">
                                                <div className="mb-2">{section.number}. {section.title}</div>
                                                <div>{section.content}</div>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Document Statistics */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center">
                                    <IconFileText className="w-5 h-5 text-blue-500 mr-2" />
                                    <div>
                                        <div className="text-sm text-gray-500">Total Sections</div>
                                        <div className="text-gray-900">{totalSections}</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <IconBook className="w-5 h-5 text-green-500 mr-2" />
                                    <div>
                                        <div className="text-sm text-gray-500">Subsections</div>
                                        <div className="text-gray-900">{totalSubsections}</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <IconSearch className="w-5 h-5 text-purple-500 mr-2" />
                                    <div>
                                        <div className="text-sm text-gray-500">Search Results</div>
                                        <div className="text-gray-900">{searchResults}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ISODocuments;
