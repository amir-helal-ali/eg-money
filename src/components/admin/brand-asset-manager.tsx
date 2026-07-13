'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Trash2, Edit, Check, Image as ImageIcon, Coins, Settings as SettingsIcon } from 'lucide-react'
import { ImageUploader } from './image-uploader'
import { toast } from 'sonner'

type BrandAsset = {
  key: string
  label: string
  url: string | null
}

const DEFAULT_ASSETS: BrandAsset[] = [
  { key: 'logo_light', label: 'Logo (Light)', url: null },
  { key: 'logo_dark', label: 'Logo (Dark)', url: null },
  { key: 'favicon', label: 'Favicon', url: null },
  { key: 'og_image', label: 'Social Share Image', url: null },
  { key: 'hero_bg', label: 'Hero Background', url: null },
  { key: 'coin_front', label: '3D Coin Front', url: null },
  { key: 'coin_back', label: '3D Coin Back', url: null },
]

export function BrandAssetManager() {
  const [assets, setAssets] = useState<BrandAsset[]>(DEFAULT_ASSETS)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState<string | null>(null)

  function openEdit(asset: BrandAsset) {
    setEditKey(asset.key)
    setEditUrl(asset.url)
  }

  function save() {
    if (!editKey) return
    setAssets(prev => prev.map(a => a.key === editKey ? { ...a, url: editUrl } : a))
    // Save to localStorage (in production, save to DB/Settings)
    try {
      const saved = JSON.parse(localStorage.getItem('brand-assets') || '{}')
      saved[editKey] = editUrl
      localStorage.setItem('brand-assets', JSON.stringify(saved))
    } catch {}
    toast.success('Brand asset updated')
    setEditKey(null)
  }

  function remove(key: string) {
    setAssets(prev => prev.map(a => a.key === key ? { ...a, url: null } : a))
    try {
      const saved = JSON.parse(localStorage.getItem('brand-assets') || '{}')
      delete saved[key]
      localStorage.setItem('brand-assets', JSON.stringify(saved))
    } catch {}
    toast.success('Asset removed')
  }

  return (
    <Card className="glass border-border/50">
      <CardContent className="p-4">
        <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
          <Coins className="w-4 h-4 text-primary" />
          Brand Assets Manager
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {assets.map((asset) => (
            <div key={asset.key} className="p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">{asset.label}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(asset)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  {asset.url && (
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-400" onClick={() => remove(asset.key)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="w-full h-16 rounded-lg overflow-hidden bg-background/50 border border-border/20 flex items-center justify-center">
                {asset.url ? (
                  <img src={asset.url} alt={asset.label} className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editKey} onOpenChange={(o) => !o && setEditKey(null)}>
          <DialogContent className="max-w-md glass-strong border-border/50">
            <DialogHeader>
              <DialogTitle>Edit {assets.find(a => a.key === editKey)?.label}</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <ImageUploader
                value={editUrl}
                onChange={setEditUrl}
                label="Upload Image"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditKey(null)}>Cancel</Button>
              <Button onClick={save} className="gap-1">
                <Check className="w-3.5 h-3.5" />
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
