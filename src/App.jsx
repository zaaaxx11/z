import { useState } from "react";

const API = "/api/assess";

// ── Design tokens ──────────────────────────────────────────────
const C = {
  bg: "#0F1117",
  surface: "#181C27",
  card: "#1E2333",
  border: "#2A3050",
  accent: "#4F8EF7",
  accent2: "#38EFC8",
  accent3: "#F7C948",
  danger: "#F75959",
  text: "#E8ECFF",
  muted: "#6B7799",
  success: "#38EFC8",
};

const uid = () => Math.random().toString(36).slice(2, 8);

// ── Tiny components ─────────────────────────────────────────────
const Pill = ({ children, color = C.accent }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}55`,
    borderRadius: 999, padding: "2px 12px", fontSize: 12, fontWeight: 700,
    letterSpacing: 0.5, fontFamily: "monospace",
  }}>{children}</span>
);

const ScoreRing = ({ score, max = 10, size = 64 }) => {
  const pct = score / max;
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const color = pct >= 0.8 ? C.accent2 : pct >= 0.5 ? C.accent3 : C.danger;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ fill: color, fontSize: size * 0.28, fontWeight: 800, fontFamily: "monospace", transform: "rotate(90deg)", transformOrigin: "center" }}>
        {score}
      </text>
    </svg>
  );
};

const Btn = ({ children, onClick, variant = "primary", disabled, style: sx }) => {
  const base = {
    border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 14,
    fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'Syne', sans-serif", transition: "all 0.18s", letterSpacing: 0.3,
    opacity: disabled ? 0.45 : 1, ...sx,
  };
  const variants = {
    primary: { background: C.accent, color: "#fff", boxShadow: `0 4px 20px ${C.accent}44` },
    ghost: { background: "transparent", color: C.accent, border: `1.5px solid ${C.accent}55` },
    danger: { background: C.danger + "22", color: C.danger, border: `1.5px solid ${C.danger}44` },
    success: { background: C.accent2 + "22", color: C.accent2, border: `1.5px solid ${C.accent2}44` },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
};

const Input = ({ value, onChange, placeholder, multiline, rows = 3, label, hint }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</label>}
    {multiline
      ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
          style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 14px",
            color: C.text, fontSize: 14, resize: "vertical", outline: "none", fontFamily: "'Syne', sans-serif", lineHeight: 1.6 }} />
      : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 14px",
            color: C.text, fontSize: 14, outline: "none", fontFamily: "'Syne', sans-serif" }} />}
    {hint && <span style={{ fontSize: 11, color: C.muted }}>{hint}</span>}
  </div>
);

// ── STEP 1: Rubrik Builder ───────────────────────────────────────
function RubrikBuilder({ rubrik, setRubrik, onNext, title, setTitle, context, setContext }) {
  const addKriteria = () => setRubrik(r => [...r, { id: uid(), nama: "", deskripsi: "", bobot: 10 }]);
  const del = (id) => setRubrik(r => r.filter(x => x.id !== id));
  const upd = (id, f, v) => setRubrik(r => r.map(x => x.id === id ? { ...x, [f]: v } : x));
  const totalBobot = rubrik.reduce((s, r) => s + Number(r.bobot || 0), 0);
  const canNext = title && rubrik.length > 0 && rubrik.every(r => r.nama);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header info */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
        <p style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px", fontWeight: 700 }}>Informasi Tugas</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Judul / Nama Tugas" value={title} onChange={setTitle} placeholder="cth: Penilaian Proposal Skripsi" />
          <Input label="Konteks Penilaian (opsional)" value={context} onChange={setContext}
            multiline rows={2} placeholder="Jelaskan konteks, mata kuliah, atau instruksi khusus untuk AI penilai..." />
        </div>
      </div>

      {/* Kriteria */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 2px", fontWeight: 700 }}>Kriteria Penilaian</p>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Tiap kriteria dinilai AI dengan skor 1–10</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Pill color={totalBobot === 100 ? C.accent2 : C.accent3}>Bobot: {totalBobot}%</Pill>
            <Btn onClick={addKriteria} variant="ghost" sx={{ padding: "8px 14px", fontSize: 13 }}>+ Tambah</Btn>
          </div>
        </div>

        {rubrik.length === 0 && (
          <div style={{ textAlign: "center", padding: "28px 0", color: C.muted, fontSize: 14 }}>
            Belum ada kriteria. Klik <strong>+ Tambah</strong> untuk mulai.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rubrik.map((kr, i) => (
            <div key={kr.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 1.5, textTransform: "uppercase" }}>
                  KRITERIA #{i + 1}
                </span>
                <Btn onClick={() => del(kr.id)} variant="danger" sx={{ padding: "4px 12px", fontSize: 12 }}>Hapus</Btn>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10 }}>
                  <Input label="Nama Kriteria" value={kr.nama} onChange={v => upd(kr.id, "nama", v)}
                    placeholder="cth: Kejelasan Rumusan Masalah" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>Bobot %</label>
                    <input type="number" min={1} max={100} value={kr.bobot}
                      onChange={e => upd(kr.id, "bobot", e.target.value)}
                      style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 12px",
                        color: C.accent3, fontSize: 16, fontWeight: 800, outline: "none", fontFamily: "monospace", textAlign: "center" }} />
                  </div>
                </div>
                <Input label="Deskripsi / Indikator Penilaian (opsional)" value={kr.deskripsi}
                  onChange={v => upd(kr.id, "deskripsi", v)} multiline rows={2}
                  placeholder="Jelaskan apa yang dinilai dan bagaimana indikator skor tinggi/rendah..." />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Btn onClick={onNext} disabled={!canNext}>
        Lanjut ke Input Jawaban →
      </Btn>
    </div>
  );
}

// ── STEP 2: Input Jawaban ────────────────────────────────────────
function InputJawaban({ rubrik, title, onBack, onAssess, students, setStudents }) {
  const addStudent = () => setStudents(s => [...s, { id: uid(), name: "", answer: "" }]);
  const del = (id) => setStudents(s => s.filter(x => x.id !== id));
  const upd = (id, f, v) => setStudents(s => s.map(x => x.id === id ? { ...x, [f]: v } : x));
  const canAssess = students.length > 0 && students.every(s => s.name && s.answer);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Rubrik preview */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
        <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px", fontWeight: 700 }}>Rubrik Aktif: {title}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {rubrik.map(k => (
            <div key={k.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.text }}>{k.nama}</span>
              <Pill color={C.accent3}>{k.bobot}%</Pill>
            </div>
          ))}
        </div>
      </div>

      {/* Daftar murid */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1, margin: 0, fontWeight: 700 }}>
            Jawaban Murid ({students.length})
          </p>
          <Btn onClick={addStudent} variant="ghost" sx={{ padding: "8px 14px", fontSize: 13 }}>+ Tambah Murid</Btn>
        </div>

        {students.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 14 }}>
            Klik <strong>+ Tambah Murid</strong> untuk input jawaban.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {students.map((s, i) => (
            <div key={s.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.accent2, letterSpacing: 1.5, textTransform: "uppercase" }}>MURID #{i + 1}</span>
                <Btn onClick={() => del(s.id)} variant="danger" sx={{ padding: "4px 12px", fontSize: 12 }}>Hapus</Btn>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Input label="Nama / NIM" value={s.name} onChange={v => upd(s.id, "name", v)} placeholder="cth: Budi Santoso / 21001234" />
                <Input label="Paste Jawaban Murid" value={s.answer} onChange={v => upd(s.id, "answer", v)}
                  multiline rows={5} placeholder="Paste jawaban/karya tulis murid di sini..." />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Btn onClick={onBack} variant="ghost">← Kembali</Btn>
        <div style={{ flex: 1 }}>
          <Btn onClick={onAssess} disabled={!canAssess} sx={{ width: "100%" }}>
            🔍 Nilai Semua dengan AI
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── STEP 3: Hasil ────────────────────────────────────────────────
function HasilPenilaian({ results, rubrik, onBack, onReset, loading, error }) {
  const [open, setOpen] = useState(null);

  const totalMax = rubrik.reduce((s, r) => s + Number(r.bobot || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12, animation: "pulse 1.5s infinite" }}>⚙️</div>
          <p style={{ color: C.muted, margin: 0 }}>AI sedang menilai jawaban...</p>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
      )}

      {error && (
        <div style={{ background: C.danger + "18", border: `1px solid ${C.danger}44`, borderRadius: 12, padding: 16, color: C.danger, fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {results.map((res, i) => {
        const totalScore = rubrik.reduce((sum, kr) => {
          const s = res.scores?.[kr.id];
          return sum + (s ? (s.skor / 10) * Number(kr.bobot) : 0);
        }, 0);
        const finalScore = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
        const isOpen = open === res.id;
        const scoreColor = finalScore >= 75 ? C.accent2 : finalScore >= 50 ? C.accent3 : C.danger;

        return (
          <div key={res.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            {/* Header kartu */}
            <div
              onClick={() => setOpen(isOpen ? null : res.id)}
              style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <ScoreRing score={Math.round(finalScore)} max={100} size={58} />
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: C.text }}>{res.name}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 13, color: C.muted }}>
                    {res.scores ? `${rubrik.length} kriteria dinilai` : "Menunggu..."}
                  </p>
                  {res.scores && (
                    <Pill color={scoreColor}>{finalScore >= 75 ? "Baik" : finalScore >= 50 ? "Cukup" : "Perlu Perbaikan"}</Pill>
                  )}
                </div>
              </div>
              <span style={{ color: C.muted, fontSize: 20 }}>{isOpen ? "▲" : "▼"}</span>
            </div>

            {/* Detail */}
            {isOpen && res.scores && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                {rubrik.map(kr => {
                  const s = res.scores[kr.id];
                  if (!s) return null;
                  const sc = s.skor;
                  const col = sc >= 8 ? C.accent2 : sc >= 5 ? C.accent3 : C.danger;
                  return (
                    <div key={kr.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.text }}>{kr.nama}</p>
                          <Pill color={C.muted}>{kr.bobot}%</Pill>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 900, color: col }}>{sc}</span>
                          <span style={{ fontSize: 13, color: C.muted }}>/10</span>
                        </div>
                      </div>
                      {/* bar */}
                      <div style={{ background: C.border, borderRadius: 999, height: 6, margin: "8px 0" }}>
                        <div style={{ width: `${sc * 10}%`, height: "100%", background: col, borderRadius: 999, transition: "width 0.8s ease" }} />
                      </div>
                      <p style={{ margin: "8px 0 0", fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{s.komentar}</p>
                    </div>
                  );
                })}

                {res.kesimpulan && (
                  <div style={{ background: C.accent + "14", border: `1px solid ${C.accent}33`, borderRadius: 12, padding: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: C.accent, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>Kesimpulan AI</p>
                    <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.8 }}>{res.kesimpulan}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 12 }}>
        <Btn onClick={onBack} variant="ghost">← Edit Jawaban</Btn>
        <Btn onClick={onReset} variant="danger" sx={{ marginLeft: "auto" }}>↺ Mulai Ulang</Btn>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState("rubrik");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [rubrik, setRubrik] = useState([{ id: uid(), nama: "", deskripsi: "", bobot: 100 }]);
  const [students, setStudents] = useState([{ id: uid(), name: "", answer: "" }]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const assess = async () => {
    setStep("hasil");
    setLoading(true);
    setError("");
    const init = students.map(s => ({ ...s, scores: null, kesimpulan: null }));
    setResults(init);

    const updated = [...init];

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const rubrikStr = rubrik.map((k, idx) =>
        `${idx + 1}. ${k.nama}${k.deskripsi ? ` — Indikator: ${k.deskripsi}` : ""} (bobot ${k.bobot}%)`
      ).join("\n");

      const prompt = `Kamu adalah penilai akademik profesional Indonesia. Nilai jawaban/karya tulis murid berdasarkan rubrik yang telah ditentukan.

Tugas: "${title}"
${context ? `Konteks: ${context}` : ""}

Kriteria Penilaian:
${rubrikStr}

Jawaban Murid (${s.name}):
"""
${s.answer}
"""

Nilai tiap kriteria dengan skor 1–10 (bilangan bulat) dan berikan komentar singkat per kriteria.
Kemudian beri kesimpulan keseluruhan 2–3 kalimat.

WAJIB balas HANYA dengan JSON berikut, tanpa teks lain:
{
  "scores": {
    ${rubrik.map(k => `"${k.id}": { "skor": <angka 1-10>, "komentar": "<komentar singkat>" }`).join(",\n    ")}
  },
  "kesimpulan": "<kesimpulan keseluruhan>"
}`;

      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const data = await res.json();
        const raw = data.content?.map(c => c.text || "").join("") || "";
        const clean = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        updated[i] = { ...updated[i], scores: parsed.scores, kesimpulan: parsed.kesimpulan };
      } catch (e) {
        updated[i] = { ...updated[i], scores: {}, kesimpulan: "Gagal mendapatkan penilaian." };
      }
      setResults([...updated]);
    }

    setLoading(false);
  };

  const reset = () => {
    setStep("rubrik");
    setTitle(""); setContext("");
    setRubrik([{ id: uid(), nama: "", deskripsi: "", bobot: 100 }]);
    setStudents([{ id: uid(), name: "", answer: "" }]);
    setResults([]); setError("");
  };

  const STEPS = ["rubrik", "jawaban", "hasil"];
  const stepIdx = STEPS.indexOf(step);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "20px 24px", display: "flex", alignItems: "center", gap: 16,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: C.accent + "22",
          border: `1.5px solid ${C.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>📋</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: C.text }}>
            AI Assessment Tool
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
            Sistem Penilaian Rubrik Otomatis{" "}
            <span style={{ color: C.accent2, fontWeight: 700 }}>by zaaaxx</span>
          </p>
        </div>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["Rubrik", "Jawaban", "Hasil"].map((label, idx) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800,
                background: idx === stepIdx ? C.accent : idx < stepIdx ? C.accent2 + "33" : C.border,
                color: idx === stepIdx ? "#fff" : idx < stepIdx ? C.accent2 : C.muted,
                border: idx < stepIdx ? `1.5px solid ${C.accent2}66` : "none",
              }}>{idx < stepIdx ? "✓" : idx + 1}</div>
              <span style={{ fontSize: 11, color: idx === stepIdx ? C.text : C.muted, display: window.innerWidth > 400 ? "inline" : "none" }}>{label}</span>
              {idx < 2 && <span style={{ color: C.border, fontSize: 16, margin: "0 2px" }}>›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px 60px" }}>
        {step === "rubrik" && (
          <RubrikBuilder rubrik={rubrik} setRubrik={setRubrik}
            title={title} setTitle={setTitle}
            context={context} setContext={setContext}
            onNext={() => setStep("jawaban")} />
        )}
        {step === "jawaban" && (
          <InputJawaban rubrik={rubrik} title={title}
            students={students} setStudents={setStudents}
            onBack={() => setStep("rubrik")} onAssess={assess} />
        )}
        {step === "hasil" && (
          <HasilPenilaian results={results} rubrik={rubrik} loading={loading} error={error}
            onBack={() => setStep("jawaban")} onReset={reset} />
        )}
      </div>
    </div>
  );
}
