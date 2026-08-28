"""page sections: one table for every page

Revision ID: 4b438eb8350b
Revises: 198c34b63cdc
Create Date: 2026-08-28 15:18:07.348260

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4b438eb8350b'
down_revision: Union[str, None] = '198c34b63cdc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Generalise homepage_sections into page_sections.

    Renamed rather than recreated: the client may already have retitled a home
    page block, and dropping the table would discard that. Existing rows keep
    their content and are stamped page="/".
    """
    op.rename_table("homepage_sections", "page_sections")

    op.add_column("page_sections",
                  sa.Column("page", sa.String(length=200), nullable=False, server_default="/"))
    op.add_column("page_sections",
                  sa.Column("image_url", sa.String(length=500), nullable=False, server_default=""))
    op.add_column("page_sections",
                  sa.Column("image_alt", sa.String(length=300), nullable=False, server_default=""))

    # `key` was unique on its own; it cannot be, now that "hero" exists on
    # several pages. Uniqueness moves to the pair.
    op.drop_index("ix_homepage_sections_key", table_name="page_sections")
    op.create_index("ix_page_sections_key", "page_sections", ["key"])
    op.create_index("ix_page_sections_page", "page_sections", ["page"])
    op.create_unique_constraint("uq_page_sections_page_key", "page_sections", ["page", "key"])


def downgrade() -> None:
    op.drop_constraint("uq_page_sections_page_key", "page_sections", type_="unique")
    op.drop_index("ix_page_sections_page", table_name="page_sections")
    op.drop_index("ix_page_sections_key", table_name="page_sections")
    # Only the home page's rows fit the old shape.
    op.execute("DELETE FROM page_sections WHERE page <> '/'")
    op.drop_column("page_sections", "image_alt")
    op.drop_column("page_sections", "image_url")
    op.drop_column("page_sections", "page")
    op.rename_table("page_sections", "homepage_sections")
    op.create_index("ix_homepage_sections_key", "homepage_sections", ["key"], unique=True)
