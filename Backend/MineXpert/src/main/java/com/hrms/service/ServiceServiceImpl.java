package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.hrms.dto.ServiceDTO;
import com.hrms.exception.HRMSException;
import com.hrms.repository.ServiceRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class ServiceServiceImpl implements ServiceService {

    @Autowired
    private ServiceRepository serviceRepository;


    @Override
    @CacheEvict(cacheNames = "servicesAll", allEntries = true)
    public void addService(ServiceDTO serviceDTO) {
        serviceRepository.save(serviceDTO.toEntity());
    }

    @Override
    @Cacheable(cacheNames = "serviceById", key = "#id")
    public ServiceDTO getService(Long id) throws HRMSException {
        return serviceRepository.findById(id).orElseThrow(()->new HRMSException("SERVICE_NOT_FOUND")).toDTO();
    }

    @Override
    public void updateService(ServiceDTO serviceDTO) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'updateService'");
    }

    @Override
    @Cacheable(cacheNames = "servicesAll")
    public List<ServiceDTO> getAllServices() {
        return ((List<com.hrms.entity.Service>)serviceRepository.findAll()).stream().map(service->service.toDTO()).toList();
    }
    
}
