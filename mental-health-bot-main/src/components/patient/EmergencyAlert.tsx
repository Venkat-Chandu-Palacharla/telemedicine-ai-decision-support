import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Phone, 
  Plus, 
  Trash2, 
  MapPin, 
  Bell, 
  CheckCircle2,
  Clock,
  ArrowLeft,
  User,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

interface EmergencyAlertProps {
  onBack: () => void;
}

const EmergencyAlert: React.FC<EmergencyAlertProps> = ({ onBack }) => {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'John Doe',
      phone: '+91 98765 43210',
      relationship: 'Father',
      isPrimary: true
    },
    {
      id: '2',
      name: 'Jane Doe',
      phone: '+91 98765 43211',
      relationship: 'Mother',
      isPrimary: false
    }
  ]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: ''
  });
  const [alertHistory, setAlertHistory] = useState<{ time: Date; type: string; status: string }[]>([
    {
      time: new Date(Date.now() - 86400000 * 2),
      type: 'Manual',
      status: 'Sent'
    }
  ]);

  // Countdown for SOS
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isActive && countdown === 0) {
      triggerEmergency();
    }
    return () => clearInterval(interval);
  }, [isActive, countdown]);

  const triggerEmergency = () => {
    // Simulate sending emergency alerts
    toast.error('🚨 EMERGENCY ALERT TRIGGERED!', {
      description: 'Notifying all emergency contacts...',
      duration: 10000
    });

    // Add to history
    setAlertHistory(prev => [{
      time: new Date(),
      type: 'SOS Alert',
      status: 'Sent'
    }, ...prev]);

    setIsActive(false);
    setCountdown(5);
  };

  const cancelEmergency = () => {
    setIsActive(false);
    setCountdown(5);
    toast.info('Emergency alert cancelled');
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      toast.error('Please fill all fields');
      return;
    }

    const contact: EmergencyContact = {
      id: Date.now().toString(),
      name: newContact.name,
      phone: newContact.phone,
      relationship: newContact.relationship || 'Other',
      isPrimary: emergencyContacts.length === 0
    };

    setEmergencyContacts(prev => [...prev, contact]);
    setNewContact({ name: '', phone: '', relationship: '' });
    setShowAddContact(false);
    toast.success('Emergency contact added');
  };

  const removeContact = (id: string) => {
    setEmergencyContacts(prev => prev.filter(c => c.id !== id));
    toast.success('Contact removed');
  };

  const setPrimaryContact = (id: string) => {
    setEmergencyContacts(prev => prev.map(c => ({
      ...c,
      isPrimary: c.id === id
    })));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="space-y-6">
        {/* SOS Button */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="text-center bg-red-50 dark:bg-red-950/50 rounded-t-lg">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600 dark:text-red-400 text-xl">Emergency SOS</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!isActive ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Press the button below to send emergency alert to all your contacts
                </p>
                <Button
                  onClick={() => setIsActive(true)}
                  className="w-full h-16 text-xl font-bold bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 animate-pulse"
                >
                  <Shield className="w-6 h-6 mr-2" />
                  SEND EMERGENCY ALERT
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-red-600 animate-pulse">
                  {countdown}
                </div>
                <p className="text-red-600 font-medium">
                  Sending alert in {countdown} seconds...
                </p>
                <p className="text-sm text-muted-foreground">
                  Tap cancel to stop
                </p>
                <Button
                  onClick={cancelEmergency}
                  variant="outline"
                  className="w-full border-2"
                >
                  CANCEL
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Emergency Contacts
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowAddContact(!showAddContact)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {showAddContact && (
              <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-3">
                <Input
                  placeholder="Contact Name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
                <Input
                  placeholder="Phone Number"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
                <Input
                  placeholder="Relationship (e.g., Father, Spouse)"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddContact}>
                    Add Contact
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddContact(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contact.name}</span>
                      {contact.isPrimary && (
                        <Badge variant="default" className="bg-green-500">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                  </div>
                  <div className="flex gap-2">
                    {!contact.isPrimary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPrimaryContact(contact.id)}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeContact(contact.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Call Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Quick Call
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-14">
              <Phone className="h-4 w-4 mr-2" />
              Police (100)
            </Button>
            <Button variant="outline" className="h-14">
              <Phone className="h-4 w-4 mr-2" />
              Ambulance (102)
            </Button>
            <Button variant="outline" className="h-14">
              <Phone className="h-4 w-4 mr-2" />
              Fire (101)
            </Button>
            <Button
              variant="outline"
              className="h-14 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => window.open('tel:108')}
            >
              <Phone className="h-4 w-4 mr-2" />
              Emergency (108)
            </Button>
          </CardContent>
        </Card>

        {/* Alert History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Alert History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No emergency alerts sent yet
              </p>
            ) : (
              <div className="space-y-2">
                {alertHistory.map((alert, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{alert.type}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {alert.time.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergencyAlert;
