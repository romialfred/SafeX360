import { Breadcrumbs, Button, Card, Divider, Modal, NumberInput, Progress, Select, Text, TextInput, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconCircleCheck, IconClock, IconSearch, IconTrendingUp, IconUser } from "@tabler/icons-react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Tag } from "primereact/tag";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { recommendationTableData } from "../../../Data/IncidentsData";
import TextEditor from "../../UtilityComp/TextEditor";
import EffectivenessPanel from "./EffectivenessPanel";
import { useForm } from "@mantine/form";
import { PAGINATOR_FR } from "../IncidentManagement/incidentLabels";

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

/** Libellés FR des statuts de recommandation (données seed en anglais). */
const RECO_STATUS_LABELS: Record<string, string> = {
    'pending': 'En attente',
    'in progress': 'En cours',
    'implemented': 'Mise en œuvre',
    'overdue': 'En retard',
    'closed': 'Clôturée',
    'rejected': 'Rejetée',
};

const AuditRecommendations = () => {
    const { t } = useTranslation('audits');
    // Libellé de statut (seed legacy en anglais) : clé i18n `audits:recommendations.recoStatus.*`, repli FR centralisé.
    const tRecoStatus = (status: string): string =>
        t(`recommendations.recoStatus.${status}`, { defaultValue: RECO_STATUS_LABELS[status] ?? status });
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [modalOpened, setModalOpened] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>('all');


    const form = useForm({
        initialValues: {
            title: "",
            category: "",
            types: [] as string[],
            purpose: "",
            startDate: null as Date | null,
            endDate: null as Date | null,
        },
        validate: {
            title: (value) => {
                const trimmed = value.trim();
                if (trimmed.length === 0) return t('edit.errorTitleRequired');

                const wordCount = trimmed.length;
                return wordCount > 50 ? t('edit.errorTitleMax') : null;
            },
        },
    });

    const getSeverity = (rowData: any, field: 'status' | 'progress') => {
        if (field === 'status') {
            const severityMap: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
                'pending': 'warning',
                'in progress': 'info',
                'implemented': 'success',
                'overdue': 'danger',
            };
            const status = rowData.status?.toLowerCase?.() || 'pending';
            return <Tag value={tRecoStatus(status)} severity={severityMap[status] || 'info'} />;
        }
        return <Tag value={rowData.progress} />;
    };

    const recommendationSummaryData = [
        { label: t('recommendations.summaryTotal'), value: 3, icon: IconTrendingUp, color: '#173ac9' },
        { label: t('recommendations.summaryInProgress'), value: 2, icon: IconClock, color: '#f3b121' },
        { label: t('recommendations.summaryImplemented'), value: 0, icon: IconCircleCheck, color: '#4dca45' },
        { label: t('recommendations.summaryOverdue'), value: 3, icon: IconAlertTriangle, color: '#f44336' },
    ];

    const actionBodyTemplate = (rowData: any) => (
        <Tooltip label={t('recommendations.legacyUpdateTooltip')}>
            <Button
                size="xs"
                onClick={() => {
                    setSelectedRow(rowData);
                    setModalOpened(true);
                }}
            >
                {t('recommendations.update')}
            </Button>
        </Tooltip>
    );

    const onGlobalFilterChange = (value: string) => {
        setFilters((prev) => ({
            ...prev,
            global: { value, matchMode: FilterMatchMode.CONTAINS },
        }));
    };

    const filteredData = recommendationTableData.filter((row: any) =>
        statusFilter === 'all' || !statusFilter || row.status?.toLowerCase() === statusFilter
    );

    return (
        <div>
            <div>
                {/* LOT 40 P1: page title color */}
                <div className="text-2xl text-slate-900 w-fit">{t('recommendations.legacyTitle')}</div>
                <Breadcrumbs mt="xs" mb="lg">
                    <Link className="hover:!underline" to="/"><Text variant="gradient">{t('recommendations.breadcrumbHome')}</Text></Link>

                    <Text variant="gradient">{t('recommendations.legacyTitle')}</Text>
                </Breadcrumbs>
            </div>
            <div className="italic my-3">
                {t('recommendations.legacySubtitle')}
            </div>
            <div className="flex flex-col gap-10">
                {/* Filtres */}
                <Card className="bg-white" shadow="sm" withBorder radius="md">
                    {/* LOT 40 P1: responsive grid breakpoints */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <TextInput
                            label={t('recommendations.legacySearch')}
                            placeholder={t('recommendations.legacySearchPlaceholder')}
                            leftSection={<IconSearch />}
                            onChange={(e) => onGlobalFilterChange(e.currentTarget.value)}
                        />
                        <Select
                            label={t('recommendations.legacyStatus')}
                            placeholder={t('recommendations.legacyStatusPlaceholder')}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            data={[
                                { value: 'all', label: t('recommendations.legacyStatusAll') },
                                { value: 'pending', label: tRecoStatus('pending') },
                                { value: 'in progress', label: tRecoStatus('in progress') },
                                { value: 'implemented', label: tRecoStatus('implemented') },
                                { value: 'overdue', label: tRecoStatus('overdue') },
                            ]}
                        />
                    </div>
                </Card>

                {/* Indicateurs */}
                <div className="grid gap-4 md:grid-cols-4 sm:grid-cols-1 mb-4">
                    {recommendationSummaryData.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="flex justify-between p-4 shadow-sm rounded-xl border border-gray-200">
                                <div>
                                    <p className="text-gray-600 text-sm uppercase tracking-wide">{item.label}</p>
                                    <h2 className="text-lg text-gray-800 tabular-nums">{item.value}</h2>
                                </div>
                                <div><Icon size={32} stroke={2} color={item.color} /></div>
                            </div>
                        );
                    })}
                </div>

                {/* Tableau */}
                <Card className="bg-white" shadow="sm" withBorder radius="md" p={10}>
                    <DataTable selectionMode="single"
                        className='[&_.p-datatable-tbody]:!text-sm'
                        size='small'
                        stripedRows
                        removableSort
                        paginator
                        value={filteredData}
                        rows={10}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        rowsPerPageOptions={[10, 25, 50]}
                        dataKey="recommendation"
                        filters={filters}
                        globalFilterFields={['recommendation', 'audit', 'department', 'status']}
                        currentPageReportTemplate={PAGINATOR_FR}
                        emptyMessage={t('recommendations.legacyEmpty')}
                        onFilter={(e) => setFilters(e.filters)}
                    >
                        <Column style={{ fontWeight: 'normal' }} field="recommendation" header={t('recommendations.legacyColRecommendation')} sortable />
                        <Column style={{ fontWeight: 'normal' }} field="audit" header={t('recommendations.legacyColAudit')} />
                        <Column style={{ fontWeight: 'normal' }} field="department" header={t('recommendations.legacyColDepartment')} />
                        <Column style={{ fontWeight: 'normal' }} field="date" header={t('recommendations.legacyColDeadline')} />
                        <Column style={{ fontWeight: 'normal' }} field="status" header={t('recommendations.legacyColStatus')} body={(rowData) => getSeverity(rowData, 'status')} />
                        <Column style={{ fontWeight: 'normal' }} field="progress" header={t('recommendations.legacyColProgress')} body={(rowData) => getSeverity(rowData, 'progress')} />
                        <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
                    </DataTable>
                </Card>
            </div>
            <div>
                {/* Modal */}
                <Modal
                    opened={modalOpened}
                    onClose={() => setModalOpened(false)}
                    title={t('recommendations.updateTitle')}
                    size="sm"
                    centered
                    zIndex={1002} yOffset="10dvh"
                >
                    {selectedRow && (
                        <div className="flex gap-10 ">
                            <div className="flex flex-col gap-5 w-[700px]">
                                <div>
                                    <h1 className="text-lg">{selectedRow.recommendation}</h1>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 uppercase tracking-wide">{t('recommendations.description')}</p>
                                    <div className="bg-blue-50 rounded-lg shadow-sm p-4 ">
                                        <p className="text-sm">Mettre en place un système documentaire numérique normalisé pour les évaluations des risques, afin d'améliorer la traçabilité et l'accès aux enregistrements.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Select label={t('recommendations.legacyStatus')} placeholder={t('recommendations.legacyStatusPlaceholder')} data={[
                                        { value: 'Pending', label: tRecoStatus('pending') },
                                        { value: 'In-Progress', label: tRecoStatus('in progress') },
                                        { value: 'Implemented', label: tRecoStatus('implemented') },
                                        { value: 'Closed', label: tRecoStatus('closed') },
                                        { value: 'Rejected', label: tRecoStatus('rejected') },
                                    ]} />
                                    <NumberInput label={t('recommendations.progressLabel')} placeholder={t('recommendations.legacyProgressPlaceholder')} min={0} max={100} />
                                </div>

                                <TextEditor form={form} id="purpose" title={t('recommendations.legacyCommentLabel')} />

                                {/* LOT 52 — vérification d'efficacité ISO 19011 §6.6 */}
                                {selectedRow.id && <EffectivenessPanel recommendationId={Number(selectedRow.id)} />}

                                <Divider size="xs" />

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setModalOpened(false)}>{t('recommendations.legacyClose')}</Button>
                                    <Button variant="gradient" onClick={() => setModalOpened(false)}>{t('recommendations.save')}</Button>
                                </div>
                            </div>
                            <Divider size="xs" orientation="vertical" />
                            <div>
                                <Card shadow="sm" padding="sm" radius="md" withBorder className="w-[250px]">
                                    <p className="text-lg mb-4 flex gap-1 text-amber-600"><IconClock /> {t('recommendations.legacyUpdatesHistory')}</p>
                                    <div className="flex flex-col gap-4">
                                        <div className=" flex flex-col gap-8">
                                            <div className="flex justify-between items-center">
                                                <p className="text-lg flex gap-1 text-blue-600"><IconUser />3</p>
                                                <div className="bg-amber-200 rounded-4xl ">
                                                    <p className="text-sm text-amber-800 flex gap-1 p-1 items-center"><IconClock />{tRecoStatus('in progress')}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-5">
                                                <p className="text-gray-800">01/04/2024, 15:30</p>
                                                <div className="flex justify-between">
                                                    <Text size="md" className="text-gray-600">{t('recommendations.legacyStatusPrefix', { value: tRecoStatus('in progress') })}</Text>
                                                    <Progress value={4} color="yellow" />
                                                </div>

                                                <div className="bg-blue-50 shadow-sm rounded-lg p-4">
                                                    <Text size="sm" className="text-gray-700 mt-1">{t('recommendations.legacyCommentPrefix', { value: 'évaluation du système engagée' })}</Text>
                                                </div>

                                            </div>

                                        </div>
                                    </div>
                                </Card>
                            </div>

                        </div>
                    )}
                </Modal>
            </div>

        </div>
    )
}

export default AuditRecommendations
