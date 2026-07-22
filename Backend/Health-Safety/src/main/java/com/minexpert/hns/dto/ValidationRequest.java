package com.minexpert.hns.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Corps de la validation d'enquête (ISO 45001 §10.2). Le commentaire est
 * facultatif mais BORNÉ : il devient une pièce du journal d'audit (§7.5.3), on
 * refuse donc côté serveur une saisie démesurée ({@code @Size}, tolérant au
 * null via Bean Validation) plutôt que de la laisser atteindre la colonne.
 */
@Data
@NoArgsConstructor
public class ValidationRequest {

    @Size(max = 2000, message = "VALIDATION_COMMENT_TOO_LONG")
    private String comment;
}
