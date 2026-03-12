package com.hrms.dto.Timesheet;

import com.hrms.entity.Timesheet.WorkHourCode;
import com.hrms.enums.CodeStatus;
import com.hrms.enums.CodeType;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkHourCodeDTO {
    @Id
    private String code;
    private String payrollCode;
    private String name;
    private Integer rate;
    private String color;

    private CodeType type;
    private CodeStatus status;

    public WorkHourCode toEntity() {
        return new WorkHourCode(this.code, this.payrollCode, this.name, this.rate, this.color, this.type, this.status);
    }
}
