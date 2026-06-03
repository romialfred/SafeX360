import { Accordion, ActionIcon, ThemeIcon, Tooltip } from '@mantine/core';
import {
    IconHelpCircle,
    IconHash,
    IconFileText,
    IconCalendar,
    IconClock,
    IconShield,
    IconAlertTriangle,
    IconMapPin,
    IconBuilding,
    IconActivity,
    IconCloud,
    IconUser,
    IconUsers,
    IconEye,
    IconPaperclip,
    IconChartBar,
    IconChartDots3,
    IconScale,
    IconLock,
    IconX,
} from '@tabler/icons-react';

/**
 * Panneau d'aide latéral pour le formulaire de déclaration d'incident.
 * Refonte 2.a — Mantine Accordion sobre, texte raffiné, ISO-conforme.
 *
 * Convention :
 *  - Accordions repliables (l'utilisateur ouvre uniquement ce dont il a besoin)
 *  - Tokens slate neutres + couleur sémantique HSE uniquement sur l'icône
 *  - Pas de fonds colorés tape-à-l'œil — palette sobre éditeur logiciel pro
 *  - Textes courts, précis, références ISO citées quand pertinent
 */

interface HelpItem {
    key: string;
    icon: typeof IconHash;
    iconColor: string;
    title: string;
    content: string;
    isoRef?: string;
}

const stepHelp: Record<number, { title: string; subtitle: string; items: HelpItem[] }> = {
    0: {
        title: "Identification de l'incident",
        subtitle: "Renseignez les informations essentielles à la traçabilité.",
        items: [
            {
                key: 'number',
                icon: IconHash,
                iconColor: 'slate',
                title: "Numéro d'incident",
                content: "Identifiant unique généré automatiquement à la soumission (format INC-AAAA-NNNN).",
            },
            {
                key: 'title',
                icon: IconFileText,
                iconColor: 'teal',
                title: 'Titre',
                content: "Description courte et factuelle (max. 80 caractères). Exemple : « Chute d'objet en zone de stockage Atelier 2 ».",
            },
            {
                key: 'occurred',
                icon: IconCalendar,
                iconColor: 'orange',
                title: 'Date & heure de survenance',
                content: "Moment exact où l'incident s'est produit. Si inconnu, utiliser la fourchette estimée la plus précise possible.",
                isoRef: 'ISO 45001 §10.2.1.a',
            },
            {
                key: 'discovery',
                icon: IconClock,
                iconColor: 'indigo',
                title: 'Date & heure de découverte',
                content: 'Moment où l\'incident a été détecté ou signalé. Peut différer de la survenance pour les événements environnementaux différés.',
            },
            {
                key: 'category',
                icon: IconAlertTriangle,
                iconColor: 'red',
                title: 'Catégorie & type',
                content: "Classification HSE : accident corporel (LTI/MTI/FAI), quasi-accident, situation dangereuse, incident environnemental, etc.",
                isoRef: 'ISO 45001 §3.35',
            },
            {
                key: 'ppe',
                icon: IconShield,
                iconColor: 'yellow',
                title: 'EPI concernés',
                content: 'Équipements de protection individuelle portés au moment de l\'événement ou qui auraient dû être portés.',
            },
            {
                key: 'location',
                icon: IconMapPin,
                iconColor: 'pink',
                title: 'Lieu',
                content: 'Localisation physique précise. Cascade : Site → Zone → Sous-zone si disponible. Activer le GPS sur mobile pour précision terrain.',
            },
            {
                key: 'organization',
                icon: IconBuilding,
                iconColor: 'cyan',
                title: 'Département & zone de travail',
                content: "Unité organisationnelle responsable et zone fonctionnelle où l'événement s'est produit.",
            },
            {
                key: 'process',
                icon: IconActivity,
                iconColor: 'green',
                title: 'Processus de travail',
                content: "Activité en cours au moment de l'incident (ex. soudage, forage, transport de matières dangereuses).",
            },
            {
                key: 'weather',
                icon: IconCloud,
                iconColor: 'blue',
                title: 'Conditions météorologiques',
                content: 'Facteurs environnementaux pouvant avoir contribué (pluie, harmattan, brouillard, chaleur extrême...).',
            },
        ],
    },
    1: {
        title: "Témoins & personnes impliquées",
        subtitle: "Identification des acteurs pour traçabilité et investigation.",
        items: [
            {
                key: 'reporter',
                icon: IconUser,
                iconColor: 'teal',
                title: 'Déclarant',
                content: "Personne qui rapporte l'incident. Par défaut : utilisateur connecté. Modifiable si déclaration faite pour compte de tiers.",
                isoRef: 'ISO 45001 §10.2.1.b',
            },
            {
                key: 'involved',
                icon: IconUsers,
                iconColor: 'red',
                title: 'Personnes impliquées',
                content: 'Tout employé ou sous-traitant directement concerné par l\'événement (blessé, exposé, opérateur de l\'équipement).',
            },
            {
                key: 'witnesses',
                icon: IconEye,
                iconColor: 'orange',
                title: 'Témoins',
                content: "Personnes ayant observé l'incident sans en être impliquées. Leurs témoignages enrichissent l'analyse causale.",
            },
            {
                key: 'evidence',
                icon: IconPaperclip,
                iconColor: 'indigo',
                title: 'Preuves & pièces jointes',
                content: 'Photos (avec géolocalisation), schémas, documents. Formats acceptés : JPG, PNG, PDF, MP4. Maximum 10 Mo par fichier.',
                isoRef: 'ISO 45001 §7.5.3',
            },
        ],
    },
    2: {
        title: "Analyse causale",
        subtitle: "Comprendre les causes profondes pour prévenir la récurrence.",
        items: [
            {
                key: 'factual',
                icon: IconFileText,
                iconColor: 'slate',
                title: 'Description factuelle',
                content: "Récit chronologique et objectif des faits. Éviter les interprétations ou jugements. Privilégier le « qui, quoi, où, quand, comment ».",
            },
            {
                key: 'immediate',
                icon: IconAlertTriangle,
                iconColor: 'red',
                title: 'Causes immédiates',
                content: 'Actes ou conditions ayant directement déclenché l\'événement (ex. non-port d\'EPI, défaillance équipement, mauvaise procédure).',
            },
            {
                key: 'root',
                icon: IconChartDots3,
                iconColor: 'orange',
                title: 'Causes profondes',
                content: 'Facteurs organisationnels ou systémiques sous-jacents (formation insuffisante, culture sécurité, conception, maintenance).',
                isoRef: 'ISO 45001 §10.2.1.c',
            },
            {
                key: 'contributing',
                icon: IconActivity,
                iconColor: 'yellow',
                title: 'Facteurs contributifs',
                content: 'Conditions additionnelles ayant aggravé ou facilité l\'incident (fatigue, pression production, météo, ergonomie).',
            },
            {
                key: 'immediateConseq',
                icon: IconChartBar,
                iconColor: 'cyan',
                title: 'Conséquences immédiates',
                content: 'Impacts directs constatés (blessures, dégâts matériels, arrêt de production, pollution).',
            },
            {
                key: 'potentialConseq',
                icon: IconScale,
                iconColor: 'red',
                title: 'Conséquences potentielles',
                content: "Ce qui aurait pu se produire dans le pire scénario. Critique pour évaluer la sévérité réelle d'un quasi-accident.",
            },
            {
                key: 'immediateAct',
                icon: IconShield,
                iconColor: 'green',
                title: 'Actions immédiates',
                content: 'Mesures prises sur le champ pour sécuriser la zone, soigner les blessés, contenir la pollution, arrêter l\'activité.',
            },
        ],
    },
    3: {
        title: "Évaluation du risque",
        subtitle: "Matrice probabilité × gravité conforme ICMM/ISO 31000.",
        items: [
            {
                key: 'probability',
                icon: IconChartBar,
                iconColor: 'blue',
                title: 'Probabilité (1–5)',
                content: '1 = Très improbable · 2 = Improbable · 3 = Possible · 4 = Probable · 5 = Très probable. Basé sur la fréquence historique des événements similaires.',
            },
            {
                key: 'severity',
                icon: IconAlertTriangle,
                iconColor: 'red',
                title: 'Gravité (1–5)',
                content: '1 = Négligeable · 2 = Mineure · 3 = Modérée · 4 = Majeure · 5 = Catastrophique (fatalité, invalidité permanente, pollution majeure).',
                isoRef: 'ISO 31000',
            },
            {
                key: 'riskLevel',
                icon: IconScale,
                iconColor: 'orange',
                title: 'Niveau de risque',
                content: 'Score = Probabilité × Gravité. Faible (1-6), Modéré (7-12), Élevé (13-19), Critique (20-25). Pilote la priorisation CAPA.',
            },
            {
                key: 'controls',
                icon: IconShield,
                iconColor: 'green',
                title: 'Contrôles existants',
                content: "Mesures de prévention/protection déjà en place (hiérarchie ISO 45001 §8.1.2 : Élimination → Substitution → Ingénierie → Administratif → EPI).",
            },
            {
                key: 'residual',
                icon: IconLock,
                iconColor: 'teal',
                title: 'Risque résiduel',
                content: 'Risque restant après application des contrôles. Doit être ALARP (As Low As Reasonably Practicable). Sinon, déclencher des actions complémentaires.',
            },
        ],
    },
};

const colorClassMap: Record<string, { bg: string; text: string; ring: string }> = {
    slate: { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200' },
    red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
    yellow: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
    green: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', ring: 'ring-cyan-200' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-700', ring: 'ring-pink-200' },
};

const ReportHelp = ({ activeStep, onClose }: { activeStep: number; onClose?: () => void }) => {
    const help = stepHelp[activeStep] ?? stepHelp[0];

    return (
        <aside className="sticky top-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header sobre avec bouton de fermeture du volet */}
                <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-teal-50 border border-teal-200 flex-shrink-0">
                            <IconHelpCircle size={16} className="text-teal-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm text-slate-900 leading-tight">
                                Aide : {help.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                                {help.subtitle}
                            </p>
                        </div>
                        {onClose && (
                            <Tooltip label="Fermer le volet d'aide">
                                <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="gray"
                                    onClick={onClose}
                                    aria-label="Fermer le volet d'aide"
                                    className="flex-shrink-0"
                                >
                                    <IconX size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </div>
                </div>

                {/* Accordion items — repliable */}
                <Accordion
                    multiple
                    variant="default"
                    chevronPosition="right"
                    styles={{
                        item: {
                            borderTop: '1px solid #E2E8F0',
                            borderBottom: 'none',
                            backgroundColor: 'transparent',
                        },
                        control: {
                            padding: '10px 14px',
                            '&:hover': { backgroundColor: '#F8FAFC' },
                        },
                        label: { padding: 0, fontSize: '13px', fontWeight: 500, color: '#0F172A' },
                        panel: { padding: '0 14px 12px 14px' },
                        content: { paddingTop: 0 },
                        chevron: { color: '#94A3B8' },
                    }}
                >
                    {help.items.map((item) => {
                        const colors = colorClassMap[item.iconColor] || colorClassMap.slate;
                        return (
                            <Accordion.Item key={item.key} value={item.key}>
                                <Accordion.Control>
                                    <div className="flex items-center gap-2.5">
                                        <ThemeIcon size="sm" radius="md" variant="light" className={`${colors.bg} ${colors.text}`}>
                                            <item.icon size={14} stroke={2} />
                                        </ThemeIcon>
                                        <span>{item.title}</span>
                                    </div>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <div className="pl-8 -mt-1">
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {item.content}
                                        </p>
                                        {item.isoRef && (
                                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                                                <span className="text-[10px] uppercase tracking-wider text-slate-500">Réf.</span>
                                                <span className="text-[10px] text-slate-700">{item.isoRef}</span>
                                            </div>
                                        )}
                                    </div>
                                </Accordion.Panel>
                            </Accordion.Item>
                        );
                    })}
                </Accordion>

                {/* Footer info — astuce contextuelle */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200">
                    <p className="text-[11px] text-slate-500 leading-snug">
                        💡 <span className="text-slate-700">Astuce :</span> Vous pouvez sauvegarder en brouillon à tout moment et compléter la déclaration plus tard. Les champs marqués <span className="text-red-500">*</span> sont obligatoires uniquement à la soumission finale.
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default ReportHelp;
