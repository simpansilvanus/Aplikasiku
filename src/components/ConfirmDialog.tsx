import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  details,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  danger = true,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-full shrink-0 ${danger ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
              {danger ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-stone-900 text-sm">{title}</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{message}</p>
              
              {details && (
                <div className="mt-3 p-2.5 bg-stone-50 border border-stone-200 rounded text-xs text-stone-700">
                  {details}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 p-1 rounded transition"
              aria-label="Tutup dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-stone-50 px-5 py-3 border-t border-stone-200 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-stone-300 text-stone-700 rounded font-medium hover:bg-stone-100 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-1.5 rounded font-bold shadow-sm transition text-white ${
              danger 
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
