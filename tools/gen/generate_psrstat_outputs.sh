#!/usr/bin/env bash
# tools/gen/generate_psrstat_outputs.sh — psrstat text artifacts.
#
# Filenames (tryit.jsx → CATALOG → psrstat):
#   plots/psrstat/<ar>/snr.txt + .annot.json
#   plots/psrstat/<ar>/profile.txt + .annot.json

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
HELPERS="$(dirname "${BASH_SOURCE[0]}")/_annot_helpers.py"

for ar in J0437-4715 J1909-3744; do
    src="${SRC[$ar]:-}"
    [[ -f "$src" ]] || { log_skip "no archive for $ar" "$src"; continue; }
    out="$OUT/psrstat/$ar"
    mkdir -p "$out"

    run "psrstat snr ($ar)" -- bash -c \
        "psrstat -jFT -c 'snr,off:avg,off:rms' '$src' > '$out/snr.txt'" \
        && python3 "$HELPERS" psrstat "$out/snr.txt" "$out/snr.annot.json" \
        && append_manifest "psrstat/$ar/snr.txt" "$ar" "psrstat snr" \
            "psrstat -jFT -c \"snr,off:avg,off:rms\" <src> > <out>/snr.txt"

    run "psrstat profile ($ar)" -- bash -c \
        "psrstat -jFTp -c 'all:bin:mean' '$src' > '$out/profile.txt'" \
        && python3 "$HELPERS" psrstat "$out/profile.txt" "$out/profile.annot.json" \
        && append_manifest "psrstat/$ar/profile.txt" "$ar" "psrstat per-bin mean" \
            "psrstat -jFTp -c \"all:bin:mean\" <src> > <out>/profile.txt"
done
