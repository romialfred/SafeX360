package com.minexpert.hns.ai.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.minexpert.hns.ai.dto.AICheckpointProposal;
import com.minexpert.hns.ai.dto.AIInspectionAnalysisResponse;
import com.minexpert.hns.ai.dto.AIInspectionReviewResponse;
import com.minexpert.hns.ai.dto.CorrectiveAction;
import com.minexpert.hns.inspections.dto.FindingDTO;
import com.minexpert.hns.inspections.dto.InspectionDetailDTO;

/**
 * AIInspectionMockFallback — Réponses de secours réalistes pour l'assistance
 * IA du module Inspections, utilisées quand ANTHROPIC_API_KEY est absente ou
 * quand l'appel/parse échoue. Garantit que l'utilisateur n'est jamais bloqué
 * (même contrat que AIMockFallback côté incidents).
 *
 * Les mocks sont DÉRIVÉS DES DONNÉES RÉELLES de l'inspection (checkpoints du
 * template, KPI du rapport) pour rester crédibles en démonstration.
 */
@Component
public class AIInspectionMockFallback {

    /** Mock d'analyse photo : propositions prudentes sur les premiers points visuels. */
    public AIInspectionAnalysisResponse buildMockAnalysis(InspectionDetailDTO detail, String zoneLabel) {
        AIInspectionAnalysisResponse r = new AIInspectionAnalysisResponse();
        r.setRelevant(true);
        r.setConfidence(0.55);
        r.setFromMock(true);
        r.setAiModel("mock");

        String cible = detail.getTargetLabel() != null ? detail.getTargetLabel() : "la cible";
        String zone = zoneLabel != null && !zoneLabel.isBlank() ? " (" + zoneLabel + ")" : "";
        r.setOverallObservations(
                "Analyse simulée — la photo de " + cible + zone + " a été reçue. "
                + "En mode démonstration, seuls les points de contrôle visuels reçoivent une proposition prudente. "
                + "Configurez ANTHROPIC_API_KEY pour activer l'analyse réelle par vision IA.");
        r.setDetectedIssues(List.of(
                "Mode démonstration : aucune anomalie réelle n'a été détectée sur la photo."));

        List<AICheckpointProposal> proposals = new ArrayList<>();
        int proposed = 0;
        for (FindingDTO f : detail.getFindings()) {
            String type = f.getResponseType() != null ? f.getResponseType() : "";
            boolean visual = type.equals("BOOLEAN") || type.equals("VISUAL_GRADE");
            AICheckpointProposal p = new AICheckpointProposal();
            p.setCheckpointId(f.getCheckpointId());
            p.setCheckpointLabel(f.getCheckpointLabel());
            if (visual && proposed < 4) {
                p.setObservable(true);
                p.setProposedRawValue(type.equals("BOOLEAN") ? "true" : "GOOD");
                p.setProposedConformity("CONFORM");
                p.setObservation("Proposition simulée : aspect visuel jugé conforme (mode démonstration).");
                p.setConfidence(0.5);
                proposed++;
            } else {
                p.setObservable(false);
                p.setObservation("Non évaluable en mode démonstration.");
                p.setConfidence(0.0);
            }
            proposals.add(p);
        }
        r.setProposals(proposals);

        r.setSuggestedSummary(
                "Inspection de " + cible + " réalisée avec assistance IA (mode démonstration). "
                + proposed + " point(s) de contrôle visuel(s) pré-évalué(s) conforme(s) à titre d'exemple. "
                + "Les valeurs proposées doivent être vérifiées et complétées par l'inspecteur avant soumission.");
        return r;
    }

    /** Mock de relecture de rapport : revue dérivée des KPI réels du rapport. */
    public AIInspectionReviewResponse buildMockReview(InspectionDetailDTO detail) {
        AIInspectionReviewResponse r = new AIInspectionReviewResponse();
        r.setFromMock(true);
        r.setAiModel("mock");

        int total = Math.max(detail.getTotalCheckpoints(), 1);
        int recorded = detail.getFindingsRecorded();
        int missing = Math.max(total - recorded, 0);
        boolean hasSummary = detail.getSummaryReport() != null && !detail.getSummaryReport().isBlank();

        int score = 50;
        score += (int) Math.round(30.0 * recorded / total);
        if (hasSummary) score += 10;
        if (detail.getCriticalNonConformCount() > 0) score -= 10;
        r.setQualityScore(Math.max(20, Math.min(score, 85)));
        r.setVerdict("Relecture simulée (mode démonstration) — évaluation indicative dérivée des indicateurs du rapport.");

        List<String> strengths = new ArrayList<>();
        if (recorded == total) {
            strengths.add("Tous les points de contrôle du référentiel sont renseignés (" + recorded + "/" + total + ").");
        } else if (recorded > 0) {
            strengths.add(recorded + " point(s) de contrôle renseigné(s) sur " + total + ".");
        }
        if (hasSummary) {
            strengths.add("Une synthèse d'inspecteur est présente.");
        }
        if (strengths.isEmpty()) {
            strengths.add("Le cadre d'inspection (template et cible) est correctement défini.");
        }
        r.setStrengths(strengths);

        List<String> gaps = new ArrayList<>();
        if (missing > 0) {
            gaps.add(missing + " point(s) de contrôle sans réponse — à compléter avant soumission.");
        }
        if (!hasSummary) {
            gaps.add("Aucune synthèse d'inspecteur : le rapport PDF mentionnera « Aucune synthèse fournie ».");
        }
        if (detail.getNonConformCount() > 0) {
            gaps.add("Vérifier que chaque non-conformité (" + detail.getNonConformCount()
                    + ") dispose d'une note explicative et d'une preuve photo.");
        }
        if (gaps.isEmpty()) {
            gaps.add("Mode démonstration : aucune lacune réelle n'a été analysée.");
        }
        r.setGaps(gaps);

        r.setUnderCoveredRisks(List.of(
                "Analyse réelle indisponible en mode démonstration — configurez ANTHROPIC_API_KEY pour une revue approfondie des risques."));
        r.setImprovements(List.of(
                "Documenter chaque non-conformité avec note, photo et action immédiate.",
                "Étoffer la synthèse : état général, non-conformités, décisions prises et suites attendues."));

        List<CorrectiveAction> actions = new ArrayList<>();
        if (detail.getCriticalNonConformCount() > 0) {
            actions.add(new CorrectiveAction("P0",
                    "Traiter immédiatement les " + detail.getCriticalNonConformCount()
                            + " non-conformité(s) critique(s) avant remise en service de la cible.",
                    "Immédiat", "ENGINEERING"));
        }
        if (detail.getNonConformCount() > detail.getCriticalNonConformCount()) {
            actions.add(new CorrectiveAction("P2",
                    "Planifier la correction des non-conformités non critiques relevées.",
                    "7j", "ADMINISTRATIVE"));
        }
        r.setRecommendedActions(actions);

        r.setIsoClauses(List.of("ISO 45001 §9.1.1", "ISO 45001 §9.1.2", "ISO 45001 §10.2"));
        r.setImprovedSummary(hasSummary
                ? detail.getSummaryReport()
                : "Inspection de " + (detail.getTargetLabel() != null ? detail.getTargetLabel() : "la cible")
                        + " : " + recorded + "/" + total + " points contrôlés, "
                        + detail.getNonConformCount() + " non-conformité(s) dont "
                        + detail.getCriticalNonConformCount() + " critique(s), "
                        + detail.getWatchCount() + " point(s) à surveiller.");
        return r;
    }
}
