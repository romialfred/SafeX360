package com.minexpert.hns.dto.audit;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.audit.Contributor;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContributorDTO {
    private Long id;
    private String name;
    private String role;
    private String section;
    private Long auditId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Contributor toEntity() {
        return new Contributor(this.id, this.name, this.role, this.section, new Audit(auditId), this.createdAt,
                this.updatedAt);
    }
}
