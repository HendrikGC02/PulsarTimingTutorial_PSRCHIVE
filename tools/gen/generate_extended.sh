#!/usr/bin/env bash
# tools/gen/generate_extended.sh — Phase D expansion.
#
# Produces the artifacts listed in plots-todo.md:
#   1. pav matrix:   -{G,D,Y} × -{<empty>,F,T,p,d,FT,Fd,Td,pd,FTd} × 2 archives × {dirty, clean}
#   2. pam grid:     {F,D,T,P,FT,FD,FTD} × set-nchan × set-nsubint × 2 archives × {dirty, clean}
#   3. pipelines:    pam → pav  ·  pam → psrsmooth → pav  ·  pam → psrsmooth → pat
#   4. rotation:     pam --rot 0..1 frames (12 per archive)
#   5. joy:          psrplot -p time -j DF stacked  +  pav -Y waterfall
#   6. polprof:      psrplot -p Scyl -j DFT          (literature I/L/V + PA)
#   7. dynspec:      psrplot -p freq -j DT          (collapse phase)
#   8. pdmp:         pdmp PNG + text   (FLAGGED external = not part of PSRCHIVE)
#
# After it finishes, run:
#       python tools/gen/_blank_check.py -v
# which tags every PNG in plots/MANIFEST.json with `valid: true|false`,
# `external: true` (pdmp), and `dirty: true` for the un-cleaned variants.

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

# ----------------------------------------------------------------------
# Per-archive: build a single "dirty" .ar (psradd of the *_raw/*.ar) and
# point at the existing "clean" *_zap.ar.
# ----------------------------------------------------------------------
declare -A CLEAN
# pav can't handle ':' in filenames (interprets it as device-spec separator),
# so symlink each archive to a colon-free path under $WORK.
sanitise_clean() {
    local ar="$1"
    local src="${SRC[$ar]:-}"
    [[ -f "$src" ]] || { echo "  ! no SRC for $ar (got '$src')" >&2; return 1; }
    local link="$WORK/${ar}_clean.ar"
    ln -sf "$src" "$link"
    CLEAN[$ar]="$link"
}
sanitise_clean J0437-4715
sanitise_clean J1909-3744

declare -A DIRTY
prep_dirty() {
    local ar="$1"
    local raw_dir="$ARCH_DIR/${ar}_raw"
    local out="$WORK/${ar}_dirty.ar"
    if [[ ! -d "$raw_dir" ]]; then
        log_skip "no raw dir for $ar" "$raw_dir"
        return 1
    fi
    if [[ -s "$out" && "$out" -nt "$raw_dir" ]]; then
        DIRTY[$ar]="$out"; return 0
    fi
    echo ">> psradd $ar raw → $out"
    psradd -o "$out" "$raw_dir"/*.ar 2>&1 | tail -3 || {
        log_skip "psradd failed" "psradd -o $out $raw_dir/*.ar"
        return 1
    }
    DIRTY[$ar]="$out"
}

for ar in J0437-4715 J1909-3744; do prep_dirty "$ar"; done

# ----------------------------------------------------------------------
# Helper:  pav_one <ar> <state> <mode> <scrunch>
#   state ∈ clean|dirty  · mode ∈ G|D|Y  · scrunch ∈ "" F T p d FT Fd Td pd FTd
# ----------------------------------------------------------------------
pav_one() {
    local ar="$1"
    local state="$2"
    local mode="$3"
    local scr="$4"
    local src
    if [[ "$state" == "clean" ]]; then src="${CLEAN[$ar]:-}"
    else                                src="${DIRTY[$ar]:-}"
    fi
    [[ -f "$src" ]] || return 1
    local out="$OUT/pav/$ar"
    mkdir -p "$out"
    local scr_token="${scr:-bare}"
    local tag=""
    [[ "$state" == "dirty" ]] && tag="__dirty"
    local png="$out/${mode}_${scr_token}${tag}.png"
    local cmd=(pav -${mode}${scr:+${scr}} "$src" -g "$png/PNG")
    # pav is happy to write a sparse plot for nonsense flag combos.  We
    # generate it anyway; _blank_check.py decides validity afterwards.
    if "${cmd[@]}" > /dev/null 2>&1; then
        if [[ -s "$png" ]]; then
            append_manifest "pav/$ar/${mode}_${scr_token}${tag}.png" "$ar" \
                "$(basename "$src")" \
                "pav -${mode}${scr:+${scr}} <src> -g <out>/PNG"
            echo "  ✓ pav -${mode}${scr:+-${scr}} ($ar, $state)"
            return 0
        fi
    fi
    log_skip "pav failed" "pav -${mode}${scr:+${scr}} $(basename "$src")"
    return 1
}

echo "============================================================"
echo "1. pav matrix"
echo "============================================================"
for ar in J0437-4715 J1909-3744; do
    for state in clean dirty; do
        [[ "$state" == "clean" && -z "${CLEAN[$ar]:-}" ]] && continue
        [[ "$state" == "dirty" && -z "${DIRTY[$ar]:-}" ]] && continue
        for mode in G D Y; do
            for scr in "" F T p d FT Fd Td pd FTd; do
                pav_one "$ar" "$state" "$mode" "$scr" || true
            done
        done
    done
done

# ----------------------------------------------------------------------
# 2. pam grid
# ----------------------------------------------------------------------
echo
echo "============================================================"
echo "2. pam grid"
echo "============================================================"

# Returns nchan/nsub of an archive on a single line.
ar_dims() {
    vap -c "nchan nsub" "$1" 2>/dev/null | awk 'NR==2 {print $2, $3}'
}

pam_one() {
    local ar="$1"
    local state="$2"
    local flag="$3"
    local nchan="$4"
    local nsub="$5"
    local src
    if [[ "$state" == "clean" ]]; then src="${CLEAN[$ar]:-}"
    else                                src="${DIRTY[$ar]:-}"
    fi
    [[ -f "$src" ]] || return 1
    local out="$OUT/pam/$ar"
    mkdir -p "$out"
    local tokens=("$flag")
    local pam_args=()
    case "$flag" in
        *F*|*D*|*T*|*P*) ;;
    esac
    [[ "$flag" == *F* ]] && pam_args+=(-F)
    [[ "$flag" == *D* ]] && pam_args+=(-D)
    [[ "$flag" == *T* ]] && pam_args+=(-T)
    [[ "$flag" == *P* ]] && pam_args+=(-p)   # -p = pscrunch (Stokes I only)
    local desc="$flag"
    if [[ -n "$nchan" ]]; then
        pam_args+=(--setnchn "$nchan"); desc+="__nchan${nchan}"
    fi
    if [[ -n "$nsub" ]]; then
        pam_args+=(--setnsub "$nsub"); desc+="__nsub${nsub}"
    fi
    local tag=""
    [[ "$state" == "dirty" ]] && tag="__dirty"
    desc+="$tag"
    local tmp="$WORK/${ar}_${desc}.ar"
    cp "$src" "$tmp" || return 1
    if ! pam "${pam_args[@]}" -m "$tmp" > /dev/null 2>&1; then
        log_skip "pam $flag failed" "pam ${pam_args[*]} $(basename "$src")"
        return 1
    fi
    local png="$out/${desc}.png"
    # Render dynamic spectrum of the result so the user sees the effect.
    if psrplot $GEOM -p freq -j D "$tmp" -D "$png/PNG" > /dev/null 2>&1; then
        append_manifest "pam/$ar/${desc}.png" "$ar" \
            "$(basename "$src")" \
            "pam ${pam_args[*]} <src> ; psrplot -p freq -j D <out>"
        echo "  ✓ pam $desc"
    fi
    # vap meta sidecar — what changed about the archive
    local meta="$out/${desc}.meta.txt"
    vap -c "nchan nsub nbin npol freq bw" "$tmp" > "$meta" 2>/dev/null && \
        append_manifest "pam/$ar/${desc}.meta.txt" "$ar" \
            "$(basename "$src")" "vap -c 'nchan nsub nbin npol freq bw' <pam-result>"
}

# Grid (kept conservative — drop combinations the user didn't ask for)
PAM_FLAGS=(F D T P FT FD FTD)
NCHAN_SET=(116 32 16 8)
NSUB_SET=(1 2 4)

for ar in J0437-4715 J1909-3744; do
    for state in clean dirty; do
        [[ "$state" == "clean" && -z "${CLEAN[$ar]:-}" ]] && continue
        [[ "$state" == "dirty" && -z "${DIRTY[$ar]:-}" ]] && continue
        for flag in "${PAM_FLAGS[@]}"; do
            case "$flag" in
                F) for n in "${NCHAN_SET[@]}"; do pam_one "$ar" "$state" F "$n" "" || true; done;;
                D) pam_one "$ar" "$state" D "" "" || true;;
                T) for s in "${NSUB_SET[@]}"; do pam_one "$ar" "$state" T "" "$s" || true; done;;
                P) pam_one "$ar" "$state" P "" "" || true;;
                FT)
                   [[ "$state" == "clean" ]] || continue
                   for n in 32 16 8; do for s in "${NSUB_SET[@]}"; do
                       pam_one "$ar" "$state" FT "$n" "$s" || true
                   done; done
                   ;;
                FD)  pam_one "$ar" "$state" FD "" "" || true;;
                FTD)
                   [[ "$state" == "clean" ]] || continue
                   for n in 32 16 8; do for s in "${NSUB_SET[@]}"; do
                       pam_one "$ar" "$state" FTD "$n" "$s" || true
                   done; done
                   ;;
            esac
        done
    done
done

# ----------------------------------------------------------------------
# 3. Pipelines (clean only)
# ----------------------------------------------------------------------
echo
echo "============================================================"
echo "3. pipelines"
echo "============================================================"

for ar in J0437-4715 J1909-3744; do
    src="${CLEAN[$ar]:-}"
    [[ -f "$src" ]] || continue

    pdir="$OUT/pipelines/pam-pav/$ar";       mkdir -p "$pdir"
    sdir="$OUT/pipelines/pam-smooth-pav/$ar"; mkdir -p "$sdir"
    tdir="$OUT/pipelines/pam-pat/$ar";       mkdir -p "$tdir"

    # 3a. pam -F (nchan=32) → pav -G/-D/-Y selection
    f32="$WORK/${ar}_pam_F32.ar"
    cp "$src" "$f32"
    if pam -F --setnchn 32 -m "$f32" > /dev/null 2>&1; then
        for mode in G D Y; do
            for scr in "" Tpd Fpd FTpd; do
                tok="${scr:-bare}"
                png="$pdir/${mode}_${tok}.png"
                if pav -${mode}${scr:+${scr}} "$f32" -g "$png/PNG" > /dev/null 2>&1 && [[ -s "$png" ]]; then
                    append_manifest "pipelines/pam-pav/$ar/${mode}_${tok}.png" "$ar" \
                        "$(basename "$src") → pam -F --setnchn 32" \
                        "pam -F --setnchn 32 <src> ; pav -${mode}${scr:+${scr}} <out>"
                    echo "  ✓ pam-pav $ar ${mode}/${tok}"
                fi
            done
        done
    fi

    # 3b. pam -FT (full collapse) → psrsmooth → pav
    fp="$WORK/${ar}_pam_FT_full.ar"
    cp "$src" "$fp"
    if pam -FT --setnchn 1 --setnsub 1 -m "$fp" > /dev/null 2>&1; then
        psrsmooth -W "$fp" > /dev/null 2>&1 || true
        sm="${fp}.sm"
        if [[ -s "$sm" ]]; then
            for mode in G S; do
                png="$sdir/${mode}_template.png"
                if pav -${mode}FTpd "$sm" -g "$png/PNG" > /dev/null 2>&1 && [[ -s "$png" ]]; then
                    append_manifest "pipelines/pam-smooth-pav/$ar/${mode}_template.png" "$ar" \
                        "$(basename "$src") → pam -FT (collapsed) → psrsmooth -W" \
                        "pam -FT --setnchn 1 --setnsub 1 ; psrsmooth -W ; pav -${mode}FTpd <sm>"
                    echo "  ✓ smoothed template $ar ${mode}"
                fi
            done
        fi

        # 3c. pat with the smoothed template
        if [[ -s "$sm" ]]; then
            tim="$tdir/toas.tim"
            if pat -s "$sm" -A FDM "$src" > "$tim" 2>/dev/null && [[ -s "$tim" ]]; then
                append_manifest "pipelines/pam-pat/$ar/toas.tim" "$ar" \
                    "$(basename "$src") + template from psrsmooth" \
                    "pat -s <template.std> -A FDM <src> > toas.tim"
                echo "  ✓ pat tim $ar"
            fi
        fi
    fi
done

# ----------------------------------------------------------------------
# 4. Rotation frames  (pam --rot)
# ----------------------------------------------------------------------
echo
echo "============================================================"
echo "4. rotation frames"
echo "============================================================"
for ar in J0437-4715 J1909-3744; do
    src="${CLEAN[$ar]:-}"; [[ -f "$src" ]] || continue
    rdir="$OUT/rotation/$ar"; mkdir -p "$rdir"
    for step in 00 02 04 06 08 10 12 14 16 18 20 22; do
        # convert NN/24 → phase fraction with 2dp
        rot="0.$(printf %02d $((10#$step * 100 / 24)))"
        tmp="$WORK/${ar}_rot${step}.ar"
        cp "$src" "$tmp"
        # pam uses -r turns (NOT --rot — there's no such flag)
        if pam -r "$rot" -m "$tmp" > /dev/null 2>&1; then
            png="$rdir/phase_${step}.png"
            if psrplot $GEOM -p flux -j FT "$tmp" -D "$png/PNG" > /dev/null 2>&1 && [[ -s "$png" ]]; then
                append_manifest "rotation/$ar/phase_${step}.png" "$ar" \
                    "$(basename "$src")" \
                    "pam --rot $rot <src> ; psrplot -p flux -j FT <out>"
            fi
        fi
    done
    echo "  ✓ rotation frames $ar"
done

# ----------------------------------------------------------------------
# 5. Joy-division (psrplot stacked, pav -Y)
# ----------------------------------------------------------------------
echo
echo "============================================================"
echo "5. joy-division plots"
echo "============================================================"
for ar in J0437-4715 J1909-3744; do
    src="${CLEAN[$ar]:-}"; [[ -f "$src" ]] || continue
    out="$OUT/psrplot/$ar"; mkdir -p "$out"
    # psrplot -p time gives a time × phase image; we also try pav -Y for the
    # classic waterfall stack.
    png="$out/joy__jdf.png"
    psrplot $GEOM -p time -j DF "$src" -D "$png/PNG" > /dev/null 2>&1 && [[ -s "$png" ]] && \
        append_manifest "psrplot/$ar/joy__jdf.png" "$ar" "$(basename "$src")" \
            "psrplot -p time -j DF <src> -D <out>/PNG"
    pdir="$OUT/pav/$ar"; mkdir -p "$pdir"
    png2="$pdir/Y_Fpd.png"
    pav -YFpd "$src" -g "$png2/PNG" > /dev/null 2>&1 && [[ -s "$png2" ]] && \
        append_manifest "pav/$ar/Y_Fpd.png" "$ar" "$(basename "$src")" \
            "pav -YFpd <src> -g <out>/PNG"
    echo "  ✓ joy $ar"
done

# ----------------------------------------------------------------------
# 6. Polarisation profile (literature I/L/V + PA)
# ----------------------------------------------------------------------
echo
echo "============================================================"
echo "6. polarisation profile (psrplot -p Scyl)"
echo "============================================================"
for ar in J0437-4715 J1909-3744; do
    for state in clean dirty; do
        [[ "$state" == "clean" && -z "${CLEAN[$ar]:-}" ]] && continue
        [[ "$state" == "dirty" && -z "${DIRTY[$ar]:-}" ]] && continue
        if [[ "$state" == "clean" ]]; then src="${CLEAN[$ar]}"
        else                                 src="${DIRTY[$ar]}"
        fi
        out="$OUT/psrplot/$ar"; mkdir -p "$out"
        tag=""
        [[ "$state" == "dirty" ]] && tag="__dirty"
        png="$out/polprof__jdft${tag}.png"
        if psrplot $GEOM -p Scyl -j DFT "$src" -D "$png/PNG" > /dev/null 2>&1 && [[ -s "$png" ]]; then
            append_manifest "psrplot/$ar/polprof__jdft${tag}.png" "$ar" "$(basename "$src")" \
                "psrplot -p Scyl -j DFT <src> -D <out>/PNG"
            echo "  ✓ polprof $ar $state"
        fi
    done
done

# ----------------------------------------------------------------------
# 7. Dynamic spectrum (psrplot -p freq -j DT — phase collapsed)
# ----------------------------------------------------------------------
echo
echo "============================================================"
echo "7. dynamic spectrum"
echo "============================================================"
for ar in J0437-4715 J1909-3744; do
    for state in clean dirty; do
        [[ "$state" == "clean" && -z "${CLEAN[$ar]:-}" ]] && continue
        [[ "$state" == "dirty" && -z "${DIRTY[$ar]:-}" ]] && continue
        if [[ "$state" == "clean" ]]; then src="${CLEAN[$ar]}"; else src="${DIRTY[$ar]}"; fi
        out="$OUT/dynspec/$ar"; mkdir -p "$out"
        tag=""
        [[ "$state" == "dirty" ]] && tag="__dirty"
        png="$out/dynspec${tag}.png"
        # use a freq×time slice through the on-pulse window
        if psrplot $GEOM -p b -jDB -x -lpol=0 -c above:c="dynspec ($ar, $state)" "$src" -D "$png/PNG" > /dev/null 2>&1 && [[ -s "$png" ]]; then
            append_manifest "dynspec/$ar/dynspec${tag}.png" "$ar" "$(basename "$src")" \
                "psrplot -p b -jDB -x -lpol=0 <src>"
            echo "  ✓ dynspec $ar $state"
        else
            # fallback: simple freq plot
            if psrplot $GEOM -p freq -j DT "$src" -D "$png/PNG" > /dev/null 2>&1 && [[ -s "$png" ]]; then
                append_manifest "dynspec/$ar/dynspec${tag}.png" "$ar" "$(basename "$src")" \
                    "psrplot -p freq -j DT <src>"
                echo "  ✓ dynspec (fallback) $ar $state"
            fi
        fi
    done
done

# ----------------------------------------------------------------------
# 8. pdmp  (external — not part of PSRCHIVE, but ships in the same module)
# ----------------------------------------------------------------------
echo
echo "============================================================"
echo "8. pdmp"
echo "============================================================"
for ar in J0437-4715 J1909-3744; do
    src="${CLEAN[$ar]:-}"; [[ -f "$src" ]] || continue
    pdir="$OUT/pdmp/$ar"; mkdir -p "$pdir"
    cd "$pdir"
    # pdmp writes pdmp.png in CWD when given -g <name>/PNG
    if pdmp -mc 16 -ms 8 -g pdmp.png/PNG "$src" > pdmp.txt 2>&1 && [[ -s pdmp.png ]]; then
        cd "$REPO"
        append_manifest "pdmp/$ar/pdmp.png" "$ar" "$(basename "$src")" \
            "pdmp -mc 16 -ms 8 -g pdmp.png/PNG <src>   # external"
        append_manifest "pdmp/$ar/pdmp.txt" "$ar" "$(basename "$src")" \
            "pdmp -mc 16 -ms 8 <src> > pdmp.txt        # external"
        echo "  ✓ pdmp $ar"
    else
        cd "$REPO"
        log_skip "pdmp failed" "pdmp -mc 16 -ms 8 $(basename "$src")"
    fi
done

# ----------------------------------------------------------------------
# Run the blank-check / external / dirty annotator over MANIFEST.json
# ----------------------------------------------------------------------
echo
echo "============================================================"
echo "annotating MANIFEST.json (valid / external / dirty)"
echo "============================================================"
python3 "$REPO/tools/gen/_blank_check.py" -v | tail -30 || true

echo
echo "DONE."
