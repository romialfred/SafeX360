
export type NonConformity = {
    id: string;
    reference: string;
    eventType: 'Non-Conformity' | 'Near Miss';
    title?: string;
    reportDate?: string;
    detectionDate: string;
    detectedBy?: string;
    workArea?: string;
    workProcess?: string;
    location?: string;
    site: string;
    emitter: string;
    nature: 'Produit' | 'Fonctionnement' | 'Service';
    description: string;
    impact: string;
    status: 'Declaration' | 'Analyse' | 'Traitement' | 'Cloture' | 'Diffusion';
    priority: 'Faible' | 'Moyenne' | 'Élevée' | 'Critique';
    assignedTo: string;
    riskCategory?: string;
    // Non-Conformity specific fields
    requirementNotMet?: string;
    sourceOfDetection?: string;
    severityLevel?: 'Minor' | 'Major' | 'Critical';
    immediateAction?: string;
    // Near Miss specific fields
    nearMissType?: string;
    contributingFactors?: string[];
    immediateCorrectiveAction?: string;
    improvementOpportunity?: string;
    lessonsLearned?: string;
    analysisMethod?: string;
    piloteAnalyse?: string;
    piloteTraitement?: string;
    piloteCloture?: string;
    processus?: string;
    causeDefaut?: string;
    degreGravite?: string;
    origineCause?: 'Interne' | 'Prestataire externe' | 'Client';
    createdAt: string;
    updatedAt: string;
};