package com.minexpert.hns.config;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Garde de cloisonnement pour les mines reçues AILLEURS que dans le paramètre
 * de requête {@code companyId}.
 *
 * <p>{@link CompanyScopeFilter} ne contrôle que le paramètre {@code companyId} :
 * c'est volontaire, car il ne peut pas deviner qu'un segment d'URL est une mine
 * (dans {@code /incidents/get/5}, « 5 » est un incident). Une heuristique
 * générique sur le chemin serait donc fausse et dangereuse. Pour les rares
 * endpoints qui reçoivent la mine en variable de chemin ou dans le corps, on
 * appelle explicitement cette garde — qui relit LES MÊMES en-têtes que le
 * filtre, afin qu'il n'existe qu'une seule définition du périmètre.</p>
 *
 * <p>Mêmes conventions que le filtre : absence de {@code X-User-Companies} =
 * appel système (service-à-service) → autorisé ; {@code X-All-Mines=true} =
 * vue consolidée → autorisé ; sinon appartenance stricte, fail-closed.</p>
 */
@Component
public class CompanyScopeGuard {

    private static final Logger LOG = LoggerFactory.getLogger(CompanyScopeGuard.class);
    private static final String H_COMPANIES = "X-User-Companies";
    private static final String H_ALL_MINES = "X-All-Mines";

    /**
     * Vérifie que la mine ciblée appartient au périmètre de l'appelant.
     *
     * @throws AccessDeniedException (→ 403) si la mine est hors périmètre.
     */
    public void assertInScope(Long companyId) {
        if (companyId == null) {
            return; // rien à contrôler : le service appliquera ses propres règles
        }
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return; // hors contexte HTTP (tâche planifiée, appel interne)
        }
        String companiesHeader = request.getHeader(H_COMPANIES);
        if (companiesHeader == null) {
            return; // appel système : le filtre applique déjà le fail-open ici
        }
        if (Boolean.parseBoolean(request.getHeader(H_ALL_MINES))) {
            return; // vue consolidée
        }
        Set<String> allowed = Arrays.stream(companiesHeader.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
        if (!allowed.contains(String.valueOf(companyId))) {
            LOG.warn("Cloisonnement mines : companyId={} hors perimetre {} sur {} {} -> 403",
                    companyId, allowed, request.getMethod(), request.getRequestURI());
            throw new AccessDeniedException("COMPANY_SCOPE_FORBIDDEN");
        }
    }

    private HttpServletRequest currentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        return (attrs instanceof ServletRequestAttributes sra) ? sra.getRequest() : null;
    }
}
