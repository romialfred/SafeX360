package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.CheckListDTO;
import com.minexpert.hns.dto.response.CheckListDetails;
import com.minexpert.hns.exception.HSException;

public interface CheckListService {
    public Long addCheckList(Long companyId, CheckListDTO checkListDTO) throws HSException;

    public void updateCheckList(Long companyId, CheckListDTO checkListDTO) throws HSException;

    public void deleteCheckList(Long companyId, Long id) throws HSException;

    public CheckListDTO getCheckListById(Long companyId, Long id) throws HSException;

    public List<CheckListDetails> getAllCheckLists(Long companyId) throws HSException;

    public List<CheckListDetails> getAllActiveCheckLists(Long companyId) throws HSException;

    public void activateCheckList(Long companyId, Long id) throws HSException;

    public void deactivateCheckList(Long companyId, Long id) throws HSException;
}
