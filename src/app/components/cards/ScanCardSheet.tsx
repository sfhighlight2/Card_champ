import { useEffect, useState } from "react";
import { Scan, X, Check, Share2, AlertTriangle, RotateCcw } from "lucide-react";
import type { Card } from "../../types";
import { GRADER_COLOR, GRADERS, GRADES, GRADE_LABELS, ALL_YEARS, BRANDS_BY_YEAR, ALL_TEAMS } from "../../data/mockCards";
import { card2 } from "../../data/cardImages";
import { ScrollPicker } from "../shared/ScrollPicker";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";

interface ScanCardSheetProps {
  onClose: () => void;
  onAdd: (card: Card) => void;
}

export function ScanCardSheet({ onClose, onAdd }: ScanCardSheetProps) {
  const [step, setStep]         = useState(1);
  const [done, setDone]         = useState(false);
  const [player, setPlayer]     = useState("");
  const [year, setYear]         = useState("1986");
  const [brand, setBrand]       = useState("Topps");
  const [team, setTeam]         = useState("Yankees");
  const [cardNumber, setCardNumber] = useState("");
  const [grader, setGrader]     = useState("");
  const [grade, setGrade]       = useState("");
  const [cert, setCert]         = useState("");
  const [value, setValue]       = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [popReport, setPopReport] = useState("");
  const [scannedImage, setScannedImage] = useState<string | undefined>(undefined);

  const scanner = useBarcodeScanner();
  const scanDone = scanner.status === "detected";

  // Live camera + barcode decode runs only while step 1 is showing; released
  // as soon as the wizard moves on (or the sheet closes / unmounts).
  useEffect(() => {
    if (step !== 1) return;
    scanner.start();
    return () => scanner.stop();
    // scanner.start/stop are stable (useCallback with no deps); only `step`
    // should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (scanner.status === "detected" && scanner.detectedText) {
      setCert(scanner.detectedText.trim());
      setScannedImage(scanner.capturedImage ?? undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanner.status, scanner.detectedText]);

  const STEPS = ["Scan","Player","Card","Grading","Pricing","Review"];
  const gradeLabel  = GRADE_LABELS[grade] || "";
  const graderColor = GRADER_COLOR[grader] || "#111";


  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const canNext = [
    true,
    player.trim().length > 0,
    true,
    grader.length > 0 && grade.length > 0 && cert.trim().length > 0,
    value.trim().length > 0,
    true,
  ][step - 1];

  if (done) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, #c9a84c 0%, #e8c96e 45%, #b8903c 100%)" }}>
        <div className="flex flex-col items-center px-8 py-10 text-center">
          <div className="relative mb-6" style={{ perspective: "600px" }}>
            <img
              src={card2}
              alt="Reference card"
              className="w-40 rounded-xl"
              style={{ objectFit: "contain", boxShadow: "0 16px 40px rgba(0,0,0,0.35)", transform: "rotate(-2deg)" }}
              draggable={false}
            />
          </div>
          <p className="text-white/70 text-sm font-medium tracking-widest uppercase mb-2">Success</p>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Added to your<br />collection!</h2>
          <p className="text-white/70 text-sm mb-2">{player} · {year} {brand}</p>
          <div className="flex items-center gap-2 mt-1 mb-8">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white/90" style={{ background: "rgba(0,0,0,0.2)" }}>
              {grader} {grade}
            </span>
            {value && <span className="text-white font-semibold text-sm">${parseFloat(value).toLocaleString()}</span>}
          </div>
          <button
            onClick={() => {}}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm mb-3"
            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}
          >
            <Share2 className="inline w-4 h-4 mr-1.5 -mt-0.5" />
            Share
          </button>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-semibold text-sm" style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.8)" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "92vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="flex items-center justify-between px-6 pt-4 mb-6">
          <div className="flex-1 flex items-center gap-1 mr-4">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{ background: step > i ? "#111" : "#f0f0f0" }} />
            ))}
          </div>
          <span className="text-xs text-gray-400 mr-3 flex-shrink-0">{step}/{STEPS.length}</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92vh - 90px)", scrollbarWidth: "none" }}>

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Add a card</h2>
              <p className="text-sm text-gray-400 mb-6">Scan the barcode on the slab or enter manually.</p>

              <div
                className="relative w-full rounded-2xl overflow-hidden mb-5"
                style={{ height: 200, background: "#0c0c0e" }}
              >
                {scanner.status !== "error" && (
                  [["top-3 left-3","border-t-2 border-l-2"],["top-3 right-3","border-t-2 border-r-2"],["bottom-3 left-3","border-b-2 border-l-2"],["bottom-3 right-3","border-b-2 border-r-2"]].map(([pos, border], i) => (
                    <div key={i} className={`absolute w-7 h-7 ${pos} ${border} border-white/50 rounded-sm z-10`} />
                  ))
                )}

                <video
                  ref={scanner.videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ display: scanner.status === "scanning" || scanner.status === "starting" ? "block" : "none" }}
                />

                {scanner.status === "starting" && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <p className="text-white/50 text-xs font-medium">Starting camera…</p>
                  </div>
                )}

                {scanner.status === "scanning" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="absolute left-6 right-6 h-px bg-white/50 rounded-full"
                      style={{ animation: "scanLine 1.8s ease-in-out infinite" }} />
                    <Scan className="w-8 h-8 text-white/20" />
                    <style>{`@keyframes scanLine{0%,100%{top:25%}50%{top:75%}}`}</style>
                  </div>
                )}

                {scanner.status === "detected" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    {scannedImage && (
                      <img src={scannedImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" draggable={false} />
                    )}
                    <div className="relative w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <p className="relative text-white text-sm font-semibold">Detected</p>
                  </div>
                )}

                {scanner.status === "error" && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-6 text-center">
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                    <p className="text-white/70 text-xs">{scanner.errorMessage}</p>
                    <button
                      onClick={() => scanner.start()}
                      className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold"
                    >
                      <RotateCcw className="w-3 h-3" />Try Again
                    </button>
                  </div>
                )}

                {(scanner.status === "idle") && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Scan className="w-8 h-8 text-white/20" />
                  </div>
                )}
              </div>

              {(scanner.status === "scanning" || scanner.status === "detected") && (
                <p className="text-xs text-gray-400 text-center mb-3 -mt-2">
                  {scanner.status === "scanning" ? "Point the camera at the barcode on the slab" : `Cert # ${cert} detected`}
                </p>
              )}

              <button onClick={next}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold mb-3">
                {scanDone ? "Continue with scan" : "Enter manually"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Who's on the card?</h2>
              <p className="text-sm text-gray-400 mb-6">Enter the player's name.</p>
              <input
                autoFocus value={player} onChange={e => setPlayer(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canNext && next()}
                placeholder="e.g. Bo Jackson"
                className="w-full rounded-2xl bg-gray-50 px-4 py-4 text-lg text-gray-900 placeholder-gray-300 outline-none mb-6"
                style={{ fontFamily: "'Google Sans', sans-serif" }}
              />
              <button onClick={next} disabled={!canNext}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                Continue
              </button>
            </>
          )}

          {step === 3 && (() => {
            const availBrands = BRANDS_BY_YEAR(parseInt(year) || 2000);
            const currentBrand = availBrands.includes(brand) ? brand : availBrands[0];
            if (currentBrand !== brand) setBrand(currentBrand);
            return (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Card info</h2>
                <p className="text-sm text-gray-400 mb-4">Scroll to select — brands update based on the year.</p>

                <div className="flex gap-2 mb-1">
                  {["Year","Brand","Team"].map(l => (
                    <p key={l} className="flex-1 text-center text-[10px] font-medium text-gray-400 tracking-widest uppercase">{l}</p>
                  ))}
                </div>

                <div className="flex gap-2 mb-5">
                  <div className="flex-1">
                    <ScrollPicker items={ALL_YEARS} value={year || ALL_YEARS[35]} onChange={v => { setYear(v); }} />
                  </div>
                  <div className="flex-1">
                    <ScrollPicker items={availBrands} value={currentBrand} onChange={setBrand} />
                  </div>
                  <div className="flex-1">
                    <ScrollPicker items={ALL_TEAMS} value={team || ALL_TEAMS[0]} onChange={setTeam} />
                  </div>
                </div>

                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">
                  Card # <span className="normal-case font-normal tracking-normal text-gray-300">optional</span>
                </p>
                <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="e.g. #50T"
                  className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none mb-6"
                  style={{ fontFamily: "'Google Sans', sans-serif" }} />

                <button onClick={next} className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">
                  Continue
                </button>
              </>
            );
          })()}

          {step === 4 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Grading</h2>
              <p className="text-sm text-gray-400 mb-5">Select the grading company and score.</p>

              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Grader *</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {GRADERS.map(g => (
                  <button key={g} onClick={() => setGrader(g)}
                    className="py-3 rounded-2xl text-sm font-bold transition-all"
                    style={{ background: grader === g ? (GRADER_COLOR[g] || "#111") : "#f4f4f5", color: grader === g ? "#fff" : "#888" }}>
                    {g}
                  </button>
                ))}
              </div>

              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Grade *</p>
              <div className="grid grid-cols-5 gap-2 mb-1">
                {GRADES.map(g => (
                  <button key={g} onClick={() => setGrade(g)}
                    className="py-3 rounded-2xl text-sm font-bold transition-all"
                    style={{ background: grade === g ? (graderColor) : "#f4f4f5", color: grade === g ? "#fff" : "#888" }}>
                    {g}
                  </button>
                ))}
              </div>
              {grade && <p className="text-xs text-gray-400 mb-4">{gradeLabel}</p>}
              {!grade && <div className="mb-4" />}

              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Cert # *</p>
              <input value={cert} onChange={e => setCert(e.target.value)} placeholder="e.g. 22365223"
                inputMode="numeric"
                className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 outline-none font-mono mb-6" />

              <button onClick={next} disabled={!canNext}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                Continue
              </button>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">What's it worth?</h2>
              <p className="text-sm text-gray-400 mb-5">Add pricing so your collection stays up to date.</p>

              {[
                { label: "Est. Value", sub: "eBay", val: value, set: setValue, required: true, placeholder: "0" },
                { label: "Sell Price", sub: "Fanatics", val: sellPrice, set: setSellPrice, required: false, placeholder: "0" },
                { label: "Pop Report", sub: "PSA", val: popReport, set: setPopReport, required: false, placeholder: "0", noPrefix: true },
              ].map(f => (
                <div key={f.label} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">{f.label}{f.required ? " *" : ""}</p>
                    <p className="text-[10px] text-gray-300">{f.sub}</p>
                  </div>
                  <div className="relative">
                    {!f.noPrefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>}
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                      inputMode="decimal" type="number"
                      className={`w-full rounded-2xl bg-gray-50 ${!f.noPrefix ? "pl-8" : "pl-4"} pr-4 py-3.5 text-base text-gray-900 placeholder-gray-300 outline-none`}
                      style={{ fontFamily: "'Google Sans', sans-serif" }} />
                  </div>
                </div>
              ))}

              <div className="mt-6">
                <button onClick={next} disabled={!canNext}
                  className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Looks good?</h2>
              <p className="text-sm text-gray-400 mb-5">Review before adding to your collection.</p>

              <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "#f7f7f7" }}>
                <div className="h-1.5 w-full" style={{ background: graderColor }} />
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{player}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {year}{brand ? ` · ${brand}` : ""}{team ? ` · ${team}` : ""}{cardNumber ? ` · ${cardNumber}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1.5 rounded-2xl flex-shrink-0" style={{ background: graderColor }}>
                      <span className="text-xl font-black text-white leading-none">{grade}</span>
                      <span className="text-[9px] font-bold tracking-widest text-white/70 uppercase">{grader}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Cert #",     value: cert,       mono: true },
                      { label: "Condition",  value: gradeLabel              },
                      ...(value     ? [{ label: "Est. Value", value: `$${parseFloat(value).toLocaleString()}`,     sub: "eBay"     }] : []),
                      ...(sellPrice ? [{ label: "Sell Price", value: `$${parseFloat(sellPrice).toLocaleString()}`, sub: "Fanatics" }] : []),
                      ...(popReport ? [{ label: "Pop Report", value: popReport, sub: "PSA" }] : []),
                    ].map((s: { label: string; value: string; mono?: boolean; sub?: string }) => (
                      <div key={s.label} className="rounded-xl bg-white px-3 py-2.5">
                        <p className="text-[9px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">{s.label}</p>
                        <p className={`text-sm font-semibold text-gray-800 ${s.mono ? "font-mono text-xs" : ""}`}>{s.value || "—"}</p>
                        {s.sub && <p className="text-[9px] text-gray-400 mt-0.5">{s.sub}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onAdd({
                    id: Date.now(),
                    img: scannedImage ?? "",
                    player,
                    year,
                    brand,
                    team,
                    grader,
                    grade,
                    gradeLabel,
                    cert,
                    value: parseFloat(value) || 0,
                    change: 0,
                    subGrades: null,
                    autograph: false,
                    popReport: popReport ? parseInt(popReport) : undefined,
                    sellPrice: sellPrice ? parseFloat(sellPrice) : undefined,
                  });
                  setDone(true);
                }}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">
                Add to Collection
              </button>
            </>
          )}

          {step > 1 && (
            <button onClick={back} className="w-full mt-3 py-2.5 text-sm text-gray-400">← Back</button>
          )}
        </div>
      </div>
    </div>
  );
}
