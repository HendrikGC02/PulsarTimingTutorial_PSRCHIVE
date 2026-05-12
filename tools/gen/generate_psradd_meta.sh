#!/usr/bin/env bash
# tools/gen/generate_psradd_meta.sh — vap summary after psradd combine.
#
# Filenames (tryit.jsx → CATALOG → psradd):
#   plots/psradd/<ar>/combine.meta.txt + .meta.annot.json

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
HELPERS="$(dirname "${BASH_SOURCE[0]}")/_annot_helpers.py"

for ar in J0437-4715 J1909-3744; do
    src="${SRC[$ar]:-}"
    [[ -f "$src" ]] || { log_skip "no archive for $ar" "$src"; continue; }
    out="$OUT/psradd/$ar"
    mkdir -p "$out"

    # Synthesise two halves of the same archive so we have something to add.
    ep1="$WORK/${ar}.ep1.ar"
    ep2="$WORK/${ar}.ep2.ar"
    combined="$WORK/${ar}.combined.ar"

    if [[ ! -f "$ep1" || ! -f "$ep2" ]]; then
        # split sub-integrations: even indices → ep1, odd → ep2
        run "psrsplit ($ar)" -- bash -c "
            nsub=\$(vap -c nsubint '$src' | awk 'NR==2{print \$2}')
            half=\$((nsub / 2))
            psredit -c \"sub:start=0,sub:end=\$((half-1))\" -o '$ep1' '$src'
            psredit -c \"sub:start=\$half,sub:end=\$((nsub-1))\" -o '$ep2' '$src'
        " || true
    fi

    if [[ -f "$ep1" && -f "$ep2" ]]; then
        run "psradd ($ar)" -- psradd -o "$combined" "$ep1" "$ep2" \
            && vap -c "name,nbin,nchan,nsubint,npol,length,bw,dm" "$combined" > "$out/combine.meta.txt" \
            && python3 "$HELPERS" vap "$out/combine.meta.txt" "$out/combine.meta.annot.json" \
            && append_manifest "psradd/$ar/combine.meta.txt" "$ar" "psradd ep1+ep2" \
                "psradd -o <combined>.ar <ep1>.ar <ep2>.ar; vap -c \"name,nbin,...\" <combined>.ar"
    else
        log_skip "could not split $ar into ep1/ep2 for psradd demo" "psredit"
    fi
done
