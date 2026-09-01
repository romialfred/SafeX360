package com.hrms.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.hrms.api.AdminUserController.ResetPasswordResponse;
import com.hrms.entity.Account;
import com.hrms.entity.AdminActionLog;
import com.hrms.repository.AccountRepository;
import com.hrms.repository.AdminActionLogRepository;
import com.hrms.security.AdminGuard;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Régressions du parcours de secours administrateur : les deux boutons gardent
 * des responsabilités distinctes, et un secret temporaire reste récupérable par
 * l'administrateur lorsque l'email ne part pas.
 */
@ExtendWith(MockitoExtension.class)
class AdminUserControllerCredentialResetTest {

    @Mock
    private AccountRepository accountRepository;
    @Mock
    private AdminActionLogRepository adminActionLogRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JavaMailSender mailSender;
    @Mock
    private AdminGuard adminGuard;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private AdminUserController controller;

    @BeforeEach
    void authorizeAdministrator() {
        when(adminGuard.requireAdmin(isNull(), any(HttpServletRequest.class))).thenReturn("admin.hse");
    }

    @Test
    void resetMfaAlsoRenewsLocalPasswordAndForcesOrderedRecoveryFlow() throws Exception {
        Account account = localAccount();
        when(accountRepository.findById(42L)).thenReturn(Optional.of(account));
        when(passwordEncoder.encode(anyString())).thenReturn("HASHED_TEMPORARY_PASSWORD");
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mailSender.createMimeMessage()).thenThrow(new IllegalStateException("SMTP unavailable"));

        LocalDateTime before = LocalDateTime.now();
        ResetPasswordResponse result = controller.resetMfa(42L, null, request).getBody();

        assertNotNull(result);
        assertTrue(result.isMfaReset());
        assertTrue(result.isPasswordReset());
        assertFalse(result.isEmailSent());
        assertNotNull(result.getTemporaryPassword());
        assertEquals("HASHED_TEMPORARY_PASSWORD", account.getPassword());
        assertTrue(Boolean.TRUE.equals(account.getFirstLogin()));
        assertNotNull(account.getInvitationExpiresAt());
        assertTrue(account.getInvitationExpiresAt().isAfter(before.plusHours(23)));

        assertFalse(Boolean.TRUE.equals(account.getMfaEnabled()));
        assertFalse(Boolean.TRUE.equals(account.getMfaExempt()));
        assertNull(account.getMfaSecretEncrypted());
        assertNull(account.getMfaRecoveryCodeHashes());
        assertNull(account.getMfaLastAcceptedStep());
        assertNull(account.getMfaEnrolledAt());
        verify(passwordEncoder).encode(result.getTemporaryPassword());

        ArgumentCaptor<AdminActionLog> log = ArgumentCaptor.forClass(AdminActionLog.class);
        verify(adminActionLogRepository).save(log.capture());
        assertEquals("MFA_AND_PASSWORD_RESET", log.getValue().getAction());
        assertEquals("admin.hse", log.getValue().getPerformedBy());
    }

    @Test
    void passwordOnlyResetKeepsExistingMfaEnrollment() throws Exception {
        Account account = localAccount();
        when(accountRepository.findById(42L)).thenReturn(Optional.of(account));
        when(passwordEncoder.encode(anyString())).thenReturn("HASHED_PASSWORD_ONLY");
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mailSender.createMimeMessage()).thenThrow(new IllegalStateException("SMTP unavailable"));

        ResetPasswordResponse result = controller.resetPassword(42L, null, request).getBody();

        assertNotNull(result);
        assertTrue(result.isPasswordReset());
        assertFalse(result.isMfaReset());
        assertTrue(Boolean.TRUE.equals(account.getMfaEnabled()));
        assertEquals("ENCRYPTED_TOTP", account.getMfaSecretEncrypted());
        assertEquals("HASHED_RECOVERY_CODES", account.getMfaRecoveryCodeHashes());

        ArgumentCaptor<AdminActionLog> log = ArgumentCaptor.forClass(AdminActionLog.class);
        verify(adminActionLogRepository).save(log.capture());
        assertEquals("PASSWORD_RESET", log.getValue().getAction());
    }

    @Test
    void resetMfaKeepsDirectoryPasswordForActiveDirectoryAccount() throws Exception {
        Account account = localAccount();
        account.setIdentitySource("ACTIVE_DIRECTORY");
        account.setPassword("DIRECTORY_MANAGED");
        account.setFirstLogin(false);
        when(accountRepository.findById(42L)).thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mailSender.createMimeMessage()).thenThrow(new IllegalStateException("SMTP unavailable"));

        ResetPasswordResponse result = controller.resetMfa(42L, null, request).getBody();

        assertNotNull(result);
        assertTrue(result.isMfaReset());
        assertFalse(result.isPasswordReset());
        assertNull(result.getTemporaryPassword());
        assertEquals("DIRECTORY_MANAGED", account.getPassword());
        assertFalse(Boolean.TRUE.equals(account.getFirstLogin()));
        verify(passwordEncoder, never()).encode(anyString());

        ArgumentCaptor<AdminActionLog> log = ArgumentCaptor.forClass(AdminActionLog.class);
        verify(adminActionLogRepository).save(log.capture());
        assertEquals("MFA_RESET", log.getValue().getAction());
    }

    private static Account localAccount() {
        Account account = new Account();
        account.setId(42L);
        account.setLogin("k.ouedraogo");
        account.setName("K. Ouédraogo");
        account.setEmail("k.ouedraogo@example.test");
        account.setIdentitySource("LOCAL");
        account.setPassword("OLD_HASH");
        account.setFirstLogin(false);
        account.setMfaEnabled(true);
        account.setMfaExempt(true);
        account.setMfaSecretEncrypted("ENCRYPTED_TOTP");
        account.setMfaRecoveryCodeHashes("HASHED_RECOVERY_CODES");
        account.setMfaLastAcceptedStep(123L);
        account.setMfaEnrolledAt(LocalDateTime.now().minusDays(10));
        return account;
    }
}
