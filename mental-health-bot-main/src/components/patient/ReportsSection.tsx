import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Download, Calendar, User, Stethoscope } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useToast } from '@/hooks/use-toast';

interface ReportsSectionProps {
  onBack: () => void;
}

const mockReports = [
  {
    id: 'report-1',
    type: 'AI Prediction',
    title: 'Diabetes Risk Assessment',
    date: '2024-01-15',
    summary: 'Low risk (15%) based on current health parameters',
    details: {
      riskLevel: 'Low',
      riskPercentage: 15,
      parameters: {
        age: 35,
        bmi: 24.5,
        bloodGlucose: 95,
        bloodPressure: '120/80'
      },
      recommendations: [
        'Maintain current healthy lifestyle',
        'Regular exercise 30 minutes daily',
        'Balanced diet with limited sugar intake',
        'Annual health checkup recommended'
      ]
    }
  },
  {
    id: 'report-2',
    type: 'Mental Health',
    title: 'Mental Wellness Assessment',
    date: '2024-01-14',
    summary: 'Good mental health status with wellness score of 82/100',
    details: {
      status: 'Good',
      score: 82,
      factors: {
        stress: 4,
        anxiety: 3,
        sleep: 7.5,
        mood: 8
      },
      recommendations: [
        'Continue current stress management practices',
        'Maintain regular sleep schedule',
        'Consider mindfulness meditation',
        'Stay socially connected'
      ]
    }
  }
];

const mockPrescriptions = [
  {
    id: 'presc-1',
    doctor: 'Dr. Sarah Wilson',
    date: '2024-01-10',
    diagnosis: 'Seasonal Allergies',
    medications: [
      { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '2 weeks' },
      { name: 'Nasal Spray', dosage: '2 sprays', frequency: 'Twice daily', duration: '1 week' }
    ],
    instructions: 'Take medication after meals. Avoid allergens when possible.'
  }
];

export default function ReportsSection({ onBack }: ReportsSectionProps) {
  const { toast } = useToast();

  const downloadReport = (report: typeof mockReports[0]) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(20, 184, 166);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('TeleMed AI', 20, 25);
    doc.setFontSize(12);
    doc.text('Health Report', 20, 35);

    // Patient Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Patient: John Smith', 20, 55);
    doc.text(`Date: ${report.date}`, 20, 65);
    doc.text(`Report Type: ${report.type}`, 20, 75);

    // Report Details
    doc.setFontSize(18);
    doc.text(report.title, 20, 95);
    
    doc.setFontSize(12);
    doc.text(`Summary: ${report.summary}`, 20, 110);

    if (report.details.riskLevel) {
      doc.text(`Risk Level: ${report.details.riskLevel}`, 20, 125);
      doc.text(`Risk Percentage: ${report.details.riskPercentage}%`, 20, 135);
    }

    if (report.details.status) {
      doc.text(`Status: ${report.details.status}`, 20, 125);
      doc.text(`Wellness Score: ${report.details.score}/100`, 20, 135);
    }

    // Recommendations
    doc.setFontSize(14);
    doc.text('Recommendations:', 20, 155);
    doc.setFontSize(11);
    report.details.recommendations.forEach((rec, index) => {
      doc.text(`${index + 1}. ${rec}`, 25, 170 + (index * 10));
    });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('This report is AI-generated and should be reviewed by a healthcare professional.', 20, 280);

    doc.save(`${report.title.replace(/\s+/g, '_')}_${report.date}.pdf`);
    
    toast({
      title: 'Report Downloaded',
      description: 'Your health report has been saved as PDF.'
    });
  };

  const downloadPrescription = (prescription: typeof mockPrescriptions[0]) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(20, 184, 166);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('TeleMed AI', 20, 25);
    doc.setFontSize(12);
    doc.text('Digital Prescription', 20, 35);

    // Doctor Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Prescribed by: ${prescription.doctor}`, 20, 55);
    doc.text(`Date: ${prescription.date}`, 20, 65);

    // Patient Info
    doc.text('Patient: John Smith', 20, 80);

    // Diagnosis
    doc.setFontSize(12);
    doc.text(`Diagnosis: ${prescription.diagnosis}`, 20, 95);

    // Medications
    doc.setFontSize(14);
    doc.text('Medications:', 20, 115);
    
    let yPos = 130;
    prescription.medications.forEach((med, index) => {
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${med.name}`, 25, yPos);
      doc.setFontSize(10);
      doc.text(`   Dosage: ${med.dosage}`, 30, yPos + 8);
      doc.text(`   Frequency: ${med.frequency}`, 30, yPos + 16);
      doc.text(`   Duration: ${med.duration}`, 30, yPos + 24);
      yPos += 35;
    });

    // Instructions
    doc.setFontSize(12);
    doc.text('Instructions:', 20, yPos + 10);
    doc.setFontSize(10);
    doc.text(prescription.instructions, 20, yPos + 22);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('Digital prescription generated via TeleMed AI platform.', 20, 280);

    doc.save(`Prescription_${prescription.date}.pdf`);
    
    toast({
      title: 'Prescription Downloaded',
      description: 'Your prescription has been saved as PDF.'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Prescriptions</h1>
          <p className="text-muted-foreground">View and download your health documents</p>
        </div>
      </div>

      <Tabs defaultValue="reports">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="reports">Health Reports</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {mockReports.map(report => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                        {report.type}
                      </span>
                    </div>
                    <CardTitle>{report.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      {report.date}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadReport(report)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{report.summary}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          {mockPrescriptions.map(prescription => (
            <Card key={prescription.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-primary" />
                      {prescription.diagnosis}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {prescription.doctor}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {prescription.date}
                      </span>
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadPrescription(prescription)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Medications:</p>
                  {prescription.medications.map((med, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium text-foreground">{med.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {med.dosage} • {med.frequency} • {med.duration}
                      </p>
                    </div>
                  ))}
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-medium">Instructions:</span> {prescription.instructions}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
