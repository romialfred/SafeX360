package com.hrms.api;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.Jwt.CustomUserDetails;
import com.hrms.Jwt.JwtHelper;
import com.hrms.directory.DirectoryService;
import com.hrms.dto.AuditLogDTO;
import com.hrms.dto.AuthenticationRequest;
import com.hrms.dto.AuthenticationResponse;
import com.hrms.dto.EmployeeDTO;
import com.hrms.entity.Account;
import com.hrms.repository.AccountRepository;
import com.hrms.security.MfaChallengeService;
import com.hrms.security.MfaChallengeService.Purpose;
import com.hrms.security.MfaRolePolicy;
import com.hrms.service.AuditLogService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@CrossOrigin
@RequestMapping("/auth")
public class AuthAPI {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtHelper helper;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private DirectoryService directoryService;

    @Autowired
    private com.hrms.service.LoginAttemptService loginAttemptService;

    @Autowired
    private MfaRolePolicy mfaRolePolicy;

    @Autowired
    private MfaChallengeService mfaChallengeService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private Logger logger = LoggerFactory.getLogger(AuthAPI.class);

    @org.springframework.beans.factory.annotation.Value("${JWT_SECRET:}")
    private String SECRET;

    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthenticationRequest request,
            HttpServletResponse response) {
        if (request.getLogin() == null || request.getLogin().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("errorMessage", "Login is required", "errorCode", 400));
        }
        if (loginAttemptService.isBlocked(request.getLogin())) {
            long remaining = loginAttemptService.getRemainingBlockSeconds(request.getLogin());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of(
                            "errorMessage", "Too many failed attempts. Try again in " + remaining + "s.",
                            "errorCode", 429,
                            "retryAfterSeconds", remaining));
        }
        try {
            Account preAccount = accountRepository.findByLogin(request.getLogin()).orElse(null);
            boolean adAccount = preAccount != null
                    && "ACTIVE_DIRECTORY".equalsIgnoreCase(preAccount.getIdentitySource());

            if (preAccount != null && !adAccount
                    && Boolean.TRUE.equals(preAccount.getFirstLogin())
                    && preAccount.getInvitationExpiresAt() != null
                    && LocalDateTime.now().isAfter(preAccount.getInvitationExpiresAt())) {
                try {
                    auditLogService.logAudit(new AuditLogDTO(null, null, request.getLogin(),
                            LocalDateTime.now(), "Login refused: invitation expired"));
                } catch (Exception ignored) { }
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("errorMessage", "INVITATION_EXPIRED", "errorCode", 401));
            }

            if (adAccount) {
                if (!directoryService.authenticate(request.getLogin(), request.getPassword())) {
                    loginAttemptService.recordFailure(request.getLogin());
                    try {
                        auditLogService.logAudit(new AuditLogDTO(null, null, request.getLogin(),
                                LocalDateTime.now(), "Incorrect Password (annuaire AD)"));
                    } catch (Exception ignored) { }
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("errorMessage", "Incorrect username or password", "errorCode", 401));
                }
            } else {
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(request.getLogin(), request.getPassword()));
            }

            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getLogin());
            final Account authenticatedAccount = accountRepository.findByLogin(request.getLogin())
                    .orElseThrow(() -> new UsernameNotFoundException("ACCOUNT_NOT_FOUND"));

            // ─── PREMIÈRE CONNEXION : le mot de passe temporaire doit être changé
            // AVANT tout le reste (avant la MFA). On émet un challenge PRÉ-SESSION
            // (aucune session accordée) ; l'IHM enchaîne sur /auth/first-login/password,
            // qui pose le nouveau MDP puis déclenche l'enrôlement 2FA le cas échéant.
            // Les comptes AD ne changent pas de MDP local → exclus. Blast radius limité
            // aux comptes firstLogin : les connexions des comptes existants sont intactes.
            if (!adAccount && Boolean.TRUE.equals(authenticatedAccount.getFirstLogin())) {
                MfaChallengeService.Challenge pwdCh = mfaChallengeService.issue(
                        authenticatedAccount.getId(), authenticatedAccount.getLogin(),
                        MfaChallengeService.Purpose.PASSWORD_CHANGE);
                try {
                    auditLogService.logAudit(new AuditLogDTO(null, null, request.getLogin(),
                            LocalDateTime.now(), "Primary credential accepted; first-login password change required"));
                } catch (Exception ignored) { }
                return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED).body(Map.of(
                        "errorCode", "PASSWORD_CHANGE_REQUIRED",
                        "errorMessage", "Changement du mot de passe temporaire obligatoire",
                        "challenge", pwdCh.token(),
                        "expiresInSeconds", 300));
            }

            if (mfaRolePolicy.requiresMfa(authenticatedAccount.getRole())) {
                boolean enrolled = Boolean.TRUE.equals(authenticatedAccount.getMfaEnabled())
                        && authenticatedAccount.getMfaSecretEncrypted() != null
                        && !authenticatedAccount.getMfaSecretEncrypted().isBlank();
                MfaChallengeService.Challenge challenge = mfaChallengeService.issue(
                        authenticatedAccount.getId(), authenticatedAccount.getLogin(),
                        enrolled ? Purpose.VERIFY : Purpose.ENROLL);
                try {
                    auditLogService.logAudit(new AuditLogDTO(null, null, request.getLogin(),
                            LocalDateTime.now(), enrolled
                                    ? "Primary credential accepted; MFA required"
                                    : "Primary credential accepted; MFA enrollment required"));
                } catch (Exception ignored) { }
                return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED).body(Map.of(
                        "errorCode", enrolled ? "MFA_REQUIRED" : "MFA_ENROLLMENT_REQUIRED",
                        "errorMessage", enrolled
                                ? "Verification multifacteur requise"
                                : "Enrolement multifacteur obligatoire",
                        "challenge", challenge.token(),
                        "expiresInSeconds", 300));
            }
            final String jwt = helper.generateToken(userDetails);

            try {
                auditLogService.logAudit(new AuditLogDTO(null, null, request.getLogin(),
                        LocalDateTime.now(), "Successfully Logged In"));
            } catch (Exception auditEx) {
                logger.warn("AuditLog non persiste pour login successful: {}", auditEx.getMessage());
            }

            // COOKIE DE SESSION (pas de maxAge/Expires) : le navigateur l'efface à
            // sa fermeture → la fermeture du navigateur / le redémarrage du poste
            // déconnecte systématiquement. La durée de vie utile reste bornée par
            // l'expiration du JWT lui-même (claim exp). Ne PAS remettre .maxAge(...) :
            // cela recréerait un cookie PERSISTANT qui garde la session ouverte.
            ResponseCookie cookie = ResponseCookie.from("jwt", jwt)
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .sameSite("None")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            loginAttemptService.recordSuccess(request.getLogin());
            return ResponseEntity.ok("Login successful");

        } catch (UsernameNotFoundException e) {
            loginAttemptService.recordFailure(request.getLogin());
            try {
                auditLogService.logAudit(
                        new AuditLogDTO(null, null, request.getLogin(), LocalDateTime.now(), "LoginId not found"));
            } catch (Exception ignored) { }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("errorMessage", "Incorrect username or password", "errorCode", 401));

        } catch (BadCredentialsException e) {
            loginAttemptService.recordFailure(request.getLogin());
            try {
                auditLogService.logAudit(
                        new AuditLogDTO(null, null, request.getLogin(), LocalDateTime.now(), "Incorrect Password"));
            } catch (Exception ignored) { }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("errorMessage", "Incorrect username or password", "errorCode", 401));

        } catch (AuthenticationException e) {
            loginAttemptService.recordFailure(request.getLogin());
            try {
                auditLogService.logAudit(
                        new AuditLogDTO(null, null, request.getLogin(), LocalDateTime.now(), "Authentication error"));
            } catch (Exception ignored) { }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("errorMessage", "Incorrect username or password", "errorCode", 401));

        } catch (Exception e) {
            logger.error("Unexpected login error for {}: {}", request.getLogin(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("errorMessage", "Internal server error", "errorCode", 500));
        }
    }

    /**
     * PREMIÈRE CONNEXION — pose du nouveau mot de passe (PRÉ-SESSION), via le
     * challenge PASSWORD_CHANGE émis par /login. Enchaîne ensuite sur la MFA si le
     * rôle l'exige (enrôlement 2FA), sinon ouvre directement la session. Route
     * publique (allow-list gateway) : aucune session n'existe encore à ce stade.
     */
    @PostMapping("/first-login/password")
    public ResponseEntity<?> firstLoginPassword(@RequestBody Map<String, String> body,
            HttpServletResponse response) {
        String challengeToken = body.get("challenge");
        String newPwd = body.get("newPassword");
        if (challengeToken == null || challengeToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("errorCode", "CHALLENGE_REQUIRED", "errorMessage", "Challenge manquant"));
        }
        MfaChallengeService.Challenge ch;
        try {
            ch = mfaChallengeService.require(challengeToken, MfaChallengeService.Purpose.PASSWORD_CHANGE);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("errorCode", "CHALLENGE_INVALID", "errorMessage", "Challenge invalide ou expiré, recommencez la connexion"));
        }
        Account account = accountRepository.findById(ch.accountId()).orElse(null);
        if (account == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("errorCode", "ACCOUNT_NOT_FOUND"));
        }
        String policyErr = passwordPolicyError(newPwd, account.getPassword());
        if (policyErr != null) {
            return ResponseEntity.badRequest().body(Map.of("errorCode", policyErr, "errorMessage", passwordPolicyMessage(policyErr)));
        }
        account.setPassword(passwordEncoder.encode(newPwd));
        account.setFirstLogin(false);
        accountRepository.save(account);
        mfaChallengeService.consume(challengeToken);
        try {
            auditLogService.logAudit(new AuditLogDTO(null, null, account.getLogin(),
                    LocalDateTime.now(), "First-login password changed"));
        } catch (Exception ignored) { }

        // Chaîne : MFA d'abord si le rôle l'exige (enrôlement pour un nouveau compte).
        if (mfaRolePolicy.requiresMfa(account.getRole())) {
            boolean enrolled = Boolean.TRUE.equals(account.getMfaEnabled())
                    && account.getMfaSecretEncrypted() != null && !account.getMfaSecretEncrypted().isBlank();
            MfaChallengeService.Challenge mfaCh = mfaChallengeService.issue(
                    account.getId(), account.getLogin(),
                    enrolled ? MfaChallengeService.Purpose.VERIFY : MfaChallengeService.Purpose.ENROLL);
            return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED).body(Map.of(
                    "errorCode", enrolled ? "MFA_REQUIRED" : "MFA_ENROLLMENT_REQUIRED",
                    "errorMessage", enrolled ? "Vérification multifacteur requise" : "Enrôlement multifacteur obligatoire",
                    "challenge", mfaCh.token(),
                    "expiresInSeconds", 300));
        }
        // Sinon : session directe (cookie de SESSION, sans maxAge → fermeture navigateur = déconnexion).
        UserDetails userDetails = userDetailsService.loadUserByUsername(account.getLogin());
        String jwt = helper.generateToken(userDetails);
        ResponseCookie cookie = ResponseCookie.from("jwt", jwt)
                .httpOnly(true).secure(true).path("/").sameSite("None").build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok(Map.of("status", "AUTHENTICATED"));
    }

    /** Retourne un code d'erreur si le MDP viole la politique OWASP, sinon null. */
    private String passwordPolicyError(String pwd, String currentHash) {
        if (pwd == null || pwd.isBlank()) return "NEW_PASSWORD_REQUIRED";
        if (pwd.length() < 10) return "PASSWORD_TOO_SHORT";
        if (!pwd.matches(".*[A-Z].*")) return "PASSWORD_MISSING_UPPERCASE";
        if (!pwd.matches(".*[a-z].*")) return "PASSWORD_MISSING_LOWERCASE";
        if (!pwd.matches(".*[0-9].*")) return "PASSWORD_MISSING_DIGIT";
        if (!pwd.matches(".*[^A-Za-z0-9].*")) return "PASSWORD_MISSING_SPECIAL";
        if (currentHash != null && passwordEncoder.matches(pwd, currentHash)) return "PASSWORD_REUSED";
        return null;
    }

    private String passwordPolicyMessage(String code) {
        switch (code) {
            case "NEW_PASSWORD_REQUIRED": return "Le nouveau mot de passe est requis";
            case "PASSWORD_TOO_SHORT": return "Le mot de passe doit comporter au moins 10 caractères";
            case "PASSWORD_MISSING_UPPERCASE": return "Le mot de passe doit contenir au moins une majuscule";
            case "PASSWORD_MISSING_LOWERCASE": return "Le mot de passe doit contenir au moins une minuscule";
            case "PASSWORD_MISSING_DIGIT": return "Le mot de passe doit contenir au moins un chiffre";
            case "PASSWORD_MISSING_SPECIAL": return "Le mot de passe doit contenir au moins un caractère spécial";
            case "PASSWORD_REUSED": return "Le nouveau mot de passe doit être différent de l'ancien";
            default: return "Mot de passe invalide";
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@CookieValue(name = "jwt", required = false) String token) {
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("JWT cookie is missing");
        }

        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(SECRET)
                    .parseClaimsJws(token)
                    .getBody();

            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired JWT");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletResponse response) {
        // LOT 42 hotfix : retrait du .domain(".data-univers.com") qui empêche
        // la suppression du cookie sur safex360-gateway.onrender.com (domain
        // mismatch). Le cookie de logout doit cibler le même domaine que le
        // cookie de login (par défaut = host du backend).
        ResponseCookie expiredCookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .sameSite("None")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString());
        return ResponseEntity.ok("Logged out");
    }

}
