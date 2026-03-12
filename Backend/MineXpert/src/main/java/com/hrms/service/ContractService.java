package com.hrms.service;

import java.util.List;

import com.hrms.dto.ContractDTO;
import com.hrms.exception.HRMSException;

public interface ContractService {
    public void addContract(ContractDTO contractDTO) throws HRMSException;
    public ContractDTO getContract(Long id) throws HRMSException;
    public void updateContract(ContractDTO contractDTO) throws HRMSException;
    public void deleteContract(Long id) throws HRMSException;
    public List<ContractDTO> getAllContracts();
    public List<Object[]> getSeparationData();
}
