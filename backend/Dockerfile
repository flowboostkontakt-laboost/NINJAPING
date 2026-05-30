# NinjaPing backend. Python 3.12 base so the optional on-chain anchoring deps
# (injective-py / coincurve / keccak) can build — they have no Python 3.14 wheels.
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc git automake libtool pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Optional: enables live on-chain proof anchoring (set PROOF_ANCHOR_ENABLED=true
# and a funded INJECTIVE_PROOF_MNEMONIC to activate). Image still builds if this
# fails, anchoring simply stays disabled.
RUN pip install --no-cache-dir injective-py || true

COPY . .

ENV PORT=8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
