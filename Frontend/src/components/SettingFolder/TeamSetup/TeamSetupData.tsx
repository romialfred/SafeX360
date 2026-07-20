import { Tooltip } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { activateIncidentTeam, deactivateIncidentTeam, getAllIncidentTeams } from "../../../services/TeamService";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { modals } from "@mantine/modals";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import ReferencePanel from '../../NewComponents/Parameters/ReferencePanel';

const TeamSetupData = () => {

    const navigate = useNavigate();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(showOverlay());
        getAllIncidentTeams().then((res) => {
            setTeams(res);
        }
        ).catch((_err) => { }
        ).finally(() => {
            dispatch(hideOverlay());
            setLoading(false);
        });
    }, []);

    const handleStatusChange = (rowData: any) => {
        const action = rowData.status === "ACTIVE" ? "deactivate" : "activate";
        const actionLabel = action === "activate" ? "activer" : "désactiver";
        const doneLabel = action === "activate" ? "activée" : "désactivée";

        modals.openConfirmModal({
            title: <span className='text-2xl'>Confirmer l'opération</span>,
            centered: true,
            children: (
                <span className="text-md">
                    Voulez-vous <strong>{actionLabel}</strong> l'équipe : <strong>{rowData.name}</strong> ?
                </span>
            ),
            labels: { confirm: `Oui, ${actionLabel}`, cancel: 'Annuler' },
            cancelProps: { color: 'red', variant: "filled" },
            confirmProps: { color: 'green', variant: "filled" },
            closeOnEscape: false,
            closeOnClickOutside: false,
            withCloseButton: false,
            onConfirm: () => {
                dispatch(showOverlay());
                const apiCall = action === "activate" ? activateIncidentTeam : deactivateIncidentTeam;
                apiCall(rowData.id)
                    .then(() => {
                        successNotification(`Équipe ${doneLabel} avec succès`);
                        const updatedData = teams.map(item =>
                            item.id === rowData.id
                                ? { ...item, status: action === "activate" ? "ACTIVE" : "INACTIVE" }
                                : item
                        );
                        setTeams(updatedData);
                    })
                    .catch(() => {
                        errorNotification(`Échec de l'opération : impossible de ${actionLabel} l'équipe`);
                    })
                    .finally(() => {
                        dispatch(hideOverlay());
                    });
            },
        });
    };

    return (
        <>
            <ReferencePanel<any>
                newLabel="Nouvelle équipe"
                onNew={() => navigate('/addTeam')}
                columns={[
                    { key: 'name', label: "Nom de l'équipe" },
                    { key: 'departmentName', label: 'Département' },
                ]}
                rows={teams}
                renderRow={(row) => ({
                    name: row.name,
                    departmentName: row.departmentName,
                })}
                getRowKey={(row, index) => row.id ?? index}
                searchText={(row) => `${row.name ?? ''} ${row.departmentName ?? ''} ${row.incidentCategory ?? ''} ${row.description ?? ''}`}
                searchPlaceholder="Rechercher une équipe…"
                loading={loading}
                emptyTitle="Aucune équipe d'intervention"
                emptyHint="Créez une première équipe pour organiser les investigations et les secours."
                statusOf={(row) => row.status}
                onToggleStatus={handleStatusChange}
                onEdit={(row) => navigate(`/team-setup/edit/${row.id}`)}
                rowActions={(row) => (
                    <Tooltip label="Voir le détail" withArrow openDelay={300}>
                        <button
                            type="button"
                            aria-label="Voir le détail"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/team-setup/details/${row.id}`);
                            }}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                            <IconEye size={15} stroke={1.7} />
                        </button>
                    </Tooltip>
                )}
            />
        </>
    )
}

export default TeamSetupData
