/* global React, SiteHeader, SiteFooter */
/* Reference page — list + detail. Loads its data from site/data/commands.json
   which is regenerated monthly by .github/workflows/refresh-docs.yml. */

const { useEffect, useState, useMemo } = React;

const V2_RPG_W = 1240;
const V2_RPG_H = 1080;

function ReferenceV2() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [active, setActive] = useState("psrplot");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("data/commands.json")
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setErr(String(e)));
  }, []);

  const cmd = useMemo(() => {
    if (!data) return null;
    return data.commands.find(c => c.name === active) || data.commands[0];
  }, [data, active]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data.commands;
    return data.commands.filter(c =>
      c.name.toLowerCase().includes(needle) ||
      (c.desc || "").toLowerCase().includes(needle) ||
      (c.long || "").toLowerCase().includes(needle)
    );
  }, [data, q]);

  const catsInOrder = data ? Object.keys(data.categories) : [];

  if (err) return <div className="sk-page" style={{ padding: 80 }}>
    <SiteHeader active="ref" />
    <div style={{ marginTop: 40, color: "var(--ink-2)" }}>
      Couldn't load <code>data/commands.json</code> — {err}.<br />
      If you're viewing this locally, serve the folder over HTTP (<code>python -m http.server</code>) rather than opening the file directly.
    </div>
  </div>;

  if (!data) return <div className="sk-page" style={{ padding: 80 }}>
    <SiteHeader active="ref" />
    <div style={{ marginTop: 40, fontFamily: "var(--font-mono)", color: "var(--ink-3)" }}>loading command reference…</div>
  </div>;

  return (
    <div className="sk-page" style={{ width: V2_RPG_W, minHeight: V2_RPG_H, overflow: "hidden" }}>
      <SiteHeader active="ref" />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: V2_RPG_H - 70 }}>
        {/* ---------- LIST ---------- */}
        <div style={{ borderRight: "1px solid var(--ink-4)", padding: "22px 14px", background: "var(--card-2)", overflow: "auto", maxHeight: "calc(100vh - 70px)" }}>
          <div className="sk-box" style={{ padding: "9px 12px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--ink-3)" }}>⌕</span>
            <input
              type="text" value={q} onChange={e => setQ(e.target.value)}
              placeholder="filter commands…"
              style={{ flex: 1, border: "none", background: "transparent", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink)", outline: "none" }}
            />
            <span className="sk-chip">⌘K</span>
          </div>

          {catsInOrder.map(catKey => {
            const inCat = filtered.filter(c => c.cat === catKey);
            if (!inCat.length) return null;
            return (
              <div key={catKey} style={{ marginTop: 18 }}>
                <div className="sk-label">{data.categories[catKey].label}</div>
                <div className="sk-col sk-gap-2" style={{ marginTop: 6 }}>
                  {inCat.map(c => (
                    <button key={c.name} onClick={() => setActive(c.name)}
                      className="sk-row"
                      style={{
                        alignItems: "center", gap: 10, padding: "6px 10px",
                        borderRadius: 5, border: "none", textAlign: "left",
                        background: c.name === active ? "var(--green)" : "transparent",
                        color: c.name === active ? "var(--paper)" : "var(--ink-2)",
                        cursor: "pointer", fontFamily: "var(--font-body)",
                      }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>{c.name}</span>
                      <span style={{ fontSize: 12, opacity: 0.85, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ---------- DETAIL ---------- */}
        <div style={{ padding: "32px 64px", overflow: "auto", maxHeight: "calc(100vh - 70px)" }}>
          <div className="sk-row" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "var(--font-mono)", fontSize: 46, color: "var(--green)", margin: 0, fontWeight: 700, letterSpacing: -0.5 }}>{cmd.name}</h1>
            <span className="sk-badge" style={{ background: "var(--green-mute)", color: "var(--green)", border: "1px solid var(--green)", padding: "2px 9px", borderRadius: 11, fontSize: 11, fontFamily: "var(--font-mono)" }}>{data.categories[cmd.cat]?.label || cmd.cat}</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-3)" }}>{cmd.desc}</span>
            <a href="try-it.html" style={{ marginLeft: "auto", textDecoration: "none" }} className="sk-chip green">try in playground →</a>
          </div>

          <div style={{ marginTop: 14, fontSize: 15.5, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 760 }}>
            {cmd.long}
          </div>

          <div className="sk-code" style={{ marginTop: 16, fontSize: 12 }}>
            <span className="prompt">$</span> {cmd.usage}
          </div>

          <div className="sk-row" style={{ marginTop: 26, gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 320px", minWidth: 280 }}>
              <div className="sk-h3" style={{ color: "var(--green)" }}>flags</div>
              <div className="sk-col" style={{ marginTop: 10 }}>
                {cmd.flags?.map((row, i) => (
                  <div key={i} className="sk-row" style={{ padding: "8px 0", borderBottom: "1px solid var(--ink-4)", alignItems: "baseline", gap: 14 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--green)", minWidth: 46 }}>{row.k}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.45 }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: "1 1 320px", minWidth: 280 }}>
              <div className="sk-h3" style={{ color: "var(--green)" }}>examples</div>
              <div className="sk-col sk-gap-8" style={{ marginTop: 10 }}>
                {cmd.examples?.map((e, i) => (
                  <div key={i} className="sk-box" style={{ padding: 12 }}>
                    <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600 }}>{e.t}</span>
                      <button onClick={() => navigator.clipboard?.writeText(e.c)} className="sk-chip green" style={{ cursor: "pointer", border: "1px solid var(--green)", background: "transparent" }}>copy</button>
                    </div>
                    <div className="sk-code" style={{ marginTop: 6, fontSize: 11 }}>
                      <span className="prompt">$</span> {e.c}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {cmd.related?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="sk-label">related</div>
              <div className="sk-row sk-gap-8" style={{ marginTop: 8, flexWrap: "wrap" }}>
                {cmd.related.map(n => (
                  <button key={n} onClick={() => setActive(n)} className="sk-chip green" style={{ cursor: "pointer", border: "1px solid var(--green)", background: "transparent" }}>{n}</button>
                ))}
              </div>
            </div>
          )}

          {/* upstream pointer */}
          <div style={{ marginTop: 36, padding: "16px 20px", borderTop: "1px solid var(--ink-4)", fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-body)", lineHeight: 1.55 }}>
            Source of truth: <a href={`http://psrchive.sourceforge.net/manuals/${cmd.name}/`} target="_blank" rel="noreferrer" style={{ color: "var(--green)" }}>psrchive.sourceforge.net/manuals/{cmd.name}/</a>
            {" · "}flags above auto-refreshed monthly from <code>{cmd.name} --help</code>
            {data._meta?.psrchive_version && data._meta.psrchive_version !== "unknown" && (
              <> against PSRCHIVE <code>{data._meta.psrchive_version}</code></>
            )}
            {data._meta?.generated_at && <> · {new Date(data._meta.generated_at).toISOString().slice(0, 10)}</>}
            {data._meta?.source === "seed" && (
              <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(224,133,106,.12)", border: "1px dashed var(--plot-warm)", borderRadius: 4, color: "var(--plot-warm-2)" }}>
                <b>Note:</b> this is the seed data — only a sample of flags per command. The full flag list lands on the first GitHub Action run against a live PSRCHIVE install.
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter data={data} />
    </div>
  );
}

Object.assign(window, { ReferenceV2, V2_RPG_W, V2_RPG_H });
