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
        <div className="flex flex-col gap-4">
            {/* === Section 1 — Classification de l'incident === */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-red-50/60 border-b border-red-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-red-100">
                        <IconCategory size={14} className="text-red-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Classification de l'incident
                    </h2>
                    <span className="ml-auto text-[10px] text-slate-500">
                        {incident?.incidentDetails?.length || 0} classification{(incident?.incidentDetails?.length || 0) > 1 ? 's' : ''}
                    </span>
                </header>
                <div className="p-4">
                    {(!incident?.incidentDetails || incident.incidentDetails.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">Aucune classification renseignée pour cet incident.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {incident.incidentDetails.map((detail: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex flex-col gap-2 border border-slate-200 rounded-md p-3 bg-slate-50/40 hover:bg-white hover:shadow-sm transition-all"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <IconCategory className="text-slate-500" size={14} />
                                            <span className="text-xs text-slate-800">
                                                {categories[detail.incidentCategoryId]?.name || '—'}
                                            </span>
                                        </div>
                                        <Badge
                                            color={mantineColorToLevel[severityLevels[detail.severityLevelId]?.level]}
                                            size="xs"
                                            variant="filled"
                                            radius="sm"
                                        >
                                            {severityLevels[detail.severityLevelId]?.name || '—'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                        <IconAlertTriangle size={13} className="text-blue-600 flex-shrink-0" />
                                        <span className="text-slate-600">Type :</span>
                                        <span className="text-slate-800 truncate">{incidentTypes[detail.incidentTypeId]?.name || '—'}</span>
                                    </div>

                                    {incidentTypes[detail.incidentTypeId]?.name === "Injury/Illness" && (
                                        <div className="flex items-start gap-1.5 pt-1 border-t border-slate-200">
                                            <IconHeart size={13} className="text-red-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex flex-wrap gap-1">
                                                {detail.affectedBodyParts?.length > 0 ? (
                                                    detail.affectedBodyParts.map((x: any, i: number) => (
                                                        <span
                                                            key={i}
                                                            className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded"
                                                        >
                                                            {bodyParts[x]?.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 italic text-[11px]">Aucune partie du corps signalée</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {categories[detail.incidentCategoryId]?.name === "Environmental" && (
                                        <div className="space-y-2 pt-2 border-t border-slate-200">
                                            {[
                                                { title: "Mesures de confinement", content: detail.containmentMeasures, icon: <IconListDetails size={13} />, color: "text-green-700 bg-green-50 border-green-200" },
                                                { title: "Impact environnemental", content: detail.environmentalImpact, icon: <IconLeaf size={13} />, color: "text-blue-700 bg-blue-50 border-blue-200" },
                                            ].map(({ title, content, color, icon }) => (
                                                content && (
                                                    <div key={title} className={`border-l-2 pl-2 py-1 ${color}`}>
                                                        <div className="flex items-center gap-1 mb-0.5 text-[10px] uppercase tracking-wider">
                                                            {icon}
                                                            <span>{title}</span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-700 leading-snug" dangerouslySetInnerHTML={{ __html: content }} />
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* === Section 2 — Équipements de protection individuelle === */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-yellow-50/60 border-b border-yellow-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-yellow-100">
                        <IconAlertTriangle size={14} className="text-yellow-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Équipements de protection individuelle (EPI)
                    </h2>
                    <span className="ml-auto text-[10px] text-slate-500">
                        {incident.ppe?.length || 0} EPI signalé{(incident.ppe?.length || 0) > 1 ? 's' : ''}
                    </span>
                </header>
                <div className="p-4">
                    {(!incident.ppe || incident.ppe.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">Aucun EPI renseigné.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {incident.ppe.map((x: any, index: any) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
                                    {ppeRecord[x] || x}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* === Section 3 — Lieu et contexte de travail === */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-blue-50/60 border-b border-blue-200/70 flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-100">
                        <IconMapPin size={14} className="text-blue-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">
                        Lieu et contexte de travail
                    </h2>
                </header>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-slate-50/60 border border-slate-200 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                            <IconMapPin size={12} className="text-indigo-600" />
                            Lieu
                        </div>
                        <p className="text-sm text-slate-800">
                            {locations[incident.locationId]?.name || <span className="text-slate-400 italic">Non renseigné</span>}
                        </p>
                    </div>
                    <div className="bg-slate-50/60 border border-slate-200 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                            <IconCloud size={12} className="text-sky-600" />
                            Conditions environnementales
                        </div>
                        <p className="text-sm text-slate-800">
                            {incident.weatherConditions?.length > 0
                                ? incident.weatherConditions.map((x: any, index: any) => (index != 0 ? ", " : "") + (weatherConditions[x]?.name || ''))
                                : <span className="text-slate-400 italic">Non renseignées</span>}
                        </p>
                    </div>
                    <div className="bg-slate-50/60 border border-slate-200 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                            <IconBuilding size={12} className="text-red-600" />
                            Zone de travail
                        </div>
                        <p className="text-sm text-slate-800">
                            {workAreas[incident.workAreaId]?.name || <span className="text-slate-400 italic">Non renseignée</span>}
                        </p>
                    </div>
                    <div className="bg-slate-50/60 border border-slate-200 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                            <IconProgressHelp size={12} className="text-amber-700" />
                            Processus de travail
                        </div>
                        <p className="text-sm text-slate-800">
                            {workProcesses[incident.workProcessId]?.name || <span className="text-slate-400 italic">Non renseigné</span>}
                        </p>
                    </div>
                </div>
            </section>

            {/* === Section 4 — Témoins et personnes impliquées === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 bg-cyan-50/60 border-b border-cyan-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-cyan-100">
                            <IconUserCheck size={14} className="text-cyan-700" />
                        </div>
                        <h2 className="text-xs text-slate-800 uppercase tracking-wider">Témoins</h2>
                        <span className="ml-auto text-[10px] text-slate-500">
                            {incident.witnesses?.length || 0}
                        </span>
                    </header>
                    <div className="p-4">
                        {(!incident.witnesses || incident.witnesses.length === 0) ? (
                            <p className="text-xs text-slate-400 italic">Aucun témoin identifié.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {incident.witnesses.map((id: any, index: number) => {
                                    const emp = employees[id];
                                    const initials = emp?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                                    return (
                                        <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-cyan-50/40 border border-cyan-100">
                                            <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-800 text-[10px] flex-shrink-0">
                                                {initials || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-800 truncate">{emp?.name || 'Inconnu'}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{emp?.empNumber ? `Matricule ${emp.empNumber}` : 'Identifiant inconnu'}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <header className="px-4 py-2.5 bg-violet-50/60 border-b border-violet-200/70 flex items-center gap-2">
                        <div className="p-1 rounded bg-violet-100">
                            <IconUsers size={14} className="text-violet-700" />
                        </div>
                        <h2 className="text-xs text-slate-800 uppercase tracking-wider">Personnes impliquées</h2>
                        <span className="ml-auto text-[10px] text-slate-500">
                            {incident.involvedPersons?.length || 0}
                        </span>
                    </header>
                    <div className="p-4">
                        {(!incident.involvedPersons || incident.involvedPersons.length === 0) ? (
                            <p className="text-xs text-slate-400 italic">Aucune personne impliquée identifiée.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {incident.involvedPersons.map((id: any, index: number) => {
                                    const emp = employees[id];
                                    const initials = emp?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                                    return (
                                        <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-violet-50/40 border border-violet-100">
                                            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-800 text-[10px] flex-shrink-0">
                                                {initials || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-800 truncate">{emp?.name || 'Inconnu'}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{emp?.empNumber ? `Matricule ${emp.empNumber}` : 'Identifiant inconnu'}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* === Section 5 — Preuves et pièces jointes === */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <header className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <div className="p-1 rounded bg-slate-200">
                        <IconListDetails size={14} className="text-slate-700" />
                    </div>
                    <h2 className="text-xs text-slate-800 uppercase tracking-wider">Preuves et pièces jointes</h2>
                    <span className="ml-auto text-[10px] text-slate-500">
                        {incident?.evidence?.length || 0} pièce{(incident?.evidence?.length || 0) > 1 ? 's' : ''}
                    </span>
                </header>
                <div className="p-4">
                    {(!incident?.evidence || incident.evidence.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">Aucune pièce jointe.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {incident.evidence.map((item: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex gap-2 bg-slate-50/40 border border-slate-200 p-2 rounded-md hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
                                    onClick={() => handlePreview(index)}
                                >
                                    {isImage(item.type) ? (
                                        <img src={`${item.type},${item.file}`} alt={item.name} className="w-14 h-14 object-cover rounded border border-slate-200" />
                                    ) : isPDF(item.type) ? (
                                        <div className="w-14 h-14 flex items-center justify-center bg-red-50 rounded border border-red-200 text-red-700 text-[10px]">PDF</div>
                                    ) : (
                                        <div className="w-14 h-14 flex items-center justify-center bg-slate-100 rounded border border-slate-200 text-slate-600 text-[10px]">Fichier</div>
                                    )}
                                    <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
                                        <p className="text-xs text-slate-800 line-clamp-2">{item.name}</p>
                                        <p className="text-[10px] text-slate-500">{getBase64FileSize(item.file)} ko</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Modal
                opened={opened}
                onClose={close}
                size="xl"
                title="Aperçu de la pièce jointe"
                centered
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            >
                <Carousel
                    className="[&_.mantine-Carousel-control]:!bg-primary [&_.mantine-Carousel-control]:!text-white"
                    classNames={{
                        indicator: "mantine-Carousel-indicator bg-white opacity-80 data-[active=true]:!bg-primary transition",
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
                                    <img src={`${item.type},${item.file}`} alt={item.name} className="max-w-full max-h-[75vh] object-contain rounded-md" />
                                ) : isPDF(item.type) ? (
                                    <iframe title={item.name} src={`${item.type},${item.file}`} className="w-full h-[75vh] border rounded-md" />
                                ) : (
                                    <p className="text-slate-700">Format de fichier non supporté</p>
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