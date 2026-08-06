-- ============================================================================
-- Correctif : ppe_request.status / ppe_emp.status étaient des ENUM MySQL figés,
-- ne contenant PAS les valeurs ajoutées au code (DELIVERED, RETURNED aux
-- incréments 4/7 pour ppe_request). Hibernate ddl-auto:update ne modifie jamais
-- les valeurs d'un ENUM existant → écrire DELIVERED/RETURNED échouait en base
-- (« Data truncated for column 'status' »). On aligne sur @Enumerated(STRING) en
-- passant les colonnes en VARCHAR(32), pérenne pour toute valeur future.
--
-- IDEMPOTENT : MODIFY vers VARCHAR est sans effet si déjà VARCHAR.
-- ============================================================================
ALTER TABLE ppe_request MODIFY COLUMN status VARCHAR(32);
ALTER TABLE ppe_emp     MODIFY COLUMN status VARCHAR(32);

SELECT table_name, column_type FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name IN ('ppe_request','ppe_emp')
  AND column_name = 'status';
