import React, { useState, forwardRef } from 'react';
import { TextInput, TextInputProps } from './TextInput';

export const PasswordInput = forwardRef<HTMLInputElement, TextInputProps>(({ className, ...props }, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextInput ref={ref} type={show ? 'text' : 'password'} className={`pr-12 ${className || ''}`} {...props} />
      <button 
        type="button" 
        onClick={() => setShow(!show)}
        className="absolute right-3 top-[34px] w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)]"
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';