import { Badge, Button, Tooltip } from "@mantine/core";
import { formatDateShort } from "../../../utility/DateFormats";
import { useNavigate } from "react-router-dom";
import { auditStatusMap } from "../../../Data/DropdownData";
import { IconEdit, IconEye, IconLock } from "@tabler/icons-react";
import { auditCategoryLabel, auditStatusColor, translateAuditTerm } from "./auditLabels";


const AuditCard = ({ incidentData, auditAreaMap }: any) => {
    const navigate = useNavigate();

    // §2.2 — un plan approuvé (ou un audit clos, dont le rapport est signé) est une
    // preuve figée : sa replanification passe par un nouvel acte d'approbation, pas
    // par une réécriture rétroactive du périmètre / des dates / de l'équipe.
    // Le serveur refuse (AUDIT_ALREADY_APPROVED) ; la carte l'annonce plutôt que
    // d'offrir un bouton qui échouera. Jamais de bouton mort sans explication.
    const isPlanApproved = String(incidentData.planningStatus ?? '').toUpperCase() === 'APPROVED';
    const isClosed = String(incidentData.status ?? '').toUpperCase() === 'CLOSED';
    const editLocked = isPlanApproved || isClosed;
    const lockReason = isClosed
        ? "Audit clôturé : le rapport est signé, la planification n'est plus modifiable."
        : "Plan approuvé : la planification n'est plus modifiable. Pour la changer, replanifiez l'audit.";

    return (
        <div className="rounded-xl border border-slate-200 shadow-sm p-4 bg-white flex flex-col gap-3 transition-[box-shadow,border-color] duration-200 hover:shadow-md hover:border-slate-300">
            <div className="flex gap-4 items-center justify-between">

                <span className="text-xs bg-indigo-50 text-indigo-800 px-2 py-1 rounded-lg">
                    {auditCategoryLabel(incidentData.category)}
                </span>
                <span className="text-xs bg-violet-50 text-violet-800 px-2 py-1 rounded-lg">
                    {auditAreaMap[incidentData.scopeId]?.name}
                </span>
                <Badge
                    color={auditStatusColor(incidentData.status)}
                    size="sm"
                    variant="light"
                    className="rounded-full whitespace-nowrap"
                >
                    {auditStatusMap[incidentData.status ?? ""] ?? incidentData.status}
                </Badge>
            </div>

            <div className="text-[13px] text-slate-800">{incidentData.title}</div>

            <div className="text-slate-500 text-xs">
                Début : {formatDateShort(incidentData.startDate)}
            </div>
            <div className="text-slate-500 text-xs">
                Types : {Object.keys(incidentData.auditTypes ?? {}).map((t) => translateAuditTerm(t)).join(", ") || '—'}
            </div>

            <div className="flex justify-center grow gap-4">
                {editLocked ? (
                    <Tooltip label={lockReason} withArrow multiline w={240}>
                        <Button
                            size="compact-xs"
                            leftSection={<IconLock size={15} />}
                            color="gray"
                            variant="subtle"
                            data-disabled
                            onClick={(e) => e.preventDefault()}
                            aria-disabled
                        >
                            Verrouillé
                        </Button>
                    </Tooltip>
                ) : (
                    <Button
                        size="compact-xs"
                        leftSection={<IconEdit size={15} />}
                        color="primary"
                        variant="subtle"
                        onClick={() => navigate(`edit-schedule/${incidentData.id}`)}
                    >
                        Modifier
                    </Button>
                )}
                <Button
                    size="compact-xs"
                    leftSection={<IconEye size={15} />}
                    color="indigo"
                    variant="subtle"
                    onClick={() => navigate(`details/${incidentData.id}`)}
                >
                    Consulter
                </Button>
            </div>
        </div>
    )
}

export default AuditCard
