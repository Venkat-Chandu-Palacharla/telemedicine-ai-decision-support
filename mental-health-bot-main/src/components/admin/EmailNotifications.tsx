import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailNotificationsProps {
  onBack?: () => void;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  template_type: string;
  status: string;
  sent_at?: string;
  created_at: string;
  error_message?: string;
}

// Mock email logs
const mockEmailLogs: EmailLog[] = [
  {
    id: '1',
    recipient_email: 'patient1@example.com',
    subject: 'Appointment Reminder',
    template_type: 'appointment_reminder',
    status: 'sent',
    sent_at: '2024-01-18T09:00:00Z',
    created_at: '2024-01-18T08:55:00Z'
  },
  {
    id: '2',
    recipient_email: 'patient2@example.com',
    subject: 'Prescription Ready',
    template_type: 'prescription_ready',
    status: 'sent',
    sent_at: '2024-01-18T10:30:00Z',
    created_at: '2024-01-18T10:30:00Z'
  },
  {
    id: '3',
    recipient_email: 'doctor@hospital.com',
    subject: 'New Patient Booking',
    template_type: 'new_booking',
    status: 'failed',
    error_message: 'SMTP connection timeout',
    created_at: '2024-01-18T11:00:00Z'
  },
  {
    id: '4',
    recipient_email: 'patient3@example.com',
    subject: 'Lab Results Available',
    template_type: 'lab_results',
    status: 'pending',
    created_at: '2024-01-18T12:00:00Z'
  }
];

const emailTemplates = [
  { value: 'appointment_reminder', label: 'Appointment Reminder', description: 'Remind patients of upcoming appointments' },
  { value: 'prescription_ready', label: 'Prescription Ready', description: 'Notify patients when prescription is ready' },
  { value: 'new_booking', label: 'New Booking', description: 'Alert doctors of new patient bookings' },
  { value: 'lab_results', label: 'Lab Results Available', description: 'Notify patients about available lab results' },
  { value: 'welcome', label: 'Welcome Email', description: 'Welcome new users to the platform' },
  { value: 'custom', label: 'Custom Email', description: 'Send a custom email message' }
];

export default function EmailNotifications({ onBack }: EmailNotificationsProps) {
  const [emailLogs, setEmailLogs] = useState(mockEmailLogs);
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customEmail, setCustomEmail] = useState({
    recipient: '',
    subject: '',
    body: ''
  });

  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate) {
      toast({
        title: 'Template Required',
        description: 'Please select an email template.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedTemplate === 'custom' && (!customEmail.recipient || !customEmail.subject || !customEmail.body)) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields for custom email.',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);

    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newLog = {
      id: Date.now().toString(),
      recipient_email: selectedTemplate === 'custom' ? customEmail.recipient : 'all-patients@example.com',
      subject: selectedTemplate === 'custom' ? customEmail.subject : emailTemplates.find(t => t.value === selectedTemplate)?.label || 'Email',
      template_type: selectedTemplate,
      status: Math.random() > 0.2 ? 'sent' : 'pending',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    setEmailLogs(prev => [newLog, ...prev]);
    setIsSending(false);
    setSelectedTemplate('');
    setCustomEmail({ recipient: '', subject: '', body: '' });

    toast({
      title: 'Email Sent',
      description: 'Your email has been queued for delivery.'
    });
  };

  const handleBulkSend = async (templateType: string) => {
    setIsSending(true);

    await new Promise(resolve => setTimeout(resolve, 3000));

    const newLogs = Array.from({ length: 5 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      recipient_email: `patient${i + 1}@example.com`,
      subject: emailTemplates.find(t => t.value === templateType)?.label || 'Email',
      template_type: templateType,
      status: 'sent' as const,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }));

    setEmailLogs(prev => [...newLogs, ...prev]);
    setIsSending(false);

    toast({
      title: 'Bulk Emails Sent',
      description: `5 emails have been sent successfully.`
    });
  };

  const retryFailed = async () => {
    const failedEmails = emailLogs.filter(e => e.status === 'failed');
    if (failedEmails.length === 0) {
      toast({
        title: 'No Failed Emails',
        description: 'There are no failed emails to retry.'
      });
      return;
    }

    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    setEmailLogs(prev => prev.map(email => 
      email.status === 'failed' ? { ...email, status: 'sent', sent_at: new Date().toISOString() } : email
    ));

    setIsSending(false);
    toast({
      title: 'Retry Complete',
      description: `${failedEmails.length} emails have been resent.`
    });
  };

  const stats = {
    sent: emailLogs.filter(e => e.status === 'sent').length,
    pending: emailLogs.filter(e => e.status === 'pending').length,
    failed: emailLogs.filter(e => e.status === 'failed').length
  };

  return (
    <div className="max-w-6xl">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      )}

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Notifications</h1>
          <p className="text-muted-foreground">Send and manage email notifications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Sent</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">{stats.sent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-muted-foreground">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-2">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Send Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Email
            </CardTitle>
            <CardDescription>Choose a template or send custom email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.map(template => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Recipient Email</Label>
                  <Input
                    type="email"
                    value={customEmail.recipient}
                    onChange={(e) => setCustomEmail(prev => ({ ...prev, recipient: e.target.value }))}
                    placeholder="patient@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={customEmail.subject}
                    onChange={(e) => setCustomEmail(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={customEmail.body}
                    onChange={(e) => setCustomEmail(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Email content..."
                    rows={4}
                  />
                </div>
              </>
            )}

            <Button 
              onClick={handleSendEmail} 
              disabled={isSending || !selectedTemplate}
              className="w-full gradient-primary text-white border-0"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Bulk Actions
            </CardTitle>
            <CardDescription>Send emails to multiple recipients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailTemplates.filter(t => t.value !== 'custom').map(template => (
              <div key={template.value} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">{template.label}</p>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkSend(template.value)}
                  disabled={isSending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button 
              variant="outline" 
              className="w-full"
              onClick={retryFailed}
              disabled={isSending || stats.failed === 0}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Failed Emails ({stats.failed})
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Email Logs */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Email History
          </CardTitle>
          <CardDescription>Recent email notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailLogs.map(email => (
              <div key={email.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{email.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      To: {email.recipient_email} • {new Date(email.created_at).toLocaleString()}
                    </p>
                    {email.status === 'failed' && email.error_message && (
                      <p className="text-xs text-red-500 mt-1">{email.error_message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{email.template_type.replace('_', ' ')}</Badge>
                  {getStatusBadge(email.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
