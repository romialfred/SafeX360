package com.hrms.entity;

import java.time.LocalDateTime;

import com.hrms.dto.LeaveStatus;
import com.hrms.dto.ReimbursementStatus;
import com.hrms.dto.SalaryAdvanceDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class SalaryAdvance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Long empId;
    private Long amount;
    private String amountInWords;
    private String reason;
    private String method;
    private String bankName;
    private String accountNumber;
    private String repaymentDuration;
    private String comments;
    private String approverName;
    private Long approverId;
    private String approverComment;
    private LocalDateTime creationDate;
    private Long first;
    private Long second;
    private Long third;
    private Boolean firstPayment;
    private Boolean secondPayment;
    private Boolean thirdPayment;
    private Long requestedBy;
    @Enumerated(EnumType.STRING)
    private LeaveStatus status;
    @Enumerated(EnumType.STRING)
    private ReimbursementStatus reimbursement;

    public SalaryAdvanceDTO toDTO() {
        return new SalaryAdvanceDTO(this.id, this.name, this.empId, this.amount, this.amountInWords, this.reason,
                this.method, this.bankName, this.accountNumber, this.repaymentDuration,
                this.comments, this.approverName, this.approverId, this.approverComment, this.creationDate, this.first,
                this.second, this.third,
                this.firstPayment, this.secondPayment, this.thirdPayment,
                this.requestedBy, this.status, this.reimbursement);
    }
}
