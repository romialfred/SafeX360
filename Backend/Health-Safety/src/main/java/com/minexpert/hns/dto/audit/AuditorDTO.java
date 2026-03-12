package com.minexpert.hns.dto.audit;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.audit.Auditor;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditorDTO {
    private Long id;
    private String name;
    private String role;
    private String email;
    private String company;
    private String companyEmail;
    private Long auditId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Auditor toEntity() {
        return new Auditor(this.id, this.name, this.role, this.email, this.company, this.companyEmail,
                new Audit(this.auditId),
                this.createdAt,
                this.updatedAt);
    }
}
