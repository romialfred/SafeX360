import { Button, Card, Text, Breadcrumbs, Tabs } from '@mantine/core';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconBrandSpeedtest, IconEye, IconFile, IconFileCheck, IconUser } from '@tabler/icons-react';
import ChecklistInspection from '../PGI Details/ChecklistInspection';
import Measurement from './Measurement';
import DetailsInspection from './DetailsInspection';
import { useForm } from '@mantine/form';
import Interview from './Interview';
import { draftInspectionProcess, getDraftInspectionProcess } from '../../../../services/InspectionProcessService';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../../slices/OverlaySlice';
import { errorNotification, successNotification } from '../../../../utility/NotificationUtility';
import { base64ToFileWithName, getBase64 } from '../../../../utility/DocumentUtility';
import { useEffect, useState } from 'react';
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
    [key: string]: any; // For additional properties
}
type MeasurementType = {
    id: string;
    measurementId: string;
    value: string;
    generalInspectionId: string;
    [key: string]: any; // For additional properties
}
const Inspection = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<any>([]);
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
            setEmployee(res.map((item: any) => {
                return {
                    ...item,
                    value: "" + item.id,
                    label: item.name,
                }
            }))
        }
        ).catch((_err) => { })
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
            errorNotification("Error fetching draft inspection process");
        })
    }, []);

    const handleSave = async (status: any) => {
        form.validate();
        if (!form.isValid()) return;
        const checklists = await Promise.all(
            form.values.checklists.map(async (item: any) => {
                const docs = await convertFilesToBase64(item.docs);
                return {
                    ...item,
                    docs: docs
                };
            })
        );
        dispatch(showOverlay());
        draftInspectionProcess({ ...form.values, checklists, status }).then((_res) => {
            successNotification("Draft saved successfully");
            navigate("/PGI");
        }
        ).catch((_err) => {
            errorNotification("Error saving draft");

        }
        ).finally(() => {
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
    return (
        <div className='flex flex-col gap-10'>
            <div className="flex justify-between items-center  ">
                <div>
                    {/* LOT 40 P1: titre page passé en text-slate-900 */}
                    <div className="text-2xl font-semibold text-slate-900 bg-gradient-to-r from-primary to-secondary bg-clip-text ">Inspections Details</div>
                    <Breadcrumbs className="" mt="xs">
                        {/* LOT 40 P1: breadcrumbs Mantine 7 — couleurs sémantiques au lieu de variant="gradient" */}
                        <Link className="hover:!underline" to="/" ><Text c="dimmed" className="hover:!underline cursor-pointer">Home</Text></Link>
                        <Link className="hover:!underline" to="/PGI">
                            <Text c="dimmed">Planned General Inspections</Text>
                        </Link>
                        <Text c="teal" fw={500}>Inspections Details</Text>
                    </Breadcrumbs>
                </div>

            </div>






            <Card shadow="sm" radius="md" withBorder className="bg-white">

                <Tabs variant='pills' defaultValue="inspectionChecklist" autoContrast className="p-4 ">
                    <Tabs.List className='mb-5' >
                        <Tabs.Tab value="inspectionChecklist" leftSection={<IconFile size={16} />}>
                            Inspection Checklist
                        </Tabs.Tab>
                        <Tabs.Tab value="technicalMeasurement" leftSection={<IconBrandSpeedtest size={16} />}>
                            Technical Measurement
                        </Tabs.Tab>
                        <Tabs.Tab value="employeeInterview" leftSection={<IconUser size={16} />}>
                            Employee Interview
                        </Tabs.Tab>
                        <Tabs.Tab value="viewInspectionDetails" leftSection={<IconEye size={16} />}>
                            View Inspection Details
                        </Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="inspectionChecklist">
                        <ChecklistInspection />
                    </Tabs.Panel>
                    <Tabs.Panel value="technicalMeasurement">
                        <Card shadow="sm" radius="md" withBorder className="bg-white !mt-8">
                            <Measurement form={form} employee={employee} />
                        </Card>
                    </Tabs.Panel>
                    <Tabs.Panel value="employeeInterview">
                        <Interview form={form} employee={employee} />
                    </Tabs.Panel>
                    <Tabs.Panel value="viewInspectionDetails">
                        <DetailsInspection />
                    </Tabs.Panel>
                </Tabs>
            </Card >
            <div className='flex gap-2 justify-end'>
                <Button onClick={() => handleSave("IN_PROGRESS")} variant='outline'>Save Draft</Button>
                <Button onClick={() => handleSave("COMPLETED")} leftSection={<IconFileCheck />} variant='gradient'>Complete Inspection</Button>

            </div>
        </div >
    );
};

export default Inspection;
