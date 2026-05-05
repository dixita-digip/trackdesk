-- Run once if tracker_screen_captures already exists with image_base64 NOT NULL (no file_url).
-- Supabase SQL Editor: paste and run.

ALTER TABLE public.tracker_screen_captures ADD COLUMN IF NOT EXISTS file_url text;

ALTER TABLE public.tracker_screen_captures ALTER COLUMN image_base64 DROP NOT NULL;

ALTER TABLE public.tracker_screen_captures DROP CONSTRAINT IF EXISTS tracker_screen_captures_image_chk;

ALTER TABLE public.tracker_screen_captures
  ADD CONSTRAINT tracker_screen_captures_image_chk CHECK (file_url IS NOT NULL OR image_base64 IS NOT NULL);
