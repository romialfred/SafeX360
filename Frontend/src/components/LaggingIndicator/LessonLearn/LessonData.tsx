import { ActionIcon, LoadingOverlay, Modal, Select, TextInput, Tooltip } from "@mantine/core";
import {
    IconBook,
    IconCircleCheck,
    IconClock,
    IconEye,
    IconLayoutGrid,
    IconLayoutList,
    IconSearch,
    IconTag,
} from "@tabler/icons-react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { GetAllDetails } from "../../../services/LessonLearnService";
import { useDisclosure } from "@mantine/hooks";
import Lesson from "../IncidentManagement/Details/Lesson";
import { useNavigate } from "react-router-dom";
import LessonLearnCard from "./LessonLearnCard";
import EmptyState from "../../UtilityComp/EmptyState";
import { lessonCategoryLabel, lessonStatusLabel, PAGINATOR_FR } from "../IncidentManagement/incidentLabels";
import { formatDateShort } from "../../../utility/DateFormats";
import { Z } from '../../../constants/zIndex';

const defaultFilters: DataTableFilterMeta = {
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    category: { value: null, matchMode: FilterMatchMode.EQUALS },
};


const LessonData = () => {
    const toast = useRef<Toast>(null);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [lessondata, setLessonData] = useState<any[]>([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [selectedLesson, setSelectedLesson] = useState<any>(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [viewType, setViewType] = useState<'table' | 'card'>('table');
    const [selectedCategory, _setSelectedCategory] = useState<string>('All');
    const [selectedStatus, _setSelectedStatus] = useState<string>('All');

    const [_categories, setCategories] = useState<string[]>([]);

    const truncateText = (text: string, wordLimit: number) => {
        const words = text.split(" ");
        return words.length > wordLimit
            ? words.slice(0, wordLimit).join(" ") + "..."
            : text;
    };

    const incidentTitleBody = (rowData: any) => {
        const shortTitle = truncateText(rowData.incidentTitle || '', 5);
        return (
            <button
                onClick={() => navigate(`/incidents/${rowData.incidentId}?tab=lessons`)}
                className="text-blue-600 hover:underline text-left w-full cursor-pointer"
            >
                {shortTitle}
            </button>
        );
    };



    useEffect(() => {
        GetAllDetails({})
            .then((data) => {
                setLessonData(data);

                const uniqueCats: string[] = Array.from(
                    new Set(
                        data
                            .map((item: any) => item.category)
                            .filter((cat: any): cat is string => !!cat)
                    )
                );

                setCategories(['All', ...uniqueCats]);
            })
            .catch((err) => console.error("Failed to fetch lesson data", err));
    }, []);


    // const calculateCounts = () => {
    //     const total = lessondata.length;
    //     const approved = lessondata.filter(item => item.status?.toLowerCase() === "approved").length;
    //     const pending = lessondata.filter(item => item.status?.toLowerCase() === "pending").length;
    //     return { total, approved, pending };
    // };

    const actionBodyTemplate = (rowData: any) => {
        return (
            <div className='flex gap-3'>
                <Tooltip label="Voir le détail">
                    <ActionIcon
                        variant="filled"
                        size="sm"
                        color="primary"
                        aria-label="Voir le détail"
                        onClick={() => {
                            setSelectedLesson(rowData);
                            open();
                        }}
                    >
                        <IconEye style={{ width: '90%', height: '90%' }} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
            </div>
        );
    };

    const categoryBody = (rowData: any) => {
        const cat = rowData.category?.toLowerCase();
        const catStyles: Record<string, string> = {
            technical: "bg-blue-100 text-blue-800",
            procedural: "bg-purple-100 text-purple-800",
            training: "bg-green-100 text-green-800",
            communication: "bg-yellow-100 text-yellow-800",
            other: "bg-gray-100 text-gray-800",
        };
        return (
            <span className={`flex items-center gap-2 px-3 py-1 rounded-xl text-sm ${catStyles[cat] || "bg-gray-100 text-gray-800"}`}>
                <IconTag size={16} /> {lessonCategoryLabel(rowData.category)}
            </span>
        );
    };

    const statusBodyTemplate = (rowData: any) => {
        const status = rowData.status?.toLowerCase();
        // Palette charte R7 : emerald = approuvé, violet = en attente
        let statusStyles = "bg-slate-100 text-slate-700";
        let IconComponent = IconClock;

        if (status === "approved") {
            statusStyles = "bg-emerald-50 text-emerald-700 border border-emerald-200";
            IconComponent = IconCircleCheck;
        } else if (status === "pending") {
            statusStyles = "bg-violet-50 text-violet-700 border border-violet-200";
            IconComponent = IconClock;
        }

        return (
            <span className={`flex items-center gap-2 px-3 py-1 rounded-xl text-sm ${statusStyles}`}>
                <IconComponent size={16} /> {lessonStatusLabel(rowData.status)}
            </span>
        );
    };

    const descriptionBody = (rowData: any) => {
        const text: string = rowData?.description || '';
        const max = 30; // characters
        const short = text.length > max ? text.slice(0, max) + '…' : text;
        return (
            <Tooltip label={text} withArrow>
                <span className="text-gray-700">{short}</span>
            </Tooltip>
        );
    };

    // const { total, approved, pending } = calculateCounts();

    const filteredData = lessondata.filter((lesson) => {
        const categoryMatch = selectedCategory === 'All' || lesson.category?.toLowerCase() === selectedCategory.toLowerCase();
        const statusMatch = selectedStatus === 'All' || lesson.status?.toLowerCase() === selectedStatus.toLowerCase();
        return categoryMatch && statusMatch;
    });


    return (
        <div className="flex flex-col gap-5">



            <div className="bg-white border border-gray-300 shadow-sm rounded-lg p-4 flex gap-10 items-center ">
                <div className="grid grow grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">


                    {/* 🔍 SEARCH */}
                    <TextInput
                        label="Recherche"
                        placeholder="Rechercher une leçon"
                        leftSection={<IconSearch />}

                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                global: {
                                    value: e.currentTarget.value,
                                    matchMode: FilterMatchMode.CONTAINS,
                                },
                            }))
                        }
                    />

                    {/* ✅ STATUS */}
                    <Select
                        label="Statut"
                        placeholder="Sélectionner un statut"
                        data={[
                            { value: "All Status", label: "Tous les statuts" },
                            { value: "Pending", label: "En attente" },
                            { value: "Approved", label: "Approuvée" },
                        ]}
                        defaultValue="All Status"
                        onChange={(val) =>
                            setFilters((prev) => ({
                                ...prev,
                                status:
                                    val && val !== "All Status"
                                        ? { value: val, matchMode: FilterMatchMode.EQUALS }
                                        : { value: null, matchMode: FilterMatchMode.EQUALS },
                            }))
                        }
                    />

                    {/* 🏷️ CATEGORY */}
                    <Select
                        label="Catégorie"
                        placeholder="Sélectionner une catégorie"
                        data={[
                            { value: "All Categories", label: "Toutes les catégories" },
                            { value: "Technical", label: "Technique" },
                            { value: "Procedural", label: "Procédurale" },
                            { value: "Training", label: "Formation" },
                            { value: "Communication", label: "Communication" },
                            { value: "Other", label: "Autre" },
                        ]}
                        defaultValue="All Categories"
                        onChange={(val) =>
                            setFilters((prev) => ({
                                ...prev,
                                category:
                                    val && val !== "All Categories"
                                        ? { value: val, matchMode: FilterMatchMode.EQUALS }
                                        : { value: null, matchMode: FilterMatchMode.EQUALS },
                            }))
                        }
                    />


                </div>

                <div className="flex items-center gap-2 border border-primary rounded-lg p-2 bg-gray-100 mt-4">
                    <Tooltip label="Vue tableau">
                        <ActionIcon
                            variant={viewType === 'table' ? 'filled' : 'light'}
                            color="blue"
                            aria-label="Vue tableau"
                            onClick={() => setViewType('table')}
                        >
                            <IconLayoutList size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Vue cartes">
                        <ActionIcon
                            variant={viewType === 'card' ? 'filled' : 'light'}
                            color="blue"
                            aria-label="Vue cartes"
                            onClick={() => setViewType('card')}
                        >
                            <IconLayoutGrid size={18} />
                        </ActionIcon>
                    </Tooltip>
                </div>
            </div>



            <div className="card">
                <Toast ref={toast} />
                {/* <Toolbar className="mb-3 !p-2" left={categoryTemplate} right={statusDropdownTemplate} /> */}

                {
                    viewType === 'table' ? (
                        <DataTable selectionMode="single"
                            className='[&_.p-datatable-tbody]:!text-sm'
                            size='small'
                            stripedRows
                            removableSort
                            paginator
                            rows={10}
                            value={lessondata}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"

                            rowsPerPageOptions={[10, 25, 50]}
                            dataKey="id"
                            filters={filters}
                            globalFilterFields={['incidentTitle', 'category', 'status', 'employeeName', 'description']}
                            currentPageReportTemplate={PAGINATOR_FR}
                            emptyMessage="Aucune leçon ne correspond aux filtres."
                            onFilter={(e) => setFilters(e.filters)}
                        >
                            <Column style={{ fontWeight: 'normal' }} header='Incident source' field='incidentTitle' body={incidentTitleBody} />
                            <Column style={{ fontWeight: 'normal' }} header='Responsable' field='employeeName' />
                            <Column style={{ fontWeight: 'normal' }} header='Date' field='date' body={(rowData) => formatDateShort(rowData.date)} />
                            <Column style={{ fontWeight: 'normal' }} header='Description' field='description' body={descriptionBody} />
                            <Column style={{ fontWeight: 'normal' }} header='Catégorie' field='category' body={categoryBody} />
                            <Column style={{ fontWeight: 'normal' }} header='Statut' body={statusBodyTemplate} field='status' />
                            <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
                        </DataTable>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {filteredData.map((lessonData) => (
                                <LessonLearnCard key={lessonData.id} lessonData={lessonData} />
                            ))}
                            {filteredData.length === 0 &&
                                <div className="col-span-full">
                                    <EmptyState
                                        icon={<IconBook size={28} />}
                                        title="Aucune leçon à afficher"
                                        description="Aucune leçon apprise ne correspond aux filtres sélectionnés."
                                        iconColor="slate"
                                    />
                                </div>}
                        </div>
                    )
                }
            </div>

            <Modal
                opened={opened}
                onClose={() => {
                    close();
                    setSelectedLesson(null);
                }}
                title="Retour d'expérience"
                size="xl"
                centered
            >
                <LoadingOverlay visible={loading} zIndex={Z.overlay} overlayProps={{ radius: "sm", blur: 8 }} />
                {selectedLesson && (
                    <Lesson incidentId={selectedLesson.incidentId} setLoading={setLoading} />
                )}
            </Modal>
        </div>
    );
};

export default LessonData;
