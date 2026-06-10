import { LoadingOverlay } from "@mantine/core";
import {
    IconBulb,
    IconCalendar,
    IconClock,
    IconFile,
    IconMessageCircle,
    IconPaperclip,
    IconUser,
} from "@tabler/icons-react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    getRecommendationById,
    getRecommendationFollowups,
} from "../../../services/AuditService";
import { formatDate } from "../../../utility/DateFormats";
import SafeHtml from "../../UtilityComp/SafeHtml";
import PageHeader from "../../UtilityComp/PageHeader";
import { recStatusLabel } from "./auditLabels";

const RecommendationDetails = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [recommendation, setRecommendation] = useState<any>(null);
    const [followups, setFollowups] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        Promise.all([
            getRecommendationById(id),
            getRecommendationFollowups(id),
        ])
            .then(([rec, followup]) => {
                setRecommendation(rec);
                setFollowups(followup);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div className="relative">
            <LoadingOverlay visible={loading} />
            {!loading && recommendation && (
                <div className="p-5 space-y-5 w-full">
                    <PageHeader
                        breadcrumbs={[
                            { label: 'Accueil', to: '/' },
                            { label: 'Suivi des recommandations', to: '/audit-recommendations' },
                            { label: 'Détail de la recommandation' },
                        ]}
                        icon={<IconBulb size={22} stroke={2} />}
                        iconColor="indigo"
                        title="Détail de la recommandation"
                        subtitle="Description, suivis et pièces jointes de la recommandation d'audit"
                    />

                    <div className="bg-white rounded-2xl border-slate-200 border shadow-sm p-6 flex flex-col gap-5">
                        {/* Title, Status, Created Date */}
                        <div className="flex flex-col">
                            <div className="flex justify-between">
                                <h2 className="text-lg text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                                    {recommendation.title || "—"}
                                </h2>
                                <div className="bg-amber-100 rounded-4xl p-2">
                                    <p className="flex text-amber-700 gap-1 items-center text-sm">
                                        <IconClock size={16} />
                                        {recStatusLabel(recommendation.status)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <p className="flex items-center text-gray-500 gap-1 text-sm">
                                    <IconCalendar color="gray" size={16} />
                                    Créée le : {formatDate(recommendation.createdAt)}
                                </p>
                                <p className="flex items-center text-gray-500 gap-1 text-sm">
                                    <IconCalendar size={16} />
                                    Mise à jour le : {formatDate(recommendation.updatedAt)}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <p className="text-sm text-gray-600">Description</p>
                            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                                {recommendation.description ? (
                                    /* LOT 41 P0 XSS fix */
                                    <SafeHtml html={recommendation.description} />
                                ) : (
                                    <p className="text-gray-400 italic">Aucune description renseignée.</p>
                                )}
                            </div>
                        </div>

                        {/* Followups */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-base text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Historique des suivis</h3>
                            {followups.length > 0 ? (
                                followups.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-col bg-gray-50 rounded-xl p-4 shadow-sm gap-5 border border-gray-300"
                                    >
                                        <div className="flex justify-between">
                                            <div className="flex gap-4 items-center">
                                                <div className="bg-white rounded-4xl p-2 w-fit shadow-sm">
                                                    <p className="flex items-center gap-2 text-gray-800 text-sm">
                                                        <IconUser color="blue" size={16} />
                                                        {item.updatedBy || "—"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        {formatDate(item.followupDate)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-amber-100 rounded-4xl p-2">
                                                <p className="flex text-amber-700 gap-1 items-center text-sm">
                                                    <IconClock size={16} />
                                                    {recStatusLabel(item.status)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Comment */}
                                        {item.comment && (
                                            <div className="flex gap-1 bg-gray-50 rounded-xl p-2 shadow-sm">
                                                <IconMessageCircle color="blue" />
                                                <div className="flex flex-col gap-1 text-sm text-gray-600 w-1/2">
                                                    {/* LOT 41 P0 XSS fix */}
                                                    <SafeHtml html={item.comment} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Attachment */}
                                        {item.attachmentName && (
                                            <div>
                                                <div className="flex gap-1">
                                                    <IconPaperclip color="blue" />
                                                    <p className="text-gray-500 text-sm">
                                                        Pièces jointes
                                                    </p>
                                                </div>
                                                <div className="bg-white border border-gray-300 rounded-xl p-2 w-fit shadow-sm">
                                                    <p className="flex items-center gap-2 text-gray-500 text-sm">
                                                        <IconFile color="blue" size={16} />
                                                        {item.attachmentName}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 italic">Aucun suivi enregistré pour cette recommandation.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendationDetails;
