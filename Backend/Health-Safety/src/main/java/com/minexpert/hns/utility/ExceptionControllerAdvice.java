package com.minexpert.hns.utility;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.minexpert.hns.exception.HSException;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class ExceptionControllerAdvice {

    @Autowired
    private Environment environment;

    /**
     * Phase 10-A : AccessDeniedException levee depuis un controller (ex.
     * DosimetrySelfAccessGuard.verifySelfAccess) doit aboutir a un 403 explicite et non
     * cascader en 500 via le generalExceptionHandler.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorInfo> accessDeniedHandler(AccessDeniedException exception) {
        ErrorInfo error = new ErrorInfo("Access denied.", HttpStatus.FORBIDDEN.value(),
                LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    /**
     * Phase 10-A : ResponseStatusException portee par XReasonValidator (400) ou autres
     * validations applicatives. On preserve le status HTTP defini par l'appelant plutot que
     * de tout collapser sur un 500 generique.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorInfo> responseStatusHandler(ResponseStatusException exception) {
        ErrorInfo error = new ErrorInfo(exception.getReason() != null ? exception.getReason()
                : exception.getMessage(),
                exception.getStatusCode().value(), LocalDateTime.now());
        return new ResponseEntity<>(error, exception.getStatusCode());
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ExceptionControllerAdvice.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorInfo> illegalArgumentHandler(IllegalArgumentException exception) {
        ErrorInfo error = new ErrorInfo(exception.getMessage(),
                HttpStatus.BAD_REQUEST.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorInfo> illegalStateHandler(IllegalStateException exception) {
        ErrorInfo error = new ErrorInfo(exception.getMessage(),
                HttpStatus.CONFLICT.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    // Paramètre de requête obligatoire manquant (ex. companyId absent en vue
    // « Toutes les Mines ») : renvoie un 400 CLAIR au lieu de cascader en 500
    // générique via le catch-all. Pour companyId, on renvoie le code métier
    // COMPANY_ID_REQUIRED que le frontend traduit (« sélectionnez une mine »).
    @ExceptionHandler(org.springframework.web.bind.MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorInfo> missingParamHandler(
            org.springframework.web.bind.MissingServletRequestParameterException exception) {
        String msg = "companyId".equals(exception.getParameterName())
                ? "COMPANY_ID_REQUIRED"
                : "Paramètre requis manquant : " + exception.getParameterName();
        ErrorInfo error = new ErrorInfo(msg, HttpStatus.BAD_REQUEST.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorInfo> generalExceptionHandler(Exception exception) {
        log.error("Unhandled exception", exception);
        ErrorInfo error = new ErrorInfo("An internal error occurred. Please try again later.",
                HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(HSException.class)
    public ResponseEntity<ErrorInfo> HSExceptionHandler(HSException exception) {
        String msg = environment.getProperty(exception.getMessage());
        ErrorInfo error = new ErrorInfo(msg, HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler({ MethodArgumentNotValidException.class, ConstraintViolationException.class })
    public ResponseEntity<ErrorInfo> validatorExceptionHandler(Exception exception) {
        String errorMsg;
        if (exception instanceof MethodArgumentNotValidException manvException) {
            errorMsg = manvException.getBindingResult().getAllErrors().stream().map(ObjectError::getDefaultMessage)
                    .collect(Collectors.joining(", "));
        } else {
            ConstraintViolationException cvException = (ConstraintViolationException) exception;
            errorMsg = cvException.getConstraintViolations().stream().map(ConstraintViolation::getMessage)
                    .collect(Collectors.joining(", "));
        }
        ErrorInfo errorInfo = new ErrorInfo();
        errorInfo.setErrorMessage(errorMsg);
        errorInfo.setErrorCode(HttpStatus.BAD_REQUEST.value());
        errorInfo.setTimeStamp(LocalDateTime.now());
        return new ResponseEntity<>(errorInfo, HttpStatus.BAD_REQUEST);
    }
}
