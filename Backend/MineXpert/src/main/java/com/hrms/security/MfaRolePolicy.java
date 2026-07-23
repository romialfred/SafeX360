package com.hrms.security;

import org.springframework.stereotype.Component;

import com.hrms.entity.Account;

/**
 * Politique d'exigence du second facteur — decision unique et centralisee.
 *
 * <p>Regle : <b>2FA obligatoire pour TOUS les comptes</b>. Le role n'entre plus
 * dans la decision (une liste de roles privilegies laissait passer tous les
 * autres, et un compte sans role echappait a tout).
 *
 * <p>Unique derogation : une DISPENSE explicite posee par un administrateur sur
 * un compte precis ({@link Account#getMfaExempt()}), tracee au journal d'audit et
 * revocable. Une dispense se decide, se voit et se retire ; elle n'est pas un
 * effet de bord d'un role ou d'un champ vide.
 */
@Component
public class MfaRolePolicy {

    /**
     * @param account compte concerne ({@code null} = aucune raison de dispenser)
     * @return vrai si ce compte doit presenter un second facteur
     */
    public boolean requiresMfa(Account account) {
        if (account == null) {
            return true;
        }
        return !Boolean.TRUE.equals(account.getMfaExempt());
    }
}
