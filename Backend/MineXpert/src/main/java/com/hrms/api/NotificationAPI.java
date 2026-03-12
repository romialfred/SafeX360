package com.hrms.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.NotificationDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.NotificationService;

@RestController
@CrossOrigin
@RequestMapping("/notification")
@Validated
public class NotificationAPI {
	@Autowired
	private NotificationService notificationService;
	 

	@PostMapping("/send")
	public ResponseEntity<ResponseDTO>sendNotification(@RequestBody NotificationDTO notificationDTO) throws HRMSException{
        notificationService.sendNotification(notificationDTO);
		return new ResponseEntity<>(new ResponseDTO("Notfication Sent."), HttpStatus.OK);
	}
	@GetMapping("/get/{accountId}")
	public ResponseEntity<List<NotificationDTO>>getNotifications(@PathVariable Long accountId){
		return new ResponseEntity<>(notificationService.getNotifications(accountId), HttpStatus.OK);
	}
	@PutMapping("/read/{id}")
	public ResponseEntity<ResponseDTO>readNotification(@PathVariable Long id) throws HRMSException{
		notificationService.deleteNotification(id);
		return new ResponseEntity<>(new ResponseDTO("Success"), HttpStatus.OK);
	}
}