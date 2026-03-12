package com.hrms.dto;

import com.hrms.entity.Documents;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocumentsDTO {
    private Long id;
    private String name;
    private String path;
    private String type;

    public Documents toEntity(){
        return new Documents(this.id, this.name, this.path, this.type);
    }
}
