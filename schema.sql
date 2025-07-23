/* ──────────────────────────────────────────
   Brew Agent schema  –  Supabase / Postgres
   ────────────────────────────────────────── */

/* 1️⃣  ENUM TYPES
   ─────────────────────────── */
-- CREATE TYPE brew_method    AS ENUM ('V60', 'ESPRESSO');
-- CREATE TYPE crema_quality  AS ENUM ('GOOD','PALE_THIN','DARK_SPOTTY','NONE');
-- CREATE TYPE finish_tag     AS ENUM ('CLEAN','SWEET','DRY','BITTER','LINGERING','SHORT');
-- CREATE TYPE flavor_tag     AS ENUM ('FRUITY','FLORAL','CHOCOLATE','NUTTY','SWEET',
--                                     'SPICY','HERBAL','EARTHY','CITRUS','TROPICAL',
--                                     'STONE_FRUIT','CARAMEL','SYRUPY','BALANCED',
--                                     'SAVORY','TOASTED','SMOKY','DULL');

/* 2️⃣  BEANS TABLE
   ─────────────────────────── */
CREATE TABLE beans (
  id          uuid PRIMARY KEY                DEFAULT gen_random_uuid(),
  name        text            NOT NULL,
  roaster     text,
  roast_date  date,
  type        text,
  process     text,
  origin      text,
  notes       text,
  active      boolean         NOT NULL        DEFAULT true,
  times_used  integer                         DEFAULT 0,
  created_at  timestamptz      NOT NULL       DEFAULT now()
);

/* 4️⃣  SIMPLE-MODE RATING TABLE
   one-to-one with brews.id
   ─────────────────────────── */
CREATE TABLE brews (
  id               uuid PRIMARY KEY          DEFAULT gen_random_uuid(),
  bean_id          uuid                      REFERENCES beans(id) ON DELETE CASCADE,
  method           text                      NOT NULL, -- enforced via app logic

  -- core recipe
  dose_in_g        numeric(6,2)              NOT NULL,
  yield_out_g      numeric(6,2)              NOT NULL,
  brew_time_sec    integer                   NOT NULL,
  water_temp_c     integer                   NOT NULL,
  grind_setting    integer                   NOT NULL,

  -- meta
  brewed_at        timestamptz               NOT NULL DEFAULT now(),
  notes            text,

  -- AI context
  ai_used          boolean                   NOT NULL DEFAULT false,
  ai_suggestion    text,

  -- flattened bean info for LLM
  bean_name        text,
  bean_origin      text,
  bean_process     text,
  bean_notes       text,

  -- simplified ratings (previously in separate table)
  acidity              smallint,
  bitterness           smallint,
  body                 smallint,
  balance              smallint,
  clarity              smallint,
  sweetness_detected   boolean,
  crema_quality        text,         -- you can enforce this enum in app layer
  finish_tags          text[],       -- can treat as enum-like in LLM prompt
  flavor_tags          text[],
  user_notes           text,
  overall_rating       smallint
);

CREATE INDEX brews_bean_idx  ON brews(bean_id);
CREATE INDEX brews_date_idx  ON brews(brewed_at DESC);

/* 5️⃣  ROW-LEVEL SECURITY (demo)
   service_role key = full access
   ─────────────────────────── */
ALTER TABLE beans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE brews           ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_full ON beans           FOR ALL USING (true);
CREATE POLICY service_full ON brews           FOR ALL USING (true);

/* ─────────  END OF SCRIPT  ───────── */
