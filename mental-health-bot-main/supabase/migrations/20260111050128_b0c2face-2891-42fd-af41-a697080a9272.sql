-- Create storage bucket for ML datasets
INSERT INTO storage.buckets (id, name, public)
VALUES ('ml-datasets', 'ml-datasets', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for ml-datasets bucket
CREATE POLICY "Admins can upload datasets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ml-datasets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view datasets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'ml-datasets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete datasets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'ml-datasets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can view datasets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'ml-datasets' AND has_role(auth.uid(), 'doctor'::app_role));