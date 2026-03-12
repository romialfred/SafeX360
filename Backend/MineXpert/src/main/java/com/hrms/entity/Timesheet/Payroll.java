package com.hrms.entity.Timesheet;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.hrms.dto.Timesheet.PayrollDTO;
import com.hrms.entity.Employee;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Payroll {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String matricule;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    private String code;
    private Integer hours;
    private LocalDate paymentMonth;
    private LocalDate monthStartDate;
    private LocalDate monthEndDate;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transferred_by")
    private Employee transferredBy;
    private LocalDateTime transferredAt;

    public PayrollDTO toDTO() {
        return new PayrollDTO(this.id, this.matricule, this.employee.getId(),
                this.team != null ? this.team.getId() : null, this.code, this.hours,
                this.paymentMonth, this.monthStartDate, this.monthEndDate, this.transferredBy.getId(),
                this.transferredAt);
    }
}
