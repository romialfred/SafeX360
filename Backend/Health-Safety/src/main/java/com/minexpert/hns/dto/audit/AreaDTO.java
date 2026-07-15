package com.minexpert.hns.dto.audit;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.audit.Area;
import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.parameters.AuditAreas;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AreaDTO {
    private Long id;
    private Long auditId;
    private Long auditAreaId;
    private String purpose;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Cloisonnement par mine : hérité de l'audit de rattachement. */
    private Long companyId;

    public Area toEntity() {
        return new Area(this.id, new Audit(auditId), new AuditAreas(auditAreaId), this.purpose, this.createdAt,
                this.updatedAt, this.companyId);
    }
}
