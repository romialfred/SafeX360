-- AUD-REG-001 - Référentiel juridictionnel versionné, sans valeur préchargée.
-- Migration additive MySQL 8. Toute règle reste DRAFT jusqu'à approbation humaine.

-- SCRIPT IDEMPOTENT. Piege reel : si HNS (ddl-auto=update) a boote AVANT ce
-- script, Hibernate a deja cree la table - SANS les contraintes CHECK ni les
-- index composites. Le IF NOT EXISTS saute alors la creation, et le bloc de
-- rattrapage en fin de script pose ce qui manque.
CREATE TABLE IF NOT EXISTS dosimetry_regulatory_rule (
    id                          BIGINT NOT NULL AUTO_INCREMENT,
    lock_version                BIGINT NOT NULL DEFAULT 0,
    company_id                  BIGINT NOT NULL,
    mine_id                     BIGINT NULL,
    site_code                   VARCHAR(64) NULL,
    rule_code                   VARCHAR(96) NOT NULL,
    version_number              INT NOT NULL,
    supersedes_rule_id          BIGINT NULL,
    country_code                CHAR(2) NOT NULL,
    jurisdiction_code           VARCHAR(96) NOT NULL,
    authority_name              VARCHAR(255) NOT NULL,
    population_category         VARCHAR(32) NOT NULL,
    grandeur                    VARCHAR(16) NOT NULL,
    dose_type                   VARCHAR(32) NOT NULL,
    rule_kind                   VARCHAR(32) NOT NULL,
    rule_value                  DOUBLE NOT NULL,
    unit                        VARCHAR(16) NOT NULL,
    measurement_period_months   INT NOT NULL,
    effective_from              DATE NOT NULL,
    effective_to                DATE NULL,
    approval_status             VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    lifecycle_status            VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    source_reference            VARCHAR(255) NOT NULL,
    source_version              VARCHAR(64) NOT NULL,
    source_url                  VARCHAR(1024) NULL,
    impact_assessment           TEXT NOT NULL,
    review_owner_id             BIGINT NOT NULL,
    review_due_date             DATE NOT NULL,
    approved_by                 BIGINT NULL,
    approved_at                 DATETIME(6) NULL,
    approval_evidence           VARCHAR(1024) NULL,
    retired_by                  BIGINT NULL,
    retired_at                  DATETIME(6) NULL,
    retired_effective_on        DATE NULL,
    retirement_reason           VARCHAR(1024) NULL,
    created_by                  BIGINT NOT NULL,
    created_at                  DATETIME(6) NOT NULL,
    updated_by                  BIGINT NOT NULL,
    updated_at                  DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_reg_rule_supersedes FOREIGN KEY (supersedes_rule_id)
        REFERENCES dosimetry_regulatory_rule(id) ON DELETE RESTRICT,
    CONSTRAINT uk_reg_rule_code_version UNIQUE (company_id, rule_code, version_number),
    CONSTRAINT chk_reg_rule_value_positive CHECK (rule_value > 0),
    CONSTRAINT chk_reg_rule_period_positive CHECK (measurement_period_months > 0),
    CONSTRAINT chk_reg_rule_effectivity CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_reg_rule_approval CHECK (
        approval_status <> 'APPROVED'
        OR (approved_by IS NOT NULL AND approved_at IS NOT NULL AND approval_evidence IS NOT NULL)
    ),
    INDEX idx_reg_rule_resolution (
        company_id, mine_id, country_code, jurisdiction_code,
        population_category, grandeur, rule_kind, approval_status
    ),
    INDEX idx_reg_rule_effectivity (effective_from, effective_to, retired_effective_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- Rattrapage : la table existait deja (creee par Hibernate) -----------------
DROP PROCEDURE IF EXISTS safex_v023;
DELIMITER $$
CREATE PROCEDURE safex_v023()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dosimetry_regulatory_rule'
                     AND CONSTRAINT_NAME = 'uk_reg_rule_code_version') THEN
        ALTER TABLE dosimetry_regulatory_rule
            ADD CONSTRAINT uk_reg_rule_code_version UNIQUE (company_id, rule_code, version_number);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dosimetry_regulatory_rule'
                     AND CONSTRAINT_NAME = 'chk_reg_rule_value_positive') THEN
        ALTER TABLE dosimetry_regulatory_rule
            ADD CONSTRAINT chk_reg_rule_value_positive CHECK (rule_value > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dosimetry_regulatory_rule'
                     AND CONSTRAINT_NAME = 'chk_reg_rule_period_positive') THEN
        ALTER TABLE dosimetry_regulatory_rule
            ADD CONSTRAINT chk_reg_rule_period_positive CHECK (measurement_period_months > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dosimetry_regulatory_rule'
                     AND CONSTRAINT_NAME = 'chk_reg_rule_effectivity') THEN
        ALTER TABLE dosimetry_regulatory_rule
            ADD CONSTRAINT chk_reg_rule_effectivity CHECK (effective_to IS NULL OR effective_to >= effective_from);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dosimetry_regulatory_rule'
                     AND CONSTRAINT_NAME = 'chk_reg_rule_approval') THEN
        ALTER TABLE dosimetry_regulatory_rule
            ADD CONSTRAINT chk_reg_rule_approval CHECK (
                approval_status <> 'APPROVED'
                OR (approved_by IS NOT NULL AND approved_at IS NOT NULL AND approval_evidence IS NOT NULL)
            );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dosimetry_regulatory_rule'
                     AND INDEX_NAME = 'idx_reg_rule_resolution') THEN
        CREATE INDEX idx_reg_rule_resolution ON dosimetry_regulatory_rule
            (company_id, mine_id, country_code, jurisdiction_code,
             population_category, grandeur, rule_kind, approval_status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dosimetry_regulatory_rule'
                     AND INDEX_NAME = 'idx_reg_rule_effectivity') THEN
        CREATE INDEX idx_reg_rule_effectivity ON dosimetry_regulatory_rule
            (effective_from, effective_to, retired_effective_on);
    END IF;
END$$
DELIMITER ;
CALL safex_v023();
DROP PROCEDURE IF EXISTS safex_v023;
