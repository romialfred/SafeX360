package com.minexpert.hns.seed;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

import com.minexpert.hns.clients.HrmsClient;
import com.minexpert.hns.dto.request.EmpEmailPosResponse;
import com.minexpert.hns.entity.Media;
import com.minexpert.hns.entity.compliance.ComplianceDocs;
import com.minexpert.hns.entity.compliance.PositionAssignment;
import com.minexpert.hns.entity.compliance.Requirement;
import com.minexpert.hns.enums.DocStatus;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.repository.MediaRepository;
import com.minexpert.hns.repository.compliance.ComplianceDocsRepository;
import com.minexpert.hns.repository.compliance.PositionAssignmentRepository;
import com.minexpert.hns.repository.compliance.RequirementRepository;

import lombok.RequiredArgsConstructor;

/**
 * LOT 49 — Données de démonstration Conformité Réglementaire.
 *
 * Seeder idempotent : ne s'exécute que si la table requirement est vide
 * (exigences) et si position_assignment est vide (affectations + documents).
 * Les affectations dépendent du service HRMS (employés + postes) : la partie
 * HRMS est retentée en arrière-plan sans bloquer le démarrage.
 */
@Component
@RequiredArgsConstructor
public class ComplianceSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ComplianceSeeder.class);

    private static final int HRMS_RETRY_COUNT = 6;
    private static final long HRMS_RETRY_DELAY_MS = 20_000L;

    private final RequirementRepository requirementRepository;
    private final PositionAssignmentRepository positionAssignmentRepository;
    private final ComplianceDocsRepository complianceDocsRepository;
    private final MediaRepository mediaRepository;
    private final HrmsClient hrmsClient;
    private final CacheManager cacheManager;

    @Override
    public void run(ApplicationArguments args) {
        Thread worker = new Thread(this::seedSafely, "compliance-seeder");
        worker.setDaemon(true);
        worker.start();
    }

    private void seedSafely() {
        try {
            Map<String, Requirement> requirements = seedRequirements();
            if (positionAssignmentRepository.count() > 0) {
                log.info("[ComplianceSeeder] Affectations déjà présentes — seed ignoré.");
                return;
            }
            List<EmpEmailPosResponse> employees = fetchEmployeesWithRetry();
            if (employees.isEmpty()) {
                log.warn("[ComplianceSeeder] HRMS indisponible ou aucun employé — affectations non seedées "
                        + "(nouvel essai au prochain démarrage).");
                return;
            }
            seedAssignmentsAndDocuments(requirements, employees);
            clearComplianceCaches();
            log.info("[ComplianceSeeder] Seed Conformité Réglementaire terminé.");
        } catch (Exception ex) {
            log.warn("[ComplianceSeeder] Seed interrompu (non bloquant) : {}", ex.getMessage());
        }
    }

    // ─── Exigences ──────────────────────────────────────────────────────────

    private Map<String, Requirement> seedRequirements() {
        Map<String, Requirement> byCode = new HashMap<>();
        if (requirementRepository.count() > 0) {
            requirementRepository.findAll().forEach(r -> {
                if (r.getReferenceCode() != null) {
                    byCode.put(r.getReferenceCode(), r);
                }
            });
            log.info("[ComplianceSeeder] Exigences déjà présentes ({}) — seed exigences ignoré.", byCode.size());
            return byCode;
        }

        List<Requirement> toSave = new ArrayList<>();
        toSave.add(req("EXG-001", "Certificat d'aptitude médicale au poste",
                "Visite médicale d'aptitude réalisée par le médecin du travail, obligatoire pour tout salarié affecté à un poste en zone minière.",
                "Medical", "Annually", "Certificate",
                "Code du Travail — Médecine du travail", "Ministère du Travail", "CRITIQUE"));
        toSave.add(req("EXG-002", "Visite médicale spéciale poussières (silicose)",
                "Suivi médical renforcé des salariés exposés aux poussières de silice cristalline : radiographie pulmonaire et spirométrie.",
                "Medical", "Semi-Annually", "Scan",
                "Convention OIT C176 — Sécurité dans les mines", "Organisation Internationale du Travail", "CRITIQUE"));
        toSave.add(req("EXG-003", "Habilitation boutefeu (tir de mines)",
                "Autorisation préfectorale individuelle de mise en oeuvre des explosifs : stockage, transport, chargement et tir.",
                "Legal", "Annually", "Certificate",
                "Code Minier — Réglementation des explosifs", "Direction Générale des Mines", "CRITIQUE"));
        toSave.add(req("EXG-004", "Permis de conduite d'engins miniers (CACES)",
                "Certificat d'aptitude à la conduite en sécurité des engins de chantier : tombereaux, pelles hydrauliques, chargeuses.",
                "Training", "Biennially", "Certificate",
                "Recommandation CACES R482", "Organisme certificateur agréé", "MAJEURE"));
        toSave.add(req("EXG-005", "Formation travail en espace confiné",
                "Formation à l'intervention en espace confiné : détection de gaz, ventilation, procédures d'évacuation et de sauvetage.",
                "Training", "Annually", "Certificate",
                "ISO 45001 — Maîtrise opérationnelle", "Organisme de formation HSE", "CRITIQUE"));
        toSave.add(req("EXG-006", "Formation travail en hauteur",
                "Formation au port du harnais, vérification des points d'ancrage et utilisation des équipements antichute.",
                "Training", "Biennially", "Certificate",
                "ISO 45001 — Maîtrise opérationnelle", "Organisme de formation HSE", "MAJEURE"));
        toSave.add(req("EXG-007", "Certification Sauveteur Secouriste du Travail (SST)",
                "Formation initiale ou maintien-actualisation des compétences de secourisme en milieu professionnel.",
                "Training", "Biennially", "Certificate",
                "Référentiel INRS SST", "INRS / Croix-Rouge", "MAJEURE"));
        toSave.add(req("EXG-008", "Habilitation électrique (B1V/B2V/BR)",
                "Habilitation pour travaux d'ordre électrique sur installations basse tension des sites d'extraction et de traitement.",
                "Legal", "Biennially", "Certificate",
                "Norme NF C18-510", "Employeur après formation certifiée", "CRITIQUE"));
        toSave.add(req("EXG-009", "Formation manipulation des produits chimiques (SGH)",
                "Sensibilisation au Système Général Harmonisé : étiquetage, fiches de données de sécurité, stockage des réactifs de laboratoire.",
                "Training", "Annually", "Certificate",
                "Règlement SGH/GHS", "Service HSE interne", "MAJEURE"));
        toSave.add(req("EXG-010", "Audiogramme annuel (exposition au bruit)",
                "Contrôle audiométrique des salariés exposés à un niveau sonore quotidien supérieur à 85 dB(A).",
                "Medical", "Annually", "Scan",
                "ISO 45001 — Surveillance de la santé", "Médecine du travail", "STANDARD"));
        toSave.add(req("EXG-011", "Accueil sécurité site et test de validation",
                "Induction HSE obligatoire avant tout accès au site : risques majeurs, plan d'évacuation, consignes EPI, test de compréhension.",
                "Safety", "On Demand", "PDF",
                "Procédure interne HSE-ACC-01", "Service HSE interne", "STANDARD"));
        toSave.add(req("EXG-012", "Formation conduite défensive",
                "Formation à la conduite préventive sur pistes minières : distances de sécurité, angles morts des engins, conduite de nuit.",
                "Training", "Biennially", "Certificate",
                "Procédure interne HSE-TRA-04", "Service HSE interne", "STANDARD"));
        toSave.add(req("EXG-013", "Autorisation de travail à chaud (permis feu)",
                "Habilitation à délivrer ou exécuter des permis feu : soudage, meulage, oxycoupage hors zones dédiées.",
                "Safety", "Annually", "PDF",
                "ISO 45001 — Permis de travail", "Service HSE interne", "MAJEURE"));
        toSave.add(req("EXG-014", "Certificat de radioprotection (zones contrôlées)",
                "Formation réglementaire pour l'accès aux zones contrôlées : sources scellées des analyseurs et jauges nucléaires.",
                "Legal", "Annually", "Certificate",
                "Normes AIEA GSR Part 3", "Autorité de Radioprotection Nationale", "CRITIQUE"));
        toSave.add(req("EXG-015", "Attestation de dotation et port des EPI",
                "Attestation annuelle de remise des équipements de protection individuelle et d'engagement au port obligatoire.",
                "Safety", "Annually", "PDF",
                "ISO 45001 — Équipements de protection", "Service HSE interne", "STANDARD"));

        requirementRepository.saveAll(toSave).forEach(r -> byCode.put(r.getReferenceCode(), r));
        log.info("[ComplianceSeeder] {} exigences réglementaires créées.", byCode.size());
        return byCode;
    }

    private Requirement req(String code, String title, String description, String category,
            String frequency, String docType, String legalSource, String authority, String criticality) {
        LocalDateTime now = LocalDateTime.now();
        Requirement r = new Requirement();
        r.setReferenceCode(code);
        r.setTitle(title);
        r.setDescription(description);
        r.setCategory(category);
        r.setRenewalFrequency(frequency);
        r.setDocType(docType);
        r.setLegalSource(legalSource);
        r.setAuthority(authority);
        r.setCriticality(criticality);
        r.setStatus(Status.ACTIVE);
        r.setCreatedAt(now);
        r.setUpdatedAt(now);
        return r;
    }

    // ─── Affectations par poste + documents ────────────────────────────────

    private List<EmpEmailPosResponse> fetchEmployeesWithRetry() {
        for (int attempt = 1; attempt <= HRMS_RETRY_COUNT; attempt++) {
            try {
                List<EmpEmailPosResponse> employees = Optional
                        .ofNullable(hrmsClient.getAllEmployeesWithEmailAndPosition())
                        .orElse(List.of());
                if (!employees.isEmpty()) {
                    return employees;
                }
            } catch (Exception ex) {
                log.debug("[ComplianceSeeder] HRMS non joignable (essai {}/{}) : {}",
                        attempt, HRMS_RETRY_COUNT, ex.getMessage());
            }
            try {
                Thread.sleep(HRMS_RETRY_DELAY_MS);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                return List.of();
            }
        }
        return List.of();
    }

    private void seedAssignmentsAndDocuments(Map<String, Requirement> requirements,
            List<EmpEmailPosResponse> employees) {
        if (requirements.isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        // Médias placeholder partagés (un PDF minimal valide).
        Media mediaCert = mediaRepository.save(placeholderPdf("certificat_demonstration.pdf"));
        Media mediaScan = mediaRepository.save(placeholderPdf("examen_medical_demonstration.pdf"));
        Media mediaAtt = mediaRepository.save(placeholderPdf("attestation_demonstration.pdf"));

        // Postes distincts → affectations d'exigences selon le métier.
        Map<Long, String> positions = new HashMap<>();
        for (EmpEmailPosResponse emp : employees) {
            if (emp.getPositionId() != null) {
                positions.putIfAbsent(emp.getPositionId(), Optional.ofNullable(emp.getPosition()).orElse(""));
            }
        }

        Map<Long, Set<Requirement>> assignedByPosition = new HashMap<>();
        List<PositionAssignment> assignments = new ArrayList<>();
        for (Map.Entry<Long, String> position : positions.entrySet()) {
            Set<Requirement> set = requirementsForPosition(position.getValue(), position.getKey(), requirements);
            assignedByPosition.put(position.getKey(), set);
            for (Requirement r : set) {
                assignments.add(new PositionAssignment(null, position.getKey(), r, Status.ACTIVE, now, now));
            }
        }
        positionAssignmentRepository.saveAll(assignments);
        log.info("[ComplianceSeeder] {} affectations créées pour {} postes.", assignments.size(), positions.size());

        // Documents de conformité : distribution déterministe sur 5 statuts.
        List<ComplianceDocs> docs = new ArrayList<>();
        for (EmpEmailPosResponse emp : employees) {
            if (emp.getId() == null || emp.getPositionId() == null) {
                continue;
            }
            Set<Requirement> reqs = assignedByPosition.getOrDefault(emp.getPositionId(), Set.of());
            for (Requirement r : reqs) {
                int h = Math.floorMod((int) (emp.getId() * 31 + r.getId() * 17), 100);
                ComplianceDocs doc = new ComplianceDocs();
                doc.setEmployeeId(emp.getId());
                doc.setRequirement(r);
                if (h < 55) { // CONFORME
                    doc.setMedia(mediaFor(r, mediaCert, mediaScan, mediaAtt));
                    doc.setStatus(DocStatus.VALID);
                    doc.setExpiryDate(today.plusDays(60 + (h * 5L)));
                    doc.setComment("Document validé — données de démonstration SafeX 360");
                } else if (h < 67) { // EXPIRE BIENTÔT
                    doc.setMedia(mediaFor(r, mediaCert, mediaScan, mediaAtt));
                    doc.setStatus(DocStatus.VALID);
                    doc.setExpiryDate(today.plusDays(3 + (h % 25)));
                    doc.setComment("Renouvellement à planifier — données de démonstration SafeX 360");
                } else if (h < 82) { // EXPIRÉ
                    doc.setMedia(mediaFor(r, mediaCert, mediaScan, mediaAtt));
                    doc.setStatus(DocStatus.VALID);
                    doc.setExpiryDate(today.minusDays(5 + ((h - 67) * 12L)));
                    doc.setComment("Document expiré — données de démonstration SafeX 360");
                } else if (h < 90) { // EN ATTENTE DE VALIDATION
                    doc.setMedia(mediaFor(r, mediaCert, mediaScan, mediaAtt));
                    doc.setStatus(DocStatus.PENDING);
                    doc.setExpiryDate(today.plusDays(120 + (h % 200)));
                    doc.setComment("Soumis par l'employé, en attente de validation HSE");
                } else { // MANQUANT : aucun document créé
                    continue;
                }
                LocalDateTime created = now.minusDays(10 + (h % 200));
                doc.setCreatedAt(created);
                doc.setUpdatedAt(created);
                docs.add(doc);
            }
        }
        complianceDocsRepository.saveAll(docs);
        log.info("[ComplianceSeeder] {} documents de conformité créés pour {} employés.", docs.size(),
                employees.size());
    }

    private Set<Requirement> requirementsForPosition(String positionName, Long positionId,
            Map<String, Requirement> byCode) {
        String name = Optional.ofNullable(positionName).orElse("").toLowerCase(Locale.ROOT);
        Set<Requirement> set = new LinkedHashSet<>();
        // Socle commun à tous les postes.
        addIfPresent(set, byCode, "EXG-001", "EXG-011", "EXG-015", "EXG-007");
        if (containsAny(name, "conduct", "operat", "chauffeur", "engin", "tombereau")) {
            addIfPresent(set, byCode, "EXG-004", "EXG-012");
        }
        if (containsAny(name, "electr")) {
            addIfPresent(set, byCode, "EXG-008");
        }
        if (containsAny(name, "mainten", "mecan", "soud", "technicien")) {
            addIfPresent(set, byCode, "EXG-008", "EXG-013", "EXG-006");
        }
        if (containsAny(name, "boutefeu", "mineur", "foreur", "tir", "forage", "extraction")) {
            addIfPresent(set, byCode, "EXG-003", "EXG-002", "EXG-005");
        }
        if (containsAny(name, "chim", "labo", "analys")) {
            addIfPresent(set, byCode, "EXG-009", "EXG-014");
        }
        if (containsAny(name, "superviseur", "chef", "respons", "manager", "directeur", "coordinateur")) {
            addIfPresent(set, byCode, "EXG-013", "EXG-006");
        }
        if (containsAny(name, "geolog", "topograph", "ingenieur")) {
            addIfPresent(set, byCode, "EXG-005", "EXG-012");
        }
        // Variété déterministe : 2 exigences supplémentaires selon le poste.
        List<String> filler = List.of("EXG-002", "EXG-005", "EXG-006", "EXG-009", "EXG-010", "EXG-012");
        int base = (int) Math.floorMod(positionId, filler.size());
        addIfPresent(set, byCode, filler.get(base), filler.get((base + 3) % filler.size()));
        return set;
    }

    private boolean containsAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private void addIfPresent(Set<Requirement> set, Map<String, Requirement> byCode, String... codes) {
        for (String code : codes) {
            Requirement r = byCode.get(code);
            if (r != null) {
                set.add(r);
            }
        }
    }

    private Media mediaFor(Requirement r, Media cert, Media scan, Media att) {
        return switch (Optional.ofNullable(r.getDocType()).orElse("PDF")) {
            case "Certificate" -> cert;
            case "Scan" -> scan;
            default -> att;
        };
    }

    private Media placeholderPdf(String name) {
        String pdf = "%PDF-1.4\n"
                + "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
                + "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
                + "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\n"
                + "trailer<</Size 4/Root 1 0 R>>\n%%EOF";
        return new Media(null, name, "application/pdf", pdf.getBytes(StandardCharsets.US_ASCII));
    }

    private void clearComplianceCaches() {
        for (String cacheName : cacheManager.getCacheNames()) {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
            }
        }
    }
}
