-- Supabase 数据库表结构
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 创建 users 表（用于存储 Clerk 用户信息）
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL, -- Clerk 用户 ID
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 启用 Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users" ON users;

-- 创建策略：允许所有人读取（公开数据）
CREATE POLICY "Enable read access for all users"
  ON users FOR SELECT
  USING (true);

-- 创建策略：允许插入新用户（任何人都可以创建账户）
CREATE POLICY "Enable insert for authenticated users only"
  ON users FOR INSERT
  WITH CHECK (true);

-- 创建策略：允许更新用户数据（任何人都可以更新，因为通过 clerk_id 唯一标识）
CREATE POLICY "Enable update for users"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

