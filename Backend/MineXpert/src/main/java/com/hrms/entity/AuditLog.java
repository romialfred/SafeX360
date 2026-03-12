package com.hrms.entity;

import java.time.LocalDateTime;

import com.hrms.dto.AuditLogDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;
    private String login;
    private LocalDateTime timestamp;
    private String status;

    public AuditLogDTO toDTO(){
        return new AuditLogDTO(this.id, this.employee!=null?this.employee.toDTO():null, this.login, this.timestamp, this.status);
    }
}
