import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Pill, 
  ArrowLeft, 
  Search, 
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
DollarSign,
  ChevronRight,
  Stethoscope,
  Activity,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';

// Symptom-based medicine database (simplified for demo)
const medicineDatabase = [
  {
    symptoms: ['headache', 'head pain', 'head ache', 'migraine'],
    medicines: [
      { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 4-6 hours', maxDose: '4 per day', warnings: 'Do not exceed recommended dose' },
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 6-8 hours', maxDose: '3 per day', warnings: 'Take with food' }
    ]
  },
  {
    symptoms: ['fever', 'high temperature', 'febrile'],
    medicines: [
      { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 4-6 hours', maxDose: '4 per day', warnings: 'Stay hydrated' },
      { name: 'Acetaminophen', dosage: '500mg', frequency: 'Every 4-6 hours', maxDose: '4 per day', warnings: 'Avoid alcohol' }
    ]
  },
  {
    symptomatic: ['cold', 'cough', 'flu', 'runny nose'],
    medicines: [
      { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', maxDose: '1 per day', warnings: 'May cause drowsiness' },
      { name: 'Benadryl', dosage: '25mg', frequency: 'Every 4-6 hours', maxDose: '6 per day', warnings: 'May cause drowsiness' }
    ]
  },
  {
    symptoms: ['cough', 'dry cough', 'wet cough'],
    medicines: [
      { name: 'Dextromethorphan', dosage: '10mg', frequency: 'Every 4 hours', maxDose: '6 per day', warnings: 'Do not use for wet cough' },
      { name: 'Ambroxol', dosage: '30mg', frequency: 'Twice daily', maxDose: '2 per day', warnings: 'Take with meals' }
    ]
  },
  {
    symptoms: ['stomach pain', 'abdomen pain', 'stomach ache', 'acidity'],
    medicines: [
      { name: 'Omeprazole', dosage: '20mg', frequency: 'Once daily before breakfast', maxDose: '1 per day', warnings: 'Take 30 min before meal' },
      { name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily', maxDose: '1 per day', warnings: 'Take before meal' }
    ]
  },
  {
    symptoms: ['diarrhea', 'loose motion'],
    medicines: [
      { name: 'ORS', dosage: '1 packet', frequency: 'After each loose motion', maxDose: 'As needed', warnings: 'Stay hydrated' },
      { name: 'Loperamide', dosage: '2mg', frequency: 'After each loose motion', maxDose: '8mg per day', warnings: 'Stop if no improvement in 48h' }
    ]
  },
  {
    symptoms: ['allergy', 'allergic', 'skin rash', 'itching'],
    medicines: [
      { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', maxDose: '1 per day', warnings: 'May cause drowsiness' },
      { name: 'Fexofenadine', dosage: '180mg', frequency: 'Once daily', maxDose: '1 per day', warnings: 'Less drowsiness' }
    ]
  },
  {
    symptoms: ['body pain', 'muscle pain', 'joint pain', 'back pain'],
    medicines: [
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 6-8 hours', maxDose: '3 per day', warnings: 'Take with food' },
      { name: 'Dolopan', dosage: '500mg', frequency: 'Every 6-8 hours', maxDose: '4 per day', warnings: 'Take with meals' }
    ]
  },
  {
    symptoms: ['anxiety', 'stress', 'mental tension', 'insomnia'],
    medicines: [
      { name: 'Clonazepam', dosage: '0.5mg', frequency: 'Once at bedtime', maxDose: '1 per day', warnings: 'May cause drowsiness - do not drive' },
      { name: 'Exforge', dosage: '5mg', frequency: 'Once daily', maxDose: '1 per day', warnings: 'Consult doctor first' }
    ]
  }
];

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  maxDose: string;
  warnings: string;
}

interface MedicineRecommendationProps {
  onBack: () => void;
}

const MedicineRecommendation: React.FC<MedicineRecommendationProps> = ({ onBack }) => {
  const [symptoms, setSymptoms] = useState('');
  const [recommendations, setRecommendations] = useState<Medicine[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  const searchMedicines = () => {
    if (!symptoms.trim()) {
      toast.error('Please enter your symptoms');
      return;
    }

    const searchTerm = symptoms.toLowerCase();
    const results: Medicine[] = [];

    medicineDatabase.forEach(entry => {
      const matched = entry.symptoms.some(s => searchTerm.includes(s));
      if (matched) {
        results.push(...entry.medicines);
      }
    });

    setRecommendations(results);
    setHasSearched(true);
    setSelectedMedicine(null);

    if (results.length === 0) {
      toast.warning('No medicines found for your symptoms. Please consult a doctor.');
    } else {
      toast.success(`Found ${results.length} medicine options`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <Card className="border-teal-200 dark:border-teal-800">
          <CardHeader className="bg-teal-50 dark:bg-teal-950/50 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                <Pill className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <CardTitle className="text-teal-700 dark:text-teal-300">Medicine Recommendation</CardTitle>
                <CardDescription>Based on your symptoms</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your symptoms (e.g., headache, fever, cough)"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchMedicines()}
                className="flex-1"
              />
              <Button onClick={searchMedicines} className="bg-teal-600 hover:bg-teal-700">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              ⚠️ This is for reference only. Always consult a doctor before taking medicines.
            </p>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Important Disclaimer</p>
              <p className="text-amber-700 dark:text-amber-300">
                This medicine recommendation is based on common symptoms and should NOT replace professional medical advice. 
                Always consult a qualified doctor before taking any medication, especially if you are pregnant, nursing, 
                or have existing health conditions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No medicines found</p>
                  <p className="text-muted-foreground mb-4">
                    We couldn't find any medicines for your symptoms.
                  </p>
                  <Button onClick={() => window.open('tel:+91')} className="bg-teal-600">
                    <Phone className="h-4 w-4 mr-2" />
                    Consult Doctor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  Recommended Medicines
                </h3>
                {recommendations.map((medicine, idx) => (
                  <Card 
                    key={idx}
                    className={`cursor-pointer transition-all ${
                      selectedMedicine === medicine 
                        ? 'border-teal-500 ring-2 ring-teal-500/20' 
                        : 'hover:border-teal-300'
                    }`}
                    onClick={() => setSelectedMedicine(medicine)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center flex-shrink-0">
                            <Pill className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{medicine.name}</p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Pill className="h-3 w-3" />
                                {medicine.dosage}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {medicine.frequency}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>

                      {selectedMedicine === medicine && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-muted/30 p-2 rounded">
                              <p className="text-muted-foreground text-xs">Dosage</p>
                              <p className="font-medium">{medicine.dosage}</p>
                            </div>
                            <div className="bg-muted/30 p-2 rounded">
                              <p className="text-muted-foreground text-xs">Max per day</p>
                              <p className="font-medium">{medicine.maxDose}</p>
                            </div>
                          </div>
                          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Warning: {medicine.warnings}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-teal-600 hover:bg-teal-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success('Added to prescription request');
                              }}
                            >
                              Request Prescription
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMedicine(null);
                              }}
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {/* Quick Links */}
        {!hasSearched && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Common Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {['Headache/Fever', 'Cough/Cold', 'Stomach Issues', 'Allergies', 'Body Pain', 'Anxiety/Stress'].map((condition) => (
                <Button
                  key={condition}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    setSymptoms(condition);
                  }}
                >
                  {condition}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Emergency Notice */}
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-700 dark:text-red-300">Seek Immediate Medical Attention</p>
                <p className="text-muted-foreground">
                  If you experience severe symptoms, chest pain, difficulty breathing, or allergic reactions,
                  call emergency services immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MedicineRecommendation;
