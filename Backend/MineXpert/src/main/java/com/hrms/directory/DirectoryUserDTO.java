package com.hrms.directory;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — utilisateur retourné par la recherche d'annuaire (réel ou démo).
 * Aucune donnée sensible : uniquement les attributs d'identité nécessaires
 * au pré-remplissage du formulaire de création.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DirectoryUserDTO {
    private String login;       // sAMAccountName
    private String email;
    private String displayName;
    private String department;
    private String title;       // intitulé de poste si disponible
    private boolean alreadyImported; // un compte SafeX existe déjà pour ce login
}
