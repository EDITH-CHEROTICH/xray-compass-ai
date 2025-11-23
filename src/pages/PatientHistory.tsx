import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  medical_history: string | null;
}

interface XRayWithAnalysis {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  analysis: {
    overall_risk: string;
    analyzed_at: string;
  } | null;
}

const PatientHistory = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [xrays, setXrays] = useState<XRayWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      // Fetch patient info
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Fetch patient's X-rays with analysis
      const { data: xrayData, error: xrayError } = await supabase
        .from('xray_images')
        .select(`
          id,
          file_name,
          file_path,
          uploaded_at,
          analysis_results (
            overall_risk,
            analyzed_at
          )
        `)
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false });

      if (xrayError) throw xrayError;
      
      const formattedData = xrayData.map(xray => ({
        ...xray,
        analysis: Array.isArray(xray.analysis_results) && xray.analysis_results.length > 0 
          ? xray.analysis_results[0] 
          : null
      }));
      
      setXrays(formattedData);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast({
        title: "Error",
        description: "Failed to load patient history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Patient not found</p>
        <Button onClick={() => navigate('/patients')} className="mt-4">
          Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/patients')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Patients
      </Button>

      <Card className="p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-muted-foreground mb-4">Patient #{patient.patient_number}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {patient.date_of_birth && (
                <div>
                  <span className="font-medium">Date of Birth:</span>{" "}
                  {new Date(patient.date_of_birth).toLocaleDateString()}
                </div>
              )}
              {patient.gender && (
                <div>
                  <span className="font-medium">Gender:</span> {patient.gender}
                </div>
              )}
            </div>

            {patient.medical_history && (
              <div className="mt-4">
                <h3 className="font-medium mb-1">Medical History:</h3>
                <p className="text-sm text-muted-foreground">{patient.medical_history}</p>
              </div>
            )}
          </div>

          <Button onClick={() => navigate(`/upload?patientId=${patient.id}`)}>
            Upload New X-Ray
          </Button>
        </div>
      </Card>

      <h2 className="text-2xl font-bold mb-4">X-Ray History</h2>

      {xrays.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No X-rays uploaded yet</p>
          <Button onClick={() => navigate(`/upload?patientId=${patient.id}`)}>
            Upload First X-Ray
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {xrays.map((xray) => (
            <Card key={xray.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/xray-images/${xray.file_path}`}
                  alt={xray.file_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="font-medium mb-2 truncate">{xray.file_name}</h3>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Calendar className="h-4 w-4" />
                {new Date(xray.uploaded_at).toLocaleDateString()}
              </div>

              {xray.analysis ? (
                <>
                  <Badge className={getRiskColor(xray.analysis.overall_risk)}>
                    {xray.analysis.overall_risk} Risk
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => navigate(`/detailed-findings?imageId=${xray.id}`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Report
                  </Button>
                </>
              ) : (
                <Badge variant="outline">Analysis Pending</Badge>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientHistory;