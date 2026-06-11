-- GymMate — справочная схема v2 (PostgreSQL DDL).
--
-- ВНИМАНИЕ: рабочий бэкенд — PocketBase (SQLite), реальная схема создаётся
-- миграциями из pb_migrations/ (см. 1749500007_v2_schema.js и SCHEMA.md).
-- Этот файл — каноническое описание модели данных на случай переезда на Postgres.
--
-- Слои модели:
--   exercises                         — глобальный каталог упражнений
--   programs / program_workouts /
--   program_workout_exercises        — шаблоны программ (публичные или пользовательские)
--   user_programs / user_program_* — независимый форк программы пользователем
--   workout_logs / workout_log_*   — immutable-история выполнения со snapshot-полями

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ============================================================================
-- Каталог упражнений
-- ============================================================================

CREATE TABLE exercises (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    slug            text NOT NULL UNIQUE,
    primary_muscle  text NOT NULL,
    equipment       text,
    difficulty      text,
    instructions    text,
    videos          jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercises_primary_muscle ON exercises (primary_muscle);

-- ============================================================================
-- Шаблоны программ
-- ============================================================================

CREATE TABLE programs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_user_id uuid REFERENCES users (id) ON DELETE SET NULL, -- NULL = системная программа
    name            text NOT NULL,
    description     text,
    difficulty      smallint CHECK (difficulty BETWEEN 1 AND 5), -- NULL = не указана
    is_public       boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_programs_creator_user_id ON programs (creator_user_id);
CREATE INDEX idx_programs_is_public ON programs (is_public) WHERE is_public;

CREATE TABLE program_workouts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id  uuid NOT NULL REFERENCES programs (id) ON DELETE CASCADE,
    name        text NOT NULL,
    description text,
    order_index integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_program_workouts_program_id ON program_workouts (program_id);

CREATE TABLE program_workout_exercises (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_workout_id uuid NOT NULL REFERENCES program_workouts (id) ON DELETE CASCADE,
    exercise_id        uuid NOT NULL REFERENCES exercises (id) ON DELETE RESTRICT,
    order_index        integer NOT NULL DEFAULT 0,
    target_sets        smallint NOT NULL CHECK (target_sets >= 1),
    target_reps_min    smallint CHECK (target_reps_min >= 0),
    target_reps_max    smallint CHECK (target_reps_max >= target_reps_min),
    target_weight      numeric(6, 2) CHECK (target_weight >= 0),
    rest_seconds       integer CHECK (rest_seconds >= 0),
    notes              text
);

CREATE INDEX idx_program_workout_exercises_workout_id ON program_workout_exercises (program_workout_id);
CREATE INDEX idx_program_workout_exercises_exercise_id ON program_workout_exercises (exercise_id);

-- ============================================================================
-- Пользовательские программы (независимый fork шаблона)
-- ============================================================================

CREATE TABLE user_programs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    source_program_id uuid REFERENCES programs (id) ON DELETE SET NULL, -- откуда форкнули
    name              text NOT NULL,
    description       text,
    started_at        timestamptz,
    archived_at       timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_programs_user_id ON user_programs (user_id);
CREATE INDEX idx_user_programs_source_program_id ON user_programs (source_program_id);

CREATE TABLE user_program_workouts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_program_id uuid NOT NULL REFERENCES user_programs (id) ON DELETE CASCADE,
    name            text NOT NULL,
    order_index     integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_user_program_workouts_user_program_id ON user_program_workouts (user_program_id);

CREATE TABLE user_program_workout_exercises (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_program_workout_id uuid NOT NULL REFERENCES user_program_workouts (id) ON DELETE CASCADE,
    exercise_id             uuid NOT NULL REFERENCES exercises (id) ON DELETE RESTRICT,
    order_index             integer NOT NULL DEFAULT 0,
    target_sets             smallint NOT NULL CHECK (target_sets >= 1),
    target_reps_min         smallint CHECK (target_reps_min >= 0),
    target_reps_max         smallint CHECK (target_reps_max >= target_reps_min),
    target_weight           numeric(6, 2) CHECK (target_weight >= 0),
    rest_seconds            integer CHECK (rest_seconds >= 0),
    notes                   text
);

CREATE INDEX idx_user_program_workout_exercises_workout_id
    ON user_program_workout_exercises (user_program_workout_id);
CREATE INDEX idx_user_program_workout_exercises_exercise_id
    ON user_program_workout_exercises (exercise_id);

-- ============================================================================
-- Логи выполнения (immutable-история; snapshot-поля защищают от изменений
-- каталога и программ задним числом)
-- ============================================================================

CREATE TABLE workout_logs (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    user_program_id         uuid REFERENCES user_programs (id) ON DELETE SET NULL,
    user_program_workout_id uuid REFERENCES user_program_workouts (id) ON DELETE SET NULL,
    name_snapshot           text NOT NULL,
    started_at              timestamptz NOT NULL,
    completed_at            timestamptz,
    duration_seconds        integer CHECK (duration_seconds >= 0),
    notes                   text,
    created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_logs_user_id ON workout_logs (user_id);
CREATE INDEX idx_workout_logs_user_program_id ON workout_logs (user_program_id);
CREATE INDEX idx_workout_logs_started_at ON workout_logs (user_id, started_at DESC);

CREATE TABLE workout_log_exercises (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id         uuid NOT NULL REFERENCES workout_logs (id) ON DELETE CASCADE,
    exercise_id            uuid REFERENCES exercises (id) ON DELETE SET NULL, -- snapshot переживёт удаление
    exercise_name_snapshot text NOT NULL,
    order_index            integer NOT NULL DEFAULT 0,
    notes                  text
);

CREATE INDEX idx_workout_log_exercises_workout_log_id ON workout_log_exercises (workout_log_id);
CREATE INDEX idx_workout_log_exercises_exercise_id ON workout_log_exercises (exercise_id);

CREATE TABLE workout_log_sets (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_exercise_id uuid NOT NULL REFERENCES workout_log_exercises (id) ON DELETE CASCADE,
    set_index               smallint NOT NULL CHECK (set_index >= 1),
    reps                    smallint CHECK (reps >= 0),
    weight                  numeric(6, 2) CHECK (weight >= 0),
    duration_seconds        integer CHECK (duration_seconds >= 0),
    distance_meters         numeric(9, 2) CHECK (distance_meters >= 0),
    rir                     numeric(3, 1) CHECK (rir BETWEEN 0 AND 10),
    rpe                     numeric(3, 1) CHECK (rpe BETWEEN 0 AND 10),
    is_warmup               boolean NOT NULL DEFAULT false,
    completed               boolean NOT NULL DEFAULT false,
    created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_log_sets_workout_log_exercise_id
    ON workout_log_sets (workout_log_exercise_id);
