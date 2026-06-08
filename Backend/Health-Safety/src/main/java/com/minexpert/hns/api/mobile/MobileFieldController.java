package com.minexpert.hns.api.mobile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Endpoints dedies a SafeX 360 Field (application mobile Android).
 *
 * <p>Phase M4 : stockage des photos preuves uploadees depuis le terrain
 * (incidents, constats d'inspection) et registration des tokens FCM
 * pour le ciblage des notifications push.
 *
 * <p>Les endpoints "personal" servent les vues lecture-seule du profil :
 * EPI, formations, dosimetrie, suivi medical. Implementation actuelle :
 * payload minimal stub renvoyant une liste vide (a brancher sur les
 * services metier existants en Phase M5).
 */
/**
 * Activation conditionnelle (Phase M5 — defense en profondeur).
 *
 * <p>Le bean ne sera instancie que si la propriete {@code mobile.enabled=true}
 * est presente dans l'environnement de deploiement. Par defaut (prod
 * actuelle) le controller n'est PAS charge, ce qui isole le code mobile
 * d'eventuels effets de bord sur le boot Spring du service Health-Safety.
 *
 * <p>Pour activer en prod : ajouter {@code MOBILE_ENABLED=true} dans les
 * variables d'environnement Render apres validation du dashboard blast.
 */
@RestController
@RequestMapping("/mobile")
@ConditionalOnProperty(name = "mobile.enabled", havingValue = "true", matchIfMissing = false)
public class MobileFieldController {

    private static final Logger log = LoggerFactory.getLogger(MobileFieldController.class);

    private static final String PHOTO_ROOT = System.getProperty("user.home")
        + "/.safex360-mobile-photos";

    /**
     * Upload d'une photo preuve. Stockage disque local (rotation par le
     * cron systeme si necessaire). Retourne l'URL servable pour
     * referencement dans l'entite metier (finding / incident).
     */
    @PostMapping("/photo-upload")
    public ResponseEntity<Map<String, String>> uploadPhoto(
            @RequestParam("photo") MultipartFile photo,
            @RequestParam(value = "findingId", required = false) Long findingId) {
        try {
            Path dir = Paths.get(PHOTO_ROOT);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }
            String filename = UUID.randomUUID().toString() + ".jpg";
            Path target = dir.resolve(filename);
            Files.copy(photo.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            Map<String, String> body = new HashMap<>();
            body.put("url", "/hns/mobile/photo/" + filename);
            body.put("filename", filename);
            if (findingId != null) {
                body.put("findingId", String.valueOf(findingId));
            }
            log.info("Photo mobile uploadee : {} (findingId={})", filename, findingId);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            log.error("Echec upload photo mobile", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Enregistre un token FCM pour ciblage push. Stub minimal : log
     * uniquement. La persistance va dans une table user_push_token a
     * cabler en Phase M5 (avec relation many-to-one User).
     */
    @PostMapping("/push-token")
    public ResponseEntity<Map<String, Object>> registerPushToken(
            @RequestBody Map<String, Object> body) {
        Object token = body.get("token");
        Object platform = body.get("platform");
        // Tronquer le token pour ne logger qu'un prefixe (PII / secret).
        String tokenPreview = null;
        if (token != null) {
            String t = String.valueOf(token);
            tokenPreview = t.substring(0, Math.min(20, t.length())) + "...";
        }
        log.info("Token push enregistre (platform={}) : {}", platform, tokenPreview);
        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        resp.put("registeredAt", LocalDateTime.now().toString());
        return ResponseEntity.ok(resp);
    }

    // ─────────────────────────────────────────────────────────────────
    //  Vues "personal" — stubs minimaux pour Phase M3/M4
    //  A remplacer par des delegations vers les services HSE existants
    //  en Phase M5 (PpeEmpService, TrainingService, DosimetryService,
    //  MedicalSurveillanceService).
    // ─────────────────────────────────────────────────────────────────

    @GetMapping("/ppe/personal/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getPersonalPpe(@PathVariable Long userId) {
        // Stub : liste vide jusqu'a integration avec PpeEmpService
        log.debug("GET /mobile/ppe/personal/{}", userId);
        return ResponseEntity.ok(new ArrayList<>());
    }

    @GetMapping("/trainings/personal/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getPersonalTrainings(@PathVariable Long userId) {
        log.debug("GET /mobile/trainings/personal/{}", userId);
        return ResponseEntity.ok(new ArrayList<>());
    }

    @GetMapping("/dosimetry/personal/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getPersonalDosimetry(@PathVariable Long userId) {
        log.debug("GET /mobile/dosimetry/personal/{}", userId);
        return ResponseEntity.ok(new ArrayList<>());
    }

    @GetMapping("/medical/personal/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getPersonalMedical(@PathVariable Long userId) {
        log.debug("GET /mobile/medical/personal/{}", userId);
        return ResponseEntity.ok(new ArrayList<>());
    }

    /**
     * Renvoie la derniere version stable de l'APK et son URL de telechargement.
     * L'app mobile peut afficher un bandeau de mise a jour quand la version
     * installee &lt; latestVersionCode.
     *
     * <p>Phase M5 stub : valeur statique alignee sur CHANGELOG_MOBILE.md.
     * Phase M6 : table {@code mobile_app_version} avec gestion de plusieurs
     * canaux (stable / beta / internal).
     */
    @GetMapping("/app-version")
    public ResponseEntity<Map<String, Object>> getLatestAppVersion() {
        Map<String, Object> body = new HashMap<>();
        body.put("latestVersionName", "1.0.0");
        body.put("latestVersionCode", 10000);
        body.put("releaseDate", "2026-06-08");
        body.put("channel", "internal");
        body.put("downloadUrl", "/api/admin/mobile/download/safex360-field-1.0.0.apk");
        body.put("mandatoryUpgrade", false);
        body.put("releaseNotes",
            "Premiere version pilote : SOS offline, capture photo compressee,"
            + " sirene tirs, re-auth biometrique.");
        return ResponseEntity.ok(body);
    }
}
