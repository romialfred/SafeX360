/**
 * demoProcedures — Base de connaissances HSE de l'Assistant IA.
 *
 * Deux procédures opérationnelles complètes (mine à ciel ouvert) :
 *   1. PROC-HSE-014 — Travail en hauteur
 *   2. PROC-URG-007 — Évacuation en cas de contamination toxique de l'air
 *
 * Chaque procédure porte : un contenu markdown structuré (rendu ReactMarkdown)
 * + un workflow d'étapes COLORÉES (charte R7 : cyan=préparation,
 * violet=vérification, amber=exécution, rose=urgence/point d'arrêt,
 * orange=contrôle continu, emerald=clôture) rendu par <WorkflowDiagram/>.
 *
 * Le déclenchement est tolérant (accents ignorés) : « travail en hauteur »,
 * « évacuation … toxique/contamination/gaz », etc.
 */

/* ─── Types ─────────────────────────────────────────────────────────── */

export type WorkflowTone = 'cyan' | 'violet' | 'amber' | 'rose' | 'orange' | 'emerald';

export interface WorkflowStep {
    num: number;
    title: string;
    detail: string;
    tone: WorkflowTone;
    /** Étape bloquante : impossible de continuer sans validation. */
    holdPoint?: boolean;
}

export interface DemoProcedure {
    id: string;
    /** Résumé court pour la synthèse vocale de l'assistant flottant. */
    speechSummary: string;
    markdown: string;
    workflow: WorkflowStep[];
    workflowTitle: string;
}

/* ─── Détection de la question (accents ignorés) ────────────────────── */

const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function matchDemoProcedure(userInput: string): DemoProcedure | null {
    const q = normalize(userInput);
    if (q.includes('hauteur') || q.includes('height') || q.includes('antichute') || q.includes('harnais')) {
        return WORK_AT_HEIGHT;
    }
    const evac = q.includes('evacuation') || q.includes('evacuer') || q.includes('urgence');
    const toxic = q.includes('toxique') || q.includes('contamination') || q.includes('gaz')
        || q.includes('produit chimique') || q.includes('atmosphere') || q.includes('h2s')
        || q.includes('vapeur') || q.includes('air');
    if ((evac && toxic) || q.includes('contamination')) {
        return TOXIC_EVACUATION;
    }
    return null;
}

/* ─── Procédure 1 : Travail en hauteur ──────────────────────────────── */

const WORK_AT_HEIGHT: DemoProcedure = {
    id: 'PROC-HSE-014',
    speechSummary:
        "Voici la procédure de travail en hauteur PROC-HSE-014. Elle s'applique à tout travail au-dessus de 1 mètre 80. "
        + "Huit étapes : permis de travail, analyse des risques sur site, vérification des équipements antichute, "
        + "validation du superviseur HSE qui est un point d'arrêt obligatoire, balisage de la zone, exécution avec "
        + "ancrage permanent et surveillant dédié, contrôle continu des conditions, puis clôture du permis. "
        + "Règle d'or : cent pour cent d'ancrage, jamais seul, arrêt immédiat si les conditions changent.",
    workflowTitle: 'Workflow — Permis de travail en hauteur (8 étapes)',
    markdown: `## 🏗️ Procédure de travail en hauteur — PROC-HSE-014

**Objet :** prévenir les chutes de hauteur, première cause d'accident grave sur les sites miniers.
**Domaine d'application :** tout travail effectué à **1,80 m ou plus** au-dessus du sol ou d'un plan de réception (passerelles de crible, silos, pelles et tombereaux, pylônes, cuves, fronts de taille).
**Références :** ISO 45001 §8.1.2 (hiérarchie des mesures) · EN 363 (systèmes d'arrêt des chutes) · Règlement minier — travaux en élévation · Politique HSE SafeX 360.

---

### 🎯 Principes fondamentaux (hiérarchie des mesures)

1. **Éliminer** : privilégier le travail au sol (pré-assemblage, outils télescopiques, drones d'inspection).
2. **Protection collective d'abord** : garde-corps, plateformes, nacelles PEMP, filets.
3. **Protection individuelle en dernier recours** : système d'arrêt de chute complet (harnais + longe absorbeur + ancrage ≥ 12 kN).

### 🦺 EPI obligatoires

| Équipement | Exigence |
|---|---|
| Harnais intégral | EN 361, vérifié < 12 mois, inspection visuelle avant CHAQUE usage |
| Longe double avec absorbeur | EN 355 — connexion 100 % du temps (ancrage permanent) |
| Casque à jugulaire | EN 397 + mentonnière 3 points |
| Chaussures de sécurité | S3, semelle antidérapante |
| Trousse + moyen d'alerte | Radio ou SafeX SOS sur chaque intervenant |

### 📋 Conditions d'arrêt immédiat (STOP WORK)

- Vent **> 40 km/h** (nacelle) ou > 60 km/h (structure) · Orage à moins de 10 km
- Ancrage douteux, EPI endommagé, garde-corps manquant
- Intervenant seul, fatigue, malaise — **le droit de retrait s'applique sans justification**

### 🚑 Plan de sauvetage (obligatoire AVANT le début des travaux)

Un travailleur suspendu dans son harnais doit être secouru en **moins de 15 minutes** (syndrome du harnais).
Le kit de sauvetage (descendeur + perche) est positionné au pied de l'ouvrage, et le surveillant est formé à son usage.

### 👥 Responsabilités

- **Intervenant** : inspection EPI, respect du permis, ancrage permanent, signalement immédiat.
- **Surveillant dédié (homme de garde)** : contact visuel/radio permanent, ne quitte JAMAIS son poste, déclenche le sauvetage.
- **Superviseur HSE** : valide le permis (point d'arrêt), contrôle terrain inopiné, clôture.

> ⛔ **Règle d'or : 100 % d'ancrage, 100 % du temps. Jamais seul. En cas de doute → STOP.**`,
    workflow: [
        {
            num: 1, tone: 'cyan', title: 'Permis de travail en hauteur',
            detail: 'Demande dans SafeX 360 (module Inspections/Permis) : description, durée, plan de la zone, intervenants habilités « travaux en hauteur ».',
        },
        {
            num: 2, tone: 'cyan', title: 'Analyse de risques sur site (JSA)',
            detail: 'Évaluation au poste : hauteur, points d\'ancrage ≥ 12 kN, co-activité, météo, état des surfaces. Mesures compensatoires consignées.',
        },
        {
            num: 3, tone: 'violet', title: 'Vérification des équipements & EPI',
            detail: 'Inspection croisée harnais/longes/connecteurs (coutures, corrosion, indicateurs de chute), nacelle avec VGP à jour, échafaudage réceptionné (étiquette verte).',
        },
        {
            num: 4, tone: 'rose', holdPoint: true, title: 'POINT D\'ARRÊT — Validation superviseur HSE',
            detail: 'Aucun début de travaux sans signature du superviseur HSE sur le permis + brief sécurité (toolbox talk) avec tous les intervenants et le surveillant.',
        },
        {
            num: 5, tone: 'amber', title: 'Balisage & protection de la zone',
            detail: 'Périmètre balisé sous la zone de travail (chute d\'objets), panneautage, outils longés, filets si co-activité impossible à supprimer.',
        },
        {
            num: 6, tone: 'amber', title: 'Exécution — ancrage 100 %',
            detail: 'Connexion permanente (longe double pour les déplacements), 3 points de contact aux échelles, surveillant dédié en contact visuel/radio continu.',
        },
        {
            num: 7, tone: 'orange', title: 'Contrôle continu des conditions',
            detail: 'Surveillance météo (vent, orage), état des intervenants (fatigue, hydratation), re-validation du permis à chaque pause > 1 h ou changement de conditions.',
        },
        {
            num: 8, tone: 'emerald', title: 'Clôture du permis & retour d\'expérience',
            detail: 'Zone nettoyée et débalisée, EPI rangés et défauts signalés, permis clôturé dans SafeX 360, anomalies remontées en observation HSE.',
        },
    ],
};

/* ─── Procédure 2 : Évacuation — contamination toxique de l'air ─────── */

const TOXIC_EVACUATION: DemoProcedure = {
    id: 'PROC-URG-007',
    speechSummary:
        "Voici la procédure d'évacuation en cas de contamination toxique de l'air, PROC-URG-007. "
        + "Huit étapes : détection et alarme, alerte générale via SafeX SOS, arrêt et mise en sécurité des équipements, "
        + "évacuation perpendiculaire au vent vers les points de rassemblement, comptage nominatif, recherche des manquants "
        + "par l'équipe équipée d'appareils respiratoires, mesures atmosphériques, puis autorisation de retour. "
        + "Règles absolues : ne jamais traverser le nuage, ne jamais revenir en arrière, se couvrir les voies respiratoires.",
    workflowTitle: 'Workflow — Évacuation contamination toxique (8 étapes)',
    markdown: `## ☣️ Procédure d'évacuation — contamination toxique de l'air — PROC-URG-007

**Objet :** protéger le personnel en cas de présence anormale de **gaz, vapeurs ou poussières toxiques** dans l'air (CO, H₂S, NOₓ après tir, SO₂, vapeurs de cyanure, poussières de silice en concentration aiguë).
**Domaine d'application :** ensemble du site — fosse, usine de traitement, laboratoire, zones de stockage de réactifs, ateliers.
**Références :** ISO 45001 §8.2 (préparation aux situations d'urgence) · Plan d'Urgence Interne (PUI) · Fiches FDS des réactifs · Seuils VLE/VME réglementaires.

---

### 🚨 Déclencheurs de la procédure

- **Alarme d'un détecteur fixe** (seuil 2 = évacuation) ou **portatif** (bip continu)
- Odeur suspecte (œuf pourri = H₂S — ⚠️ l'odorat sature au-delà de 100 ppm !), nuage ou fumée visible
- Symptômes chez un collègue : vertiges, nausées, irritation des yeux/gorge, perte de connaissance
- Message d'alerte **SafeX 360 — Alerte générale** (sirène 3 tons montants)

### 🧭 Règles absolues pendant l'évacuation

1. **NE JAMAIS traverser le nuage** — s'éloigner **perpendiculairement au vent** (manches à air oranges).
2. **NE JAMAIS revenir en arrière** chercher des effets personnels ou un collègue sans équipement.
3. Se couvrir le nez et la bouche (masque d'évacuation des postes de repli, à défaut linge humide).
4. Gagner le **point de rassemblement AMONT-VENT** indiqué par le chef de zone (gilet orange).
5. Ne **jamais** utiliser les vestiaires/réfectoires comme refuge — uniquement les points de rassemblement.

### 🆘 Victimes et secours

- Toute personne **incommodée** est signalée au comptage et prise en charge par les secouristes (oxygénothérapie si CO/H₂S).
- Seule **l'équipe d'intervention équipée d'ARI** (appareil respiratoire isolant) est autorisée à entrer en zone contaminée.
- Évacuation médicale : coordination via le module **Urgences SafeX 360** (SOS + géolocalisation).

### 👥 Rôles

- **Coordinateur d'urgence** : déclenche l'alerte générale, décide de l'évacuation totale/partielle, autorise le retour.
- **Chefs de zone (gilets oranges)** : guident vers le bon point de rassemblement, effectuent le comptage nominatif.
- **Équipe d'intervention ARI** : recherche des manquants, mesures, sécurisation de la source.
- **Tout le personnel** : évacue immédiatement, se compte, signale les manquants.

> ⛔ **Le retour en zone n'est autorisé QUE par le coordinateur d'urgence, après deux mesures atmosphériques conformes espacées de 15 minutes.**`,
    workflow: [
        {
            num: 1, tone: 'rose', title: 'Détection & alarme locale',
            detail: 'Détecteur fixe/portatif en alarme, odeur anormale ou malaise d\'un collègue. Celui qui détecte donne l\'alerte SANS s\'exposer (ne pas s\'approcher de la source).',
        },
        {
            num: 2, tone: 'rose', holdPoint: true, title: 'ALERTE GÉNÉRALE — SafeX SOS',
            detail: 'Déclenchement de l\'Alerte générale SafeX 360 (sirène 3 tons + notification géolocalisée à tout le site). Le coordinateur d\'urgence prend la direction des opérations.',
        },
        {
            num: 3, tone: 'amber', title: 'Arrêt & mise en sécurité des équipements',
            detail: 'Arrêt d\'urgence des procédés concernés (pompes réactifs, convoyeurs, ventilation forcée vers zones occupées), coupure des sources d\'ignition si gaz inflammable.',
        },
        {
            num: 4, tone: 'amber', title: 'Évacuation perpendiculaire au vent',
            detail: 'Sortie calme et rapide, masque d\'évacuation, direction PERPENDICULAIRE au vent (manches à air), vers le point de rassemblement amont-vent désigné par les chefs de zone.',
        },
        {
            num: 5, tone: 'violet', title: 'Comptage nominatif',
            detail: 'Aux points de rassemblement : appel nominatif par les chefs de zone (listes de pointage SafeX), croisement avec le registre des visiteurs et sous-traitants.',
        },
        {
            num: 6, tone: 'rose', title: 'Recherche des manquants — équipe ARI uniquement',
            detail: 'Tout manquant est signalé au coordinateur. SEULE l\'équipe d\'intervention sous appareil respiratoire isolant entre en zone. Binôme obligatoire + ligne de vie.',
        },
        {
            num: 7, tone: 'orange', title: 'Mesures atmosphériques & levée de doute',
            detail: 'Cartographie des concentrations (détecteurs multigaz étalonnés). Identification et neutralisation de la source. Deux mesures conformes espacées de 15 min exigées.',
        },
        {
            num: 8, tone: 'emerald', title: 'Autorisation de retour & retour d\'expérience',
            detail: 'Retour autorisé UNIQUEMENT par le coordinateur d\'urgence. Déclaration d\'incident dans SafeX 360, analyse des causes, mise à jour du PUI et débriefing à chaud.',
        },
    ],
};

/* ─── Rendu du workflow coloré ──────────────────────────────────────── */

const TONE_STYLES: Record<WorkflowTone, { chip: string; card: string; arrow: string; label: string }> = {
    cyan: { chip: 'bg-cyan-600', card: 'border-l-cyan-500 bg-cyan-50', arrow: 'text-cyan-400', label: 'Préparation' },
    violet: { chip: 'bg-violet-600', card: 'border-l-violet-500 bg-violet-50', arrow: 'text-violet-400', label: 'Vérification' },
    amber: { chip: 'bg-amber-500', card: 'border-l-amber-500 bg-amber-50', arrow: 'text-amber-400', label: 'Exécution' },
    rose: { chip: 'bg-rose-600', card: 'border-l-rose-500 bg-rose-50', arrow: 'text-rose-400', label: 'Urgence / point d\'arrêt' },
    orange: { chip: 'bg-orange-500', card: 'border-l-orange-500 bg-orange-50', arrow: 'text-orange-400', label: 'Contrôle continu' },
    emerald: { chip: 'bg-emerald-600', card: 'border-l-emerald-500 bg-emerald-50', arrow: 'text-emerald-400', label: 'Clôture' },
};

export function WorkflowDiagram({ title, steps }: { title: string; steps: WorkflowStep[] }) {
    const tonesUsed = [...new Set(steps.map((s) => s.tone))];
    return (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[13px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" />
                {title}
            </div>

            <div className="space-y-0">
                {steps.map((step, i) => {
                    const s = TONE_STYLES[step.tone];
                    return (
                        <div key={step.num}>
                            <div className={`flex items-start gap-3 rounded-lg border border-gray-100 border-l-4 ${s.card} p-3`}>
                                <span className={`flex-shrink-0 w-7 h-7 rounded-full ${s.chip} text-white text-[12px] font-bold flex items-center justify-center mt-0.5`}>
                                    {step.num}
                                </span>
                                <div className="min-w-0">
                                    <div className="text-[13px] font-semibold text-gray-900 leading-snug">
                                        {step.title}
                                        {step.holdPoint && (
                                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-rose-600 text-white align-middle">
                                                Bloquant
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[12px] text-gray-600 leading-relaxed mt-0.5">{step.detail}</div>
                                </div>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`flex justify-center py-0.5 ${TONE_STYLES[steps[i + 1].tone].arrow}`} aria-hidden="true">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 4v14m0 0l-5-5m5 5l5-5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Légende des couleurs */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 pt-3 border-t border-gray-100">
                {tonesUsed.map((tone) => (
                    <span key={tone} className="inline-flex items-center gap-1.5 text-[10.5px] text-gray-500">
                        <span className={`w-2.5 h-2.5 rounded-full ${TONE_STYLES[tone].chip}`} />
                        {TONE_STYLES[tone].label}
                    </span>
                ))}
            </div>
        </div>
    );
}
