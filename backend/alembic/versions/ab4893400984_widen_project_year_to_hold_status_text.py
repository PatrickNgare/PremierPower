"""widen project year to hold status text

Revision ID: ab4893400984
Revises: d17db59e63eb
Create Date: 2026-08-27 19:32:24.082237

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ab4893400984'
down_revision: Union[str, None] = 'd17db59e63eb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Widened because the column carries status, not a year: the company
    # profile lists "Ongoing — 85%", which is 13 characters and overflowed
    # String(12). It took the API down in a restart loop on first seed.
    op.alter_column(
        "projects", "year",
        existing_type=sa.VARCHAR(length=12),
        type_=sa.String(length=40),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "projects", "year",
        existing_type=sa.String(length=40),
        type_=sa.VARCHAR(length=12),
        existing_nullable=False,
    )
