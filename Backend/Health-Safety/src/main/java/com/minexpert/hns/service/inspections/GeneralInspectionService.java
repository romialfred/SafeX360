package com.minexpert.hns.service.inspections;

import java.util.List;

import com.minexpert.hns.dto.GeneralInspectionDTO;
import com.minexpert.hns.dto.response.GeneralInspectionDetails;
import com.minexpert.hns.dto.response.GeneralInspectionResponse;
import com.minexpert.hns.dto.response.InspectionInfo;
import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.exception.HSException;

public interface GeneralInspectionService {

    public void createGeneralInspection(GeneralInspectionDTO generalInspectionDTO) throws HSException;

    public void updateGeneralInspection(GeneralInspectionDTO generalInspectionDTO) throws HSException;

    public List<GeneralInspectionResponse> getAllInspections() throws HSException;

    public GeneralInspectionDetails getInspectionDetailsById(Long id) throws HSException;

    public InspectionInfo getInspectionInfoById(Long id) throws HSException;

    public void updateInspectionStatus(Long id, InspectionStatus status) throws HSException;
}
