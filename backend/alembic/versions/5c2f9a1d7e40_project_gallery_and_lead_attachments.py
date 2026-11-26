"""project gallery and lead attachments

Revision ID: 5c2f9a1d7e40
Revises: 01ae1da7c1ce
Create Date: 2026-11-26 12:00:00

Projects get a list of extra photographs for their case-study page; leads get
the drawings or documents an enquirer attached. Both JSON lists, defaulting to
empty so existing rows need no backfill.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '5c2f9a1d7e40'
down_revision: Union[str, None] = '01ae1da7c1ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('gallery', sa.JSON(), server_default='[]', nullable=False))
    op.add_column('leads', sa.Column('attachments', sa.JSON(), server_default='[]', nullable=False))


def downgrade() -> None:
    op.drop_column('leads', 'attachments')
    op.drop_column('projects', 'gallery')
