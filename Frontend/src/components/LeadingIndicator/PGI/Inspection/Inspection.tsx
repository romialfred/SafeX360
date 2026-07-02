import { useEffect, useState } from 'react';
import { Button } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { IconBrandSpeedtest, IconEye, IconFile, IconFileCheck, IconUser } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useDispatch } from 'react-redux';
import ChecklistInspection from '../PGI Details/ChecklistInspection';
import Measurement from './Measurement';
import DetailsInspection from './DetailsInspection';
import Interview from './Interview';
import PageHeader from '../../../UtilityComp/PageHeader';
import { draftInspectionProcess, getDraftInspectionProcess } from '../../../../services/InspectionProcessService';
import { hideOverlay, showOverlay } from '../../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../../utility/NotificationUtility';
import { base64ToFileWithName, getBase64 } from '../../../../utility/DocumentUtility';
import { getEmployeeDropdown } from '../../../../services/EmployeeService';

type CheckListType = {
    id: string;
    checkListId: string;
    status: string;
    nonConformityLevel: string;
    observation: string;
    docs: any[];
    generalInspectionId: string;
    description: string;
    [key: string]: any;
}
type MeasurementType = {
    id: string;
    measurementId: string;
    value: string;
    generalInspectionId: string;
    [key: string]: any;
}

/**
 * Exécution d'une inspection HSE : saisie de la checklist, des mesures
 * techniques et des entretiens, avec enregistrement en brouillon ou clôture.
 */
const Inspection = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<any>([]);
    const [activeTab, setActiveTab] = useState('inspectionChecklist');
    const form = useForm({
        initialValues: {
            checklists: [] as CheckListType[],
            measurements: [] as MeasurementType[],
            interviews: {
                employees: [],
                interviewDate: "" as Date | string,
                description: "",
                generalInspectionId: id,
            },
            inspectionId: id,
        },
    });

    useEffect(() => {
        getEmployeeDropdown().then((res) => {
            setEmployee(res.map((item: any) => ({
                ...item,
                value: "" + item.id,
                label: item.name,
            })));
        }).catch((_err) => console.error(_err))
    }, [])

    useEffect(() => {
        getDraftInspectionProcess(id).then((res) => {
            form.setValues({
                checklists: res.checklists.map((item: any) => ({
                    ...item,
                    checkListId: "" + item.checkListId,
                    docs: item.docs.map((doc: any) => ({ id: doc.id, file: base64ToFileWithName(doc.file, doc.name) })),
                })),
                measurements: res.measurements.map((item: any) => ({
                    ...item,
                    measurementId: "" + item.measurementId,
                })),
                interviews: {
                    ...res.interviews,
                    employees: res.interviews?.employees?.map((item: any) => ("" + item)),
                    interviewDate: res.interviews ? new Date(res.interviews.interviewDate) : "",
                    description: res.interviews?.description,
                    generalInspectionId: id,
                },
            });
        }).catch((_err) => {
            errorNotification("Échec du chargement du brouillon d'inspection");
        })
    }, []);

    const handleSave = async (status: any) => {
        form.validate();
        if (!form.isValid()) return;
        const checklists = await Promise.all(
            form.values.checklists.map(async (item: any) => {
                const docs = await convertFilesToBase64(item.docs);
                return { ...item, docs };
            })
        );
        dispatch(showOverlay());
        draftInspectionProcess({ ...form.values, checklists, status })
            .then((_res) => {
                successNotification(status === "COMPLETED" ? "Inspection clôturée" : "Brouillon enregistré");
                navigate("/PGI");
            })
            .catch((_err) => {
                errorNotification("L'enregistrement de l'inspection a échoué");
            })
            .finally(() => {
                dispatch(hideOverlay());
            })
    }

    const convertFilesToBase64 = async (files: any[]) => {
        const fileObjects = await Promise.all(
            files.map(async (image) => {
                const base64: any = await getBase64(image.file);
                return {
                    id: image.id ?? null,
                    name: image.file.name,
                    file: base64.split(',')[1],
                };
            })
        );
        return fileObjects;
    };

    const tabs = [
        { key: 'inspectionChecklist', label: 'Checklist', icon: IconFile },
        { key: 'technicalMeasurement', label: 'Mesures techniques', icon: IconBrandSpeedtest },
        { key: 'employeeInterview', label: 'Entretiens', icon: IconUser },
        { key: 'viewInspectionDetails', label: "Détails de l'inspection", icon: IconEye },
    ];

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Inspections HSE', to: '/PGI' },
                    { label: "Exécution de l'inspection" },
                ]}
                icon={<IconFileCheck size={22} stroke={2} />}
                iconColor="green"
                title="Exécution de l'inspection"
                subtitle="Saisir la checklist, les mesures techniques et les entretiens, puis clôturer"
            />

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                        {tabs.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveTab(key)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                                    activeTab === key
                                        ? 'bg-green-600 text-white'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Icon size={14} aria-hidden="true" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-4">
                    {activeTab === 'inspectionChecklist' && <ChecklistInspection />}
                    {activeTab === 'technicalMeasurement' && <Measurement form={form} employee={employee} />}
                    {activeTab === 'employeeInterview' && <Interview form={form} employee={employee} />}
                    {activeTab === 'viewInspectionDetails' && <DetailsInspection />}
                </div>
            </div>

            <div className="flex gap-2 justify-end">
                <Button onClick={() => handleSave("IN_PROGRESS")} variant="default" size="sm">
                    Enregistrer le brouillon
                </Button>
                <Button onClick={() => handleSave("COMPLETED")} leftSection={<IconFileCheck size={14} />} color="teal" size="sm">
                    Clôturer l'inspection
                </Button>
            </div>
        </div>
    );
};

export default Inspection;
