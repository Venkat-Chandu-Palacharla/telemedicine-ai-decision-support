import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  FileText, 
  TestTube,
  Scan,
  Pill,
  File,
  Download,
  Loader2,
  Eye,
  Search,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSignedUrl, extractStoragePath } from '@/hooks/use-signed-url';

interface PatientWithRecords {
  patient_id: string;
  patient_name: string;
  patient_avatar?: string;
  records: MedicalRecord[];
}

interface MedicalRecord {
  id: string;
  patient_id: string;
  record_type: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  uploaded_at: string;
}

interface PatientRecordsViewerProps {
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

export default function PatientRecordsViewer({ onBack }: PatientRecordsViewerProps) {
  const [patientsWithRecords, setPatientsWithRecords] = useState<PatientWithRecords[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [fileAccessLoading, setFileAccessLoading] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { getSignedUrl } = useSignedUrl();

  // Fetch patients with appointments and their records
  useEffect(() => {
    if (!user) return;

    const fetchPatientsAndRecords = async () => {
      setIsLoading(true);
      
      try {
        // Get unique patients from appointments
        const { data: appointments, error: aptError } = await supabase
          .from('appointments')
          .select('patient_id')
          .eq('doctor_id', user.id);

        if (aptError) throw aptError;

        const patientIds = [...new Set(appointments?.map(a => a.patient_id) || [])];

        if (patientIds.length === 0) {
          setPatientsWithRecords([]);
          setIsLoading(false);
          return;
        }

        // Get patient profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', patientIds);

        if (profileError) throw profileError;

        // Get medical records for these patients
        const { data: records, error: recordsError } = await supabase
          .from('medical_records')
          .select('*')
          .in('patient_id', patientIds)
          .order('uploaded_at', { ascending: false });

        if (recordsError) throw recordsError;

        // Group records by patient
        const patientsData: PatientWithRecords[] = (profiles || []).map(profile => ({
          patient_id: profile.id,
          patient_name: profile.full_name || 'Unknown Patient',
          patient_avatar: profile.avatar_url,
          records: (records || []).filter(r => r.patient_id === profile.id)
        }));

        setPatientsWithRecords(patientsData);
      } catch (error) {
        console.error('Error fetching patient records:', error);
        toast({
          title: 'Error',
          description: 'Failed to load patient records.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientsAndRecords();
  }, [user, toast]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredPatients = patientsWithRecords.filter(p =>
    p.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPatientData = patientsWithRecords.find(p => p.patient_id === selectedPatient);
  
  const filteredRecords = selectedPatientData?.records.filter(r =>
    filterType === 'all' || r.record_type === filterType
  ) || [];

  if (selectedPatient && selectedPatientData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => setSelectedPatient(null)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patients
        </Button>

        <div className="flex items-center gap-4 mb-8">
          <Avatar className="w-16 h-16">
            <AvatarImage src={selectedPatientData.patient_avatar} />
            <AvatarFallback className="text-xl">{selectedPatientData.patient_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedPatientData.patient_name}</h1>
            <p className="text-muted-foreground">{filteredRecords.length} medical records</p>
          </div>
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
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No records found for this patient</p>
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Records</h1>
          <p className="text-muted-foreground">View medical records from your patients</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patients..."
          className="pl-10"
        />
      </div>

      {/* Patients List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No patients found matching your search' : 'No patients with records yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <Card 
              key={patient.patient_id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedPatient(patient.patient_id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={patient.patient_avatar} />
                    <AvatarFallback>{patient.patient_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{patient.patient_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {patient.records.length} medical {patient.records.length === 1 ? 'record' : 'records'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Records
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
