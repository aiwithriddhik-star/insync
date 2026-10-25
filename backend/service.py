from pathlib import Path
from typing import Annotated, Optional

import joblib as jl
import numpy as np
import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field, field_validator

MODEL_PATH = Path(__file__).resolve().parent.parent / "training/results/final_model.joblib"
read = jl.load(MODEL_PATH)

router = APIRouter(
    prefix="/api",
    tags=["psoc"]
)

YesNo = Annotated[Optional[int], Field(ge=0, le=1)]


class PSOCinput(BaseModel):
    """The 16 features the final model was trained on (training/preprocessed_data/features.json).
    Each alias is the exact training column name, because the saved pipeline selects columns by name.
    Every field is optional: null/missing becomes NaN and the pipeline's imputers fill it in."""
    model_config = ConfigDict(populate_by_name=True)

    # numeric
    follicle_no_r: Optional[float] = Field(default=None, alias="Follicle No. (R)")
    follicle_no_l: Optional[float] = Field(default=None, alias="Follicle No. (L)")
    cycle_length_days: Optional[float] = Field(default=None, alias="Cycle length(days)")
    amh_ng_ml: Optional[float] = Field(default=None, alias="AMH(ng/mL)")
    bmi: Optional[float] = Field(default=None, alias="BMI")
    weight_kg: Optional[float] = Field(default=None, alias="Weight (Kg)")
    age_yrs: Optional[float] = Field(default=None, alias="Age (yrs)")
    waist_inch: Optional[float] = Field(default=None, alias="Waist(inch)")
    hip_inch: Optional[float] = Field(default=None, alias="Hip(inch)")

    # categorical: Yes/No columns are coded 1/0, Cycle(R/I) has codes 2, 4, 5.
    skin_darkening: YesNo = Field(default=None, alias="Skin darkening (Y/N)")
    hair_growth: YesNo = Field(default=None, alias="hair growth(Y/N)")
    weight_gain: YesNo = Field(default=None, alias="Weight gain(Y/N)")
    cycle_r_i: Optional[int] = Field(default=None, alias="Cycle(R/I)")
    fast_food: YesNo = Field(default=None, alias="Fast food (Y/N)")
    pimples: YesNo = Field(default=None, alias="Pimples(Y/N)")
    hair_loss: YesNo = Field(default=None, alias="Hair loss(Y/N)")

    @field_validator("cycle_r_i")
    @classmethod
    def _cycle_code(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v not in (2, 4, 5):
            raise ValueError("Cycle(R/I) must be 2, 4 or 5")
        return v


@router.post("/psoc")
def input_psoc(data: PSOCinput):
    # The pipeline expects a DataFrame with the training column names, not a list of dicts
    values = data.model_dump(by_alias=True)
    missing = [k for k, v in values.items() if v is None]
    row = pd.DataFrame([{k: (np.nan if v is None else v) for k, v in values.items()}])
    probability = float(read.predict_proba(row)[0, 1])
    return {
        "pcos_probability": probability,
        "prediction": int(probability >= 0.5),
        "missing_fields": missing,
    }
