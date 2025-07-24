'use client'

import { useState, useEffect } from 'react'
import { supabase, auth } from '@/lib/supabase'
import type { User } from '@/types/supabase'

export default function TestAuthPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        setMessage(`Error loading profile: ${error.message}`)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('Error loading profile')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await auth.signUp(email, password, { name })
      
      if (error) {
        setMessage(`Đăng ký thất bại: ${error.message}`)
      } else {
        setMessage('Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.')
      }
    } catch (error) {
      setMessage('Lỗi đăng ký')
    }
    
    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await auth.signInWithPassword(email, password)
      
      if (error) {
        setMessage(`Đăng nhập thất bại: ${error.message}`)
      } else {
        setMessage('Đăng nhập thành công!')
      }
    } catch (error) {
      setMessage('Lỗi đăng nhập')
    }
    
    setLoading(false)
  }

  const handleSignOut = async () => {
    setLoading(true)
    await auth.signOut()
    setMessage('Đã đăng xuất')
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await auth.signInWithGoogle()
      
      if (error) {
        setMessage(`Google đăng nhập thất bại: ${error.message}`)
      }
    } catch (error) {
      setMessage('Lỗi Google đăng nhập')
    }
    
    setLoading(false)
  }

  const updateProfile = async () => {
    if (!user || !profile) return

    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ name })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        setMessage(`Cập nhật thất bại: ${error.message}`)
      } else {
        setProfile(data)
        setMessage('Cập nhật thành công!')
      }
    } catch (error) {
      setMessage('Lỗi cập nhật')
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="p-8">Đang tải...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">🧪 Test Supabase Authentication</h1>
      
      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {message}
        </div>
      )}

      {!user ? (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Sign Up Form */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">📝 Đăng ký</h2>
            <form onSubmit={handleSignUp} className="space-y-4">
              <input
                type="text"
                placeholder="Tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Đăng ký
              </button>
            </form>
          </div>

          {/* Sign In Form */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🔑 Đăng nhập</h2>
            <form onSubmit={handleSignIn} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Đăng nhập
              </button>
            </form>
            
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              🔍 Đăng nhập với Google
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">👤 Thông tin người dùng</h2>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Đăng xuất
            </button>
          </div>

          {/* Auth User Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Auth User:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          {/* Profile Info */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold mb-2">Database Profile:</h3>
            {profile ? (
              <pre className="text-sm overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            ) : (
              <p>Không tìm thấy profile trong database</p>
            )}
          </div>

          {/* Update Profile */}
          <div className="space-y-4">
            <h3 className="font-semibold">✏️ Cập nhật thông tin</h3>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Tên mới"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 p-3 border rounded-lg"
              />
              <button
                onClick={updateProfile}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
