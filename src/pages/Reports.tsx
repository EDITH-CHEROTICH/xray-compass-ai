import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, AlertTriangle, CheckCircle2, FileText, Calendar, Clock } from "lucide-react";

const Reports = () => {
  const reportData = {
    id: "RPT-2025-10-20-001",
    patientId: "ANON-12345",
    date: "2025-10-20",
    time: "14:30",
    xrayType: "Chest PA",
    findings: [
      { name: "Nodule", confidence: 82, severity: "high" },
      { name: "Mass", confidence: 78, severity: "high" },
      { name: "Infiltration", confidence: 12, severity: "medium" },
      { name: "Cardiomegaly", confidence: 15, severity: "medium" },
      { name: "Pneumonia", confidence: 6, severity: "low" },
      { name: "Edema", confidence: 3, severity: "low" },
    ],
    recommendation: "Immediate CT scan recommended. Refer to oncology specialist for further evaluation of detected masses and nodules.",
    aiModel: "TorchXRayVision v1.0 - DenseNet Pre-trained",
  };

  const handleDownloadPDF = () => {
    // PDF generation logic would go here
    console.log("Downloading PDF report...");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Diagnostic Report</h1>
            <p className="text-muted-foreground">
              AI-Generated Medical Imaging Analysis
            </p>
          </div>
          <Button onClick={handleDownloadPDF} size="lg">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Report Header */}
        <Card className="mb-6 p-8">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="mb-4 text-2xl font-bold">MEDISCAN DIAGNOSTIC REPORT</h2>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="font-semibold text-muted-foreground">Report ID:</span>
                  <span className="font-mono">{reportData.id}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-muted-foreground">Patient ID:</span>
                  <span className="font-mono">{reportData.patientId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{reportData.date}</span>
                  <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                  <span>{reportData.time}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-muted-foreground">X-ray Type:</span>
                  <span>{reportData.xrayType}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="bg-critical-light text-critical">
              <AlertTriangle className="mr-1 h-3 w-3" />
              High Risk
            </Badge>
          </div>

          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              This report contains AI-generated findings and should be reviewed by a qualified medical professional. 
              Do not make medical decisions based solely on this automated analysis.
            </p>
          </div>
        </Card>

        {/* X-Ray Image Section */}
        <Card className="mb-6 p-8">
          <h3 className="mb-4 text-xl font-bold">X-Ray Image Analysis</h3>
          <div className="rounded-lg bg-muted p-8">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto mb-4 h-24 w-24 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  X-ray image with AI annotations would be displayed here
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  (Red circles highlight detected masses and nodules)
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Findings Section */}
        <Card className="mb-6 p-8">
          <h3 className="mb-6 text-xl font-bold">AI FINDINGS</h3>
          
          {/* High Risk */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-critical" />
              <h4 className="font-semibold text-critical">HIGH RISK FINDINGS:</h4>
            </div>
            <div className="space-y-3 pl-7">
              {reportData.findings
                .filter(f => f.severity === "high")
                .map((finding, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-critical-light p-3">
                    <span className="font-medium">{finding.name}</span>
                    <span className="font-bold text-critical">{finding.confidence}% confidence</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Medium Risk */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h4 className="font-semibold text-warning">MEDIUM RISK FINDINGS:</h4>
            </div>
            <div className="space-y-3 pl-7">
              {reportData.findings
                .filter(f => f.severity === "medium")
                .map((finding, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-warning-light p-3">
                    <span className="font-medium">{finding.name}</span>
                    <span className="font-bold text-warning">{finding.confidence}% confidence</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Low Risk */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <h4 className="font-semibold text-success">LOW RISK FINDINGS:</h4>
            </div>
            <div className="space-y-2 pl-7">
              {reportData.findings
                .filter(f => f.severity === "low")
                .map((finding, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{finding.name}</span>
                    <span className="text-muted-foreground">{finding.confidence}%</span>
                  </div>
                ))}
            </div>
          </div>
        </Card>

        {/* Recommendation Section */}
        <Card className="mb-6 p-8 bg-accent">
          <h3 className="mb-4 text-xl font-bold">CLINICAL RECOMMENDATION</h3>
          <p className="leading-relaxed">{reportData.recommendation}</p>
        </Card>

        {/* Footer Section */}
        <Card className="p-8">
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <span className="font-semibold">AI Model Used:</span> {reportData.aiModel}
            </div>
            <div>
              <span className="font-semibold">Analysis Method:</span> Deep learning-based pathology detection using 
              pre-trained convolutional neural networks on medical imaging datasets
            </div>
            <div>
              <span className="font-semibold">Reviewed By:</span> Pending physician review
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs">
                This automated report was generated by MediScan AI diagnostic system. All findings should be 
                confirmed by a licensed radiologist or physician. This report does not constitute a final 
                diagnosis and should not be used as the sole basis for treatment decisions.
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <Button onClick={handleDownloadPDF} size="lg">
            <Download className="mr-2 h-4 w-4" />
            Download Complete Report (PDF)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
