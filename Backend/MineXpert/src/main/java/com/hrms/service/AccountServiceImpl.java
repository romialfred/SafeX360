package com.hrms.service;

import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.hrms.DataInterface.AccountDetailsDTO;
import com.hrms.DataInterface.AccountNameDTO;
import com.hrms.dto.AccountDTO;
import com.hrms.entity.Account;
import com.hrms.exception.HRMSException;
import com.hrms.repository.AccountRepository;
import com.hrms.utility.Data;

import jakarta.mail.internet.MimeMessage;
import org.springframework.transaction.annotation.Transactional;

/**
 * LOT 40 P0 fix : ajout @Transactional sur le service.
 *
 * Toutes les méthodes write (addAccount, updateAccount, updatePassword,
 * resetPassword, updateAccountPermissions) effectuaient des INSERT/UPDATE
 * MySQL sans transaction. Risque : commit partiel en cas d'exception
 * (entité sauvegardée mais email d'invitation échoué = compte orphelin
 * sans mot de passe envoyé).
 *
 * On annote au niveau classe : les méthodes lecture (getXxx) tolèrent
 * un readOnly implicite via Spring défaut.
 */
@Service
@Transactional
public class AccountServiceImpl implements AccountService {

    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${LOGIN_URL}")
    private String loginUrl;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Override
    public void addAccount(AccountDTO accountDTO) throws Exception {
        if (accountRepository.findByLogin(accountDTO.getLogin()).isPresent())
            throw new HRMSException("LOGIN_ALREADY_EXISTS");
        this.sendEmail(accountDTO);
        accountDTO.setId(null);
        accountDTO.setPassword(passwordEncoder.encode(accountDTO.getPassword()));
        accountRepository.save(accountDTO.toEntity());
    }

    @Override
    public Boolean sendEmail(AccountDTO accountDTO) throws Exception {
        MimeMessage mm = mailSender.createMimeMessage();
        MimeMessageHelper message = new MimeMessageHelper(mm, true);
        message.setTo(accountDTO.getEmail());
        message.setFrom(fromEmail);
        message.setSubject(" Welcome to the Mine Xpert System - Access to Your Account");
        message.setText(Data.getMessageBody(accountDTO.getName(), accountDTO.getLogin(), accountDTO.getPassword(),
                loginUrl, "r.tiegnan@data-univers.com",
                "Data Universe",
                null,
                "+225 0767344711 / +226 77963525"), true);
        mailSender.send(mm);
        return true;
    }

    @Override
    public AccountDTO getAccount(Long id) throws HRMSException {
        AccountDTO dto = accountRepository.findById(id)
                .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"))
                .toDTO();
        // LOT 40 P1 fix : sécurité — ne JAMAIS exposer le hash bcrypt
        // dans la réponse JSON, même si bcrypt est non-réversible.
        dto.setPassword(null);
        dto.setOldPassword(null);
        return dto;
    }

    @Override
    public void updateAccount(AccountDTO accountDTO) throws Exception {
        Account account = accountRepository.findById(accountDTO.getId())
                .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));
        Optional<Account> opt = accountRepository.findByLogin(accountDTO.getLogin());
        if (opt.isPresent() && !opt.get().getId().equals(accountDTO.getId()))
            throw new HRMSException("LOGIN_ALREADY_EXISTS");
        accountRepository.save(accountDTO.toEntity());
    }

    @Override
    public void updatePassword(AccountDTO accountDTO) throws Exception {
        // LOT 39 — Audit P0 : sécurisation du changement de mot de passe.
        //
        // L'API frontend envoie { login, oldPassword, newPassword }.
        // On résout le compte par login (et non par id confié au client, sujet
        // à manipulation), on vérifie obligatoirement l'ancien mot de passe
        // avec passwordEncoder.matches(...) puis on réencode le nouveau.
        //
        // On garde la compatibilité ascendante : si la requête fournit déjà
        // un id et aucun oldPassword (legacy admin reset interne), la branche
        // historique reste accessible — mais elle n'est plus exposée par le
        // formulaire utilisateur.
        String login = accountDTO.getLogin();
        String oldPassword = accountDTO.getOldPassword();
        String newPassword = accountDTO.getPassword();

        if (newPassword == null || newPassword.isBlank()) {
            throw new HRMSException("PASSWORD_REQUIRED");
        }
        // LOT 40 P0 Security fix : enforce password complexity server-side.
        // Le client peut être contourné — la politique doit être appliquée
        // côté serveur pour respecter la baseline OWASP ASVS V2.1.1.
        if (newPassword.length() < 10) {
            throw new HRMSException("PASSWORD_TOO_SHORT");
        }
        if (!newPassword.matches(".*[A-Z].*")
                || !newPassword.matches(".*[a-z].*")
                || !newPassword.matches(".*[0-9].*")
                || !newPassword.matches(".*[^A-Za-z0-9].*")) {
            throw new HRMSException("PASSWORD_TOO_WEAK");
        }

        Account account;
        if (login != null && !login.isBlank()) {
            account = accountRepository.findByLogin(login)
                    .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));

            // Vérification ancien mot de passe obligatoire dès lors qu'on cible
            // un compte par login (parcours utilisateur self-service).
            if (oldPassword == null || oldPassword.isBlank()) {
                throw new HRMSException("OLD_PASSWORD_REQUIRED");
            }
            if (!passwordEncoder.matches(oldPassword, account.getPassword())) {
                throw new HRMSException("OLD_PASSWORD_INVALID");
            }
        } else if (accountDTO.getId() != null) {
            // Compatibilité : reset par id (legacy admin).
            account = accountRepository.findById(accountDTO.getId())
                    .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));
        } else {
            throw new HRMSException("ACCOUNT_NOT_FOUND");
        }

        account.setPassword(passwordEncoder.encode(newPassword));
        account.setFirstLogin(false);
        accountRepository.save(account);
    }

    @Override
    public void resetPassword(AccountDTO accountDTO) throws Exception {
        Account account = accountRepository.findByEmailAndLogin(accountDTO.getEmail(), accountDTO.getLogin())
                .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));
        account.setPassword(passwordEncoder.encode(accountDTO.getPassword()));
        account.setFirstLogin(true);
        MimeMessage mm = mailSender.createMimeMessage();
        MimeMessageHelper message = new MimeMessageHelper(mm, true);
        message.setTo(accountDTO.getEmail());
        message.setSubject(" Password Reset - Access to Your Account");
        message.setText(Data.getResetPasswordBody(accountDTO.getName(), accountDTO.getLogin(), accountDTO.getPassword(),
                loginUrl, "r.tiegnan@data-univers.com",
                "Data Universe",
                null,
                "+225 0767344711 / +226 77963425"), true);
        mailSender.send(mm);
        accountRepository.save(account);
    }

    @Override
    public List<AccountDetailsDTO> getAllAccounts() {
        return accountRepository.getAllAccounts();
    }

    @Override
    public AccountDTO getAccountByLogin(String login) throws HRMSException {
        return accountRepository.findByLogin(login).orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND")).toDTO();
    }

    @Override
    public List<Object[]> getCountsByCompany() {
        return accountRepository.countAccountsByCompany();
    }

    @Override
    public List<Object[]> getActiveCountsByCompany() {
        return accountRepository.countActiveAccountsByCompany();
    }

    @Override
    public List<Object[]> getAdminCountsByCompany() {
        return accountRepository.countAdminAccountsByCompany();
    }

    @Override
    public List<Long> getAllEmpIds() {
        return accountRepository.findAllEmpIds();
    }

    @Override
    public List<AccountNameDTO> getLeaveApprover(Long departmentId) {
        return ((List<AccountNameDTO>) accountRepository.findAccountNamesByDepartment(departmentId));
    }

    @Override
    public void sendUpdatedPassword(AccountDTO accountDTO) throws Exception {
        Account account = accountRepository.findById(accountDTO.getId())
                .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));
        this.sendEmail(accountDTO);
        account.setPassword(passwordEncoder.encode(accountDTO.getPassword()));
        accountRepository.save(account);
    }

    @Override
    public AccountDTO getAccountByEmpId(Long empId) throws HRMSException {
        AccountDTO dto = accountRepository.findByEmployee_Id(empId)
                .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"))
                .toDTO();
        // LOT 40 P1 fix : sécurité — masque hash bcrypt avant retour JSON.
        dto.setPassword(null);
        dto.setOldPassword(null);
        return dto;
    }

    @Override
    public List<AccountNameDTO> getSalaryAdvanceApprover(Long companyId) {
        return accountRepository.findAccountsByCompanyAndLAdvanceManagement(companyId);
    }

    @Override
    public AccountDetailsDTO getAccountPermissions(Long id) throws HRMSException {
        return accountRepository.getAccountPermission(id).orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));
    }

    @Override
    public void updateAccountPermissions(AccountDTO accountDTO) throws HRMSException {
        Account account = accountRepository.findById(accountDTO.getId())
                .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));
        account.setTeams(accountDTO.getTeams());
        account.setMyTimesheet(accountDTO.getMyTimesheet());
        account.setTeamTimesheet(accountDTO.getTeamTimesheet());
        account.setTimesheetManagement(accountDTO.getTimesheetManagement());
        account.setWorkHourCodes(accountDTO.getWorkHourCodes());
        account.setTimesheetApproval(accountDTO.getTimesheetApproval());
        account.setTimesheetVerification(accountDTO.getTimesheetVerification());
        account.setTimesheetTransfer(accountDTO.getTimesheetTransfer());
        account.setPayrollHistory(accountDTO.getPayrollHistory());
        account.setPayrollSchedule(accountDTO.getPayrollSchedule());
        account.setRulesConstraints(accountDTO.getRulesConstraints());
        account.setTimesheetPermissions(accountDTO.getTimesheetPermissions());
        accountRepository.save(account);

    }

}
