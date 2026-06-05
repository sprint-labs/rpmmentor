import { useMemo, useState, type ReactNode } from "react";
import { X, CheckCircle2, Upload, AlertCircle } from "lucide-react";
import { goalkeepers, mentors } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import {
  ACCEPT_BY_KIND,
  MAX_FILE_BYTES,
  detectKind,
  formatBytes,
  uploadMedia,
  type MediaKind,
} from "@/lib/media-store";

export type WorkflowKind = "interaction" | "report" | "media" | "goalkeeper";

const TITLES: Record<WorkflowKind, string> = {
  interaction: "Log Interaction",
  report: "Submit Report",
  media: "Upload Media",
  goalkeeper: "Add Goalkeeper",
};

export function WorkflowDialog({ kind, onClose }: { kind: WorkflowKind | null; onClose: () => void }) {
  if (!kind) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div>
            <h3 className="text-base font-semibold">{TITLES[kind]}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Saved locally to this session</p>
          </div>
          <button onClick={onClose} className="size-8 grid place-items-center rounded-md hover:bg-accent"><X className="size-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto">
          {kind === "interaction" && <InteractionForm onDone={onClose} />}
          {kind === "report" && <ReportForm onDone={onClose} />}
          {kind === "media" && <MediaForm onDone={onClose} />}
          {kind === "goalkeeper" && <GoalkeeperForm onDone={onClose} />}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
const inputCls = "w-full h-9 px-3 rounded-md bg-input/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";
const selectCls = inputCls;
const taCls = "w-full px-3 py-2 rounded-md bg-input/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none";

function Submitted({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <div className="text-center py-6">
      <CheckCircle2 className="size-10 text-primary mx-auto" />
      <p className="text-sm font-medium mt-3">{message}</p>
      <button onClick={onDone} className="mt-4 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Close</button>
    </div>
  );
}

function InteractionForm({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(false);
  if (done) return <Submitted message="Interaction logged successfully." onDone={onDone} />;
  return (
    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Goalkeeper"><select className={selectCls} required defaultValue="">{!"".length && <option value="" disabled>Select…</option>}{goalkeepers.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        <Field label="Interaction Type"><select className={selectCls} required>{["Live Match", "Training Observation", "Face to Face", "Video Review", "Phone Call", "WhatsApp", "Other"].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Date"><input type="date" className={inputCls} defaultValue={new Date().toISOString().slice(0, 10)} required /></Field>
        <Field label="Outcome"><select className={selectCls}>{["On track", "Above expectation", "Below expectation", "Needs follow-up", "Action plan agreed"].map((t) => <option key={t}>{t}</option>)}</select></Field>
      </div>
      <Field label="Notes"><textarea rows={4} className={taCls} placeholder="What did you observe?" required /></Field>
      <Field label="Follow-up Action"><input className={inputCls} placeholder="e.g. Schedule video review next week" /></Field>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onDone} className="h-9 px-3 rounded-md border border-border text-sm">Cancel</button><button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Save Interaction</button></div>
    </form>
  );
}

function ReportForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [done, setDone] = useState(false);
  const [scores, setScores] = useState({ handling: 7, distribution: 7, aerial: 7, oneVone: 7, communication: 7 });
  if (done) return <Submitted message="Report submitted." onDone={onDone} />;

  const types = user?.role === "scout"
    ? ["Recruitment", "Opposition GK", "Match Report"]
    : ["Goalkeeper Development", "Match Report", "Training Report", "Opposition GK", "Recruitment"];

  return (
    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Report Type"><select className={selectCls} required>{types.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Goalkeeper"><select className={selectCls} required>{goalkeepers.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        <Field label="Date"><input type="date" className={inputCls} defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
        <Field label="Overall Rating (0–100)"><input type="number" min={0} max={100} defaultValue={75} className={inputCls} /></Field>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Structured Scoring (0–10)</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(scores).map(([k, v]) => (
            <div key={k}>
              <label className="text-[10px] text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1")}</label>
              <input type="number" min={0} max={10} value={v} onChange={(e) => setScores({ ...scores, [k]: Number(e.target.value) })} className={inputCls} />
            </div>
          ))}
        </div>
      </div>
      <Field label="Written Observations"><textarea rows={5} className={taCls} placeholder="Summary, key moments, strengths, areas to develop…" required /></Field>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onDone} className="h-9 px-3 rounded-md border border-border text-sm">Cancel</button><button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Submit Report</button></div>
    </form>
  );
}

function MediaForm({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(false);
  if (done) return <Submitted message="Media uploaded and linked." onDone={onDone} />;
  return (
    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Media Type"><select className={selectCls}>{["Video clip", "PDF", "Image", "Voice note"].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Linked Goalkeeper"><select className={selectCls}>{goalkeepers.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
      </div>
      <Field label="Title"><input className={inputCls} placeholder="e.g. Match clip vs derby — 2nd half" required /></Field>
      <Field label="File">
        <label className="flex flex-col items-center justify-center gap-1.5 h-32 rounded-md border-2 border-dashed border-border hover:border-primary/40 cursor-pointer bg-input/30">
          <span className="text-sm font-medium">Click or drag a file to upload</span>
          <span className="text-[11px] text-muted-foreground">Up to 500MB · video, audio, image or PDF</span>
          <input type="file" className="hidden" />
        </label>
      </Field>
      <Field label="Notes"><textarea rows={3} className={taCls} placeholder="Context for reviewers…" /></Field>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onDone} className="h-9 px-3 rounded-md border border-border text-sm">Cancel</button><button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Upload</button></div>
    </form>
  );
}

function GoalkeeperForm({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(false);
  if (done) return <Submitted message="Goalkeeper added to the database." onDone={onDone} />;
  return (
    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full Name"><input className={inputCls} placeholder="e.g. Aiden Walsh" required /></Field>
        <Field label="Date of Birth"><input type="date" className={inputCls} /></Field>
        <Field label="Nationality"><input className={inputCls} placeholder="e.g. Ireland" /></Field>
        <Field label="Club"><input className={inputCls} placeholder="e.g. Shamrock Rovers" /></Field>
        <Field label="League"><input className={inputCls} placeholder="e.g. League of Ireland" /></Field>
        <Field label="Height"><input className={inputCls} placeholder="e.g. 192cm" /></Field>
        <Field label="Tier"><select className={selectCls}>{["Tier 1", "Tier 2", "Tier 3"].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Assign Mentor"><select className={selectCls}><option value="">— Unassigned —</option>{mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
        <Field label="Contract Until"><input type="date" className={inputCls} /></Field>
        <Field label="Recommendation"><select className={selectCls}>{["Monitor", "Sign", "Loan", "Pass"].map((t) => <option key={t}>{t}</option>)}</select></Field>
      </div>
      <Field label="Initial Scouting Notes"><textarea rows={4} className={taCls} placeholder="Profile summary, source, context…" /></Field>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onDone} className="h-9 px-3 rounded-md border border-border text-sm">Cancel</button><button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Add Goalkeeper</button></div>
    </form>
  );
}
