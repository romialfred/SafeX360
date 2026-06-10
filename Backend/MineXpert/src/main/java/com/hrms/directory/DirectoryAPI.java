package com.hrms.directory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.hrms.Jwt.JwtHelper;
import com.hrms.entity.Account;
import com.hrms.repository.AccountRepository;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LOT 52 — API du connecteur Active Directory / LDAP.
 *
 * Endpoints (via gateway /hrms/directory) :
 *   GET  /status   — état du connecteur (jamais de secret dans la réponse)
 *   GET  /search   — recherche d'utilisateurs dans l'annuaire (réel ou démo)
 *   GET  /settings — configuration courante (sans le mot de passe de service)
 *   PUT  /settings — mise à jour de la configuration (admin)
 *   POST /test     — test de connexion avec la configuration fournie
 */
@RestController
@RequestMapping("/directory")
public class DirectoryAPI {

    @Autowired
    private DirectoryService directoryService;
    @Autowired
    private DirectorySettingsRepository settingsRepository;
    @Autowired
    private DirectoryCrypto crypto;
    @Autowired
    private JwtHelper jwtHelper;
    @Autowired
    private AccountRepository accountRepository;

    @Value("${INTERNAL_GATEWAY_SECRET:dev-secret}")
    private String internalSecret;

    /**
     * LOT 52 — accès réservé : admin (JWT cookie + rôle SYSTEM_ADMINISTRATOR)
     * ou appel interne (X-Secret-Key). Même politique que AdminUserController.
     */
    private void requireAdmin(String token, HttpServletRequest request) {
        String secret = request != null ? request.getHeader("X-Secret-Key") : null;
        if (secret != null && secret.equals(internalSecret)) return;
        if (token != null && !token.isBlank()) {
            try {
                String login = jwtHelper.getUsernameFromToken(token);
                Account admin = accountRepository.findByLogin(login).orElse(null);
                if (admin != null && "SYSTEM_ADMINISTRATOR".equalsIgnoreCase(admin.getRole())
                        && "ACTIVE".equalsIgnoreCase(admin.getStatus())) {
                    return;
                }
            } catch (Exception ignored) { }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Accès réservé aux administrateurs (SYSTEM_ADMINISTRATOR)");
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        DirectorySettings s = directoryService.getSettings();
        boolean configured = Boolean.TRUE.equals(s.getDemoMode())
                || (s.getHost() != null && !s.getHost().isBlank() && s.getBaseDn() != null);
        return ResponseEntity.ok(Map.of(
                "enabled", Boolean.TRUE.equals(s.getEnabled()),
                "demoMode", Boolean.TRUE.equals(s.getDemoMode()),
                "configured", configured,
                "host", s.getHost() != null ? s.getHost() : ""
        ));
    }

    @GetMapping("/search")
    public ResponseEntity<List<DirectoryUserDTO>> search(@RequestParam(defaultValue = "") String q,
            @CookieValue(name = "jwt", required = false) String token, HttpServletRequest request) {
        requireAdmin(token, request);
        return ResponseEntity.ok(directoryService.search(q));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Configuration (admin)
    // ─────────────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SettingsRequest {
        private Boolean enabled;
        private Boolean demoMode;
        private String host;
        private Integer port;
        private Boolean useSsl;
        private String baseDn;
        private String bindDn;
        /** Fourni uniquement pour CHANGER le mot de passe ; null = inchangé. */
        private String bindPassword;
        private String attrLogin;
        private String attrEmail;
        private String attrName;
        private String attrDepartment;
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings(
            @CookieValue(name = "jwt", required = false) String token, HttpServletRequest request) {
        requireAdmin(token, request);
        DirectorySettings s = directoryService.getSettings();
        return ResponseEntity.ok(Map.of(
                "enabled", Boolean.TRUE.equals(s.getEnabled()),
                "demoMode", Boolean.TRUE.equals(s.getDemoMode()),
                "host", s.getHost() != null ? s.getHost() : "",
                "port", s.getPort() != null ? s.getPort() : 636,
                "useSsl", Boolean.TRUE.equals(s.getUseSsl()),
                "baseDn", s.getBaseDn() != null ? s.getBaseDn() : "",
                "bindDn", s.getBindDn() != null ? s.getBindDn() : "",
                "hasBindPassword", s.getBindPasswordEnc() != null,
                "attributes", Map.of(
                        "login", s.getAttrLogin(),
                        "email", s.getAttrEmail(),
                        "name", s.getAttrName(),
                        "department", s.getAttrDepartment())
        ));
    }

    @PutMapping("/settings")
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody SettingsRequest req,
            @CookieValue(name = "jwt", required = false) String token, HttpServletRequest request) {
        requireAdmin(token, request);
        DirectorySettings s = directoryService.getSettings();
        if (req.getEnabled() != null) s.setEnabled(req.getEnabled());
        if (req.getDemoMode() != null) s.setDemoMode(req.getDemoMode());
        if (req.getHost() != null) s.setHost(req.getHost().trim());
        if (req.getPort() != null) s.setPort(req.getPort());
        if (req.getUseSsl() != null) s.setUseSsl(req.getUseSsl());
        if (req.getBaseDn() != null) s.setBaseDn(req.getBaseDn().trim());
        if (req.getBindDn() != null) s.setBindDn(req.getBindDn().trim());
        if (req.getBindPassword() != null && !req.getBindPassword().isBlank()) {
            s.setBindPasswordEnc(crypto.encrypt(req.getBindPassword()));
        }
        if (req.getAttrLogin() != null) s.setAttrLogin(req.getAttrLogin().trim());
        if (req.getAttrEmail() != null) s.setAttrEmail(req.getAttrEmail().trim());
        if (req.getAttrName() != null) s.setAttrName(req.getAttrName().trim());
        if (req.getAttrDepartment() != null) s.setAttrDepartment(req.getAttrDepartment().trim());
        s.setUpdatedAt(LocalDateTime.now());
        settingsRepository.save(s);
        return ResponseEntity.ok(Map.of("message", "Configuration annuaire enregistrée"));
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> test(@RequestBody SettingsRequest req,
            @CookieValue(name = "jwt", required = false) String token, HttpServletRequest request) {
        requireAdmin(token, request);
        DirectorySettings probe = new DirectorySettings();
        probe.setDemoMode(req.getDemoMode());
        probe.setHost(req.getHost());
        probe.setPort(req.getPort() != null ? req.getPort() : 636);
        probe.setUseSsl(req.getUseSsl() != null ? req.getUseSsl() : Boolean.TRUE);
        probe.setBaseDn(req.getBaseDn());
        probe.setBindDn(req.getBindDn());
        String password = req.getBindPassword();
        if ((password == null || password.isBlank())) {
            DirectorySettings current = directoryService.getSettings();
            password = current.getBindPasswordEnc() != null ? crypto.decrypt(current.getBindPasswordEnc()) : null;
        }
        String message = directoryService.testConnection(probe, password);
        return ResponseEntity.ok(Map.of("message", message));
    }
}
