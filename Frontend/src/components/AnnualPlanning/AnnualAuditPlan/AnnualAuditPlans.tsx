import { useState } from 'react';
import {
    IconPlus,
    IconEdit,
    IconEye,
    IconTrash,
    IconTable,
    IconGrid3x3,
    IconChevronLeft,
    IconChevronRight,
    IconDots,
    IconCheck,
} from '@tabler/icons-react';
import { Breadcrumbs, Text } from '@mantine/core';
import { Link } from 'react-router-dom';

interface AuditPlan {
    id: string;
    reference: string;
    title: string;
    auditArea: string;
    leadAuditor: string;
    category: 'Internal' | 'External';
    startDate: string;
    endDate: string;
    status: 'Pending' | 'Approved' | 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
    type: string;
}


const AnnualAuditPlans = () => {

    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showManageModal, setShowManageModal] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState<AuditPlan | null>(null);

    const [auditPlans, setAuditPlans] = useState<AuditPlan[]>([
        {
            id: '1',
            reference: 'AUD-2025-001',
            title: 'Audit des processus de gestion des Incidents',
            auditArea: 'Security awareness',
            leadAuditor: 'M. Dubois',
            category: 'Internal',
            startDate: '2024-01-15',
            endDate: '2024-01-17',
            status: 'Approved',
            type: 'Audit de conformité réglementaire'
        },
        {
            id: '2',
            reference: 'AUD-2025-003',
            title: 'Audit de la flotte et des pratiques logistiques',
            auditArea: 'Security awareness',
            leadAuditor: 'P. Bernard',
            category: 'External',
            startDate: '2025-03-25',
            endDate: '2025-03-29',
            status: 'Planned',
            type: 'Audit de conformité réglementaire'
        },
        {
            id: '3',
            reference: 'AUD-2025-004',
            title: 'Audit de la sécurité des systèmes d\'information',
            auditArea: 'IT Main Server Room',
            leadAuditor: 'S. Martin',
            category: 'External',
            startDate: '2025-08-15',
            endDate: '2025-08-22',
            status: 'Pending',
            type: 'Audit de conformité réglementaire'
        },
        {
            id: '4',
            reference: 'AUD-2025-005',
            title: 'Audit environnemental des installations',
            auditArea: 'Production Area',
            leadAuditor: 'L. Moreau',
            category: 'Internal',
            startDate: '2025-02-10',
            endDate: '2025-02-14',
            status: 'Approved',
            type: 'Audit environnemental'
        },
        {
            id: '5',
            reference: 'AUD-2025-006',
            title: 'Audit qualité des processus de fabrication',
            auditArea: 'Manufacturing Floor',
            leadAuditor: 'A. Leroy',
            category: 'Internal',
            startDate: '2025-04-20',
            endDate: '2025-04-25',
            status: 'Planned',
            type: 'Audit qualité'
        },
        {
            id: '6',
            reference: 'AUD-2025-007',
            title: 'Audit de sécurité des équipements industriels',
            auditArea: 'Equipment Room',
            leadAuditor: 'J. Dupont',
            category: 'External',
            startDate: '2025-06-05',
            endDate: '2025-06-10',
            status: 'Pending',
            type: 'Audit de sécurité industrielle'
        },
        {
            id: '7',
            reference: 'AUD-2025-008',
            title: 'Audit des procédures d\'urgence et évacuation',
            auditArea: 'Emergency Systems',
            leadAuditor: 'C. Directeur',
            category: 'Internal',
            startDate: '2025-09-12',
            endDate: '2025-09-16',
            status: 'Approved',
            type: 'Audit de conformité réglementaire'
        }
    ]);

    const categories = [
        { id: 'All', label: 'All', count: auditPlans.length },
        { id: 'Internal', label: 'Internal', count: auditPlans.filter(a => a.category === 'Internal').length },
        { id: 'External', label: 'External', count: auditPlans.filter(a => a.category === 'External').length }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'Planned': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Internal': return 'text-blue-600';
            case 'External': return 'text-purple-600';
            default: return 'text-gray-600';
        }
    };

    const handleApproveAudit = (auditId: string) => {
        setAuditPlans(auditPlans.map(audit =>
            audit.id === auditId && audit.status === 'Pending'
                ? { ...audit, status: 'Approved' }
                : audit
        ));
        setShowManageModal(false);
        setSelectedAudit(null);
    };

    const handleManageAudit = (audit: AuditPlan) => {
        setSelectedAudit(audit);
        setShowManageModal(true);
    };

    const filteredAudits = selectedCategory === 'All'
        ? auditPlans
        : auditPlans.filter(audit => audit.category === selectedCategory);

    const totalPages = Math.ceil(filteredAudits.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAudits = filteredAudits.slice(startIndex, endIndex);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="p-5 flex flex-col gap-5">
            {/* Header */}

            <div className="flex items-center justify-between">
                <div>
                    <div className="text-2xl font-semibold text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">Annual Audit Plan (AAP)</div>
                    <Breadcrumbs mt="xs">
                        <Link className="hover:!underline" to="/" ><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/hs-activities-planning" ><Text variant="gradient" className="hover:!underline cursor-pointer">HSE Planning</Text></Link>
                        <Text variant="gradient">Annual Audit Plan (AAP)</Text>
                    </Breadcrumbs>
                </div>


            </div>


            <div className=" flex flex-col gap-2">
                {/* Category Tabs */}
                <div className=" rounded-lg shadow-sm p-3 border border-gray-300 flex justify-between">
                    <div className="flex space-x-1">
                        {categories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${selectedCategory === category.id
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                                    }`}
                            >
                                {category.label} ({category.count})
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'table'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                <IconTable className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'cards'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                <IconGrid3x3 className="w-4 h-4" />
                            </button>
                        </div>

                        <button className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            <IconPlus className="w-4 h-4 mr-2" />
                            New Audit Plan
                        </button>
                    </div>
                </div>

                {/* Table View */}
                {viewMode === 'table' && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-300">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-slate-600">Reference</th>
                                        <th className="text-left py-4 px-6 text-slate-600">Audit Title</th>
                                        <th className="text-left py-4 px-6 text-slate-600">Audit Area</th>
                                        <th className="text-left py-4 px-6 text-slate-600">Lead Auditor</th>
                                        <th className="text-left py-4 px-6 text-slate-600">Category</th>
                                        <th className="text-left py-4 px-6 text-slate-600">Start Date</th>
                                        <th className="text-left py-4 px-6 text-slate-600">End Date</th>
                                        <th className="text-left py-4 px-6 text-slate-600">Status</th>
                                        <th className="text-left py-4 px-6 text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentAudits.map((audit) => (
                                        <tr key={audit.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-4 px-6 text-slate-800">{audit.reference}</td>
                                            <td className="py-4 px-6">
                                                <div className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                                    {audit.title}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600">{audit.auditArea}</td>
                                            <td className="py-4 px-6 text-slate-600">{audit.leadAuditor}</td>
                                            <td className="py-4 px-6">
                                                <span className={`${getCategoryColor(audit.category)}`}>
                                                    {audit.category}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600">{formatDate(audit.startDate)}</td>
                                            <td className="py-4 px-6 text-slate-600">{formatDate(audit.endDate)}</td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(audit.status)}`}>
                                                    {audit.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center space-x-2">
                                                    {audit.status !== 'Approved' && (
                                                        <button
                                                            onClick={() => handleManageAudit(audit)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded flex items-center text-xs"
                                                            title="Manage Audit"
                                                        >
                                                            <IconDots className="w-4 h-4 mr-1" />
                                                            Manage
                                                        </button>
                                                    )}
                                                    <button className="p-1 text-teal-600 hover:bg-teal-50 rounded">
                                                        <IconEdit className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-1 text-orange-600 hover:bg-orange-50 rounded">
                                                        <IconEye className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                        <IconTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                >
                                    <IconChevronLeft className="w-4 h-4" />
                                    <IconChevronLeft className="w-4 h-4 -ml-2" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                >
                                    <IconChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
                                    {currentPage}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                >
                                    <IconChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                >
                                    <IconChevronRight className="w-4 h-4" />
                                    <IconChevronRight className="w-4 h-4 -ml-2" />
                                </button>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-slate-600">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAudits.length)} of {filteredAudits.length} entries
                                </span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                    className="border border-slate-300 rounded px-3 py-1 text-sm"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cards View */}
                {viewMode === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentAudits.map((audit) => (
                            <div key={audit.id} className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(audit.category)} bg-slate-100`}>
                                            {audit.category}
                                        </span>
                                        <span className="text-purple-600">{audit.auditArea}</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(audit.status)}`}>
                                        {audit.status}
                                    </span>
                                </div>

                                <h3 className="text-lg text-slate-800 mb-3">{audit.title}</h3>

                                <div className="space-y-2 text-sm text-slate-600 mb-4">
                                    <div>
                                        <span className="font-medium">Audit Date:</span> {formatDate(audit.startDate)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Type:</span> {audit.type}
                                    </div>
                                    <div>
                                        <span className="font-medium">Lead Auditor:</span> {audit.leadAuditor}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                                    <div className="flex items-center space-x-3">
                                        {audit.status !== 'Approved' && (
                                            <button
                                                onClick={() => handleManageAudit(audit)}
                                                className="flex items-center text-blue-600 hover:text-blue-800 text-sm bg-blue-50 px-3 py-1 rounded-lg"
                                            >
                                                <IconDots className="w-4 h-4 mr-1" />
                                                Manage
                                            </button>
                                        )}
                                        <button className="flex items-center text-teal-600 hover:text-teal-800 text-sm">
                                            <IconEdit className="w-4 h-4 mr-1" />
                                            Edit
                                        </button>
                                        <button className="flex items-center text-orange-600 hover:text-orange-800 text-sm">
                                            <IconEye className="w-4 h-4 mr-1" />
                                            View
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Manage Audit Modal */}
            {showManageModal && selectedAudit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg mb-4">Manage Audit</h3>

                        <div className="mb-4">
                            <p className="text-sm text-slate-600 mb-2">Audit Reference:</p>
                            <p className="font-medium">{selectedAudit.reference}</p>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-slate-600 mb-2">Current Status:</p>
                            <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(selectedAudit.status)}`}>
                                {selectedAudit.status}
                            </span>
                        </div>

                        {selectedAudit.status === 'Pending' && (
                            <div className="mb-6">
                                <p className="text-sm text-slate-600 mb-3">Change status to:</p>
                                <button
                                    onClick={() => handleApproveAudit(selectedAudit.id)}
                                    className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <IconCheck className="w-4 h-4 mr-2" />
                                    Approve Audit
                                </button>
                            </div>
                        )}

                        {selectedAudit.status !== 'Pending' && (
                            <div className="mb-6">
                                <p className="text-sm text-slate-500">No status changes available for this audit.</p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowManageModal(false);
                                    setSelectedAudit(null);
                                }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AnnualAuditPlans