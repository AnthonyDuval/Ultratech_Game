import { memo, useEffect } from 'react';

function DesktopToast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      className={`desktop-toast desktop-toast--${toast.type}`}
      role="status"
      aria-live="polite"
    >
      <strong className="desktop-toast-title">{toast.title}</strong>
      <p className="desktop-toast-message">{toast.message}</p>
      {toast.rewards && (
        <p className="desktop-toast-rewards">
          +{toast.rewards.bittek} ₮ · +{toast.rewards.reputation} réputation
        </p>
      )}
    </div>
  );
}

export default memo(DesktopToast);
