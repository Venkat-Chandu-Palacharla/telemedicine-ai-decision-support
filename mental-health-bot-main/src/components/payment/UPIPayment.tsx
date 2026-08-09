import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Wallet, 
  CheckCircle, 
  Clock, 
  XCircle,
  IndianRupee,
  Loader2,
  QrCode,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface UPIPaymentProps {
  onBack: () => void;
  appointmentId?: string;
  doctorId?: string;
  doctorName?: string;
  amount?: number;
  onSuccess?: () => void;
}

// Mock payment history
const mockPaymentHistory = [
  {
    id: '1',
    doctor_name: 'Dr. Sarah Wilson',
    amount: 500,
    upi_id: 'doctor@upi',
    transaction_id: 'TXN123456789',
    status: 'completed',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    doctor_name: 'Dr. Michael Chen',
    amount: 750,
    upi_id: 'drmichael@upi',
    transaction_id: 'TXN987654321',
    status: 'completed',
    created_at: '2024-01-10T14:20:00Z'
  },
  {
    id: '3',
    doctor_name: 'Dr. Emily Rodriguez',
    amount: 600,
    upi_id: 'emily.doc@upi',
    transaction_id: 'TXN456789123',
    status: 'pending',
    created_at: '2024-01-18T09:00:00Z'
  }
];

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: '💳' },
  { id: 'phonepe', name: 'PhonePe', icon: '📱' },
  { id: 'paytm', name: 'Paytm', icon: '💰' },
  { id: 'bhim', name: 'BHIM', icon: '🏦' }
];

export default function UPIPayment({ 
  onBack, 
  appointmentId, 
  doctorId, 
  doctorName = 'Doctor',
  amount = 500,
  onSuccess 
}: UPIPaymentProps) {
  const [paymentHistory] = useState(mockPaymentHistory);
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const { user } = useAuth();
  const { toast } = useToast();

  const validateUpiId = (id: string) => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(id);
  };

  const handlePayWithUPI = async () => {
    if (!upiId) {
      toast({
        title: 'UPI ID Required',
        description: 'Please enter your UPI ID to proceed.',
        variant: 'destructive'
      });
      return;
    }

    if (!validateUpiId(upiId)) {
      toast({
        title: 'Invalid UPI ID',
        description: 'Please enter a valid UPI ID (e.g., name@upi).',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 90% success rate for demo
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      setPaymentStatus('success');
      toast({
        title: 'Payment Successful',
        description: `₹${amount} paid successfully to ${doctorName}.`
      });
      onSuccess?.();
    } else {
      setPaymentStatus('failed');
      toast({
        title: 'Payment Failed',
        description: 'Transaction could not be completed. Please try again.',
        variant: 'destructive'
      });
    }

    setIsProcessing(false);
  };

  const handleAppPayment = async (appId: string) => {
    setSelectedApp(appId);
    setIsProcessing(true);
    setPaymentStatus('processing');

    // Simulate redirecting to app
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate payment completion
    await new Promise(resolve => setTimeout(resolve, 2000));

    setPaymentStatus('success');
    setIsProcessing(false);

    toast({
      title: 'Payment Successful',
      description: `₹${amount} paid via ${UPI_APPS.find(a => a.id === appId)?.name}.`
    });
    onSuccess?.();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950 mx-auto flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-4">
              ₹{amount} has been paid to {doctorName}
            </p>
            <div className="p-4 rounded-lg bg-muted mb-6">
              <p className="text-sm text-muted-foreground">Transaction ID</p>
              <p className="font-mono text-foreground">TXN{Date.now()}</p>
            </div>
            <Button onClick={onBack} className="w-full">
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400 flex items-center justify-center">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">UPI Payment</h1>
          <p className="text-muted-foreground">Secure payment via UPI</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Pay ₹{amount}
            </CardTitle>
            <CardDescription>Consultation fee for {doctorName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* UPI Apps */}
            <div className="space-y-3">
              <Label>Pay using UPI App</Label>
              <div className="grid grid-cols-2 gap-3">
                {UPI_APPS.map(app => (
                  <Button
                    key={app.id}
                    variant={selectedApp === app.id ? 'default' : 'outline'}
                    className="h-16 flex flex-col gap-1"
                    onClick={() => handleAppPayment(app.id)}
                    disabled={isProcessing}
                  >
                    <span className="text-2xl">{app.icon}</span>
                    <span className="text-xs">{app.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or pay with UPI ID</span>
              </div>
            </div>

            {/* UPI ID Input */}
            <div className="space-y-2">
              <Label>Your UPI ID</Label>
              <Input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                Enter your UPI ID linked to your bank account
              </p>
            </div>

            <Button 
              onClick={handlePayWithUPI} 
              disabled={isProcessing || !upiId}
              className="w-full gradient-primary text-white border-0"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Pay ₹{amount}
                </>
              )}
            </Button>

            {/* QR Code Option */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowQR(!showQR)}
            >
              <QrCode className="w-4 h-4 mr-2" />
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </Button>

            {showQR && (
              <div className="p-6 bg-muted rounded-lg text-center">
                <div className="w-48 h-48 bg-white mx-auto rounded-lg flex items-center justify-center border">
                  <div className="text-center">
                    <QrCode className="w-20 h-20 text-gray-800 mx-auto" />
                    <p className="text-xs text-gray-600 mt-2">Scan to pay ₹{amount}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Scan this QR code with any UPI app
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment History
            </CardTitle>
            <CardDescription>Your recent payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentHistory.map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">{payment.doctor_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {payment.transaction_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">₹{payment.amount}</p>
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
