package com.hrms.dto.Timesheet;

import com.hrms.dto.Status;
import com.hrms.entity.Timesheet.Constraints;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConstraintsDTO {
    private String flag;
    private Status status;

    public Constraints toEntity() {
        return new Constraints(this.flag, this.status);
    }
}
