package com.hrms.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.hrms.entity.Roster;

public interface RosterRepository extends CrudRepository<Roster, Long> {
    Optional<Roster>findByNameIgnoreCase(String name);
}
