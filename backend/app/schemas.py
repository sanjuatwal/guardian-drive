from pydantic import BaseModel


class EventIn(BaseModel):
    device_id: str
    event_id: int
    sensor_type: str
    severity: int
    timestamp_ms: int
    payload: str = ""


class EventOut(EventIn):
    id: int
    received_at: str


class CommandIn(BaseModel):
    device_id: str
    command: str


class CommandOut(BaseModel):
    id: int
    device_id: str
    command: str
    created_at: str
