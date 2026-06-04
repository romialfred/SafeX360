package com.hrms.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.PositionCategoryDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.exception.HRMSException;
import jakarta.validation.Valid;
import com.hrms.service.PositionCategoryService;

@RestController
@CrossOrigin
@RequestMapping("/position-category")
@Validated
public class PositionCategoryAPI {
    
    @Autowired
    private PositionCategoryService positionCategoryService;
    
    @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addPositionCategory(@RequestBody @Valid PositionCategoryDTO positionCategoryDTO)  throws HRMSException{
        positionCategoryService.addPositionCategory(positionCategoryDTO);
        return new ResponseEntity<>(new ResponseDTO("Position Category added Successfully."), HttpStatus.CREATED);
    }
    @PostMapping("/update")
    public ResponseEntity<ResponseDTO> updatePositionCategory(@RequestBody @Valid PositionCategoryDTO positionCategoryDTO)  throws HRMSException{
        positionCategoryService.updatePositionCategory(positionCategoryDTO);
        return new ResponseEntity<>(new ResponseDTO("Position Category updated Successfully."), HttpStatus.OK);
    }
     @GetMapping("/get/{id}")
    public ResponseEntity<PositionCategoryDTO> getPositionCategory(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(positionCategoryService.getPositionCategory(id), HttpStatus.OK);
    }
    @GetMapping("/getAll")
    public ResponseEntity<List<PositionCategoryDTO>> getAllPositionCategorys() {
        return new ResponseEntity<>(positionCategoryService.getAllPositionCategories(), HttpStatus.OK);
    }
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deletePositionCategory(@PathVariable Long id) throws HRMSException {
        positionCategoryService.deletePositionCategory(id);
        return new ResponseEntity<>(new ResponseDTO("PositionCategory deleted Successfully."), HttpStatus.OK);
    }

}
