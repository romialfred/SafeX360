import { useCallback, useEffect, useState } from 'react';
import {
    ActionIcon, Badge, Button, Collapse, FileButton, Group, Loader, Modal, Stack, Text,
    Textarea, TextInput, Timeline,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
    IconArrowDown, IconArrowUp, IconBulb, IconCertificate, IconCheck, IconChevronDown,
    IconDownload, IconEdit, IconEye, IconFileText, IconFileTypePdf, IconHistory, IconPaperclip,
    IconPlus, IconShieldCheck, IconSparkles, IconTrash, IconUsers, IconWriting,
} from '@tabler/icons-react';

import { EXAMPLE_POLICY } from './examplePolicy';

import {
    acknowledge as ackPolicy, getAcknowledgementStats, getPolicy, getPublished,
    listPolicies, publish as publishPolicy, saveDraft,
    type HsPolicy, type HsPolicyArticle,
} from '../../../services/HsPolicyService';
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
    policy, mineName, canAcknowledge, onAcknowledge, acking, userName,
}: {
    policy: HsPolicy;
    mineName: string;
    canAcknowledge: boolean;
    onAcknowledge: () => void;
    acking: boolean;
    userName: string;
}) {
    return (
        <div className="max-w-4xl mx-auto">
            {/* En-tête — couverture du document (claire, compacte, premium) */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                {/* filet d'accent — la seule touche de couleur forte */}
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#12294A 0%,#1E7F76 100%)' }} />
                <div className="px-8 pt-6 pb-5">
                    <div className="flex items-center gap-1.5 text-teal-700 text-[11.5px] font-semibold uppercase tracking-[0.14em]">
                        <IconShieldCheck size={14} /> {mineName}
                    </div>
                    <h1 className="text-[26px] sm:text-[31px] font-bold mt-2 leading-[1.15]"
                        style={{ color: '#12294A', fontFamily: 'Georgia,"Times New Roman",serif' }}>
                        {policy.title || 'Politique Santé & Sécurité au Travail'}
                    </h1>
                    <Group gap="xs" mt="sm">
                        <Badge color="teal" variant="light">Version {policy.version ?? '—'}</Badge>
                        <Badge color="gray" variant="light">En vigueur depuis le {fmt(policy.effectiveDate)}</Badge>
                        <Badge color="blue" variant="light" leftSection={<IconCertificate size={12} />}>ISO 45001 §5.2</Badge>
                    </Group>
                </div>
                {policy.preamble && (
                    <div className="px-8 pb-7">
                        {/* préambule = chapô : liseré navy à gauche, texte posé */}
                        <p className="text-[15.5px] text-slate-700 leading-relaxed whitespace-pre-line border-l-2 border-slate-200 pl-4">
                            {policy.preamble}
                        </p>
                    </div>
                )}
            </div>

            {/* Articles */}
            <Stack gap="sm" mt="lg">
                {(policy.articles ?? []).map((a, i) => <ArticleCard key={a.id ?? i} article={a} index={i} />)}
            </Stack>

            {/* Signature de la direction */}
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 mt-6">
                <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.1em' }}>Engagement de la direction</Text>
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
    const [mode, setMode] = useState<'read' | 'manage'>('read');

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
                {canManage && (
                    <Button.Group>
                        <Button variant={mode === 'read' ? 'filled' : 'default'} color="teal"
                            leftSection={<IconEye size={16} />} onClick={() => setMode('read')}>Lecture</Button>
                        <Button variant={mode === 'manage' ? 'filled' : 'default'} color="teal"
                            leftSection={<IconEdit size={16} />} onClick={() => setMode('manage')}>Gérer</Button>
                    </Button.Group>
                )}
            </Group>

            {mode === 'read' && (
                published ? (
                    <PolicyReader policy={published} mineName={mineName} canAcknowledge={!!published.id}
                        onAcknowledge={onAcknowledge} acking={acking} userName={userName} />
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
