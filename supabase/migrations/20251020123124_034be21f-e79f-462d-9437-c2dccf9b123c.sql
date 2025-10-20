-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('doctor', 'specialist', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    specialty TEXT,
    hospital TEXT,
    years_experience INTEGER,
    avatar_url TEXT,
    availability TEXT DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create xray_images table
CREATE TABLE public.xray_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    patient_id TEXT,
    xray_type TEXT DEFAULT 'Chest PA',
    notes TEXT
);

-- Create analysis_results table
CREATE TABLE public.analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    xray_image_id UUID REFERENCES public.xray_images(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'processing',
    overall_risk TEXT,
    
    -- All 18 pathology scores from TorchXRayVision
    atelectasis_score NUMERIC(5,4),
    consolidation_score NUMERIC(5,4),
    infiltration_score NUMERIC(5,4),
    pneumothorax_score NUMERIC(5,4),
    edema_score NUMERIC(5,4),
    emphysema_score NUMERIC(5,4),
    fibrosis_score NUMERIC(5,4),
    effusion_score NUMERIC(5,4),
    pneumonia_score NUMERIC(5,4),
    pleural_thickening_score NUMERIC(5,4),
    cardiomegaly_score NUMERIC(5,4),
    nodule_score NUMERIC(5,4),
    mass_score NUMERIC(5,4),
    hernia_score NUMERIC(5,4),
    lung_lesion_score NUMERIC(5,4),
    fracture_score NUMERIC(5,4),
    lung_opacity_score NUMERIC(5,4),
    enlarged_cardiomediastinum_score NUMERIC(5,4),
    
    recommendation TEXT,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processing_time_seconds INTEGER
);

-- Create diagnostic_reports table
CREATE TABLE public.diagnostic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_result_id UUID REFERENCES public.analysis_results(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    report_content JSONB,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create consultations table
CREATE TABLE public.consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requesting_doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    specialist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    analysis_result_id UUID REFERENCES public.analysis_results(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create consultation_messages table
CREATE TABLE public.consultation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xray_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for xray_images
CREATE POLICY "Users can view own xray images"
ON public.xray_images FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xray images"
ON public.xray_images FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own xray images"
ON public.xray_images FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for analysis_results
CREATE POLICY "Users can view own analysis results"
ON public.analysis_results FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis results"
ON public.analysis_results FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for diagnostic_reports
CREATE POLICY "Users can view own reports"
ON public.diagnostic_reports FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
ON public.diagnostic_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for consultations
CREATE POLICY "Users can view consultations they're involved in"
ON public.consultations FOR SELECT
TO authenticated
USING (auth.uid() = requesting_doctor_id OR auth.uid() = specialist_id);

CREATE POLICY "Doctors can create consultations"
ON public.consultations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requesting_doctor_id);

CREATE POLICY "Users can update consultations they're involved in"
ON public.consultations FOR UPDATE
TO authenticated
USING (auth.uid() = requesting_doctor_id OR auth.uid() = specialist_id);

-- RLS Policies for consultation_messages
CREATE POLICY "Users can view messages in their consultations"
ON public.consultation_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.consultations
    WHERE id = consultation_id
    AND (requesting_doctor_id = auth.uid() OR specialist_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their consultations"
ON public.consultation_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.consultations
    WHERE id = consultation_id
    AND (requesting_doctor_id = auth.uid() OR specialist_id = auth.uid())
  )
);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
BEFORE UPDATE ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, specialty)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'specialty', '')
  );
  
  -- Assign default doctor role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'doctor');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for xray images
INSERT INTO storage.buckets (id, name, public)
VALUES ('xray-images', 'xray-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for xray images
CREATE POLICY "Users can upload their own xray images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'xray-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own xray images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'xray-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own xray images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'xray-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);