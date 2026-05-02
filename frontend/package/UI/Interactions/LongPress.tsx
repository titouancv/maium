import React, { useRef, useCallback } from 'react';

export function LongPress({ onLongPress, children }: { onLongPress: () => void, children: React.ReactNode }) {
  const timerRef = useRef<any>(null);

  const startpress = useCallback(() => {
    timerRef.current = setTimeout(onLongPress, 500); // 500ms
  }, [onLongPress]);

  const cancelPress = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  return (
    <div 
      onTouchStart={startpress} onTouchEnd={cancelPress} onTouchMove={cancelPress}
      onMouseDown={startpress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
      className="select-none"
    >
      {children}
    </div>
  );
}