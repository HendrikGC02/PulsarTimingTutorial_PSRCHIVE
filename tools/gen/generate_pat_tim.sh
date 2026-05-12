#!/usr/bin/env bash
# tools/gen/generate_pat_tim.sh — annotated .tim outputs from `pat`.
#
# Filenames (tryit.jsx → CATALOG → pat):
#   plots/pat/<ar>/toas.tim + .annot.json
#
# The .annot.json is built from the *real* output so the column widths in
# the website's tooltip overlay match exactly what the user would see.

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
HELPERS="$(dirname "${BASH_SOURCE[0]}")/_annot_helpers.py"

# A template is needed.  Reuse the pipeline C output if it exists; otherwise
# build a quick one from the cleaned archive.
TEMPLATE="$WORK/J0437-4715.template.std"
if [[ ! -f "$TEMPLATE" ]]; then
    if [[ -f "$OUT/pipelines/template+pat/template.std" ]]; then
        cp "$OUT/pipelines/template+pat/template.std" "$TEMPLATE"
    else
        # quick template
        smoothed="$WORK/J0437-4715.FT.sm"
        run "pam -FT for template"  -- pam -FT -o "$WORK/J0437-4715.FT" "${SRC[J0437-4715]}"
        run "psrsmooth for template" -- psrsmooth -W "$WORK/J0437-4715.FT"
        cp "$WORK/J0437-4715.FT.sm" "$TEMPLATE"
    fi
fi

for ar in J0437-4715 J1909-3744; do
    src="${SRC[$ar]:-}"
    [[ -f "$src" ]] || { log_skip "no archive for $ar" "$src"; continue; }
    out="$OUT/pat/$ar"
    mkdir -p "$out"

    run "pat tempo2 FDM ($ar)" -- bash -c \
        "pat -s '$TEMPLATE' -A FDM -f 'tempo2 IPTA' '$src' > '$out/toas.tim'" \
        && python3 "$HELPERS" tim "$out/toas.tim" "$out/toas.annot.json" \
        && append_manifest "pat/$ar/toas.tim" "$ar" "pat → tempo2 IPTA" \
            "pat -s <template>.std -A FDM -f 'tempo2 IPTA' <src> > <out>/toas.tim"
done
