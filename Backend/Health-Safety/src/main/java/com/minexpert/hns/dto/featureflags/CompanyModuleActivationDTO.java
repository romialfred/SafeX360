package com.minexpert.hns.dto.featureflags;

import com.minexpert.hns.entity.featureflags.CompanyModuleActivation;
import com.minexpert.hns.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Etat d'activation d'un module pour une mine. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyModuleActivationDTO {
    private Long companyId;
    private String module;
    private Status status;

    public static CompanyModuleActivationDTO of(Long companyId, String module, Status status) {
        return new CompanyModuleActivationDTO(companyId, module, status);
    }

    public static CompanyModuleActivationDTO fromEntity(CompanyModuleActivation e) {
        return new CompanyModuleActivationDTO(e.getCompanyId(), e.getModule(), e.getStatus());
    }
}
