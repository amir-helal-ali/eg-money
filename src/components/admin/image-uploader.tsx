'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Upload, X, Check, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

type ImageUploaderProps = {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
  className?: string
}

export function ImageUploader({ value, onChange, label = 'Image', className = '' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    // Validate
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: PNG, JPG, SVG, WebP, GIF')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max: 2MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await res.json()
      onChange(data.url)
      toast.success('Image uploaded')
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onChange])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  function handleRemove() {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={className}>
      {label && <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>}
      <div className="flex items-center gap-3">
        {/* Preview */}
        <div className="w-14 h-14 rounded-lg border border-border/50 overflow-hidden bg-muted/30 flex items-center justify-center flex-shrink-0">
          {value ? (
            <img src={value} alt="preview" className="w-full h-full object-contain" />
          ) : (
            <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
          )}
        </div>

        {/* Upload area */}
        <div
          className={`flex-1 border-2 border-dashed rounded-lg p-2 transition-colors cursor-pointer ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1.5">
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading...
              </>
            ) : value ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                <span className="truncate max-w-[120px]">{value}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove() }}
                  className="text-rose-400 hover:text-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Drop image or click to upload
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
