"""initial_schema — restaurants table

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    sa.Enum("starter", "business", "pro", name="plantype").create(op.get_bind(), checkfirst=True)

    op.create_table(
        "restaurants",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column(
            "plan",
            sa.Enum("starter", "business", "pro", name="plantype"),
            nullable=False,
            server_default="starter",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "is_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_restaurants_email"),
        sa.UniqueConstraint("slug", name="uq_restaurants_slug"),
    )
    op.create_index("ix_restaurants_email", "restaurants", ["email"])
    op.create_index("ix_restaurants_slug", "restaurants", ["slug"])


def downgrade() -> None:
    op.drop_index("ix_restaurants_slug", "restaurants")
    op.drop_index("ix_restaurants_email", "restaurants")
    op.drop_table("restaurants")
    sa.Enum(name="plantype").drop(op.get_bind(), checkfirst=True)
