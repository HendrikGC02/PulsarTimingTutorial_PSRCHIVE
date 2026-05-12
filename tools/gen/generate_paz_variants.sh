#!/usr/bin/env bash
# tools/gen/generate_paz_variants.sh — paz with different zap strategies.
#
# Filenames (tryit.jsx → CATALOG → paz):
#   plots/paz/<ar>/auto.png         (paz -r)
#   plots/paz/<ar>/manual-chans.png (paz -z "100 101 102")
#   plots/paz/<ar>/freqrange.png    (paz -F "1200 1280")
#   plots/paz/<ar>/badsub.png       (paz -w "0 5")

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

# paz writes to -O <dir> with an extension swap from -e <ext>; stage and rename.
paz_run() {
    # paz_run <label> <ext> <out_ar> -- <paz-args...>
    local label="$1" ext="$2" outar="$3"; shift 3
    [[ "${1-}" == "--" ]] && shift
    rm -f "$WORK/$(basename "$src" .ar).${ext}"
    run "$label" -- paz "$@" -e "$ext" -O "$WORK" "$src" || return 1
    mv -f "$WORK/$(basename "$src" .ar).${ext}" "$outar" 2>/dev/null \
        || { log_skip "paz produced no output" "$label"; return 1; }
}

for ar in J0437-4715 J1909-3744; do
    src="${SRC[$ar]:-}"
    [[ -f "$src" ]] || { log_skip "no archive for $ar" "$src"; continue; }
    out="$OUT/paz/$ar"
    mkdir -p "$out"

    # auto
    r="$WORK/${ar}.pazAuto.ar"
    paz_run "paz -r ($ar)" "pazAuto" "$r" -- -r \
        && run "psrplot freq paz-auto ($ar)" -- psrplot $GEOM -p freq "$r" -D "$out/auto.png"/png \
        && append_manifest "paz/$ar/auto.png" "$ar" "paz -r" \
            "paz -r -e <ext> -O <dir> <src>; psrplot $GEOM -p freq <r>.ar -D <out>/png"

    # manual channels
    r="$WORK/${ar}.pazZchans.ar"
    paz_run "paz -z chans ($ar)" "pazZchans" "$r" -- -z "100 101 102" \
        && run "psrplot freq paz-zchans ($ar)" -- psrplot $GEOM -p freq "$r" -D "$out/manual-chans.png"/png \
        && append_manifest "paz/$ar/manual-chans.png" "$ar" 'paz -z "100 101 102"' \
            "paz -z \"100 101 102\" -e <ext> -O <dir> <src>; psrplot $GEOM -p freq <r>.ar -D <out>/png"

    # frequency range
    r="$WORK/${ar}.pazFrange.ar"
    paz_run "paz -F range ($ar)" "pazFrange" "$r" -- -F "1200 1280" \
        && run "psrplot freq paz-Frange ($ar)" -- psrplot $GEOM -p freq "$r" -D "$out/freqrange.png"/png \
        && append_manifest "paz/$ar/freqrange.png" "$ar" 'paz -F "1200 1280"' \
            "paz -F \"1200 1280\" -e <ext> -O <dir> <src>; psrplot $GEOM -p freq <r>.ar -D <out>/png"

    # bad subints
    r="$WORK/${ar}.pazWsub.ar"
    paz_run "paz -w sub ($ar)" "pazWsub" "$r" -- -w "0 5" \
        && run "psrplot time paz-Wsub ($ar)" -- psrplot $GEOM -p time "$r" -D "$out/badsub.png"/png \
        && append_manifest "paz/$ar/badsub.png" "$ar" 'paz -w "0 5"' \
            "paz -w \"0 5\" -e <ext> -O <dir> <src>; psrplot $GEOM -p time <r>.ar -D <out>/png"
done
