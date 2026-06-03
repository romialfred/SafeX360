package com.hrms.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.hrms.dto.AccountDTO;
import com.hrms.dto.LeaveStatus;
import com.hrms.dto.NotificationDTO;
import com.hrms.dto.ReimbursementStatus;
import com.hrms.dto.SalaryAdvanceDTO;
import com.hrms.entity.SalaryAdvance;
import com.hrms.exception.HRMSException;
import com.hrms.repository.SalaryAdvanceRepository;
import com.hrms.utility.Data;

import jakarta.mail.internet.MimeMessage;

@Service
public class SalaryAdvanceServiceImpl implements SalaryAdvanceService {

        @Autowired
        private SalaryAdvanceRepository salaryAdvanceRepository;

        @Autowired
        private AccountService accountService;

        @Autowired
        private JavaMailSender mailSender;

        @Autowired
        private NotificationService notificationService;

        @Override
        @CacheEvict(cacheNames = { "salaryAdvancesByApprover", "salaryAdvancesByEmp" }, allEntries = true)
        public void addSalaryAdvance(SalaryAdvanceDTO salaryAdvanceDTO) throws HRMSException {
                if (salaryAdvanceRepository
                                .findByEmpIdAndReimbursementIn(salaryAdvanceDTO.getEmpId(),
                                                List.of(ReimbursementStatus.INPROGRESS, ReimbursementStatus.PENDING))
                                .isPresent()) {
                        throw new HRMSException("SALARY_ADVANCE_ALREADY_EXISTS");
                }
                salaryAdvanceDTO.setStatus(LeaveStatus.PENDING);
                salaryAdvanceDTO.setFirstPayment(false);
                salaryAdvanceDTO.setSecondPayment(false);
                salaryAdvanceDTO.setThirdPayment(false);
                salaryAdvanceDTO.setReimbursement(ReimbursementStatus.PENDING);
                salaryAdvanceDTO.setCreationDate(LocalDateTime.now());
                Long id = salaryAdvanceRepository.save(salaryAdvanceDTO.toEntity()).getId();
                notificationService.sendNotification(new NotificationDTO(null, salaryAdvanceDTO.getApproverId(),
                                "Salary Advance Request",
                                "A new salary advance request has been submitted by " + salaryAdvanceDTO.getName(),
                                "/manage-advance/" + id, "SALARY_ADVANCE_REQUEST", LocalDateTime.now()));
                AccountDTO account = accountService.getAccountByEmpId(salaryAdvanceDTO.getEmpId());
                notificationService.sendNotification(new NotificationDTO(null, account.getId(),
                                "Salary Advance Request",
                                "Salary advance request has been submitted.",
                                "/salary-advance/" + id, "SALARY_ADVANCE_REQUEST", LocalDateTime.now()));
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "salaryAdvanceById", key = "#salaryAdvanceDTO.id", condition = "#salaryAdvanceDTO.id != null"),
                        @CacheEvict(cacheNames = { "salaryAdvancesByApprover", "salaryAdvancesByEmp" }, allEntries = true)
        })
        public void updateSalaryAdvance(SalaryAdvanceDTO salaryAdvanceDTO) throws HRMSException {
                SalaryAdvance salaryAdvance = salaryAdvanceRepository.findById(salaryAdvanceDTO.getId())
                                .orElseThrow(() -> new HRMSException("SALARY_ADVANCE_NOT_FOUND"));
                if (salaryAdvance.getApproverId() != salaryAdvanceDTO.getApproverId()) {
                        notificationService.sendNotification(new NotificationDTO(null, salaryAdvanceDTO.getApproverId(),
                                        "Salary Advance Request",
                                        "A new salary advance request has been submitted by " + salaryAdvance.getName(),
                                        "/manage-advance/" + salaryAdvance.getId(), "SALARY_ADVANCE_REQUEST",
                                        LocalDateTime.now()));
                }
                salaryAdvanceRepository.save(salaryAdvanceDTO.toEntity());
        }

        @Override
        @Cacheable(cacheNames = "salaryAdvanceById", key = "#id")
        public SalaryAdvanceDTO getSalaryAdvance(Long id) throws HRMSException {
                return salaryAdvanceRepository.findById(id)
                                .orElseThrow(() -> new HRMSException("SALARY_ADVANCE_NOT_FOUND"))
                                .toDTO();
        }

        @Override
        @Cacheable(cacheNames = "salaryAdvancesByApprover", key = "#approverId")
        public List<SalaryAdvanceDTO> getAllSalaryAdvancesByApproverId(Long approverId) {
                return salaryAdvanceRepository.findByApproverId(approverId).stream().map(SalaryAdvance::toDTO).toList();
        }

        @Override
        @Cacheable(cacheNames = "salaryAdvancesByEmp", key = "#empId")
        public List<SalaryAdvanceDTO> getSalaryAdvanceByEmpId(Long empId) {
                return salaryAdvanceRepository.findByEmpId(empId).stream().map(SalaryAdvance::toDTO).toList();

        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "salaryAdvanceById", key = "#salaryAdvanceDTO.id", condition = "#salaryAdvanceDTO.id != null"),
                        @CacheEvict(cacheNames = { "salaryAdvancesByApprover", "salaryAdvancesByEmp" }, allEntries = true)
        })
        public void approveSalaryAdvance(SalaryAdvanceDTO salaryAdvanceDTO) throws Exception {
                SalaryAdvance salaryAdvance = salaryAdvanceRepository.findById(salaryAdvanceDTO.getId())
                                .orElseThrow(() -> new HRMSException("SALARY_ADVANCE_NOT_FOUND"));
                salaryAdvance.setStatus(LeaveStatus.APPROVED);
                salaryAdvance.setReimbursement(ReimbursementStatus.INPROGRESS);
                salaryAdvance.setApproverComment(salaryAdvanceDTO.getApproverComment());
                salaryAdvanceRepository.save(salaryAdvance);

                AccountDTO account = accountService.getAccountByEmpId(salaryAdvanceDTO.getEmpId());
                notificationService.sendNotification(new NotificationDTO(null, account.getId(),
                                "Salary Advance Request Approved",
                                "Salary advance request has been approved.",
                                "/salary-advance/" + salaryAdvance.getId(), "SALARY_ADVANCE_REQUEST",
                                LocalDateTime.now()));
                sendEmail(account.getEmail(), "Salary Advance Request Approved",
                                Data.getSalaryAdvanceApprovedBody(account.getName(),
                                                salaryAdvance.getAmount().toString(),
                                                "hrinfo@roxgold.com",
                                                account.getCompany() != null ? account.getCompany().getName()
                                                                : "All Companies"));
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "salaryAdvanceById", key = "#salaryAdvanceDTO.id", condition = "#salaryAdvanceDTO.id != null"),
                        @CacheEvict(cacheNames = { "salaryAdvancesByApprover", "salaryAdvancesByEmp" }, allEntries = true)
        })
        public void rejectSalaryAdvance(SalaryAdvanceDTO salaryAdvanceDTO) throws Exception {
                SalaryAdvance salaryAdvance = salaryAdvanceRepository.findById(salaryAdvanceDTO.getId())
                                .orElseThrow(() -> new HRMSException("SALARY_ADVANCE_NOT_FOUND"));
                salaryAdvance.setStatus(LeaveStatus.DECLINED);
                salaryAdvance.setApproverComment(salaryAdvanceDTO.getApproverComment());
                salaryAdvance.setReimbursement(ReimbursementStatus.REJECTED);
                salaryAdvanceRepository.save(salaryAdvance);
                AccountDTO account = accountService.getAccountByEmpId(salaryAdvanceDTO.getEmpId());
                notificationService.sendNotification(new NotificationDTO(null, account.getId(),
                                "Salary Advance Request Declined",
                                "Salary advance request has been declined.",
                                "/salary-advance/" + salaryAdvance.getId(), "SALARY_ADVANCE_REQUEST",
                                LocalDateTime.now()));
                sendEmail(account.getEmail(), "Salary Advance Request Rejected",
                                Data.getSalaryAdvanceRejectedBody(account.getName(),
                                                "hrinfo@roxgold.com",
                                                account.getCompany() != null ? account.getCompany().getName()
                                                                : "All Companies"));
        }

        public void sendEmail(String email, String subject, String text) throws Exception {
                MimeMessage mm = mailSender.createMimeMessage();
                MimeMessageHelper message = new MimeMessageHelper(mm, true);
                message.setTo(email);
                message.setSubject(subject);
                message.setText(text, true);
                mailSender.send(mm);
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "salaryAdvanceById", key = "#salaryAdvanceDTO.id", condition = "#salaryAdvanceDTO.id != null"),
                        @CacheEvict(cacheNames = { "salaryAdvancesByApprover", "salaryAdvancesByEmp" }, allEntries = true)
        })
        public void completeReimbursement(SalaryAdvanceDTO salaryAdvanceDTO) throws Exception {
                SalaryAdvance salaryAdvance = salaryAdvanceRepository.findById(salaryAdvanceDTO.getId())
                                .orElseThrow(() -> new HRMSException("SALARY_ADVANCE_NOT_FOUND"));
                salaryAdvance.setReimbursement(ReimbursementStatus.COMPLETED);
                salaryAdvanceRepository.save(salaryAdvance);
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "salaryAdvanceById", key = "#salaryAdvanceDTO.id", condition = "#salaryAdvanceDTO.id != null"),
                        @CacheEvict(cacheNames = { "salaryAdvancesByApprover", "salaryAdvancesByEmp" }, allEntries = true)
        })
        public void firstPayment(SalaryAdvanceDTO salaryAdvanceDTO) throws Exception {
                SalaryAdvance salaryAdvance = salaryAdvanceRepository.findById(salaryAdvanceDTO.getId())
                                .orElseThrow(() -> new HRMSException("SALARY_ADVANCE_NOT_FOUND"));
                salaryAdvance.setFirstPayment(true);
                if (salaryAdvance.getRepaymentDuration().equals("1"))
                        salaryAdvance.setReimbursement(ReimbursementStatus.COMPLETED);
                salaryAdvanceRepository.save(salaryAdvance);
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "salaryAdvanceById", key = "#salaryAdvanceDTO.id", condition = "#salaryAdvanceDTO.id != null"),
                        @CacheEvict(cacheNames = { "salaryAdvancesByApprover", "salaryAdvancesByEmp" }, allEntries = true)
        })
        public void secondPayment(SalaryAdvanceDTO salaryAdvanceDTO) throws Exception {
                SalaryAdvance salaryAdvance = salaryAdvanceRepository.findById(salaryAdvanceDTO.getId())
                                .orElseThrow(() -> new HRMSException("SALARY_ADVANCE_NOT_FOUND"));
                salaryAdvance.setSecondPayment(true);
                if (salaryAdvance.getRepaymentDuration().equals("2"))
                        salaryAdvance.setReimbursement(ReimbursementStatus.COMPLETED);
                salaryAdvanceRepository.save(salaryAdvance);
        }

        @Override
        @Caching(evict = {
                        @CacheEvict(cacheNames = "salaryAdvanceById", key = "#salaryAdvanceDTO.id", condition = "#salaryAdvanceDTO.id != null"),
                        @CacheEvict(cacheNames = { "salaryAdvancesByApprover", "salaryAdvancesByEmp" }, allEntries = true)
        })
        public void thirdPayment(SalaryAdvanceDTO salaryAdvanceDTO) throws Exception {
                SalaryAdvance salaryAdvance = salaryAdvanceRepository.findById(salaryAdvanceDTO.getId())
                                .orElseThrow(() -> new HRMSException("SALARY_ADVANCE_NOT_FOUND"));
                salaryAdvance.setThirdPayment(true);
                salaryAdvance.setReimbursement(ReimbursementStatus.COMPLETED);
                salaryAdvanceRepository.save(salaryAdvance);
        }
}
