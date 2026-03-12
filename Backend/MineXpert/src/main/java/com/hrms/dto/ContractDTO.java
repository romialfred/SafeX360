package com.hrms.dto;

import java.time.LocalDate;

import com.hrms.entity.Contract;
import com.hrms.entity.Employee;

import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContractDTO {
     private Long id;
    private EmployeeDTO employee;
    private String contractStatus;
    private LocalDate effectiveDate;
    private String statusComments;
    private Long proposedBy;
    private LocalDate proposeDate;
    private String proposerReason;
    private Long hrManager;
    private LocalDate hrDecisionDate;
    private String hrDecision;

    public Contract toEntity(){
        return new Contract(this.id, this.employee!=null?this.employee.toEntity():null, this.contractStatus, this.effectiveDate, this.statusComments, this.proposedBy, this.proposeDate, this.proposerReason, this.hrManager, this.hrDecisionDate, this.hrDecision);
    }
}
