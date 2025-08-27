-- 修復 project_members 表的 RLS 無限遞迴問題

-- 首先刪除有問題的政策
drop policy if exists "Project creators and members can view members" on public.project_members;
drop policy if exists "Creators can manage members" on public.project_members;
drop policy if exists "System can add members" on public.project_members;

-- 重新創建修復後的政策

-- 1. 項目創建者可以查看所有成員
create policy "Project creators can view all members" on public.project_members
    for select using (
        exists (
            select 1 from public.projects
            where id = project_id and creator_id = auth.uid()
        )
    );

-- 2. 用戶可以查看自己的成員記錄
create policy "Users can view own membership" on public.project_members
    for select using (auth.uid() = user_id);

-- 3. 項目創建者可以管理成員（增刪改）
create policy "Project creators can manage members" on public.project_members
    for all using (
        exists (
            select 1 from public.projects
            where id = project_id and creator_id = auth.uid()
        )
    );

-- 4. 系統觸發器可以自動添加創建者為成員
create policy "System can insert members" on public.project_members
    for insert with check (true);

-- 5. 禁止一般用戶直接修改成員關係（除了創建者）
create policy "Prevent unauthorized member changes" on public.project_members
    for update using (false);

create policy "Prevent unauthorized member deletion" on public.project_members
    for delete using (
        exists (
            select 1 from public.projects
            where id = project_id and creator_id = auth.uid()
        )
    );