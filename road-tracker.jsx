import { useState, useEffect, useRef } from "react";

const STATUSES = ["reported", "assigned", "fixed"];
const STATUS_META = {
  reported: { label: "Reported", color: "#FF4D00", bg: "#FF4D0020", icon: "⚠" },
  assigned: { label: "Assigned", color: "#FFB800", bg: "#FFB80020", icon: "🔧" },
  fixed: { label: "Fixed", color: "#00C48C", bg: "#00C48C20", icon: "✓" },
};

const ISSUE_TYPES = ["Pothole", "Crack", "Flooding", "Debris", "Broken Light", "Damaged Sign", "Other"];

const SEED_ISSUES = [
  { id: 1, type: "Pothole", address: "Main St & Oak Ave", description: "Large pothole causing damage to vehicles", status: "fixed", lat: 40.712, lng: -74.006, created: Date.now() - 86400000 * 5, image: null, severity: "high" },
  { id: 2, type: "Flooding", address: "River Rd near Bridge", description: "Water pooling after rain, dangerous conditions", status: "assigned", lat: 40.715, lng: -74.009, created: Date.now() - 86400000 * 2, image: null, severity: "high" },
  { id: 3, type: "Crack", address: "Park Blvd 200 block", description: "Multiple cracks spreading across lane", status: "reported", lat: 40.709, lng: -74.003, created: Date.now() - 86400000, image: null, severity: "medium" },
  { id: 4, type: "Broken Light", address: "5th Ave & 12th St", description: "Traffic light not functioning since Tuesday", status: "assigned", lat: 40.718, lng: -74.011, created: Date.now() - 86400000 * 3, image: null, severity: "high" },
  { id: 5, type: "Debris", address: "Highway Ramp East", description: "Large debris blocking right lane", status: "reported", lat: 40.706, lng: -74.001, created: Date.now() - 3600000 * 4, image: null, severity: "low" },
];

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function StatusBadge({ status }) {
  const m = STATUS_META[status];
  return (
    <span style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}40`, borderRadius: 4, padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "monospace" }}>
      {m.icon} {m.label}
    </span>
  );
}

function StatusPipeline({ status }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 12 }}>
      {STATUSES.map((s, i) => {
        const active = STATUSES.indexOf(status) >= i;
        const m = STATUS_META[s];
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: active ? m.color : "#1a1a1a",
                border: `2px solid ${active ? m.color : "#333"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, transition: "all 0.3s",
                boxShadow: active ? `0 0 12px ${m.color}60` : "none"
              }}>{active ? m.icon : ""}</div>
              <span style={{ fontSize: 9, color: active ? m.color : "#555", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "monospace" }}>{m.label}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: STATUSES.indexOf(status) > i ? m.color : "#222", margin: "0 4px", marginBottom: 20, transition: "background 0.3s" }} />}
          </div>
        );
      })}
    </div>
  );
}

function IssueCard({ issue, onSelect, onAdvance, selected }) {
  const m = STATUS_META[issue.status];
  return (
    <div onClick={() => onSelect(issue)} style={{
      background: selected ? "#161616" : "#0e0e0e",
      border: `1px solid ${selected ? m.color + "80" : "#1e1e1e"}`,
      borderLeft: `3px solid ${m.color}`,
      borderRadius: 6, padding: "14px 16px", cursor: "pointer",
      transition: "all 0.2s", marginBottom: 8,
      boxShadow: selected ? `0 0 20px ${m.color}20` : "none"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "'DM Mono', monospace" }}>#{String(issue.id).padStart(4, "0")}</span>
            <span style={{ color: m.color, fontSize: 12, fontWeight: 600, background: m.bg, padding: "1px 8px", borderRadius: 3 }}>{issue.type}</span>
          </div>
          <div style={{ color: "#aaa", fontSize: 12, marginBottom: 3 }}>{issue.address}</div>
          <div style={{ color: "#555", fontSize: 11, fontFamily: "monospace" }}>{timeAgo(issue.created)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <StatusBadge status={issue.status} />
          {issue.status !== "fixed" && (
            <button onClick={(e) => { e.stopPropagation(); onAdvance(issue.id); }} style={{
              background: "transparent", border: `1px solid ${m.color}60`, color: m.color,
              borderRadius: 4, padding: "3px 10px", fontSize: 10, cursor: "pointer",
              fontFamily: "monospace", letterSpacing: "0.05em", fontWeight: 700,
              transition: "all 0.2s"
            }}>ADVANCE →</button>
          )}
        </div>
      </div>
    </div>
  );
}

function MapDot({ issue, onClick, selected }) {
  const m = STATUS_META[issue.status];
  const [hov, setHov] = useState(false);
  // Map lat/lng to % within a small bounding box
  const minLat = 40.704, maxLat = 40.720, minLng = -74.013, maxLng = -73.999;
  const x = ((issue.lng - minLng) / (maxLng - minLng)) * 100;
  const y = (1 - (issue.lat - minLat) / (maxLat - minLat)) * 100;

  return (
    <div onClick={() => onClick(issue)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)",
        cursor: "pointer", zIndex: selected || hov ? 10 : 1
      }}>
      <div style={{
        width: selected ? 22 : 16, height: selected ? 22 : 16,
        borderRadius: "50%", background: m.color,
        border: `2px solid ${selected ? "#fff" : m.color}`,
        boxShadow: `0 0 ${selected ? 20 : 8}px ${m.color}`,
        transition: "all 0.2s", position: "relative"
      }}>
        {issue.severity === "high" && (
          <div style={{ position: "absolute", top: -2, right: -2, width: 7, height: 7, borderRadius: "50%", background: "#FF4D00", border: "1px solid #000" }} />
        )}
      </div>
      {(hov || selected) && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "#111", border: `1px solid ${m.color}40`, borderRadius: 5, padding: "6px 10px",
          whiteSpace: "nowrap", color: "#fff", fontSize: 11, pointerEvents: "none",
          boxShadow: `0 4px 20px #000`
        }}>
          <div style={{ fontWeight: 700, color: m.color }}>{issue.type}</div>
          <div style={{ color: "#aaa", fontSize: 10 }}>{issue.address}</div>
        </div>
      )}
    </div>
  );
}

function ReportModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ type: "Pothole", address: "", description: "", severity: "medium" });
  const [imgPreview, setImgPreview] = useState(null);
  const [step, setStep] = useState(0); // 0: form, 1: success

  const handleImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setImgPreview(ev.target.result);
    r.readAsDataURL(f);
  };

  const handleSubmit = () => {
    if (!form.address.trim()) return;
    onSubmit({ ...form, image: imgPreview, lat: 40.706 + Math.random() * 0.014, lng: -74.013 + Math.random() * 0.014 });
    setStep(1);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, width: 460, maxWidth: "95vw", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center", background: "repeating-linear-gradient(45deg, #111 0px, #111 10px, #0d0d0d 10px, #0d0d0d 20px)" }}>
          <div>
            <div style={{ color: "#FF4D00", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em", fontWeight: 700 }}>ROAD ISSUE REPORTING SYSTEM</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>FILE NEW REPORT</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid #333", color: "#666", width: 32, height: 32, borderRadius: 4, cursor: "pointer", fontSize: 16 }}>×</button>
        </div>

        {step === 0 ? (
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Issue Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>
                  {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Severity</label>
                <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} style={inp}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Location / Address *</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="e.g. Main St & Oak Ave" style={inp} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue in detail..." rows={3} style={{ ...inp, resize: "none" }} />
            </div>
            {/* Image upload */}
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Photo Evidence</label>
              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "2px dashed #2a2a2a", borderRadius: 6, padding: 20, cursor: "pointer",
                background: imgPreview ? "none" : "#050505", overflow: "hidden", minHeight: 100
              }}>
                {imgPreview ? (
                  <img src={imgPreview} style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 4, objectFit: "cover" }} />
                ) : (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                    <div style={{ color: "#555", fontSize: 12, fontFamily: "monospace" }}>Click to upload image</div>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImg} style={{ display: "none" }} />
              </label>
            </div>
            <button onClick={handleSubmit} disabled={!form.address.trim()} style={{
              width: "100%", background: form.address.trim() ? "#FF4D00" : "#222",
              color: form.address.trim() ? "#fff" : "#444", border: "none",
              borderRadius: 6, padding: "13px", fontSize: 14, fontWeight: 800,
              cursor: form.address.trim() ? "pointer" : "not-allowed", letterSpacing: "0.08em",
              fontFamily: "'DM Mono', monospace", transition: "all 0.2s"
            }}>SUBMIT REPORT</button>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ color: "#00C48C", fontSize: 22, fontWeight: 800, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>REPORT SUBMITTED</div>
            <div style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>Your report has been filed and will be reviewed shortly.</div>
            <button onClick={onClose} style={{ background: "#00C48C20", color: "#00C48C", border: "1px solid #00C48C40", borderRadius: 6, padding: "10px 24px", cursor: "pointer", fontFamily: "monospace", fontWeight: 700 }}>CLOSE</button>
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = { display: "block", color: "#555", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 5, textTransform: "uppercase" };
const inp = { width: "100%", background: "#111", border: "1px solid #222", borderRadius: 5, padding: "9px 12px", color: "#ddd", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'DM Mono', monospace" };

export default function App() {
  const [issues, setIssues] = useState(SEED_ISSUES);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("split"); // split | map | list
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [nextId, setNextId] = useState(6);

  const filtered = filter === "all" ? issues : issues.filter(i => i.status === filter);

  const advance = (id) => {
    setIssues(prev => prev.map(i => {
      if (i.id !== id) return i;
      const idx = STATUSES.indexOf(i.status);
      return { ...i, status: STATUSES[Math.min(idx + 1, 2)] };
    }));
  };

  const addIssue = (data) => {
    const newIssue = { ...data, id: nextId, status: "reported", created: Date.now() };
    setIssues(prev => [newIssue, ...prev]);
    setNextId(n => n + 1);
    setShowModal(false);
    setSelected(newIssue);
  };

  const stats = { reported: issues.filter(i => i.status === "reported").length, assigned: issues.filter(i => i.status === "assigned").length, fixed: issues.filter(i => i.status === "fixed").length };

  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "'DM Mono', monospace", color: "#fff" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "0 24px", background: "#070707", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, background: "#FF4D00", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚠</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", color: "#fff" }}>ROADWATCH</div>
              <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.12em" }}>LIVE ISSUE TRACKER</div>
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: "flex", gap: 0, marginLeft: 20, borderLeft: "1px solid #1a1a1a", paddingLeft: 20 }}>
            {Object.entries(stats).map(([s, n]) => (
              <div key={s} style={{ padding: "0 14px", borderRight: "1px solid #1a1a1a", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: STATUS_META[s].color }}>{n}</div>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* View toggles */}
          <div style={{ display: "flex", background: "#111", border: "1px solid #1e1e1e", borderRadius: 5, overflow: "hidden" }}>
            {["split", "map", "list"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? "#1e1e1e" : "transparent", color: view === v ? "#fff" : "#555",
                border: "none", padding: "6px 12px", cursor: "pointer", fontSize: 10, fontFamily: "monospace",
                letterSpacing: "0.08em", fontWeight: 700, textTransform: "uppercase"
              }}>{v}</button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} style={{
            background: "#FF4D00", color: "#fff", border: "none", borderRadius: 5,
            padding: "8px 16px", cursor: "pointer", fontWeight: 800, fontSize: 12,
            letterSpacing: "0.06em", fontFamily: "monospace"
          }}>+ REPORT ISSUE</button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ borderBottom: "1px solid #111", padding: "10px 24px", display: "flex", gap: 6 }}>
        {["all", "reported", "assigned", "fixed"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? (f === "all" ? "#1e1e1e" : STATUS_META[f]?.bg || "#1e1e1e") : "transparent",
            color: filter === f ? (f === "all" ? "#fff" : STATUS_META[f]?.color || "#fff") : "#444",
            border: `1px solid ${filter === f ? (f === "all" ? "#333" : STATUS_META[f]?.color + "40" || "#333") : "transparent"}`,
            borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 10, fontFamily: "monospace",
            letterSpacing: "0.1em", fontWeight: 700, textTransform: "uppercase"
          }}>
            {f === "all" ? `ALL (${issues.length})` : `${f} (${stats[f] || 0})`}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: "flex", height: "calc(100vh - 105px)" }}>
        {/* List panel */}
        {(view === "list" || view === "split") && (
          <div style={{ width: view === "split" ? 400 : "100%", borderRight: "1px solid #111", overflowY: "auto", padding: 16 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", color: "#333", padding: 40, fontFamily: "monospace" }}>No issues found</div>
            )}
            {filtered.map(issue => (
              <IssueCard key={issue.id} issue={issue} onSelect={setSelected} onAdvance={advance} selected={selected?.id === issue.id} />
            ))}
          </div>
        )}

        {/* Map panel */}
        {(view === "map" || view === "split") && (
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {/* Grid background simulating map */}
            <div style={{
              position: "absolute", inset: 0,
              background: "#0a0a0a",
              backgroundImage: `
                linear-gradient(#111 1px, transparent 1px),
                linear-gradient(90deg, #111 1px, transparent 1px),
                linear-gradient(#0d0d0d 1px, transparent 1px),
                linear-gradient(90deg, #0d0d0d 1px, transparent 1px)
              `,
              backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px"
            }}>
              {/* "Roads" */}
              <div style={{ position: "absolute", top: "30%", left: 0, right: 0, height: 18, background: "#131313", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }} />
              <div style={{ position: "absolute", top: "65%", left: 0, right: 0, height: 28, background: "#131313", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }} />
              <div style={{ position: "absolute", left: "20%", top: 0, bottom: 0, width: 18, background: "#131313", borderLeft: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a" }} />
              <div style={{ position: "absolute", left: "55%", top: 0, bottom: 0, width: 28, background: "#131313", borderLeft: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a" }} />
              <div style={{ position: "absolute", left: "80%", top: 0, bottom: 0, width: 12, background: "#131313", borderLeft: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a" }} />

              {/* Dots */}
              {(filter === "all" ? issues : filtered).map(issue => (
                <MapDot key={issue.id} issue={issue} onClick={setSelected} selected={selected?.id === issue.id} />
              ))}

              {/* Legend */}
              <div style={{ position: "absolute", bottom: 16, left: 16, background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: "10px 14px" }}>
                <div style={{ color: "#444", fontSize: 9, letterSpacing: "0.12em", marginBottom: 8 }}>STATUS LEGEND</div>
                {STATUSES.map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_META[s].color, boxShadow: `0 0 6px ${STATUS_META[s].color}` }} />
                    <span style={{ color: "#666", fontSize: 10, fontFamily: "monospace" }}>{STATUS_META[s].label}</span>
                  </div>
                ))}
              </div>

              {/* Map label */}
              <div style={{ position: "absolute", top: 16, right: 16, color: "#222", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em" }}>LIVE MAP VIEW</div>
            </div>

            {/* Detail panel overlay */}
            {selected && (
              <div style={{
                position: "absolute", bottom: 16, right: 16, width: 300,
                background: "#0e0e0e", border: `1px solid ${STATUS_META[selected.status].color}40`,
                borderLeft: `3px solid ${STATUS_META[selected.status].color}`,
                borderRadius: 8, padding: 18,
                boxShadow: `0 8px 40px #000, 0 0 30px ${STATUS_META[selected.status].color}15`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ color: "#555", fontSize: 10, marginBottom: 2, fontFamily: "monospace" }}>#{String(selected.id).padStart(4, "0")} · {timeAgo(selected.created)}</div>
                    <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{selected.type}</div>
                    <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>{selected.address}</div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
                {selected.description && <div style={{ color: "#666", fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>{selected.description}</div>}
                {selected.image && <img src={selected.image} style={{ width: "100%", borderRadius: 4, marginBottom: 12, maxHeight: 120, objectFit: "cover" }} />}
                <StatusPipeline status={selected.status} />
                {selected.status !== "fixed" && (
                  <button onClick={() => advance(selected.id)} style={{
                    marginTop: 12, width: "100%", background: `${STATUS_META[selected.status].color}20`,
                    color: STATUS_META[selected.status].color,
                    border: `1px solid ${STATUS_META[selected.status].color}40`,
                    borderRadius: 5, padding: "8px", fontSize: 11, cursor: "pointer",
                    fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.06em"
                  }}>ADVANCE STATUS →</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && <ReportModal onClose={() => setShowModal(false)} onSubmit={addIssue} />}
    </div>
  );
}
