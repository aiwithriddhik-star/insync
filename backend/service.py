import os
from typing import Annotated
import uuid
from fastapi import APIRouter, File, Form, HTTPException
import joblib as jl
read = jl.load('../training/results/final_model.joblib')
router = APIRouter(
    prefix="/api",
    tags=["psoc"]
)
import pandas as pd
from pydantic import BaseModel, ConfigDict, Field, field_validator

YesNo = Annotated[int, Field(ge=0, le=1)]


class PSOCinput(BaseModel):
    """The 16 features the final model was trained on (training/preprocessed_data/features.json).
    Each alias is the exact training column name, because the saved pipeline selects columns by name."""
    model_config = ConfigDict(populate_by_name=True)

    # numeric
    follicle_no_r: float = Field(alias="Follicle No. (R)")
    follicle_no_l: float = Field(alias="Follicle No. (L)")
    cycle_length_days: float = Field(alias="Cycle length(days)")
    amh_ng_ml: float = Field(alias="AMH(ng/mL)")
    bmi: float = Field(alias="BMI")
    weight_kg: float = Field(alias="Weight (Kg)")
    age_yrs: float = Field(alias="Age (yrs)")
    waist_inch: float = Field(alias="Waist(inch)")
    hip_inch: float = Field(alias="Hip(inch)")

    # categorical: Yes/No columns are coded 1/0, Cycle(R/I) has codes 2, 4, 5.
    # Plain ints (not Literal) because Form fields arrive as strings and ints convert "1" -> 1
    skin_darkening: YesNo = Field(alias="Skin darkening (Y/N)")
    hair_growth: YesNo = Field(alias="hair growth(Y/N)")
    weight_gain: YesNo = Field(alias="Weight gain(Y/N)")
    cycle_r_i: int = Field(alias="Cycle(R/I)")
    fast_food: YesNo = Field(alias="Fast food (Y/N)")
    pimples: YesNo = Field(alias="Pimples(Y/N)")
    hair_loss: YesNo = Field(alias="Hair loss(Y/N)")

    @field_validator("cycle_r_i")
    @classmethod
    def _cycle_code(cls, v: int) -> int:
        if v not in (2, 4, 5):
            raise ValueError("Cycle(R/I) must be 2, 4 or 5")
        return v


@router.post("/psoc")
async def input_psoc(
   data:Annotated[PSOCinput, Form()]
   ):
     # The pipeline expects a DataFrame with the training column names, not a list of dicts
     row = pd.DataFrame([data.model_dump(by_alias=True)])
     probability = float(read.predict_proba(row)[0, 1])
     return {"pcos_probability": probability, "prediction": int(probability >= 0.5)}


