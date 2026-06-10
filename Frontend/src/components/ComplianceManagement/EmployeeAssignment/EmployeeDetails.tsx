import { useEffect, useMemo, useState } from "react";
import { IconUserCircle } from "@tabler/icons-react";
import { useParams } from "react-router-dom";
import PageHeader from "../../UtilityComp/PageHeader";
import SegmentedFilter from "../../UtilityComp/SegmentedFilter";
import EmpTable from "./EmpTable";
import DocumentTable from "./DocumentTable";
import { getByEmployeeId, getRequirementsByEmpId } from "../../../services/ComplianceDocumentService";
import { errorNotification } from "../../../utility/NotificationUtility";
import { mapIdToName } from "../../../utility/OtherUtilities";

/**
 * Fiche conformité d'un employé (LOT 49) : identité, exigences du poste et
 * justificatifs déposés.
 */
const EmployeeDetails = () => {
    const { id: employeeId } = useParams();
    const [activeTab, setActiveTab] = useState('requirements');
    const [documents, setDocuments] = useState<any[]>([]);
    const [employeeInfo, setEmployeeInfo] = useState<{ empName: string; position: string; department: string; email: string } | null>(null);
    const [requirements, setRequirements] = useState<any[]>([]);
    const [docMap, setDocMap] = useState<Record<number, any>>({});

    const fetchData = () => {
        getRequirementsByEmpId(employeeId)
            .then((res) => {
                setEmployeeInfo({
                    empName: res.empName,
                    position: res.position,
                    department: res.department,
                    email: res.email,
                });
                setRequirements(res.requirements ?? []);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Les exigences du poste sont indisponibles');
            });

        getByEmployeeId(employeeId)
            .then((res) => {
                setDocMap(mapIdToName(res));
                setDocuments(res ?? []);
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || 'Les documents sont indisponibles');
            });
    };

    useEffect(() => {
        if (!employeeId) return;
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeId]);

    const counts = useMemo(() => {
        const compliant = requirements.filter((r) => r.status === 'Compliance').length;
        const nonCompliant = requirements.filter((r) => r.status === 'Non-Compliance').length;
        const uploaded = requirements.filter((r) => r.status === 'Uploaded').length;
        return { compliant, nonCompliant, uploaded };
    }, [requirements]);

    const initials = employeeInfo?.empName
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?';

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Conformité Réglementaire' },
                    { label: 'Affectations employés', to: '/employee-assignment' },
                    { label: employeeInfo?.empName ?? 'Fiche employé' },
                ]}
                icon={<IconUserCircle size={22} stroke={2} />}
                iconColor="teal"
                title={employeeInfo?.empName ?? 'Fiche conformité employé'}
                subtitle="Exigences du poste et justificatifs réglementaires de l'employé"
            />

            {/* Carte identité + synthèse */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-teal-50 ring-1 ring-teal-100 flex items-center justify-center text-teal-700 text-[13px] flex-shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[14px] text-slate-800 truncate">{employeeInfo?.empName ?? 'Chargement…'}</p>
                            <p className="text-[12px] text-slate-500 truncate">
                                {[employeeInfo?.position, employeeInfo?.department].filter(Boolean).join(' · ') || '—'}
                            </p>
                            {employeeInfo?.email && <p className="text-[11.5px] text-slate-400 truncate">{employeeInfo.email}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-[18px] text-emerald-600 tabular-nums" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>
                                {counts.compliant}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">Conformes</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[18px] text-rose-600 tabular-nums" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>
                                {counts.nonCompliant}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">Non conformes</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[18px] text-violet-600 tabular-nums" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>
                                {counts.uploaded}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">À valider</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Onglets Exigences / Documents */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
                <SegmentedFilter
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                        { value: 'requirements', label: 'Exigences du poste', count: requirements.length, color: 'teal' },
                        { value: 'documents', label: 'Documents déposés', count: documents.length, color: 'violet' },
                    ]}
                />
                <div className="mt-3">
                    {activeTab === 'requirements' ? (
                        <EmpTable requirements={requirements} fetchData={fetchData} docMap={docMap} />
                    ) : (
                        <DocumentTable documents={documents} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetails;
