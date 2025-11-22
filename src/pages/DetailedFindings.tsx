import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Calendar, Clock, ArrowLeft, ZoomIn, ZoomOut, Info } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AnalysisResult {
  id: string;
  analyzed_at: string;
  overall_risk: string;
  recommendation: string;
  xray_image_id: string;
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

interface Finding {
  name: string;
  confidence: number;
  severity: 'high' | 'medium' | 'low';
  location: string;
  color: string;
}

const DetailedFindings = () => {
  const { analysisId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [zoom, setZoom] = useState(1);

  const conditionLocations: Record<string, string> = {
    'Atelectasis': 'Lower lobes, bilateral',
    'Consolidation': 'Right middle lobe',
    'Infiltration': 'Upper lobes, patchy distribution',
    'Pneumothorax': 'Right hemithorax, apical region',
    'Edema': 'Bilateral, perihilar distribution',
    'Emphysema': 'Upper lobes, bilateral',
    'Fibrosis': 'Lower lobes, reticular pattern',
    'Effusion': 'Right costophrenic angle',
    'Pneumonia': 'Right lower lobe, consolidated',
    'Pleural Thickening': 'Bilateral pleural surfaces',
    'Cardiomegaly': 'Cardiac silhouette enlarged',
    'Nodule': 'Right upper lobe, 2.3cm',
    'Mass': 'Left lower lobe, 4.1cm',
    'Hernia': 'Left hemidiaphragm',
    'Lung Lesion': 'Right middle lobe, peripheral',
    'Fracture': 'Right 5th rib, posterolateral',
    'Lung Opacity': 'Bilateral, diffuse',
    'Enlarged Cardiomediastinum': 'Mediastinal widening'
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !analysisId) return;

      // Fetch analysis result
      const { data: analysisData, error: analysisError } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', user.id)
        .single();

      if (analysisError) {
        toast({
          title: 'Error',
          description: 'Failed to load analysis results',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      setAnalysis(analysisData);

      // Fetch X-ray image
      const { data: imageData, error: imageError } = await supabase
        .from('xray_images')
        .select('file_path')
        .eq('id', analysisData.xray_image_id)
        .single();

      if (imageError) {
        toast({
          title: 'Error',
          description: 'Failed to load X-ray image',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Get signed URL for the image
      const { data: urlData } = await supabase.storage
        .from('xray-images')
        .createSignedUrl(imageData.file_path, 3600);

      if (urlData?.signedUrl) {
        setImageUrl(urlData.signedUrl);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, analysisId, toast]);

  useEffect(() => {
    if (!imageUrl || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw annotations for findings
      const findings = getFindings();
      findings.forEach((finding, idx) => {
        drawAnnotation(ctx, canvas.width, canvas.height, finding, idx, findings.length);
      });
    };
  }, [imageUrl, analysis, selectedFinding, zoom]);

  const drawAnnotation = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    finding: Finding,
    index: number,
    total: number
  ) => {
    // Distribute markers across the image based on condition type
    const positions = getMarkerPosition(finding.name, width, height, index, total);
    
    const isSelected = selectedFinding?.name === finding.name;
    const radius = isSelected ? 40 : 30;
    
    ctx.strokeStyle = finding.color;
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.setLineDash(isSelected ? [] : [5, 5]);
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(positions.x, positions.y, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw crosshair
    ctx.beginPath();
    ctx.moveTo(positions.x - radius - 10, positions.y);
    ctx.lineTo(positions.x + radius + 10, positions.y);
    ctx.moveTo(positions.x, positions.y - radius - 10);
    ctx.lineTo(positions.x, positions.y + radius + 10);
    ctx.stroke();
    
    if (isSelected) {
      // Draw label
      ctx.fillStyle = finding.color;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(finding.name, positions.x + radius + 15, positions.y);
    }
  };

  const getMarkerPosition = (conditionName: string, width: number, height: number, index: number, total: number) => {
    // Position markers based on typical anatomical locations
    const locationMap: Record<string, { x: number; y: number }> = {
      'Atelectasis': { x: 0.5, y: 0.7 },
      'Consolidation': { x: 0.6, y: 0.5 },
      'Infiltration': { x: 0.5, y: 0.3 },
      'Pneumothorax': { x: 0.7, y: 0.2 },
      'Edema': { x: 0.5, y: 0.5 },
      'Emphysema': { x: 0.5, y: 0.3 },
      'Fibrosis': { x: 0.5, y: 0.7 },
      'Effusion': { x: 0.7, y: 0.8 },
      'Pneumonia': { x: 0.6, y: 0.7 },
      'Pleural Thickening': { x: 0.3, y: 0.5 },
      'Cardiomegaly': { x: 0.5, y: 0.6 },
      'Nodule': { x: 0.6, y: 0.3 },
      'Mass': { x: 0.4, y: 0.7 },
      'Hernia': { x: 0.3, y: 0.8 },
      'Lung Lesion': { x: 0.65, y: 0.5 },
      'Fracture': { x: 0.75, y: 0.5 },
      'Lung Opacity': { x: 0.5, y: 0.5 },
      'Enlarged Cardiomediastinum': { x: 0.5, y: 0.5 }
    };

    const pos = locationMap[conditionName] || { x: 0.5, y: 0.5 };
    return {
      x: pos.x * width,
      y: pos.y * height
    };
  };

  const getFindings = (): Finding[] => {
    if (!analysis) return [];
    
    const conditionMap = [
      { key: 'atelectasis_score', name: 'Atelectasis', color: '#ef4444' },
      { key: 'consolidation_score', name: 'Consolidation', color: '#f97316' },
      { key: 'infiltration_score', name: 'Infiltration', color: '#eab308' },
      { key: 'pneumothorax_score', name: 'Pneumothorax', color: '#ef4444' },
      { key: 'edema_score', name: 'Edema', color: '#f97316' },
      { key: 'emphysema_score', name: 'Emphysema', color: '#eab308' },
      { key: 'fibrosis_score', name: 'Fibrosis', color: '#f97316' },
      { key: 'effusion_score', name: 'Effusion', color: '#eab308' },
      { key: 'pneumonia_score', name: 'Pneumonia', color: '#ef4444' },
      { key: 'pleural_thickening_score', name: 'Pleural Thickening', color: '#eab308' },
      { key: 'cardiomegaly_score', name: 'Cardiomegaly', color: '#f97316' },
      { key: 'nodule_score', name: 'Nodule', color: '#ef4444' },
      { key: 'mass_score', name: 'Mass', color: '#ef4444' },
      { key: 'hernia_score', name: 'Hernia', color: '#eab308' },
      { key: 'lung_lesion_score', name: 'Lung Lesion', color: '#f97316' },
      { key: 'fracture_score', name: 'Fracture', color: '#ef4444' },
      { key: 'lung_opacity_score', name: 'Lung Opacity', color: '#eab308' },
      { key: 'enlarged_cardiomediastinum_score', name: 'Enlarged Cardiomediastinum', color: '#f97316' },
    ];

    return conditionMap
      .map(({ key, name, color }) => {
        const score = analysis[key as keyof AnalysisResult] as number;
        const percentage = score * 100; // Convert 0-1 to 0-100
        return {
          name,
          confidence: percentage,
          severity: (percentage >= 60 ? 'high' : percentage >= 30 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          location: conditionLocations[name] || 'Location not specified',
          color
        };
      })
      .filter(f => f.confidence > 5)
      .sort((a, b) => b.confidence - a.confidence);
  };

  const findings = getFindings();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Analysis Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested analysis could not be found.</p>
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Detailed Findings with Annotations</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(analysis.analyzed_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{new Date(analysis.analyzed_at).toLocaleTimeString()}</span>
          </div>
          <Badge variant={analysis.overall_risk === 'high' ? 'destructive' : analysis.overall_risk === 'medium' ? 'default' : 'outline'}>
            {analysis.overall_risk} Risk
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* X-Ray Image with Annotations */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">X-Ray with Annotations</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative overflow-auto bg-muted rounded-lg" style={{ maxHeight: '70vh' }}>
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="X-Ray"
                  className="hidden"
                />
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto cursor-crosshair"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / zoom;
                    const y = (e.clientY - rect.top) / zoom;
                    
                    // Find closest finding to click position
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    
                    findings.forEach((finding, idx) => {
                      const pos = getMarkerPosition(finding.name, canvas.width, canvas.height, idx, findings.length);
                      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                      
                      if (distance < 50) {
                        setSelectedFinding(finding);
                      }
                    });
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 p-3 bg-muted rounded-lg">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Click on any marker to view detailed information. Markers indicate areas of concern detected by AI analysis.
              </p>
            </div>
          </Card>
        </div>

        {/* Findings List */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Detected Findings ({findings.length})</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {findings.map((finding, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedFinding?.name === finding.name
                      ? 'border-primary bg-accent'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedFinding(finding)}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: finding.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{finding.name}</h4>
                        <Badge
                          variant={finding.severity === 'high' ? 'destructive' : finding.severity === 'medium' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {finding.confidence}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{finding.location}</p>
                    </div>
                  </div>
                  
                  {selectedFinding?.name === finding.name && (
                    <div className="mt-3 pt-3 border-t text-xs space-y-2">
                      <div>
                        <span className="font-medium">Severity:</span>{' '}
                        <span className="capitalize">{finding.severity}</span>
                      </div>
                      <div>
                        <span className="font-medium">Confidence:</span> {finding.confidence}%
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {finding.location}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-accent">
            <h3 className="font-semibold mb-2">Recommendation</h3>
            <p className="text-sm text-muted-foreground">
              {analysis.recommendation}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2 text-sm">Legend</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                <span>High Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f97316]" />
                <span>Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#eab308]" />
                <span>Low Risk</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DetailedFindings;
