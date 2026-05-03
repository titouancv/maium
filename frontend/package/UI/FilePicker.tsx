import React, { useRef } from 'react';
import { Button } from '../Essential/Button';

export interface FilePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function FilePicker({ label = 'Choisir un fichier', className = '', ...props }: FilePickerProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <input type="file" ref={ref} className="hidden" {...props} />
      <Button variant="secondary" onClick={() => ref.current?.click()}>{label}</Button>
    </div>
  );
}