package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.parameters.CheckListDTO;
import com.minexpert.hns.dto.response.CheckListDetails;
import com.minexpert.hns.entity.parameters.CheckList;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.CheckListRepository;

@Service
public class CheckListServiceImpl implements CheckListService {

    @Autowired
    private CheckListRepository checkListRepository;

    @Override
    public Long addCheckList(CheckListDTO checkListDTO) throws HSException {
        Optional<CheckList> optional = checkListRepository.findByNameIgnoreCase(checkListDTO.getName());
        if (optional.isPresent()) {
            throw new HSException("CHECK_LIST_ALREADY_EXISTS");
        }
        checkListDTO.setStatus(Status.ACTIVE);
        checkListDTO.setCreatedAt(LocalDateTime.now());
        checkListDTO.setUpdatedAt(LocalDateTime.now());
        CheckList savedCheckList = checkListRepository.save(checkListDTO.toEntity());

        return savedCheckList.getId();
    }

    @Override
    public void updateCheckList(CheckListDTO checkListDTO) throws HSException {
        CheckList existingCheckList = checkListRepository.findById(checkListDTO.getId())
                .orElseThrow(() -> new HSException("CHECK_LIST_NOT_FOUND"));
        if (!existingCheckList.getName().equalsIgnoreCase(checkListDTO.getName())) {
            Optional<CheckList> optional = checkListRepository.findByNameIgnoreCase(checkListDTO.getName());
            if (optional.isPresent()) {
                throw new HSException("CHECK_LIST_ALREADY_EXISTS");
            }
        }
        existingCheckList.setName(checkListDTO.getName());
        existingCheckList.setDescription(checkListDTO.getDescription());
        existingCheckList.setUpdatedAt(LocalDateTime.now());
        checkListRepository.save(existingCheckList);
    }

    @Override
    public void deleteCheckList(Long id) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'deleteCheckList'");
    }

    @Override
    public CheckListDTO getCheckListById(Long id) throws HSException {
        return checkListRepository.findById(id).map(CheckList::toDTO)
                .orElseThrow(() -> new HSException("CHECK_LIST_NOT_FOUND"));
    }

    @Override
    public void activateCheckList(Long id) throws HSException {
        CheckList existingCheckList = checkListRepository.findById(id)
                .orElseThrow(() -> new HSException("CHECK_LIST_NOT_FOUND"));
        existingCheckList.setStatus(Status.ACTIVE);
        existingCheckList.setUpdatedAt(LocalDateTime.now());
        checkListRepository.save(existingCheckList);
    }

    @Override
    public void deactivateCheckList(Long id) throws HSException {
        CheckList existingCheckList = checkListRepository.findById(id)
                .orElseThrow(() -> new HSException("CHECK_LIST_NOT_FOUND"));
        existingCheckList.setStatus(Status.INACTIVE);
        existingCheckList.setUpdatedAt(LocalDateTime.now());
        checkListRepository.save(existingCheckList);
    }

    @Override
    public List<CheckListDetails> getAllCheckLists() throws HSException {
        return checkListRepository.findAllWithName();
    }

    @Override
    public List<CheckListDetails> getAllActiveCheckLists() throws HSException {
        return checkListRepository.findAllActiveTypes();
    }

}
