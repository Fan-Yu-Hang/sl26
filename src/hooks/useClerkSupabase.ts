import { useSession } from '@clerk/clerk-react'
import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export function useClerkSupabase() {
  const { session } = useSession()

  return useMemo(() => {
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await session?.getToken({
            template: 'supabase',
          })

          const headers = new Headers(options?.headers)
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`)
          }

          return fetch(url, {
            ...options,
            headers,
          })
        },
      },
    })
  }, [session])
}
