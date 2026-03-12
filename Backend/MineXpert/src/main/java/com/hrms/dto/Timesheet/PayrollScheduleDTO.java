package com.hrms.dto.Timesheet;

import java.time.LocalDate;

import com.hrms.entity.Timesheet.PayrollSchedule;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PayrollScheduleDTO {
    private Long id;
    private LocalDate month;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate deadline;
    private LocalDate paymentDate;

    public PayrollSchedule toEntity() {
        return new PayrollSchedule(this.id, this.month, this.startDate, this.endDate, this.deadline,
                this.paymentDate);
    }
}
