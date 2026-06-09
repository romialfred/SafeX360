/**
 * AIIncidentDeclaration — Déclaration d'incident assistée par IA.
 *
 * Workflow en 4 étapes :
 *   1. UPLOAD     : drag&drop photo OU prise photo mobile (caméra)
 *   2. ANALYZING  : envoi backend + animation IA en cours
 *   3. REVIEW     : affichage résultat IA + édition possible
 *   4. SUBMITTED  : confirmation soumission incident
 *
 * Innovation clé : l'IA analyse l'image avec Claude Vision, identifie
 * les risques HSE, propose une catégorisation ISO et un plan d'actions.
 * L'utilisateur valide ou corrige avant soumission finale.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button, Textarea, Badge, Loader, Progress, Select, Modal,
} from '@mantine/core';
import {
    IconCamera, IconUpload, IconSparkles, IconArrowLeft, IconArrowRight,
    IconCheck, IconAlertTriangle, IconX, IconShieldCheck, IconClipboardCheck,
    IconBrain, IconPhoto, IconReload, IconCircleCheck, IconFlame,
    IconCertificate,
} from '@tabler/icons-react';
import PageHeader from '../../../UtilityComp/PageHeader';
import {
    analyzeImage, getAIStatus,
    type AIAnalysisResponse, type IdentifiedRisk, type CorrectiveAction,
} from '../../../../services/AIIncidentService';
import { successNotification, errorNotification } from '../../../../utility/NotificationUtility';
import CameraCaptureModal from './CameraCaptureModal';
import { reportIncident } from '../../../../services/IncidentService';
import { getAllActiveLocations } from '../../../../services/LocationService';
import { getAllActiveWorkArea } from '../../../../services/WorkAreaService';
import { getAllActiveWorkProcess } from '../../../../services/WorkProcessService';

type Step = 'UPLOAD' | 'ANALYZING' | 'REVIEW' | 'SUBMITTED';

// ───────────────────────────────────────────────────────────────────────
// MAPPING couleurs / labels par sévérité
// ───────────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
    LOW: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', label: 'Faible' },
    MEDIUM: { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D', label: 'Modérée' },
    HIGH: { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA', label: 'Élevée' },
    CRITICAL: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA', label: 'Critique' },
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
    ACCIDENT: 'Accident',
    QUASI_ACCIDENT: 'Quasi-accident',
    DANGER: 'Situation dangereuse',
    NON_CONFORMITY: 'Non-conformité',
    NEAR_MISS: 'Presque accident',
};

const CATEGORY_LABELS: Record<string, string> = {
    FALL_FROM_HEIGHT: 'Chute de hauteur',
    ELECTRICAL: 'Risque électrique',
    CHEMICAL: 'Risque chimique',
    FIRE: 'Incendie / explosion',
    MECHANICAL: 'Risque mécanique',
    EPI_MISSING: 'EPI manquant',
    ENVIRONMENT: 'Atteinte environnement',
    OTHER: 'Autre',
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    P0: { bg: '#FEE2E2', text: '#B91C1C', label: 'P0 — Immédiat' },
    P1: { bg: '#FFEDD5', text: '#C2410C', label: 'P1 — Court terme' },
    P2: { bg: '#FEF3C7', text: '#B45309', label: 'P2 — Moyen terme' },
    P3: { bg: '#DBEAFE', text: '#1E40AF', label: 'P3 — Long terme' },
};

// ───────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ───────────────────────────────────────────────────────────────────────

export default function AIIncidentDeclaration() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>('UPLOAD');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
    const [analyzeProgress, setAnalyzeProgress] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);

    // Defaults techniques pre-charges au mount pour permettre la submission en BDD
    // (location/workArea/workProcess sont @JoinColumn nullable=false cote backend).
    const [defaultLocationId, setDefaultLocationId] = useState<number | null>(null);
    const [defaultWorkAreaId, setDefaultWorkAreaId] = useState<number | null>(null);
    const [defaultWorkProcessId, setDefaultWorkProcessId] = useState<number | null>(null);

    // Champs editables sur la step REVIEW
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedSeverity, setEditedSeverity] = useState('');

    // Contexte fourni au backend
    const [mineContext, setMineContext] = useState('');
    const [departmentContext, setDepartmentContext] = useState('');
    const [userContext, setUserContext] = useState('');

    // Modal "comment ça marche"
    const [helpOpened, setHelpOpened] = useState(false);

    // Modal caméra (capture live via getUserMedia)
    const [cameraOpened, setCameraOpened] = useState(false);

    // Recupere le statut IA au montage + prefetch defaults techniques pour la soumission
    useEffect(() => {
        getAIStatus()
            .then((s) => setAiConfigured(s.configured))
            .catch(() => setAiConfigured(false));

        // Pre-charge le premier element Location/WorkArea/WorkProcess pour valider
        // les contraintes FK non-null cote backend lors de la soumission IA.
        getAllActiveLocations()
            .then((res: any[]) => {
                if (Array.isArray(res) && res.length > 0) setDefaultLocationId(res[0].id);
            })
            .catch(() => {});
        getAllActiveWorkArea()
            .then((res: any[]) => {
                if (Array.isArray(res) && res.length > 0) setDefaultWorkAreaId(res[0].id);
            })
            .catch(() => {});
        getAllActiveWorkProcess()
            .then((res: any[]) => {
                if (Array.isArray(res) && res.length > 0) setDefaultWorkProcessId(res[0].id);
            })
            .catch(() => {});
    }, []);

    // ─── Gestion fichier ───
    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            errorNotification('Format non supporté — choisissez une image JPG, PNG ou WebP.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            errorNotification('Image trop volumineuse (max 10 MB).');
            return;
        }
        setImage(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    // ─── Étape 2 : analyse ───
    const startAnalysis = async () => {
        if (!image) return;
        setStep('ANALYZING');
        setAnalyzeProgress(0);

        // Animation de progression visuelle (l'analyse réelle prend 3-15s)
        const progressTimer = setInterval(() => {
            setAnalyzeProgress((p) => {
                if (p >= 92) return p;
                const inc = p < 30 ? 8 : p < 60 ? 4 : p < 80 ? 2 : 1;
                return p + inc;
            });
        }, 300);

        try {
            const result = await analyzeImage(image, {
                mineContext, departmentContext, userContext, language: 'fr',
            });
            clearInterval(progressTimer);
            setAnalyzeProgress(100);

            // Cas image non HSE-pertinente
            if (!result.hseRelevant) {
                setTimeout(() => {
                    setAnalysis(result);
                    errorNotification(
                        result.irrelevanceReason || 'Cette image ne semble pas montrer une situation HSE. Reprenez une photo.',
                    );
                    setStep('UPLOAD');
                }, 500);
                return;
            }

            setTimeout(() => {
                setAnalysis(result);
                setEditedTitle(result.title);
                setEditedDescription(result.description);
                setEditedSeverity(result.severity);
                setStep('REVIEW');
            }, 700);
        } catch (e: any) {
            clearInterval(progressTimer);
            errorNotification('Erreur lors de l\'analyse IA. Veuillez réessayer.');
            setStep('UPLOAD');
        }
    };

    // ─── Étape 3 : soumission backend reelle ───
    /**
     * Soumet l'incident IA au backend (POST /hns/incidents/report).
     * - source='AI' permet la tracabilite cote BDD + filtre Source sur la dashboard incidents.
     * - aiConfidence/aiModel sont persistes pour audit.
     * - factualDescription porte la description editee + le plan de remediation (incident_analysis).
     * - On utilise les premiers IDs location/workArea/workProcess pre-charges au mount
     *   pour satisfaire les FK nullable=false (l'utilisateur pourra raffiner en edition).
     */
    const submitIncident = async () => {
        if (!analysis) return;
        setSubmitting(true);
        try {
            const now = new Date().toISOString();
            const payload: any = {
                title: editedTitle,
                // source/aiConfidence/aiModel sont les NOUVEAUX champs persistes en BDD
                source: 'AI',
                aiConfidence: analysis.confidence,
                aiModel: analysis.aiModel,
                // Dates
                occurredAt: now,
                discoveryTime: now,
                // FK obligatoires backend — defaults pre-charges
                locationId: defaultLocationId,
                workAreaId: defaultWorkAreaId,
                workProcessId: defaultWorkProcessId,
                // Tableau vides — IncidentDetail/RiskAssessment seront crees vides mais valides
                involvedPersons: [],
                witnesses: [],
                evidence: [],
                ppe: [],
                weatherConditions: [],
                // Analyse incident — agrege l'analyse IA dans factualDescription pour audit
                factualDescription: editedDescription,
                immediateCauses: analysis.rootCauseHypothesis || '',
                rootCauses: analysis.rootCauseHypothesis || '',
                contributingFactors: (analysis.identifiedRisks || []).map((r: IdentifiedRisk) => r.risk).join(' | '),
                immediateConsequences: '',
                potentialConsequences: '',
                immediateActions: (analysis.correctiveActions || [])
                    .filter((a: CorrectiveAction) => a.priority === 'P0' || a.priority === 'P1')
                    .map((a: CorrectiveAction) => `[${a.priority}] ${a.action}`)
                    .join('\n'),
                // Risk assessment
                probability: 3,
                severity: analysis.severity === 'CRITICAL' ? 4 : analysis.severity === 'HIGH' ? 3 : analysis.severity === 'MEDIUM' ? 2 : 1,
                existingControlMeasures: '',
                residualRiskAssessment: analysis.remediationPlan || '',
            };

            await reportIncident(payload);

            successNotification('Incident IA déclaré avec succès — visible dans Gestion des incidents (filtre IA)');
            setStep('SUBMITTED');
        } catch (e: any) {
            const msg = e?.response?.data?.errorMessage || e?.message || 'erreur inconnue';
            console.error('[AI Incident Submit] echec', e);
            errorNotification(`Erreur soumission : ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Reset ───
    const reset = () => {
        setStep('UPLOAD');
        setImage(null);
        setImagePreview(null);
        setAnalysis(null);
        setAnalyzeProgress(0);
        setEditedTitle('');
        setEditedDescription('');
        setEditedSeverity('');
    };

    return (
        <div className="safex-page w-full space-y-5">
            <PageHeader
                breadcrumbs={[
                    { label: 'Accueil', to: '/' },
                    { label: 'Gestion des incidents', to: '/incidents' },
                    { label: 'Déclaration par IA' },
                ]}
                icon={<IconBrain size={22} stroke={2} />}
                iconColor="indigo"
                title="Déclaration assistée par IA"
                subtitle="Prenez une photo, l'IA analyse la situation et pré-remplit la déclaration"
                actions={
                    <Button
                        variant="default" size="sm" onClick={() => setHelpOpened(true)}
                        leftSection={<IconBrain size={14} />}
                    >
                        Comment ça marche ?
                    </Button>
                }
            />

            {/* Indicateur configuration IA */}
            {aiConfigured === false && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <IconAlertTriangle size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <div className="text-[13.5px] font-semibold text-amber-900 mb-0.5">
                            Mode démonstration activé
                        </div>
                        <p className="text-[12.5px] text-amber-800 leading-relaxed">
                            La clé API Anthropic Claude n'est pas configurée. L'IA retournera une analyse simulée
                            réaliste pour vous permettre de tester le workflow.
                            Pour activer l'analyse réelle, ajoutez <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11.5px]">ANTHROPIC_API_KEY</code> dans <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11.5px]">Backend/.env</code>.
                        </p>
                    </div>
                </div>
            )}

            {/* Stepper visuel */}
            <StepperHeader currentStep={step} />

            {/* Contenu selon étape */}
            {step === 'UPLOAD' && (
                <UploadStep
                    onFile={handleFile}
                    onDrop={handleDrop}
                    imagePreview={imagePreview}
                    image={image}
                    onReset={reset}
                    onStart={startAnalysis}
                    fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                    cameraInputRef={cameraInputRef as React.RefObject<HTMLInputElement>}
                    onOpenCamera={() => setCameraOpened(true)}
                    mineContext={mineContext}
                    onMineContextChange={setMineContext}
                    departmentContext={departmentContext}
                    onDepartmentContextChange={setDepartmentContext}
                    userContext={userContext}
                    onUserContextChange={setUserContext}
                />
            )}

            {step === 'ANALYZING' && (
                <AnalyzingStep progress={analyzeProgress} imagePreview={imagePreview} />
            )}

            {step === 'REVIEW' && analysis && (
                <ReviewStep
                    analysis={analysis}
                    imagePreview={imagePreview!}
                    editedTitle={editedTitle}
                    onEditedTitleChange={setEditedTitle}
                    editedDescription={editedDescription}
                    onEditedDescriptionChange={setEditedDescription}
                    editedSeverity={editedSeverity}
                    onEditedSeverityChange={setEditedSeverity}
                    onBack={reset}
                    onSubmit={submitIncident}
                    submitting={submitting}
                />
            )}

            {step === 'SUBMITTED' && (
                <SubmittedStep onNew={reset} onClose={() => navigate('/incidents')} />
            )}

            {/* Modal aide */}
            <Modal
                opened={helpOpened}
                onClose={() => setHelpOpened(false)}
                title="Comment fonctionne la déclaration par IA"
                size="lg"
                centered
            >
                <HelpContent />
            </Modal>

            {/* Modal caméra live */}
            <CameraCaptureModal
                opened={cameraOpened}
                onClose={() => setCameraOpened(false)}
                onCapture={handleFile}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// STEPPER VISUEL
// ═══════════════════════════════════════════════════════════════════════

function StepperHeader({ currentStep }: { currentStep: Step }) {
    const steps: { id: Step; label: string; icon: any }[] = [
        { id: 'UPLOAD', label: 'Photo', icon: IconPhoto },
        { id: 'ANALYZING', label: 'Analyse IA', icon: IconBrain },
        { id: 'REVIEW', label: 'Vérification', icon: IconClipboardCheck },
        { id: 'SUBMITTED', label: 'Soumis', icon: IconCheck },
    ];

    const idx = steps.findIndex((s) => s.id === currentStep);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 overflow-x-auto">
                {steps.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = i === idx;
                    const isDone = i < idx;
                    return (
                        <div key={step.id} className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                                style={{
                                    background: isActive ? '#EEF2FF' : isDone ? '#ECFDF5' : 'transparent',
                                    border: `1px solid ${isActive ? '#C7D2FE' : isDone ? '#A7F3D0' : 'transparent'}`,
                                }}
                            >
                                <span
                                    className="w-7 h-7 rounded-full flex items-center justify-center"
                                    style={{
                                        background: isActive ? '#6366F1' : isDone ? '#059669' : '#E2E8F0',
                                    }}
                                >
                                    {isDone ? (
                                        <IconCheck size={14} className="text-white" stroke={3} />
                                    ) : (
                                        <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} stroke={2} />
                                    )}
                                </span>
                                <div>
                                    <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500 font-semibold">
                                        Étape {i + 1}
                                    </div>
                                    <div
                                        className="text-[13px] font-semibold"
                                        style={{ color: isActive ? '#4F46E5' : isDone ? '#047857' : '#475569' }}
                                    >
                                        {step.label}
                                    </div>
                                </div>
                            </div>
                            {i < steps.length - 1 && (
                                <div
                                    className="flex-1 h-0.5 rounded-full"
                                    style={{ background: isDone ? '#10B981' : '#E2E8F0' }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ÉTAPE 1 : UPLOAD
// ═══════════════════════════════════════════════════════════════════════

interface UploadStepProps {
    onFile: (f: File) => void;
    onDrop: (e: React.DragEvent) => void;
    imagePreview: string | null;
    image: File | null;
    onReset: () => void;
    onStart: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    cameraInputRef: React.RefObject<HTMLInputElement>;
    onOpenCamera: () => void;
    mineContext: string;
    onMineContextChange: (v: string) => void;
    departmentContext: string;
    onDepartmentContextChange: (v: string) => void;
    userContext: string;
    onUserContextChange: (v: string) => void;
}

function UploadStep({
    onFile, onDrop, imagePreview, image, onReset, onStart,
    fileInputRef, cameraInputRef, onOpenCamera,
    mineContext, onMineContextChange,
    departmentContext, onDepartmentContextChange,
    userContext, onUserContextChange,
}: UploadStepProps) {
    return (
        <div className="grid lg:grid-cols-2 gap-5">
            {/* Zone upload */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                        <IconCamera size={16} className="text-indigo-700" />
                    </span>
                    <h3 className="text-[15px] font-semibold text-slate-900">Photo de la situation</h3>
                </div>

                {!imagePreview ? (
                    <div
                        onDrop={onDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
                    >
                        <IconUpload size={32} className="text-slate-400 mx-auto mb-3" stroke={1.5} />
                        <p className="text-[14px] font-medium text-slate-700 mb-1">
                            Glissez une photo ici
                        </p>
                        <p className="text-[12.5px] text-slate-500 mb-5">
                            ou choisissez une option ci-dessous · JPG, PNG, WebP · max 10 MB
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <Button
                                leftSection={<IconUpload size={14} />}
                                size="sm"
                                color="indigo"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Choisir un fichier
                            </Button>
                            <Button
                                leftSection={<IconCamera size={14} />}
                                size="sm"
                                variant="default"
                                onClick={onOpenCamera}
                            >
                                Prendre une photo
                            </Button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                        />
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                        />
                    </div>
                ) : (
                    <div>
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                            <img src={imagePreview} alt="Aperçu" className="w-full h-auto max-h-96 object-contain" />
                            <button
                                onClick={onReset}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 border border-slate-200 flex items-center justify-center hover:bg-white shadow-md cursor-pointer"
                                aria-label="Supprimer"
                            >
                                <IconX size={15} className="text-slate-700" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <div className="text-[11.5px] text-slate-600">
                                {image?.name} · {((image?.size || 0) / 1024).toFixed(0)} KB
                            </div>
                            <Button size="xs" variant="subtle" leftSection={<IconReload size={12} />} onClick={onReset}>
                                Changer
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Contexte optionnel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
                        <IconSparkles size={16} className="text-teal-700" />
                    </span>
                    <h3 className="text-[15px] font-semibold text-slate-900">Contexte (optionnel)</h3>
                </div>
                <p className="text-[12.5px] text-slate-600 mb-5 leading-relaxed">
                    Ces informations aident l'IA à mieux analyser la situation. Tout est optionnel.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                            Site / mine
                        </label>
                        <input
                            type="text"
                            value={mineContext}
                            onChange={(e) => onMineContextChange(e.target.value)}
                            placeholder="ex : Mine d'or — Galerie Nord"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                            Département / zone
                        </label>
                        <input
                            type="text"
                            value={departmentContext}
                            onChange={(e) => onDepartmentContextChange(e.target.value)}
                            placeholder="ex : Extraction · Niveau −120m"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                            Commentaire libre
                        </label>
                        <Textarea
                            value={userContext}
                            onChange={(e) => onUserContextChange(e.target.value)}
                            placeholder="ex : J'ai remarqué que les harnais étaient au sol vers 10h"
                            minRows={3}
                            autosize
                            styles={{ input: { fontSize: 13 } }}
                        />
                    </div>
                </div>

                {image && (
                    <div className="mt-6 pt-5 border-t border-slate-200">
                        <Button
                            fullWidth
                            color="indigo"
                            size="md"
                            leftSection={<IconBrain size={16} />}
                            rightSection={<IconArrowRight size={15} />}
                            onClick={onStart}
                            styles={{
                                root: {
                                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                    boxShadow: '0 8px 20px -5px rgba(99,102,241,0.5)',
                                },
                            }}
                        >
                            Lancer l'analyse IA
                        </Button>
                        <p className="text-[11px] text-slate-500 text-center mt-2.5">
                            Durée typique : 3 à 10 secondes
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ÉTAPE 2 : ANALYZING
// ═══════════════════════════════════════════════════════════════════════

function AnalyzingStep({ progress, imagePreview }: { progress: number; imagePreview: string | null }) {
    const phases = [
        { threshold: 0, label: 'Préparation de l\'image…', icon: IconPhoto },
        { threshold: 15, label: 'Envoi à Claude Vision…', icon: IconUpload },
        { threshold: 35, label: 'Détection des éléments HSE…', icon: IconBrain },
        { threshold: 60, label: 'Identification des risques…', icon: IconAlertTriangle },
        { threshold: 80, label: 'Génération du plan d\'actions…', icon: IconClipboardCheck },
        { threshold: 95, label: 'Finalisation…', icon: IconCheck },
    ];
    const currentPhase = phases.filter((p) => progress >= p.threshold).pop() || phases[0];
    const Icon = currentPhase.icon;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-10">
            <div className="max-w-2xl mx-auto text-center">
                {/* Image en cours d'analyse avec overlay */}
                <div className="relative mx-auto mb-8 rounded-2xl overflow-hidden border border-slate-200" style={{ maxWidth: 420 }}>
                    {imagePreview && (
                        <img src={imagePreview} alt="Analyse en cours" className="w-full h-auto" style={{ filter: 'brightness(0.6)' }} />
                    )}
                    {/* Overlay scan line */}
                    <div
                        className="absolute inset-x-0 h-1 bg-gradient-to-b from-transparent via-indigo-400 to-transparent"
                        style={{
                            top: `${progress}%`,
                            boxShadow: '0 0 30px rgba(99,102,241,0.8)',
                            transition: 'top 300ms ease-out',
                        }}
                    />
                    {/* Grille analyse */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage:
                                'linear-gradient(to right, rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.15) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />
                    {/* Icône centrale animée */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/95 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center shadow-2xl">
                            <Icon size={32} className="text-indigo-600" stroke={1.6} />
                        </div>
                    </div>
                </div>

                {/* Texte phase */}
                <div className="mb-5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Loader size="xs" color="indigo" />
                        <span className="text-[11px] uppercase tracking-[0.18em] text-indigo-700 font-bold">
                            IA en cours
                        </span>
                    </div>
                    <h3
                        className="text-slate-900"
                        style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontWeight: 600,
                            fontSize: 24,
                        }}
                    >
                        {currentPhase.label}
                    </h3>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                    <Progress
                        value={progress}
                        size="lg"
                        radius="xl"
                        color="indigo"
                        animated
                        striped
                    />
                </div>
                <p className="text-[13px] text-slate-600">
                    {Math.floor(progress)}% — analyse multimodale en cours
                </p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ÉTAPE 3 : REVIEW
// ═══════════════════════════════════════════════════════════════════════

interface ReviewStepProps {
    analysis: AIAnalysisResponse;
    imagePreview: string;
    editedTitle: string;
    onEditedTitleChange: (v: string) => void;
    editedDescription: string;
    onEditedDescriptionChange: (v: string) => void;
    editedSeverity: string;
    onEditedSeverityChange: (v: string) => void;
    onBack: () => void;
    onSubmit: () => void;
    submitting: boolean;
}

function ReviewStep(props: ReviewStepProps) {
    const { analysis, imagePreview, editedTitle, onEditedTitleChange,
        editedDescription, onEditedDescriptionChange, editedSeverity, onEditedSeverityChange,
        onBack, onSubmit, submitting } = props;

    const sev = SEVERITY_COLORS[editedSeverity] || SEVERITY_COLORS.MEDIUM;
    const confidencePct = Math.round(analysis.confidence * 100);

    return (
        <div className="space-y-5">
            {/* Banner IA done */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-indigo-200 flex items-center justify-center flex-shrink-0">
                    <IconSparkles size={22} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-[15px] font-semibold text-slate-900">Analyse IA terminée</h3>
                        <Badge color="indigo" variant="filled" size="sm">
                            Confiance {confidencePct}%
                        </Badge>
                        {analysis.fromMock && (
                            <Badge color="orange" variant="light" size="sm">Mode démo</Badge>
                        )}
                        <Badge color="slate" variant="outline" size="sm">
                            {analysis.aiModel}
                        </Badge>
                        <Badge color="gray" variant="light" size="sm">
                            {(analysis.durationMs / 1000).toFixed(1)}s
                        </Badge>
                    </div>
                    <p className="text-[13px] text-slate-700 leading-relaxed">
                        L'IA a identifié <strong>{INCIDENT_TYPE_LABELS[analysis.incidentType] || analysis.incidentType}</strong> —
                        catégorie <strong>{CATEGORY_LABELS[analysis.category] || analysis.category}</strong>.
                        Vérifiez les éléments ci-dessous, modifiez si nécessaire, puis soumettez.
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
                {/* Col 1 : image */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sticky top-4">
                        <div className="text-[10.5px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2">
                            Photo analysée
                        </div>
                        <div className="rounded-lg overflow-hidden border border-slate-200">
                            <img src={imagePreview} alt="Situation HSE" className="w-full h-auto" />
                        </div>
                    </div>
                </div>

                {/* Col 2-3 : analyse */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Titre + sévérité */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <SectionLabel>Titre (modifiable)</SectionLabel>
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => onEditedTitleChange(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-[14.5px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                            maxLength={100}
                        />

                        <div className="grid sm:grid-cols-3 gap-3 mt-4">
                            <div>
                                <SectionLabel>Type</SectionLabel>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-[13px] text-slate-800 font-medium">
                                    {INCIDENT_TYPE_LABELS[analysis.incidentType]}
                                </div>
                            </div>
                            <div>
                                <SectionLabel>Catégorie</SectionLabel>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-[13px] text-slate-800 font-medium">
                                    {CATEGORY_LABELS[analysis.category]}
                                </div>
                            </div>
                            <div>
                                <SectionLabel>Sévérité</SectionLabel>
                                <Select
                                    data={[
                                        { value: 'LOW', label: 'Faible' },
                                        { value: 'MEDIUM', label: 'Modérée' },
                                        { value: 'HIGH', label: 'Élevée' },
                                        { value: 'CRITICAL', label: 'Critique' },
                                    ]}
                                    value={editedSeverity}
                                    onChange={(v) => v && onEditedSeverityChange(v)}
                                    size="sm"
                                    styles={{
                                        input: {
                                            background: sev.bg,
                                            color: sev.text,
                                            borderColor: sev.border,
                                            fontWeight: 600,
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <SectionLabel>Description (modifiable)</SectionLabel>
                        <Textarea
                            value={editedDescription}
                            onChange={(e) => onEditedDescriptionChange(e.target.value)}
                            minRows={4}
                            autosize
                            styles={{ input: { fontSize: 13.5, lineHeight: 1.55 } }}
                        />
                    </div>

                    {/* Risques identifiés */}
                    {analysis.identifiedRisks?.length > 0 && (
                        <RisksMatrix risks={analysis.identifiedRisks} />
                    )}

                    {/* Actions correctives */}
                    {analysis.correctiveActions?.length > 0 && (
                        <CorrectiveActionsBox actions={analysis.correctiveActions} />
                    )}

                    {/* ISO clauses */}
                    {analysis.isoClauses?.length > 0 && (
                        <ISOClausesBox clauses={analysis.isoClauses} />
                    )}

                    {/* Hypothèse cause racine */}
                    {analysis.rootCauseHypothesis && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <IconAlertTriangle size={15} className="text-amber-600" />
                                <SectionLabel>Hypothèse de cause racine</SectionLabel>
                            </div>
                            <p className="text-[13.5px] text-slate-700 leading-relaxed">
                                {analysis.rootCauseHypothesis}
                            </p>
                        </div>
                    )}

                    {/* Plan de remédiation */}
                    {analysis.remediationPlan && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <IconClipboardCheck size={15} className="text-teal-700" />
                                <SectionLabel>Plan de remédiation proposé</SectionLabel>
                            </div>
                            <p className="text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-line">
                                {analysis.remediationPlan}
                            </p>
                        </div>
                    )}

                    {/* Actions globales */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                        <Button
                            variant="default"
                            leftSection={<IconArrowLeft size={15} />}
                            onClick={onBack}
                        >
                            Reprendre une photo
                        </Button>
                        <Button
                            size="md"
                            color="teal"
                            leftSection={<IconCheck size={16} />}
                            loading={submitting}
                            onClick={onSubmit}
                            styles={{
                                root: {
                                    background: 'linear-gradient(135deg, #0F766E 0%, #047857 100%)',
                                    boxShadow: '0 8px 20px -5px rgba(15,118,110,0.4)',
                                },
                            }}
                        >
                            Soumettre la déclaration
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-[10.5px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-1.5">
            {children}
        </div>
    );
}

function RisksMatrix({ risks }: { risks: IdentifiedRisk[] }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
                <IconFlame size={15} className="text-red-600" />
                <SectionLabel>Risques identifiés ({risks.length})</SectionLabel>
            </div>
            <div className="space-y-2.5">
                {risks.map((r, i) => {
                    const crit = r.gravity * r.probability;
                    const sevColor =
                        crit >= 16 ? '#DC2626' : crit >= 9 ? '#EA580C' : crit >= 4 ? '#CA8A04' : '#059669';
                    return (
                        <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] text-slate-900 font-medium">{r.risk}</div>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                                    <span>Gravité {r.gravity}/5</span>
                                    <span>·</span>
                                    <span>Probabilité {r.probability}/5</span>
                                </div>
                            </div>
                            <div
                                className="text-[14px] font-bold tabular-nums px-3 py-1.5 rounded-lg"
                                style={{ background: `${sevColor}15`, color: sevColor, border: `1px solid ${sevColor}40` }}
                            >
                                {crit}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CorrectiveActionsBox({ actions }: { actions: CorrectiveAction[] }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
                <IconShieldCheck size={15} className="text-teal-700" />
                <SectionLabel>Actions correctives proposées ({actions.length})</SectionLabel>
            </div>
            <div className="space-y-2.5">
                {actions.map((a, i) => {
                    const p = PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.P2;
                    return (
                        <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                        >
                            <span
                                className="text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap"
                                style={{ background: p.bg, color: p.text }}
                            >
                                {p.label}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] text-slate-900 font-medium">{a.action}</div>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                                    <span>Échéance : <strong>{a.deadline}</strong></span>
                                    <span>·</span>
                                    <span>{a.category}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ISOClausesBox({ clauses }: { clauses: string[] }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
                <IconCertificate size={15} className="text-indigo-700" />
                <SectionLabel>Clauses ISO applicables</SectionLabel>
            </div>
            <div className="flex flex-wrap gap-2">
                {clauses.map((c, i) => (
                    <span
                        key={i}
                        className="text-[12px] px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium"
                    >
                        {c}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ÉTAPE 4 : SUBMITTED
// ═══════════════════════════════════════════════════════════════════════

function SubmittedStep({ onNew, onClose }: { onNew: () => void; onClose: () => void }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-6">
                <IconCircleCheck size={40} className="text-emerald-600" stroke={1.5} />
            </div>
            <h3
                className="text-slate-900 mb-3"
                style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontWeight: 600,
                    fontSize: 28,
                }}
            >
                Déclaration soumise ✓
            </h3>
            <p className="text-[14px] text-slate-700 max-w-md mx-auto leading-relaxed mb-8">
                Votre déclaration a été enregistrée et est en attente de validation par l'équipe HSE.
                Vous recevrez une notification une fois traitée.
            </p>
            <div className="flex items-center justify-center gap-3">
                <Button variant="default" leftSection={<IconArrowLeft size={14} />} onClick={onClose}>
                    Retour aux incidents
                </Button>
                <Button
                    color="indigo"
                    leftSection={<IconCamera size={14} />}
                    onClick={onNew}
                >
                    Nouvelle déclaration
                </Button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// MODAL AIDE
// ═══════════════════════════════════════════════════════════════════════

function HelpContent() {
    const steps = [
        {
            title: '1. Prenez la photo',
            text: 'Photographiez la situation que vous voulez déclarer (échafaudage non sécurisé, EPI manquant, fuite, etc.). Vous pouvez utiliser la caméra de votre téléphone ou téléverser une image existante.',
        },
        {
            title: '2. Ajoutez du contexte (optionnel)',
            text: 'Indiquez le site, le département et un commentaire libre. Plus l\'IA a de contexte, plus son analyse sera précise.',
        },
        {
            title: '3. L\'IA analyse',
            text: 'Claude Vision analyse l\'image, détecte les éléments HSE, identifie les risques, estime la sévérité et propose des actions correctives selon ISO 45001 / 31000.',
        },
        {
            title: '4. Vous validez',
            text: 'Vérifiez les informations pré-remplies. Vous pouvez modifier le titre, la description et la sévérité. Les autres champs sont indicatifs.',
        },
        {
            title: '5. Soumission',
            text: 'L\'incident est créé en statut "à valider HSE". L\'équipe HSE le confirme ou le rejette, puis lance les actions correctives.',
        },
    ];

    return (
        <div className="space-y-4">
            <p className="text-[14px] text-slate-700 leading-relaxed">
                Ce module utilise l'intelligence artificielle Claude Vision (Anthropic) pour analyser
                une photo et pré-remplir automatiquement votre déclaration d'incident.
            </p>
            <div className="space-y-3 mt-4">
                {steps.map((s, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-[13.5px]">
                            <div className="font-semibold text-slate-900 mb-1">{s.title}</div>
                            <p className="text-slate-700 leading-relaxed">{s.text}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-[12.5px] text-amber-800 leading-relaxed mt-4">
                <strong>Limitations actuelles :</strong> l'IA peut se tromper. Vérifiez toujours
                l'analyse avant soumission. En cas d'urgence vitale, utilisez le bouton SOS en haut de
                page — pas l'IA.
            </div>
        </div>
    );
}
