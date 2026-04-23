'use client'
import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({ value, onChange, placeholder = 'Add tag...', className }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
  }

  function removeTag(tag: string) {
    onChange(value.filter(t => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5 p-2 border rounded-md min-h-10 bg-white', className)}>
      {value.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
        >
          #{tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:text-indigo-900"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputValue && addTag(inputValue)}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-20 outline-none text-sm bg-transparent placeholder:text-gray-400"
      />
    </div>
  )
}
