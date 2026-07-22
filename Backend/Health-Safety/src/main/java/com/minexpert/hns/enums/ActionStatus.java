package com.minexpert.hns.enums;

public enum ActionStatus {
    PENDING, IN_PROGRESS, COMPLETED, CANCELLED,
    // ISO 45001 10.2 e : etats post-execution — l'action ne s'arrete plus a
    // "COMPLETED" mais passe par une revue d'efficacite (VERIFIED = efficace,
    // REOPENED = jugee inefficace, a reprendre).
    VERIFIED, REOPENED;
}
