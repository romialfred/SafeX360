package com.minexpert.hns.ai.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.audit.AuditChecklistItem;
import com.minexpert.hns.entity.audit.AuditChecklistTemplate;
import com.minexpert.hns.entity.audit.Observation;
import com.minexpert.hns.entity.audit.Report;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.audit.AuditChecklistItemRepository;
import com.minexpert.hns.repository.audit.AuditChecklistTemplateRepository;
import com.minexpert.hns.repository.audit.AuditRepository;
import com.minexpert.hns.repository.audit.ObservationRepository;
import com.minexpert.hns.repository.audit.ReportRepository;

import lombok.RequiredArgsConstructor;

/**
 * LOT 53 — Assistance IA du module Audits (ISO 19011), OPTIONNELLE comme pour
 * les inspections : l'IA PROPOSE, l'auditeur DISPOSE — aucune écriture directe.
 *
 * Deux capacités :
 *   1. suggestClassification : à partir du fait observé, propose une
 *      classification ISO (NC_MAJEURE / NC_MINEURE / OBSERVATION / OPPORTUNITE)
 *      et une clause, ANCRÉE dans le vocabulaire des clauses réellement
 *      présentes dans les bibliothèques de checklist du référentiel.
 *   2. reviewReport : relecture du rapport d'audit (complétude ISO §6.5,
 *      formulation factuelle, cohérence constats/checklist) avec score,
 *      points forts, manques et suggestions.
 *
 * Sans clé API (ANTHROPIC_API_KEY absente) : repli démo DÉTERMINISTE construit
 * à partir des données réelles de l'audit, clairement étiqueté demo=true.
 */
@Service
@RequiredArgsConstructor
public class AIAuditService {

    private static final Logger LOG = LoggerFactory.getLogger(AIAuditService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final AnthropicClient anthropicClient;
    private final AuditRepository auditRepository;
    private final ObservationRepository observationRepository;
    private final AuditChecklistItemRepository checklistItemRepository;
    private final AuditChecklistTemplateRepository templateRepository;
    private final ReportRepository reportRepository;

    @Value("${anthropic.audit-model:claude-opus-4-8}")
    private String auditModel;

    public String getAuditModel() {
        return auditModel;
    }

    // ─────────────────────────────────────────────────────────────────────
    // 1. Suggestion de classification d'un constat
    // ─────────────────────────────────────────────────────────────────────

    public Map<String, Object> suggestClassification(String title, String observedFact, String referential) {
        String fact = observedFact == null ? "" : observedFact.trim();
        if (fact.isEmpty()) {
            fact = title == null ? "" : title.trim();
        }
        // Clauses réellement disponibles pour ancrer la suggestion
        List<AuditChecklistTemplate> templates = (referential == null || referential.isBlank())
                ? new ArrayList<>()
                : templateRepository.findByReferentialAndActiveTrueOrderByOrderIndexAsc(referential.trim());
        String clausesContext = templates.stream()
                .map(t -> t.getClause() + " — " + t.getQuestion())
                .collect(Collectors.joining("\n"));

        if (!anthropicClient.isConfigured()) {
            return mockClassification(fact, templates);
        }
        try {
            String system = "Tu es un auditeur principal certifié ISO 19011:2018 dans le secteur minier. "
                    + "Tu classes les constats d'audit avec rigueur : NC_MAJEURE (défaillance du système ou "
                    + "risque grave), NC_MINEURE (écart ponctuel à une exigence), OBSERVATION (point de "
                    + "vigilance sans écart avéré), OPPORTUNITE (piste d'amélioration). "
                    + "Réponds UNIQUEMENT en JSON strict : {\"classification\":\"...\",\"clause\":\"...\","
                    + "\"justification\":\"...\"} — justification factuelle en français, 2 phrases max, "
                    + "clause choisie dans la liste fournie (ou vide si aucune ne convient).";
            String user = "Fait observé pendant l'audit :\n" + fact
                    + (clausesContext.isEmpty() ? "" : "\n\nClauses du référentiel " + referential + " :\n" + clausesContext);
            String raw = anthropicClient.completeText(system, user, auditModel, 600);
            JsonNode node = MAPPER.readTree(stripFences(raw));
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("classification", node.path("classification").asText("OBSERVATION"));
            out.put("clause", node.path("clause").asText(""));
            out.put("justification", node.path("justification").asText(""));
            out.put("demo", false);
            return out;
        } catch (Exception e) {
            LOG.warn("Suggestion IA indisponible, repli demo: {}", e.getMessage());
            return mockClassification(fact, templates);
        }
    }

    /** Repli démo : heuristique transparente fondée sur le vocabulaire du constat. */
    private Map<String, Object> mockClassification(String fact, List<AuditChecklistTemplate> templates) {
        String f = fact.toLowerCase(Locale.ROOT);
        String classification;
        if (containsAny(f, "aucun", "absence", "inexistant", "jamais", "grave", "danger immédiat", "mortel", "effondrement")) {
            classification = "NC_MAJEURE";
        } else if (containsAny(f, "non conforme", "non respect", "écart", "expiré", "manquant", "incomplet", "pas à jour", "défaut")) {
            classification = "NC_MINEURE";
        } else if (containsAny(f, "pourrait", "amélior", "optimis", "suggestion", "opportunité")) {
            classification = "OPPORTUNITE";
        } else {
            classification = "OBSERVATION";
        }
        // Clause la plus proche par recouvrement de mots significatifs
        String bestClause = "";
        int bestScore = 0;
        for (AuditChecklistTemplate t : templates) {
            int score = 0;
            for (String word : t.getQuestion().toLowerCase(Locale.ROOT).split("[^\\p{L}]+")) {
                if (word.length() > 5 && f.contains(word)) score++;
            }
            if (score > bestScore) {
                bestScore = score;
                bestClause = t.getClause();
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("classification", classification);
        out.put("clause", bestClause);
        out.put("justification", "Suggestion du mode démo (heuristique lexicale) — à confirmer par l'auditeur. "
                + "Configurez ANTHROPIC_API_KEY pour une analyse IA réelle.");
        out.put("demo", true);
        return out;
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. Revue du rapport d'audit
    // ─────────────────────────────────────────────────────────────────────

    public Map<String, Object> reviewReport(Long auditId) throws HSException {
        Audit audit = auditRepository.findById(auditId)
                .orElseThrow(() -> new HSException("AUDIT_NOT_FOUND"));
        Report report = reportRepository.findByAudit_Id(auditId).orElse(null);
        List<Observation> observations = observationRepository.findByAudit_Id(auditId);
        List<AuditChecklistItem> checklist = checklistItemRepository.findByAuditIdOrderByReferentialAscIdAsc(auditId);

        long unclassified = observations.stream()
                .filter(o -> o.getClassification() == null || o.getClassification().isBlank()).count();
        long unevaluated = checklist.stream().filter(i -> "A_EVALUER".equals(i.getResult())).count();
        long ncChecklist = checklist.stream().filter(i -> "NON_CONFORME".equals(i.getResult())).count();
        long ncFindings = observations.stream()
                .filter(o -> o.getClassification() != null && o.getClassification().startsWith("NC_")).count();

        if (!anthropicClient.isConfigured()) {
            return mockReview(audit, report, observations.size(), unclassified, unevaluated, ncChecklist, ncFindings);
        }
        try {
            String constats = observations.stream()
                    .map(o -> "- [" + (o.getClassification() == null ? "NON CLASSÉ" : o.getClassification())
                            + (o.getClause() != null ? " · clause " + o.getClause() : "") + "] "
                            + o.getTitle() + " : " + o.getObservedFact())
                    .collect(Collectors.joining("\n"));
            String system = "Tu es un auditeur principal ISO 19011:2018 (secteur minier) qui relit un rapport "
                    + "d'audit interne avant diffusion (§6.5). Évalue : complétude (conclusions, critères, "
                    + "périmètre), formulation factuelle et vérifiable des constats, cohérence entre la "
                    + "checklist et les constats formels, traçabilité aux clauses. Réponds UNIQUEMENT en JSON "
                    + "strict : {\"qualityScore\":0-10,\"strengths\":[\"...\"],\"gaps\":[\"...\"],"
                    + "\"suggestions\":[\"...\"]} en français, 3 éléments max par liste.";
            String user = "Audit " + audit.getRefNumber() + " — " + audit.getTitle()
                    + "\nConclusions du rapport :\n" + (report != null && report.getDescription() != null
                        ? report.getDescription() : "(aucune conclusion rédigée)")
                    + "\n\nConstats (" + observations.size() + ", dont " + unclassified + " non classés) :\n"
                    + (constats.isEmpty() ? "(aucun)" : constats)
                    + "\n\nChecklist : " + checklist.size() + " questions, " + unevaluated
                    + " à évaluer, " + ncChecklist + " non conformes.";
            String raw = anthropicClient.completeText(system, user, auditModel, 1200);
            JsonNode node = MAPPER.readTree(stripFences(raw));
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("qualityScore", node.path("qualityScore").asDouble(5));
            out.put("strengths", toList(node.path("strengths")));
            out.put("gaps", toList(node.path("gaps")));
            out.put("suggestions", toList(node.path("suggestions")));
            out.put("demo", false);
            return out;
        } catch (Exception e) {
            LOG.warn("Revue IA indisponible, repli demo: {}", e.getMessage());
            return mockReview(audit, report, observations.size(), unclassified, unevaluated, ncChecklist, ncFindings);
        }
    }

    /** Repli démo : revue déterministe construite sur les données réelles de l'audit. */
    private Map<String, Object> mockReview(Audit audit, Report report, long totalFindings, long unclassified,
                                           long unevaluated, long ncChecklist, long ncFindings) {
        List<String> strengths = new ArrayList<>();
        List<String> gaps = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();
        double score = 8.0;

        if (report != null && report.getDescription() != null && report.getDescription().length() > 80) {
            strengths.add("Des conclusions rédigées et substantielles sont présentes dans le rapport.");
        } else {
            gaps.add("Les conclusions du rapport sont absentes ou très courtes (ISO 19011 §6.5 exige des conclusions d'audit).");
            score -= 2;
        }
        if (totalFindings > 0 && unclassified == 0) {
            strengths.add("Tous les constats sont classés selon ISO 19011 (NC, observation, opportunité).");
        } else if (unclassified > 0) {
            gaps.add(unclassified + " constat(s) sans classification — la clôture sera bloquée tant qu'ils ne sont pas classés.");
            score -= 1.5;
        }
        if (unevaluated > 0) {
            gaps.add(unevaluated + " question(s) de checklist restent à évaluer.");
            score -= 1;
        } else if (ncChecklist > 0 && ncFindings == 0) {
            suggestions.add(ncChecklist + " non-conformité(s) de checklist sans constat formel associé : créer les constats correspondants.");
            score -= 0.5;
        }
        if (totalFindings == 0) {
            suggestions.add("Aucun constat enregistré : confirmer qu'aucun écart n'a été relevé ou compléter la collecte de preuves (§6.4.7).");
        }
        suggestions.add("Vérifier que chaque constat cite une preuve tangible et la clause du critère d'audit.");

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("qualityScore", Math.max(0, Math.min(10, score)));
        out.put("strengths", strengths);
        out.put("gaps", gaps);
        out.put("suggestions", suggestions);
        out.put("demo", true);
        return out;
    }

    // ─────────────────────────────────────────────────────────────────────

    private static boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) return true;
        }
        return false;
    }

    private static List<String> toList(JsonNode node) {
        List<String> out = new ArrayList<>();
        if (node != null && node.isArray()) {
            node.forEach(n -> out.add(n.asText()));
        }
        return out;
    }

    /** Retire les éventuelles clôtures markdown ```json ... ``` de la réponse modèle. */
    private static String stripFences(String raw) {
        if (raw == null) return "{}";
        String s = raw.trim();
        if (s.startsWith("```")) {
            int first = s.indexOf('\n');
            int last = s.lastIndexOf("```");
            if (first >= 0 && last > first) s = s.substring(first + 1, last).trim();
        }
        return s;
    }
}
