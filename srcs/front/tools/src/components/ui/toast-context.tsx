import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toaster } from './toaster';

interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, 'id'>) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...message, id };
    
    setToasts(prev => [...prev, newToast]);
    
    const duration = message.duration || 5000;
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const success = useCallback((message: string) => {
    toast({ description: message, variant: 'success' });
  }, [toast]);

  const error = useCallback((message: string) => {
    toast({ description: message, variant: 'destructive' });
  }, [toast]);

  const warning = useCallback((message: string) => {
    toast({ description: message, variant: 'warning' });
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
};