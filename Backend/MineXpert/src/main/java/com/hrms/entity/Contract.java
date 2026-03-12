package com.hrms.entity;

import java.time.LocalDate;

import com.hrms.dto.ContractDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Contract {
     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
     @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;
    private String contractStatus;
    private LocalDate effectiveDate;
    private String statusComments;
    private Long proposedBy;
    private LocalDate proposeDate;
    private String proposerReason;
    private Long hrManager;
    private LocalDate hrDecisionDate;
    private String hrDecision;

    
    public ContractDTO toDTO(){
        return new ContractDTO(this.id, this.employee!=null?this.employee.toDTO():null, this.contractStatus, this.effectiveDate, this.statusComments, this.proposedBy, this.proposeDate, this.proposerReason, this.hrManager, this.hrDecisionDate, this.hrDecision);
    }
    

}
