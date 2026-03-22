-- Migration: create_betc_storage_buckets
-- Applied: 2026-03-21
-- Creates betc-photos and betc-reports storage buckets with RLS policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('betc-photos', 'betc-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('betc-reports', 'betc-reports', false);

-- Storage policies: authenticated users can manage their own files
-- Photos bucket
CREATE POLICY "user_upload_photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'betc-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "user_read_photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'betc-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "user_delete_photos" ON storage.objects FOR DELETE
  USING (bucket_id = 'betc-photos' AND auth.uid() IS NOT NULL);

-- Reports bucket
CREATE POLICY "user_upload_reports" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'betc-reports' AND auth.uid() IS NOT NULL);

CREATE POLICY "user_read_reports" ON storage.objects FOR SELECT
  USING (bucket_id = 'betc-reports' AND auth.uid() IS NOT NULL);
