package com.hrms.entity.Timesheet;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.hrms.dto.Timesheet.SignatureDTO;
import com.hrms.enums.SignType;
import com.hrms.utility.Base64Util;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Signature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timesheet_id", nullable = false)
    @JsonBackReference
    private Timesheet timesheet;

    private String signedBy;
    @Lob
    private byte[] signature;
    private SignType signType;

    public SignatureDTO toDTO() {
        return new SignatureDTO(id, this.timesheet != null ? timesheet.getId() : null, signedBy,
                Base64Util.encode(signature), signType);

    }
}
