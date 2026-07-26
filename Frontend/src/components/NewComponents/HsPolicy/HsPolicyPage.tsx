import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActionIcon, Badge, Button, Collapse, FileButton, Group, Loader, Modal, Progress, Stack, Text,
    Textarea, TextInput, Timeline,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
    IconArrowDown, IconArrowLeft, IconArrowUp, IconBriefcase, IconBuildingFactory2, IconBulb,
    IconCalendarStats, IconCertificate, IconChartBar, IconCheck, IconChevronDown, IconClipboardCheck,
    IconDownload, IconEdit, IconEye, IconFileText, IconFileTypePdf, IconHistory, IconLayoutDashboard,
    IconPaperclip, IconPlus, IconShieldCheck, IconSparkles, IconTrash, IconUsers, IconWriting,
} from '@tabler/icons-react';

import { EXAMPLE_POLICY } from './examplePolicy';
import SafeXLogoColor from '../../UtilityComp/SafeXLogoColor';

import {
    acknowledge as ackPolicy, getAcknowledgements, getAcknowledgementStats, getPolicy, getPublished,
    listPolicies, publish as publishPolicy, saveDraft,
    type HsPolicy, type HsPolicyArticle, type HsPolicyAcknowledgement,
} from '../../../services/HsPolicyService';
import { getEmployeesWithDepartment } from '../../../services/EmployeeService';
import { useAppSelector } from '../../../slices/hooks';
import { usePermissions } from '../../../hooks/usePermissions';
import { isHsPolicyManager } from '../../../utility/hsPolicyRbac';
import { errorNotification, successNotification } from '../../../utility/NotificationUtility';
import { notifyError } from '../../../utility/notifyError';
import SignaturePad from './SignaturePad';

/* Date locale 'yyyy-MM-dd' (jamais toISOString : décale d'un jour selon le fuseau). */
const toIsoDateLocal = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/* Format lisible d'une date/heure ISO. */
const fmt = (v?: string | null): string => {
    if (!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};
const fmtDateTime = (v?: string | null): string => {
    if (!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

// ════════════════════════════════════════════════════════════════════════════
// LECTURE — présentation moderne du document, article par article
// ════════════════════════════════════════════════════════════════════════════

function ArticleCard({ article, index }: { article: HsPolicyArticle; index: number }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex gap-4 p-4">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 font-bold flex items-center justify-center tabular-nums">
                    {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                    {article.title && <p className="font-semibold text-slate-800 text-[15px]">{article.title}</p>}
                    {article.body && <p className="text-[14px] text-slate-600 leading-relaxed mt-1 whitespace-pre-line">{article.body}</p>}
                    {article.explanation && (
                        <>
                            <button type="button" onClick={() => setOpen((o) => !o)}
                                className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-teal-700 hover:text-teal-800">
                                <IconChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                                Comprendre cet engagement
                            </button>
                            <Collapse in={open}>
                                <div className="mt-2 rounded-lg bg-teal-50/60 border border-teal-100 p-3">
                                    <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">{article.explanation}</p>
                                </div>
                            </Collapse>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function PolicyReader({
    policy, mineName, canAcknowledge, onAcknowledge, acking, userName, onBack,
}: {
    policy: HsPolicy;
    mineName: string;
    canAcknowledge: boolean;
    onAcknowledge: () => void;
    acking: boolean;
    userName: string;
    onBack?: () => void;
}) {
    return (
        <div className="max-w-4xl mx-auto">
            {onBack && (
                <button type="button" onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-800 mb-3 transition-colors">
                    <IconArrowLeft size={15} /> Retour au tableau de bord
                </button>
            )}

            {/* DOCUMENT — feuille unique façon PDF : en-tête (logo + référence),
                titre, corps et signature dans une même page officielle. */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#12294A 0%,#1E7F76 100%)' }} />

                {/* Papier à en-tête : logo à gauche, référence à droite, filet de séparation */}
                <div className="px-8 sm:px-10 pt-7">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <SafeXLogoColor variant="full" tone="dark" size={34} />
                        <div className="text-right">
                            <p className="text-[10.5px] uppercase tracking-[0.12em] text-slate-400 font-semibold">Document officiel</p>
                            <p className="text-[13px] font-semibold text-slate-600 tabular-nums">Réf. POL-SST · v{policy.version ?? '—'}</p>
                        </div>
                    </div>

                    <div className="mt-5 border-t border-slate-200 pt-5">
                        <div className="flex items-center gap-1.5 text-teal-700 text-[11.5px] font-semibold uppercase tracking-[0.14em]">
                            <IconShieldCheck size={14} /> {mineName}
                        </div>
                        <h1 className="text-[27px] sm:text-[33px] font-bold mt-2 leading-[1.12]"
                            style={{ color: '#12294A', fontFamily: 'Georgia,"Times New Roman",serif' }}>
                            {policy.title || 'Politique Santé & Sécurité au Travail'}
                        </h1>
                        <Group gap="xs" mt="sm">
                            <Badge color="teal" variant="light">Version {policy.version ?? '—'}</Badge>
                            <Badge color="gray" variant="light">En vigueur depuis le {fmt(policy.effectiveDate)}</Badge>
                            <Badge color="blue" variant="light" leftSection={<IconCertificate size={12} />}>ISO 45001 §5.2</Badge>
                        </Group>
                    </div>
                </div>

                {/* Préambule */}
                {policy.preamble && (
                    <div className="px-8 sm:px-10 py-6">
                        <p className="text-[15.5px] text-slate-700 leading-relaxed whitespace-pre-line border-l-2 border-slate-200 pl-4">
                            {policy.preamble}
                        </p>
                    </div>
                )}

                {/* Articles — dans le corps du document */}
                <div className="px-8 sm:px-10 pb-2">
                    <Stack gap="sm">
                        {(policy.articles ?? []).map((a, i) => <ArticleCard key={a.id ?? i} article={a} index={i} />)}
                    </Stack>
                </div>

                {/* Signature de la direction — pied du document */}
                <div className="px-8 sm:px-10 pt-4 pb-8 mt-4 border-t border-slate-200 bg-gradient-to-br from-white to-slate-50">
                    <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.1em' }} mt="md">Engagement de la direction</Text>
                    <div className="flex items-end justify-between flex-wrap gap-4 mt-3">
                        <div>
                            {policy.signatureImage
                                ? <img src={policy.signatureImage} alt="Signature" style={{ height: 64, maxWidth: 240, objectFit: 'contain' }} />
                                : <p className="text-2xl text-slate-800" style={{ fontFamily: "'Segoe Script','Brush Script MT',cursive" }}>{policy.signatoryName}</p>}
                            <div className="mt-1">
                                <p className="font-semibold text-slate-800">{policy.signatoryName}</p>
                                <p className="text-[13px] text-slate-500">{policy.signatoryTitle || 'Direction'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge color="teal" variant="filled" leftSection={<IconCertificate size={12} />}>Signée</Badge>
                            <p className="text-[12px] text-slate-500 mt-1">le {fmtDateTime(policy.signedAt)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document PDF officiel joint */}
            {policy.attachmentData && (
                <a href={policy.attachmentData} download={policy.attachmentName || 'politique-sst.pdf'}
                    className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:border-teal-300 transition-colors no-underline">
                    <Group gap="sm">
                        <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                            <IconFileTypePdf size={22} />
                        </div>
                        <div>
                            <Text size="sm" fw={600} className="text-slate-800">{policy.attachmentName || 'Document PDF'}</Text>
                            <Text size="xs" c="dimmed">Version officielle jointe — cliquez pour télécharger</Text>
                        </div>
                    </Group>
                    <IconDownload size={20} className="text-slate-400" />
                </a>
            )}

            {/* Prise de connaissance (§5.4) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 mt-6 mb-10">
                {policy.acknowledged ? (
                    <Group gap="sm">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                            <IconCheck size={18} />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 text-[14px]">Vous avez pris connaissance de cette politique</p>
                            <p className="text-[12.5px] text-slate-500">le {fmtDateTime(policy.acknowledgedAt)}</p>
                        </div>
                    </Group>
                ) : (
                    <div>
                        <p className="font-semibold text-slate-800 text-[15px]">Prise de connaissance</p>
                        <p className="text-[13.5px] text-slate-600 mt-1 leading-relaxed">
                            En confirmant, <strong>{userName || 'vous'}</strong> atteste avoir lu et compris cette
                            politique et s'engage à la respecter. Cette prise de connaissance est horodatée et nominative.
                        </p>
                        <Button mt="md" color="teal" leftSection={<IconWriting size={16} />}
                            loading={acking} disabled={!canAcknowledge} onClick={onAcknowledge}>
                            J'ai lu et je m'engage à respecter cette politique
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// GESTION — éditeur de brouillon + publication/signature + statistiques
// ════════════════════════════════════════════════════════════════════════════

const emptyArticle = (): HsPolicyArticle => ({ title: '', body: '', explanation: '' });

function PolicyEditor({
    initial, userName, onSaved, onPublished,
}: {
    initial: HsPolicy | null;
    userName: string;
    onSaved: () => void;
    onPublished: () => void;
}) {
    const [draft, setDraft] = useState<HsPolicy>(() => initial ?? {
        title: 'Politique Santé & Sécurité au Travail',
        preamble: '',
        effectiveDate: toIsoDateLocal(new Date()),
        articles: [emptyArticle()],
        status: 'DRAFT',
    });
    const [saving, setSaving] = useState(false);
    const [publishOpen, setPublishOpen] = useState(false);
    const [signatoryName, setSignatoryName] = useState(userName || '');
    const [signatoryTitle, setSignatoryTitle] = useState('');
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const [publishing, setPublishing] = useState(false);

    const setArticle = (i: number, patch: Partial<HsPolicyArticle>) =>
        setDraft((d) => ({ ...d, articles: (d.articles ?? []).map((a, idx) => idx === i ? { ...a, ...patch } : a) }));
    const addArticle = () => setDraft((d) => ({ ...d, articles: [...(d.articles ?? []), emptyArticle()] }));
    const removeArticle = (i: number) => setDraft((d) => ({ ...d, articles: (d.articles ?? []).filter((_, idx) => idx !== i) }));
    const move = (i: number, dir: -1 | 1) => setDraft((d) => {
        const list = [...(d.articles ?? [])];
        const j = i + dir;
        if (j < 0 || j >= list.length) return d;
        [list[i], list[j]] = [list[j], list[i]];
        return { ...d, articles: list };
    });

    // Charge l'exemple ISO 45001 §5.2 dans le brouillon, en conservant l'id et la
    // date déjà saisis — c'est un point de départ à adapter, pas un écrasement total.
    const loadExample = () => setDraft((d) => ({
        ...d,
        title: EXAMPLE_POLICY.title,
        preamble: EXAMPLE_POLICY.preamble,
        articles: (EXAMPLE_POLICY.articles ?? []).map((a) => ({ ...a })),
    }));

    // PDF joint : lu en data-URL base64 (persisté en base, comme les autres pièces).
    // Garde-fou de taille : un PDF de politique reste léger ; au-delà on refuse
    // plutôt que d'engorger la base et la file hors ligne.
    const MAX_PDF_MB = 8;
    const attachPdf = (file: File | null) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            errorNotification('Seuls les fichiers PDF sont acceptés.');
            return;
        }
        if (file.size > MAX_PDF_MB * 1024 * 1024) {
            errorNotification(`Le PDF dépasse ${MAX_PDF_MB} Mo. Choisissez un fichier plus léger.`);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setDraft((d) => ({
            ...d, attachmentName: file.name, attachmentData: String(reader.result ?? ''),
        }));
        reader.readAsDataURL(file);
    };
    const removePdf = () => setDraft((d) => ({ ...d, attachmentName: null, attachmentData: null }));

    const save = async (): Promise<HsPolicy | null> => {
        setSaving(true);
        try {
            const saved = await saveDraft(draft);
            setDraft(saved);
            successNotification('Brouillon enregistré.');
            onSaved();
            return saved;
        } catch (e) {
            notifyError(e, "Le brouillon n'a pas pu être enregistré.");
            return null;
        } finally {
            setSaving(false);
        }
    };

    const openPublish = async () => {
        // Le serveur publie une politique EXISTANTE : on s'assure d'abord qu'elle
        // est enregistrée (un brouillon jamais sauvegardé n'a pas encore d'id).
        const saved = draft.id ? draft : await save();
        if (!saved?.id) return;
        if (!draft.id) setDraft((d) => ({ ...d, id: saved.id }));
        setPublishOpen(true);
    };

    const doPublish = async () => {
        if (!draft.id) return;
        if (!signatoryName.trim()) {
            errorNotification('Indiquez le nom du signataire (direction).');
            return;
        }
        setPublishing(true);
        try {
            // On sauvegarde les dernières modifications avant de figer.
            await saveDraft(draft);
            await publishPolicy(draft.id, {
                signatoryName: signatoryName.trim(),
                signatoryTitle: signatoryTitle.trim() || undefined,
                signatureImage: signatureImage || undefined,
            });
            successNotification('Politique signée et publiée. Elle est désormais visible de tous.');
            setPublishOpen(false);
            onPublished();
        } catch (e) {
            notifyError(e, "La publication a échoué.");
        } finally {
            setPublishing(false);
        }
    };

    const articles = draft.articles ?? [];

    return (
        <div className="max-w-4xl mx-auto">
            {/* Aide au démarrage : un exemple conforme §5.2 à adapter. */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <IconBulb size={18} className="text-teal-600" />
                    <div>
                        <Text size="sm" fw={600} className="text-slate-800">Besoin d'un point de départ ?</Text>
                        <Text size="xs" c="dimmed">Chargez un exemple de politique conforme ISO 45001 §5.2, puis adaptez-le à votre site.</Text>
                    </div>
                </div>
                <Button size="compact-sm" variant="light" color="teal" leftSection={<IconSparkles size={14} />} onClick={loadExample}>
                    Charger un exemple
                </Button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
                <TextInput label="Titre de la politique" value={draft.title ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.currentTarget.value }))} />
                <Textarea label="Préambule (déclaration d'intention de la direction)" autosize minRows={3} mt="sm"
                    value={draft.preamble ?? ''} onChange={(e) => setDraft((d) => ({ ...d, preamble: e.currentTarget.value }))} />
                <DateInput label="Date de prise d'effet" valueFormat="DD/MM/YYYY" mt="sm"
                    value={draft.effectiveDate ? new Date(draft.effectiveDate) : null}
                    onChange={(v) => setDraft((d) => ({ ...d, effectiveDate: v ? toIsoDateLocal(v as Date) : null }))} />

                {/* PDF officiel joint (facultatif) */}
                <Text size="sm" fw={500} mt="md" mb={4}>Document PDF joint (facultatif)</Text>
                {draft.attachmentData ? (
                    <Group justify="space-between" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <Group gap="xs">
                            <IconFileTypePdf size={20} className="text-rose-600" />
                            <Text size="sm" style={{ wordBreak: 'break-all' }}>{draft.attachmentName || 'document.pdf'}</Text>
                        </Group>
                        <ActionIcon variant="subtle" color="red" onClick={removePdf} aria-label="Retirer le PDF"><IconTrash size={16} /></ActionIcon>
                    </Group>
                ) : (
                    <FileButton onChange={attachPdf} accept="application/pdf">
                        {(props) => (
                            <Button {...props} variant="default" leftSection={<IconPaperclip size={16} />}>
                                Joindre un PDF
                            </Button>
                        )}
                    </FileButton>
                )}
            </div>

            <Group justify="space-between" mt="lg" mb="xs">
                <Text fw={600}>Engagements ({articles.length})</Text>
                <Button size="compact-sm" variant="light" leftSection={<IconPlus size={14} />} onClick={addArticle}>
                    Ajouter un engagement
                </Button>
            </Group>

            <Stack gap="sm">
                {articles.map((a, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                        <Group justify="space-between" mb="xs">
                            <Badge variant="light" color="teal">Engagement {i + 1}</Badge>
                            <Group gap={4}>
                                <ActionIcon variant="subtle" size="sm" disabled={i === 0} onClick={() => move(i, -1)}><IconArrowUp size={15} /></ActionIcon>
                                <ActionIcon variant="subtle" size="sm" disabled={i === articles.length - 1} onClick={() => move(i, 1)}><IconArrowDown size={15} /></ActionIcon>
                                <ActionIcon variant="subtle" color="red" size="sm" disabled={articles.length <= 1} onClick={() => removeArticle(i)}><IconTrash size={15} /></ActionIcon>
                            </Group>
                        </Group>
                        <TextInput placeholder="Titre de l'engagement" value={a.title ?? ''} onChange={(e) => setArticle(i, { title: e.currentTarget.value })} />
                        <Textarea placeholder="Texte de l'engagement" autosize minRows={2} mt="xs" value={a.body ?? ''} onChange={(e) => setArticle(i, { body: e.currentTarget.value })} />
                        <Textarea placeholder="Explication — ce que cela veut dire concrètement (facultatif, aide à la compréhension §5.4)"
                            autosize minRows={2} mt="xs" value={a.explanation ?? ''} onChange={(e) => setArticle(i, { explanation: e.currentTarget.value })} />
                    </div>
                ))}
            </Stack>

            <Group mt="lg">
                <Button variant="default" loading={saving} onClick={save}>Enregistrer le brouillon</Button>
                <Button color="teal" leftSection={<IconCertificate size={16} />} onClick={openPublish}>Signer et publier</Button>
            </Group>

            <Modal opened={publishOpen} onClose={() => setPublishOpen(false)} title="Signer et publier la politique" centered size="lg">
                <Text size="sm" c="dimmed" mb="md">
                    En publiant, cette politique devient la version en vigueur, visible de tous les travailleurs,
                    et l'ancienne version est archivée. Une politique publiée n'est plus modifiable.
                </Text>
                <TextInput label="Nom du signataire (direction)" required value={signatoryName} onChange={(e) => setSignatoryName(e.currentTarget.value)} />
                <TextInput label="Fonction" placeholder="Directeur Général, Directeur de site…" mt="sm" value={signatoryTitle} onChange={(e) => setSignatoryTitle(e.currentTarget.value)} />
                <Text size="sm" fw={500} mt="md" mb={4}>Signature manuscrite (facultative)</Text>
                <SignaturePad onChange={setSignatureImage} />
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={() => setPublishOpen(false)}>Annuler</Button>
                    <Button color="teal" loading={publishing} leftSection={<IconCertificate size={16} />} onClick={doPublish}>
                        Signer et publier
                    </Button>
                </Group>
            </Modal>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// TABLEAU DE BORD — adhésion à la politique (§5.4)
// ════════════════════════════════════════════════════════════════════════════

type Emp = { id: number; name?: string; department?: string; position?: string };

function StatCard({ label, value, sub, tint, icon }: {
    label: string; value: React.ReactNode; sub?: string; tint: string; icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex-1 min-w-[150px]">
            <div className="flex items-center justify-between">
                <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.08em' }}>{label}</Text>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${tint}1a`, color: tint }}>{icon}</div>
            </div>
            <Text fw={800} className="tabular-nums mt-1" style={{ fontSize: 28, color: '#12294A' }}>{value}</Text>
            {sub && <Text size="xs" c="dimmed">{sub}</Text>}
        </div>
    );
}

function BreakdownPanel({ title, icon, rows }: {
    title: string; icon: React.ReactNode; rows: { key: string; total: number; signed: number }[];
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex-1 min-w-[280px]">
            <Group gap={8} mb="sm">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">{icon}</div>
                <Text fw={600} className="text-slate-800">{title}</Text>
            </Group>
            {rows.length === 0 ? (
                <Text size="sm" c="dimmed">Aucune donnée.</Text>
            ) : (
                <Stack gap={10}>
                    {rows.map((r) => {
                        const pct = r.total ? Math.round((r.signed / r.total) * 100) : 0;
                        return (
                            <div key={r.key}>
                                <div className="flex items-center justify-between mb-1">
                                    <Text size="sm" className="text-slate-700" style={{ maxWidth: '65%' }} truncate>{r.key}</Text>
                                    <Text size="xs" c="dimmed" className="tabular-nums">{r.signed}/{r.total} · {pct}%</Text>
                                </div>
                                <Progress value={pct} size="sm" radius="xl"
                                    color={pct >= 80 ? 'teal' : pct >= 50 ? 'yellow' : 'red'} />
                            </div>
                        );
                    })}
                </Stack>
            )}
        </div>
    );
}

function PolicyDashboard({ policy, onRead }: { policy: HsPolicy; onRead: () => void }) {
    const [roster, setRoster] = useState<Emp[]>([]);
    const [acks, setAcks] = useState<HsPolicyAcknowledgement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getEmployeesWithDepartment().catch(() => []),
            policy.id ? getAcknowledgements(policy.id).catch(() => []) : Promise.resolve([]),
        ]).then(([emps, a]) => {
            if (cancelled) return;
            setRoster(Array.isArray(emps) ? emps.map((e: any) => ({
                id: e.id, name: e.name, department: e.department, position: e.position,
            })) : []);
            setAcks(Array.isArray(a) ? a : []);
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [policy.id]);

    const s = useMemo(() => {
        const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const ackedIds = new Set(acks.map((a) => a.empId).filter((v): v is number => v != null));
        const total = roster.length;
        const signed = roster.filter((e) => ackedIds.has(e.id)).length;
        const rate = total ? Math.round((signed / total) * 100) : 0;
        const now = new Date();
        const thisMonth = acks.filter((a) => a.acknowledgedAt && ym(new Date(a.acknowledgedAt)) === ym(now)).length;
        const group = (keyOf: (e: Emp) => string) => {
            const m = new Map<string, { total: number; signed: number }>();
            roster.forEach((e) => {
                const k = keyOf(e) || '—';
                const cur = m.get(k) || { total: 0, signed: 0 };
                cur.total++; if (ackedIds.has(e.id)) cur.signed++;
                m.set(k, cur);
            });
            return Array.from(m.entries()).map(([key, v]) => ({ key, ...v })).sort((a, b) => b.total - a.total);
        };
        const byDept = group((e) => e.department || '—');
        const byPos = group((e) => e.position || '—');
        const months: { key: string; label: string; count: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ key: ym(d), label: d.toLocaleDateString('fr-FR', { month: 'short' }), count: 0 });
        }
        const idx = new Map(months.map((mo, i) => [mo.key, i] as const));
        acks.forEach((a) => {
            if (!a.acknowledgedAt) return;
            const i = idx.get(ym(new Date(a.acknowledgedAt)));
            if (i != null) months[i].count++;
        });
        const maxMonth = Math.max(1, ...months.map((mo) => mo.count));
        return { total, signed, rate, thisMonth, byDept, byPos, months, maxMonth, totalSignatures: acks.length };
    }, [roster, acks]);

    const recent = useMemo(
        () => [...acks].sort((a, b) => (b.acknowledgedAt || '').localeCompare(a.acknowledgedAt || '')).slice(0, 8),
        [acks],
    );

    return (
        <div className="max-w-6xl mx-auto">
            {/* Bandeau : titre + accès lecture */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-4"
                style={{ background: 'linear-gradient(135deg,#12294A 0%,#0B1E3A 100%)' }}>
                <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <Text className="text-white" fw={700} style={{ fontSize: 19 }}>Adhésion à la politique SST</Text>
                        <Text className="text-white/70" size="sm">
                            {policy.title || 'Politique Santé & Sécurité au Travail'} · Version {policy.version ?? '—'} · §5.4 consultation des travailleurs
                        </Text>
                    </div>
                    <Button size="md" color="teal" leftSection={<IconFileText size={18} />} onClick={onRead}>
                        Lire la politique
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader color="teal" /></div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="flex flex-wrap gap-3">
                        <StatCard label="Effectif" value={s.total} sub="employés de la mine" tint="#12294A" icon={<IconUsers size={16} />} />
                        <StatCard label="Ont signé" value={s.signed} sub={`${s.rate}% de l'effectif`} tint="#0F766E" icon={<IconCheck size={16} />} />
                        <StatCard label="Ce mois-ci" value={s.thisMonth} sub="prises de connaissance" tint="#B26B00" icon={<IconCalendarStats size={16} />} />
                        <StatCard label="Signatures" value={s.totalSignatures} sub="au total, horodatées" tint="#2563EB" icon={<IconWriting size={16} />} />
                    </div>

                    {/* Taux global */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 mt-3">
                        <div className="flex items-center justify-between mb-2">
                            <Text fw={600} className="text-slate-800">Taux d'adhésion global</Text>
                            <Text fw={800} style={{ fontSize: 22, color: '#0F766E' }} className="tabular-nums">{s.rate}%</Text>
                        </div>
                        <Progress value={s.rate} size="lg" radius="xl" color={s.rate >= 80 ? 'teal' : s.rate >= 50 ? 'yellow' : 'red'} />
                        <Text size="xs" c="dimmed" mt={6}>{s.signed} sur {s.total} employés ont pris connaissance et signé la politique en vigueur.</Text>
                    </div>

                    {/* Répartitions */}
                    <div className="flex flex-wrap gap-3 mt-3">
                        <BreakdownPanel title="Par département" icon={<IconBuildingFactory2 size={15} />} rows={s.byDept} />
                        <BreakdownPanel title="Par poste" icon={<IconBriefcase size={15} />} rows={s.byPos} />
                    </div>

                    {/* Par mois + récents */}
                    <div className="flex flex-wrap gap-3 mt-3 mb-10">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex-1 min-w-[300px]">
                            <Group gap={8} mb="md">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><IconChartBar size={15} /></div>
                                <Text fw={600} className="text-slate-800">Signatures par mois</Text>
                            </Group>
                            <div className="flex items-end gap-3" style={{ height: 130 }}>
                                {s.months.map((mo) => (
                                    <div key={mo.key} className="flex-1 flex flex-col items-center justify-end gap-1">
                                        <Text size="xs" c="dimmed" className="tabular-nums">{mo.count}</Text>
                                        <div className="w-full rounded-t-md" style={{
                                            height: `${Math.round((mo.count / s.maxMonth) * 96) + 4}px`,
                                            background: 'linear-gradient(180deg,#1E7F76,#0F766E)',
                                        }} />
                                        <Text size="xs" c="dimmed" className="capitalize">{mo.label}</Text>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex-1 min-w-[300px]">
                            <Group gap={8} mb="sm">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><IconClipboardCheck size={15} /></div>
                                <Text fw={600} className="text-slate-800">Dernières prises de connaissance</Text>
                            </Group>
                            {recent.length === 0 ? (
                                <Text size="sm" c="dimmed">Aucune signature pour l'instant.</Text>
                            ) : (
                                <Stack gap={8}>
                                    {recent.map((r) => (
                                        <div key={r.id} className="flex items-center justify-between">
                                            <Group gap={8}>
                                                <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                                                    <IconCheck size={14} />
                                                </div>
                                                <Text size="sm" className="text-slate-700">{r.name || `Employé #${r.empId ?? '—'}`}</Text>
                                            </Group>
                                            <Text size="xs" c="dimmed">{fmtDateTime(r.acknowledgedAt)}</Text>
                                        </div>
                                    ))}
                                </Stack>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function HsPolicyPage() {
    const perms = usePermissions();
    const user = useAppSelector((s: any) => s.user);
    const selectedCompanyId = useAppSelector((s: any) => s.companySelection?.selectedCompanyId ?? null);
    const canManage = perms.isAdmin || isHsPolicyManager(perms.role);
    const userName = user?.name || user?.fullName || user?.login || '';
    const mineName = user?.companyName || user?.mineName || 'Votre mine';

    const [published, setPublished] = useState<HsPolicy | null>(null);
    const [loading, setLoading] = useState(true);
    const [acking, setAcking] = useState(false);
    const [mode, setMode] = useState<'dashboard' | 'read' | 'manage'>('dashboard');

    // Gestion
    const [versions, setVersions] = useState<HsPolicy[]>([]);
    const [editing, setEditing] = useState<HsPolicy | null>(null);
    const [ackCount, setAckCount] = useState<number | null>(null);

    const loadPublished = useCallback(async () => {
        setLoading(true);
        try {
            setPublished(await getPublished());
        } catch (e) {
            notifyError(e, "Impossible de charger la politique.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadPublished(); }, [loadPublished, selectedCompanyId]);

    const loadManagement = useCallback(async () => {
        if (!canManage) return;
        try {
            const list = await listPolicies();
            setVersions(list);
            const draft = list.find((p) => p.status === 'DRAFT');
            setEditing(draft ? await getPolicy(draft.id as number) : null);
            const pub = list.find((p) => p.status === 'PUBLISHED');
            if (pub?.id) {
                const stats = await getAcknowledgementStats(pub.id);
                setAckCount(stats.acknowledged);
            } else {
                setAckCount(null);
            }
        } catch (e) {
            notifyError(e, "Impossible de charger la gestion des politiques.");
        }
    }, [canManage]);

    useEffect(() => { if (mode === 'manage') loadManagement(); }, [mode, loadManagement]);

    const onAcknowledge = async () => {
        if (!published?.id) return;
        setAcking(true);
        try {
            setPublished(await ackPolicy(published.id, userName));
            successNotification('Prise de connaissance enregistrée. Merci.');
        } catch (e) {
            notifyError(e, "La prise de connaissance a échoué.");
        } finally {
            setAcking(false);
        }
    };

    const startNewDraft = async (cloneFrom?: HsPolicy) => {
        // Réviser = créer un NOUVEAU brouillon (le publié est figé). On peut partir
        // du contenu de la version en vigueur pour ne pas tout ressaisir.
        setEditing({
            title: cloneFrom?.title || 'Politique Santé & Sécurité au Travail',
            preamble: cloneFrom?.preamble || '',
            effectiveDate: toIsoDateLocal(new Date()),
            status: 'DRAFT',
            articles: cloneFrom?.articles?.length
                ? cloneFrom.articles.map((a) => ({ title: a.title, body: a.body, explanation: a.explanation }))
                : [{ title: '', body: '', explanation: '' }],
        });
    };

    if (loading) {
        return <div className="flex justify-center py-24"><Loader color="teal" /></div>;
    }

    return (
        <div className="p-4 sm:p-6 w-full">
            <Group justify="space-between" mb="lg" wrap="wrap">
                <Group gap="sm">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                        <IconFileText size={22} />
                    </div>
                    <div>
                        <Text fw={700} size="lg">Politique SST</Text>
                        <Text size="xs" c="dimmed">ISO 45001 §5.2 — engagement de la direction · §5.4 — consultation des travailleurs</Text>
                    </div>
                </Group>
                <Button.Group>
                    <Button variant={mode === 'dashboard' ? 'filled' : 'default'} color="teal"
                        leftSection={<IconLayoutDashboard size={16} />} onClick={() => setMode('dashboard')}>Tableau de bord</Button>
                    <Button variant={mode === 'read' ? 'filled' : 'default'} color="teal"
                        leftSection={<IconEye size={16} />} onClick={() => setMode('read')}>Lecture</Button>
                    {canManage && (
                        <Button variant={mode === 'manage' ? 'filled' : 'default'} color="teal"
                            leftSection={<IconEdit size={16} />} onClick={() => setMode('manage')}>Gérer</Button>
                    )}
                </Button.Group>
            </Group>

            {mode === 'dashboard' && (
                published ? (
                    <PolicyDashboard policy={published} onRead={() => setMode('read')} />
                ) : (
                    <div className="max-w-2xl mx-auto text-center py-16">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                            <IconFileText size={28} />
                        </div>
                        <Text fw={600} c="dimmed">Aucune politique SST n'est en vigueur pour cette mine.</Text>
                        {canManage && (
                            <Button mt="md" color="teal" leftSection={<IconEdit size={16} />}
                                onClick={() => { setMode('manage'); }}>Rédiger la politique</Button>
                        )}
                    </div>
                )
            )}

            {mode === 'read' && (
                published ? (
                    <PolicyReader policy={published} mineName={mineName} canAcknowledge={!!published.id}
                        onAcknowledge={onAcknowledge} acking={acking} userName={userName}
                        onBack={() => setMode('dashboard')} />
                ) : (
                    <div className="max-w-2xl mx-auto text-center py-16">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                            <IconFileText size={28} />
                        </div>
                        <Text fw={600} c="dimmed">Aucune politique SST n'est en vigueur pour cette mine.</Text>
                        {canManage && (
                            <Button mt="md" color="teal" leftSection={<IconEdit size={16} />}
                                onClick={() => { setMode('manage'); }}>Rédiger la politique</Button>
                        )}
                    </div>
                )
            )}

            {mode === 'manage' && canManage && (
                <div>
                    {editing ? (
                        <PolicyEditor initial={editing.id ? editing : editing} userName={userName}
                            onSaved={loadManagement}
                            onPublished={() => { setMode('read'); loadPublished(); setEditing(null); }} />
                    ) : (
                        <div className="max-w-4xl mx-auto">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <Text fw={600}>Aucun brouillon en cours</Text>
                                    <Text size="sm" c="dimmed">
                                        {published ? 'Une version est en vigueur. Réviser crée une nouvelle version.' : 'Rédigez la première politique de la mine.'}
                                    </Text>
                                </div>
                                <Group>
                                    {published && (
                                        <Button variant="default" onClick={() => startNewDraft(published)}>Réviser la version en vigueur</Button>
                                    )}
                                    <Button color="teal" leftSection={<IconPlus size={16} />} onClick={() => startNewDraft()}>Nouvelle politique</Button>
                                </Group>
                            </div>

                            {ackCount != null && (
                                <div className="rounded-xl border border-slate-200 bg-white p-5 mt-4">
                                    <Group gap="sm">
                                        <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center"><IconUsers size={18} /></div>
                                        <div>
                                            <Text fw={600}>{ackCount} prise(s) de connaissance</Text>
                                            <Text size="xs" c="dimmed">Indicateur de diffusion pour la revue de direction (§9.3)</Text>
                                        </div>
                                    </Group>
                                </div>
                            )}

                            {versions.length > 0 && (
                                <div className="rounded-xl border border-slate-200 bg-white p-5 mt-4">
                                    <Group gap="xs" mb="sm"><IconHistory size={16} className="text-slate-500" /><Text fw={600} size="sm">Historique des versions</Text></Group>
                                    <Timeline active={-1} bulletSize={18} lineWidth={2}>
                                        {versions.map((v) => (
                                            <Timeline.Item key={v.id} title={`Version ${v.version ?? '—'} · ${v.title ?? ''}`}>
                                                <Text size="xs" c="dimmed">
                                                    {v.status === 'PUBLISHED' ? 'En vigueur' : v.status === 'ARCHIVED' ? 'Archivée' : 'Brouillon'}
                                                    {v.signedAt ? ` · signée le ${fmtDateTime(v.signedAt)}` : ''}
                                                    {v.signatoryName ? ` · ${v.signatoryName}` : ''}
                                                </Text>
                                            </Timeline.Item>
                                        ))}
                                    </Timeline>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
