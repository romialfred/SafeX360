package com.hrms.service.Timesheet;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.hrms.dto.Status;
import com.hrms.dto.Timesheet.ConstraintsDTO;
import com.hrms.entity.Timesheet.Constraints;
import com.hrms.exception.HRMSException;
import com.hrms.repository.Timesheet.ConstraintsRepository;

@Service
public class ConstraintsServiceImpl implements ConstraintsService {

    @Autowired
    private ConstraintsRepository constraintsRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "constraintByFlag", key = "#flag"),
            @CacheEvict(cacheNames = "constraintsAll", allEntries = true),
            @CacheEvict(cacheNames = "constraintActiveStatus", key = "#flag")
    })
    public void addFlag(String flag) throws HRMSException {
        Optional<Constraints> constraints = constraintsRepository.findById(flag);
        if (constraints.isPresent()) {
            throw new HRMSException("FLAG_ALREADY_EXISTS");
        }
        Constraints newFlag = new Constraints(flag, Status.ACTIVE);
        constraintsRepository.save(newFlag);

    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "constraintByFlag", key = "#flag"),
            @CacheEvict(cacheNames = "constraintActiveStatus", key = "#flag"),
            @CacheEvict(cacheNames = "constraintsAll", allEntries = true)
    })
    public void activateFlag(String flag) throws HRMSException {
        Constraints constraints = constraintsRepository.findById(flag)
                .orElseThrow(() -> new HRMSException("FLAG_NOT_FOUND"));
        if (constraints.getStatus() == Status.ACTIVE) {
            throw new HRMSException("FLAG_ALREADY_ACTIVE");
        }
        constraints.setStatus(Status.ACTIVE);
        constraintsRepository.save(constraints);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "constraintByFlag", key = "#flag"),
            @CacheEvict(cacheNames = "constraintActiveStatus", key = "#flag"),
            @CacheEvict(cacheNames = "constraintsAll", allEntries = true)
    })
    public void deactivateFlag(String flag) throws HRMSException {
        Constraints constraints = constraintsRepository.findById(flag)
                .orElseThrow(() -> new HRMSException("FLAG_NOT_FOUND"));
        if (constraints.getStatus() == Status.INACTIVE) {
            throw new HRMSException("FLAG_ALREADY_INACTIVE");
        }
        constraints.setStatus(Status.INACTIVE);
        constraintsRepository.save(constraints);
    }

    @Override
    @Cacheable(cacheNames = "constraintByFlag", key = "#flag")
    public ConstraintsDTO getFlag(String flag) throws HRMSException {
        return constraintsRepository.findById(flag)
                .orElseThrow(() -> new HRMSException("FLAG_NOT_FOUND")).toDTO();
    }

    @Override
    @Cacheable(cacheNames = "constraintsAll")
    public List<ConstraintsDTO> getAllFlags() throws HRMSException {
        return ((List<Constraints>) constraintsRepository.findAll()).stream()
                .map(Constraints::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = "constraintActiveStatus", key = "#flag")
    public Boolean isFlagActive(String flag) throws HRMSException {
        Optional<Constraints> constraints = constraintsRepository.findById(flag);
        if (constraints.isPresent()) {
            return constraints.get().getStatus() == Status.ACTIVE;
        }
        return false;
    }

}
