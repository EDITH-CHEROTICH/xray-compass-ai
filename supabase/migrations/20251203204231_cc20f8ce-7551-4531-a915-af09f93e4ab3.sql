-- Drop the foreign key constraint on profiles.user_id to allow demo specialists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Now insert demo specialists
INSERT INTO public.profiles (user_id, full_name, specialty, hospital, years_experience, availability, avatar_url)
VALUES 
  (gen_random_uuid(), 'Dr. Sarah Johnson', 'Pulmonology', 'City General Hospital', 15, 'Available', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'),
  (gen_random_uuid(), 'Dr. Michael Chen', 'Radiology', 'University Medical Center', 12, 'Available', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face'),
  (gen_random_uuid(), 'Dr. Emily Williams', 'Oncology', 'Regional Cancer Center', 20, 'Busy', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop&crop=face'),
  (gen_random_uuid(), 'Dr. James Rodriguez', 'Cardiology', 'Heart Care Institute', 18, 'Available', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=face'),
  (gen_random_uuid(), 'Dr. Lisa Thompson', 'Thoracic Surgery', 'Metro Surgical Center', 22, 'Available', 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&h=150&fit=crop&crop=face');