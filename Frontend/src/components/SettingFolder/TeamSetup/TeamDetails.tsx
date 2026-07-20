import { Avatar, Breadcrumbs, Divider, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getIncidentTeamDetails } from "../../../services/TeamService";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";


interface TeamMember {
    id: number;
    name: string;
    code: string;
    initials: string;
    color: string;
    isTeamLead: boolean;
    notifications: number[];
}

interface TeamDetailsType {
    department: string;
    teamName: string;
    members: TeamMember[];
}

const TeamDetails = () => {
    const { id } = useParams();
    const [teamDetails, setTeamDetails] = useState<TeamDetailsType | null>(null);
    const dispatch = useDispatch();


    const getColorById = (id: number) => {
        const colors = [
            "bg-pink-500",
            "bg-green-500",
            "bg-orange-500",
            "bg-red-500",
            "bg-blue-500",
            "bg-purple-500",
        ];
        return colors[id % colors.length];
    };

    useEffect(() => {
        if (id) {
            dispatch(showOverlay());
            getIncidentTeamDetails(id)
                .then((response) => {
                    console.log(response)
                    const formatted: TeamDetailsType = {
                        department: response.departmentName,
                        teamName: response.teamName,
                        members: response.members.map((member: any) => ({
                            id: member.id,
                            name: member.employeeName,
                            code: `RG${String(member.employeeId).padStart(4, "0")}`,
                            initials: (() => {
                                const parts = member.employeeName.trim().split(" ");
                                if (parts.length >= 2) {
                                    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                                } else {
                                    return member.employeeName.slice(0, 2).toUpperCase();
                                }
                            })(),
                            color: getColorById(member.id),
                            isTeamLead: member.role === "TEAM_LEAD",
                            notifications: member.notificationLevel,
                        })),


                    };
                    setTeamDetails(formatted);
                })
                .catch((error) => {
                    console.error("Error fetching team details:", error);
                })
                .finally(() => {
                    dispatch(hideOverlay());
                });


        }
    }, [id]);

    if (!teamDetails)
        return;

    return (
        <div className="flex flex-col gap-10">

            <div className="flex justify-between items-center">
                <div>
                    {/* LOT 40 P1: title color blue-500 -> slate-900 */}
                    <div className="text-2xl font-semibold text-slate-900 bg-gradient-to-r from-primary to-secondary bg-clip-text">
                        Détail de l'équipe
                    </div>
                    <Breadcrumbs mt="xs">
                        {/* LOT 40 P1: breadcrumb variant=gradient -> c=dimmed / c=teal fw=500 */}
                        <Link to="/">
                            <Text c="dimmed" className="hover:underline cursor-pointer">
                                Accueil
                            </Text>
                        </Link>
                        <Link to="/team-setup">
                            <Text c="dimmed" className="hover:underline cursor-pointer">
                                Équipes d'intervention
                            </Text>
                        </Link>
                        <Text c="teal" fw={500}>Détail de l'équipe</Text>
                    </Breadcrumbs>
                </div>
            </div>


            <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-300 flex flex-col gap-5">
                <div className="flex justify-between">
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-600 text-lg">Département : </span>
                        <span className="text-blue-600">{teamDetails.department}</span>
                    </div>
                    <div>
                        <span className="text-gray-600 text-lg">Nom de l'équipe : </span>
                        <span className="text-blue-600">{teamDetails.teamName}</span>
                    </div>
                </div>


                <h2 className="text-lg text-gray-800">Membres de l'équipe</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-100 p-4 rounded-xl shadow-sm border border-gray-300">
                    {teamDetails.members.map((member) => (
                        <div
                            key={member.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative"
                        >
                            {member.isTeamLead && (
                                <div className="absolute -top-0 -left-2 bg-blue-600 text-white text-[11px] px-2 py-[2px] rounded-md shadow-md z-10">
                                    Chef d'équipe
                                </div>
                            )}

                            <div className="flex items-center mb-4 ">

                                <Avatar color="white"
                                    className={` flex items-center justify-center  !rounded-full mr-3 ${member.color}`}
                                >
                                    {member.initials}
                                </Avatar>

                                <div>
                                    <p className="text-gray-700">{member.name}</p>
                                    <p className="text-sm text-gray-500">{member.code}</p>
                                </div>
                            </div>
                            <Divider />
                            <div className="flex flex-col gap-4">
                                <p className="text-lg mt-2 text-gray-700">
                                    Notifications par niveau d'incident :
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <span
                                            key={level}
                                            className={`px-4 py-2 text-md rounded-full cursor-pointer ${member.notifications.includes(level)
                                                ? "bg-blue-500 border text-white hover:bg-white hover:text-blue-500 hover:border-blue"
                                                : "bg-gray-200 text-gray-700 border-gray-200 border hover:bg-white hover:text-gray-600 hover:border-gray-300"
                                                }`}
                                        >
                                            Niveau {level}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeamDetails;
