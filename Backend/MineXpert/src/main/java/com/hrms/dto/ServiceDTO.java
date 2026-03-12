package com.hrms.dto;

import com.hrms.entity.Department;
import com.hrms.entity.Service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ServiceDTO {
     private Long id;
    private String name;

    public Service toEntity(){
        return new Service(this.id, this.name);
    }
}
