// src/contexts/ConfirmContext.jsx
// Global in-app confirm/prompt replacement. NO browser popups.
//
// Usage:
//   const confirm = useConfirm();
//   const ok = await confirm({ title: 'Delete note?', description: 'This moves it to trash.', confirmText: 'Delete', danger: true });
//   if (ok) { ... }
//
//   const value = await prompt({ title: 'New category', placeholder: 'Name' });
//   if (value) { ... }
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Dialog } from '../components/ui/Dialog.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  // state = { kind: 'confirm' | 'prompt', title, description, confirmText, cancelText, danger, placeholder, defaultValue, resolve }
  const resolverRef = useRef(null);

  const close = (value) => {
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
    setState(null);
  };

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        kind: 'confirm',
        title: opts.title || 'Are you sure?',
        description: opts.description,
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        danger: !!opts.danger,
      });
    });
  }, []);

  const prompt = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        kind: 'prompt',
        title: opts.title || 'Input',
        description: opts.description,
        placeholder: opts.placeholder,
        defaultValue: opts.defaultValue || '',
        confirmText: opts.confirmText || 'OK',
        cancelText: opts.cancelText || 'Cancel',
      });
    });
  }, []);

  const alert = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        kind: 'alert',
        title: opts.title || 'Notice',
        description: opts.description,
        confirmText: opts.confirmText || 'OK',
        danger: !!opts.danger,
        icon: opts.icon,
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, prompt, alert }}>
      {children}
      {state && <ConfirmDialog state={state} onClose={close} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({ state, onClose }) {
  const [value, setValue] = useState(state.defaultValue || '');

  const handleConfirm = () => {
    if (state.kind === 'prompt') onClose(value);
    else onClose(true);
  };
  const handleCancel = () => {
    onClose(state.kind === 'prompt' ? null : false);
  };

  return (
    <Dialog
      open
      onClose={handleCancel}
      title={state.title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={handleCancel}>{state.cancelText}</Button>
          <Button
            variant={state.danger ? 'danger' : 'primary'}
            onClick={handleConfirm}
            autoFocus={state.kind !== 'prompt'}
          >
            {state.confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-3 items-start">
        {state.danger && (
          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center dark:bg-red-900/30">
            <AlertTriangle size={18} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {state.description && <p className="text-sm text-text-main">{state.description}</p>}
          {state.kind === 'prompt' && (
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={state.placeholder}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
              className="mt-3"
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}

export function usePrompt() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('usePrompt must be used within ConfirmProvider');
  return ctx.prompt;
}

export function useAlert() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useAlert must be used within ConfirmProvider');
  return ctx.alert;
}
