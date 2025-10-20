import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Upload, Brain, FileText, Users, Shield, Zap, Clock } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 flex justify-center">
              <Activity className="h-16 w-16 animate-pulse" />
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
              AI-Powered Medical Imaging for Everyone
            </h1>
            <p className="mb-8 text-xl text-primary-foreground/90">
              Detect tumors in chest X-rays in minutes, not days. MediScan brings advanced AI diagnostics 
              to underserved areas without access to radiologists.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/upload">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload X-Ray
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Link to="/dashboard">
                  View Demo Results
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Why Choose MediScan?</h2>
            <p className="text-muted-foreground text-lg">
              Powered by TorchXRayVision - State-of-the-art AI for medical imaging
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Advanced AI</h3>
              <p className="text-muted-foreground">
                Detects 18+ pathologies including masses, nodules, and tumors with 85-95% accuracy
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-success-light">
                <Zap className="h-6 w-6 text-success" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Rapid Analysis</h3>
              <p className="text-muted-foreground">
                Get diagnostic results in 2-3 minutes instead of waiting days for a radiologist
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-warning-light">
                <FileText className="h-6 w-6 text-warning" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Professional Reports</h3>
              <p className="text-muted-foreground">
                Automatic generation of detailed reports with visual annotations and risk levels
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Collaboration</h3>
              <p className="text-muted-foreground">
                Share findings and consult with specialists remotely for second opinions
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground text-lg">
              Simple, fast, and reliable diagnostic workflow
            </p>
          </div>
          
          <div className="mx-auto max-w-4xl">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Upload X-Ray Image</h3>
                  <p className="text-muted-foreground">
                    Drag and drop or select a chest X-ray image. We support JPEG, PNG, and DICOM formats.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">AI Analysis</h3>
                  <p className="text-muted-foreground">
                    Our TorchXRayVision AI models analyze the image for 18+ pathologies including tumors, masses, and nodules.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Review Results</h3>
                  <p className="text-muted-foreground">
                    Get detailed diagnostic reports with confidence scores, visual annotations, and treatment recommendations.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  4
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Collaborate</h3>
                  <p className="text-muted-foreground">
                    Share findings with specialists for second opinions or confirmation of critical diagnoses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <Clock className="h-12 w-12 text-primary" />
              </div>
              <div className="mb-2 text-4xl font-bold text-primary">2-3 min</div>
              <p className="text-muted-foreground">Analysis Time</p>
            </div>
            
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <Brain className="h-12 w-12 text-success" />
              </div>
              <div className="mb-2 text-4xl font-bold text-success">85-95%</div>
              <p className="text-muted-foreground">Detection Accuracy</p>
            </div>
            
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <Shield className="h-12 w-12 text-warning" />
              </div>
              <div className="mb-2 text-4xl font-bold text-warning">18+</div>
              <p className="text-muted-foreground">Pathologies Detected</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-hero py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-xl text-primary-foreground/90">
            Upload your first chest X-ray and experience the power of AI-assisted diagnostics
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
            <Link to="/upload">
              <Upload className="mr-2 h-5 w-5" />
              Upload X-Ray Now
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
