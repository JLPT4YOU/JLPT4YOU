"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchUsers, adminApiRequest } from '@/lib/admin-api'
import { Badge } from '@/components/ui/badge'

interface User { id: string; email: string; name: string | null }

export function NotificationsManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [filterType, setFilterType] = useState<'all'|'top_up_success'|'premium_upgrade'|'redeem_code'|'admin_message'|'system'>('all')
  const [filterUserId, setFilterUserId] = useState<string>('all')
  const [sent, setSent] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(false)

  // form states
  const [targetUserId, setTargetUserId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<'low'|'normal'|'high'>('normal')
  const [sending, setSending] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastContent, setBroadcastContent] = useState('')
  const [broadcastPriority, setBroadcastPriority] = useState<'low'|'normal'|'high'>('normal')
  const [broadcasting, setBroadcasting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingUsers(true)
        const list = await fetchUsers()
        setUsers(list)
      } catch (e) {
        console.error('Load users error', e)
      } finally {
        setLoadingUsers(false)
      }
    }
    load()
  }, [])

  const refreshList = async () => {
    try {
      setLoadingList(true)
      const params = new URLSearchParams()
      if (filterType !== 'all') params.set('type', filterType)
      if (filterUserId !== 'all') params.set('userId', filterUserId)
      const res = await adminApiRequest(`/api/admin/notifications?${params.toString()}`)
      if (!res?.ok) throw new Error('Fetch notifications failed')
      const data = await res.json()
      setSent(data.notifications || [])
    } catch (e) {
      console.error('Fetch notifications error', e)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    refreshList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterUserId])

  const handleSend = async () => {
    if (!targetUserId || !title || !content) return
    try {
      setSending(true)
      const res = await adminApiRequest('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({ userId: targetUserId, title, content, priority })
      })
      if (!res?.ok) throw new Error('Send failed')
      setTitle(''); setContent(''); setPriority('normal')
      refreshList()
    } catch (e) {
      console.error('Send notification error', e)
    } finally {
      setSending(false)
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastTitle || !broadcastContent) return
    try {
      setBroadcasting(true)
      const res = await adminApiRequest('/api/admin/notifications', {
        method: 'PUT',
        body: JSON.stringify({ title: broadcastTitle, content: broadcastContent, priority: broadcastPriority })
      })
      if (!res?.ok) throw new Error('Broadcast failed')
      setBroadcastTitle(''); setBroadcastContent(''); setBroadcastPriority('normal')
      refreshList()
    } catch (e) {
      console.error('Broadcast notification error', e)
    } finally {
      setBroadcasting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="send">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="send">Gửi cá nhân</TabsTrigger>
          <TabsTrigger value="broadcast">Thông báo hệ thống</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Gửi thông báo cho user</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <Select value={targetUserId} onValueChange={setTargetUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingUsers ? 'Đang tải...' : 'Chọn user'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề" />
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger><SelectValue placeholder="Mức độ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="normal">Bình thường</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Nội dung" rows={5} />
              <div className="flex justify-end">
                <Button onClick={handleSend} disabled={sending || !targetUserId || !title || !content}>
                  {sending ? 'Đang gửi...' : 'Gửi thông báo'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast">
          <Card>
            <CardHeader>
              <CardTitle>Thông báo hệ thống (broadcast)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} placeholder="Tiêu đề" />
                <Select value={broadcastPriority} onValueChange={(v: any) => setBroadcastPriority(v)}>
                  <SelectTrigger><SelectValue placeholder="Mức độ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="normal">Bình thường</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea value={broadcastContent} onChange={e => setBroadcastContent(e.target.value)} placeholder="Nội dung" rows={5} />
              <div className="flex justify-end">
                <Button onClick={handleBroadcast} disabled={broadcasting || !broadcastTitle || !broadcastContent}>
                  {broadcasting ? 'Đang gửi...' : 'Gửi thông báo hệ thống'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thông báo đã gửi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <Select value={filterType} onValueChange={(v:any) => setFilterType(v)}>
              <SelectTrigger className="w-full md:w-60"><SelectValue placeholder="Loại thông báo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="top_up_success">Nạp tiền</SelectItem>
                <SelectItem value="premium_upgrade">Premium</SelectItem>
                <SelectItem value="redeem_code">Redeem code</SelectItem>
                <SelectItem value="admin_message">Admin message</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUserId} onValueChange={(v:any) => setFilterUserId(v)}>
              <SelectTrigger className="w-full md:w-60"><SelectValue placeholder="Người dùng" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refreshList} disabled={loadingList}>Làm mới</Button>
          </div>

          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sent.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">{new Date(item.created_at).toLocaleString('vi-VN')}</TableCell>
                    <TableCell className="whitespace-nowrap">{users.find(u => u.id === item.user_id)?.email || item.user_id}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.type}</Badge>
                    </TableCell>
                    <TableCell>{item.title}</TableCell>
                  </TableRow>
                ))}
                {sent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Không có dữ liệu</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

