import { Badge, Modal } from "@mantine/core";
import {
    IconAlertTriangle,
    IconBuilding,
    IconCategory,
    IconCloud,
    IconHeart,
    IconLeaf,
    IconListDetails,
    IconMapPin,
    IconProgressHelp,
    IconUserCheck,
    IconUsers,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getAllActiveIncidentCategories } from "../../../../services/IncidentCategory";
import { mapIdToName } from "../../../../utility/OtherUtilities";
import { getAllActiveIncidentType } from "../../../../services/IncidentTypeService";
import { getAllActiveLocations } from "../../../../services/LocationService";
import { getAllActiveSeverityLevel } from "../../../../services/SeverityLevelService";
import { getAllActiveWeatherConditions } from "../../../../services/WeatherService";
import { GetAllBodyParts } from "../../../../services/BodyPartsService";
import { Carousel } from "@mantine/carousel";
import { getBase64FileSize } from "../../../../utility/DocumentUtility";
import { useDisclosure } from "@mantine/hooks";
import { ppeRecord } from "../../../../Data/IncidentsData";
import { mantineColorToLevel } from "../../../../Data/DropdownData";
import { getAllActiveWorkArea } from "../../../../services/WorkAreaService";
import { getAllActiveWorkProcess } from "../../../../services/WorkProcessService";


const IncidentDetailsTab = ({
    incident,
    employees


}: any) => {
    const [locations, setLocations] = useState<Record<number, any>>([]);
    const [weatherConditions, setWeatherConditions] = useState<Record<number, any>>([]);
    const [categories, setCategories] = useState<Record<number, any>>([]);
    const [incidentTypes, setIncidentTypes] = useState<Record<number, any>>([]);
    const [severityLevels, setSeverityLevels] = useState<Record<number, any>>([]);
    const [bodyParts, setBodyParts] = useState<Record<number, any>>([]);
    const [workProcesses, setWorkProcesses] = useState<Record<number, any>>([]);
    const [workAreas, setWorkAreas] = useState<Record<number, any>>([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [startIndex, setStartIndex] = useState(0);



    const handlePreview = (index: number) => {
        setStartIndex(index);
        open();
    };


    useEffect(() => {
        getAllActiveIncidentCategories().then((res: any) => {
            setCategories(mapIdToName(res));
        }).catch((_err: any) => { });
        getAllActiveIncidentType().then((res: any) => {
            setIncidentTypes(mapIdToName(res));
        }).catch((_err: any) => { });
        getAllActiveLocations().then((res: any) => {
            setLocations(mapIdToName(res));
        }
        ).catch((_err: any) => { });
        getAllActiveSeverityLevel().then((res: any) => {
            setSeverityLevels(mapIdToName(res));
            console.log(res);
        }
        ).catch((_err: any) => { });
        getAllActiveWeatherConditions().then((res: any) => {
            setWeatherConditions(mapIdToName(res));
        }).catch((_err: any) => { });
        GetAllBodyParts({}).then((res: any) => {
            setBodyParts(mapIdToName(res));
        }
        ).catch((_err: any) => { });
        getAllActiveWorkArea().then((res: any) => {
            setWorkAreas(mapIdToName(res));
        }).catch((_err: any) => { });
        getAllActiveWorkProcess().then((res: any) => {
            setWorkProcesses(mapIdToName(res));
        }).catch((_err: any) => { });
    }, []);

    const isImage = (type: string) => type?.startsWith("data:image");
    const isPDF = (type: string) => type?.startsWith("data:application/pdf");

    return (
        <div className="flex flex-col gap-5 p-2">


            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-lg font-semibold text-gray-800">Incident Classification</h1>
                </div>
                <div className="grid grid-cols-3 gap-5">

                    {incident?.incidentDetails?.map((detail: any, index: number) => (
                        <div
                            key={index}
                            className="flex flex-col gap-4 border border-gray-300 rounded-xl p-5 bg-white shadow-sm"
                        >
                            {/* Category and Severity */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <IconCategory className="text-gray-500" size={20} />
                                    <span className="text-base font-medium text-gray-800">
                                        {categories[detail.incidentCategoryId]?.name}
                                    </span>
                                </div>
                                <Badge
                                    color={mantineColorToLevel[severityLevels[detail.severityLevelId]?.level]}
                                    size="xs"
                                    variant="outline"
                                    autoContrast
                                >
                                    {severityLevels[detail.severityLevelId]?.name}
                                </Badge>
                            </div>

                            {/* Type and Body Parts */}
                            <div className="space-y-3 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <IconAlertTriangle size={18} className="text-blue-600" />
                                    <span>
                                        <span className="font-semibold">Type:</span>{" "}
                                        {incidentTypes[detail.incidentTypeId]?.name}
                                    </span>
                                </div>

                                {incidentTypes[detail.incidentTypeId]?.name === "Injury/Illness" && (
                                    <div className="flex items-start gap-2">
                                        <IconHeart size={18} className="text-red-600 mt-0.5" />
                                        <div className="flex flex-wrap gap-2">
                                            {detail.affectedBodyParts?.length > 0 ? (
                                                detail.affectedBodyParts.map((x: any, i: number) => (
                                                    <span
                                                        key={i}
                                                        className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full"
                                                    >
                                                        {bodyParts[x]?.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-500 italic">None reported</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Environmental Info */}
                            {categories[detail.incidentCategoryId]?.name === "Environmental" && (
                                <div className="space-y-4 pt-2">
                                    {[
                                        {
                                            title: "Containment Measures",
                                            content: detail.containmentMeasures,
                                            icon: <IconListDetails size={18} className="text-green-600" />,
                                            color: "green",
                                        },
                                        {
                                            title: "Environmental Impact",
                                            content: detail.environmentalImpact,
                                            icon: <IconLeaf size={18} className="text-blue-600" />,
                                            color: "blue",
                                        },
                                    ].map(({ title, content, color, icon }) => (
                                        <div
                                            key={title}
                                            className={`bg-${color}-50 border-l-4 border-${color}-400 p-4 rounded-md`}
                                        >
                                            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                                                {icon}
                                                <h3 className={`text-${color}-700`}>{title}</h3>
                                            </div>
                                            <div
                                                className="text-gray-700 text-sm pl-1"
                                                dangerouslySetInnerHTML={{ __html: content }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {/* <div>
                <h4 className="text-2xl font-bold text-gray-800 mb-4">
                    Incident Description
                </h4>

                <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition">
                    <div
                        className="text-gray-700 text-base leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: incident.description }}
                    />
                </div>
            </div> */}

            <div className="">
                <h4 className="text-lg font-semibold mb-2">
                    PPE Status
                </h4>
                <div className='flex flex-wrap gap-4'>
                    {incident.ppe?.map((x: any, index: any) => <div key={index} className=" border border-green-200 rounded-lg p-2 bg-green-50 flex justify-between">
                        <p className='text-sm text-green-700'>{ppeRecord[x]}</p>
                        {/* <IconCircleCheck color='green' /> */}
                    </div>)}
                </div>



            </div>
            <div className="">
                <h4 className="text-lg font-semibold mb-2">
                    Location and Work Context
                </h4>
                <div className='flex flex-wrap gap-4'>

                    <div className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition flex gap-2 items-center p-2 " >
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-600 ">
                            <IconMapPin size={15} className=" text-indigo-500" />
                            Location:
                        </h4>
                        <p className="text-gray-800 text-sm font-medium">
                            {locations[incident.locationId]?.name || "N/A"}
                        </p>
                    </div >

                    <div className="border border-gray-200 rounded-xl p-2 shadow-sm hover:shadow-md transition flex gap-2 items-center" >
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-600 ">
                            <IconCloud size={15} className="text-sky-500" />
                            Environment :
                        </h4>
                        <p className="text-gray-800 text-sm font-medium">
                            {incident.weatherConditions?.map((x: any, index: any) => ((index != 0 ? ", " : "") + weatherConditions[x]?.name))}
                            {incident.weatherConditions?.length === 0 ? "N/A" : ""}
                        </p>
                    </div >

                    <div className="border border-gray-200 rounded-xl p-2 shadow-sm hover:shadow-md transition flex gap-2 items-center" >
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-600 ">
                            <IconBuilding size={15} className="text-red-500" />
                            Work Area :
                        </h4>
                        <p className="text-gray-800 text-sm font-medium">
                            {workAreas[incident.workAreaId]?.name || "N/A"}
                        </p>
                    </div >
                    <div className="border border-gray-200 rounded-xl p-2 shadow-sm hover:shadow-md transition flex gap-2 items-center" >
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-600 ">
                            <IconProgressHelp size={15} className="text-brown-500" />
                            Work Process :
                        </h4>
                        <p className="text-gray-800 text-sm font-medium">
                            {workProcesses[incident.workProcessId]?.name || "N/A"}
                        </p>
                    </div >
                </div>



            </div>

            <div className="grid grid-cols-1 gap-6">

                {/* Witnesses */}
                <div className="border border-gray-300 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition">
                    <h5 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <IconUserCheck size={18} className="text-blue-500" /> Witnesses
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {incident.witnesses?.map((id: any, index: number) => {
                            const emp = employees[id];
                            const initials = emp?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                            return (
                                <div key={index} className="flex items-center gap-4 p-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition duration-200 shadow-sm border border-blue-100">
                                    <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-medium text-xs">
                                        {initials || 'NA'}
                                    </div>
                                    <div>
                                        <p className="text-blue-600 font-semibold text-xs">{emp?.name || 'Unknown'}</p>
                                        <p className="text-gray-500 text-xs">{emp?.empNumber ? `ID: ${emp.empNumber}` : 'No ID available'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Participants */}
                <div className="border border-gray-300 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition">
                    <h5 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <IconUsers size={18} className="text-purple-500" /> Involved Persons
                    </h5>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {incident.involvedPersons?.map((id: any, index: number) => {
                            const emp = employees[id];
                            const initials = emp?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                            return (
                                <div key={index} className="flex items-center gap-4 p-2 rounded-xl bg-purple-50 hover:bg-purple-100 transition duration-200 shadow-sm border border-purple-100">
                                    <div className="w-7 h-7 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-medium text-xs">
                                        {initials || 'NA'}
                                    </div>
                                    <div>
                                        <p className="text-purple-600 font-semibold text-xs">{emp?.name || 'Unknown'}</p>
                                        <p className="text-gray-500 text-xs">{emp?.empNumber ? `ID: ${emp.empNumber}` : 'No ID available'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
            <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-800">Evidence & Attachments</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 border border-gray-300 rounded-xl p-6 bg-gray-50">
                    {incident?.evidence?.map((item: any, index: number) => (
                        <div
                            key={index}
                            className="flex gap-4 bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition duration-200 cursor-pointer"
                            onClick={() => handlePreview(index)}
                        >
                            {isImage(item.type) ? (
                                <img
                                    src={`${item.type},${item.file}`}
                                    alt={item.name}
                                    className="w-20 h-20 object-cover rounded-md border"
                                />
                            ) : isPDF(item.type) ? (
                                <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-md border text-red-600 font-bold text-xs text-center px-1">
                                    PDF
                                </div>
                            ) : (
                                <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-md border text-gray-600 font-bold text-xs text-center px-1">
                                    File
                                </div>
                            )}

                            <div className="flex flex-col justify-center overflow-x-hidden">
                                <p className="text-sm font-semibold line-clamp-1 text-gray-800">{item.name}</p>
                                <p className="text-sm text-gray-500">{getBase64FileSize(item.file)} KB</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal
                opened={opened}
                onClose={close}
                size="xl"
                title="Evidence Preview"
                centered
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 3,
                }}
            >
                <Carousel
                    className="[&_.mantine-Carousel-control]:!bg-primary [&_.mantine-Carousel-control]:!text-white"
                    classNames={{
                        indicator:
                            "mantine-Carousel-indicator bg-white opacity-80 data-[active=true]:!bg-primary transition",
                    }}
                    initialSlide={startIndex}
                    withIndicators
                    controlSize={40}
                    height={500}
                    loop
                >
                    {incident?.evidence?.map((item: any, index: number) => (
                        <Carousel.Slide key={index}>
                            <div className="w-full h-full flex items-center justify-center">
                                {isImage(item.type) ? (
                                    <img
                                        src={`${item.type},${item.file}`}
                                        alt={item.name}
                                        className="max-w-full max-h-[75vh] object-contain rounded-md"
                                    />
                                ) : isPDF(item.type) ? (
                                    <iframe
                                        title={item.name}
                                        src={`${item.type},${item.file}`}
                                        className="w-full h-[75vh] border rounded-md"
                                    />
                                ) : (
                                    <p className="text-gray-700">Unsupported file format</p>
                                )}
                            </div>
                        </Carousel.Slide>
                    ))}
                </Carousel>
            </Modal>


        </div>
    )
}

export default IncidentDetailsTab