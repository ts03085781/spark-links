-- 檢查現有的觸發器
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'on_auth_user_created';

-- 如果沒有觸發器，重新建立
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 重新建立函數
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, skills, experience_description, work_mode, partner_description, location_preference, is_public)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    '{}',
    '',
    'fulltime',
    '',
    'remote',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重新建立觸發器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 檢查現有的 auth 用戶但沒有 profile 的記錄
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created,
    u.id as profile_exists
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;