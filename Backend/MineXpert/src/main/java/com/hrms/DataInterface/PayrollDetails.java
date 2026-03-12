package com.hrms.DataInterface;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface PayrollDetails {
    public Long getId();

    public String getMatricule();

    public String getName();

    public String getCode();

    public Integer getHours();

    public LocalDate getPaymentMonth();

    public LocalDate getMonthStartDate();

    public LocalDate getMonthEndDate();

    public String getTransferredBy();

    public String getTeamName();

    public String getDepartmentName();

    public LocalDateTime getTransferredAt();
}
