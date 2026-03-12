package com.hrms.service;

import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.hrms.dto.AccountDTO;
import com.hrms.dto.LeaveDTO;
import com.hrms.dto.LeaveStatus;
import com.hrms.entity.Account;
import com.hrms.entity.Employee;
import com.hrms.entity.Leave;
import com.hrms.entity.LeaveSetting;
import com.hrms.exception.HRMSException;
import com.hrms.repository.AccountRepository;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.LeaveRepository;
import com.hrms.repository.LeaveSettingRepository;
import com.hrms.utility.Data;
import com.hrms.utility.PdfUtils;

import jakarta.mail.internet.MimeMessage;

@Service
public class LeaveServiceImpl implements LeaveService {

    @Autowired
    private LeaveRepository leaveRepository;
    @Autowired 
    private EmployeeRepository employeeRepository;
    @Autowired 
    private  AccountRepository accountRepository;
    @Autowired
    private LeaveSettingRepository leaveSettingRepository;

      DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d MMMM yyyy");


    	@Autowired
	private JavaMailSender mailSender;

    @Override
    public Long addLeave(LeaveDTO leaveDTO) throws HRMSException {
        if(leaveRepository.existsLeaveInRange(leaveDTO.getEmpId(), leaveDTO.getStartDate(), leaveDTO.getEndDate()))throw new HRMSException("LEAVE_ALREADY_EXISTS");
        return leaveRepository.save(leaveDTO.toEntity()).getId();
    }

    @Override
    public LeaveDTO getLeave(Long id) throws HRMSException {
        return leaveRepository.findById(id).orElseThrow(()->new HRMSException("LEAVE_NOT_FOUND")).toDTO();
    }

    @Override
    public void updateLeave(LeaveDTO leaveDTO) throws Exception {
        leaveRepository.save(leaveDTO.toEntity());
        Employee emp=employeeRepository.findById(leaveDTO.getEmpId()).get();
        Account approver=accountRepository.findById(leaveDTO.getApproverId()).get();
        LeaveSetting leaveSetting=leaveSettingRepository.findById(leaveDTO.getType()).get();
        if(leaveDTO.getStatus().equals(LeaveStatus.APPROVED)) {
            String text=Data.getLeaveApprovalMessage(emp.getFirstName()+" "+emp.getFamilyName(), leaveSetting.getName(), leaveDTO.getStartDate().format(formatter), leaveDTO.getEndDate().format(formatter), approver.getEmployee()!=null?approver.getEmployee().getFirstName()+" "+approver.getEmployee().getFamilyName():approver.getName(), approver.getRole(), approver.getCompany()!=null?approver.getCompany().getName():"All Companies",approver.getEmployee()!=null?approver.getEmployee().getProfessionalPhone() :"", leaveDTO.getApproverComment());
            byte[] document=PdfUtils.generatePdfFromHtml(text);
            sendEmail(emp.getProfessionalEmail(), "Leave Request Approved", text, document);
        }else if(leaveDTO.getStatus().equals(LeaveStatus.DECLINED)){
            String text=Data.getLeaveRejectionMessage(emp.getFirstName()+" "+emp.getFamilyName(), leaveSetting.getName(), leaveDTO.getStartDate().format(formatter), leaveDTO.getEndDate().format(formatter), approver.getEmployee()!=null?approver.getEmployee().getFirstName()+" "+approver.getEmployee().getFamilyName():approver.getName(), approver.getRole(), approver.getCompany()!=null?approver.getCompany().getName():"All Companies",approver.getEmployee()!=null?approver.getEmployee().getProfessionalPhone() :"", leaveDTO.getApproverComment());
            byte[] document=PdfUtils.generatePdfFromHtml(text);
            sendEmail(emp.getProfessionalEmail(), "Leave Request Rejected", text, document);
        }
    }
    public Boolean sendEmail(String to, String subject, String text , byte[] pdfContent) throws Exception {
		MimeMessage mm = mailSender.createMimeMessage();
		MimeMessageHelper message = new MimeMessageHelper(mm, true);
		message.setTo(to);
		message.setSubject(subject);
		message.setText(text, true);
         ByteArrayResource pdfAttachment = new ByteArrayResource(pdfContent);
        message.addAttachment("Leave_Details.pdf", pdfAttachment);
		mailSender.send(mm);
		return true;
	} 
    @Override
    public List<LeaveDTO> getAllLeaves() {
       return ((List<Leave>)leaveRepository.findAll()).stream().map((leave)->leave.toDTO()).toList();
    }
    @Override
    public List<LeaveDTO> getAllLeavesByEmpId(Long empId) {
       return ((List<Leave>)leaveRepository.findByEmpId(empId)).stream().map((leave)->leave.toDTO()).toList();
    }
    @Override
    public List<LeaveDTO> getAllLeavesByApproverId(Long empId) {
       return ((List<Leave>)leaveRepository.findByApproverId(empId)).stream().map((leave)->leave.toDTO()).toList();
    }

    @Override
    public void deleteLeave(Long id) throws HRMSException {
        leaveRepository.deleteById(id);
    }

    @Override
    public LeaveDTO getNextLeave(Long empId) throws HRMSException {
        return leaveRepository.findUpcomingLeaves(empId).stream().findFirst().orElseThrow(()->new HRMSException("NO_NEXT_LEAVES")).toDTO();
    }

    @Override
    public List<Object[]>getLeaveDaysByType(Long empId){
        return leaveRepository.findTotalLeaveDaysGroupedByTypeAndEmpId(empId,LeaveStatus.APPROVED);
    }

    @Override
    public List<Object[]> getLeaveSummary(Long departmentId) {
        return leaveRepository.getLeaveSummary(departmentId, LeaveStatus.APPROVED);
    }
    @Override
    public List<Object[]> getLeaveSummaryByStatus(Long departmentId) {
        return leaveRepository.getLeaveSummaryByStatus(departmentId);
    }
    @Override
    public Long getAbsentCount(Long departmentId) {
        return leaveRepository.getEmployeeCountAbsentTodayInDepartment(LeaveStatus.APPROVED, departmentId);
    }

    @Override
    public Long getLeaveCountForEmployee(Long empId) {
       return leaveRepository.getTotalLeavesForCurrentYear(empId);
    }

    @Override
    public Long getPendingLeaveCountForEmployee(Long empId) {
        return leaveRepository.countPendingRequests(empId);
    }
  
}
