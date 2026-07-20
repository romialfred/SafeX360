package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.parameters.CheckListDTO;
import com.minexpert.hns.dto.response.CheckListDetails;
import com.minexpert.hns.entity.parameters.CheckList;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.CheckListRepository;

@Service
@Transactional
public class CheckListServiceImpl implements CheckListService {

    @Autowired
    private CheckListRepository checkListRepository;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    /**
     * Mine effective pour une opération sur une entité EXISTANTE (update / activate /
     * deactivate / delete). Le paramètre {@code companyId} prime s'il désigne une mine
     * précise (utilisateur cloisonné, clampé par la gateway) ; sinon (admin « Toutes les
     * Mines » en vue consolidée) on DÉRIVE la mine de l'entité. Un utilisateur cloisonné
     * ne peut jamais toucher l'entité d'une autre mine (contrôle de propriété conservé).
     */
    private Long resolveOwningCompany(Long companyId, CheckList existing) throws HSException {
        Long effective = (companyId != null && companyId > 0) ? companyId : existing.getCompanyId();
        if (effective == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        if (!effective.equals(existing.getCompanyId())) {
            throw new HSException("CHECK_LIST_NOT_FOUND");
        }
        return effective;
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "checkListsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "checkListsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public Long addCheckList(Long companyId, CheckListDTO checkListDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<CheckList> optional = checkListRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                checkListDTO.getName());
        if (optional.isPresent()) {
            throw new HSException("CHECK_LIST_ALREADY_EXISTS");
        }
        checkListDTO.setStatus(Status.ACTIVE);
        checkListDTO.setCompanyId(companyId);
        checkListDTO.setCreatedAt(LocalDateTime.now());
        checkListDTO.setUpdatedAt(LocalDateTime.now());
        CheckList savedCheckList = checkListRepository.save(checkListDTO.toEntity());

        return savedCheckList.getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "checkListById", key = "#companyId != null ? (#companyId + '-' + #checkListDTO.id) : 'ALL-' + #checkListDTO.id", condition = "#checkListDTO.id != null"),
            @CacheEvict(cacheNames = "checkListsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "checkListsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void updateCheckList(Long companyId, CheckListDTO checkListDTO) throws HSException {
        CheckList existingCheckList = checkListRepository.findById(checkListDTO.getId())
                .orElseThrow(() -> new HSException("CHECK_LIST_NOT_FOUND"));
        companyId = resolveOwningCompany(companyId, existingCheckList);
        if (!existingCheckList.getName().equalsIgnoreCase(checkListDTO.getName())) {
            Optional<CheckList> optional = checkListRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                    checkListDTO.getName());
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
    @Caching(evict = {
            @CacheEvict(cacheNames = "checkListById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "checkListsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "checkListsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deleteCheckList(Long companyId, Long id) throws HSException {
        CheckList checkList = checkListRepository.findById(id)
                .orElseThrow(() -> new HSException("CHECK_LIST_NOT_FOUND"));
        companyId = resolveOwningCompany(companyId, checkList);
        checkListRepository.delete(checkList);
    }

    @Override
    @Cacheable(cacheNames = "checkListById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public CheckListDTO getCheckListById(Long companyId, Long id) throws HSException {
        CheckList checkList = checkListRepository.findById(id)
                .orElseThrow(() -> new HSException("CHECK_LIST_NOT_FOUND"));
        if (companyId != null && !companyId.equals(checkList.getCompanyId())) {
            throw new HSException("CHECK_LIST_NOT_FOUND");
        }
        return checkList.toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "checkListById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "checkListsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "checkListsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void activateCheckList(Long companyId, Long id) throws HSException {
        CheckList existingCheckList = checkListRepository.findById(id)
                .orElseThrow(() -> new HSException("CHECK_LIST_NOT_FOUND"));
        companyId = resolveOwningCompany(companyId, existingCheckList);
        existingCheckList.setStatus(Status.ACTIVE);
        existingCheckList.setUpdatedAt(LocalDateTime.now());
        checkListRepository.save(existingCheckList);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "checkListById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "checkListsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "checkListsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deactivateCheckList(Long companyId, Long id) throws HSException {
        CheckList existingCheckList = checkListRepository.findById(id)
                .orElseThrow(() -> new HSException("CHECK_LIST_NOT_FOUND"));
        companyId = resolveOwningCompany(companyId, existingCheckList);
        existingCheckList.setStatus(Status.INACTIVE);
        existingCheckList.setUpdatedAt(LocalDateTime.now());
        checkListRepository.save(existingCheckList);
    }

    @Override
    @Cacheable(cacheNames = "checkListsAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<CheckListDetails> getAllCheckLists(Long companyId) throws HSException {
        return checkListRepository.findAllWithName(companyId);
    }

    @Override
    @Cacheable(cacheNames = "checkListsActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<CheckListDetails> getAllActiveCheckLists(Long companyId) throws HSException {
        return checkListRepository.findAllByStatus(companyId, Status.ACTIVE);
    }

}
