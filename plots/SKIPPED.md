# Skipped / failed plot generations

_Last regenerated 2026-05-12 after fixing pam/paz/psredit invocations.
Pre-fix entries (pam/paz with `-o` flag, psredit `-o`) are obsolete; those
artifacts succeeded on re-run._

## Genuine skips

- **pav profile (J0437-4715)** — `pav -SFTp -j D <src>`: archive has
  incomplete polarisation information; `-S` (Stokes transform) cannot run.
- **pav profile (J1909-3744)** — same: incomplete polarisation information.
- **pav stokes (J0437-4715)** — `pav -SFTpd -j D <src>`: same root cause.
- **pav stokes (J1909-3744)** — same: incomplete polarisation information.

The two reference archives store total intensity only (not full Stokes),
so `pav -S*` views are unavailable.  The UI falls back to the copyable-
command panel for these four catalog entries, which is the desired
graceful degradation.
