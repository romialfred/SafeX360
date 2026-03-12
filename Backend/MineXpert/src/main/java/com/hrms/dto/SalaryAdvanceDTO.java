package com.hrms.dto;

import java.time.LocalDateTime;

import com.hrms.entity.SalaryAdvance;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class SalaryAdvanceDTO {
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
    private LeaveStatus status;
    private ReimbursementStatus reimbursement;

    public SalaryAdvance toEntity() {
        return new SalaryAdvance(this.id, this.name, this.empId, this.amount, this.amountInWords, this.reason,
                this.method, this.bankName, this.accountNumber, this.repaymentDuration,
                this.comments, this.approverName, this.approverId, this.approverComment, this.creationDate, this.first,
                this.second, this.third,
                this.firstPayment, this.secondPayment, this.thirdPayment,
                this.requestedBy, this.status, this.reimbursement);
    }
}
