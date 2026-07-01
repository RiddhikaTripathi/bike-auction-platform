import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="min-h-screen px-4 flex items-center justify-center">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />

        <div
          className={cn(
            'relative w-full bg-white rounded-xl shadow-2xl transform transition-all',
            sizes[size]
          )}
        >
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </Button>
          )}

          {title && (
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            </div>
          )}

          <div className="px-6 pb-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
