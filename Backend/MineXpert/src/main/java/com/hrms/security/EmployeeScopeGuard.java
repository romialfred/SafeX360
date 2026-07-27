package com.hrms.security;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * [AUTHZ-01] Cloisonnement mine cote HRMS pour les lectures d'employes (PII /
 * salaires). Replique la doctrine deja appliquee dans HNS (voir
 * {@code CompanyScopeGuard}) : la seule source de verite du perimetre est le
 * contexte injecte par la passerelle apres validation du JWT.
 *
 * <p><b>Chaine de confiance.</b> Les en-tetes utilisateur ({@code X-User-Companies},
 * {@code X-All-Mines}, {@code X-Role}, ...) ne sont honores QUE si la requete
 * porte une identite de service prouvant qu'elle vient de la passerelle
 * (issuer {@code safex-gateway}, scope {@code hrms:proxy}), posee par
 * {@link ServiceIdentityFilter}.</p>
 *
 * <p><b>Appels service-a-service.</b> Les appels internes (HNS avec jeton de
 * service, aucun marqueur utilisateur) ne portent aucun en-tete d'identite
 * utilisateur : ils ne sont JAMAIS filtres (l'enrichissement noms/telephones
 * doit continuer a fonctionner). C'est exactement le comportement de
 * {@code GatewayRequestContext.resolve} cote HNS.</p>
 *
 * <p><b>Acces global.</b> Les administrateurs ({@link AdminRoles}) et les
 * comptes « toutes mines » ({@code X-All-Mines: true}) gardent un acces global.</p>
 */
@Component
public class EmployeeScopeGuard {

    private static final Logger LOG = LoggerFactory.getLogger(EmployeeScopeGuard.class);

    static final String HEADER_USER_ID = "X-User-Id";
    static final String HEADER_ROLE = "X-Role";
    static final String HEADER_PERMISSIONS = "X-Permissions";
    static final String HEADER_COMPANIES = "X-User-Companies";
    static final String HEADER_ALL_MINES = "X-All-Mines";

    /**
     * Refuse (403) l'acces a une mine hors du perimetre autorise de l'appelant.
     * Ne filtre pas : les appels internes, les admins, les comptes toutes-mines
     * et les executions non HTTP (companyId {@code null} inclus).
     *
     * <p>Delegue la resolution du perimetre a {@link #filterableCompanyScope()}
     * (source unique : eviter toute divergence entre la garde « resource unique »
     * et le filtrage de listes ci-dessous).</p>
     */
    public void assertInScope(Long companyId) {
        if (companyId == null) {
            return; // pas de mine a verifier (ex. employe sans societe rattachee)
        }
        // scope == null : appel service-a-service, admin, toutes-mines ou non HTTP
        // => aucun cloisonnement a appliquer.
        Set<Long> scope = filterableCompanyScope();
        if (scope == null) {
            return;
        }
        if (!scope.contains(companyId)) {
            deny(companyId, currentRequest());
        }
    }

    /**
     * Perimetre de mines applicable a l'appelant pour un FILTRAGE de resultats.
     *
     * <ul>
     *   <li>{@code null} : aucun filtrage a appliquer — appel service-a-service
     *       (aucun marqueur utilisateur), administrateur, compte toutes-mines,
     *       ou execution non HTTP. La liste est renvoyee telle quelle : c'est la
     *       priorite de non-regression (enrichissement HNS -> HRMS intact).</li>
     *   <li>ensemble (eventuellement vide) : seules les entrees dont la mine
     *       appartient a cet ensemble doivent etre conservees. Un ensemble vide
     *       (utilisateur cloisonne sans mine) => tout est filtre (fail-closed).</li>
     * </ul>
     *
     * <p>Meme chaine de confiance qu'{@link #assertInScope(Long)} : des marqueurs
     * utilisateur non prouves par l'identite de service passerelle => 403.</p>
     */
    public Set<Long> filterableCompanyScope() {
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return null; // execution non HTTP (batch/job interne)
        }

        // Appel service-a-service : aucun marqueur utilisateur => non filtre.
        if (!hasAnyUserMarker(request)) {
            return null;
        }

        // Marqueurs utilisateur presents : ils ne sont dignes de confiance que
        // s'ils proviennent de la passerelle (identite de service prouvee).
        ServiceIdentity service = (ServiceIdentity) request.getAttribute(ServiceIdentity.REQUEST_ATTRIBUTE);
        boolean fromGatewayProxy = service != null
                && "safex-gateway".equals(service.issuer())
                && service.hasScope("hrms:proxy");
        if (!fromGatewayProxy) {
            deny(null, request);
        }

        // Acces global : administrateurs et comptes toutes-mines.
        if (AdminRoles.isAdmin(request.getHeader(HEADER_ROLE))
                || "true".equalsIgnoreCase(request.getHeader(HEADER_ALL_MINES))) {
            return null;
        }

        return parseCompanies(request.getHeader(HEADER_COMPANIES));
    }

    /**
     * Filtre une liste pour ne conserver que les entrees dont la mine (extraite
     * par {@code companyIdOf}) est dans le perimetre de l'appelant.
     *
     * <p>Renvoie la liste inchangee si aucun filtrage ne s'applique (voir
     * {@link #filterableCompanyScope()}). Les entrees sans mine ({@code null})
     * sont ecartees pour un appelant cloisonne : leur appartenance ne peut etre
     * prouvee (cloisonnement strict, doctrine « companyId > 0 exige »).</p>
     */
    public <T> List<T> filterByCompany(List<T> items, Function<T, Long> companyIdOf) {
        if (items == null || items.isEmpty()) {
            return items;
        }
        Set<Long> scope = filterableCompanyScope();
        if (scope == null) {
            return items; // service-a-service / admin / toutes-mines : non filtre
        }
        return items.stream()
                .filter(item -> {
                    Long companyId = companyIdOf.apply(item);
                    return companyId != null && scope.contains(companyId);
                })
                .toList();
    }

    private void deny(Long companyId, HttpServletRequest request) {
        LOG.warn("Cloisonnement mines HRMS refuse: companyId={} sur {} {}",
                companyId, request.getMethod(), request.getRequestURI());
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "COMPANY_SCOPE_FORBIDDEN");
    }

    private static boolean hasAnyUserMarker(HttpServletRequest request) {
        return request.getHeader(HEADER_USER_ID) != null
                || request.getHeader(HEADER_ROLE) != null
                || request.getHeader(HEADER_PERMISSIONS) != null
                || request.getHeader(HEADER_COMPANIES) != null
                || request.getHeader(HEADER_ALL_MINES) != null;
    }

    private static Set<Long> parseCompanies(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptySet();
        }
        Set<Long> result = new LinkedHashSet<>();
        for (String token : value.split(",")) {
            String trimmed = token.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            try {
                long parsed = Long.parseLong(trimmed);
                if (parsed > 0) {
                    result.add(parsed);
                }
            } catch (NumberFormatException ignored) {
                // token malforme ignore : ne pas ouvrir le perimetre
            }
        }
        return result;
    }

    private static HttpServletRequest currentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        return attrs instanceof ServletRequestAttributes servletAttributes
                ? servletAttributes.getRequest()
                : null;
    }
}
