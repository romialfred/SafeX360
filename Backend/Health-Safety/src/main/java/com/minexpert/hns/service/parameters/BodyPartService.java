package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.BodyPartDTO;
import com.minexpert.hns.exception.HSException;

public interface BodyPartService {

    public Long addBodyPart(BodyPartDTO bodyPartDTO) throws HSException;

    public void updateBodyPart(BodyPartDTO bodyPartDTO) throws HSException;

    public void deleteBodyPart(Long id);

    public BodyPartDTO getBodyPartById(Long id) throws HSException;

    public List<BodyPartDTO> getAllBodyParts() throws HSException;

    public List<BodyPartDTO> getAllActiveBodyParts() throws HSException;

    public void activateBodyPart(Long id) throws HSException;

    public void deactivateBodyPart(Long id) throws HSException;
}
