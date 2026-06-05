"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  addPartAction,
  uploadPhotoAction,
  saveSignatureAction,
  type FormState,
} from "@/server/modules/field/actions";
import { FormError } from "@/components/ui/form";
import { t } from "@/i18n";

const input =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-base outline-none focus:border-foreground/40 dark:border-white/20";
const btn =
  "w-full rounded-md bg-foreground px-3 py-3 text-base font-medium text-background hover:opacity-90 disabled:opacity-50";

function useResetOnOk(
  ok: boolean | undefined,
  ref: React.RefObject<HTMLFormElement | null>,
) {
  useEffect(() => {
    if (ok) ref.current?.reset();
  }, [ok, ref]);
}

export function AddPartForm({ jobId }: { jobId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addPartAction,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useResetOnOk(state.ok, ref);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <FormError message={state.error} />
      <input type="hidden" name="jobId" value={jobId} />
      <input className={input} name="description" placeholder={t.field.partName} required />
      <div className="flex gap-2">
        <input
          className={input}
          name="quantity"
          type="number"
          step="0.5"
          min="0"
          defaultValue="1"
          placeholder={t.qty}
        />
        <input
          className={input}
          name="unitPrice"
          type="number"
          step="0.01"
          min="0"
          placeholder={`${t.field.price} ฿`}
        />
      </div>
      <button className={btn} disabled={pending}>
        {t.field.addPart}
      </button>
    </form>
  );
}

export function PhotoUpload({ jobId }: { jobId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    uploadPhotoAction,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useResetOnOk(state.ok, ref);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <FormError message={state.error} />
      <input type="hidden" name="jobId" value={jobId} />
      <input
        className={input}
        type="file"
        name="photo"
        accept="image/*"
        capture="environment"
        required
      />
      <button className={btn} disabled={pending}>
        {t.field.addPhoto}
      </button>
    </form>
  );
}

export function SignaturePad({ jobId }: { jobId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveSignatureAction,
    {},
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState("");
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";

    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      drawing.current = true;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };
    const move = (e: PointerEvent) => {
      if (!drawing.current) return;
      const p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };
    const up = () => {
      if (!drawing.current) return;
      drawing.current = false;
      setDataUrl(canvas.toDataURL("image/png"));
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDataUrl("");
  }

  return (
    <form action={action} className="space-y-2">
      <FormError message={state.error} />
      {state.ok && (
        <p className="text-sm text-green-600 dark:text-green-400">
          {t.field.signed}
        </p>
      )}
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="signature" value={dataUrl} />
      <p className="text-sm text-foreground/60">{t.field.signHere}</p>
      <canvas
        ref={canvasRef}
        width={360}
        height={160}
        className="w-full touch-none rounded-md border border-dashed border-black/30 bg-white dark:border-white/30"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20"
        >
          {t.field.clear}
        </button>
        <button
          className="flex-1 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
          disabled={pending || !dataUrl}
        >
          {t.field.saveSignature}
        </button>
      </div>
    </form>
  );
}
