package com.hrms.api;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.hrms.entity.Account;
import com.hrms.exception.HRMSException;
import com.hrms.repository.AccountRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Controller user-facing pour l'utilisateur authentifie (lecture/modification de son propre compte).
 *
 * Endpoints (via gateway /hrms/me) :
 * - GET  /profile : retourne identite + firstLogin + modules autorises (consolide cote MX + HSE)
 * - POST /change-password-first : applique le 1er changement de MDP obligatoire (validation OWASP)
 */
@RestController
@RequestMapping("/me")
public class MeController {

    private static final Logger LOG = LoggerFactory.getLogger(MeController.class);

    // LOT 53 (fix boucle login) : clé externalisée — DOIT etre alignee sur
    // JwtHelper/AuthAPI, sinon /me/profile rejette les tokens signes avec la
    // nouvelle cle (signature mismatch -> 500 -> sonde en echec -> boucle).
    @org.springframework.beans.factory.annotation.Value("${JWT_SECRET:}")
    private String JWT_SECRET;

    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${hsePermissionsUrl:http://localhost:9000/hns/users/permissions}")
    private String hsePermissionsUrl;
    @Value("${INTERNAL_GATEWAY_SECRET:}")
    private String internalSecret;

    // ─────────────────────────────────────────────────────────────────────
    // GET /me/profile — profil consolide
    // ─────────────────────────────────────────────────────────────────────

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileResponse {
        private Long accountId;
        private String login;
        private String name;
        private String email;
        private String role;
        private String status;
        private Boolean firstLogin;
        private Long companyId;
        private Long departmentId;
        /** Liste CSV des moduleIds autorises (vide si pas de profil HSE). */
        private String allowedModules;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@CookieValue(name = "jwt", required = false) String token) {
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "JWT cookie missing"));
        }
        try {
            Claims claims = Jwts.parser().setSigningKey(JWT_SECRET).parseClaimsJws(token).getBody();
            String login = claims.getSubject();

            Account account = accountRepository.findByLogin(login)
                    .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));

            ProfileResponse resp = new ProfileResponse();
            resp.setAccountId(account.getId());
            resp.setLogin(account.getLogin());
            resp.setName(account.getName());
            resp.setEmail(account.getEmail());
            resp.setRole(account.getRole());
            resp.setStatus(account.getStatus());
            resp.setFirstLogin(account.getFirstLogin() != null ? account.getFirstLogin() : Boolean.FALSE);
            resp.setCompanyId(account.getCompany() != null ? account.getCompany().getId() : null);
            resp.setDepartmentId(account.getDepartment() != null ? account.getDepartment().getId() : null);

            // Recupere les modules autorises depuis HSE (best-effort)
            resp.setAllowedModules(fetchAllowedModulesFromHSE(account.getId()));

            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            LOG.warn("getProfile error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or expired JWT"));
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /me/change-password-first — 1er changement obligatoire
    // ─────────────────────────────────────────────────────────────────────

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordFirstRequest {
        private String oldPassword; // MDP temporaire recu par email
        private String newPassword;
    }

    @PostMapping("/change-password-first")
    @Transactional(rollbackFor = Exception.class)
    @Caching(evict = {
            @CacheEvict(cacheNames = "accountById", allEntries = true),
            @CacheEvict(cacheNames = "accountByLogin", allEntries = true)
    })
    public ResponseEntity<?> changePasswordFirst(
            @CookieValue(name = "jwt", required = false) String token,
            @RequestBody ChangePasswordFirstRequest req) {
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "JWT cookie missing"));
        }
        try {
            Claims claims = Jwts.parser().setSigningKey(JWT_SECRET).parseClaimsJws(token).getBody();
            String login = claims.getSubject();

            Account account = accountRepository.findByLogin(login)
                    .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));

            // ─── Validations strictes ───
            if (req.getOldPassword() == null || req.getOldPassword().isBlank()) {
                return badRequest("OLD_PASSWORD_REQUIRED", "Le mot de passe actuel est requis");
            }
            if (req.getNewPassword() == null || req.getNewPassword().isBlank()) {
                return badRequest("NEW_PASSWORD_REQUIRED", "Le nouveau mot de passe est requis");
            }
            String newPwd = req.getNewPassword();
            if (newPwd.length() < 10) {
                return badRequest("PASSWORD_TOO_SHORT", "Le mot de passe doit comporter au moins 10 caracteres");
            }
            if (!newPwd.matches(".*[A-Z].*")) {
                return badRequest("PASSWORD_MISSING_UPPERCASE", "Le mot de passe doit contenir au moins une majuscule");
            }
            if (!newPwd.matches(".*[a-z].*")) {
                return badRequest("PASSWORD_MISSING_LOWERCASE", "Le mot de passe doit contenir au moins une minuscule");
            }
            if (!newPwd.matches(".*[0-9].*")) {
                return badRequest("PASSWORD_MISSING_DIGIT", "Le mot de passe doit contenir au moins un chiffre");
            }
            if (!newPwd.matches(".*[^A-Za-z0-9].*")) {
                return badRequest("PASSWORD_MISSING_SPECIAL", "Le mot de passe doit contenir au moins un caractere special");
            }
            // Verifie l'ancien MDP
            if (!passwordEncoder.matches(req.getOldPassword(), account.getPassword())) {
                return badRequest("OLD_PASSWORD_INVALID", "Le mot de passe actuel est incorrect");
            }
            // Verifie que le nouveau MDP est different
            if (passwordEncoder.matches(newPwd, account.getPassword())) {
                return badRequest("PASSWORD_REUSED", "Le nouveau mot de passe doit etre different de l'ancien");
            }

            // ─── Applique ───
            account.setPassword(passwordEncoder.encode(newPwd));
            account.setFirstLogin(false);
            accountRepository.save(account);

            LOG.info("First password change applied for login={}", login);
            return ResponseEntity.ok(Map.of(
                    "message", "Mot de passe change avec succes",
                    "firstLogin", false
            ));
        } catch (HRMSException e) {
            return badRequest(e.getMessage(), e.getMessage());
        } catch (Exception e) {
            LOG.error("changePasswordFirst error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────

    private ResponseEntity<?> badRequest(String code, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", code);
        body.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    private String fetchAllowedModulesFromHSE(Long accountId) {
        try {
            RestTemplate rest = new RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("X-Secret-Key", internalSecret);
            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);
            String url = hsePermissionsUrl + "/by-account/" + accountId;
            org.springframework.http.ResponseEntity<Map> resp = rest.exchange(
                    url, org.springframework.http.HttpMethod.GET, entity, Map.class);
            if (resp.getBody() != null && resp.getBody().get("allowedModules") != null) {
                return resp.getBody().get("allowedModules").toString();
            }
        } catch (Exception e) {
            LOG.debug("fetchAllowedModulesFromHSE failed for accountId={}: {}", accountId, e.getMessage());
        }
        return "";
    }
}
