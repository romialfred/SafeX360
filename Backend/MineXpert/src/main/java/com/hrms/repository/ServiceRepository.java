package com.hrms.repository;

import org.springframework.data.repository.CrudRepository;

import com.hrms.entity.Service;

public interface ServiceRepository extends CrudRepository<Service, Long> {
    
}
