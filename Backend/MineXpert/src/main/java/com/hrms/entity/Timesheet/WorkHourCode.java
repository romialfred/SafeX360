package com.hrms.entity.Timesheet;

import com.hrms.dto.Timesheet.WorkHourCodeDTO;
import com.hrms.enums.CodeStatus;
import com.hrms.enums.CodeType;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkHourCode {
    @Id
    private String code;
    private String payrollCode;
    private String name;
    private Integer rate;
    private String color;
    @Enumerated(EnumType.STRING)
    private CodeType type;
    @Enumerated(EnumType.STRING)
    private CodeStatus status;

    public WorkHourCodeDTO toDTO() {
        return new WorkHourCodeDTO(this.code, this.payrollCode, this.name, this.rate, this.color, this.type,
                this.status);
    }
}
