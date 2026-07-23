package com.hrms.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.hrms.Jwt.JwtHelper;
import com.hrms.entity.Account;
import com.hrms.repository.AccountRepository;

import jakarta.servlet.http.HttpServletRequest;

/**
 * GARDE D'ADMINISTRATION — regle unique et unique implementation.
 *
 * <p>La decision repose EXCLUSIVEMENT sur le role du compte porte par le cookie
 * JWT. La passerelle injecte {@code X-Secret-Key} sur tout trafic authentifie :
 * ce secret ne prouve donc jamais qu'on est administrateur et ne doit pas entrer
 * dans la decision pour une requete porteuse d'identite.
 *
 * <p>Trois conditions cumulatives : role d'administration (via {@link AdminRoles},
 * source unique), compte ACTIF, et mot de passe temporaire deja change — un
 * compte encore en premiere connexion n'administre rien.
 *
 * <p>Extraite de {@code AdminUserController} pour que les ecrans ajoutes ensuite
 * (tracabilite, fiche utilisateur) partagent la MEME garde. Une garde recopiee
 * est une garde qui divergera : c'est exactement ce qui avait produit un 403
 * pour tous les administrateurs (cf. {@link AdminRoles}).
 */
@Component
public class AdminGuard {

    private static final Logger LOG = LoggerFactory.getLogger(AdminGuard.class);

    private final JwtHelper jwtHelper;
    private final AccountRepository accountRepository;

    public AdminGuard(JwtHelper jwtHelper, AccountRepository accountRepository) {
        this.jwtHelper = jwtHelper;
        this.accountRepository = accountRepository;
    }

    /**
     * @return le login de l'administrateur appelant
     * @throws ResponseStatusException 403 si l'appelant n'est pas administrateur
     */
    public String requireAdmin(String token, HttpServletRequest request) {
        Account admin = adminOrNull(token);
        if (admin != null) {
            return admin.getLogin();
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Accès réservé aux administrateurs (SYSTEM_ADMINISTRATOR)");
    }

    /** Compte administrateur appelant, ou {@code null}. */
    public Account adminOrNull(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            String login = jwtHelper.getUsernameFromToken(token);
            Account admin = accountRepository.findByLogin(login).orElse(null);
            if (admin != null && AdminRoles.isAdmin(admin.getRole())
                    && "ACTIVE".equalsIgnoreCase(admin.getStatus())
                    && !Boolean.TRUE.equals(admin.getFirstLogin())) {
                return admin;
            }
        } catch (Exception e) {
            LOG.warn("JWT admin invalide: {}", e.getMessage());
        }
        return null;
    }
}
