-- 創建頭像存儲 bucket
-- 注意：這個腳本需要在 Supabase Dashboard 的 SQL Editor 中執行

-- 1. 創建 avatars bucket (需要在 Supabase Dashboard Storage 頁面手動創建)
-- Bucket 名稱: avatars
-- 設定為 Public bucket: 是
-- 檔案大小限制: 5MB
-- 允許的檔案類型: image/*

-- 2. 設置 Storage RLS 策略
-- 允許用戶上傳自己的頭像
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 允許用戶更新自己的頭像
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 允許用戶刪除自己的頭像
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 所有人都可以查看頭像 (公開讀取)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 3. 創建用於增加團隊人數的函數 (如果還沒有的話)
CREATE OR REPLACE FUNCTION increment_team_size(project_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET current_team_size = current_team_size + 1
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 注意事項:
-- 1. 需要先在 Supabase Dashboard > Storage 中手動創建 'avatars' bucket
-- 2. 將 bucket 設定為 Public
-- 3. 然後執行以上的 RLS 策略
-- 4. 頭像檔案路徑格式: {user_id}/avatar.webp