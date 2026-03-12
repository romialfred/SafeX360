package com.hrms.entity.Timesheet;

import com.hrms.dto.Status;
import com.hrms.dto.Timesheet.ConstraintsDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Constraints {

    @Id
    private String flag;
    private Status status;

    public ConstraintsDTO toDTO() {
        return new ConstraintsDTO(this.flag, this.status);
    }
}
