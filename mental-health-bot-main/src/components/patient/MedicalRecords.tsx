import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  TestTube,
  Scan,
  Pill,
  File,
  Trash2,
  Download,
  Loader2,
  Plus,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSignedUrl, extractStoragePath } from '@/hooks/use-signed-url';

interface MedicalRecord {
  id: string;
  patient_id: string;
  uploaded_by: string;
  record_type: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  uploaded_at: string;
}

interface MedicalRecordsProps {
  onBack: () => void;
}

const recordTypeIcons: Record<string, React.ReactNode> = {
  lab_result: <TestTube className="w-5 h-5" />,
  imaging: <Scan className="w-5 h-5" />,
  prescription: <Pill className="w-5 h-5" />,
  report: <FileText className="w-5 h-5" />,
  other: <File className="w-5 h-5" />
};

const recordTypeLabels: Record<string, string> = {
  lab_result: 'Lab Result',
  imaging: 'Imaging/X-Ray',
  prescription: 'Prescription',
  report: 'Medical Report',
  other: 'Other'
};

export default function MedicalRecords({ onBack }: MedicalRecordsProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordType, setRecordType] = useState<string>('lab_result');
  const [filterType, setFilterType] = useState<string>('all');
  const [fileAccessLoading, setFileAccessLoading] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { getSignedUrl } = useSignedUrl();

  // Fetch records
  useEffect(() => {
    if (!user) return;

    const fetchRecords = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching records:', error);
        toast({
          title: 'Error',
          description: 'Failed to load medical records.',
          variant: 'destructive'
        });
      } else {
        setRecords(data || []);
      }
      setIsLoading(false);
    };

    fetchRecords();
  }, [user, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 20MB.',
          variant: 'destructive'
        });
        return;
      }
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !user) return;

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('medical-records')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // SECURITY FIX: Store the file path, not a public URL
      // Files will be accessed via signed URLs that respect RLS and expire
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          patient_id: user.id,
          uploaded_by: user.id,
          record_type: recordType,
          title,
          description: description || null,
          file_url: filePath, // Store path, not public URL
          file_name: selectedFile.name,
          file_size: selectedFile.size
        })
        .select()
        .single();

      if (error) throw error;

      setRecords(prev => [data, ...prev]);
      setIsDialogOpen(false);
      resetForm();
      
      toast({
        title: 'Record Uploaded',
        description: 'Your medical record has been uploaded successfully.'
      });
    } catch (error) {
      console.error('Error uploading record:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload medical record. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (record: MedicalRecord) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      // Delete from storage
      const filePath = record.file_url.split('/').slice(-2).join('/');
      await supabase.storage.from('medical-records').remove([filePath]);

      // Delete metadata
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      setRecords(prev => prev.filter(r => r.id !== record.id));
      
      toast({
        title: 'Record Deleted',
        description: 'The medical record has been deleted.'
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete medical record.',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setRecordType('lab_result');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredRecords = filterType === 'all' 
    ? records 
    : records.filter(r => r.record_type === filterType);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medical Records</h1>
            <p className="text-muted-foreground">Upload and manage your health documents</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white border-0">
              <Plus className="w-4 h-4 mr-2" />
              Upload Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Medical Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Record Type</Label>
                <Select value={recordType} onValueChange={setRecordType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(recordTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          {recordTypeIcons[value]}
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Blood Test Results - January 2024"
                />
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any notes about this record..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>File</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-primary" />
                      <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-24 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to select file</span>
                    </div>
                  </Button>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={!selectedFile || !title || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Record
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Records</SelectItem>
            {Object.entries(recordTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Records List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {filterType === 'all' 
                ? 'No medical records uploaded yet' 
                : `No ${recordTypeLabels[filterType]} records found`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your lab results, imaging, and other health documents
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    record.record_type === 'lab_result' ? 'bg-blue-100 text-blue-600' :
                    record.record_type === 'imaging' ? 'bg-purple-100 text-purple-600' :
                    record.record_type === 'prescription' ? 'bg-green-100 text-green-600' :
                    record.record_type === 'report' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {recordTypeIcons[record.record_type]}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-foreground">{record.title}</h3>
                        {record.description && (
                          <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="secondary">
                            {recordTypeLabels[record.record_type]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(record.file_size)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(record.uploaded_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={fileAccessLoading === record.id}
                          onClick={async () => {
                            setFileAccessLoading(record.id);
                            // Extract path from URL or use directly if it's a path
                            const filePath = extractStoragePath(record.file_url, 'medical-records') || record.file_url;
                            const result = await getSignedUrl('medical-records', filePath, 300);
                            if (result.url) {
                              window.open(result.url, '_blank');
                            } else {
                              toast({ title: 'Error', description: 'Failed to access file', variant: 'destructive' });
                            }
                            setFileAccessLoading(null);
                          }}
                        >
                          {fileAccessLoading === record.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={fileAccessLoading === `dl-${record.id}`}
                          onClick={async () => {
                            setFileAccessLoading(`dl-${record.id}`);
                            const filePath = extractStoragePath(record.file_url, 'medical-records') || record.file_url;
                            const result = await getSignedUrl('medical-records', filePath, 60);
                            if (result.url) {
                              const link = document.createElement('a');
                              link.href = result.url;
                              link.download = record.file_name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else {
                              toast({ title: 'Error', description: 'Failed to download file', variant: 'destructive' });
                            }
                            setFileAccessLoading(null);
                          }}
                        >
                          {fileAccessLoading === `dl-${record.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(record)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
