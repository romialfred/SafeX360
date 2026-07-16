package com.minexpert.hns.dto.audit;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload de l'écran « Exécution d'audit » (POST /audit/execute).
 *
 * <p>Le formulaire poste en une seule fois les entretiens par domaine
 * ({@code executions}), le rapport d'audit ({@code report}), ses contributeurs
 * ({@code contributors}) et les recommandations ({@code recommendations}).
 * Tant que ce DTO ne portait que {@code report} + {@code contributors},
 * Jackson écartait silencieusement les entretiens et les recommandations
 * (fail-on-unknown-properties désactivé par défaut) : la saisie était perdue.</p>
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExecuteRequest {
    private ReportDTO report;
    private List<ContributorDTO> contributors;
    /** Entretiens d'exécution rattachés aux domaines de l'audit (FK area_id obligatoire). */
    private List<AreaExecutionDTO> executions;
    /** Recommandations issues de l'audit (FK audit_id obligatoire). */
    private List<RecommendationDTO> recommendations;

    /** Constructeur historique (rapport + contributeurs) conservé pour les relectures. */
    public ExecuteRequest(ReportDTO report, List<ContributorDTO> contributors) {
        this.report = report;
        this.contributors = contributors;
    }
}
