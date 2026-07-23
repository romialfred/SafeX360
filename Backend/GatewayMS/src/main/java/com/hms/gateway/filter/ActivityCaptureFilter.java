package com.hms.gateway.filter;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;

import com.hms.gateway.security.ServiceTokenIssuer;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * TRACABILITE DES ACTIONS — capture au seul endroit qui voit tout.
 *
 * <p>Toute action metier (creation, modification, validation, suppression) passe
 * par la passerelle, quel que soit le service qui la traite et quel que soit le
 * client (navigateur, application mobile, script). C'est donc ici, et nulle part
 * ailleurs, qu'on peut affirmer avoir tout vu. Instrumenter chaque service aurait
 * laisse autant de trous que de services oublies.
 *
 * <p>La trace est un FAIT CONSTATE : elle est ecrite a partir du trafic reel et de
 * l'identite du jeton, jamais de ce qu'un client declare. Le rapport part apres la
 * reponse, sans jamais la retarder ni la faire echouer — tracer ne doit pas
 * degrader l'action tracee.
 */
@Component
public class ActivityCaptureFilter implements GlobalFilter, Ordered {

    private static final Logger LOG = LoggerFactory.getLogger(ActivityCaptureFilter.class);

    private static final Set<HttpMethod> MUTATING =
            Set.of(HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE);

    /**
     * Chemins volontairement exclus :
     * <ul>
     *   <li>{@code /hrms/activity/**} — sinon la trace se tracerait elle-meme, en boucle ;
     *   <li>{@code /hrms/auth/**} — connexion, second facteur, deconnexion : deja
     *       couverts par le journal des sessions, et leurs corps portent des secrets.
     * </ul>
     */
    private static final Set<String> EXCLUDED_PREFIXES = Set.of(
            "/hrms/activity", "/hrms/auth", "/actuator", "/services-health");

    private final ServiceTokenIssuer serviceTokenIssuer;
    private final WebClient webClient;
    private final String hrmsBaseUrl;

    public ActivityCaptureFilter(ServiceTokenIssuer serviceTokenIssuer,
            WebClient.Builder webClientBuilder,
            @Value("${MINE_XPERT_URL:}") String hrmsBaseUrl) {
        this.serviceTokenIssuer = serviceTokenIssuer;
        this.webClient = webClientBuilder.build();
        this.hrmsBaseUrl = hrmsBaseUrl == null ? "" : hrmsBaseUrl.replaceAll("/+$", "");
    }

    @Override
    public int getOrder() {
        // Apres TokenFilter : on a besoin de X-User-Id, qu'il vient d'injecter.
        return Ordered.LOWEST_PRECEDENCE - 1;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!shouldCapture(exchange)) {
            return chain.filter(exchange);
        }
        // then(...) : le rapport ne part qu'une fois la reponse envoyee au client.
        return chain.filter(exchange).then(Mono.fromRunnable(() -> report(exchange)));
    }

    private boolean shouldCapture(ServerWebExchange exchange) {
        if (hrmsBaseUrl.isBlank()) {
            return false;
        }
        HttpMethod method = exchange.getRequest().getMethod();
        if (method == null || !MUTATING.contains(method)) {
            return false;
        }
        String path = exchange.getRequest().getURI().getPath();
        if (path == null) {
            return false;
        }
        String lower = path.toLowerCase(Locale.ROOT);
        for (String excluded : EXCLUDED_PREFIXES) {
            if (lower.startsWith(excluded)) {
                return false;
            }
        }
        // Sans identite, rien a attribuer : on ne trace pas une action anonyme.
        return exchange.getRequest().getHeaders().getFirst("X-User-Id") != null;
    }

    private void report(ServerWebExchange exchange) {
        try {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId == null || userId.isBlank()) {
                return;
            }
            String path = exchange.getRequest().getURI().getPath();
            Integer status = exchange.getResponse().getStatusCode() == null
                    ? null : exchange.getResponse().getStatusCode().value();
            // Une action refusee ou en erreur n'est pas une action : la tracer comme
            // telle donnerait a lire des « suppressions » qui n'ont jamais eu lieu.
            if (status == null || status >= 400) {
                return;
            }
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("accountId", Long.parseLong(userId.trim()));
            body.put("method", exchange.getRequest().getMethod().name());
            body.put("path", path);
            body.put("label", moduleLabel(path));
            body.put("statusCode", status);
            body.put("ip", clientIp(exchange));

            webClient.post()
                    // MineXpert est publie sous le context-path /hrms : la passerelle
                    // ne retire pas ce prefixe (aucun StripPrefix sur la route).
                    .uri(hrmsBaseUrl + "/hrms/activity/actions")
                    .header(ServiceTokenIssuer.HEADER, serviceTokenIssuer.issueForPath("/hrms/"))
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .subscribeOn(Schedulers.boundedElastic())
                    .subscribe(ignored -> { },
                            error -> LOG.debug("Trace d'action non transmise ({}) : {}", path, error.getMessage()));
        } catch (Exception e) {
            LOG.debug("Trace d'action ignoree : {}", e.getMessage());
        }
    }

    /**
     * Libelle lisible deduit du chemin : {@code /hns/incident/create} -> « incident ».
     * Un chemin brut se lit mal dans un historique destine a un auditeur.
     */
    static String moduleLabel(String path) {
        if (path == null) {
            return null;
        }
        String[] parts = path.split("/");
        // parts[0] est vide (le chemin commence par /), parts[1] est le service.
        return parts.length > 2 ? parts[2] : (parts.length > 1 ? parts[1] : null);
    }

    private static String clientIp(ServerWebExchange exchange) {
        String forwarded = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return exchange.getRequest().getRemoteAddress() == null
                ? null : exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
    }
}
