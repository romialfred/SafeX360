import { Card, Text, Divider, Anchor, Breadcrumbs } from '@mantine/core';
import { IconCalculator, IconCalendar, IconClock, IconFileText } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAreasDetailsByAuditId, getAuditDetails, getAuditorsByAuditId } from '../../../services/AuditService';
import { formatDateWithDay } from '../../../utility/DateFormats';
import { capitalizeFirstLetter } from '../../../utility/OtherUtilities';
import { useDispatch } from 'react-redux';
import { hideOverlay, showOverlay } from '../../../slices/OverlaySlice';
import SafeHtml from '../../UtilityComp/SafeHtml';

const ViewDetailsAudit = () => {
    const { id } = useParams();
    const [audit, setAudit] = useState<any>({});
    const [auditors, setAuditors] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(showOverlay());
        getAuditDetails(id).then((res) => {
            setAudit(res);
        }).catch((_err) => { }).finally(() => {
            dispatch(hideOverlay());
        });
        getAuditorsByAuditId(id).then((res) => {
            setAuditors(res);
        }).catch((_err) => { })
        getAreasDetailsByAuditId(id).then((res) => {
            setAreas(res);
            // setAreas(res);
        }).catch((_err) => { })
    }, [])

    const EmpCard = ({ emp }: any) => {
        const initials = emp?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

        return (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition duration-200 shadow-sm border border-purple-100">
                <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 text-lg">
                    {initials || 'NA'}
                </div>
                <div>
                    <p className="text-purple-600 text-lg">{emp?.name || 'Unknown'}</p>
                    <p className="text-gray-500 text-sm">{emp?.role ? ` ${emp.role}` : 'No role available'}</p>
                    {emp?.email && <p className="text-gray-500 text-sm">{emp?.email}</p>}

                </div>
            </div>
        );
    }


    return (
        <div>

            <div className="flex justify-between items-center">
                <div>
                    <div className="text-2xl text-blue-500 w-fit">Audit Details</div>
                    <Breadcrumbs mt="xs" mb="lg">
                        <Link className="hover:!underline" to="/">
                            <Text variant="gradient">Home</Text>
                        </Link>
                        <Link className="hover:!underline" to="/audit-management">
                            <Text variant="gradient">Audit Management</Text>
                        </Link>
                        <Text variant="gradient">Audit Details</Text>
                    </Breadcrumbs>
                </div>
            </div>


            <Card withBorder shadow="md" radius="md" p="lg">
                <div className='flex justify-between items-center '>
                    <div className='flex flex-col gap-4'>
                        <h1 className='text-2xl'>{audit.title}</h1>
                        <div className='flex gap-4'>
                            <Text className='flex gap-1 items-center'><IconCalendar size={20} /> {formatDateWithDay(audit.startDate)} - {formatDateWithDay(audit.endDate)}</Text>
                            <Text className='flex gap-1 items-center'><IconCalculator size={20} /> {capitalizeFirstLetter(audit.category)} Audit</Text>
                        </div>
                    </div>

                    <div className=' bg-amber-400 p-2 rounded-4xl '>
                        <p className='text-amber-800 flex gap-2 items-center'><IconClock /> {capitalizeFirstLetter(audit.status)}</p>
                    </div>
                </div>




                <Divider my="sm" />
                <div className='flex flex-col gap-4'>
                    <p className='text-lg'>Purpose & Objectives</p>
                    <div className='bg-gray-100 p-3 rounded-lg shadow-sm'>
                        {/* LOT 41 P0 XSS fix */}
                        <SafeHtml html={audit.purpose} />

                    </div>
                </div>
                <div className='mt-5 '>
                    <p className="mb-2  text-xl">Audit Types</p>
                    <div className="flex gap-2 mt-1">
                        {audit.types?.map((x: any, index: any) => <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-lg">{x}</span>)}
                        {/* <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-lg">Environmental</span> */}
                    </div>
                </div>


                <div>
                    <p className='text-lg mt-5 mb-2'>Audit Team {audit.category == "EXTERNAL" && auditors.length > 0 && <span className='text-primary text-base'>({auditors.length > 0 && auditors[0].company})</span>}</p>
                    <div className="grid grid-cols-4 gap-5">
                        {auditors?.map((emp: any, index: number) => {
                            return <EmpCard key={index} emp={emp} />
                        })}

                    </div>

                </div>
                <div className='mt-5'>
                    <p className="text-xl mb-4"> Committee Member</p>
                    <div className="grid grid-cols-4 gap-5">
                        {audit.members?.map((emp: any, index: number) => {
                            return <EmpCard key={index} emp={emp} />
                        })}

                    </div>
                </div>
                <div className='mt-5'>
                    <p className="text-xl mb-4">Audit Areas</p>
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                        {areas.map((item) => (
                            <div
                                key={item.id}
                                className="border rounded-2xl shadow-md p-4 bg-white hover:shadow-lg transition"
                            >
                                <h3 className="text-lg text-gray-800 mb-1">
                                    📍 Area: <span className="font-normal">{item.areaName}</span>
                                </h3>
                                <p className="text-gray-600">
                                    🔎 Purpose: <span className="font-medium">{item.purpose}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='p-4'>
                    <p className='text-lg'>Documents</p>
                    <div className='bg-gray-100 p-4 rounded-lg shadow-sm w-[400px] flex gap-4 items-center'>
                        <IconFileText size={25} color='gray' />
                        <Anchor href="#" size="xl" underline="always">
                            Audit Plan.pdf
                        </Anchor>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default ViewDetailsAudit