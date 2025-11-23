import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, FileImage, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { retryWithBackoff } from "@/lib/utils";

const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG or PNG image.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const processFile = (file: File) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    toast({
      title: "File Selected",
      description: `${file.name} is ready to upload.`,
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Create a unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      setUploadProgress(30);

      // Upload to Supabase Storage with retry
      const uploadResult = await retryWithBackoff(
        async () => {
          const result = await supabase.storage
            .from('xray-images')
            .upload(fileName, selectedFile, {
              cacheControl: '3600',
              upsert: false
            });
          if (result.error) throw result.error;
          return result;
        },
        3,
        1000,
        (attempt) => {
          toast({
            title: "Retrying Upload",
            description: `Upload attempt ${attempt} of 3...`,
          });
        }
      );

      const uploadData = uploadResult.data;

      setUploadProgress(60);

      // Create database record with retry
      const imageResult = await retryWithBackoff(
        async () => {
          const result = await supabase
            .from('xray_images')
            .insert({
              user_id: user.id,
              file_name: selectedFile.name,
              file_path: uploadData.path,
              file_size: selectedFile.size,
            })
            .select()
            .single();
          if (result.error) throw result.error;
          return result;
        },
        3,
        1000
      );

      const imageData = imageResult.data;

      setUploadProgress(70);

      // Trigger AI analysis with retry
      const functionResult = await retryWithBackoff(
        async () => {
          const result = await supabase.functions.invoke('analyze-xray', {
            body: { imageId: imageData.id }
          });
          if (result.error) throw result.error;
          return result;
        },
        3,
        2000,
        (attempt) => {
          toast({
            title: "Retrying Analysis",
            description: `Analysis attempt ${attempt} of 3...`,
          });
        }
      );

      const functionData = functionResult.data;

      // Check if image was validated
      if (!functionData.isValid) {
        // Delete the uploaded image if not valid
        await supabase.storage.from('xray-images').remove([uploadData.path]);
        await supabase.from('xray_images').delete().eq('id', imageData.id);
        
        toast({
          title: "Invalid Image",
          description: functionData.reason || 'This image does not appear to be a chest X-ray. Please upload a valid chest X-ray image.',
          variant: "destructive",
        });
        setUploadProgress(0);
        setIsUploading(false);
        return;
      }

      setUploadProgress(100);

      toast({
        title: "Success!",
        description: "X-ray analyzed successfully!",
      });

      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      
      // Determine error type and show appropriate message
      let errorTitle = "Upload Failed";
      let errorDescription = "Failed to upload X-ray. Please try again.";

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
          errorTitle = "Too Many Requests";
          errorDescription = "Our AI service is experiencing high demand. Please wait a moment and try again.";
        } else if (errorMsg.includes('payment') || errorMsg.includes('402') || errorMsg.includes('credits')) {
          errorTitle = "Service Unavailable";
          errorDescription = "The AI analysis service is temporarily unavailable. Please contact support or try again later.";
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          errorTitle = "Connection Error";
          errorDescription = "Unable to connect to the analysis service. Please check your internet connection and try again.";
        } else if (errorMsg.includes('storage')) {
          errorTitle = "Storage Error";
          errorDescription = "Failed to save the X-ray image. Please check your file and try again.";
        } else if (errorMsg.includes('timeout')) {
          errorTitle = "Analysis Timeout";
          errorDescription = "The analysis is taking longer than expected. Please try again with a different image or retry later.";
        } else if (error.message) {
          errorDescription = error.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Upload Chest X-Ray</h1>
          <p className="text-muted-foreground">
            Upload a chest X-ray image for AI-powered tumor detection analysis
          </p>
        </div>

        <Card className="p-8">
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed transition-all ${
                isDragging
                  ? "border-primary bg-primary-light"
                  : "border-border bg-muted/50"
              }`}
            >
              <label
                htmlFor="file-upload"
                className="flex cursor-pointer flex-col items-center justify-center py-16"
              >
                <UploadIcon
                  className={`mb-4 h-16 w-16 transition-colors ${
                    isDragging ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <p className="mb-2 text-lg font-semibold">
                  {isDragging ? "Drop your X-ray here" : "Drag & drop your X-ray"}
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  or click to browse files
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPEG, PNG (Max 10MB)
                </p>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileInput}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-lg bg-muted">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="X-ray preview"
                    className="h-96 w-full object-contain"
                  />
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                <FileImage className="h-10 w-10 flex-shrink-0 text-primary" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                {uploadProgress === 100 && (
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-success" />
                )}
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || uploadProgress === 100}
                  className="flex-1"
                  size="lg"
                >
                  {isUploading ? "Analyzing..." : uploadProgress === 100 ? "Analysis Complete" : "Start Analysis"}
                </Button>
                {!isUploading && (
                  <Button
                    variant="outline"
                    onClick={handleRemoveFile}
                    size="lg"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>

        <div className="mt-6 rounded-lg bg-accent p-6">
          <h3 className="mb-3 font-semibold">Important Notes:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Ensure the X-ray image is clear and properly oriented</li>
            <li>• AI analysis takes approximately 2-3 minutes</li>
            <li>• Results should be reviewed by a medical professional</li>
            <li>• Patient data is anonymized and securely processed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Upload;
