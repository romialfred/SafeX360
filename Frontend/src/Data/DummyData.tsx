const activites = [
    // Janvier - IGP
    { id: '1', title: 'Inspection sécurité atelier production', month: 1, responsible: 'J. Dupont', department: 'Production', position: 'Chef de Production', status: 'completed', category: 'inspections', date: '15/01', time: '09:00' },
    { id: '2', title: 'Contrôle équipements maintenance', month: 1, responsible: 'L. Moreau', department: 'Maintenance', position: 'Responsable Maintenance', status: 'planned', category: 'inspections', date: '25/01', time: '14:00' },
    // Janvier - RSS
    { id: '3', title: 'Réunion mensuelle HSE', month: 1, responsible: 'M. Dubois', department: 'HSE', position: 'Coordinateur HSE', status: 'completed', category: 'rss', date: '20/01', time: '14:00', theme: 'Formation sécurité' },
    { id: '4', title: 'Formation nouveaux employés', month: 1, responsible: 'A. Leroy', department: 'HSE', position: 'Formateur HSE', status: 'planned', category: 'rss', date: '28/01', time: '10:00', theme: 'Accueil sécurité' },
    // Janvier - TDM
    { id: '5', title: 'Tournée direction générale', month: 1, responsible: 'C. Directeur', department: 'Direction', position: 'Directeur Général', status: 'completed', category: 'tdm', date: '30/01', time: '11:00', theme: 'Visite terrain' },

    // Février - IGP
    { id: '6', title: 'Audit qualité laboratoire', month: 2, responsible: 'S. Martin', department: 'Qualité', position: 'Responsable Qualité', status: 'inProgress', category: 'inspections', date: '10/02', time: '10:30' },
    { id: '7', title: 'Inspection électrique', month: 2, responsible: 'P. Bernard', department: 'Maintenance', position: 'Électricien Chef', status: 'planned', category: 'inspections', date: '22/02', time: '08:00' },
    // Février - RSS
    { id: '8', title: 'Comité sécurité production', month: 2, responsible: 'J. Dupont', department: 'Production', position: 'Chef de Production', status: 'planned', category: 'rss', date: '15/02', time: '15:30', theme: 'Analyse des incidents' },
    { id: '9', title: 'Formation gestes et postures', month: 2, responsible: 'M. Dubois', department: 'HSE', position: 'Coordinateur HSE', status: 'planned', category: 'rss', date: '25/02', time: '09:00', theme: 'Prévention TMS' },
    // Février - TDM
    { id: '10', title: 'Visite terrain production', month: 2, responsible: 'R. Chef', department: 'Production', position: 'Directeur Production', status: 'inProgress', category: 'tdm', date: '28/02', time: '16:00', theme: 'Audit sécurité' },

    // Mars - IGP
    { id: '11', title: 'Inspection EPI', month: 3, responsible: 'P. Bernard', department: 'HSE', position: 'Responsable HSE', status: 'planned', category: 'inspections', date: '05/03', time: '08:00' },
    { id: '12', title: 'Contrôle ventilation', month: 3, responsible: 'L. Moreau', department: 'Maintenance', position: 'Responsable Maintenance', status: 'planned', category: 'inspections', date: '18/03', time: '14:00' },
    // Mars - RSS
    { id: '13', title: 'Sensibilisation risques chimiques', month: 3, responsible: 'A. Leroy', department: 'HSE', position: 'Formateur HSE', status: 'planned', category: 'rss', date: '12/03', time: '09:00', theme: 'Prévention chimique' },
    { id: '14', title: 'Retour d\'expérience incidents', month: 3, responsible: 'M. Dubois', department: 'HSE', position: 'Coordinateur HSE', status: 'planned', category: 'rss', date: '26/03', time: '14:30', theme: 'REX incidents' },
    // Mars - TDM
    { id: '15', title: 'Audit management qualité', month: 3, responsible: 'T. Manager', department: 'Qualité', position: 'Directeur Qualité', status: 'planned', category: 'tdm', date: '20/03', time: '13:30', theme: 'Contrôle processus' },

    // Avril - IGP
    { id: '16', title: 'Inspection machines-outils', month: 4, responsible: 'J. Dupont', department: 'Production', position: 'Chef de Production', status: 'planned', category: 'inspections', date: '08/04', time: '10:00' },
    { id: '17', title: 'Contrôle systèmes incendie', month: 4, responsible: 'P. Bernard', department: 'HSE', position: 'Responsable HSE', status: 'planned', category: 'inspections', date: '22/04', time: '09:00' },
    // Avril - RSS
    { id: '18', title: 'Formation premiers secours', month: 4, responsible: 'A. Leroy', department: 'HSE', position: 'Formateur HSE', status: 'planned', category: 'rss', date: '10/04', time: '08:30', theme: 'Secourisme' },
    { id: '19', title: 'Réunion environnement', month: 4, responsible: 'S. Martin', department: 'Qualité', position: 'Responsable Qualité', status: 'planned', category: 'rss', date: '24/04', time: '15:00', theme: 'Gestion déchets' },
    // Avril - TDM
    { id: '20', title: 'Tournée maintenance', month: 4, responsible: 'L. Moreau', department: 'Maintenance', position: 'Responsable Maintenance', status: 'planned', category: 'tdm', date: '30/04', time: '11:00', theme: 'État équipements' },

    // Mai - IGP
    { id: '21', title: 'Audit sécurité entrepôt', month: 5, responsible: 'M. Dubois', department: 'HSE', position: 'Coordinateur HSE', status: 'planned', category: 'inspections', date: '06/05', time: '14:00' },
    { id: '22', title: 'Inspection ponts roulants', month: 5, responsible: 'L. Moreau', department: 'Maintenance', position: 'Responsable Maintenance', status: 'planned', category: 'inspections', date: '20/05', time: '08:00' },
    // Mai - RSS
    { id: '23', title: 'Journée sécurité mondiale', month: 5, responsible: 'P. Bernard', department: 'HSE', position: 'Responsable HSE', status: 'planned', category: 'rss', date: '28/05', time: '09:00', theme: 'Sécurité mondiale' },
    { id: '24', title: 'Formation conduite sécurisée', month: 5, responsible: 'J. Dupont', department: 'Production', position: 'Chef de Production', status: 'planned', category: 'rss', date: '15/05', time: '13:30', theme: 'Conduite engins' },
    // Mai - TDM
    { id: '25', title: 'Visite laboratoire qualité', month: 5, responsible: 'S. Martin', department: 'Qualité', position: 'Responsable Qualité', status: 'planned', category: 'tdm', date: '31/05', time: '10:30', theme: 'Contrôle qualité' },

    // Juin - IGP
    { id: '26', title: 'Contrôle espaces confinés', month: 6, responsible: 'P. Bernard', department: 'HSE', position: 'Responsable HSE', status: 'planned', category: 'inspections', date: '05/06', time: '09:00' },
    { id: '27', title: 'Inspection chariots élévateurs', month: 6, responsible: 'J. Dupont', department: 'Production', position: 'Chef de Production', status: 'planned', category: 'inspections', date: '19/06', time: '11:00' },
    // Juin - RSS
    { id: '28', title: 'Prévention canicule', month: 6, responsible: 'M. Dubois', department: 'HSE', position: 'Coordinateur HSE', status: 'planned', category: 'rss', date: '12/06', time: '14:00', theme: 'Risques climatiques' },
    { id: '29', title: 'Formation manipulation chimique', month: 6, responsible: 'A. Leroy', department: 'HSE', position: 'Formateur HSE', status: 'planned', category: 'rss', date: '26/06', time: '08:30', theme: 'Produits chimiques' },
    // Juin - TDM
    { id: '30', title: 'Audit direction production', month: 6, responsible: 'R. Chef', department: 'Production', position: 'Directeur Production', status: 'planned', category: 'tdm', date: '28/06', time: '15:00', theme: 'Performance sécurité' },

    // Juillet - IGP
    { id: '31', title: 'Inspection climatisation', month: 7, responsible: 'L. Moreau', department: 'Maintenance', position: 'Responsable Maintenance', status: 'planned', category: 'inspections', date: '08/07', time: '10:00' },
    { id: '32', title: 'Contrôle douches de sécurité', month: 7, responsible: 'P. Bernard', department: 'HSE', position: 'Responsable HSE', status: 'planned', category: 'inspections', date: '22/07', time: '09:30' },
    // Juillet - RSS
    { id: '33', title: 'Sensibilisation hydratation', month: 7, responsible: 'M. Dubois', department: 'HSE', position: 'Coordinateur HSE', status: 'planned', category: 'rss', date: '10/07', time: '08:00', theme: 'Prévention déshydratation' },
    { id: '34', title: 'Formation travail en hauteur', month: 7, responsible: 'A. Leroy', department: 'HSE', position: 'Formateur HSE', status: 'planned', category: 'rss', date: '24/07', time: '13:00', theme: 'Travail hauteur' },
    // Juillet - TDM
    { id: '35', title: 'Tournée ateliers été', month: 7, responsible: 'C. Directeur', department: 'Direction', position: 'Directeur Général', status: 'planned', category: 'tdm', date: '30/07', time: '16:00', theme: 'Conditions estivales' },

    // Août - IGP
    { id: '36', title: 'Audit stockage produits', month: 8, responsible: 'S. Martin', department: 'Qualité', position: 'Responsable Qualité', status: 'planned', category: 'inspections', date: '05/08', time: '14:30' },
    { id: '37', title: 'Inspection réseaux gaz', month: 8, responsible: 'L. Moreau', department: 'Maintenance', position: 'Responsable Maintenance', status: 'planned', category: 'inspections', date: '19/08', time: '08:00' },
    // Août - RSS
    { id: '38', title: 'Formation équipes été', month: 8, responsible: 'P. Bernard', department: 'HSE', position: 'Responsable HSE', status: 'planned', category: 'rss', date: '12/08', time: '09:00', theme: 'Sécurité estivale' },
    { id: '39', title: 'Réunion prévention accidents', month: 8, responsible: 'J. Dupont', department: 'Production', position: 'Chef de Production', status: 'planned', category: 'rss', date: '26/08', time: '15:30', theme: 'Prévention accidents' },
    // Août - TDM
    { id: '40', title: 'Visite maintenance préventive', month: 8, responsible: 'L. Moreau', department: 'Maintenance', position: 'Responsable Maintenance', status: 'planned', category: 'tdm', date: '28/08', time: '11:30', theme: 'Maintenance préventive' },

    // Septembre - IGP
    { id: '41', title: 'Contrôle éclairage sécurité', month: 9, responsible: 'P. Bernard', department: 'HSE', position: 'Responsable HSE', status: 'planned', category: 'inspections', date: '03/09', time: '10:00' },
    { id: '42', title: 'Inspection compresseurs', month: 9, responsible: 'L. Moreau', department: 'Maintenance', position: 'Responsable Maintenance', status: 'planned', category: 'inspections', date: '17/09', time: '14:00' },
    // Septembre - RSS
    { id: '43', title: 'Rentrée sécurité', month: 9, responsible: 'M. Dubois', department: 'HSE', position: 'Coordinateur HSE', status: 'planned', category: 'rss', date: '09/09', time: '08:30', theme: 'Rappels sécurité' },
    { id: '44', title: 'Formation risques psychosociaux', month: 9, responsible: 'A. Leroy', department: 'HSE', position: 'Formateur HSE', status: 'planned', category: 'rss', date: '23/09', time: '14:30', theme: 'RPS' },
    // Septembre - TDM
    { id: '45', title: 'Audit rentrée direction', month: 9, responsible: 'T. Manager', department: 'Qualité', position: 'Directeur Qualité', status: 'planned', category: 'tdm', date: '30/09', time: '09:00', theme: 'Bilan été' },

    // Octobre - IGP
    { id: '46', title: 'Inspection chauffage', month: 10, responsible: 'L. Moreau', department: 'Maintenance', position: 'Responsable Maintenance', status: 'planned', category: 'inspections', date: '07/10', time: '09:00' },
    { id: '47', title: 'Contrôle détecteurs fumée', month: 10, responsible: 'P. Bernard', department: 'HSE', position: 'Responsable HSE', status: 'planned', category: 'inspections', date: '21/10', time: '11:00' },
    // Octobre - RSS
    { id: '48', title: 'Prévention automne', month: 10, responsible: 'M. Dubois', department: 'HSE', position: 'Coordinateur HSE', status: 'planned', category: 'rss', date: '14/10', time: '13:00', theme: 'Risques saisonniers' },
    { id: '49', title: 'Formation conduite défensive', month: 10, responsible: 'J. Dupont', department: 'Production', position: 'Chef de Production', status: 'planned', category: 'rss', date: '28/10', time: '10:30', theme: 'Conduite sécurisée' },
    // Octobre - TDM
    { id: '50', title: 'Tournée préparation hiver', month: 10, responsible: 'R. Chef', department: 'Production', position: 'Directeur Production', status: 'planned', category: 'tdm', date: '31/10', time: '15:30', theme: 'Préparation hiver' },

    // Novembre - IGP
    { id: '51', title: 'Audit sécurité incendie', month: 11, responsible: 'P. Bernard', department: 'HSE', position: 'Responsable HSE', status: 'planned', category: 'inspections', date: '04/11', time: '08:30' },
    { id: '52', title: 'Inspection portes coupe-feu', month: 11, responsible: 'L. Moreau', department: 'Maintenance', position: 'Responsable Maintenance', status: 'planned', category: 'inspections', date: '18/11', time: '14:30' },
    // Novembre - RSS
    { id: '53', title: 'Bilan annuel sécurité', month: 11, responsible: 'P. Bernard', department: 'HSE', position: 'Responsable HSE', status: 'planned', category: 'rss', date: '11/11', time: '09:30', theme: 'Bilan annuel' },
    { id: '54', title: 'Préparation plan hiver', month: 11, responsible: 'M. Dubois', department: 'HSE', position: 'Coordinateur HSE', status: 'planned', category: 'rss', date: '25/11', time: '15:00', theme: 'Plan hiver' },
    // Novembre - TDM
    { id: '55', title: 'Audit fin d\'année', month: 11, responsible: 'C. Directeur', department: 'Direction', position: 'Directeur Général', status: 'planned', category: 'tdm', date: '29/11', time: '10:00', theme: 'Bilan annuel' },

    // Décembre - IGP
    { id: '56', title: 'Contrôle final année', month: 12, responsible: 'S. Martin', department: 'Qualité', position: 'Responsable Qualité', status: 'planned', category: 'inspections', date: '02/12', time: '13:00' },
    { id: '57', title: 'Inspection déneigement', month: 12, responsible: 'L. Moreau', department: 'Maintenance', position: 'Responsable Maintenance', status: 'planned', category: 'inspections', date: '16/12', time: '08:00' },
    // Décembre - RSS
    { id: '58', title: 'Bilan formations année', month: 12, responsible: 'A. Leroy', department: 'HSE', position: 'Formateur HSE', status: 'planned', category: 'rss', date: '09/12', time: '14:00', theme: 'Bilan formations' },
    { id: '59', title: 'Préparation objectifs N+1', month: 12, responsible: 'P. Bernard', department: 'HSE', position: 'Responsable HSE', status: 'planned', category: 'rss', date: '23/12', time: '10:00', theme: 'Objectifs futurs' },
    // Décembre - TDM
    { id: '60', title: 'Tournée bilan annuel', month: 12, responsible: 'T. Manager', department: 'Qualité', position: 'Directeur Qualité', status: 'planned', category: 'tdm', date: '30/12', time: '11:00', theme: 'Bilan global' },
]

const themeData = [
    // Janvier
    {
        id: '1',
        month: 1,
        category: 'health-safety-meeting',
        type: 'sante-securite',
        theme: 'Safety training for new employees',
        description: 'Complete training session on safety procedures for new employees, including PPE, emergency procedures and best practices.',
        participants: 25,
        createdAt: '2025-01-15'
    },
    {
        id: '2',
        month: 1,
        category: 'management-tour',
        type: 'securite',
        theme: 'Production field visit',
        description: 'Management tour in production workshops to evaluate the application of safety measures and identify improvement points.',
        participants: 8,
        createdAt: '2025-01-10'
    },
    // Février
    {
        id: '3',
        month: 2,
        category: 'health-safety-meeting',
        type: 'securite',
        theme: 'Monthly incident analysis',
        description: 'Detailed review of incidents that occurred in the previous month, root cause analysis and definition of corrective actions.',
        participants: 18,
        createdAt: '2025-01-20'
    },
    {
        id: '4',
        month: 2,
        category: 'management-tour',
        type: 'environnement',
        theme: 'Environmental audit',
        description: 'Inspection of facilities to verify environmental compliance and identify improvement opportunities.',
        participants: 12,
        createdAt: '2025-02-05'
    },
    // Mars
    {
        id: '5',
        month: 3,
        category: 'health-safety-meeting',
        type: 'sensibilisation',
        theme: 'Ergonomics and posture awareness',
        description: 'Practical training on proper postures at work and prevention of musculoskeletal disorders.',
        participants: 30,
        createdAt: '2025-03-01'
    },
    {
        id: '6',
        month: 3,
        category: 'management-tour',
        type: 'programme-national',
        theme: 'National HSE program implementation',
        description: 'Verification of the implementation of national occupational health and safety program directives.',
        participants: 15,
        createdAt: '2025-03-10'
    },
    // Avril
    {
        id: '7',
        month: 4,
        category: 'health-safety-meeting',
        type: 'environnement',
        theme: 'Industrial waste management',
        description: 'Training on procedures for sorting, storing and disposing of industrial waste according to regulations.',
        participants: 22,
        createdAt: '2025-04-05'
    },
    {
        id: '8',
        month: 4,
        category: 'management-tour',
        type: 'securite',
        theme: 'Confined spaces control',
        description: 'Inspection of confined space entry procedures and verification of safety equipment.',
        participants: 10,
        createdAt: '2025-04-15'
    },
    // Mai
    {
        id: '9',
        month: 5,
        category: 'health-safety-meeting',
        type: 'programme-national',
        theme: 'World Safety Day',
        description: 'Celebration of World Day for Safety and Health at Work with awareness activities.',
        participants: 45,
        createdAt: '2025-05-01'
    },
    {
        id: '10',
        month: 5,
        category: 'management-tour',
        type: 'sante-securite',
        theme: 'Psychosocial risk assessment',
        description: 'Tour to identify and assess psychosocial risk factors in different departments.',
        participants: 20,
        createdAt: '2025-05-10'
    },
    // Juin
    {
        id: '11',
        month: 6,
        category: 'health-safety-meeting',
        type: 'securite',
        theme: 'Material handling accident prevention',
        description: 'Training on safe handling techniques and use of lifting equipment.',
        participants: 28,
        createdAt: '2025-06-05'
    },
    {
        id: '12',
        month: 6,
        category: 'management-tour',
        type: 'environnement',
        theme: 'Atmospheric emissions control',
        description: 'Verification of emission treatment systems and compliance with environmental standards.',
        participants: 14,
        createdAt: '2025-06-15'
    },
    // Juillet
    {
        id: '13',
        month: 7,
        category: 'health-safety-meeting',
        type: 'sensibilisation',
        theme: 'Summer safety',
        description: 'Awareness of specific summer risks: heat stroke, hydration, sun protection.',
        participants: 35,
        createdAt: '2025-07-01'
    },
    {
        id: '14',
        month: 7,
        category: 'management-tour',
        type: 'securite',
        theme: 'Electrical installations inspection',
        description: 'Control of the condition of electrical installations and verification of protection measures.',
        participants: 12,
        createdAt: '2025-07-10'
    },
    // Août
    {
        id: '15',
        month: 8,
        category: 'health-safety-meeting',
        type: 'sante-securite',
        theme: 'First aid and emergency procedures',
        description: 'Training in first aid gestures and emergency procedures in case of workplace accidents.',
        participants: 40,
        createdAt: '2025-08-05'
    },
    {
        id: '16',
        month: 8,
        category: 'management-tour',
        type: 'programme-national',
        theme: 'Regulatory compliance audit',
        description: 'Verification of compliance with national regulatory requirements in HSE matters.',
        participants: 18,
        createdAt: '2025-08-15'
    },
    // Septembre
    {
        id: '17',
        month: 9,
        category: 'health-safety-meeting',
        type: 'environnement',
        theme: 'Energy saving and sustainable development',
        description: 'Awareness of energy saving practices and sustainable development issues.',
        participants: 32,
        createdAt: '2025-09-01'
    },
    {
        id: '18',
        month: 9,
        category: 'management-tour',
        type: 'securite',
        theme: 'Protection equipment control',
        description: 'Inspection of the condition and use of individual and collective protection equipment.',
        participants: 16,
        createdAt: '2025-09-10'
    },
    // Octobre
    {
        id: '19',
        month: 10,
        category: 'health-safety-meeting',
        type: 'sensibilisation',
        theme: 'Chemical risk prevention',
        description: 'Training on identification, assessment and prevention of risks related to chemical products.',
        participants: 26,
        createdAt: '2025-10-05'
    },
    {
        id: '20',
        month: 10,
        category: 'management-tour',
        type: 'sante-securite',
        theme: 'Work environment assessment',
        description: 'Measurement and evaluation of environmental conditions: noise, lighting, temperature, air quality.',
        participants: 22,
        createdAt: '2025-10-15'
    },
    // Novembre
    {
        id: '21',
        month: 11,
        category: 'health-safety-meeting',
        type: 'programme-national',
        theme: 'Annual HSE actions review',
        description: 'Presentation of the annual review of prevention actions and planning of objectives for the following year.',
        participants: 38,
        createdAt: '2025-11-01'
    },
    {
        id: '22',
        month: 11,
        category: 'management-tour',
        type: 'securite',
        theme: 'Emergency preparedness',
        description: 'Verification of emergency plans, intervention equipment and team training.',
        participants: 24,
        createdAt: '2025-11-10'
    },
    // Décembre
    {
        id: '23',
        month: 12,
        category: 'health-safety-meeting',
        type: 'sensibilisation',
        theme: 'Year review and perspectives',
        description: 'Review of actions carried out during the year and presentation of orientations for the following year.',
        participants: 42,
        createdAt: '2025-12-05'
    },
    {
        id: '24',
        month: 12,
        category: 'management-tour',
        type: 'environnement',
        theme: 'Year-end audit',
        description: 'Complete audit of facilities and environmental practices at year-end.',
        participants: 20,
        createdAt: '2025-12-15'
    }
]
export { activites, themeData }