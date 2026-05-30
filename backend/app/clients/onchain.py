"""On-chain anchoring of the pulse proof hash on Injective.

Two halves:

* ANCHOR (write) — broadcasts a tiny self-transfer on the Injective testnet
  whose memo is `ninjaping:<sha256>`, permanently committing the AI's call to
  the chain at emission time. Requires `injective-py` (Injective uses
  `ethsecp256k1` signing, so a coincurve/keccak-capable runtime is needed — see
  the provided Dockerfile) and a faucet-funded mnemonic in
  `INJECTIVE_PROOF_MNEMONIC`. Import-guarded: if the SDK is unavailable the app
  runs normally with anchoring disabled.

* VERIFY (read) — re-fetches the anchored tx from the public Injective testnet
  LCD and confirms the on-chain memo carries the pulse's hash. This path needs
  no SDK and is exercised by `/api/verify/{id}`.
"""
from __future__ import annotations

import asyncio

import httpx

from ..config import settings

# ---- write path (optional, requires injective-py + funded key) -----------
try:  # pragma: no cover - depends on runtime having the SDK
    from pyinjective.async_client import AsyncClient
    from pyinjective.core.network import Network
    from pyinjective.transaction import Transaction
    from pyinjective.wallet import PrivateKey

    _SDK = True
except Exception:  # SDK not installed (e.g. no C toolchain) → anchoring off
    _SDK = False

MEMO_PREFIX = "ninjaping:"


class OnChainAnchor:
    @property
    def enabled(self) -> bool:
        return _SDK and settings.proof_anchor_enabled and bool(settings.injective_proof_mnemonic)

    async def anchor(self, proof_hash: str) -> str | None:
        """Broadcast `ninjaping:<hash>` as a tx memo on Injective testnet.

        Returns the tx hash, or None if disabled / on failure (never raises into
        the hot path).
        """
        if not self.enabled:
            return None
        try:
            return await asyncio.wait_for(self._broadcast(proof_hash), timeout=20)
        except Exception:
            return None

    async def _broadcast(self, proof_hash: str) -> str | None:
        network = Network.testnet()
        client = AsyncClient(network)
        priv = PrivateKey.from_mnemonic(settings.injective_proof_mnemonic)
        pub = priv.to_public_key()
        address = pub.to_address()
        await client.fetch_account(address.to_acc_bech32())

        composer = await client.composer()
        msg = composer.msg_send(
            from_address=address.to_acc_bech32(),
            to_address=address.to_acc_bech32(),
            amount=0.000001,
            denom="INJ",
        )
        tx = (
            Transaction()
            .with_messages(msg)
            .with_sequence(client.get_sequence())
            .with_account_num(client.get_number())
            .with_chain_id(network.chain_id)
            .with_memo(MEMO_PREFIX + proof_hash)
            .with_gas(200000)
        )
        gas_price = 500000000
        fee = [composer.coin(amount=gas_price * 200000, denom="inj")]
        tx = tx.with_fee(fee)
        sign_doc = tx.get_sign_doc(pub)
        sig = priv.sign(sign_doc.SerializeToString())
        tx_raw_bytes = tx.get_tx_data(sig, pub)
        res = await client.broadcast_tx_sync_mode(tx_raw_bytes)
        return res.get("txhash") if isinstance(res, dict) else getattr(res, "txhash", None)

    # ---- read / verify path (no SDK; pure LCD) ---------------------------
    async def verify_anchor(self, tx_hash: str, proof_hash: str) -> dict:
        """Re-read the testnet tx and confirm its memo carries the proof hash."""
        url = f"{settings.injective_testnet_lcd}/cosmos/tx/v1beta1/txs/{tx_hash}"
        out = {"tx_hash": tx_hash, "found": False, "memo": None, "anchored": False,
               "explorer": f"https://testnet.explorer.injective.network/transaction/{tx_hash}"}
        try:
            async with httpx.AsyncClient(timeout=12.0) as c:
                r = await c.get(url)
                if r.status_code != 200:
                    return out
                memo = r.json().get("tx", {}).get("body", {}).get("memo", "")
                out["found"] = True
                out["memo"] = memo
                out["anchored"] = memo == MEMO_PREFIX + proof_hash
        except Exception:
            pass
        return out


onchain_anchor = OnChainAnchor()
