package com.hrms.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.hrms.entity.LeaveBalance;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LeaveBalanceDTO {
    private Long id;
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

    public LeaveBalance toEntity(){
        return new LeaveBalance(this.id, this.asOfDate, this.empNumber, this.payrollBasic, this.daysSinceLastLeave, this.officialLeaveBalance, this.seniorityLeaveBalance, this.totalLeaveBalance, this.leaveProvision, this.impotISRate, this.familyPrestationRate, this.accidentRiskAmount, this.retirement, this.loadDate);
    }
}
