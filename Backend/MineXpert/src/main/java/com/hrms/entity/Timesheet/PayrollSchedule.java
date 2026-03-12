package com.hrms.entity.Timesheet;

import java.time.LocalDate;

import com.hrms.dto.Timesheet.PayrollScheduleDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PayrollSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDate month;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate deadline;
    private LocalDate paymentDate;

    public PayrollScheduleDTO toDTO() {

        return new PayrollScheduleDTO(this.id, this.month, this.startDate, this.endDate, this.deadline,
                this.paymentDate);
    }
}
