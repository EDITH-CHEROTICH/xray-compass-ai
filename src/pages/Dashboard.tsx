import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertTriangle, CheckCircle2, FileText, Share2, Calendar, Clock, MessageSquare, Send, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AnalysisResult {
  id: string;
  analyzed_at: string;
  overall_risk: string;
  recommendation: string;
  atelectasis_score: number;
  consolidation_score: number;
  infiltration_score: number;
  pneumothorax_score: number;
  edema_score: number;
  emphysema_score: number;
  fibrosis_score: number;
  effusion_score: number;
  pneumonia_score: number;
  pleural_thickening_score: number;
  cardiomegaly_score: number;
  nodule_score: number;
  mass_score: number;
  hernia_score: number;
  lung_lesion_score: number;
  fracture_score: number;
  lung_opacity_score: number;
  enlarged_cardiomediastinum_score: number;
}

interface Specialist {
  user_id: string;
  full_name: string;
  specialty: string;
  hospital: string;
  years_experience: number;
  availability: string;
  avatar_url: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReport, setSendingReport] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch specialists
      const { data: specialistsData, error: specialistsError } = await supabase
        .from('profiles')
        .select('*')
        .not('specialty', 'is', null)
        .neq('user_id', user.id);

      if (specialistsError) {
        console.error('Error fetching specialists:', specialistsError);
      } else {
        setSpecialists(specialistsData || []);
      }
      setLoading(false);

      // Fetch latest analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single();

      if (analysisError) {
        console.error('Error fetching analysis:', analysisError);
      } else {
        setAnalysis(analysisData);
      }
      setAnalysisLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSendReport = async (specialistId: string) => {
    if (!user) return;

    setSendingReport(specialistId);
    
    // Get the most recent analysis result for this user
    const { data: analysisData, error: analysisError } = await supabase
      .from('analysis_results')
      .select('id')
      .eq('user_id', user.id)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single();

    if (analysisError || !analysisData) {
      toast({
        title: 'Error',
        description: 'No analysis results found. Please upload and analyze an X-ray first.',
        variant: 'destructive',
      });
      setSendingReport(null);
      return;
    }

    // Create consultation
    const { data: consultationData, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        requesting_doctor_id: user.id,
        specialist_id: specialistId,
        analysis_result_id: analysisData.id,
        status: 'pending',
      })
      .select()
      .single();

    if (consultationError) {
      console.error('Error creating consultation:', consultationError);
      toast({
        title: 'Error',
        description: 'Failed to send report',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Report sent to specialist',
      });
      navigate(`/consultation/${consultationData.id}`);
    }
    setSendingReport(null);
  };

  const handleChat = async (specialistId: string) => {
    if (!user) return;

    // Check if there's an existing consultation with this specialist
    const { data, error } = await supabase
      .from('consultations')
      .select('id')
      .eq('requesting_doctor_id', user.id)
      .eq('specialist_id', specialistId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking consultation:', error);
      toast({
        title: 'Error',
        description: 'Failed to open chat',
        variant: 'destructive',
      });
      return;
    }

    if (data) {
      navigate(`/consultation/${data.id}`);
    } else {
      toast({
        title: 'No active consultation',
        description: 'Please send a report first to start a consultation',
        variant: 'destructive',
      });
    }
  };

  // Convert analysis results to findings format
  const getFindings = () => {
    if (!analysis) return [];
    
    const conditionMap = [
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

    return conditionMap
      .map(({ key, name }) => {
        const score = analysis[key as keyof AnalysisResult] as number;
        return {
          name,
          confidence: score,
          severity: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low'
        };
      })
      .filter(f => f.confidence > 5)
      .sort((a, b) => b.confidence - a.confidence);
  };

  const findings = getFindings();
  const highRiskFindings = findings.filter(f => f.severity === "high");
  const mediumRiskFindings = findings.filter(f => f.severity === "medium");
  const lowRiskFindings = findings.filter(f => f.severity === "low");

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "critical";
      case "medium": return "warning";
      case "low": return "success";
      default: return "muted";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Analysis Dashboard</h1>
        <p className="text-muted-foreground">
          AI-powered diagnostic results from TorchXRayVision
        </p>
      </div>

      {/* No Analysis Message */}
      {!analysisLoading && !analysis && (
        <Card className="mb-6 p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="mb-2 text-xl font-semibold">No Analysis Results</h3>
              <p className="text-muted-foreground mb-4">
                Upload an X-ray image to get AI-powered diagnostic analysis
              </p>
              <Button asChild>
                <Link to="/upload">Upload X-ray</Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Alert Banner */}
      {analysis?.overall_risk === "high" && (
        <Card className="mb-6 border-destructive bg-destructive/10 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-destructive" />
            <div>
              <h3 className="mb-1 font-semibold text-destructive">High-Risk Findings Detected</h3>
              <p className="text-sm">
                Multiple high-confidence pathologies detected. Immediate medical attention recommended.
              </p>
            </div>
          </div>
        </Card>
      )}

      {analysis && (
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Analysis Info */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Analysis Results</h2>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{analysis?.analyzed_at ? new Date(analysis.analyzed_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{analysis?.analyzed_at ? new Date(analysis.analyzed_at).toLocaleTimeString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Completed
              </Badge>
            </div>
          </Card>

          {/* High Risk Findings */}
          {highRiskFindings.length > 0 && (
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-critical" />
                <h3 className="text-xl font-semibold">High Risk Findings</h3>
              </div>
              <div className="space-y-4">
                {highRiskFindings.map((finding, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{finding.name}</span>
                        <Badge variant="outline" className="bg-critical-light text-critical">
                          High Risk
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-critical">{finding.confidence}%</span>
                    </div>
                    <Progress value={finding.confidence} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Medium Risk Findings */}
          {mediumRiskFindings.length > 0 && (
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h3 className="text-xl font-semibold">Medium Risk Findings</h3>
              </div>
              <div className="space-y-4">
                {mediumRiskFindings.map((finding, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{finding.name}</span>
                        <Badge variant="outline" className="bg-warning-light text-warning">
                          Medium Risk
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-warning">{finding.confidence}%</span>
                    </div>
                    <Progress value={finding.confidence} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Low Risk Findings */}
          {lowRiskFindings.length > 0 && (
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h3 className="text-xl font-semibold">Low Risk Findings</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {lowRiskFindings.map((finding, idx) => (
                  <div key={idx} className="rounded-lg bg-muted p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-sm">{finding.name}</span>
                      <span className="text-sm text-success font-semibold">{finding.confidence}%</span>
                    </div>
                    <Progress value={finding.confidence} className="h-1" />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Quick Actions</h3>
            <div className="space-y-3">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to={`/detailed-findings/${analysis?.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Detailed Findings
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/reports">
                  <FileText className="mr-2 h-4 w-4" />
                  View Full Report
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share with Specialist
              </Button>
            </div>
          </Card>

          {/* Summary Stats */}
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Analysis Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Findings</span>
                  <span className="font-semibold">{findings.length}</span>
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">High Risk</span>
                  <span className="font-semibold text-destructive">{highRiskFindings.length}</span>
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Medium Risk</span>
                  <span className="font-semibold text-orange-500">{mediumRiskFindings.length}</span>
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Low Risk</span>
                  <span className="font-semibold text-green-500">{lowRiskFindings.length}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Recommendation */}
          <Card className="p-6 bg-accent">
            <h3 className="mb-2 font-semibold">Recommendation</h3>
            <p className="text-sm text-muted-foreground">
              {analysis?.recommendation || 'No recommendations available'}
            </p>
          </Card>

          {/* AI Model Info */}
          <Card className="p-6">
            <h3 className="mb-2 font-semibold text-sm">AI Model</h3>
            <p className="text-xs text-muted-foreground">
              Powered by TorchXRayVision - Pre-trained DenseNet model on 18+ pathology classes
            </p>
          </Card>

          {/* Specialist Consultation */}
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Consult a Specialist</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : specialists.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">No specialists available</p>
            ) : (
              <div className="space-y-3">
                {specialists.map((specialist) => (
                  <div key={specialist.user_id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={specialist.avatar_url} alt={specialist.full_name} />
                        <AvatarFallback>{specialist.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{specialist.full_name}</p>
                        <p className="text-xs text-muted-foreground">{specialist.specialty}</p>
                        <p className="text-xs text-muted-foreground">{specialist.hospital}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={specialist.availability === "Available" ? "outline" : "secondary"} className="text-xs">
                            {specialist.availability}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{specialist.years_experience} years</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleSendReport(specialist.user_id)}
                        disabled={sendingReport === specialist.user_id}
                      >
                        {sendingReport === specialist.user_id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="mr-1 h-3 w-3" />
                        )}
                        Send Report
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleChat(specialist.user_id)}
                      >
                        <MessageSquare className="mr-1 h-3 w-3" />
                        Chat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
      )}
    </div>
  );
};

export default Dashboard;
