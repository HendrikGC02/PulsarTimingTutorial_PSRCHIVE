#!/usr/bin/env bash
# tools/gen/generate_paz_variants.sh — paz with different zap strategies.
#
# Filenames (tryit.jsx → CATALOG → paz):
#   plots/paz/<ar>/auto.png         (paz -r)
#   plots/paz/<ar>/manual-chans.png (paz -z "100 101 102")
#   plots/paz/<ar>/freqrange.png    (paz -F "1200 1280")
#   plots/paz/<ar>/badsub.png       (paz -w "0 5")

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

for ar in J0437-4715 J1909-3744; do
    src="${SRC[$ar]:-}"
    [[ -f "$src" ]] || { log_skip "no archive for $ar" "$src"; continue; }
    out="$OUT/paz/$ar"
    mkdir -p "$out"

    # auto
    r="$WORK/${ar}.pazAuto.ar"
    run "paz -r ($ar)" -- paz -r -o "$r" "$src" \
        && run "psrplot freq paz-auto ($ar)" -- psrplot $GEOM -p freq "$r" -D "$out/auto.png"/png \
        && append_manifest "paz/$ar/auto.png" "$ar" "paz -r" \
            "paz -r -o <r>.ar <src>; psrplot $GEOM -p freq <r>.ar -D <out>/png"

    # manual channels
    r="$WORK/${ar}.pazZchans.ar"
    run "paz -z chans ($ar)" -- paz -z "100 101 102" -o "$r" "$src" \
        && run "psrplot freq paz-zchans ($ar)" -- psrplot $GEOM -p freq "$r" -D "$out/manual-chans.png"/png \
        && append_manifest "paz/$ar/manual-chans.png" "$ar" 'paz -z "100 101 102"' \
            "paz -z \"100 101 102\" -o <r>.ar <src>; psrplot $GEOM -p freq <r>.ar -D <out>/png"

    # frequency range
    r="$WORK/${ar}.pazFrange.ar"
    run "paz -F range ($ar)" -- paz -F "1200 1280" -o "$r" "$src" \
        && run "psrplot freq paz-Frange ($ar)" -- psrplot $GEOM -p freq "$r" -D "$out/freqrange.png"/png \
        && append_manifest "paz/$ar/freqrange.png" "$ar" 'paz -F "1200 1280"' \
            "paz -F \"1200 1280\" -o <r>.ar <src>; psrplot $GEOM -p freq <r>.ar -D <out>/png"

    # bad subints
    r="$WORK/${ar}.pazWsub.ar"
    run "paz -w sub ($ar)" -- paz -w "0 5" -o "$r" "$src" \
        && run "psrplot time paz-Wsub ($ar)" -- psrplot $GEOM -p time "$r" -D "$out/badsub.png"/png \
        && append_manifest "paz/$ar/badsub.png" "$ar" 'paz -w "0 5"' \
            "paz -w \"0 5\" -o <r>.ar <src>; psrplot $GEOM -p time <r>.ar -D <out>/png"
done
