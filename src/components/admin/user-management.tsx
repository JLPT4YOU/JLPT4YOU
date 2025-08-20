"use client"

import { useState, useEffect } from 'react'
import { Search, Filter, MoreHorizontal, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getIconComponent } from '@/components/settings/icon-selector'
import { getRoleClasses } from '@/lib/role-utils'
import UserEditDialog from './user-edit-dialog'
import { fetchUsers, updateUser } from '@/lib/admin-api'

interface User {
  id: string
  email: string
  name: string | null
  avatar_icon: string | null
  role: 'Free' | 'Premium' | 'Admin'
  created_at: string
  is_active: boolean
  subscription_expires_at?: string | null // premium expiry
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Fetch users from database
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersData = await fetchUsers()
      setUsers(usersData as User[])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search and role filter
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
        <UserCheck className="w-3 h-3 mr-1" />
        Hoạt động
      </Badge>
    ) : (
      <Badge variant="destructive">
        <UserX className="w-3 h-3 mr-1" />
        Tạm khóa
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải danh sách người dùng...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Tổng người dùng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Đang hoạt động</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">
              {users.filter(u => u.role === 'Premium').length}
            </div>
            <p className="text-xs text-muted-foreground">Premium</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">
              {users.filter(u => u.role === 'Admin').length}
            </div>
            <p className="text-xs text-muted-foreground">Admin</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {roleFilter === 'all' ? 'Tất cả' : roleFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setRoleFilter('all')}>
                  Tất cả
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('Free')}>
                  Free
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('Premium')}>
                  Premium
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('Admin')}>
                  Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const AvatarIcon = getIconComponent(user.avatar_icon || undefined)
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <AvatarIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name || 'Chưa đặt tên'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={getRoleClasses(user.role)}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingUser(user)}>Chỉnh sửa</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              {user.is_active ? 'Tạm khóa' : 'Kích hoạt'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy người dùng nào phù hợp
            </div>
          )}
        </CardContent>
      </Card>
      {editingUser && (
        <UserEditDialog
          user={editingUser}
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={loadUsers}
        />
      )}
    </div>
  )
}
