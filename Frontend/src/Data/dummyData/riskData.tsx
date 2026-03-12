export interface RiskData {
    id: string;
    title: string;
    riskDescription: string;
    department: string;
    workProcess: string;
    zone: string;
    hazardSource: string;
    potentialConsequences: string;
    gravity: string;
    probability: string;
    severity: string;
    riskLevel: string;
    currentControls: string;
    additionalControls: string;
    preventiveMeasures: string;
    owner: string;
    status: string;
    dateCreated: string;
    reviewDate: string;
    isoReference: string;
    revisionHistory: Array<{
        version: string;
        date: string;
        changes: string;
        author: string;
    }>;
    documents: Array<{
        name: string;
        type: string;
        url: string;
    }>;
}

export const riskData: RiskData[] = [
    {
        id: 'RISK-001',
        title: 'Risques de glissade en production',
        riskDescription: 'Slip, trip and fall hazards in production area due to wet floors',
        department: 'Manufacturing',
        workProcess: 'Machine Operation',
        zone: 'A - Production',
        hazardSource: 'Wet floors from cleaning operations',
        potentialConsequences: 'Employee injury, lost time incidents',
        gravity: 'Medium',
        probability: 'Possible',
        severity: 'Moderate',
        riskLevel: 'Medium',
        currentControls: 'Warning signs, non-slip mats, regular cleaning schedule',
        additionalControls: 'Install drainage system, anti-slip coating on floors',
        preventiveMeasures: 'Formation du personnel sur les risques de glissade, inspection quotidienne des sols, maintenance préventive des équipements de nettoyage',
        owner: 'Sarah Johnson',
        status: 'Partiellement contrôlé',
        dateCreated: '2025-01-15',
        reviewDate: '2025-04-15',
        isoReference: 'ISO 45001:2018 - 8.1.2 Élimination des dangers et réduction des risques',
        revisionHistory: [
            {
                version: '1.0',
                date: '2025-01-15',
                changes: 'Création initiale du risque',
                author: 'Sarah Johnson'
            },
            {
                version: '1.1',
                date: '2025-01-20',
                changes: 'Réévaluation suite à incident mineur - amélioration des contrôles',
                author: 'Sarah Johnson'
            },
            {
                version: '1.2',
                date: '2025-01-25',
                changes: 'Installation de revêtement antidérapant - réduction du niveau de risque',
                author: 'Mike Wilson'
            }
        ],
        documents: [
            {
                name: 'Procédure de nettoyage',
                type: 'PDF',
                url: '#'
            }
        ]
    },
    {
        id: 'RISK-002',
        title: 'Exposition aux produits chimiques',
        riskDescription: 'Chemical exposure during cleaning operations',
        department: 'Maintenance',
        workProcess: 'Chemical Processing',
        zone: 'B - Maintenance',
        hazardSource: 'Cleaning chemicals and solvents',
        potentialConsequences: 'Respiratory issues, skin irritation, chemical burns',
        gravity: 'High',
        probability: 'Likely',
        severity: 'Major',
        riskLevel: 'Critical',
        currentControls: 'PPE requirements, ventilation systems, MSDS available',
        additionalControls: 'Enhanced ventilation, chemical substitution program',
        preventiveMeasures: 'Formation obligatoire sur manipulation des produits chimiques, contrôles médicaux réguliers, procédures d\'urgence en cas d\'exposition',
        owner: 'Mike Wilson',
        status: 'Non contrôlé',
        dateCreated: '2025-01-10',
        reviewDate: '2025-02-10',
        isoReference: 'ISO 45001:2018 - 8.2 Gestion du changement',
        revisionHistory: [
            {
                version: '1.0',
                date: '2025-01-10',
                changes: 'Création initiale du risque',
                author: 'Mike Wilson'
            },
            {
                version: '1.1',
                date: '2025-01-12',
                changes: 'Mise à jour des contrôles existants',
                author: 'Mike Wilson'
            },
            {
                version: '1.2',
                date: '2025-01-18',
                changes: 'Réévaluation après formation du personnel - amélioration des procédures',
                author: 'Safety Team'
            },
            {
                version: '1.3',
                date: '2025-01-22',
                changes: 'Installation nouveau système de ventilation - réduction exposition',
                author: 'Mike Wilson'
            },
            {
                version: '1.4',
                date: '2025-01-28',
                changes: 'Audit de conformité - validation des améliorations',
                author: 'External Auditor'
            }
        ],
        documents: [
            {
                name: 'Fiche de données de sécurité',
                type: 'PDF',
                url: '#'
            },
            {
                name: 'Procédure EPI',
                type: 'DOC',
                url: '#'
            }
        ]
    },
    {
        id: 'RISK-003',
        title: 'Choc électrique équipements défaillants',
        riskDescription: 'Electrical shock from faulty equipment',
        department: 'Engineering',
        workProcess: 'Electrical Work',
        zone: 'C - Engineering',
        hazardSource: 'Aging electrical equipment and wiring',
        potentialConsequences: 'Electrical shock, electrocution, equipment damage',
        gravity: 'High',
        probability: 'Unlikely',
        severity: 'Catastrophic',
        riskLevel: 'High',
        currentControls: 'Regular inspections, lockout/tagout procedures, trained personnel',
        additionalControls: 'Equipment replacement program, enhanced training',
        preventiveMeasures: 'Inspection électrique mensuelle, formation habilitation électrique, mise à jour des schémas électriques',
        owner: 'David Chen',
        status: 'Sous contrôle',
        dateCreated: '2025-01-08',
        reviewDate: '2025-03-08',
        isoReference: 'ISO 45001:2018 - 8.1.4 Approvisionnement',
        revisionHistory: [
            {
                version: '1.0',
                date: '2025-01-08',
                changes: 'Création initiale du risque',
                author: 'David Chen'
            },
            {
                version: '1.1',
                date: '2025-01-16',
                changes: 'Inspection électrique complète - identification équipements défaillants',
                author: 'David Chen'
            },
            {
                version: '1.2',
                date: '2025-01-24',
                changes: 'Remplacement équipements critiques - amélioration sécurité',
                author: 'Maintenance Team'
            }
        ],
        documents: [
            {
                name: 'Procédure LOTO',
                type: 'PDF',
                url: '#'
            }
        ]
    },
    {
        id: 'RISK-004',
        title: 'Blessures manutention manuelle',
        riskDescription: 'Manual handling injuries during material transport',
        department: 'Logistics',
        workProcess: 'Material Handling',
        zone: 'D - Logistics',
        hazardSource: 'Heavy materials and awkward lifting positions',
        potentialConsequences: 'Back injuries, muscle strains, hernias',
        gravity: 'Medium',
        probability: 'Possible',
        severity: 'Moderate',
        riskLevel: 'Medium',
        currentControls: 'Manual handling training, lifting aids, team lifting',
        additionalControls: 'Mechanical lifting equipment, ergonomic assessments',
        preventiveMeasures: 'Échauffements avant prise de poste, rotation des tâches, évaluation ergonomique des postes',
        owner: 'Lisa Rodriguez',
        status: 'Partiellement contrôlé',
        dateCreated: '2025-01-12',
        reviewDate: '2025-05-12',
        isoReference: 'ISO 45001:2018 - 7.2 Compétences',
        revisionHistory: [
            {
                version: '1.0',
                date: '2025-01-12',
                changes: 'Création initiale du risque',
                author: 'Lisa Rodriguez'
            }
        ],
        documents: [
            {
                name: 'Formation manutention manuelle',
                type: 'PDF',
                url: '#'
            }
        ]
    },
    {
        id: 'RISK-005',
        title: 'Risque incendie soudage',
        riskDescription: 'Fire hazard from welding operations',
        department: 'Manufacturing',
        workProcess: 'Welding',
        zone: 'A - Production',
        hazardSource: 'Hot work and combustible materials',
        potentialConsequences: 'Fire, burns, property damage, evacuation',
        gravity: 'High',
        probability: 'Possible',
        severity: 'Major',
        riskLevel: 'High',
        currentControls: 'Hot work permits, fire watch, fire extinguishers',
        additionalControls: 'Automatic fire suppression system, enhanced training',
        preventiveMeasures: 'Vérification quotidienne des équipements de soudage, nettoyage des zones de travail, formation incendie',
        owner: 'James Thompson',
        status: 'Sous contrôle',
        dateCreated: '2025-01-05',
        reviewDate: '2025-03-05',
        isoReference: 'ISO 45001:2018 - 8.1.3 Gestion du changement',
        revisionHistory: [
            {
                version: '1.0',
                date: '2025-01-05',
                changes: 'Création initiale du risque',
                author: 'James Thompson'
            }
        ],
        documents: [
            {
                name: 'Permis de travail à chaud',
                type: 'PDF',
                url: '#'
            }
        ]
    },
    {
        id: 'RISK-006',
        title: 'Exposition au bruit production',
        riskDescription: 'Noise exposure in production area',
        department: 'Manufacturing',
        workProcess: 'Machine Operation',
        zone: 'A - Production',
        hazardSource: 'High-noise machinery and equipment',
        potentialConsequences: 'Hearing loss, communication difficulties, stress',
        gravity: 'Medium',
        probability: 'Likely',
        severity: 'Moderate',
        riskLevel: 'Medium',
        currentControls: 'Hearing protection, noise monitoring, rotation schedule',
        additionalControls: 'Noise reduction enclosures, equipment maintenance',
        preventiveMeasures: 'Audiométrie annuelle, maintenance préventive des machines, sensibilisation aux risques auditifs',
        owner: 'Sarah Johnson',
        status: 'Sous contrôle',
        dateCreated: '2024-12-20',
        reviewDate: '2025-06-20',
        isoReference: 'ISO 45001:2018 - 8.1.1 Généralités',
        revisionHistory: [
            {
                version: '1.0',
                date: '2024-12-20',
                changes: 'Création initiale du risque',
                author: 'Sarah Johnson'
            }
        ],
        documents: [
            {
                name: 'Mesures de bruit',
                type: 'XLS',
                url: '#'
            }
        ]
    },
    {
        id: 'RISK-007',
        title: 'Risques ergonomiques assemblage',
        riskDescription: 'Ergonomic risks from repetitive assembly work',
        department: 'Manufacturing',
        workProcess: 'Assembly',
        zone: 'A - Production',
        hazardSource: 'Repetitive motions and awkward postures',
        potentialConsequences: 'Musculoskeletal disorders, reduced productivity',
        gravity: 'Low',
        probability: 'Possible',
        severity: 'Minor',
        riskLevel: 'Low',
        currentControls: 'Ergonomic assessments, job rotation, regular breaks',
        additionalControls: 'Adjustable workstations, ergonomic tools',
        preventiveMeasures: 'Exercices d\'étirement, formation gestes et postures, aménagement ergonomique des postes',
        owner: 'Maria Garcia',
        status: 'Sous contrôle',
        dateCreated: '2025-01-14',
        reviewDate: '2025-07-14',
        isoReference: 'ISO 45001:2018 - 6.1.2 Identification des dangers et évaluation des risques',
        revisionHistory: [
            {
                version: '1.0',
                date: '2025-01-14',
                changes: 'Création initiale du risque',
                author: 'Maria Garcia'
            }
        ],
        documents: [
            {
                name: 'Évaluation ergonomique',
                type: 'PDF',
                url: '#'
            }
        ]
    },
    {
        id: 'RISK-008',
        title: 'Accidents véhicules quai chargement',
        riskDescription: 'Vehicle accidents in loading dock area',
        department: 'Logistics',
        workProcess: 'Transportation',
        zone: 'D - Logistics',
        hazardSource: 'Forklifts and pedestrian interaction',
        potentialConsequences: 'Collisions, pedestrian injuries, property damage',
        gravity: 'High',
        probability: 'Unlikely',
        severity: 'Major',
        riskLevel: 'Medium',
        currentControls: 'Designated walkways, speed limits, training, hi-vis vests',
        additionalControls: 'Proximity sensors, improved lighting, traffic management',
        preventiveMeasures: 'Formation conduite d\'engins, signalisation renforcée, contrôles de vitesse, briefings sécurité',
        owner: 'Robert Kim',
        status: 'Non contrôlé',
        dateCreated: '2025-01-13',
        reviewDate: '2025-04-13',
        isoReference: 'ISO 45001:2018 - 8.1.2 Élimination des dangers et réduction des risques',
        revisionHistory: [
            {
                version: '1.0',
                date: '2025-01-13',
                changes: 'Création initiale du risque',
                author: 'Robert Kim'
            },
            {
                version: '1.1',
                date: '2025-01-19',
                changes: 'Incident évité de justesse - révision des procédures de circulation',
                author: 'Robert Kim'
            },
            {
                version: '1.2',
                date: '2025-01-26',
                changes: 'Installation capteurs de proximité sur chariots élévateurs',
                author: 'Safety Engineer'
            }
        ],
        documents: [
            {
                name: 'Plan de circulation',
                type: 'PDF',
                url: '#'
            }
        ]
    },
    {
        id: 'RISK-009',
        title: 'Risques espaces confinés',
        riskDescription: 'Confined space entry risks',
        department: 'Maintenance',
        workProcess: 'Machine Operation',
        zone: 'B - Maintenance',
        hazardSource: 'Tanks, vessels, and enclosed spaces',
        potentialConsequences: 'Asphyxiation, toxic exposure, entrapment',
        gravity: 'High',
        probability: 'Rare',
        severity: 'Catastrophic',
        riskLevel: 'High',
        currentControls: 'Confined space permits, atmospheric monitoring, rescue team',
        additionalControls: 'Remote monitoring systems, enhanced ventilation',
        preventiveMeasures: 'Formation espaces confinés, test atmosphérique systématique, équipe de secours dédiée',
        owner: 'Mark Stevens',
        status: 'Partiellement contrôlé',
        dateCreated: '2025-01-11',
        reviewDate: '2025-02-11',
        isoReference: 'ISO 45001:2018 - 8.1.4 Approvisionnement',
        revisionHistory: [
            {
                version: '1.0',
                date: '2025-01-11',
                changes: 'Création initiale du risque',
                author: 'Mark Stevens'
            }
        ],
        documents: [
            {
                name: 'Procédure espaces confinés',
                type: 'PDF',
                url: '#'
            }
        ]
    },
    {
        id: 'RISK-010',
        title: 'Coupures outils tranchants',
        riskDescription: 'Cut and laceration risks from sharp tools',
        department: 'Quality Control',
        workProcess: 'Assembly',
        zone: 'E - Quality',
        hazardSource: 'Sharp cutting tools and equipment edges',
        potentialConsequences: 'Cuts, lacerations, infections',
        gravity: 'Medium',
        probability: 'Possible',
        severity: 'Minor',
        riskLevel: 'Low',
        currentControls: 'Cut-resistant gloves, tool guards, proper training',
        additionalControls: 'Automatic cutting systems, improved tool design',
        preventiveMeasures: 'Inspection quotidienne des outils, formation manipulation outils tranchants, premiers secours',
        owner: 'Angela White',
        status: 'Sous contrôle',
        dateCreated: '2025-01-09',
        reviewDate: '2025-08-09',
        isoReference: 'ISO 45001:2018 - 7.2 Compétences',
        revisionHistory: [
            {
                version: '1.0',
                date: '2025-01-09',
                changes: 'Création initiale du risque',
                author: 'Angela White'
            }
        ],
        documents: [
            {
                name: 'Formation outils tranchants',
                type: 'PDF',
                url: '#'
            }
        ]
    }
];