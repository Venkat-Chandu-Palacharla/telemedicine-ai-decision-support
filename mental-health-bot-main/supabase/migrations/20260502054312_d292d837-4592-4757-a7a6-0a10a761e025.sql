ALTER TABLE public.doctor_profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_profiles;