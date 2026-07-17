package com.hrms.utility;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.hrms.exception.HRMSException;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class ExceptionControllerAdvice {

    @Autowired
    private Environment environment;

    @ExceptionHandler({ org.springframework.security.authentication.BadCredentialsException.class,
            org.springframework.security.core.userdetails.UsernameNotFoundException.class })
    public ResponseEntity<ErrorInfo> authenticationExceptionHandler(Exception exception) {
        ErrorInfo error = new ErrorInfo("Incorrect username or password",
                HttpStatus.UNAUTHORIZED.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ErrorInfo> springAuthExceptionHandler(
            org.springframework.security.core.AuthenticationException exception) {
        ErrorInfo error = new ErrorInfo("Authentication failed",
                HttpStatus.UNAUTHORIZED.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ExceptionControllerAdvice.class);

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorInfo> generalExceptionHandler(Exception exception) {
        log.error("Unhandled exception", exception);
        ErrorInfo error = new ErrorInfo("An internal error occurred. Please try again later.",
                HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * LOT 52 (remédiation GATE IAM-01) : un ResponseStatusException porte un
     * statut HTTP intentionnel (403 pour les gardes admin, etc.) — il doit être
     * restitué tel quel, pas avalé en 500 par le handler générique.
     */
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ErrorInfo> responseStatusExceptionHandler(
            org.springframework.web.server.ResponseStatusException exception) {
        ErrorInfo error = new ErrorInfo(exception.getReason(), exception.getStatusCode().value(),
                LocalDateTime.now());
        return new ResponseEntity<>(error, exception.getStatusCode());
    }

    @ExceptionHandler(HRMSException.class)
    public ResponseEntity<ErrorInfo> HRMSExceptionHandler(HRMSException exception) {
        // Une HRMSException porte une erreur MÉTIER (validation, ressource
        // introuvable, doublon…) : c'est un 4xx, pas un 500. On classe par
        // convention de nommage du code (aligné sur HNS) au lieu de forcer 500,
        // qui masquait la vraie cause et alarmait à tort.
        String code = exception.getMessage();
        HttpStatus status = resolveHRMSStatus(code);
        String resolved = code != null ? environment.getProperty(code) : null;
        String msg = resolved != null ? resolved : (code != null ? code : "Requête invalide.");
        ErrorInfo error = new ErrorInfo(msg, status.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, status);
    }

    private HttpStatus resolveHRMSStatus(String code) {
        if (code == null) {
            return HttpStatus.BAD_REQUEST;
        }
        String c = code.toUpperCase();
        if (c.endsWith("_NOT_FOUND")) {
            return HttpStatus.NOT_FOUND;
        }
        if (c.contains("ALREADY") || c.endsWith("_EXISTS")) {
            return HttpStatus.CONFLICT;
        }
        if (c.contains("UNAUTHORIZED") || c.contains("INVALID_CREDENTIALS")) {
            return HttpStatus.UNAUTHORIZED;
        }
        if (c.contains("FORBIDDEN") || c.contains("NOT_ALLOWED")) {
            return HttpStatus.FORBIDDEN;
        }
        return HttpStatus.BAD_REQUEST;
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
