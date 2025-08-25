-- 修正用戶表的 RLS 政策
-- 先刪除現有的 INSERT 政策
drop policy if exists "Users can insert own profile" on public.users;

-- 創建新的 INSERT 政策，允許註冊時插入
-- 這個政策允許任何已認證的用戶插入自己的資料
create policy "Users can insert own profile" on public.users
    for insert 
    with check (auth.uid() = id);

-- 如果上面還是有問題，可以使用這個更寬鬆的政策
-- create policy "Allow user registration" on public.users
--     for insert 
--     with check (auth.uid() is not null and auth.uid() = id);

-- 確保用戶可以在註冊後立即查看自己的資料
-- 這個政策應該已經存在，但我們再確認一次
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users
    for select using (auth.uid() = id);

-- 確保已認證用戶可以查看公開的個人資料
drop policy if exists "Users can view public profiles" on public.users;
create policy "Users can view public profiles" on public.users
    for select using (is_public = true);

-- 確保用戶可以更新自己的資料
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users
    for update using (auth.uid() = id);