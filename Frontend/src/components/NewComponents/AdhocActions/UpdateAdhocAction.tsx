import { Button, NumberInput, Select } from "@mantine/core";
import {
    IconBolt,
    IconCalendarDue,
    IconClock,
    IconClipboardText,
    IconDeviceFloppy,
    IconHistory,
    IconPaperclip,
    IconUser,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../UtilityComp/PageHeader";
import FileDropzone from "../../UtilityComp/FileDropzone";
import { useForm } from "@mantine/form";
import { addActionProcess, getAllActionProcessByActionId } from "../../../services/ActionProcessService";
import { convertFileToBase64DTO } from "../../../utility/DocumentUtility";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { getActionById } from "../../../services/CorrectiveActionService";
import TextEditor from "../../UtilityComp/TextEditor";
import SafeHtml from "../../UtilityComp/SafeHtml";
import { isValidRichText } from "../../../utility/OtherUtilities";
import {
    ADHOC_STATUS_OPTIONS,
    adhocStatusConfig,
    formatDateFr,
    progressBarClass,
} from "./adhocLabels";

/**
 * Mise à jour de la progression d'une suggestion d'amélioration : rappel du
 * contexte, saisie de l'avancement avec pièces jointes, et historique des
 * mises à jour précédentes.
 */

const SectionCard = ({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) => (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-slate-100">
            <span className="inline-flex p-1.5 rounded-md bg-orange-50 text-orange-700">{icon}</span>
            <div>
                <h3
                    className="text-slate-800"
                    style={{
                        fontFamily: "'Source Serif 4', Georgia, serif",
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {title}
                </h3>
                <p className="text-[11.5px] text-slate-500">{subtitle}</p>
            </div>
        </div>
        <div className="flex flex-col gap-3">{children}</div>
    </section>
);

const UpdateAdhocAction = () => {
    const { id } = useParams();
    const [actionHistory, setActionHistory] = useState<any[]>([]);
    const [selectedRow, setSelectedRow] = useState<any>({});
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const form = useForm({
        initialValues: {
            status: '',
            description: '',
            progress: 0,
            docs: []
        },
        validate: {
            status: (value) => (value?.trim().length > 0 ? null : 'Le statut est obligatoire'),
            progress: (value) => (value === null || value === undefined ? 'La progression est obligatoire' : null),
            description: (value) => (isValidRichText(value) ? null : 'La description est obligatoire')
        }
    });

    // Valeurs initiales pour la logique de retour en arrière
    const [initialStatus, setInitialStatus] = useState<string>('');
    const [initialProgress, setInitialProgress] = useState<number>(0);

    // Valeurs précédentes pour détecter le sens du changement
    const prevProgressRef = useRef<number>(0);
    const prevStatusRef = useRef<string>('');

    // Synchronisation statut / progression dans l'interface
    useEffect(() => {
        const progress = Number(form.values.progress ?? 0);
        const status = String(form.values.status || '').toUpperCase();

        if (progress >= 100 && status !== 'COMPLETED') {
            form.setFieldValue('status', 'COMPLETED');
        }

        if (prevProgressRef.current === 100 && progress < 100 && initialStatus) {
            form.setFieldValue('status', initialStatus);
        }

        prevProgressRef.current = progress;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.values.progress, initialStatus]);

    useEffect(() => {
        const progress = Number(form.values.progress ?? 0);
        const status = String(form.values.status || '').toUpperCase();

        if (status === 'COMPLETED' && progress < 100) {
            form.setFieldValue('progress', 100);
        }

        if (prevStatusRef.current === 'COMPLETED' && status !== 'COMPLETED') {
            form.setFieldValue('progress', initialProgress);
        }

        prevStatusRef.current = status;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.values.status, initialProgress]);

    const statusUpper = String(selectedRow?.status || '').toUpperCase();
    const isCompleted = (selectedRow?.progress ?? 0) >= 100 || statusUpper === 'COMPLETED';
    const isCancelled = statusUpper === 'CANCELLED';
    const isPending = statusUpper === 'PENDING';
    const cannotUpdate = isCompleted || isCancelled || isPending;

    useEffect(() => {
        getActionById(id)
            .then((res) => {
                setSelectedRow(res);
                form.setValues({
                    status: res.status,
                    description: res.description,
                    progress: res.progress,
                    docs: Array.isArray(res.docs) ? res.docs : []
                });
                setInitialStatus(res.status || '');
                setInitialProgress(Number(res.progress ?? 0));
                prevStatusRef.current = String(res.status || '').toUpperCase();
                prevProgressRef.current = Number(res.progress ?? 0);
            }).catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "La suggestion n'a pas pu être chargée");
            });

        getAllActionProcessByActionId(id)
            .then((res) => setActionHistory(res))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "L'historique n'a pas pu être chargé");
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSubmit = async (values: any) => {
        dispatch(showOverlay());
        const docsInput = Array.isArray(values.docs) ? values.docs : [];
        const docs = await Promise.all(docsInput.map(convertFileToBase64DTO));

        // Cohérence statut / progression avant envoi
        const sanitizedValues = { ...values } as any;
        const numericProgress = Number(sanitizedValues.progress ?? 0);

        if (numericProgress >= 100) {
            sanitizedValues.progress = 100;
            sanitizedValues.status = 'COMPLETED';
        }

        if (String(sanitizedValues.status || '').toUpperCase() === 'COMPLETED') {
            sanitizedValues.progress = 100;
        }

        const payload = {
            ...sanitizedValues,
            correctiveActionId: id,
            docs: docs,
        };

        addActionProcess(payload)
            .then(() => {
                successNotification('Progression de la suggestion mise à jour');
                navigate("/adhoc-actions");
            })
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "L'enregistrement a échoué");
            })
            .finally(() => {
                dispatch(hideOverlay());
            });
    };

    const lastStatus = actionHistory?.length > 0 ? actionHistory[actionHistory.length - 1]?.status : selectedRow?.status;
    const statusOptions = ADHOC_STATUS_OPTIONS.slice(
        Math.max(ADHOC_STATUS_OPTIONS.findIndex((item) => item.value === lastStatus), 0)
    );

    const currentCfg = adhocStatusConfig(selectedRow?.status);
    const currentProgress = Number(selectedRow?.progress ?? 0);

    return (
        <div className="p-5 space-y-4 w-full">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Actions Correctives' },
                    { label: "Suggestions d'amélioration", to: '/adhoc-actions' },
                    { label: 'Mettre à jour la progression' },
                ]}
                icon={<IconBolt size={22} stroke={2} />}
                iconColor="orange"
                title="Mettre à jour la progression"
                subtitle="Consigner l'avancement de la suggestion et joindre les justificatifs utiles"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                {/* ─── Colonne principale : contexte + saisie ─────────────── */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <SectionCard
                        icon={<IconClipboardText size={15} stroke={1.8} />}
                        title="Rappel de la suggestion"
                        subtitle="Contexte actuel avant la mise à jour"
                    >
                        <div>
                            <p className="text-[13px] text-slate-800 leading-snug">{selectedRow?.actionName || '—'}</p>
                            {selectedRow?.incidentTitle && (
                                <p className="text-[11.5px] text-slate-500 mt-0.5">Source : {selectedRow.incidentTitle}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-md border border-slate-200 p-3">
                                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                                    <IconUser size={12} aria-hidden="true" /> Assignée à
                                </p>
                                <p className="text-[12.5px] text-slate-800">{selectedRow?.assignedEmployeeName || '—'}</p>
                            </div>
                            <div className="rounded-md border border-slate-200 p-3">
                                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                                    <IconCalendarDue size={12} aria-hidden="true" /> Échéance
                                </p>
                                <p className="text-[12.5px] text-slate-800">{selectedRow?.deadline ? formatDateFr(selectedRow.deadline) : '—'}</p>
                            </div>
                            <div className="rounded-md border border-slate-200 p-3">
                                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1">Statut actuel</p>
                                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${currentCfg.chip}`}>
                                    {currentCfg.label}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[11.5px] text-slate-500">Progression actuelle</span>
                                <span className="text-[11.5px] text-slate-800 tabular-nums">{currentProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={currentProgress} aria-valuemin={0} aria-valuemax={100}>
                                <div className={`h-full rounded-full ${progressBarClass(currentProgress)}`} style={{ width: `${currentProgress}%` }} />
                            </div>
                        </div>

                        {selectedRow?.description && (
                            <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
                                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 mb-1">Description</p>
                                <SafeHtml html={selectedRow?.description} className="text-slate-700 text-[12.5px]" />
                            </div>
                        )}
                    </SectionCard>

                    {cannotUpdate ? (
                        <div
                            className={`rounded-xl border p-4 text-[12.5px] ${isCompleted
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : isCancelled
                                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                                    : 'bg-violet-50 border-violet-200 text-violet-800'
                                }`}
                            role="status"
                        >
                            {isCompleted && 'Cette suggestion est déjà clôturée (100 % ou statut Terminée). Aucune mise à jour supplémentaire n\'est possible.'}
                            {isPending && "Cette suggestion est en attente d'approbation. Les mises à jour seront possibles après validation."}
                            {isCancelled && "Cette suggestion a été annulée. Aucune mise à jour supplémentaire n'est possible."}
                        </div>
                    ) : (
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <SectionCard
                                icon={<IconClock size={15} stroke={1.8} />}
                                title="Nouvelle mise à jour"
                                subtitle="Avancement, statut et détails de ce qui a été réalisé"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <NumberInput
                                        size="sm"
                                        disabled={cannotUpdate}
                                        {...form.getInputProps('progress')}
                                        label="Progression (%)"
                                        max={100}
                                        clampBehavior="blur"
                                        min={selectedRow.progress}
                                    />
                                    <Select
                                        size="sm"
                                        disabled={cannotUpdate}
                                        label="Statut"
                                        data={statusOptions}
                                        {...form.getInputProps('status')}
                                    />
                                </div>
                                <TextEditor form={form} id="description" title="Détail de la mise à jour" withAsterisk />
                                {!cannotUpdate && (
                                    <div>
                                        <p className="text-[12.5px] text-slate-700 mb-1.5 flex items-center gap-1">
                                            <IconPaperclip size={13} aria-hidden="true" /> Pièces jointes (photos, rapports)
                                        </p>
                                        <FileDropzone form={form} id="docs" />
                                    </div>
                                )}
                                <div className="flex justify-end gap-2 pt-1">
                                    <Button type="button" variant="default" size="sm" onClick={() => navigate('/adhoc-actions')}>
                                        Annuler
                                    </Button>
                                    <Button
                                        disabled={cannotUpdate}
                                        color="teal"
                                        size="sm"
                                        type="submit"
                                        leftSection={<IconDeviceFloppy size={15} />}
                                    >
                                        Enregistrer la mise à jour
                                    </Button>
                                </div>
                            </SectionCard>
                        </form>
                    )}
                </div>

                {/* ─── Historique des mises à jour ─────────────────────────── */}
                <aside className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <span className="inline-flex p-1.5 rounded-md bg-orange-50 text-orange-700">
                            <IconHistory size={15} stroke={1.8} />
                        </span>
                        <h3
                            className="text-slate-800"
                            style={{
                                fontFamily: "'Source Serif 4', Georgia, serif",
                                fontSize: '14px',
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Historique des mises à jour
                        </h3>
                    </div>

                    {actionHistory.length === 0 && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                            <h4 className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">Bonnes pratiques</h4>
                            <ul className="text-[11.5px] text-slate-600 space-y-1 list-disc list-inside">
                                <li>Mettre à jour la progression régulièrement</li>
                                <li>Mentionner les obstacles rencontrés</li>
                                <li>Joindre photos ou documents si nécessaire</li>
                                <li>Informer l'assigné des changements importants</li>
                            </ul>
                        </div>
                    )}

                    {actionHistory.slice().reverse().map((x: any, index: number, arr: any[]) => {
                        const previousProgress = index < arr.length - 1 ? arr[index + 1].progress : 0;
                        const progressMade = x.progress - previousProgress;
                        const cfg = adhocStatusConfig(x.status);
                        return (
                            <div key={index} className="rounded-lg border border-slate-200 p-3">
                                <div className="flex justify-between items-center gap-2">
                                    <p className="text-[11.5px] text-slate-500 flex gap-1 items-center">
                                        <IconClock size={12} aria-hidden="true" /> {formatDateFr(x.createdAt)}
                                    </p>
                                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${cfg.chip}`}>
                                        {cfg.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={x.progress} aria-valuemin={0} aria-valuemax={100}>
                                        <div className={`h-full rounded-full ${progressBarClass(x.progress)}`} style={{ width: `${x.progress}%` }} />
                                    </div>
                                    <span className="text-[11.5px] text-slate-600 tabular-nums">
                                        {previousProgress}% {progressMade > 0 ? `→ ${x.progress}%` : ''}
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <SafeHtml html={x.description || '—'} className="text-slate-600 text-[12px]" />
                                </div>
                            </div>
                        );
                    })}
                </aside>
            </div>
        </div>
    );
};

export default UpdateAdhocAction;
