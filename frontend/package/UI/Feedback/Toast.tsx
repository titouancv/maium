import React from 'react';

export function Toast({ message, type = 'info', isVisible }: { message: string, type?: 'info'|'success'|'error', isVisible: boolean }) {
  if (!isVisible) return null;
  const colors = { info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-500' };
  
  return (
    <div className="fixed top-14 left-4 right-4 z-50 animate-slide-down">
      <div className={`${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center`}>
        {message}
      </div>
    </div>
  );
}