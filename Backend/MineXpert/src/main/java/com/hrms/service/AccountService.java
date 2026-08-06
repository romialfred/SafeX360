package com.hrms.service;

import java.util.List;

import com.hrms.DataInterface.AccountDetailsDTO;
import com.hrms.DataInterface.AccountNameDTO;
import com.hrms.dto.AccountDTO;
import com.hrms.exception.HRMSException;

public interface AccountService {
    public void addAccount(AccountDTO accountDTO) throws Exception;

    public AccountDTO getAccount(Long id) throws HRMSException;

    public AccountDTO getAccountByLogin(String login) throws HRMSException;

    public Boolean sendEmail(AccountDTO accountDTO) throws Exception;

    // [AUTH-01] sendUpdatedPassword retire (endpoint /send-password non garde supprime).

    public void updateAccount(AccountDTO accountDTO) throws Exception;

    /**
     * Met a jour l'identite d'un compte (nom, courriel, telephone).
     *
     * <p>Regle d'or : un compte issu de l'Active Directory tient son nom et son
     * courriel de l'annuaire — ils ne sont PAS modifiables ici (seul le telephone,
     * non cartographie depuis l'AD, reste editable). Un compte LOCAL est
     * entierement editable.
     */
    public AccountDTO updateProfile(Long id, String name, String email, String phoneNumber) throws HRMSException;

    public void updatePassword(AccountDTO accountDTO) throws Exception;

    // public void sendOtp(String email)throws Exception;
    public void resetPassword(AccountDTO accountDTO) throws Exception;

    public List<AccountDetailsDTO> getAllAccounts();

    public List<Object[]> getCountsByCompany();

    public List<Object[]> getActiveCountsByCompany();

    public List<Object[]> getAdminCountsByCompany();

    public List<Long> getAllEmpIds();

    public List<AccountNameDTO> getLeaveApprover(Long departmentId);

    public List<AccountNameDTO> getSalaryAdvanceApprover(Long companyId);

    public AccountDTO getAccountByEmpId(Long empId) throws HRMSException;

    public AccountDetailsDTO getAccountPermissions(Long id) throws HRMSException;

    public void updateAccountPermissions(AccountDTO accountDTO) throws HRMSException;
}
