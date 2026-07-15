package com.minexpert.hns.service.inspections;

import java.util.List;

import com.minexpert.hns.dto.GeneralInspectionDTO;
import com.minexpert.hns.dto.response.GeneralInspectionDetails;
import com.minexpert.hns.dto.response.GeneralInspectionResponse;
import com.minexpert.hns.dto.response.InspectionInfo;
import com.minexpert.hns.dto.response.LastInspectionDTO;
import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.exception.HSException;

public interface GeneralInspectionService {

    public void createGeneralInspection(GeneralInspectionDTO generalInspectionDTO) throws HSException;

    public void updateGeneralInspection(GeneralInspectionDTO generalInspectionDTO, Long companyId) throws HSException;

    public List<GeneralInspectionResponse> getAllInspections(Long companyId) throws HSException;

    public GeneralInspectionDetails getInspectionDetailsById(Long id, Long companyId) throws HSException;

    public InspectionInfo getInspectionInfoById(Long id, Long companyId) throws HSException;

    public void updateInspectionStatus(Long id, InspectionStatus status) throws HSException;

    /**
     * Dernière inspection connue pour une cible (type + targetRefId), scopée
     * mine. Retourne {@code null} si aucune. {@code targetType} accepte les
     * valeurs EQUIPMENT / LOCATION / PROCEDURE (insensible à la casse).
     */
    public LastInspectionDTO getLastInspection(String targetType, Long targetRefId, Long companyId)
            throws HSException;
}
