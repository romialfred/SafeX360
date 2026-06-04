package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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

    @Override
    public Long addBodyPart(BodyPartDTO bodyPartDTO) throws HSException {
        Optional<BodyPart> bodyPart = bodyPartRepository.findByNameIgnoreCase(bodyPartDTO.getName());
        if (bodyPart.isPresent()) {
            throw new HSException("BODY_PART_ALREADY_EXISTS");
        }
        bodyPartDTO.setStatus(Status.ACTIVE);
        bodyPartDTO.setCreatedAt(LocalDateTime.now());
        bodyPartDTO.setUpdatedAt(LocalDateTime.now());
        return bodyPartRepository.save(bodyPartDTO.toEntity()).getId();
    }

    @Override
    public void updateBodyPart(BodyPartDTO bodyPartDTO) throws HSException {
        BodyPart existingBodyPart = bodyPartRepository.findById(bodyPartDTO.getId())
                .orElseThrow(() -> new HSException("BODY_PART_NOT_FOUND"));

        if (existingBodyPart.getName().equalsIgnoreCase(bodyPartDTO.getName())) {
            Optional<BodyPart> bodyPart = bodyPartRepository.findByNameIgnoreCase(bodyPartDTO.getName());
            if (bodyPart.isPresent()) {
                throw new HSException("BODY_PART_ALREADY_EXISTS");
            }
        }
        bodyPartDTO.setUpdatedAt(LocalDateTime.now());
        bodyPartRepository.save(bodyPartDTO.toEntity());
    }

    @Override
    public void deleteBodyPart(Long id) {
        bodyPartRepository.deleteById(id);
    }

    @Override
    public BodyPartDTO getBodyPartById(Long id) throws HSException {
        return bodyPartRepository.findById(id)
                .map(BodyPart::toDTO)
                .orElseThrow(() -> new HSException("BODY_PART_NOT_FOUND"));
    }

    @Override
    public List<BodyPartDTO> getAllBodyParts() throws HSException {
        return ((List<BodyPart>) bodyPartRepository.findAll()).stream()
                .map(BodyPart::toDTO)
                .toList();
    }

    @Override
    public List<BodyPartDTO> getAllActiveBodyParts() throws HSException {
        return bodyPartRepository.findAllByStatus(Status.ACTIVE).stream()
                .map(BodyPart::toDTO)
                .toList();
    }

    @Override
    public void activateBodyPart(Long id) throws HSException {
        BodyPart bodyPart = bodyPartRepository.findById(id)
                .orElseThrow(() -> new HSException("BODY_PART_NOT_FOUND"));
        bodyPart.setStatus(Status.ACTIVE);
        bodyPart.setUpdatedAt(LocalDateTime.now());
        bodyPartRepository.save(bodyPart);
    }

    @Override
    public void deactivateBodyPart(Long id) throws HSException {
        BodyPart bodyPart = bodyPartRepository.findById(id)
                .orElseThrow(() -> new HSException("BODY_PART_NOT_FOUND"));
        bodyPart.setStatus(Status.INACTIVE);
        bodyPart.setUpdatedAt(LocalDateTime.now());
        bodyPartRepository.save(bodyPart);
    }

}
