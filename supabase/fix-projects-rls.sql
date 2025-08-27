-- 修復 projects 表的 RLS 無限遞迴問題

-- 首先刪除有問題的政策
drop policy if exists "Members can view their projects" on public.projects;

-- 簡化政策，避免循環查詢
-- 1. 任何人都可以查看公開且正在招募的項目
-- 已存在：create policy "Anyone can view public recruiting projects" on public.projects

-- 2. 項目創建者可以查看自己的項目
-- 已存在：create policy "Creators can view own projects" on public.projects

-- 3. 暫時移除成員查看項目的政策，避免循環依賴
-- 成員可以通過其他方式（如應用層邏輯）來查看相關項目

-- 或者使用安全定義函數來避免 RLS 循環
create or replace function public.user_project_ids()
returns uuid[] as $$
begin
    return array(
        select pm.project_id 
        from public.project_members pm
        where pm.user_id = auth.uid()
    );
end;
$$ language plpgsql security definer;

-- 使用函數重新創建成員查看項目的政策
create policy "Members can view their projects via function" on public.projects
    for select using (
        id = any(public.user_project_ids())
    );