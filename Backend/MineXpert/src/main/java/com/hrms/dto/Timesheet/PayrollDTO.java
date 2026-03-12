package com.hrms.dto.Timesheet;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.hrms.entity.Employee;
import com.hrms.entity.Timesheet.Payroll;
import com.hrms.entity.Timesheet.Team;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PayrollDTO {
    private Long id;
    private String matricule;
    private Long employeeId;
    private Long teamId;
    private String code;
    private Integer hours;
    private LocalDate paymentMonth;
    private LocalDate monthStartDate;
    private LocalDate monthEndDate;
    private Long transferredBy;
    private LocalDateTime transferredAt;

    public Payroll toEntity() {
        return new Payroll(this.id, this.matricule, new Employee(this.employeeId), new Team(teamId), this.code,
                this.hours,
                this.paymentMonth,
                this.monthStartDate, this.monthEndDate, new Employee(this.transferredBy), this.transferredAt);
    }
}
