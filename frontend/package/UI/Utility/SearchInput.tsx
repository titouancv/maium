import React from 'react';
import { TextInput, TextInputProps } from '../Essential/TextInput';

export function SearchInput(props: TextInputProps) {
  return (
    <div className="relative w-full">
      <TextInput className="pl-10 rounded-full bg-[var(--color-surface-raised)]" {...props} />
      <span className="absolute left-4 top-3.5 text-[var(--color-text-muted)]">🔍</span>
    </div>
  );
}