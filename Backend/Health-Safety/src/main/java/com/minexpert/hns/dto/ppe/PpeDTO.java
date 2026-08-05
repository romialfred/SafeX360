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

    // Incrément 3 — caractéristiques techniques et commerciales.
    private String brand;
    private String manufacturer;
    private String model;
    private String size;
    private String unitOfMeasure;
    private String protectionBodyPart;
    @Min(value = 0, message = "lifespanMonths must be >= 0")
    private Integer lifespanMonths;
    private Boolean reusable;
    private Boolean mandatory;
    @Min(value = 0, message = "referencePrice must be >= 0")
    private Double referencePrice;
    private String currency;
    private String preferredSupplier;
    private String supplierReference;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long companyId;

    public Ppe toEntity() {
        // Builder : plus de constructeur positionnel (fin du piège d'arité Lombok).
        // La version (@Version) est laissée à Hibernate. `stock` n'est pas repris ici
        // volontairement : il est piloté par le journal de mouvements (incrément 1),
        // jamais fixé depuis un DTO de création/édition.
        return Ppe.builder()
                .id(id).name(name).category(category).description(description)
                .minStock(minStock).certificationStandard(certificationStandard).status(status)
                .brand(brand).manufacturer(manufacturer).model(model).size(size)
                .unitOfMeasure(unitOfMeasure).protectionBodyPart(protectionBodyPart)
                .lifespanMonths(lifespanMonths).reusable(reusable).mandatory(mandatory)
                .referencePrice(referencePrice).currency(currency)
                .preferredSupplier(preferredSupplier).supplierReference(supplierReference)
                .createdAt(createdAt).updatedAt(updatedAt).companyId(companyId)
                .build();
    }

}
