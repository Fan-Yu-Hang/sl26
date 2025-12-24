import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '@/lib/supabase'

/**
 * Hook: 同步 Clerk 用户到 Supabase
 * 当用户通过 Clerk 登录时，自动在 Supabase 中创建或更新用户记录
 */
export function useClerkSupabaseSync() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded) return

    async function syncUser() {
      if (!user) {
        // 用户未登录，不需要同步
        return
      }

      try {
        // 检查 Supabase 中是否已存在该用户
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', user.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 表示没有找到记录，这是正常的
          // 其他错误需要处理
          console.error('查询用户失败:', fetchError)
          return
        }

        const userData = {
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          image_url: user.imageUrl || '',
          updated_at: new Date().toISOString(),
        }

        if (existingUser) {
          // 用户已存在，更新信息
          const { error: updateError } = await supabase
            .from('users')
            .update(userData)
            .eq('clerk_id', user.id)

          if (updateError) {
            console.error('更新用户失败:', updateError)
          } else {
            console.log('✅ Supabase 用户信息已更新')
          }
        } else {
          // 用户不存在，创建新用户
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                ...userData,
                created_at: new Date().toISOString(),
              },
            ])

          if (insertError) {
            console.error('创建用户失败:', insertError)
          } else {
            console.log('✅ 新用户已同步到 Supabase')
          }
        }
      } catch (error: any) {
        console.error('同步用户到 Supabase 时出错:', error)
      }
    }

    syncUser()
  }, [user, isLoaded])
}

