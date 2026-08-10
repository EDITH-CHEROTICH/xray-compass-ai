import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ReportGenerator } from '@/components/ReportGenerator';

const CONDITIONS: { key: string; name: string }[] = [
  { key: 'atelectasis_score', name: 'Atelectasis' },
  { key: 'consolidation_score', name: 'Consolidation' },
  { key: 'infiltration_score', name: 'Infiltration' },
  { key: 'pneumothorax_score', name: 'Pneumothorax' },
  { key: 'edema_score', name: 'Edema' },
  { key: 'emphysema_score', name: 'Emphysema' },
  { key: 'fibrosis_score', name: 'Fibrosis' },
  { key: 'effusion_score', name: 'Effusion' },
  { key: 'pneumonia_score', name: 'Pneumonia' },
  { key: 'pleural_thickening_score', name: 'Pleural Thickening' },
  { key: 'cardiomegaly_score', name: 'Cardiomegaly' },
  { key: 'nodule_score', name: 'Nodule' },
  { key: 'mass_score', name: 'Mass' },
  { key: 'hernia_score', name: 'Hernia' },
  { key: 'lung_lesion_score', name: 'Lung Lesion' },
  { key: 'fracture_score', name: 'Fracture' },
  { key: 'lung_opacity_score', name: 'Lung Opacity' },
  { key: 'enlarged_cardiomediastinum_score', name: 'Enlarged Cardiomediastinum' },
];

interface ReportData {
  patientName: string;
  patientNumber: string;
  dateOfAnalysis: string;
  overallRisk: string;
  findings: { name: string; score: number }[];
  recommendation: string;
  xrayImageUrl: string;
}

const Reports = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const analysisId = searchParams.get('analysisId');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const load = async () => {
      setLoading(true);

      let query = supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })
        .limit(1);

      if (analysisId) {
        query = supabase.from('analysis_results').select('*').eq('id', analysisId).limit(1);
      }

      const { data: analysis, error } = await query.maybeSingle();

      if (error || !analysis) {
        setReport(null);
        setLoading(false);
        return;
      }

      const { data: image } = await supabase
        .from('xray_images')
        .select('file_path, uploaded_at, patient_id')
        .eq('id', analysis.xray_image_id)
        .maybeSingle();

      let xrayImageUrl = '';
      if (image?.file_path) {
        const { data: signed } = await supabase.storage
          .from('xray-images')
          .createSignedUrl(image.file_path, 3600);
        xrayImageUrl = signed?.signedUrl || '';
      }

      let patientName = 'Anonymous Patient';
      let patientNumber = 'N/A';
      if (image?.patient_id) {
        const { data: patient } = await supabase
          .from('patients')
          .select('first_name, last_name, patient_number')
          .eq('id', image.patient_id)
          .maybeSingle();
        if (patient) {
          patientName = `${patient.first_name} ${patient.last_name}`;
          patientNumber = patient.patient_number;
        }
      }

      const findings = CONDITIONS.map(({ key, name }) => ({
        name,
        score: Number((analysis as Record<string, unknown>)[key] ?? 0),
      })).filter((f) => f.score > 0);

      setReport({
        patientName,
        patientNumber,
        dateOfAnalysis: new Date(analysis.analyzed_at ?? Date.now()).toLocaleString(),
        overallRisk: analysis.overall_risk ?? 'Unknown',
        findings: findings.length > 0 ? findings : CONDITIONS.map((c) => ({ name: c.name, score: 0 })),
        recommendation: analysis.recommendation ?? 'No recommendation available.',
        xrayImageUrl,
      });
      setLoading(false);
    };

    load();
  }, [user, authLoading, analysisId, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-lg p-10 text-center">
          <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h1 className="mb-2 text-xl font-semibold">No report available</h1>
          <p className="mb-6 text-muted-foreground">
            Upload and analyze a chest X-ray to generate a diagnostic report.
          </p>
          <Button asChild>
            <Link to="/upload">Upload an X-ray</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Diagnostic Report</h1>
        <ReportGenerator data={report} />
      </div>
    </div>
  );
};

export default Reports;
