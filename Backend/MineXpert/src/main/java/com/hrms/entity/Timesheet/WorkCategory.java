package com.hrms.entity.Timesheet;

import com.hrms.dto.Timesheet.WorkCategoryDTO;
import com.hrms.entity.Company;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = "company_id"))
public class WorkCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", unique = true, nullable = false)
    private Company company;
    private String categories;

    public WorkCategoryDTO toDTO() {
        return new WorkCategoryDTO(this.id, this.company != null ? this.company.toDTO() : null, this.categories);
    }

}
