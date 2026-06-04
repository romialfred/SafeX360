package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.parameters.BodyPartDTO;
import com.minexpert.hns.entity.parameters.BodyPart;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.BodyPartRepository;

@Service
@Transactional
public class BodyPartServiceImpl implements BodyPartService {

    @Autowired
    private BodyPartRepository bodyPartRepository;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "bodyPartsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "bodyPartsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public Long addBodyPart(Long companyId, BodyPartDTO bodyPartDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<BodyPart> bodyPart = bodyPartRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                bodyPartDTO.getName());
        if (bodyPart.isPresent()) {
            throw new HSException("BODY_PART_ALREADY_EXISTS");
        }
        bodyPartDTO.setStatus(Status.ACTIVE);
        bodyPartDTO.setCompanyId(companyId);
        bodyPartDTO.setCreatedAt(LocalDateTime.now());
        bodyPartDTO.setUpdatedAt(LocalDateTime.now());
        return bodyPartRepository.save(bodyPartDTO.toEntity()).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "bodyPartById", key = "#companyId != null ? (#companyId + '-' + #bodyPartDTO.id) : 'ALL-' + #bodyPartDTO.id", condition = "#bodyPartDTO.id != null"),
            @CacheEvict(cacheNames = "bodyPartsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "bodyPartsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void updateBodyPart(Long companyId, BodyPartDTO bodyPartDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        BodyPart existingBodyPart = bodyPartRepository.findById(bodyPartDTO.getId())
                .orElseThrow(() -> new HSException("BODY_PART_NOT_FOUND"));
        if (!companyId.equals(existingBodyPart.getCompanyId())) {
            throw new HSException("BODY_PART_NOT_FOUND");
        }

        if (!existingBodyPart.getName().equalsIgnoreCase(bodyPartDTO.getName())) {
            Optional<BodyPart> bodyPart = bodyPartRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                    bodyPartDTO.getName());
            if (bodyPart.isPresent()) {
                throw new HSException("BODY_PART_ALREADY_EXISTS");
            }
        }
        existingBodyPart.setName(bodyPartDTO.getName());
        existingBodyPart
                .setFile(bodyPartDTO.getFile() != null ? Base64.getDecoder().decode(bodyPartDTO.getFile()) : null);
        existingBodyPart.setUpdatedAt(LocalDateTime.now());
        bodyPartRepository.save(existingBodyPart);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "bodyPartById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "bodyPartsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "bodyPartsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deleteBodyPart(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        BodyPart bodyPart = bodyPartRepository.findById(id)
                .orElseThrow(() -> new HSException("BODY_PART_NOT_FOUND"));
        if (!companyId.equals(bodyPart.getCompanyId())) {
            throw new HSException("BODY_PART_NOT_FOUND");
        }
        bodyPartRepository.delete(bodyPart);
    }

    @Override
    @Cacheable(cacheNames = "bodyPartById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public BodyPartDTO getBodyPartById(Long companyId, Long id) throws HSException {
        BodyPart bodyPart = bodyPartRepository.findById(id)
                .orElseThrow(() -> new HSException("BODY_PART_NOT_FOUND"));
        if (companyId != null && !companyId.equals(bodyPart.getCompanyId())) {
            throw new HSException("BODY_PART_NOT_FOUND");
        }
        return bodyPart.toDTO();
    }

    @Override
    @Cacheable(cacheNames = "bodyPartsAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<BodyPartDTO> getAllBodyParts(Long companyId) throws HSException {
        return bodyPartRepository.findAllByCompanyId(companyId).stream()
                .map(BodyPart::toDTO)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = "bodyPartsActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<BodyPartDTO> getAllActiveBodyParts(Long companyId) throws HSException {
        return bodyPartRepository.findAllByStatus(companyId, Status.ACTIVE).stream()
                .map(BodyPart::toDTO)
                .toList();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "bodyPartById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "bodyPartsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "bodyPartsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void activateBodyPart(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        BodyPart bodyPart = bodyPartRepository.findById(id)
                .orElseThrow(() -> new HSException("BODY_PART_NOT_FOUND"));
        if (!companyId.equals(bodyPart.getCompanyId())) {
            throw new HSException("BODY_PART_NOT_FOUND");
        }
        bodyPart.setStatus(Status.ACTIVE);
        bodyPart.setUpdatedAt(LocalDateTime.now());
        bodyPartRepository.save(bodyPart);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "bodyPartById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "bodyPartsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "bodyPartsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deactivateBodyPart(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        BodyPart bodyPart = bodyPartRepository.findById(id)
                .orElseThrow(() -> new HSException("BODY_PART_NOT_FOUND"));
        if (!companyId.equals(bodyPart.getCompanyId())) {
            throw new HSException("BODY_PART_NOT_FOUND");
        }
        bodyPart.setStatus(Status.INACTIVE);
        bodyPart.setUpdatedAt(LocalDateTime.now());
        bodyPartRepository.save(bodyPart);
    }

}
