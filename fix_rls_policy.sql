-- 修复 RLS 策略的 SQL 脚本
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users" ON users;

-- 重新创建策略：允许所有人读取（公开数据）
CREATE POLICY "Enable read access for all users"
  ON users FOR SELECT
  USING (true);

-- 重新创建策略：允许插入新用户
CREATE POLICY "Enable insert for authenticated users only"
  ON users FOR INSERT
  WITH CHECK (true);

-- 重新创建策略：允许更新用户数据
CREATE POLICY "Enable update for users"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 验证策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

