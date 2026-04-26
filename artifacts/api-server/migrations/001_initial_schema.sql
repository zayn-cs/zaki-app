-- =============================================================================
-- Migration 001 : Schéma initial – Application de gestion de projets
-- Base : PostgreSQL 14+
-- Généré depuis le schéma SQLite (sql.js) + routes Express
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- utile pour la recherche sans accents (ILIKE)

-- ---------------------------------------------------------------------------
-- 1. DEPARTEMENT
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departement (
    id   SERIAL PRIMARY KEY,
    nom  TEXT NOT NULL,
    code TEXT
);

-- ---------------------------------------------------------------------------
-- 2. UTILISATEUR
-- (référence departement, donc créé après)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilisateur (
    id                       SERIAL PRIMARY KEY,
    nom                      TEXT,
    prenom                   TEXT,
    messager                 TEXT NOT NULL UNIQUE,          -- identifiant de connexion
    mot_pass                 TEXT NOT NULL,                 -- hash bcrypt
    role                     TEXT DEFAULT 'chef_projet'
                                 CHECK (role IN (
                                     'admin', 'coordinateur',
                                     'chef_departement', 'chef_projet',
                                     'responsable_lot'
                                 )),
    grade                    TEXT,
    adresse                  TEXT,
    telephone_professional   TEXT,
    telephone_personnel      TEXT,
    is_chef_project          BOOLEAN NOT NULL DEFAULT FALSE,
    id_departement           INTEGER REFERENCES departement(id) ON DELETE SET NULL,
    token                    TEXT,
    token_expiration         TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- 3. BET  (Bureau d'études techniques)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bet (
    id              SERIAL PRIMARY KEY,
    nom_bet         TEXT NOT NULL,
    adresse         TEXT NOT NULL,
    nom_gerant      TEXT NOT NULL,
    prenom_gerant   TEXT NOT NULL,
    telephone_bet   TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- 4. CMD  (Circonscription / Direction)
-- (référence utilisateur → id_user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cmd (
    id         SERIAL PRIMARY KEY,
    nom_cmd    TEXT,
    nom_region TEXT,
    id_user    INTEGER REFERENCES utilisateur(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 5. UNITE
-- (référence cmd, bet, utilisateur)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS unite (
    id        SERIAL PRIMARY KEY,
    nom_unite TEXT NOT NULL,
    id_bet    INTEGER REFERENCES bet(id)        ON DELETE SET NULL,
    id_user   INTEGER REFERENCES utilisateur(id) ON DELETE SET NULL,
    id_cmd    INTEGER REFERENCES cmd(id)        ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 6. PROJET
-- (référence bet, unite, utilisateur)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projet (
    id                   SERIAL PRIMARY KEY,
    numero               TEXT,
    pa                   TEXT,
    numero_op            TEXT,
    programme            TEXT,
    programme_a_realiser TEXT,
    situation_objectif   TEXT,
    contrainte           TEXT,
    stade                TEXT,
    priorite             TEXT,
    type                 TEXT,
    reference_priorite   TEXT,
    montant_delegue      NUMERIC(18, 2) DEFAULT 0,
    montant_engagement   NUMERIC(18, 2) DEFAULT 0,
    montant_paiement     NUMERIC(18, 2) DEFAULT 0,
    delais               INTEGER DEFAULT 0,
    debut_etude          DATE,
    fin_etude            DATE,
    essais               TEXT,
    fin_prev             DATE,
    date_achevement      TIMESTAMPTZ,
    observation          TEXT,
    interne              TEXT,
    codification_cc      TEXT,
    chef_projet          INTEGER REFERENCES utilisateur(id) ON DELETE SET NULL,
    id_bet               INTEGER REFERENCES bet(id)        ON DELETE SET NULL,
    id_unite             INTEGER REFERENCES unite(id)      ON DELETE SET NULL,
    id_user              INTEGER REFERENCES utilisateur(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 7. LOT
-- (référence projet, departement, utilisateur)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lot (
    id              SERIAL PRIMARY KEY,
    nom_lot         TEXT NOT NULL,
    id_projet       INTEGER REFERENCES projet(id)      ON DELETE CASCADE,
    id_departement  INTEGER REFERENCES departement(id) ON DELETE SET NULL,
    id_user         INTEGER REFERENCES utilisateur(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 8. PHASE
-- (référence lot, utilisateur)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS phase (
    id          SERIAL PRIMARY KEY,
    nome_phase  TEXT NOT NULL,
    date_debut  DATE,
    date_fin    DATE,
    id_lot      INTEGER REFERENCES lot(id)           ON DELETE CASCADE,
    id_user     INTEGER REFERENCES utilisateur(id)   ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 9. TYPE_DOCUMENT
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS type_document (
    id              SERIAL PRIMARY KEY,
    lib_type        TEXT NOT NULL,
    allowed_formats TEXT
);

-- ---------------------------------------------------------------------------
-- 10. VERSION  (doit exister avant document pour la FK circulaire)
-- La FK id_document est ajoutée après la création de document (voir plus bas).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS version (
    id                SERIAL PRIMARY KEY,
    numero_version    INTEGER NOT NULL DEFAULT 1,
    date_modification TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fichier_path      TEXT,
    commentaire       TEXT
    -- id_document ajouté après CREATE TABLE document
);

-- ---------------------------------------------------------------------------
-- 11. DOCUMENT
-- (référence phase, projet, type_document, utilisateur, version)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document (
    id              SERIAL PRIMARY KEY,
    nom_doc         TEXT NOT NULL,
    chemin          TEXT,
    is_global       BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_phase        INTEGER REFERENCES phase(id)         ON DELETE SET NULL,
    commentaire     TEXT,
    id_version      INTEGER REFERENCES version(id)       ON DELETE SET NULL,
    id_projet       INTEGER REFERENCES projet(id)        ON DELETE SET NULL,
    id_type         INTEGER REFERENCES type_document(id) ON DELETE SET NULL,
    statut          TEXT NOT NULL DEFAULT 'actif'
                        CHECK (statut IN ('actif', 'archivé')),
    id_utilisateur  INTEGER REFERENCES utilisateur(id)   ON DELETE SET NULL
);

-- Ajouter la FK circulaire version → document
ALTER TABLE version
    ADD COLUMN IF NOT EXISTS id_document INTEGER REFERENCES document(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 12. TAG
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tag (
    id          SERIAL PRIMARY KEY,
    lib_tag     TEXT NOT NULL,
    description TEXT
);

-- ---------------------------------------------------------------------------
-- 13. PROJET_TAG  (many-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projet_tag (
    id_projet  INTEGER NOT NULL REFERENCES projet(id) ON DELETE CASCADE,
    id_tag     INTEGER NOT NULL REFERENCES tag(id)    ON DELETE CASCADE,
    PRIMARY KEY (id_projet, id_tag)
);

-- ---------------------------------------------------------------------------
-- 14. DOCUMENT_TAG  (many-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_tag (
    id_document  INTEGER NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    id_tag       INTEGER NOT NULL REFERENCES tag(id)      ON DELETE CASCADE,
    PRIMARY KEY (id_document, id_tag)
);

-- ---------------------------------------------------------------------------
-- 15. ZONE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zone (
    id        SERIAL PRIMARY KEY,
    nom_zone  TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- 16. REGION
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS region (
    id           SERIAL PRIMARY KEY,
    nom_region   TEXT NOT NULL,
    chef_region  TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- 17. TYPE_PHASE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS type_phase (
    id              SERIAL PRIMARY KEY,
    lib_type_phase  TEXT NOT NULL,
    id_phase        INTEGER REFERENCES phase(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 18. HISTORIQUE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historique (
    id              SERIAL PRIMARY KEY,
    action          TEXT NOT NULL,
    id_utilisateur  INTEGER REFERENCES utilisateur(id) ON DELETE SET NULL,
    entite_type     TEXT,
    entite_id       INTEGER,
    commentaire     TEXT,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEX utiles pour les performances
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_projet_stade          ON projet(stade);
CREATE INDEX IF NOT EXISTS idx_projet_id_unite       ON projet(id_unite);
CREATE INDEX IF NOT EXISTS idx_lot_id_projet         ON lot(id_projet);
CREATE INDEX IF NOT EXISTS idx_lot_id_departement    ON lot(id_departement);
CREATE INDEX IF NOT EXISTS idx_phase_id_lot          ON phase(id_lot);
CREATE INDEX IF NOT EXISTS idx_document_id_projet    ON document(id_projet);
CREATE INDEX IF NOT EXISTS idx_document_id_phase     ON document(id_phase);
CREATE INDEX IF NOT EXISTS idx_document_statut       ON document(statut);
CREATE INDEX IF NOT EXISTS idx_historique_entite     ON historique(entite_type, entite_id);
CREATE INDEX IF NOT EXISTS idx_historique_timestamp  ON historique(timestamp);
CREATE INDEX IF NOT EXISTS idx_utilisateur_role      ON utilisateur(role);
CREATE INDEX IF NOT EXISTS idx_unite_id_cmd          ON unite(id_cmd);

-- =============================================================================
-- SEED : Utilisateur administrateur par défaut
-- Mot de passe : Admin@1234  (hash bcrypt rounds=10)
-- À CHANGER EN PRODUCTION !
-- =============================================================================
INSERT INTO utilisateur (
    nom, prenom, messager, mot_pass, role, grade,
    adresse, is_chef_project
)
VALUES (
    'Admin',
    'Super',
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "Admin@1234"
    'admin',
    '',
    '',
    FALSE
)
ON CONFLICT (messager) DO NOTHING;
