package com.hrms.service;

import java.util.List;

import com.hrms.dto.ServiceDTO;
import com.hrms.exception.HRMSException;

public interface ServiceService {
    public void addService(ServiceDTO serviceDTO);
    public ServiceDTO getService(Long id) throws HRMSException;
    public void updateService(ServiceDTO serviceDTO);
    public List<ServiceDTO> getAllServices();
}
