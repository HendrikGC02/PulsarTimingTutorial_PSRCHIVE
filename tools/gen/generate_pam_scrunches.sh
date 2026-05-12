#!/usr/bin/env bash
# tools/gen/generate_pam_scrunches.sh
#
# pam fscrunch / tscrunch / bscrunch — image *and* sidecar metadata text.
# Filenames the UI requests (tryit.jsx → CATALOG → pam-{f,t,b}scrunch):
#
#   plots/pam/<ar>/fscrunch-{8,32,128}.png + .meta.txt + .meta.annot.json
#   plots/pam/<ar>/tscrunch-{1,4,16}.png   + .meta.txt + .meta.annot.json
#   plots/pam/<ar>/bscrunch-{256,1024}.png + .meta.txt + .meta.annot.json
#
# Each .meta.txt is the post-scrunch `vap` summary so the UI can render
# "a timing archive with X bins, Y channels, Z polarisation states…".

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

emit_meta() {
    # emit_meta <result.ar> <out-prefix>
    local arfile="$1" prefix="$2"
    local txt="$prefix.meta.txt" annot="$prefix.meta.annot.json"
    vap -c "name,nbin,nchan,nsubint,npol,length,bw,dm" "$arfile" > "$txt" || return 1
    python3 "$(dirname "${BASH_SOURCE[0]}")/_annot_helpers.py" vap "$txt" "$annot" || true
}

for ar in J0437-4715 J1909-3744; do
    src="${SRC[$ar]:-}"
    [[ -f "$src" ]] || { log_skip "no archive for $ar" "$src"; continue; }
    out="$OUT/pam/$ar"
    mkdir -p "$out"

    # ---- fscrunch ----
    for n in 8 32 128; do
        result="$WORK/${ar}.f${n}.ar"
        run "pam --setnchn $n ($ar)" -- pam --setnchn "$n" -o "$result" "$src" || continue
        png="$out/fscrunch-${n}.png"
        run "psrplot freq ($ar f$n)" -- psrplot $GEOM -p freq "$result" -D "$png"/png || continue
        emit_meta "$result" "$out/fscrunch-${n}"
        append_manifest "pam/$ar/fscrunch-${n}.png" "$ar" "pam --setnchn $n" \
            "pam --setnchn $n -o <result>.ar <src>; psrplot $GEOM -p freq <result>.ar -D <png>/png"
        append_manifest "pam/$ar/fscrunch-${n}.meta.txt" "$ar" "vap of fscrunched" \
            "vap -c \"name,nbin,nchan,nsubint,npol,length,bw,dm\" <result>.ar"
    done

    # ---- tscrunch ----
    for n in 1 4 16; do
        result="$WORK/${ar}.t${n}.ar"
        if [[ "$n" == "1" ]]; then
            run "pam -T ($ar)" -- pam -T -o "$result" "$src" || continue
        else
            run "pam --setnsub $n ($ar)" -- pam --setnsub "$n" -o "$result" "$src" || continue
        fi
        png="$out/tscrunch-${n}.png"
        run "psrplot time ($ar t$n)" -- psrplot $GEOM -p time "$result" -D "$png"/png || continue
        emit_meta "$result" "$out/tscrunch-${n}"
        append_manifest "pam/$ar/tscrunch-${n}.png" "$ar" "pam $([[ $n == 1 ]] && echo '-T' || echo "--setnsub $n")" \
            "pam $([[ $n == 1 ]] && echo '-T' || echo "--setnsub $n") -o <result>.ar <src>; psrplot $GEOM -p time <result>.ar -D <png>/png"
        append_manifest "pam/$ar/tscrunch-${n}.meta.txt" "$ar" "vap of tscrunched" \
            "vap -c \"name,nbin,nchan,nsubint,npol,length,bw,dm\" <result>.ar"
    done

    # ---- bscrunch ----
    for n in 256 1024; do
        result="$WORK/${ar}.b${n}.ar"
        run "pam --setnbin $n ($ar)" -- pam --setnbin "$n" -o "$result" "$src" || continue
        png="$out/bscrunch-${n}.png"
        run "psrplot flux ($ar b$n)" -- psrplot $GEOM -p flux -jFT "$result" -D "$png"/png || continue
        emit_meta "$result" "$out/bscrunch-${n}"
        append_manifest "pam/$ar/bscrunch-${n}.png" "$ar" "pam --setnbin $n" \
            "pam --setnbin $n -o <result>.ar <src>; psrplot $GEOM -p flux -jFT <result>.ar -D <png>/png"
        append_manifest "pam/$ar/bscrunch-${n}.meta.txt" "$ar" "vap of bscrunched" \
            "vap -c \"name,nbin,nchan,nsubint,npol,length,bw,dm\" <result>.ar"
    done
done
