import React from 'react';

// Utility component/hook for haptic feedback
// In real app, call vibrate() in your handlers instead of rendering a component
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (type === 'light') navigator.vibrate(10);
    if (type === 'medium') navigator.vibrate(20);
    if (type === 'heavy') navigator.vibrate(40);
  }
}

export function HapticArea({ children, type = 'light' }: { children: React.ReactNode, type?: 'light' | 'medium' | 'heavy' }) {
  return <div onClick={() => triggerHaptic(type)}>{children}</div>;
}