package com.hrms.entity;
import java.time.LocalDateTime;

import com.hrms.dto.NotificationDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long accountId;
    private String title;
    private String message;
    private String route;
    private String type; 
    private LocalDateTime timestamp;

    public NotificationDTO toDTO() {
		return new NotificationDTO (this.id, this.accountId,  this.title, this.message, this.route, this.type, this.timestamp);
	}

}