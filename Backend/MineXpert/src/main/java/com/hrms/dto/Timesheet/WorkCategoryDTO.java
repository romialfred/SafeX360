package com.hrms.dto.Timesheet;

import com.hrms.dto.CompanyDTO;
import com.hrms.entity.Timesheet.WorkCategory;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkCategoryDTO {
    private Long id;
    private CompanyDTO company;
    private String categories;

    public WorkCategory toEntity() {
        return new WorkCategory(this.id, this.company != null ? this.company.toEntity() : null, this.categories);
    }
}
