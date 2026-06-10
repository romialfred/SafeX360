package com.hrms.api;

import java.time.LocalDateTime;

import jakarta.mail.internet.MimeMessage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.hrms.Jwt.JwtHelper;
import com.hrms.directory.DirectoryService;
import com.hrms.entity.Account;
import com.hrms.entity.AdminActionLog;
import com.hrms.exception.HRMSException;
import com.hrms.repository.AccountRepository;
import com.hrms.repository.AdminActionLogRepository;
import com.hrms.repository.CompanyRepository;
import com.hrms.repository.DepartmentRepository;
import com.hrms.utility.PasswordGenerator;

import jakarta.servlet.http.HttpServletRequest;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Controller dedie aux operations admin sur les comptes utilisateurs.
 *
 * <p>Endpoints exposes (via gateway /hrms/admin/users) :</p>
 * <ul>
 *   <li>POST /create — cree un compte avec MDP temporaire fort + envoi email + init permissions HSE</li>
 *   <li>POST /reset-password/{id} — regenere un MDP temporaire + email + force firstLogin=true</li>
 *   <li>PUT  /toggle-status/{id} — active ou desactive un compte</li>
 * </ul>
 *
 * <p><b>Securite :</b> ces endpoints SONT destines aux administrateurs uniquement. Pour le moment,
 * la protection passe par le filtre X-Secret-Key (gateway) et par l'application des @PreAuthorize
 * dans la phase de durcissement (LOT 50). En production, ajouter un check role 'Administrator'
 * via le JWT cookie.</p>
 */
@RestController
@RequestMapping("/admin/users")
public class AdminUserController {

    private static final Logger LOG = LoggerFactory.getLogger(AdminUserController.class);

    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private CompanyRepository companyRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private AdminActionLogRepository adminActionLogRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private JwtHelper jwtHelper;
    @Autowired
    private DirectoryService directoryService;

    /** Durée de validité du mot de passe temporaire (invitation). */
    private static final int INVITATION_VALIDITY_HOURS = 72;

    @Value("${spring.mail.username:noreply@safex360.com}")
    private String fromEmail;
    @Value("${loginUrl:http://localhost:5173}")
    private String loginUrl;
    // LOT 52 : appel direct service-à-service vers Health-Safety (8081), sans
    // repasser par le gateway. En prod Render, surcharger via la variable
    // d'environnement hsePermissionsUrl=https://safex360-hns.onrender.com/hns/users/permissions
    @Value("${hsePermissionsUrl:http://localhost:8081/hns/users/permissions}")
    private String hsePermissionsUrl;
    @Value("${INTERNAL_GATEWAY_SECRET:dev-secret}")
    private String internalSecret;

    // ─────────────────────────────────────────────────────────────────────
    // POST /admin/users/create — creation atomique compte + permissions
    // ─────────────────────────────────────────────────────────────────────

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateUserRequest {
        private String login;
        private String email;
        private String name;
        private String phoneNumber;
        /** Role predefini cote frontend (SYSTEM_ADMINISTRATOR, HSE_COORDINATOR, AUDITOR, etc.). OBLIGATOIRE. */
        private String role;
        /** Liste des moduleIds autorises (CSV, voir ModuleConfig.tsx). OBLIGATOIRE (LOT 52). */
        private String allowedModules;
        /** Mine de rattachement. OBLIGATOIRE (LOT 52) : aucun utilisateur orphelin. */
        private Long companyId;
        /** Optionnel : departmentId. */
        private Long departmentId;
        /** LOT 52 : LOCAL (defaut) ou ACTIVE_DIRECTORY (import annuaire, auth deleguee). */
        private String identitySource;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateUserResponse {
        private Long accountId;
        private String login;
        private String email;
        private String temporaryPassword; // expose UNIQUEMENT a la creation, jamais relu
        private boolean emailSent;
        private String message;
    }

    @PostMapping("/create")
    @Transactional(rollbackFor = Exception.class)
    @Caching(evict = {
            @CacheEvict(cacheNames = "accountsAll", allEntries = true),
            @CacheEvict(cacheNames = "accountByLogin", allEntries = true),
            @CacheEvict(cacheNames = "accountCountsByCompany", allEntries = true)
    })
    public ResponseEntity<CreateUserResponse> createUser(@RequestBody CreateUserRequest req,
            @CookieValue(name = "jwt", required = false) String token,
            HttpServletRequest httpRequest) throws HRMSException {
        String performedBy = requireAdmin(token, httpRequest);

        // ─── 1. Validation des entrees (LOT 52 : rigueur stricte) ───
        if (req.getLogin() == null || req.getLogin().trim().length() < 3) {
            throw new HRMSException("LOGIN_TOO_SHORT");
        }
        if (req.getLogin().length() > 50 || !req.getLogin().matches("^[A-Za-z0-9._-]+$")) {
            throw new HRMSException("LOGIN_INVALID_FORMAT");
        }
        if (req.getEmail() == null || !req.getEmail().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new HRMSException("EMAIL_INVALID");
        }
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new HRMSException("NAME_REQUIRED");
        }
        if (req.getRole() == null || req.getRole().trim().isEmpty()) {
            throw new HRMSException("ROLE_REQUIRED");
        }
        // LOT 52 : la mine de rattachement est OBLIGATOIRE — aucun utilisateur orphelin.
        if (req.getCompanyId() == null) {
            throw new HRMSException("COMPANY_REQUIRED");
        }
        com.hrms.entity.Company company = companyRepository.findById(req.getCompanyId())
                .orElseThrow(() -> new HRMSException("COMPANY_NOT_FOUND"));
        // LOT 52 : au moins un module d'acces est OBLIGATOIRE.
        if (req.getAllowedModules() == null || req.getAllowedModules().trim().isEmpty()) {
            throw new HRMSException("MODULES_REQUIRED");
        }
        String identitySource = "ACTIVE_DIRECTORY".equalsIgnoreCase(req.getIdentitySource())
                ? "ACTIVE_DIRECTORY" : "LOCAL";
        if ("ACTIVE_DIRECTORY".equals(identitySource) && !directoryService.isEnabled()) {
            throw new HRMSException("DIRECTORY_DISABLED");
        }

        // ─── 2. Unicite login ───
        if (accountRepository.findByLogin(req.getLogin()).isPresent()) {
            throw new HRMSException("LOGIN_ALREADY_EXISTS");
        }

        // ─── 3. Mot de passe ───
        // LOCAL : MDP temporaire fort, invitation 72 h, changement force au 1er login.
        // ACTIVE_DIRECTORY : aucun MDP local utilisable (aleatoire long, jamais communique) —
        // l'authentification est deleguee a l'annuaire au login.
        boolean isAd = "ACTIVE_DIRECTORY".equals(identitySource);
        String tempPassword = isAd ? null : PasswordGenerator.generate(14);

        // ─── 4. Creation Account ───
        Account account = new Account();
        account.setLogin(req.getLogin());
        account.setEmail(req.getEmail());
        account.setName(req.getName());
        account.setPhoneNumber(req.getPhoneNumber());
        account.setRole(req.getRole());
        account.setCompany(company);
        if (req.getDepartmentId() != null) {
            departmentRepository.findById(req.getDepartmentId()).ifPresent(account::setDepartment);
        }
        account.setIdentitySource(identitySource);
        account.setPassword(passwordEncoder.encode(isAd ? PasswordGenerator.generate(32) : tempPassword));
        account.setFirstLogin(!isAd); // AD : pas de MDP local a changer
        account.setInvitationExpiresAt(isAd ? null : LocalDateTime.now().plusHours(INVITATION_VALIDITY_HOURS));
        account.setStatus("ACTIVE");
        account.setStartDate(LocalDateTime.now());

        Account saved = accountRepository.save(account);
        LOG.info("Account created: id={}, login={}, role={}, source={}, companyId={}",
                saved.getId(), saved.getLogin(), saved.getRole(), identitySource, req.getCompanyId());

        // ─── 5. Init du PermissionProfile cote HSE — STRICT (LOT 52) :
        // un echec annule TOUTE la creation (rollback transactionnel). ───
        boolean permissionsInit = initPermissionsHSE(saved.getId(), req.getRole(), req.getAllowedModules());
        if (!permissionsInit) {
            throw new HRMSException("PERMISSIONS_INIT_FAILED");
        }

        // ─── 6. Journal d'administration (jamais de secret dans le detail) ───
        adminActionLogRepository.save(AdminActionLog.of(
                isAd ? "USER_CREATED_FROM_AD" : "USER_CREATED",
                saved.getId(), saved.getLogin(), performedBy,
                "role=" + req.getRole() + ", mine=" + company.getName()
                        + ", modules=" + countModules(req.getAllowedModules())));

        // ─── 7. Email ───
        boolean emailSent = isAd
                ? sendAdWelcomeEmail(req.getEmail(), req.getName(), req.getLogin())
                : sendCreationEmail(req.getEmail(), req.getName(), req.getLogin(), tempPassword);

        return new ResponseEntity<>(new CreateUserResponse(
                saved.getId(),
                saved.getLogin(),
                saved.getEmail(),
                (isAd || emailSent) ? null : tempPassword,
                emailSent,
                isAd
                    ? "Compte importé de l'annuaire. L'utilisateur se connecte avec ses identifiants Active Directory."
                    : (emailSent
                        ? "Compte créé. Email envoyé avec mot de passe temporaire (valable " + INVITATION_VALIDITY_HOURS + " h)."
                        : "Compte créé. Email NON envoyé — copiez le mot de passe temporaire ci-dessous (valable " + INVITATION_VALIDITY_HOURS + " h).")
        ), HttpStatus.CREATED);
    }

    private int countModules(String csv) {
        if (csv == null || csv.isBlank()) return 0;
        return csv.split(",").length;
    }

    /**
     * LOT 52 — contrôle d'accès des endpoints admin.
     * Autorise : (1) un JWT cookie valide dont le compte a le rôle SYSTEM_ADMINISTRATOR,
     * ou (2) l'en-tête interne X-Secret-Key (appels de service / outillage).
     * Retourne l'identité de l'auteur pour le journal.
     */
    private String requireAdmin(String token, HttpServletRequest request) {
        String secret = request != null ? request.getHeader("X-Secret-Key") : null;
        if (secret != null && secret.equals(internalSecret)) {
            return "system-internal";
        }
        if (token != null && !token.isBlank()) {
            try {
                String login = jwtHelper.getUsernameFromToken(token);
                Account admin = accountRepository.findByLogin(login).orElse(null);
                if (admin != null && "SYSTEM_ADMINISTRATOR".equalsIgnoreCase(admin.getRole())
                        && "ACTIVE".equalsIgnoreCase(admin.getStatus())) {
                    return login;
                }
            } catch (Exception e) {
                LOG.warn("JWT admin invalide: {}", e.getMessage());
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Accès réservé aux administrateurs (SYSTEM_ADMINISTRATOR)");
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /admin/users/reset-password/{id}
    // ─────────────────────────────────────────────────────────────────────

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResetPasswordResponse {
        private Long accountId;
        private String temporaryPassword;
        private boolean emailSent;
        private String message;
    }

    @PostMapping("/reset-password/{id}")
    @Transactional(rollbackFor = Exception.class)
    @Caching(evict = {
            @CacheEvict(cacheNames = "accountById", key = "#id"),
            @CacheEvict(cacheNames = "accountByLogin", allEntries = true)
    })
    public ResponseEntity<ResetPasswordResponse> resetPassword(@PathVariable Long id,
            @CookieValue(name = "jwt", required = false) String token,
            HttpServletRequest httpRequest) throws HRMSException {
        String performedBy = requireAdmin(token, httpRequest);
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));

        // LOT 52 : un compte Active Directory n'a pas de mot de passe local.
        if ("ACTIVE_DIRECTORY".equalsIgnoreCase(account.getIdentitySource())) {
            throw new HRMSException("AD_ACCOUNT_NO_LOCAL_PASSWORD");
        }

        String tempPassword = PasswordGenerator.generate(14);
        account.setPassword(passwordEncoder.encode(tempPassword));
        account.setFirstLogin(true); // force change au prochain login
        account.setInvitationExpiresAt(LocalDateTime.now().plusHours(INVITATION_VALIDITY_HOURS));
        accountRepository.save(account);

        adminActionLogRepository.save(AdminActionLog.of("PASSWORD_RESET",
                account.getId(), account.getLogin(), performedBy,
                "invitation renouvelée (" + INVITATION_VALIDITY_HOURS + " h)"));

        boolean emailSent = sendResetEmail(account.getEmail(), account.getName(), account.getLogin(), tempPassword);

        return new ResponseEntity<>(new ResetPasswordResponse(
                id,
                emailSent ? null : tempPassword,
                emailSent,
                emailSent
                    ? "MDP reinitialise. Email envoye (valable " + INVITATION_VALIDITY_HOURS + " h)."
                    : "MDP reinitialise. Email NON envoye - copiez le mot de passe ci-dessous (valable " + INVITATION_VALIDITY_HOURS + " h)."
        ), HttpStatus.OK);
    }

    // ─────────────────────────────────────────────────────────────────────
    // PUT /admin/users/toggle-status/{id}
    // ─────────────────────────────────────────────────────────────────────

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToggleStatusResponse {
        private Long accountId;
        private String status;
        private String message;
    }

    @PutMapping("/toggle-status/{id}")
    @Transactional(rollbackFor = Exception.class)
    @Caching(evict = {
            @CacheEvict(cacheNames = "accountById", key = "#id"),
            @CacheEvict(cacheNames = "accountByLogin", allEntries = true),
            @CacheEvict(cacheNames = "accountsAll", allEntries = true)
    })
    public ResponseEntity<ToggleStatusResponse> toggleStatus(@PathVariable Long id,
            @CookieValue(name = "jwt", required = false) String token,
            HttpServletRequest httpRequest) throws HRMSException {
        String performedBy = requireAdmin(token, httpRequest);
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));

        String current = account.getStatus();
        String next = "ACTIVE".equalsIgnoreCase(current) ? "INACTIVE" : "ACTIVE";
        account.setStatus(next);
        accountRepository.save(account);

        adminActionLogRepository.save(AdminActionLog.of(
                "ACTIVE".equals(next) ? "STATUS_ACTIVATED" : "STATUS_DEACTIVATED",
                account.getId(), account.getLogin(), performedBy, null));

        return new ResponseEntity<>(new ToggleStatusResponse(
                id, next, "Statut compte mis a jour : " + next
        ), HttpStatus.OK);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /admin/users/journal — journal d'administration (append-only)
    // ─────────────────────────────────────────────────────────────────────

    @GetMapping("/journal")
    public ResponseEntity<Page<AdminActionLog>> journal(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) Long accountId,
            @CookieValue(name = "jwt", required = false) String token,
            HttpServletRequest httpRequest) {
        requireAdmin(token, httpRequest);
        PageRequest pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        Page<AdminActionLog> result = accountId != null
                ? adminActionLogRepository.findByTargetAccountIdOrderByCreatedAtDesc(accountId, pageable)
                : adminActionLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────────────
    // HELPERS PRIVES
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Initialise le PermissionProfile cote Health-Safety via REST.
     * Best-effort : retourne false si echec, mais ne fait pas echouer la creation Account.
     */
    private boolean initPermissionsHSE(Long accountId, String role, String allowedModules) {
        try {
            RestTemplate rest = new RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("X-Secret-Key", internalSecret);

            String body = String.format(
                "{\"accountId\":%d,\"role\":\"%s\",\"allowedModules\":\"%s\"}",
                accountId,
                role != null ? role : "EMPLOYEE",
                allowedModules != null ? allowedModules.replace("\"", "\\\"") : ""
            );

            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(body, headers);
            String url = hsePermissionsUrl + "/init-for-account";
            rest.postForObject(url, entity, String.class);
            return true;
        } catch (Exception e) {
            LOG.warn("Permission init HSE failed for accountId={}: {}", accountId, e.getMessage());
            return false;
        }
    }

    private boolean sendCreationEmail(String to, String name, String login, String tempPassword) {
        try {
            MimeMessage mm = mailSender.createMimeMessage();
            MimeMessageHelper message = new MimeMessageHelper(mm, true);
            message.setTo(to);
            message.setFrom(fromEmail);
            message.setSubject("SafeX 360 — Bienvenue, vos identifiants de connexion");
            message.setText(buildEmailBody(name, login, tempPassword,
                    "Bienvenue sur la plateforme SafeX 360. Voici vos identifiants temporaires de connexion."), true);
            mailSender.send(mm);
            return true;
        } catch (Exception e) {
            LOG.warn("Email envoi echec pour {}: {}", to, e.getMessage());
            return false;
        }
    }

    /** Email de bienvenue pour un compte importé d'Active Directory (aucun mot de passe transmis). */
    private boolean sendAdWelcomeEmail(String to, String name, String login) {
        try {
            MimeMessage mm = mailSender.createMimeMessage();
            MimeMessageHelper message = new MimeMessageHelper(mm, true);
            message.setTo(to);
            message.setFrom(fromEmail);
            message.setSubject("SafeX 360 — Votre accès est activé");
            message.setText("<html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px'>"
                    + "<div style='background:#0F766E;color:white;padding:20px;border-radius:8px 8px 0 0'>"
                    + "  <h2 style='margin:0'>SafeX 360</h2>"
                    + "</div>"
                    + "<div style='background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px'>"
                    + "  <p>Bonjour <strong>" + escapeHtml(name) + "</strong>,</p>"
                    + "  <p>Votre accès SafeX 360 a été activé. Connectez-vous avec votre identifiant "
                    + "<code style='background:#f3f4f6;padding:2px 6px;border-radius:3px'>" + escapeHtml(login) + "</code> "
                    + "et votre <strong>mot de passe Active Directory habituel</strong> (celui de votre session Windows).</p>"
                    + "  <a href='" + loginUrl + "' style='display:inline-block;background:#0F766E;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px'>Se connecter à SafeX 360</a>"
                    + "</div></body></html>", true);
            mailSender.send(mm);
            return true;
        } catch (Exception e) {
            LOG.warn("Email bienvenue AD echec pour {}: {}", to, e.getMessage());
            return false;
        }
    }

    private boolean sendResetEmail(String to, String name, String login, String tempPassword) {
        try {
            MimeMessage mm = mailSender.createMimeMessage();
            MimeMessageHelper message = new MimeMessageHelper(mm, true);
            message.setTo(to);
            message.setFrom(fromEmail);
            message.setSubject("SafeX 360 — Reinitialisation de votre mot de passe");
            message.setText(buildEmailBody(name, login, tempPassword,
                    "Votre mot de passe a ete reinitialise par un administrateur. Voici vos nouveaux identifiants temporaires."), true);
            mailSender.send(mm);
            return true;
        } catch (Exception e) {
            LOG.warn("Email reset echec pour {}: {}", to, e.getMessage());
            return false;
        }
    }

    private String buildEmailBody(String name, String login, String tempPassword, String intro) {
        return "<html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px'>"
            + "<div style='background:#0F766E;color:white;padding:20px;border-radius:8px 8px 0 0'>"
            + "  <h2 style='margin:0'>SafeX 360</h2>"
            + "  <p style='margin:4px 0 0;opacity:0.9'>Plateforme HSE pour l'industrie miniere africaine</p>"
            + "</div>"
            + "<div style='background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px'>"
            + "  <p>Bonjour <strong>" + escapeHtml(name) + "</strong>,</p>"
            + "  <p>" + escapeHtml(intro) + "</p>"
            + "  <div style='background:white;border:1px solid #d1d5db;border-radius:6px;padding:16px;margin:16px 0'>"
            + "    <p style='margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase'>Identifiants</p>"
            + "    <p style='margin:4px 0'><strong>Login :</strong> <code style='background:#f3f4f6;padding:2px 6px;border-radius:3px'>" + escapeHtml(login) + "</code></p>"
            + "    <p style='margin:4px 0'><strong>Mot de passe temporaire :</strong> <code style='background:#fef3c7;padding:2px 6px;border-radius:3px;font-size:14px'>" + escapeHtml(tempPassword) + "</code></p>"
            + "  </div>"
            + "  <p style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;font-size:13px'>"
            + "    <strong>Important :</strong> ce mot de passe est temporaire. Vous serez invite a le changer obligatoirement lors de votre premiere connexion."
            + "  </p>"
            + "  <a href='" + loginUrl + "' style='display:inline-block;background:#0F766E;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px'>Se connecter a SafeX 360</a>"
            + "  <hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0'>"
            + "  <p style='color:#6b7280;font-size:12px'>Si vous n'etes pas a l'origine de cette creation de compte, contactez votre administrateur HSE.</p>"
            + "  <p style='color:#6b7280;font-size:12px'>Data Universe — Plateforme SafeX 360</p>"
            + "</div></body></html>";
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
