import { useState } from "react";
import { X, Check } from "lucide-react";
import type { Card } from "../../types";
import type { NewCardInput } from "../../data/repositories";
import { GRADER_COLOR, GRADERS, GRADES, GRADE_LABELS } from "../../data/cardFields";
import { RAW_LABEL } from "../../lib/grading";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface EditCardSheetProps {
  card: Card;
  onClose: () => void;
  /** Only the fields this sheet edits. The caller writes them and re-reads the
   *  row, so value changes append to history rather than overwriting it. */
  onSave: (patch: Partial<NewCardInput>) => void;
}

export function EditCardSheet({ card, onClose, onSave }: EditCardSheetProps) {
  useEscapeClose(onClose);
  const [player, setPlayer] = useState(card.player);
  const [year, setYear] = useState(card.year);
  const [brand, setBrand] = useState(card.brand);
  const [team, setTeam] = useState(card.team);
  const [grader, setGrader] = useState(card.grader);
  const [grade, setGrade] = useState(card.grade);
  const [cert, setCert] = useState(card.cert);
  const [value, setValue] = useState(String(card.value));
  const [sellPrice, setSellPrice] = useState(card.sellPrice ? String(card.sellPrice) : "");
  const [popReport, setPopReport] = useState(card.popReport ? String(card.popReport) : "");

  const graderColor = GRADER_COLOR[grader] || "#1d2e4e";
  // Grading is optional here too, so a card can be corrected to raw — or graded
  // later once it comes back from a grader.
  const canSave = player.trim().length > 0 && value.trim().length > 0;

  const handleSave = () => {
    onSave({
      player: player.trim(),
      year,
      brand,
      team,
      graderCode: grader,
      grade,
      gradeLabel: GRADE_LABELS[grade] || card.gradeLabel,
      cert: cert.trim(),
      value: parseFloat(value) || 0,
      // Explicit null, not undefined: `updateCard` skips omitted keys, so
      // clearing a field has to say so or the old figure survives.
      sellPrice: sellPrice ? parseFloat(sellPrice) : null,
      popReport: popReport ? parseInt(popReport, 10) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="app-sheet mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "92dvh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-900">Edit card</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92dvh - 70px)", scrollbarWidth: "none" }}>
          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5 mt-4">Player</p>
          <input value={player} onChange={e => setPlayer(e.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none mb-4" />

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Year</p>
              <input value={year} onChange={e => setYear(e.target.value)}
                className="w-full rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Brand</p>
              <input value={brand} onChange={e => setBrand(e.target.value)}
                className="w-full rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Team</p>
              <input value={team} onChange={e => setTeam(e.target.value)}
                className="w-full rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none" />
            </div>
          </div>

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">
            Grader <span className="normal-case tracking-normal font-normal text-gray-300">— tap again to clear ({RAW_LABEL.toLowerCase()})</span>
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {GRADERS.map(g => (
              <button key={g} onClick={() => setGrader(grader === g ? "" : g)}
                className="py-3 rounded-2xl text-sm font-bold transition-all"
                style={{ background: grader === g ? (GRADER_COLOR[g] || "#1d2e4e") : "#1d2534", color: grader === g ? "#fff" : "#8492ac" }}>
                {g}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Grade</p>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {GRADES.map(g => (
              <button key={g} onClick={() => setGrade(grade === g ? "" : g)}
                className="py-3 rounded-2xl text-sm font-bold transition-all"
                style={{ background: grade === g ? graderColor : "#1d2534", color: grade === g ? "#fff" : "#8492ac" }}>
                {g}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Cert #</p>
          <input value={cert} onChange={e => setCert(e.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none mb-4 font-mono" />

          <div className="grid grid-cols-3 gap-2 mb-6">
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Value ($)</p>
              <input value={value} onChange={e => setValue(e.target.value)} inputMode="decimal" type="number"
                className="w-full rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Sell ($)</p>
              <input value={sellPrice} onChange={e => setSellPrice(e.target.value)} inputMode="decimal" type="number"
                className="w-full rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Pop</p>
              <input value={popReport} onChange={e => setPopReport(e.target.value)} inputMode="numeric" type="number"
                className="w-full rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none" />
            </div>
          </div>

          <button onClick={handleSave} disabled={!canSave}
            className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30 flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" />Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
