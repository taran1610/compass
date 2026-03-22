-- Add image_urls column for existing user_feedback tables (if 007 was run before images support)
alter table public.user_feedback add column if not exists image_urls text[] default '{}';
