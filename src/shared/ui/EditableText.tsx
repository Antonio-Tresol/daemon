'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';

type EditableTextProps = {
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
  className?: string;
};

export function EditableText({
  value,
  placeholder = 'Untitled',
  onSave,
  className,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const save = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  }, [draft, value, onSave]);

  const cancel = useCallback(() => {
    setDraft(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    },
    [save, cancel],
  );

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          'rounded-md border border-accent/40 bg-card px-2 py-0.5 text-sm text-foreground outline-none',
          'focus:border-accent focus:ring-1 focus:ring-accent/30',
          'placeholder:text-muted/60',
          className,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      title="Click to rename"
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm text-foreground',
        'hover:bg-card-border/40 transition-colors cursor-text',
        className,
      )}
    >
      <span className={value ? '' : 'text-muted/60'}>
        {value || placeholder}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3 w-3 text-muted opacity-0 group-hover:opacity-60 transition-opacity"
      >
        <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L3.22 10.306a1 1 0 0 0-.26.445l-.813 3.04a.5.5 0 0 0 .608.608l3.04-.813a1 1 0 0 0 .445-.26l7.793-7.793a1.75 1.75 0 0 0 0-2.475l-.544-.544ZM11.72 3.22a.25.25 0 0 1 .354 0l.544.544a.25.25 0 0 1 0 .354L5.664 11.072l-1.596.427.427-1.596L11.72 3.22Z" />
      </svg>
    </button>
  );
}
