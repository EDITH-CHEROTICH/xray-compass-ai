-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  medical_history TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create policies for patients
CREATE POLICY "Users can view own patients"
ON public.patients
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patients"
ON public.patients
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patients"
ON public.patients
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own patients"
ON public.patients
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update xray_images to use UUID for patient_id and add foreign key
ALTER TABLE public.xray_images 
ALTER COLUMN patient_id TYPE UUID USING patient_id::uuid;

ALTER TABLE public.xray_images
ADD CONSTRAINT xray_images_patient_id_fkey 
FOREIGN KEY (patient_id) 
REFERENCES public.patients(id) 
ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_xray_images_patient_id ON public.xray_images(patient_id);
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patients_patient_number ON public.patients(patient_number);