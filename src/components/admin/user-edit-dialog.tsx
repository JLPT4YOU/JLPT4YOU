import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Plus } from 'lucide-react'
import { updateUser, fetchUserBalance, topupUserBalance } from '@/lib/admin-api'
import { formatBalance } from '@/lib/balance-utils'
import { createClient } from '@/utils/supabase/client'

// ✅ FIXED: Create supabase client instance
const supabase = createClient()

interface EditDialogProps {
  user: any | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export default function UserEditDialog({ user, open, onClose, onSaved }: EditDialogProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    avatar_icon: '',
    role: 'Free',
    is_active: true,
    expiryDate: ''
  })
  const [saving, setSaving] = useState(false)
  const [userBalance, setUserBalance] = useState<number>(0)
  const [topupAmount, setTopupAmount] = useState<string>('')
  const [topupDescription, setTopupDescription] = useState<string>('')
  const [topupLoading, setTopupLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email,
        avatar_icon: user.avatar_icon || '',
        role: user.role,
        is_active: user.is_active,
        expiryDate: user.subscription_expires_at || user.expiryDate || ''
      })
      // Fetch user balance
      loadUserBalance(user.id)
    }
  }, [user])

  const loadUserBalance = async (userId: string) => {
    try {
      const balance = await fetchUserBalance(userId)
      setUserBalance(balance)
    } catch (error) {
      console.error('Error fetching user balance:', error)
      setUserBalance(0)
    }
  }

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateUser(user.id, form)
      onSaved()
      onClose()
    } catch (err) {
      console.error('Error updating user:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleTopUp = async () => {
    if (!user || !topupAmount || parseFloat(topupAmount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ')
      return
    }

    setTopupLoading(true)
    try {
      const newBalance = await topupUserBalance(
        user.id,
        parseFloat(topupAmount),
        topupDescription || `Admin top-up: $${topupAmount}`
      )

      setUserBalance(newBalance)
      setTopupAmount('')
      setTopupDescription('')
      alert('Top-up thành công!')
    } catch (error) {
      console.error('Top-up error:', error)
      alert(`Đã xảy ra lỗi khi top-up: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTopupLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Balance Management Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Quản lý số dư
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Số dư hiện tại:</span>
                <span className="font-semibold text-green-600">{formatBalance(userBalance)}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="Số tiền"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <Input
                  placeholder="Ghi chú (tùy chọn)"
                  value={topupDescription}
                  onChange={(e) => setTopupDescription(e.target.value)}
                  className="col-span-1"
                />
                <Button
                  onClick={handleTopUp}
                  disabled={topupLoading || !topupAmount || parseFloat(topupAmount) <= 0}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {topupLoading ? 'Đang xử lý...' : 'Top-up'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="name">Tên</Label>
            <Input id="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar Icon</Label>
            <Input id="avatar" value={form.avatar_icon} onChange={(e) => handleChange('avatar_icon', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(val) => handleChange('role', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label>Hoạt động</Label>
            <Switch checked={form.is_active} onCheckedChange={(v) => handleChange('is_active', v)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Hạn Premium</Label>
            <Input
              id="expiry"
              type="date"
              value={form.expiryDate ? new Date(form.expiryDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleChange('expiryDate', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
