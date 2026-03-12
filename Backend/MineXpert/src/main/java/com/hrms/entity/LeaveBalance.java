package com.hrms.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.hrms.dto.LeaveBalanceDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class LeaveBalance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Temporal(TemporalType.DATE)
    private LocalDate asOfDate;
    private String empNumber;
    private Long payrollBasic;
    private Integer daysSinceLastLeave;
    private Float officialLeaveBalance;
    private Float seniorityLeaveBalance;
    private Float totalLeaveBalance;
    private Float leaveProvision;
    private Float impotISRate;
    private Float familyPrestationRate;
    private Long accidentRiskAmount;
    private Long retirement;
    private LocalDateTime loadDate;

    public LeaveBalanceDTO toDTO(){
        return new LeaveBalanceDTO(this.id, this.asOfDate, this.empNumber, this.payrollBasic, this.daysSinceLastLeave, this.officialLeaveBalance, this.seniorityLeaveBalance, this.totalLeaveBalance, this.leaveProvision, this.impotISRate, this.familyPrestationRate, this.accidentRiskAmount, this.retirement, this.loadDate);
    }


}
