import { useMemo, useState } from 'react';
import { Text, Group, Checkbox, Select, Textarea, TextInput, Button, Alert, ActionIcon, Tooltip } from '@mantine/core';
import {
    IconUser,
    IconPencil,
    IconBuildingFactory2,
    IconHierarchy,
    IconFile,
    IconArrowsSplit2,
    IconFish,
    IconBinaryTree,
    IconLayersIntersect,
    IconSitemap,
    IconSettings,
    IconCheck,
    IconPlus,
    IconTrash,
    IconArrowDown,
    IconTargetArrow,
    IconInfoCircle,
    IconArrowBigRightLines,
    IconIndentIncrease,
    IconIndentDecrease,
} from '@tabler/icons-react';
import TextEditor from '../../../UtilityComp/TextEditor';
import FileUpdateDropzone from '../../../UtilityComp/FileUpdateDropzone';
import { successNotification } from '../../../../utility/NotificationUtility';
import {
    HUMAN_CAUSE_OPTIONS,
    TASK_CAUSE_OPTIONS,
    WORKING_CAUSE_OPTIONS,
    ORGANIZATION_CAUSE_OPTIONS,
} from '../incidentLabels';

/**
 * Étape 2 du wizard d'investigation — Analyse des causes PILOTÉE PAR LA MÉTHODE (LOT 57).
 *
 * Modèle persisté = ICAM (4 buckets `*Causes` + `*Analysis`). Les autres méthodes
 * (5 Pourquoi, Ishikawa 6M, Arbre des causes) sont des OUTILS GUIDÉS en état local,
 * dont la sortie est « synthétisée » dans un champ d'analyse ICAM → rien n'est perdu
 * côté backend. Cadre : ISO 45001 §10.2 (causes profondes → actions).
 */

// ─── ICAM : 4 catégories canoniques (mappées aux buckets backend) ──────────────
const ICAM_CATEGORIES = [
    { key: 'humanCauses', analysisKey: 'humanAnalysis', title: 'Actions individuelles & humaines', icon: IconUser, band: 'bg-blue-50/60 border-blue-200/70', chip: 'bg-blue-100 text-blue-700', options: HUMAN_CAUSE_OPTIONS },
    { key: 'taskCauses', analysisKey: 'taskAnalysis', title: 'Facteurs liés à la tâche', icon: IconPencil, band: 'bg-rose-50/60 border-rose-200/70', chip: 'bg-rose-100 text-rose-700', options: TASK_CAUSE_OPTIONS },
    { key: 'workingCauses', analysisKey: 'workingAnalysis', title: 'Conditions & environnement de travail', icon: IconBuildingFactory2, band: 'bg-emerald-50/60 border-emerald-200/70', chip: 'bg-emerald-100 text-emerald-700', options: WORKING_CAUSE_OPTIONS },
    { key: 'organizationCauses', analysisKey: 'organizationAnalysis', title: 'Facteurs organisationnels & latents', icon: IconHierarchy, band: 'bg-violet-50/60 border-violet-200/70', chip: 'bg-violet-100 text-violet-700', options: ORGANIZATION_CAUSE_OPTIONS },
];

const ANALYSIS_DESTINATIONS = ICAM_CATEGORIES.map((c) => ({ value: c.analysisKey, label: c.title }));

// ─── Méthode choisie (étape 1) → libellé/icône + outil d'analyse ───────────────
const METHOD_INFO: Record<string, { label: string; icon: any; color: string; level: string }> = {
    ICAM: { label: 'ICAM — Incident Cause Analysis Method', icon: IconLayersIntersect, color: 'bg-teal-100 text-teal-700', level: 'N3 – N4' },
    M5P: { label: 'Méthode des 5 Pourquoi', icon: IconArrowsSplit2, color: 'bg-blue-100 text-blue-700', level: 'N1 – N2' },
    ISH: { label: "Diagramme d'Ishikawa (6M)", icon: IconFish, color: 'bg-emerald-100 text-emerald-700', level: 'N2 – N3' },
    AC: { label: 'Arbre des causes', icon: IconBinaryTree, color: 'bg-violet-100 text-violet-700', level: 'N3 – N4' },
    FTA: { label: 'Arbre des défaillances (FTA)', icon: IconSitemap, color: 'bg-amber-100 text-amber-700', level: 'N3 – N4' },
    SMS: { label: 'Analyse des systèmes (SMS)', icon: IconSettings, color: 'bg-cyan-100 text-cyan-700', level: 'Systémique' },
    RCA: { label: 'Root Cause Analysis (RCA)', icon: IconTargetArrow, color: 'bg-rose-100 text-rose-700', level: 'Tous niveaux' },
};

/** Mappe la méthode choisie (étape 1) vers l'outil d'analyse présenté. */
const methodToTool = (method?: string): string => {
    switch (String(method || '').toUpperCase()) {
        case 'M5P': return 'fivewhys';
        case 'ISH': return 'ishikawa';
        case 'AC':
        case 'FTA': return 'tree';
        case 'ICAM':
        case 'SMS':
        case 'RCA':
        default: return 'icam';
    }
};

const ICAM_LABEL: Record<string, string> = {
    humanAnalysis: 'Actions individuelles & humaines',
    taskAnalysis: 'Facteurs liés à la tâche',
    workingAnalysis: 'Conditions & environnement de travail',
    organizationAnalysis: 'Facteurs organisationnels & latents',
};

const CauseCheckboxGroup = ({ form, fieldId, options }: { form: any; fieldId: string; options: { value: string; label: string }[] }) => (
    <Checkbox.Group {...form.getInputProps(fieldId)} label="Causes potentielles" withAsterisk>
        <div className="mt-2 flex flex-wrap gap-2">
            {options.map((opt) => (
                <Checkbox.Card
                    key={opt.value}
                    value={opt.value}
                    radius="md"
                    className="group border border-slate-300 transition duration-150 hover:!border-teal-400 hover:!bg-teal-50/60 data-[checked]:!border-teal-500 data-[checked]:!bg-teal-50 data-[checked]:shadow-sm"
                    p="xs"
                >
                    <Group align="center" gap="xs">
                        <Checkbox.Indicator size="xs" />
                        <Text size="xs" className="text-slate-700 group-data-[checked]:text-teal-900">{opt.label}</Text>
                    </Group>
                </Checkbox.Card>
            ))}
        </div>
    </Checkbox.Group>
);

// ── Bandeau de section réutilisable ──
const SectionCard = ({ band, icon: Icon, title, count, children }: any) => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className={`flex items-center gap-2 border-b px-4 py-2.5 ${band}`}>
            <span className="rounded-lg bg-white/70 p-1.5 text-slate-700"><Icon size={15} /></span>
            <span className="text-[11px] uppercase tracking-wider text-slate-700">{title}</span>
            {count !== undefined && <span className="ml-auto text-[10px] text-slate-500">{count}</span>}
        </div>
        <div className="p-4">{children}</div>
    </div>
);

const InvestigationAnalysis = ({ form }: any) => {
    const method = String(form?.values?.method || 'ICAM').toUpperCase();
    const tool = methodToTool(method);
    const mInfo = METHOD_INFO[method] ?? METHOD_INFO.ICAM;
    const [synthDone, setSynthDone] = useState(false);

    // Outils guidés — état LOCAL (non persisté).
    const [whys, setWhys] = useState<string[]>(['', '', '', '', '']);
    const [problem, setProblem] = useState<string>(form?.values?.incidentTitle || '');
    const [whyDest, setWhyDest] = useState<string>('organizationAnalysis');

    const M6 = useMemo(() => ([
        { key: 'manpower', label: 'Main-d\'œuvre' },
        { key: 'method', label: 'Méthode' },
        { key: 'machine', label: 'Matériel / Machine' },
        { key: 'milieu', label: 'Milieu' },
        { key: 'matter', label: 'Matière' },
        { key: 'management', label: 'Management' },
    ]), []);
    const [ishikawa, setIshikawa] = useState<Record<string, string[]>>({ manpower: [], method: [], machine: [], milieu: [], matter: [], management: [] });
    const [ishDest, setIshDest] = useState<string>('workingAnalysis');

    const [treeNodes, setTreeNodes] = useState<{ text: string; depth: number; connector: 'ET' | 'OU' }[]>([{ text: '', depth: 0, connector: 'ET' }]);
    const [treeDest, setTreeDest] = useState<string>('organizationAnalysis');

    const appendToAnalysis = (dest: string, html: string) => {
        const prev = form.values?.[dest] || '';
        form.setFieldValue(dest, `${prev}${prev ? '<br/>' : ''}${html}`);
        setSynthDone(true);
        successNotification(`Synthèse ajoutée à « ${ICAM_LABEL[dest] ?? dest} »`);
    };

    // ─── Synthèses ───
    const synthFiveWhys = () => {
        const items = whys.filter((w) => w.trim());
        const html = `<p><strong>5 Pourquoi — ${problem || 'Problème analysé'}</strong></p><ol>${items.map((w) => `<li>${w}</li>`).join('')}</ol>${items.length ? `<p><em>Cause racine retenue :</em> ${items[items.length - 1]}</p>` : ''}`;
        appendToAnalysis(whyDest, html);
    };
    const synthIshikawa = () => {
        const blocks = M6.filter((m) => ishikawa[m.key].some((x) => x.trim()))
            .map((m) => `<p><strong>${m.label}</strong></p><ul>${ishikawa[m.key].filter((x) => x.trim()).map((x) => `<li>${x}</li>`).join('')}</ul>`)
            .join('');
        appendToAnalysis(ishDest, `<p><strong>Ishikawa 6M</strong></p>${blocks}`);
    };
    const synthTree = () => {
        const html = `<p><strong>Arbre des causes</strong></p><ul>${treeNodes.filter((n) => n.text.trim()).map((n) => `<li style="margin-left:${n.depth * 16}px">[${n.connector}] ${n.text}</li>`).join('')}</ul>`;
        appendToAnalysis(treeDest, html);
    };

    // ─── Avancement ───
    const causesFilled = ICAM_CATEGORIES.some((c) => (form.values?.[c.key]?.length ?? 0) > 0);
    const analysisFilled = ICAM_CATEGORIES.some((c) => (form.values?.[c.analysisKey] || '').replace(/<[^>]+>/g, '').trim().length > 0);
    const evidenceFilled = (form.values?.evidence?.length ?? 0) > 0;
    const steps = [
        { label: 'Causes', done: causesFilled },
        { label: 'Analyse rédigée', done: analysisFilled },
        { label: 'Preuves', done: evidenceFilled },
        { label: 'Synthèse', done: tool === 'icam' ? analysisFilled : synthDone },
    ];

    return (
        <div className="mt-5 flex flex-col gap-5">
            {/* En-tête d'étape */}
            <div>
                <h2 className="text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '18px', fontWeight: 600 }}>Analyse des causes</h2>
                <p className="text-[13px] text-slate-500">Choisir la méthode, identifier les causes immédiates et profondes (ISO 45001 §10.2)</p>
            </div>

            {/* Méthode retenue — définie à l'Étape 1 (plus de sélecteur ici) */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <span className={`inline-flex rounded-lg p-2 ${mInfo.color}`}><mInfo.icon size={20} /></span>
                <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Méthode d'investigation</p>
                    <p className="text-[14px] text-slate-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>{mInfo.label}</p>
                </div>
                <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider text-slate-500">{mInfo.level}</span>
                <span className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${tool === 'icam' ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{tool === 'icam' ? 'Persistée' : 'Outil guidé'}</span>
                <span className="ml-auto text-[11.5px] text-slate-400">Définie à l'Étape 1 · modifiable en revenant en arrière</span>
            </div>

            {tool !== 'icam' && (
                <Alert color="teal" variant="light" icon={<IconInfoCircle size={16} />} className="!py-2">
                    <Text size="xs">Méthode d'aide à l'analyse. Seule la synthèse écrite dans l'analyse ICAM est enregistrée — utilisez « Synthétiser vers l'analyse ».</Text>
                </Alert>
            )}

            {/* ── ICAM (persisté) ── */}
            {tool === 'icam' && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {ICAM_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const n = form.values?.[cat.key]?.length ?? 0;
                        return (
                            <SectionCard key={cat.key} band={cat.band} icon={Icon} title={cat.title} count={`${n} sélectionnée(s)`}>
                                <div className="flex flex-col gap-4">
                                    <CauseCheckboxGroup form={form} fieldId={cat.key} options={cat.options} />
                                    <TextEditor withAsterisk form={form} id={cat.analysisKey} title="Analyse détaillée" />
                                </div>
                            </SectionCard>
                        );
                    })}
                </div>
            )}

            {/* ── 5 Pourquoi ── */}
            {tool === 'fivewhys' && (
                <SectionCard band="bg-teal-50/60 border-teal-200/70" icon={IconArrowsSplit2} title="5 Pourquoi — chaîne causale">
                    <div className="flex flex-col gap-4">
                        <Textarea label="Problème / effet constaté" autosize minRows={2} value={problem} onChange={(e) => setProblem(e.currentTarget.value)} placeholder="Décrire l'effet observé (sans présumer la cause)" />
                        <div className="flex flex-col gap-0">
                            {whys.map((w, i) => (
                                <div key={i} className="flex items-start gap-3" style={{ marginLeft: i * 14 }}>
                                    <div className="flex flex-col items-center">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm text-white">{i + 1}</span>
                                        {i < whys.length - 1 && <span className="my-1 h-5 w-px bg-teal-200" />}
                                    </div>
                                    <div className="flex-1 pb-3">
                                        <TextInput
                                            value={w}
                                            onChange={(e) => setWhys((arr) => arr.map((x, j) => (j === i ? e.currentTarget.value : x)))}
                                            placeholder={i === 0 ? 'Pourquoi cela s\'est-il produit ?' : `Pourquoi : « ${whys[i - 1] || '…'} » ?`}
                                            rightSection={i >= 5 ? (
                                                <ActionIcon variant="subtle" color="red" onClick={() => setWhys((arr) => arr.filter((_, j) => j !== i))}><IconTrash size={14} /></ActionIcon>
                                            ) : (i < whys.length - 1 ? <IconArrowDown size={14} className="text-teal-400" /> : null)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <Button size="xs" variant="subtle" color="teal" leftSection={<IconPlus size={14} />} onClick={() => setWhys((a) => [...a, ''])}>Ajouter un pourquoi</Button>
                        </div>
                        {whys.filter((w) => w.trim()).length > 0 && (
                            <div className="rounded-xl border-l-4 border-emerald-400 bg-emerald-50 p-3">
                                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-emerald-700"><IconTargetArrow size={14} /> Cause racine identifiée</p>
                                <p className="mt-1 text-[13.5px] text-emerald-900">{whys.filter((w) => w.trim()).slice(-1)[0]}</p>
                            </div>
                        )}
                        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3">
                            <Select size="xs" label="Synthétiser dans" w={260} data={ANALYSIS_DESTINATIONS} value={whyDest} onChange={(v) => v && setWhyDest(v)} />
                            <Button color="teal" leftSection={<IconArrowBigRightLines size={15} />} onClick={synthFiveWhys}>Synthétiser vers l'analyse</Button>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ── Ishikawa 6M ── */}
            {tool === 'ishikawa' && (
                <SectionCard band="bg-teal-50/60 border-teal-200/70" icon={IconFish} title="Diagramme d'Ishikawa — 6M">
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {M6.map((m) => (
                                <div key={m.key} className="rounded-xl border border-slate-200 bg-slate-50/40 p-3">
                                    <p className="mb-2 text-[12px] text-slate-700">{m.label} <span className="text-slate-400">({ishikawa[m.key].filter((x) => x.trim()).length})</span></p>
                                    <div className="flex flex-col gap-1.5">
                                        {ishikawa[m.key].map((c, i) => (
                                            <div key={i} className="flex items-center gap-1">
                                                <TextInput size="xs" className="flex-1" value={c} onChange={(e) => setIshikawa((s) => ({ ...s, [m.key]: s[m.key].map((x, j) => (j === i ? e.currentTarget.value : x)) }))} placeholder="Cause possible" />
                                                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => setIshikawa((s) => ({ ...s, [m.key]: s[m.key].filter((_, j) => j !== i) }))}><IconTrash size={13} /></ActionIcon>
                                            </div>
                                        ))}
                                        <Button size="compact-xs" variant="subtle" color="teal" leftSection={<IconPlus size={12} />} onClick={() => setIshikawa((s) => ({ ...s, [m.key]: [...s[m.key], ''] }))}>Ajouter</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3">
                            <Select size="xs" label="Synthétiser dans" w={260} data={ANALYSIS_DESTINATIONS} value={ishDest} onChange={(v) => v && setIshDest(v)} />
                            <Button color="teal" leftSection={<IconArrowBigRightLines size={15} />} onClick={synthIshikawa}>Synthétiser vers l'analyse</Button>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ── Arbre des causes ── */}
            {tool === 'tree' && (
                <SectionCard band="bg-teal-50/60 border-teal-200/70" icon={IconBinaryTree} title="Arbre des causes">
                    <div className="flex flex-col gap-3">
                        <p className="text-[12px] text-slate-500">Remonter des faits vers les causes profondes ; indenter pour les antécédents, choisir le connecteur logique ET / OU.</p>
                        {treeNodes.map((node, i) => (
                            <div key={i} className="flex items-center gap-1.5" style={{ marginLeft: node.depth * 22 }}>
                                <Tooltip label="Indenter"><ActionIcon variant="subtle" size="sm" onClick={() => setTreeNodes((a) => a.map((n, j) => (j === i ? { ...n, depth: n.depth + 1 } : n)))}><IconIndentIncrease size={14} /></ActionIcon></Tooltip>
                                <Tooltip label="Désindenter"><ActionIcon variant="subtle" size="sm" disabled={node.depth === 0} onClick={() => setTreeNodes((a) => a.map((n, j) => (j === i ? { ...n, depth: Math.max(0, n.depth - 1) } : n)))}><IconIndentDecrease size={14} /></ActionIcon></Tooltip>
                                <Select size="xs" w={72} data={['ET', 'OU']} value={node.connector} onChange={(v) => setTreeNodes((a) => a.map((n, j) => (j === i ? { ...n, connector: (v as 'ET' | 'OU') } : n)))} />
                                <TextInput size="xs" className="flex-1" value={node.text} onChange={(e) => setTreeNodes((a) => a.map((n, j) => (j === i ? { ...n, text: e.currentTarget.value } : n)))} placeholder={i === 0 ? 'Événement / fait constaté' : 'Cause antécédente'} />
                                <ActionIcon variant="subtle" color="red" size="sm" disabled={treeNodes.length === 1} onClick={() => setTreeNodes((a) => a.filter((_, j) => j !== i))}><IconTrash size={13} /></ActionIcon>
                            </div>
                        ))}
                        <div>
                            <Button size="xs" variant="subtle" color="teal" leftSection={<IconPlus size={14} />} onClick={() => setTreeNodes((a) => [...a, { text: '', depth: a[a.length - 1]?.depth ?? 0, connector: 'ET' }])}>Ajouter une cause</Button>
                        </div>
                        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3">
                            <Select size="xs" label="Synthétiser dans" w={260} data={ANALYSIS_DESTINATIONS} value={treeDest} onChange={(v) => v && setTreeDest(v)} />
                            <Button color="teal" leftSection={<IconArrowBigRightLines size={15} />} onClick={synthTree}>Synthétiser vers l'analyse</Button>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ── Preuves (commun, persisté) ── */}
            <SectionCard band="bg-yellow-50/60 border-yellow-200/70" icon={IconFile} title="Preuves & pièces justificatives" count={`${form.values?.evidence?.length ?? 0}`}>
                <div className="flex flex-col gap-4">
                    <FileUpdateDropzone form={form} id="evidence" />
                    <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3">
                        <ul className="list-inside list-disc space-y-1 text-[12.5px] text-teal-800">
                            <li>Photos de la scène, équipements endommagés, manquements constatés</li>
                            <li>Procédures, dossiers de formation, registres de maintenance</li>
                            <li>Témoignages, rapports d'experts ou analyses techniques</li>
                            <li>Taille maximale : <strong>2 Mo</strong> par fichier</li>
                        </ul>
                    </div>
                </div>
            </SectionCard>

            {/* ── Avancement de l'analyse ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <p className="mb-3 text-[11px] uppercase tracking-wider text-slate-500">Avancement de l'analyse</p>
                <div className="flex items-center">
                    {steps.map((s, i) => (
                        <div key={s.label} className="flex flex-1 items-center last:flex-none">
                            <div className="flex items-center gap-2">
                                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${s.done ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{s.done ? <IconCheck size={13} /> : i + 1}</span>
                                <span className={`text-[12.5px] ${s.done ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</span>
                            </div>
                            {i < steps.length - 1 && <span className={`mx-2 h-px flex-1 ${s.done ? 'bg-teal-300' : 'bg-slate-200'}`} />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InvestigationAnalysis;
