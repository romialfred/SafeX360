package com.hrms.dto.Timesheet;

import com.hrms.entity.Timesheet.Signature;
import com.hrms.entity.Timesheet.Timesheet;
import com.hrms.enums.SignType;
import com.hrms.utility.Base64Util;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignatureDTO {
    private Long id;
    private Long timesheetId;
    private String signedBy;
    private String signature;
    private SignType signType;

    public Signature toEntity() {
        return new Signature(this.id, this.timesheetId != null ? new Timesheet(this.timesheetId) : null, this.signedBy,
                Base64Util.decode(signature), this.signType);
    }
}
