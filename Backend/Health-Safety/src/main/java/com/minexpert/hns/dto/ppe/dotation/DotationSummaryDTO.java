package com.minexpert.hns.dto.ppe.dotation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** KPI de synthèse + répartition par statut du module « Suivi des dotations EPI ». */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DotationSummaryDTO {
    private int totalEmployees;
    private int compliant;      // CONFORME
    private int incomplete;     // A_COMPLETER
    private int renewalDue;     // A_RENOUVELER
    private int critical;       // CRITIQUE (EPI expirés / manquants critiques)
    private List<StatusCount> distribution;

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class StatusCount {
        private String status;
        private int count;
        private double pct;
    }
}
