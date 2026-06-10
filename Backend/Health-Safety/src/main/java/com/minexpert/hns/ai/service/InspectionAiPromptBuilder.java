package com.minexpert.hns.ai.service;

import org.springframework.stereotype.Component;

import com.minexpert.hns.inspections.dto.FindingDTO;
import com.minexpert.hns.inspections.dto.InspectionDetailDTO;

/**
 * InspectionAiPromptBuilder — Prompts système et user pour l'assistance IA
 * du module Inspections (analyse photo + relecture de rapport).
 *
 * Deux cas d'usage distincts :
 *  1. ANALYSE PHOTO : la photo d'une partie de la cible est confrontée au
 *     référentiel de checkpoints du template. L'IA ne se prononce que sur
 *     les points réellement observables et propose valeur + conformité.
 *  2. RELECTURE RAPPORT : audit qualité du rapport complet (constats,
 *     conformités, notes, synthèse) avec suggestions d'amélioration.
 *
 * La sortie attendue est toujours un JSON STRICT, parsé manuellement côté
 * service avec fallback mock en cas d'échec.
 */
@Component
public class InspectionAiPromptBuilder {

    // ─────────────────────────────────────────────────────────────────────
    // 1. Analyse photo pendant l'exécution
    // ─────────────────────────────────────────────────────────────────────

    public String buildPhotoSystemPrompt(String language) {
        boolean fr = !"en".equalsIgnoreCase(language);
        return fr
                ? """
                Tu es un inspecteur HSE senior certifié, expert des équipements miniers
                (camions bennes, excavateurs, foreuses, convoyeurs, compresseurs), des locaux
                techniques et des procédures de consignation, avec 20 ans d'expérience en
                Afrique de l'Ouest. Tu maîtrises ISO 45001:2018 (§8.1, §9.1) et les codes
                miniers OHADA.

                Mission : analyser la PHOTO d'une partie de la cible inspectée et la confronter
                au référentiel de points de contrôle fourni.

                Règles STRICTES :
                1. Ne te prononce QUE sur les checkpoints réellement OBSERVABLES sur la photo.
                   Pour tout point non visible : "observable": false, sans valeur proposée.
                2. Ne JAMAIS inventer. Décris uniquement ce qui est visible.
                3. Formats de "proposedRawValue" selon le type du checkpoint :
                   - BOOLEAN → "true" (conforme) ou "false" (non conforme)
                   - VISUAL_GRADE → "GOOD", "WATCH" ou "POOR"
                   - NUMERIC_RANGE → valeur numérique UNIQUEMENT si lisible sur la photo
                     (manomètre, jauge, affichage) ; sinon observable=false
                   - PHOTO_REQUIRED → courte description de la preuve visuelle
                   - FREE_TEXT → observation factuelle courte
                4. "proposedConformity" : CONFORM, WATCH, NON_CONFORM ou NOT_APPLICABLE,
                   cohérent avec la valeur proposée et les bornes/attendus du checkpoint.
                5. Pour chaque point critique non conforme, sois explicite dans "observation".
                6. Si la photo ne montre PAS la cible attendue (selfie, paysage, autre
                   équipement), mets "relevant": false avec "irrelevanceReason".
                7. Sois honnête sur la confiance ("confidence" par point et globale).
                8. "suggestedSummary" : synthèse professionnelle de 3 à 6 phrases, factuelle,
                   mentionnant les non-conformités et points de vigilance détectés.

                Réponds UNIQUEMENT en JSON valide, sans markdown ni texte hors JSON :
                {
                  "relevant": boolean,
                  "irrelevanceReason": "string ou null",
                  "confidence": 0.0 à 1.0,
                  "overallObservations": "Description factuelle de ce que montre la photo",
                  "detectedIssues": ["Anomalie visible hors checkpoints", ...],
                  "proposals": [
                    {
                      "checkpointId": number,
                      "checkpointLabel": "string (écho du libellé fourni)",
                      "observable": boolean,
                      "proposedRawValue": "string ou null",
                      "proposedConformity": "CONFORM|WATCH|NON_CONFORM|NOT_APPLICABLE ou null",
                      "observation": "Ce que tu observes pour ce point",
                      "confidence": 0.0 à 1.0
                    }
                  ],
                  "suggestedSummary": "Synthèse d'inspection proposée"
                }
                """
                : """
                You are a senior certified HSE inspector, expert in mining equipment, technical
                facilities and lockout procedures, with 20 years of experience in West Africa.
                You master ISO 45001:2018 (§8.1, §9.1).

                Mission: analyze the PHOTO of a part of the inspected target against the
                provided checkpoint reference list.

                STRICT rules: only assess checkpoints actually OBSERVABLE in the photo
                ("observable": false otherwise); never invent; "proposedRawValue" formats:
                BOOLEAN → "true"/"false", VISUAL_GRADE → "GOOD"/"WATCH"/"POOR",
                NUMERIC_RANGE → numeric value only if readable on the photo,
                PHOTO_REQUIRED/FREE_TEXT → short factual text. "proposedConformity" must be
                CONFORM, WATCH, NON_CONFORM or NOT_APPLICABLE. If the photo does not show the
                expected target, set "relevant": false. Be honest about confidence.

                Respond ONLY in valid JSON matching the schema (same field names, in English).
                """;
    }

    /**
     * Prompt user : contexte de l'inspection + référentiel des checkpoints
     * (issus du détail, où chaque finding est enrichi du checkpoint).
     */
    public String buildPhotoUserPrompt(InspectionDetailDTO detail, String zoneLabel, String language) {
        boolean fr = !"en".equalsIgnoreCase(language);
        StringBuilder sb = new StringBuilder();

        sb.append(fr ? "CONTEXTE DE L'INSPECTION\n" : "INSPECTION CONTEXT\n");
        sb.append("- Template : ").append(nv(detail.getTemplateName()))
                .append(" (").append(nv(detail.getTemplateCode())).append(", type ")
                .append(detail.getTemplateType() != null ? detail.getTemplateType().name() : "?").append(")\n");
        sb.append("- ").append(fr ? "Cible inspectée : " : "Inspected target: ")
                .append(nv(detail.getTargetLabel())).append("\n");
        sb.append("- Site : ").append(nv(detail.getSiteName())).append("\n");
        if (detail.getObjectives() != null && !detail.getObjectives().isBlank()) {
            sb.append("- ").append(fr ? "Objectifs : " : "Objectives: ").append(detail.getObjectives()).append("\n");
        }
        if (zoneLabel != null && !zoneLabel.isBlank()) {
            sb.append("- ").append(fr
                            ? "Partie photographiée (indiquée par l'inspecteur) : "
                            : "Photographed part (per inspector): ")
                    .append(zoneLabel).append("\n");
        }

        sb.append("\n").append(fr ? "RÉFÉRENTIEL DES POINTS DE CONTRÔLE\n" : "CHECKPOINT REFERENCE LIST\n");
        for (FindingDTO f : detail.getFindings()) {
            sb.append("- checkpointId=").append(f.getCheckpointId())
                    .append(" | ").append(nv(f.getCheckpointLabel()))
                    .append(" | type=").append(nv(f.getResponseType()));
            if (f.getMinValue() != null || f.getMaxValue() != null) {
                sb.append(" | plage=[").append(f.getMinValue()).append(" ; ").append(f.getMaxValue()).append("]");
                if (f.getUnit() != null) sb.append(" ").append(f.getUnit());
            }
            if (Boolean.TRUE.equals(f.getCritical())) {
                sb.append(" | CRITIQUE");
            }
            if (f.getHelpText() != null && !f.getHelpText().isBlank()) {
                sb.append(" | aide=").append(f.getHelpText());
            }
            sb.append("\n");
        }

        sb.append("\n").append(fr
                ? "Analyse la photo jointe et confronte-la à ce référentiel. Réponds en JSON strict selon le schéma défini."
                : "Analyze the attached photo against this reference list. Respond in strict JSON per the defined schema.");
        return sb.toString();
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. Relecture critique du rapport
    // ─────────────────────────────────────────────────────────────────────

    public String buildReviewSystemPrompt(String language) {
        boolean fr = !"en".equalsIgnoreCase(language);
        return fr
                ? """
                Tu es un auditeur qualité HSE senior (lead auditor ISO 45001), spécialiste de
                la revue de rapports d'inspection dans l'industrie minière. Ta mission :
                relire de façon CRITIQUE et CONSTRUCTIVE le rapport d'inspection fourni et
                proposer des améliorations concrètes (amélioration continue, ISO 45001 §10.3).

                Axes d'analyse :
                1. Complétude : points non renseignés, notes absentes sur les non-conformités,
                   preuves photo manquantes sur les points qui en exigent.
                2. Cohérence : valeurs incompatibles avec la conformité retenue, NOT_APPLICABLE
                   douteux, points critiques traités à la légère.
                3. Qualité de la synthèse : factualité, mention des non-conformités, plan d'action.
                4. Couverture des risques : dangers du type de cible insuffisamment couverts.
                5. Actions correctives : pour chaque non-conformité, action selon la hiérarchie
                   de contrôle (ELIMINATION, SUBSTITUTION, ENGINEERING, ADMINISTRATIVE, PPE).

                Règles :
                - Appuie chaque remarque sur un élément PRÉCIS du rapport (cite le point de contrôle).
                - "qualityScore" : 0-100, honnête (80+ = rapport exemplaire, 50-79 = correct avec
                  lacunes, <50 = insuffisant pour validation).
                - "improvedSummary" : réécriture professionnelle de la synthèse (4 à 8 phrases),
                  prête à l'emploi, intégrant les constats réels du rapport.
                - Cite les clauses ISO 45001 précises applicables.

                Réponds UNIQUEMENT en JSON valide, sans markdown ni texte hors JSON :
                {
                  "qualityScore": 0 à 100,
                  "verdict": "Une phrase de verdict global",
                  "strengths": ["Point fort précis", ...],
                  "gaps": ["Lacune précise (citer le point concerné)", ...],
                  "underCoveredRisks": ["Risque insuffisamment couvert", ...],
                  "improvements": ["Suggestion concrète d'amélioration", ...],
                  "recommendedActions": [
                    { "priority": "P0|P1|P2|P3", "action": "Description", "deadline": "Immédiat|24h|72h|7j|30j", "category": "ELIMINATION|SUBSTITUTION|ENGINEERING|ADMINISTRATIVE|PPE" }
                  ],
                  "isoClauses": ["ISO 45001 §X.X.X", ...],
                  "improvedSummary": "Synthèse améliorée prête à l'emploi"
                }
                """
                : """
                You are a senior HSE quality auditor (ISO 45001 lead auditor) specializing in
                inspection report reviews for the mining industry. Critically and constructively
                review the provided inspection report: completeness, consistency, summary
                quality, risk coverage, corrective actions (hierarchy of controls). Base every
                remark on a PRECISE element of the report. Respond ONLY in valid JSON matching
                the schema (same field names, in English).
                """;
    }

    /** Prompt user : rapport complet sérialisé en texte structuré. */
    public String buildReviewUserPrompt(InspectionDetailDTO detail, String language) {
        boolean fr = !"en".equalsIgnoreCase(language);
        StringBuilder sb = new StringBuilder();

        sb.append(fr ? "RAPPORT D'INSPECTION À RELIRE\n" : "INSPECTION REPORT TO REVIEW\n");
        sb.append("- Template : ").append(nv(detail.getTemplateName()))
                .append(" (type ").append(detail.getTemplateType() != null ? detail.getTemplateType().name() : "?").append(")\n");
        sb.append("- ").append(fr ? "Cible : " : "Target: ").append(nv(detail.getTargetLabel())).append("\n");
        sb.append("- Site : ").append(nv(detail.getSiteName())).append("\n");
        sb.append("- ").append(fr ? "Statut : " : "Status: ")
                .append(detail.getStatus() != null ? detail.getStatus().name() : "?").append("\n");
        sb.append("- KPI : ").append(detail.getFindingsRecorded()).append("/").append(detail.getTotalCheckpoints())
                .append(fr ? " points renseignés, " : " checkpoints recorded, ")
                .append(detail.getNonConformCount()).append(fr ? " non-conformités (dont " : " non-conformities (incl. ")
                .append(detail.getCriticalNonConformCount()).append(fr ? " critiques), " : " critical), ")
                .append(detail.getWatchCount()).append(fr ? " à surveiller\n" : " to watch\n");

        sb.append("\n").append(fr ? "CONSTATS DÉTAILLÉS\n" : "DETAILED FINDINGS\n");
        for (FindingDTO f : detail.getFindings()) {
            sb.append("- ").append(nv(f.getCheckpointLabel()))
                    .append(" [type=").append(nv(f.getResponseType()));
            if (Boolean.TRUE.equals(f.getCritical())) sb.append(", CRITIQUE");
            sb.append("] : ");
            sb.append(fr ? "valeur=" : "value=").append(f.getRawValue() != null ? f.getRawValue() : "(non renseigné)");
            sb.append(" | conformité=").append(f.getConformity() != null ? f.getConformity().name() : "(aucune)");
            if (f.getNote() != null && !f.getNote().isBlank()) {
                sb.append(" | note=").append(f.getNote());
            }
            if (f.getOverrideReason() != null && !f.getOverrideReason().isBlank()) {
                sb.append(" | surcharge=").append(f.getOverrideReason());
            }
            sb.append("\n");
        }

        sb.append("\n").append(fr ? "SYNTHÈSE DE L'INSPECTEUR\n" : "INSPECTOR SUMMARY\n");
        sb.append(detail.getSummaryReport() != null && !detail.getSummaryReport().isBlank()
                ? detail.getSummaryReport()
                : (fr ? "(aucune synthèse fournie)" : "(no summary provided)")).append("\n");

        sb.append("\n").append(fr
                ? "Relis ce rapport et réponds en JSON strict selon le schéma défini."
                : "Review this report and respond in strict JSON per the defined schema.");
        return sb.toString();
    }

    private String nv(String s) {
        return s != null ? s : "?";
    }
}
