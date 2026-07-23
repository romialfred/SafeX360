package com.hrms.security;

import org.springframework.stereotype.Component;

/**
 * Politique centrale d'exigence de la MFA.
 *
 * <p>Regle en vigueur : <b>2FA obligatoire pour TOUS les comptes, sans
 * exception</b>. La classe reste le point de passage unique — si une exemption
 * devait un jour exister (compte de service…), elle se declarerait ici et
 * nulle part ailleurs.
 */
@Component
public class MfaRolePolicy {

    /**
     * @param role role du compte — conserve comme point d'extension : la
     *             decision reste centralisee ici si une exemption devait
     *             reapparaitre.
     * @return toujours {@code true}
     */
    public boolean requiresMfa(String role) {
        // 2FA OBLIGATOIRE POUR TOUS LES COMPTES (decision securite), SANS EXCEPTION.
        // A la premiere connexion, apres le changement du mot de passe temporaire,
        // l'enrolement 2FA est force quel que soit le role ; aux connexions
        // suivantes, la verification TOTP est exigee.
        //
        // FAIL-CLOSED sur le role vide/null : un compte sans role echappait a
        // l'obligation, ce qui contredisait « tous les comptes » et offrait un
        // contournement (creer un compte sans role). L'absence de role n'est pas
        // une dispense de second facteur.
        //
        // (Historique : seule une liste PRIVILEGED_ROLES etait soumise a la MFA —
        // cf. git, commits 8fa3dda et anterieurs. Liste supprimee car sans effet.)
        return true;
    }
}
