#!/usr/bin/env bash
# tools/gen/generate_vap_outputs.sh — vap text artifacts.
#
# Filenames (tryit.jsx → CATALOG → vap-header):
#   plots/vap/<ar>/header.txt + .annot.json
#   plots/vap/<ar>/all.txt    + .annot.json

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
HELPERS="$(dirname "${BASH_SOURCE[0]}")/_annot_helpers.py"

for ar in J0437-4715 J1909-3744; do
    src="${SRC[$ar]:-}"
    [[ -f "$src" ]] || { log_skip "no archive for $ar" "$src"; continue; }
    out="$OUT/vap/$ar"
    mkdir -p "$out"

    # compact header
    run "vap header ($ar)" -- bash -c \
        "vap -c 'name,nbin,nchan,nsubint,length,bw' '$src' > '$out/header.txt'" \
        && python3 "$HELPERS" vap "$out/header.txt" "$out/header.annot.json" \
        && append_manifest "vap/$ar/header.txt" "$ar" "vap compact" \
            "vap -c \"name,nbin,nchan,nsubint,length,bw\" <src> > <out>/header.txt"

    # full table
    run "vap full ($ar)" -- bash -c \
        "vap -c 'name,mjd,length,bw,freq,nchan,nbin,nsubint,npol,dm,rm,telescop,site' '$src' > '$out/all.txt'" \
        && python3 "$HELPERS" vap "$out/all.txt" "$out/all.annot.json" \
        && append_manifest "vap/$ar/all.txt" "$ar" "vap full" \
            "vap -c \"name,mjd,length,bw,freq,nchan,nbin,nsubint,npol,dm,rm,telescop,site\" <src> > <out>/all.txt"
done
