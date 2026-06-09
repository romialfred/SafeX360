import { useEffect, useState } from "react";
import { Button } from "@mantine/core";
import { IconFileDescription, IconFileSearch } from "@tabler/icons-react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import PageHeader from "../../UtilityComp/PageHeader";
import { getDocumentById } from "../../../services/ComplianceDocumentService";
import { getMedia } from "../../../services/MediaService";
import { openPDF } from "../../../utility/DocumentUtility";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification } from "../../../utility/NotificationUtility";
import { docStatusConfig, formatDateFr } from "../complianceLabels";

/** Détail d'un document de conformité (LOT 49). */
const DetailDocument = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [document, setDocument] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(showOverlay());
        getDocumentById(id)
            .then((res) => setDocument(res))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Le document n'a pas pu être chargé");
            })
            .finally(() => {
                setLoading(false);
                dispatch(hideOverlay());
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleOpenDocument = () => {
        dispatch(showOverlay());
        getMedia(document.docId)
            .then((res) => openPDF(res.file))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "Le document n'a pas pu être ouvert");
            })
            .finally(() => dispatch(hideOverlay()));
    };

    const rawStatus = (document.status ?? '').toString().toUpperCase();
    const expiry = document.expiryDate ? new Date(document.expiryDate) : null;
    const isExpired = rawStatus === 'VALID' && expiry && !Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now();
    const statusCfg = docStatusConfig(isExpired ? 'EXPIRED' : rawStatus);

    const rows: Array<{ label: string; value: React.ReactNode }> = [
        { label: 'Fichier', value: document.docName || '—' },
        { label: 'Exigence couverte', value: document.requirement || '—' },
        { label: 'Déposé par', value: document.uploadedBy || '—' },
        { label: 'Déposé le', value: formatDateFr(document.uploadDate) },
        { label: "Date d'expiration", value: formatDateFr(document.expiryDate) },
        {
            label: 'Statut',
            value: (
                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${statusCfg.chip}`}>
                    {statusCfg.label}
                </span>
            ),
        },
    ];

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Conformité Réglementaire' },
                    { label: 'Documents', to: '/compliance-documents' },
                    { label: 'Détail du document' },
                ]}
                icon={<IconFileDescription size={22} stroke={2} />}
                iconColor="teal"
                title={loading ? 'Détail du document' : document.docName || 'Détail du document'}
                subtitle="Justificatif de conformité déposé par un employé"
                actions={
                    <Button
                        size="xs"
                        variant="light"
                        color="teal"
                        leftSection={<IconFileSearch size={14} />}
                        onClick={handleOpenDocument}
                        disabled={!document.docId}
                    >
                        Ouvrir le document
                    </Button>
                }
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
                <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
                    <h3
                        className="text-slate-800 mb-3 pb-3 border-b border-slate-100"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: '14.5px',
                            fontWeight: 600,
                        }}
                    >
                        Informations du document
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        {rows.map((row) => (
                            <div key={row.label} className="py-1.5 border-b border-slate-50">
                                <dt className="text-[11px] uppercase tracking-wider text-slate-500">{row.label}</dt>
                                <dd className="text-[13px] text-slate-800 mt-1">{row.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {document.comment && (
                    <div className="bg-white rounded-xl border border-rose-200 p-4">
                        <h3
                            className="text-rose-700 mb-2"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: '14px',
                                fontWeight: 600,
                            }}
                        >
                            Motif du rejet
                        </h3>
                        <p className="text-[12.5px] text-slate-700 leading-relaxed">{document.comment}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailDocument;
