package com.minexpert.hns.dto.ppe;

import java.time.LocalDateTime;
import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PpeDTO {
    private Long id;
    @NotBlank(message = "name is required")
    @Size(max = 255, message = "name must not exceed 255 characters")
    private String name;
    @NotBlank(message = "category is required")
    private String category;
    @Size(max = 2000, message = "description must not exceed 2000 characters")
    private String description;
    @Min(value = 0, message = "minStock must be >= 0")
    private Integer minStock;
    @Min(value = 0, message = "stock must be >= 0")
    private Integer stock;
    private String certificationStandard;
    private PpeStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Ppe toEntity() {
        return new Ppe(id, name, category, description, minStock, stock, certificationStandard, status, createdAt,
                updatedAt);
    }

}
