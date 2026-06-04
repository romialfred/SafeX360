package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.BodyPartDTO;
import com.minexpert.hns.exception.HSException;

public interface BodyPartService {

    public Long addBodyPart(Long companyId, BodyPartDTO bodyPartDTO) throws HSException;

    public void updateBodyPart(Long companyId, BodyPartDTO bodyPartDTO) throws HSException;

    public void deleteBodyPart(Long companyId, Long id) throws HSException;

    public BodyPartDTO getBodyPartById(Long companyId, Long id) throws HSException;

    public List<BodyPartDTO> getAllBodyParts(Long companyId) throws HSException;

    public List<BodyPartDTO> getAllActiveBodyParts(Long companyId) throws HSException;

    public void activateBodyPart(Long companyId, Long id) throws HSException;

    public void deactivateBodyPart(Long companyId, Long id) throws HSException;
}
