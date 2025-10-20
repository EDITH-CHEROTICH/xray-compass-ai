import { Link, useLocation } from "react-router-dom";
import { Activity, Upload, FileText, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Activity className="h-6 w-6 text-primary" />
            <span className="bg-gradient-primary bg-clip-text text-transparent">MediScan</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant={isActive("/") ? "default" : "ghost"}
              size="sm"
            >
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </Button>
            
            <Button
              asChild
              variant={isActive("/upload") ? "default" : "ghost"}
              size="sm"
            >
              <Link to="/upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Link>
            </Button>
            
            <Button
              asChild
              variant={isActive("/dashboard") ? "default" : "ghost"}
              size="sm"
            >
              <Link to="/dashboard" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
            
            <Button
              asChild
              variant={isActive("/reports") ? "default" : "ghost"}
              size="sm"
            >
              <Link to="/reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Reports</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
