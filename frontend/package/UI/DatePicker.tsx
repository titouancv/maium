import React from 'react';
import { TextInput, TextInputProps } from '../Essential/TextInput';

export function DatePicker(props: TextInputProps) {
  // Mobile native date picker is excellent
  return <TextInput type="date" {...props} />;
}