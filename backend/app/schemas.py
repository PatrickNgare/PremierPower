from pydantic import BaseModel, Field, field_validator


class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=6, max_length=60)
    area: str = Field(default="", max_length=120)
    property: str = Field(default="", max_length=60)
    message: str = Field(default="", max_length=4000)

    @field_validator("name", "phone", "area", "property", "message")
    @classmethod
    def strip(cls, v: str) -> str:
        return v.strip()


class ServiceOut(BaseModel):
    slug: str
    title: str
    lede: str
    body: str
    signs: list[str]

    class Config:
        from_attributes = True


class ProjectOut(BaseModel):
    title: str
    location: str
    summary: str
    image_open_url: str
    image_open_alt: str
    image_finished_url: str
    image_finished_alt: str

    class Config:
        from_attributes = True


class TestimonialOut(BaseModel):
    name: str
    location: str
    job: str
    quote: str

    class Config:
        from_attributes = True
