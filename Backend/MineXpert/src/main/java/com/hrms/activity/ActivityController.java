package com.hrms.activity;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.Jwt.JwtHelper;
import com.hrms.entity.Account;
import com.hrms.repository.AccountRepository;
import com.hrms.security.ServiceIdentity;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Collecte de la tracabilite.
 *
 * <ul>
 *   <li>{@code POST /activity/pages} — pages consultees, envoyees par l'IHM pour
 *       l'utilisateur CONNECTE. L'identite vient exclusivement du cookie : le
 *       corps de la requete ne peut designer personne d'autre. Un client ne peut
 *       donc pas ecrire dans l'historique d'autrui.</li>
 *   <li>{@code POST /activity/actions} — actions metier constatees par la
 *       passerelle. Reserve aux appels de service authentifies par jeton signe ;
 *       une requete de navigateur y est refusee.</li>
 * </ul>
 */
@RestController
@CrossOrigin
@RequestMapping("/activity")
public class ActivityController {

    private static final Logger LOG = LoggerFactory.getLogger(ActivityController.class);

    /** Garde-fou : au-dela, on ignore le surplus plutot que d'accepter un envoi massif. */
    private static final int MAX_BATCH = 50;

    private final ActivityService activity;
    private final JwtHelper jwtHelper;
    private final AccountRepository accounts;

    public ActivityController(ActivityService activity, JwtHelper jwtHelper, AccountRepository accounts) {
        this.activity = activity;
        this.jwtHelper = jwtHelper;
        this.accounts = accounts;
    }

    public record PageVisit(String path, String label, String source) { }

    @PostMapping("/pages")
    public ResponseEntity<?> pages(@CookieValue(name = "jwt", required = false) String token,
            @RequestBody Map<String, Object> body, HttpServletRequest request) {
        Account account = accountFromCookie(token);
        if (account == null) {
            // 204 et non 401 : un envoi de trace ne doit jamais provoquer de
            // deconnexion ni de bandeau d'erreur dans l'IHM.
            return ResponseEntity.noContent().build();
        }
        List<?> raw = body.get("visits") instanceof List<?> list ? list : List.of();
        List<PageVisit> visits = new ArrayList<>();
        for (Object item : raw) {
            if (visits.size() >= MAX_BATCH) {
                break;
            }
            if (item instanceof Map<?, ?> map) {
                visits.add(new PageVisit(str(map.get("path")), str(map.get("label")), str(map.get("source"))));
            }
        }
        for (PageVisit visit : visits) {
            if (visit.path() == null || visit.path().isBlank()) {
                continue;
            }
            activity.recordPage(account.getId(), account.getLogin(), visit.path(), visit.label(),
                    visit.source(), request);
        }
        return ResponseEntity.noContent().build();
    }

    public record ActionReport(Long accountId, String login, String method, String path, String label,
            Integer statusCode, String ip) { }

    @PostMapping("/actions")
    public ResponseEntity<?> actions(@RequestBody ActionReport report, HttpServletRequest request) {
        // Identite de SERVICE obligatoire : c'est ce qui distingue un fait constate
        // par la passerelle d'une declaration de client.
        ServiceIdentity service = (ServiceIdentity) request.getAttribute(ServiceIdentity.REQUEST_ATTRIBUTE);
        if (service == null) {
            LOG.debug("Rapport d'action refuse : aucune identite de service");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "SERVICE_IDENTITY_REQUIRED"));
        }
        if (report == null || report.accountId() == null) {
            return ResponseEntity.noContent().build();
        }
        // La passerelle ne connait que l'identifiant de compte (claim du jeton) ; on
        // resout le login ICI. Le stocker en clair dans la trace la rend lisible meme
        // si le compte est supprime plus tard.
        String login = report.login();
        if (login == null || login.isBlank()) {
            login = accounts.findById(report.accountId()).map(Account::getLogin).orElse(null);
        }
        activity.recordAction(report.accountId(), login, report.method(), report.path(),
                report.label(), report.statusCode(), report.ip());
        return ResponseEntity.noContent().build();
    }

    private Account accountFromCookie(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            return accounts.findByLogin(jwtHelper.getUsernameFromToken(token)).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private static String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
