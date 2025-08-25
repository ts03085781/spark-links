-- 建立一個安全的函數來處理用戶註冊
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, skills, experience_description, work_mode, partner_description, location_preference, is_public)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    '{}',
    '',
    'fulltime',
    '',
    'remote',
    false
  );
  return new;
end;
$$ language plpgsql security definer;

-- 建立觸發器，當新用戶註冊時自動建立 profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();