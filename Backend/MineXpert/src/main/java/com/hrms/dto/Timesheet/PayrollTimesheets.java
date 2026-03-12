package com.hrms.dto.Timesheet;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PayrollTimesheets {
    List<PayrollDTO> payrolls;
    List<Long> timesheets;
}
