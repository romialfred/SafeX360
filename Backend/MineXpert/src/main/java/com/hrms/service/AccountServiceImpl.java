package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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

@Service
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
    @Caching(evict = {
            @CacheEvict(cacheNames = "accountById", allEntries = true),
            @CacheEvict(cacheNames = "accountsAll", allEntries = true),
            @CacheEvict(cacheNames = "accountByLogin", key = "#accountDTO.login", condition = "#accountDTO.login != null"),
            @CacheEvict(cacheNames = "accountCountsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "accountActiveCountsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "accountAdminCountsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "accountEmpIds", allEntries = true),
            @CacheEvict(cacheNames = "leaveApproversByDept", allEntries = true),
            @CacheEvict(cacheNames = "salaryAdvanceApproversByCompany", allEntries = true),
            @CacheEvict(cacheNames = "accountByEmpId", allEntries = true),
            @CacheEvict(cacheNames = "accountPermissions", allEntries = true)
    })
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
    @Cacheable(cacheNames = "accountById", key = "#id")
    public AccountDTO getAccount(Long id) throws HRMSException {
        return accountRepository.findById(id).orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND")).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "accountById", key = "#accountDTO.id", condition = "#accountDTO.id != null"),
            @CacheEvict(cacheNames = "accountByLogin", allEntries = true),
            @CacheEvict(cacheNames = "accountsAll", allEntries = true),
            @CacheEvict(cacheNames = "accountCountsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "accountActiveCountsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "accountAdminCountsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "accountEmpIds", allEntries = true),
            @CacheEvict(cacheNames = "leaveApproversByDept", allEntries = true),
            @CacheEvict(cacheNames = "salaryAdvanceApproversByCompany", allEntries = true),
            @CacheEvict(cacheNames = "accountByEmpId", allEntries = true),
            @CacheEvict(cacheNames = "accountPermissions", key = "#accountDTO.id", condition = "#accountDTO.id != null")
    })
    public void updateAccount(AccountDTO accountDTO) throws Exception {
        accountRepository.findById(accountDTO.getId())
                .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));
        Optional<Account> opt = accountRepository.findByLogin(accountDTO.getLogin());
        if (opt.isPresent() && !opt.get().getId().equals(accountDTO.getId()))
            throw new HRMSException("LOGIN_ALREADY_EXISTS");
        accountRepository.save(accountDTO.toEntity());
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "accountById", key = "#accountDTO.id", condition = "#accountDTO.id != null"),
            @CacheEvict(cacheNames = "accountByLogin", allEntries = true),
            @CacheEvict(cacheNames = "accountsAll", allEntries = true),
            @CacheEvict(cacheNames = "accountPermissions", key = "#accountDTO.id", condition = "#accountDTO.id != null")
    })
    public void updatePassword(AccountDTO accountDTO) throws Exception {
        Account account = accountRepository.findById(accountDTO.getId())
                .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));
        account.setPassword(passwordEncoder.encode(accountDTO.getPassword()));
        account.setFirstLogin(false);

        accountRepository.save(account);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "accountById", allEntries = true),
            @CacheEvict(cacheNames = "accountByLogin", key = "#accountDTO.login", condition = "#accountDTO.login != null"),
            @CacheEvict(cacheNames = "accountsAll", allEntries = true),
            @CacheEvict(cacheNames = "accountPermissions", allEntries = true)
    })
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
    @Cacheable(cacheNames = "accountsAll")
    public List<AccountDetailsDTO> getAllAccounts() {
        return accountRepository.getAllAccounts();
    }

    @Override
    @Cacheable(cacheNames = "accountByLogin", key = "#login")
    public AccountDTO getAccountByLogin(String login) throws HRMSException {
        return accountRepository.findByLogin(login).orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND")).toDTO();
    }

    @Override
    @Cacheable(cacheNames = "accountCountsByCompany")
    public List<Object[]> getCountsByCompany() {
        return accountRepository.countAccountsByCompany();
    }

    @Override
    @Cacheable(cacheNames = "accountActiveCountsByCompany")
    public List<Object[]> getActiveCountsByCompany() {
        return accountRepository.countActiveAccountsByCompany();
    }

    @Override
    @Cacheable(cacheNames = "accountAdminCountsByCompany")
    public List<Object[]> getAdminCountsByCompany() {
        return accountRepository.countAdminAccountsByCompany();
    }

    @Override
    @Cacheable(cacheNames = "accountEmpIds")
    public List<Long> getAllEmpIds() {
        return accountRepository.findAllEmpIds();
    }

    @Override
    @Cacheable(cacheNames = "leaveApproversByDept", key = "#departmentId")
    public List<AccountNameDTO> getLeaveApprover(Long departmentId) {
        return ((List<AccountNameDTO>) accountRepository.findAccountNamesByDepartment(departmentId));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "accountById", key = "#accountDTO.id", condition = "#accountDTO.id != null"),
            @CacheEvict(cacheNames = "accountByLogin", allEntries = true),
            @CacheEvict(cacheNames = "accountsAll", allEntries = true),
            @CacheEvict(cacheNames = "accountCountsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "accountActiveCountsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "accountAdminCountsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "accountEmpIds", allEntries = true),
            @CacheEvict(cacheNames = "leaveApproversByDept", allEntries = true),
            @CacheEvict(cacheNames = "salaryAdvanceApproversByCompany", allEntries = true),
            @CacheEvict(cacheNames = "accountByEmpId", allEntries = true),
            @CacheEvict(cacheNames = "accountPermissions", key = "#accountDTO.id", condition = "#accountDTO.id != null")
    })
    public void sendUpdatedPassword(AccountDTO accountDTO) throws Exception {
        Account account = accountRepository.findById(accountDTO.getId())
                .orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));
        this.sendEmail(accountDTO);
        account.setPassword(passwordEncoder.encode(accountDTO.getPassword()));
        accountRepository.save(account);
    }

    @Override
    @Cacheable(cacheNames = "accountByEmpId", key = "#empId")
    public AccountDTO getAccountByEmpId(Long empId) throws HRMSException {
        return accountRepository.findByEmployee_Id(empId).orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"))
                .toDTO();
    }

    @Override
    @Cacheable(cacheNames = "salaryAdvanceApproversByCompany", key = "#companyId")
    public List<AccountNameDTO> getSalaryAdvanceApprover(Long companyId) {
        return accountRepository.findAccountsByCompanyAndLAdvanceManagement(companyId);
    }

    @Override
    @Cacheable(cacheNames = "accountPermissions", key = "#id")
    public AccountDetailsDTO getAccountPermissions(Long id) throws HRMSException {
        return accountRepository.getAccountPermission(id).orElseThrow(() -> new HRMSException("ACCOUNT_NOT_FOUND"));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "accountById", key = "#accountDTO.id", condition = "#accountDTO.id != null"),
            @CacheEvict(cacheNames = "accountsAll", allEntries = true),
            @CacheEvict(cacheNames = "accountPermissions", key = "#accountDTO.id", condition = "#accountDTO.id != null")
    })
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
