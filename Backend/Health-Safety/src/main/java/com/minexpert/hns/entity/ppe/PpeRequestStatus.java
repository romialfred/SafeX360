package com.minexpert.hns.entity.ppe;

public enum PpeRequestStatus {
    PENDING,
    APPROVED,
    REJECTED,
    // Ajouté en fin d'enum (append) : sûr pour un stockage STRING (PpeRequest.status
    // est @Enumerated(STRING)). Livraison effective d'une demande APPROVED.
    DELIVERED,
    // Incrément 4 — retour total des dotations d'une demande déjà distribuée
    // (remise en stock ou réforme). Append en fin d'enum = sûr pour STRING.
    RETURNED,
    // Refonte « Gestion des demandes » — étape magasin entre l'approbation et la
    // distribution (préparation des articles). Append = sûr (colonne VARCHAR).
    PREPARATION
}
