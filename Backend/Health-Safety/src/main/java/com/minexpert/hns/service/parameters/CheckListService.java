package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.CheckListDTO;
import com.minexpert.hns.dto.response.CheckListDetails;
import com.minexpert.hns.exception.HSException;

public interface CheckListService {
    public Long addCheckList(CheckListDTO checkListDTO) throws HSException;

    public void updateCheckList(CheckListDTO checkListDTO) throws HSException;

    public void deleteCheckList(Long id);

    public CheckListDTO getCheckListById(Long id) throws HSException;

    public List<CheckListDetails> getAllCheckLists() throws HSException;

    public List<CheckListDetails> getAllActiveCheckLists() throws HSException;

    public void activateCheckList(Long id) throws HSException;

    public void deactivateCheckList(Long id) throws HSException;
}
