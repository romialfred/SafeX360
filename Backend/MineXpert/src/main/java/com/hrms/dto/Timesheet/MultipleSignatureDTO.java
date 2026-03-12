package com.hrms.dto.Timesheet;

import java.util.List;

import com.hrms.enums.SignType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MultipleSignatureDTO {
    private List<Long> timesheets;
    private String signedBy;
    private String signature;
    private SignType signType;
}
