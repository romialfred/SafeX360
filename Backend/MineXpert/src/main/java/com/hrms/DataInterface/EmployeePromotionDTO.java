package com.hrms.DataInterface;

import java.util.List;

import com.hrms.entity.Promotion;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmployeePromotionDTO {
    private Long empId;
    private String firstName;
    private String familyName;
    private List<Promotion> promotions;
    

}