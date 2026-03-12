package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.parameters.BodyPart;
import com.minexpert.hns.enums.Status;

public interface BodyPartRepository extends CrudRepository<BodyPart, Long> {
    Optional<BodyPart> findByNameIgnoreCase(String name);

    List<BodyPart> findAllByStatus(Status status);

}
