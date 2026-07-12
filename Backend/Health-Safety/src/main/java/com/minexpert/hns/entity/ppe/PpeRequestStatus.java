package com.minexpert.hns.entity.ppe;

public enum PpeRequestStatus {
    PENDING,
    APPROVED,
    REJECTED,
    // Ajouté en fin d'enum (append) : sûr pour un stockage STRING (PpeRequest.status
    // est @Enumerated(STRING)). Livraison effective d'une demande APPROVED.
    DELIVERED
}
