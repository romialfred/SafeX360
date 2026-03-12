package com.minexpert.hns.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ActionProcessDTO;
import com.minexpert.hns.dto.response.ActionProcessResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.ActionProcessService;

@RestController
@RequestMapping("/action-process")
@CrossOrigin
@Validated
public class ActionProcessAPI {
    @Autowired
    private ActionProcessService actionProcessService;

    @PostMapping("/create")
    public ResponseEntity<Long> addActionProcess(@RequestBody ActionProcessDTO actionProcessDTO) throws HSException {
        return new ResponseEntity<>(actionProcessService.addActionProcess(actionProcessDTO), HttpStatus.CREATED);
    }

    @GetMapping("/getByActionId/{actionId}")
    public ResponseEntity<List<ActionProcessResponse>> getActionProcessByActionId(
            @PathVariable("actionId") Long actionId) throws HSException {
        return new ResponseEntity<>(actionProcessService.getActionProcessByActionId(actionId), HttpStatus.OK);
    }

}
