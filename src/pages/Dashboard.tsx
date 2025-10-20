import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertTriangle, CheckCircle2, FileText, Share2, Calendar, Clock, MessageSquare, Send } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data - replace with real data from backend
const mockAnalysis = {
  id: "analysis_001",
  date: "2025-10-20",
  time: "14:30",
  status: "completed",
  findings: [
    { name: "Nodule", confidence: 82, severity: "high" },
    { name: "Mass", confidence: 78, severity: "high" },
    { name: "Pneumonia", confidence: 6, severity: "low" },
    { name: "Edema", confidence: 3, severity: "low" },
    { name: "Infiltration", confidence: 12, severity: "medium" },
    { name: "Effusion", confidence: 8, severity: "low" },
    { name: "Atelectasis", confidence: 5, severity: "low" },
    { name: "Cardiomegaly", confidence: 15, severity: "medium" },
  ],
  overallRisk: "high",
  recommendation: "Immediate CT scan recommended. Refer to oncology specialist for further evaluation.",
};

const mockSpecialists = [
  {
    id: "spec_001",
    name: "Dr. Sarah Chen",
    specialty: "Oncology",
    hospital: "Metro General Hospital",
    experience: "15 years",
    availability: "Available",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    id: "spec_002", 
    name: "Dr. Michael Roberts",
    specialty: "Radiology",
    hospital: "City Medical Center",
    experience: "12 years",
    availability: "Available",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
  },
  {
    id: "spec_003",
    name: "Dr. Priya Sharma",
    specialty: "Pulmonology",
    hospital: "Regional Care Institute",
    experience: "10 years", 
    availability: "Busy",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
  },
];

const Dashboard = () => {
  const highRiskFindings = mockAnalysis.findings.filter(f => f.severity === "high");
  const mediumRiskFindings = mockAnalysis.findings.filter(f => f.severity === "medium");
  const lowRiskFindings = mockAnalysis.findings.filter(f => f.severity === "low");

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

      {/* Alert Banner */}
      {mockAnalysis.overallRisk === "high" && (
        <Card className="mb-6 border-critical bg-critical-light p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-critical" />
            <div>
              <h3 className="mb-1 font-semibold text-critical">High-Risk Findings Detected</h3>
              <p className="text-sm text-critical/90">
                Multiple high-confidence pathologies detected. Immediate medical attention recommended.
              </p>
            </div>
          </div>
        </Card>
      )}

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
                    <span>{mockAnalysis.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{mockAnalysis.time}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="bg-success-light text-success">
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
                  <span className="font-semibold">{mockAnalysis.findings.length}</span>
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">High Risk</span>
                  <span className="font-semibold text-critical">{highRiskFindings.length}</span>
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Medium Risk</span>
                  <span className="font-semibold text-warning">{mediumRiskFindings.length}</span>
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Low Risk</span>
                  <span className="font-semibold text-success">{lowRiskFindings.length}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Recommendation */}
          <Card className="p-6 bg-accent">
            <h3 className="mb-2 font-semibold">Recommendation</h3>
            <p className="text-sm text-muted-foreground">
              {mockAnalysis.recommendation}
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
            <div className="space-y-3">
              {mockSpecialists.map((specialist) => (
                <div key={specialist.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={specialist.avatar} alt={specialist.name} />
                      <AvatarFallback>{specialist.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{specialist.name}</p>
                      <p className="text-xs text-muted-foreground">{specialist.specialty}</p>
                      <p className="text-xs text-muted-foreground">{specialist.hospital}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={specialist.availability === "Available" ? "outline" : "secondary"} className="text-xs">
                          {specialist.availability}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{specialist.experience}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Send className="mr-1 h-3 w-3" />
                      Send Report
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <MessageSquare className="mr-1 h-3 w-3" />
                      Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
