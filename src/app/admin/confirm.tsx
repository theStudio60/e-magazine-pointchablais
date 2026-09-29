"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Options = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type Pending = Options & { resolve: (ok: boolean) => void };

// Modale de confirmation réutilisable.
// const { confirm, confirmDialog } = useConfirm();
// if (!(await confirm({ title: "Supprimer ?" }))) return;
// ... et afficher {confirmDialog} dans le JSX.
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (opts: Options) => new Promise<boolean>((resolve) => setPending({ ...opts, resolve })),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  const confirmDialog = pending ? <ConfirmDialog {...pending} onClose={close} /> : null;
  return { confirm, confirmDialog };
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
  onClose,
}: Options & { onClose: (ok: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="cf-ov" onMouseDown={(e) => e.target === e.currentTarget && onClose(false)}>
      <div className="cf-box" role="alertdialog" aria-modal="true" aria-labelledby="cf-title">
        <h3 id="cf-title">{title}</h3>
        {message && <div className="cf-msg">{message}</div>}
        <div className="cf-act">
          <button ref={cancelRef} type="button" className="btn btn-o" onClick={() => onClose(false)}>
            {cancelLabel}
          </button>
          <button type="button" className={"btn " + (danger ? "btn-red" : "btn-b")} onClick={() => onClose(true)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}