package com.hrms.security;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.time.Clock;
import java.util.List;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.entity.Account;
import com.hrms.repository.AccountRepository;
import com.hrms.security.MfaChallengeService.Challenge;
import com.hrms.security.MfaChallengeService.Purpose;

/** Enrolement, verification TOTP et codes de recuperation mono-usage. */
@Service
public class MfaService {

    public record Enrollment(String manualKey, String otpAuthUri) { }
    public record EnrollmentResult(List<String> recoveryCodes) { }

    private static final int RECOVERY_CODE_COUNT = 8;
    private final AccountRepository accounts;
    private final MfaChallengeService challenges;
    private final MfaRolePolicy rolePolicy;
    private final TotpService totp;
    private final MfaCryptoService crypto;
    private final BCryptPasswordEncoder recoveryEncoder = new BCryptPasswordEncoder(10);
    private final SecureRandom random = new SecureRandom();

    /**
     * Secrets TOTP en attente entre {@code enroll/start} et {@code enroll/confirm}.
     *
     * <p>Expiration ALIGNEE sur celle du challenge ({@link MfaChallengeService#TTL})
     * : une fois le challenge perime, le secret n'a plus d'usage possible. Sans
     * cette expiration, chaque enrolement abandonne laissait un secret TOTP EN
     * CLAIR en memoire pour toute la duree de vie du processus — fuite lente et
     * retention inutile de matiere cryptographique.
     *
     * <p>Limite connue et assumee : ce stockage, comme celui des challenges, est
     * LOCAL au processus. Un redemarrage pendant un enrolement invalide challenge
     * ET secret ensemble — l'utilisateur recommence sa connexion, il n'y a pas
     * d'etat incoherent. En revanche, passer le service a PLUSIEURS INSTANCES
     * exigerait de partager les deux (Redis ou table dediee) ; tant que le service
     * tourne en instance unique, ce n'est pas necessaire.
     */
    private final com.github.benmanes.caffeine.cache.Cache<String, String> pendingSecrets;

    // Constructeur utilise par Spring : il n'existe AUCUN bean Clock dans ce
    // contexte (MfaChallengeService, TotpService et ServiceTokenVerifier suivent
    // tous le meme motif de delegation). Exposer uniquement la variante a Clock
    // ferait echouer le demarrage de l'application.
    // @Autowired EXPLICITE : des qu'une classe expose PLUSIEURS constructeurs,
    // Spring n'en choisit plus un automatiquement et se rabat sur le constructeur
    // par defaut — qui n'existe pas ici (echec au demarrage, attrape par
    // HrmsApplicationTests.contextLoads).
    @org.springframework.beans.factory.annotation.Autowired
    public MfaService(AccountRepository accounts, MfaChallengeService challenges,
            MfaRolePolicy rolePolicy, TotpService totp, MfaCryptoService crypto) {
        this(accounts, challenges, rolePolicy, totp, crypto, Clock.systemUTC());
    }

    MfaService(AccountRepository accounts, MfaChallengeService challenges,
            MfaRolePolicy rolePolicy, TotpService totp, MfaCryptoService crypto, Clock clock) {
        this.accounts = accounts;
        this.challenges = challenges;
        this.rolePolicy = rolePolicy;
        this.totp = totp;
        this.crypto = crypto;
        this.pendingSecrets = com.github.benmanes.caffeine.cache.Caffeine.newBuilder()
                .expireAfterWrite(MfaChallengeService.TTL)
                // Horloge injectee : le test fait avancer le temps sans attendre.
                .ticker(() -> clock.instant().toEpochMilli() * 1_000_000L)
                .build();
    }

    /** Nombre de secrets d'enrolement encore en attente (diagnostic + test de fuite). */
    long pendingEnrollmentCount() {
        pendingSecrets.cleanUp();
        return pendingSecrets.estimatedSize();
    }

    public Enrollment beginEnrollment(String challengeToken) {
        Challenge challenge = challenges.require(challengeToken, Purpose.ENROLL);
        Account account = account(challenge.accountId());
        // Predicat unique Account.isMfaEnrolled() : on refuse le (re)enrolement
        // uniquement si le compte est REELLEMENT enrole (drapeau ET secret). Un
        // drapeau seul, sans secret, doit pouvoir s'enroler — sinon le compte est
        // bloque : /login emet un ENROLL que cette garde rejetait.
        if (!rolePolicy.requiresMfa(account) || account.isMfaEnrolled()) {
            throw new MfaException("MFA_ENROLLMENT_NOT_ALLOWED");
        }
        String secret = pendingSecrets.get(challengeToken, ignored -> totp.newSecret());
        // Affichage dans l'application d'authentification (Microsoft
        // Authenticator, Google Authenticator...) : l'`issuer` est le titre en
        // gras (« SafeX 360 »), la partie compte est la ligne du dessous. On y
        // met le login ET le domaine datauniverse.bf : le titre reste « SafeX 360 »
        // et la seconde ligne « <login> · datauniverse.bf » — ainsi un
        // administrateur qui gère plusieurs comptes SafeX les distingue, tout en
        // voyant le domaine demandé.
        String issuer = "SafeX 360";
        String accountLabel = challenge.login() + " · datauniverse.bf";
        String uri = "otpauth://totp/" + url(issuer + ":" + accountLabel) + "?secret=" + secret
                + "&issuer=" + url(issuer) + "&algorithm=SHA1&digits=6&period=30";
        return new Enrollment(secret, uri);
    }

    @Transactional
    public synchronized EnrollmentResult confirmEnrollment(String challengeToken, String code) {
        Challenge challenge = challenges.require(challengeToken, Purpose.ENROLL);
        String secret = pendingSecrets.getIfPresent(challengeToken);
        if (secret == null) throw new MfaException("MFA_ENROLLMENT_NOT_STARTED");
        long step = totp.validate(secret, code);
        if (step < 0) {
            challenges.recordFailure(challengeToken);
            throw new MfaException("MFA_CODE_INVALID");
        }

        Account account = account(challenge.accountId());
        if (!rolePolicy.requiresMfa(account)) throw new MfaException("MFA_ENROLLMENT_NOT_ALLOWED");
        List<String> recoveryCodes = newRecoveryCodes();
        account.setMfaSecretEncrypted(crypto.encrypt(secret));
        account.setMfaRecoveryCodeHashes(hashRecoveryCodes(recoveryCodes));
        // Le code confirme uniquement la possession lors de l'enrolement; il ne
        // cree pas de session et ne doit pas bloquer la connexion qui suit.
        account.setMfaLastAcceptedStep(null);
        account.setMfaEnrolledAt(LocalDateTime.now());
        account.setMfaEnabled(true);
        accounts.save(account);
        pendingSecrets.invalidate(challengeToken);
        challenges.consume(challengeToken);
        return new EnrollmentResult(List.copyOf(recoveryCodes));
    }

    @Transactional
    public synchronized Account verify(String challengeToken, String code, String recoveryCode) {
        Challenge challenge = challenges.require(challengeToken, Purpose.VERIFY);
        Account account = account(challenge.accountId());
        if (!rolePolicy.requiresMfa(account) || !account.isMfaEnrolled()) {
            throw new MfaException("MFA_NOT_ENROLLED");
        }

        boolean valid;
        if (recoveryCode != null && !recoveryCode.isBlank()) {
            valid = consumeRecoveryCode(account, recoveryCode);
        } else {
            long step = totp.validate(crypto.decrypt(account.getMfaSecretEncrypted()), code);
            valid = step >= 0 && (account.getMfaLastAcceptedStep() == null || step > account.getMfaLastAcceptedStep());
            if (valid) account.setMfaLastAcceptedStep(step);
        }
        if (!valid) {
            challenges.recordFailure(challengeToken);
            throw new MfaException("MFA_CODE_INVALID_OR_REPLAYED");
        }

        accounts.save(account);
        challenges.consume(challengeToken);
        return account;
    }

    private boolean consumeRecoveryCode(Account account, String candidate) {
        String normalized = normalizeRecoveryCode(candidate);
        if (normalized.length() < 12 || account.getMfaRecoveryCodeHashes() == null) return false;
        List<String> hashes = new ArrayList<>(List.of(account.getMfaRecoveryCodeHashes().split("\\n")));
        for (int i = 0; i < hashes.size(); i++) {
            if (recoveryEncoder.matches(normalized, hashes.get(i))) {
                hashes.remove(i);
                account.setMfaRecoveryCodeHashes(String.join("\n", hashes));
                return true;
            }
        }
        return false;
    }

    private List<String> newRecoveryCodes() {
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < RECOVERY_CODE_COUNT; i++) {
            byte[] bytes = new byte[10];
            random.nextBytes(bytes);
            String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
                    .replace('-', 'A').replace('_', 'B').toUpperCase();
            codes.add(raw.substring(0, 8) + "-" + raw.substring(8, 14));
        }
        return codes;
    }

    private String hashRecoveryCodes(List<String> codes) {
        return codes.stream()
                .map(MfaService::normalizeRecoveryCode)
                .map(recoveryEncoder::encode)
                .reduce((left, right) -> left + "\n" + right)
                .orElse("");
    }

    private Account account(long id) {
        return accounts.findById(id).orElseThrow(() -> new MfaException("MFA_CHALLENGE_INVALID"));
    }

    private static String normalizeRecoveryCode(String code) {
        return code == null ? "" : code.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    private static String url(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    public static final class MfaException extends RuntimeException {
        private static final long serialVersionUID = 1L;
        public MfaException(String code) { super(code); }
    }
}
