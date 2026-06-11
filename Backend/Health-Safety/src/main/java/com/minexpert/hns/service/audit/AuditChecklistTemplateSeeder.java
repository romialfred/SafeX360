package com.minexpert.hns.service.audit;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.minexpert.hns.entity.audit.AuditChecklistTemplate;
import com.minexpert.hns.repository.audit.AuditChecklistTemplateRepository;

import lombok.RequiredArgsConstructor;

/**
 * LOT 52 — Seed idempotent des questions types de checklist d'audit pour les
 * trois référentiels ISO (45001:2018, 14001:2015, 9001:2015), avec clauses
 * exactes. Ne s'exécute que si la table est vide : les bibliothèques restent
 * modifiables par les administrateurs ensuite.
 */
@Component
@RequiredArgsConstructor
public class AuditChecklistTemplateSeeder implements CommandLineRunner {

    private static final Logger LOG = LoggerFactory.getLogger(AuditChecklistTemplateSeeder.class);

    private final AuditChecklistTemplateRepository templateRepository;

    @Override
    public void run(String... args) {
        // LOT 53 : le garde-fou est désormais PAR RÉFÉRENTIEL (voir fin de
        // méthode) — une bibliothèque existante n'est jamais écrasée, mais une
        // bibliothèque absente (ex. MINIER ajoutée après coup) est installée.
        List<AuditChecklistTemplate> templates = new ArrayList<>();
        int[] order = {0};

        // ── ISO 45001:2018 — Santé et sécurité au travail ──────────────────
        String r = "ISO_45001";
        add(templates, order, r, "4.1", "L'organisme a-t-il déterminé les enjeux internes et externes pertinents pour son système de management de la SST ?", "Vérifier l'analyse de contexte et sa revue périodique.");
        add(templates, order, r, "4.2", "Les besoins et attentes des travailleurs et autres parties intéressées ont-ils été déterminés ?", "Inclut les exigences légales applicables.");
        add(templates, order, r, "5.1", "La direction démontre-t-elle son leadership et son engagement (responsabilité globale SST, ressources, culture positive) ?", "Entretien direction + preuves d'allocation de ressources.");
        add(templates, order, r, "5.2", "La politique SST est-elle établie, communiquée et adaptée à l'organisme ?", "Affichage, diffusion, compréhension par les travailleurs.");
        add(templates, order, r, "5.3", "Les rôles, responsabilités et autorités SST sont-ils attribués et communiqués à tous les niveaux ?", null);
        add(templates, order, r, "5.4", "Des processus de consultation et de participation des travailleurs sont-ils en place et effectifs ?", "Comités SST, remontées terrain, traitement des suggestions.");
        add(templates, order, r, "6.1.2", "Les dangers sont-ils identifiés de manière proactive et continue (activités routinières et non routinières) ?", "Méthodologie d'identification + registre des dangers à jour.");
        add(templates, order, r, "6.1.2.2", "Les risques SST sont-ils évalués selon une méthodologie définie et les critères documentés ?", null);
        add(templates, order, r, "6.1.3", "Les exigences légales et autres exigences applicables sont-elles déterminées et tenues à jour ?", "Lien avec le module Conformité Réglementaire.");
        add(templates, order, r, "6.2", "Des objectifs SST mesurables sont-ils établis avec plans d'actions associés ?", null);
        add(templates, order, r, "7.2", "Les compétences nécessaires des travailleurs sont-elles déterminées et les formations assurées ?", "Plans de formation, habilitations, évaluations.");
        add(templates, order, r, "7.3", "Les travailleurs sont-ils sensibilisés à la politique, aux dangers et à leur droit de retrait ?", null);
        add(templates, order, r, "7.4", "Les processus de communication interne et externe SST sont-ils définis et appliqués ?", null);
        add(templates, order, r, "7.5", "Les informations documentées exigées sont-elles maîtrisées (création, mise à jour, accès) ?", null);
        add(templates, order, r, "8.1.2", "La hiérarchie des moyens de maîtrise est-elle appliquée (élimination, substitution, contrôles techniques, administratifs, EPI) ?", "Vérifier sur des situations concrètes du terrain.");
        add(templates, order, r, "8.1.3", "La gestion du changement est-elle maîtrisée (nouveaux procédés, équipements, organisations) ?", null);
        add(templates, order, r, "8.1.4", "Les achats, prestataires et sous-traitants sont-ils maîtrisés au regard de la SST ?", "Plans de prévention, évaluation des entreprises extérieures.");
        add(templates, order, r, "8.2", "La préparation et la réponse aux situations d'urgence sont-elles planifiées et testées ?", "Exercices d'évacuation, points de rassemblement, retours d'exercice.");
        add(templates, order, r, "9.1", "La performance SST est-elle surveillée, mesurée, analysée et évaluée ?", "Indicateurs proactifs et réactifs.");
        add(templates, order, r, "9.1.2", "La conformité aux exigences légales est-elle évaluée périodiquement ?", null);
        add(templates, order, r, "9.2", "Le programme d'audit interne est-il planifié, mis en œuvre et les résultats rapportés à la direction ?", null);
        add(templates, order, r, "9.3", "La revue de direction couvre-t-elle tous les éléments d'entrée exigés et produit-elle des décisions ?", null);
        add(templates, order, r, "10.2", "Les événements indésirables et non-conformités font-ils l'objet d'analyses et d'actions correctives efficaces ?", "Investigations, causes racines, vérification d'efficacité.");
        add(templates, order, r, "10.3", "L'amélioration continue du système SST est-elle démontrée ?", null);

        // ── ISO 14001:2015 — Environnement ──────────────────────────────────
        r = "ISO_14001";
        add(templates, order, r, "4.1", "Les enjeux environnementaux internes et externes pertinents sont-ils déterminés, y compris les conditions environnementales ?", null);
        add(templates, order, r, "4.2", "Les besoins et attentes des parties intéressées et les obligations de conformité sont-ils identifiés ?", null);
        add(templates, order, r, "5.2", "La politique environnementale inclut-elle les engagements de protection de l'environnement, de conformité et d'amélioration continue ?", null);
        add(templates, order, r, "6.1.2", "Les aspects environnementaux des activités, produits et services sont-ils identifiés et les aspects significatifs déterminés ?", "Registre des aspects/impacts, critères de significativité — spécifique mine : eaux, poussières, résidus.");
        add(templates, order, r, "6.1.3", "Les obligations de conformité environnementale sont-elles déterminées et leur application maîtrisée ?", null);
        add(templates, order, r, "6.2", "Des objectifs environnementaux mesurables avec indicateurs sont-ils établis ?", null);
        add(templates, order, r, "7.2", "Les personnes dont le travail a un impact environnemental significatif sont-elles compétentes ?", null);
        add(templates, order, r, "7.4", "La communication environnementale interne et externe est-elle définie (quoi, quand, à qui, comment) ?", null);
        add(templates, order, r, "8.1", "Les opérations associées aux aspects significatifs sont-elles maîtrisées (critères opératoires, contrôles) ?", "Gestion des effluents, déchets dangereux, produits chimiques.");
        add(templates, order, r, "8.1b", "La perspective de cycle de vie est-elle prise en compte (achats, conception, fin de vie) ?", null);
        add(templates, order, r, "8.2", "La préparation et la réponse aux urgences environnementales sont-elles établies et testées ?", "Déversements, rupture de digue, scénarios spécifiques au site.");
        add(templates, order, r, "5.1", "La direction démontre-t-elle son leadership vis-à-vis du système de management environnemental (ressources, intégration aux processus métier) ?", null);
        add(templates, order, r, "5.3", "Les rôles, responsabilités et autorités environnementaux sont-ils attribués et communiqués ?", null);
        add(templates, order, r, "6.1.1", "Les risques et opportunités liés aux aspects, obligations et enjeux sont-ils déterminés et traités ?", null);
        add(templates, order, r, "7.3", "Le personnel est-il sensibilisé à la politique environnementale, aux aspects significatifs de son travail et aux conséquences d'un écart ?", null);
        add(templates, order, r, "7.5", "Les informations documentées du SME sont-elles créées, mises à jour et maîtrisées ?", null);
        add(templates, order, r, "9.1.1", "La performance environnementale est-elle surveillée avec des équipements étalonnés ?", "Mesures d'émissions, qualité de l'eau, étalonnage des instruments.");
        add(templates, order, r, "9.1.2", "L'évaluation de la conformité aux obligations est-elle réalisée à fréquence définie ?", null);
        add(templates, order, r, "9.2", "Les audits internes environnementaux sont-ils réalisés selon le programme établi ?", null);
        add(templates, order, r, "9.3", "La revue de direction intègre-t-elle la performance environnementale et l'adéquation des ressources ?", null);
        add(templates, order, r, "10.2", "Les non-conformités environnementales sont-elles traitées avec actions correctives et vérification d'efficacité ?", null);
        add(templates, order, r, "10.1", "Les opportunités d'amélioration environnementale sont-elles déterminées et les actions nécessaires mises en œuvre ?", null);
        add(templates, order, r, "10.3", "L'amélioration continue de la performance environnementale est-elle démontrée ?", null);

        // ── ISO 9001:2015 — Qualité ─────────────────────────────────────────
        r = "ISO_9001";
        add(templates, order, r, "4.4", "Le système de management de la qualité et ses processus sont-ils déterminés (séquences, interactions, indicateurs) ?", "Cartographie des processus à jour.");
        add(templates, order, r, "5.1.2", "L'orientation client est-elle démontrée par la direction (exigences déterminées, risques traités, satisfaction visée) ?", null);
        add(templates, order, r, "5.3", "Les rôles, responsabilités et autorités qualité sont-ils attribués et compris ?", null);
        add(templates, order, r, "6.1", "Les risques et opportunités des processus sont-ils déterminés et traités ?", null);
        add(templates, order, r, "6.2", "Des objectifs qualité mesurables et cohérents avec la politique sont-ils déployés ?", null);
        add(templates, order, r, "7.1.3", "L'infrastructure nécessaire (équipements, installations, systèmes) est-elle déterminée et entretenue ?", "Plans de maintenance des installations critiques.");
        add(templates, order, r, "7.1.5", "Les ressources de surveillance et de mesure sont-elles adaptées, vérifiées/étalonnées et traçables ?", null);
        add(templates, order, r, "7.5", "Les informations documentées sont-elles maîtrisées (approbation, diffusion, modifications, conservation) ?", null);
        add(templates, order, r, "8.2", "Les exigences relatives aux produits et services sont-elles déterminées et revues avant engagement ?", null);
        add(templates, order, r, "8.4", "Les processus, produits et services fournis par des prestataires externes sont-ils maîtrisés ?", "Évaluation, sélection, surveillance des fournisseurs.");
        add(templates, order, r, "8.5.1", "La production et la prestation de service sont-elles maîtrisées (conditions, instructions, moyens) ?", null);
        add(templates, order, r, "8.5.2", "L'identification et la traçabilité sont-elles assurées lorsque exigé ?", "Traçabilité des lots/échantillons laboratoire.");
        add(templates, order, r, "8.6", "La libération des produits et services est-elle réalisée après vérification des dispositions planifiées ?", null);
        add(templates, order, r, "8.7", "Les éléments de sortie non conformes sont-ils identifiés et maîtrisés ?", null);
        add(templates, order, r, "9.1.2", "La satisfaction client est-elle surveillée et les résultats exploités ?", null);
        add(templates, order, r, "9.1.3", "L'analyse et l'évaluation des données démontrent-elles la performance et l'efficacité du SMQ ?", null);
        add(templates, order, r, "9.2", "Les audits internes qualité sont-ils réalisés à intervalles planifiés par des auditeurs objectifs et impartiaux ?", null);
        add(templates, order, r, "10.2", "Les non-conformités et réclamations donnent-elles lieu à des actions correctives appropriées ?", null);
        add(templates, order, r, "10.3", "L'amélioration continue de la pertinence, l'adéquation et l'efficacité du SMQ est-elle démontrée ?", null);

        // ── MINIER — référentiel sectoriel (LOT 53) ─────────────────────────
        // Exigences propres à l'exploitation minière, chacune rattachée à la
        // clause ISO 45001/14001 qui la fonde (traçabilité normative conservée).
        r = "MINIER";
        add(templates, order, r, "45001 §8.1.2", "La gestion des explosifs est-elle maîtrisée (stockage agréé, transport, comptabilité matière, habilitations boutefeux, périmètres de tir) ?", "Registre des explosifs, certificats boutefeux, procédures de tir, gestion des ratés.");
        add(templates, order, r, "45001 §6.1.2", "La stabilité des terrains est-elle surveillée (fronts de taille, gradins, talus, soutènement souterrain) avec des seuils d'alerte définis ?", "Rapports géotechniques, instrumentation (extensomètres, radars de pente), plans de soutènement.");
        add(templates, order, r, "14001 §8.1", "Les installations de gestion des résidus (digues TSF, bassins) sont-elles inspectées selon un programme défini avec revue par un ingénieur désigné ?", "Conformité GISTM le cas échéant : inspections, niveaux piézométriques, revue annuelle indépendante, plan de rupture.");
        add(templates, order, r, "45001 §8.1", "La ventilation des travaux souterrains garantit-elle des atmosphères saines (débits, gaz, contrôles avant reprise de poste) ?", "Plans de ventilation, mesures CO/NO2/CH4, procédures d'atmosphères appauvries.");
        add(templates, order, r, "45001 §8.1.2", "L'interaction engins-piétons est-elle maîtrisée (plans de circulation, séparation des flux, détection de proximité, angles morts) ?", "Plan de circulation mine, systèmes anticollision, règles de priorité, zones d'exclusion.");
        add(templates, order, r, "45001 §6.1.2", "La fatigue des opérateurs est-elle gérée (rotations postées, durées de conduite, dépistage en début de poste) ?", "Politique fatigue, planification des postes, dispositifs de détection de somnolence.");
        add(templates, order, r, "45001 §8.1.2", "L'exposition aux poussières (dont silice cristalline) est-elle évaluée et maîtrisée aux postes critiques (foration, concassage, chargement) ?", "Mesures d'empoussiérage, abattage par voie humide, captage, suivi médical silicose.");
        add(templates, order, r, "45001 §8.1.2", "L'exposition au bruit et aux vibrations (corps entier, main-bras) est-elle évaluée avec moyens de maîtrise hiérarchisés ?", "Cartographie bruit, cabines insonorisées, maintenance des sièges, EPI auditifs adaptés.");
        add(templates, order, r, "45001 §8.1.2", "Les énergies dangereuses sont-elles consignées lors des interventions (LOTO électrique, hydraulique, gravitaire) sur les installations fixes et mobiles ?", "Procédures de consignation, cadenas personnels, essais de démarrage impossible.");
        add(templates, order, r, "45001 §8.1.2", "Les travaux en espaces confinés (trémies, silos, broyeurs, galeries) suivent-ils un permis avec contrôle d'atmosphère et surveillant ?", "Permis espace confiné, détecteurs multigaz étalonnés, moyens de sauvetage.");
        add(templates, order, r, "14001 §8.1", "Les produits de traitement dangereux (cyanure, acides, réactifs) sont-ils gérés selon les codes applicables (réception, stockage, neutralisation, antidotes) ?", "Code international du cyanure le cas échéant : rétentions, douches, kits HCN, formation.");
        add(templates, order, r, "14001 §8.1", "Les eaux minières (exhaure, drainage acide, eaux de procédé) sont-elles caractérisées, traitées et surveillées avant rejet ?", "Bilans hydriques, points de rejet autorisés, analyses périodiques, drainage acide DMA.");
        add(templates, order, r, "45001 §8.2", "Le sauvetage minier est-il organisé (équipe formée et équipée, chambres de refuge, exercices souterrains périodiques) ?", "Convention d'assistance, ARI, chambres de refuge contrôlées, comptes rendus d'exercices.");
        add(templates, order, r, "45001 §7.2", "Les conducteurs d'engins et opérateurs d'installations détiennent-ils les autorisations de conduite et habilitations à jour ?", "Matrice d'habilitations, CACES/équivalents, autorisations site, recyclages.");
        add(templates, order, r, "45001 §8.1.4", "Les entreprises extérieures intervenant sur site minier sont-elles intégrées au système (induction, plans de prévention, supervision terrain) ?", "Inductions tracées, audits sous-traitants, exigences contractuelles HSE.");
        add(templates, order, r, "14001 §6.1.2", "Les impacts sur les communautés riveraines (bruit de tir, vibrations, poussières, trafic) sont-ils évalués, surveillés et les griefs traités ?", "Mesures de vibrations de tir (PPV), registre des plaintes, mécanisme de règlement des griefs.");
        add(templates, order, r, "14001 §8.1", "Le plan de réhabilitation progressive et de fermeture est-il défini, provisionné et mis en œuvre au rythme de l'exploitation ?", "Garanties financières, surfaces réhabilitées vs plan, revégétalisation, suivi post-fermeture.");
        add(templates, order, r, "45001 §6.1.2", "Les tirs de mine font-ils l'objet d'une analyse de risques spécifique (projections, vibrations, gaz de tir, reprise après tir) ?", "Plans de tir validés, périmètres d'évacuation, délais de réintégration, mesures de gaz post-tir.");
        add(templates, order, r, "45001 §9.1", "La surveillance de la santé au travail couvre-t-elle les expositions minières (silice, bruit, vibrations, radiations le cas échéant) ?", "Visites médicales renforcées, suivi dosimétrique, aptitudes aux postes de sécurité.");
        add(templates, order, r, "45001 §8.1.3", "Les modifications d'infrastructures minières (nouvelles galeries, extensions de fosse, rehausses de digue) suivent-elles un processus de gestion du changement ?", "Études préalables, validations géotechniques, mises à jour des plans et consignes.");

        // Seed PAR RÉFÉRENTIEL : seules les bibliothèques absentes sont insérées
        // (les bases existantes reçoivent ainsi MINIER sans toucher aux autres,
        // et rien n'écrase jamais une bibliothèque modifiée par un admin).
        java.util.Map<String, List<AuditChecklistTemplate>> byReferential = new java.util.LinkedHashMap<>();
        for (AuditChecklistTemplate t : templates) {
            byReferential.computeIfAbsent(t.getReferential(), k -> new ArrayList<>()).add(t);
        }
        byReferential.forEach((referential, group) -> {
            if (templateRepository.countByReferential(referential) == 0) {
                templateRepository.saveAll(group);
                LOG.info("Checklist d'audit seedee : {} — {} questions", referential, group.size());
            }
        });
    }

    private void add(List<AuditChecklistTemplate> list, int[] order, String referential,
                     String clause, String question, String guidance) {
        AuditChecklistTemplate t = new AuditChecklistTemplate();
        t.setReferential(referential);
        t.setClause(clause);
        t.setQuestion(question);
        t.setGuidance(guidance);
        t.setOrderIndex(order[0]++);
        t.setActive(Boolean.TRUE);
        list.add(t);
    }
}
