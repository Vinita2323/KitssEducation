import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = (msg) => addToast(msg, "success");
  const showError = (msg) => addToast(msg, "error");
  const showInfo = (msg) => addToast(msg, "info");

  return (
    <ToastContext.Provider value={{ addToast, showSuccess, showError, showInfo }}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-0 ${
              toast.type === "success"
                ? "bg-white border-[#17B26A]/30 text-[#0A1D3F]"
                : toast.type === "error"
                ? "bg-white border-[#D92D20]/30 text-[#D92D20]"
                : "bg-white border-[#133C8B]/30 text-[#0A1D3F]"
            }`}
          >
            {toast.type === "success" && (
              <div className="w-7 h-7 rounded-full bg-[#ECFDF3] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#17B26A]" />
              </div>
            )}
            {toast.type === "error" && (
              <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-[#D92D20]" />
              </div>
            )}
            {toast.type === "info" && (
              <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-[#133C8B]" />
              </div>
            )}

            <div className="flex-1 leading-snug">{toast.message}</div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-gray-400 hover:text-gray-700 transition"
              aria-label="Close Toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
