from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
from ..models.wallet import RechargeStatus, TransactionType


class UserBalanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    balance: Decimal
    frozen_balance: Decimal
    total_recharge: Decimal
    total_consumption: Decimal
    created_at: datetime
    updated_at: datetime


class RechargeCreate(BaseModel):
    user_id: int
    amount: Decimal
    remark: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("充值金额必须大于0")
        return v


class RechargeOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_no: str
    user_id: int
    operator_id: int
    amount: Decimal
    remark: Optional[str] = None
    status: RechargeStatus
    created_at: datetime
    updated_at: datetime
    user_info: Optional[dict] = None
    operator_info: Optional[dict] = None


class TransactionRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_no: str
    user_id: int
    type: TransactionType
    amount: Decimal
    balance_after: Decimal
    order_id: Optional[int] = None
    recharge_order_id: Optional[int] = None
    remark: Optional[str] = None
    created_at: datetime
    order_info: Optional[dict] = None


class PaymentPasswordSet(BaseModel):
    payment_password: str

    @field_validator("payment_password")
    @classmethod
    def password_must_be_six_digits(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("支付密码必须是6位数字")
        return v


class PaymentPasswordUpdate(BaseModel):
    old_payment_password: str
    new_payment_password: str

    @field_validator("new_payment_password")
    @classmethod
    def password_must_be_six_digits(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("支付密码必须是6位数字")
        return v


class BalancePayRequest(BaseModel):
    payment_password: str
    amount: Decimal
