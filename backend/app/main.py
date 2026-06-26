from fastapi import FastAPI

from .database import get_connection, init_db
from .schemas import CommandIn, CommandOut, EventIn, EventOut

app = FastAPI(title="Guardian Drive API")

VALID_COMMANDS = {"siren_on", "siren_off", "start_inhibit"}


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.post("/api/events", response_model=EventOut)
def create_event(event: EventIn) -> EventOut:
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            INSERT INTO events (device_id, event_id, sensor_type, severity, timestamp_ms, payload)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                event.device_id,
                event.event_id,
                event.sensor_type,
                event.severity,
                event.timestamp_ms,
                event.payload,
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM events WHERE id = ?", (cursor.lastrowid,)).fetchone()
    finally:
        conn.close()

    return EventOut(**dict(row))


@app.get("/api/timeline", response_model=list[EventOut])
def get_timeline(device_id: str | None = None) -> list[EventOut]:
    conn = get_connection()
    try:
        if device_id:
            rows = conn.execute(
                "SELECT * FROM events WHERE device_id = ? ORDER BY timestamp_ms DESC",
                (device_id,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM events ORDER BY timestamp_ms DESC").fetchall()
    finally:
        conn.close()

    return [EventOut(**dict(row)) for row in rows]


@app.post("/api/commands", response_model=CommandOut)
def create_command(command: CommandIn) -> CommandOut:
    if command.command not in VALID_COMMANDS:
        raise ValueError(f"Unknown command '{command.command}'. Valid: {sorted(VALID_COMMANDS)}")

    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO commands (device_id, command) VALUES (?, ?)",
            (command.device_id, command.command),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM commands WHERE id = ?", (cursor.lastrowid,)).fetchone()
    finally:
        conn.close()

    return CommandOut(**dict(row))


@app.get("/api/commands", response_model=list[CommandOut])
def get_commands(device_id: str) -> list[CommandOut]:
    """Polling endpoint for the ESP32. Returns undelivered commands and marks them delivered."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM commands WHERE device_id = ? AND delivered = 0 ORDER BY id ASC",
            (device_id,),
        ).fetchall()
        ids = [row["id"] for row in rows]
        if ids:
            placeholders = ",".join("?" for _ in ids)
            conn.execute(f"UPDATE commands SET delivered = 1 WHERE id IN ({placeholders})", ids)
            conn.commit()
    finally:
        conn.close()

    return [CommandOut(**dict(row)) for row in rows]
