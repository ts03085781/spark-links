-- 為現有的 auth 用戶建立缺少的 profile 記錄
INSERT INTO public.users (id, email, name, skills, experience_description, work_mode, partner_description, location_preference, is_public)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', ''),
    '{}',
    '',
    'fulltime',
    '',
    'remote',
    false
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- 確認結果
SELECT COUNT(*) as auth_users FROM auth.users;
SELECT COUNT(*) as profile_users FROM public.users;