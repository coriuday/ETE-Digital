"""add_headline_to_profiles_and_fts_to_jobs

Revision ID: g1h2i3j4k5l6
Revises: f1a73524a674
Create Date: 2026-06-15 10:00:00.000000

Changes:
  - user_profiles: add headline VARCHAR(150)
  - jobs: add fts_vector tsvector, GIN index, auto-update trigger
  - company_profiles: add slug VARCHAR(255) UNIQUE
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "g1h2i3j4k5l6"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def _column_exists(conn, table: str, column: str) -> bool:
    return bool(
        conn.execute(
            sa.text("SELECT 1 FROM information_schema.columns " "WHERE table_name = :t AND column_name = :c"),
            {"t": table, "c": column},
        ).scalar()
    )


def _index_exists(conn, index_name: str, table_name: str) -> bool:
    return bool(
        conn.execute(
            sa.text("SELECT 1 FROM pg_indexes WHERE tablename = :t AND indexname = :n"),
            {"t": table_name, "n": index_name},
        ).scalar()
    )


def _trigger_exists(conn, trigger_name: str, table_name: str) -> bool:
    return bool(
        conn.execute(
            sa.text("SELECT 1 FROM information_schema.triggers " "WHERE trigger_name = :n AND event_object_table = :t"),
            {"n": trigger_name, "t": table_name},
        ).scalar()
    )


def upgrade():
    conn = op.get_bind()

    # ── 1. user_profiles: add headline ───────────────────────────────────────
    if not _column_exists(conn, "user_profiles", "headline"):
        op.add_column(
            "user_profiles",
            sa.Column("headline", sa.String(length=150), nullable=True),
        )

    # ── 2. company_profiles: add slug ────────────────────────────────────────
    if not _column_exists(conn, "company_profiles", "slug"):
        op.add_column(
            "company_profiles",
            sa.Column("slug", sa.String(length=255), nullable=True),
        )
        # Populate slug from existing company names (lowercase, hyphenated)
        conn.execute(
            sa.text(
                """
                UPDATE company_profiles
                SET slug = regexp_replace(
                    regexp_replace(lower(name), '[^a-z0-9\\s-]', '', 'g'),
                    '\\s+', '-', 'g'
                )
                WHERE slug IS NULL
                """
            )
        )
        # Make slug unique index (non-unique first to handle dupes, then enforce)
        if not _index_exists(conn, "ix_company_profiles_slug", "company_profiles"):
            op.create_index("ix_company_profiles_slug", "company_profiles", ["slug"], unique=True)

    # ── 3. jobs: add fts_vector + GIN index + trigger ────────────────────────
    if not _column_exists(conn, "jobs", "fts_vector"):
        conn.execute(sa.text("ALTER TABLE jobs ADD COLUMN fts_vector tsvector"))

    if not _index_exists(conn, "ix_jobs_fts", "jobs"):
        conn.execute(sa.text("CREATE INDEX ix_jobs_fts ON jobs USING gin(fts_vector)"))

    # Populate existing rows
    conn.execute(
        sa.text(
            """
            UPDATE jobs SET fts_vector =
              to_tsvector('english',
                COALESCE(title, '') || ' ' ||
                COALESCE(description, '') || ' ' ||
                COALESCE(company, '') || ' ' ||
                COALESCE(location, '') || ' ' ||
                COALESCE(array_to_string(
                    CASE WHEN skills_required IS NULL THEN ARRAY[]::text[]
                         ELSE ARRAY(SELECT jsonb_array_elements_text(skills_required))
                    END, ' '
                ), '')
              )
            WHERE fts_vector IS NULL
            """
        )
    )

    # Create auto-update trigger function
    conn.execute(
        sa.text(
            """
            CREATE OR REPLACE FUNCTION jobs_fts_update_trigger() RETURNS trigger AS $$
            BEGIN
              NEW.fts_vector :=
                to_tsvector('english',
                  COALESCE(NEW.title, '') || ' ' ||
                  COALESCE(NEW.description, '') || ' ' ||
                  COALESCE(NEW.company, '') || ' ' ||
                  COALESCE(NEW.location, '') || ' ' ||
                  COALESCE(array_to_string(
                    CASE WHEN NEW.skills_required IS NULL THEN ARRAY[]::text[]
                         ELSE ARRAY(SELECT jsonb_array_elements_text(NEW.skills_required))
                    END, ' '
                  ), '')
                );
              RETURN NEW;
            END $$ LANGUAGE plpgsql;
            """
        )
    )

    if not _trigger_exists(conn, "jobs_fts_trigger", "jobs"):
        conn.execute(
            sa.text(
                """
                CREATE TRIGGER jobs_fts_trigger
                  BEFORE INSERT OR UPDATE ON jobs
                  FOR EACH ROW EXECUTE FUNCTION jobs_fts_update_trigger()
                """
            )
        )


def downgrade():
    conn = op.get_bind()

    # Drop trigger
    conn.execute(sa.text("DROP TRIGGER IF EXISTS jobs_fts_trigger ON jobs"))
    conn.execute(sa.text("DROP FUNCTION IF EXISTS jobs_fts_update_trigger()"))

    # Drop FTS index + column
    if _index_exists(conn, "ix_jobs_fts", "jobs"):
        conn.execute(sa.text("DROP INDEX ix_jobs_fts"))

    if _column_exists(conn, "jobs", "fts_vector"):
        op.drop_column("jobs", "fts_vector")

    # Drop slug index + column
    if _index_exists(conn, "ix_company_profiles_slug", "company_profiles"):
        op.drop_index("ix_company_profiles_slug", table_name="company_profiles")

    if _column_exists(conn, "company_profiles", "slug"):
        op.drop_column("company_profiles", "slug")

    # Drop headline
    if _column_exists(conn, "user_profiles", "headline"):
        op.drop_column("user_profiles", "headline")
