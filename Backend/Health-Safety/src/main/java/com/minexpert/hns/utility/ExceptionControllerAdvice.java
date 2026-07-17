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

    // Filet de sécurité GLOBAL : toute violation d'intégrité en base (NOT NULL,
    // UNIQUE, clé étrangère orpheline — ex. dropdown référentiel vide sur une mine
    // non seedée, ou collision de numéro généré) tombait dans le catch-all et
    // devenait un 500 opaque « An internal error occurred ». On renvoie désormais
    // un 409 avec un code métier que le frontend traduit, au lieu d'un 500 muet.
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ErrorInfo> dataIntegrityHandler(
            org.springframework.dao.DataIntegrityViolationException exception) {
        log.warn("Data integrity violation", exception);
        String root = exception.getMostSpecificCause() != null
                ? exception.getMostSpecificCause().getMessage()
                : String.valueOf(exception.getMessage());
        String lower = root == null ? "" : root.toLowerCase();
        String code;
        if (lower.contains("foreign key") || lower.contains("a foreign key constraint fails")) {
            // FK orpheline : la référence choisie (lieu, processus, catégorie…)
            // n'existe pas pour cette mine → référentiel non renseigné.
            code = "REFERENCE_DATA_MISSING";
        } else if (lower.contains("duplicate") || lower.contains("unique")) {
            code = "DUPLICATE_ENTRY";
        } else if (lower.contains("cannot be null") || lower.contains("null")) {
            code = "REQUIRED_FIELD_MISSING";
        } else {
            code = "DATA_INTEGRITY_ERROR";
        }
        ErrorInfo error = new ErrorInfo(code, HttpStatus.CONFLICT.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    // ── Erreurs de ROUTAGE : erreurs CLIENT, pas des pannes serveur ──
    //
    // Sans ces handlers, une URL inconnue tombait dans le catch-all Exception et
    // renvoyait « 500 An internal error occurred ». Trois conséquences :
    //   1. mensonger — un 500 annonce un serveur en panne alors que la requête
    //      est simplement mal formée côté appelant ;
    //   2. la supervision se remplit de fausses alertes 500 ;
    //   3. diagnostic impossible — « endpoint non déployé » et « endpoint qui
    //      plante » deviennent indiscernables (vécu au déploiement de l'édition
    //      d'équipe : plusieurs sondes de version rendues aveugles).
    // Spring Boot 3.4 lève NoResourceFoundException pour une route inconnue ;
    // NoHandlerFoundException reste possible selon la configuration.

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ErrorInfo> noResourceHandler(
            org.springframework.web.servlet.resource.NoResourceFoundException exception) {
        ErrorInfo error = new ErrorInfo("RESOURCE_NOT_FOUND",
                HttpStatus.NOT_FOUND.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(org.springframework.web.servlet.NoHandlerFoundException.class)
    public ResponseEntity<ErrorInfo> noHandlerHandler(
            org.springframework.web.servlet.NoHandlerFoundException exception) {
        ErrorInfo error = new ErrorInfo("RESOURCE_NOT_FOUND",
                HttpStatus.NOT_FOUND.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /** Bonne URL, mauvaise méthode (ex. GET sur un chemin mappé en PUT) → 405. */
    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorInfo> methodNotSupportedHandler(
            org.springframework.web.HttpRequestMethodNotSupportedException exception) {
        ErrorInfo error = new ErrorInfo("METHOD_NOT_ALLOWED",
                HttpStatus.METHOD_NOT_ALLOWED.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.METHOD_NOT_ALLOWED);
    }

    /** Paramètre de type incompatible (ex. id non numérique ou hors plage Long) → 400, pas 500. */
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorInfo> typeMismatchHandler(
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException exception) {
        ErrorInfo error = new ErrorInfo("Parametre invalide : " + exception.getName(),
                HttpStatus.BAD_REQUEST.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /** Corps JSON illisible ou valeur d'enum inconnue → 400 (erreur cliente), pas 500. */
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorInfo> notReadableHandler(
            org.springframework.http.converter.HttpMessageNotReadableException exception) {
        ErrorInfo error = new ErrorInfo("Requete mal formee ou valeur invalide.",
                HttpStatus.BAD_REQUEST.value(), LocalDateTime.now());
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
        // Une HSException est une condition métier VOLONTAIREMENT levée (code
        // connu) : elle ne doit JAMAIS retomber en 500 (réservé aux exceptions
        // non gérées). On classe par convention de nommage du code, ce qui couvre
        // TOUS les modules sans énumération exhaustive et évite qu'un simple
        // « déjà existant » / « introuvable » n'apparaisse comme une panne serveur.
        String code = exception.getMessage();
        HttpStatus status = resolveHSStatus(code);
        String resolved = environment.getProperty(code);
        String msg = resolved != null ? resolved : code;
        ErrorInfo error = new ErrorInfo(msg, status.value(), LocalDateTime.now());
        return new ResponseEntity<>(error, status);
    }

    /**
     * Classe un code métier HSException en statut HTTP par convention de nommage :
     *   *_NOT_FOUND            -> 404 Not Found
     *   *ALREADY* (_EXISTS / _ACTIVE / _APPROVED_OR_REJECTED / _CONCLUDED …) -> 409 Conflict
     *   tout le reste (validation, règle métier) -> 400 Bad Request (jamais 500).
     */
    private HttpStatus resolveHSStatus(String code) {
        if (code == null) {
            return HttpStatus.BAD_REQUEST;
        }
        if (code.endsWith("_NOT_FOUND")) {
            return HttpStatus.NOT_FOUND;
        }
        if (code.contains("ALREADY")) {
            return HttpStatus.CONFLICT;
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
