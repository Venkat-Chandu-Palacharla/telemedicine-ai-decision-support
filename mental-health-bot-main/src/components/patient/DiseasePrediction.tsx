import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Brain, Loader2, AlertTriangle, CheckCircle2, Info, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { diseaseTypes } from '@/data/mockData';
import { HealthParameters, PredictionResult, DiseaseType } from '@/types/telemedicine';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';

interface DiseasePredictionProps {
  onBack: () => void;
}

export default function DiseasePrediction({ onBack }: DiseasePredictionProps) {
  const [selectedDisease, setSelectedDisease] = useState<DiseaseType | null>(null);
  const [parameters, setParameters] = useState<HealthParameters>({
    age: 35,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    bloodGlucose: 100,
    bmi: 24,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const { toast } = useToast();

  const handlePredict = async () => {
    if (!selectedDisease) return;
    
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-prediction', {
        body: {
          diseaseType: selectedDisease.id,
          parameters
        }
      });

      if (error) throw error;

      setResult(data);
    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: 'Prediction Failed',
        description: 'Unable to get AI prediction. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Moderate': return 'text-amber-600 bg-amber-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Low': return <CheckCircle2 className="w-5 h-5" />;
      case 'Moderate': return <Info className="w-5 h-5" />;
      case 'High': return <AlertTriangle className="w-5 h-5" />;
      default: return null;
    }
  };

  const downloadPredictionReport = () => {
    if (!result || !selectedDisease) return;

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    
    // Header with gradient effect
    doc.setFillColor(124, 58, 237); // Purple
    doc.rect(0, 0, 210, 45, 'F');
    doc.setFillColor(99, 102, 241); // Indigo accent
    doc.rect(0, 40, 210, 5, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TeleMed AI', 20, 22);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('AI Disease Prediction Report', 20, 32);
    doc.setFontSize(10);
    doc.text(`Generated: ${date}`, 20, 40);

    // Disclaimer Banner
    doc.setFillColor(254, 243, 199); // Amber light
    doc.rect(15, 52, 180, 12, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.rect(15, 52, 180, 12, 'S');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(8);
    doc.text('DISCLAIMER: This is a decision-support tool and is not a substitute for professional medical diagnosis.', 20, 59);

    // Disease Info Section
    let yPos = 75;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${selectedDisease.name} Risk Assessment`, 20, yPos);
    
    // Risk Level Box
    yPos += 12;
    const riskColor = result.riskLevel === 'Low' ? [34, 197, 94] : 
                      result.riskLevel === 'Moderate' ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.roundedRect(20, yPos, 60, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`${result.riskLevel} Risk`, 30, yPos + 13);

    // Heuristic/AI score; this service does not provide a calibrated probability.
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(`${result.riskPercentage}%`, 100, yPos + 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Risk score (not probability)', 100, yPos + 22);

    // Input Parameters Section
    yPos += 35;
    doc.setFillColor(243, 244, 246);
    doc.rect(15, yPos, 180, 25, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Input Health Parameters', 20, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Age: ${parameters.age} years  |  BMI: ${parameters.bmi} kg/m²  |  Blood Pressure: ${parameters.bloodPressureSystolic}/${parameters.bloodPressureDiastolic} mmHg  |  Glucose: ${parameters.bloodGlucose} mg/dL`, 20, yPos + 18);

    // Prediction provenance and verified evaluation metrics.
    yPos += 35;
    doc.setFillColor(124, 58, 237);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Model and Evaluation Information', 20, yPos + 6);

    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Prediction service:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('Supabase AI Edge Function (ai-prediction)', 62, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Accuracy:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('Not available', 55, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('ROC-AUC:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('Not available', 55, yPos);

    yPos += 7;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      'No trained model evaluation metrics or fitted calibrator are connected to this prediction service.',
      20,
      yPos,
    );

    // The Edge Function returns AI-generated factor notes, not SHAP values.
    yPos += 12;
    doc.setFillColor(34, 197, 94);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('AI-Generated Factor Notes (Not SHAP)', 20, yPos + 6);

    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const factors = result.factors ?? [];
    if (factors.length === 0) {
      doc.text('Not available', 25, yPos);
      yPos += 8;
    } else {
      factors.forEach((factor) => {
        const factorLine = doc.splitTextToSize(
          `${factor.name}: ${factor.impact} impact (AI-generated; not a validated explanation)`,
          165,
        );
        doc.text(factorLine, 25, yPos);
        yPos += factorLine.length * 5 + 2;
      });
    }

    // Recommendations Section
    yPos += 5;
    doc.setFillColor(59, 130, 246);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('AI-Powered Recommendations', 20, yPos + 6);

    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    result.recommendations.forEach((rec, index) => {
      const recLines = doc.splitTextToSize(`${index + 1}. ${rec}`, 165);
      doc.text(recLines, 25, yPos);
      yPos += recLines.length * 5 + 3;
    });

    // Footer
    doc.setFillColor(243, 244, 246);
    doc.rect(0, 275, 210, 22, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('This AI-generated report is for informational purposes only. Always consult healthcare professionals for medical decisions.', 20, 282);
    doc.text('Powered by TeleMed AI - Decision-Support Tool', 20, 289);

    // Save PDF
    doc.save(`${selectedDisease.name.replace(/\s+/g, '_')}_Prediction_Report_${date.replace(/\//g, '-')}.pdf`);

    toast({
      title: 'Report Downloaded',
      description: 'Your decision-support report has been saved as PDF.'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Disease Prediction</h1>
          <p className="text-muted-foreground">Get AI-powered health risk analysis</p>
        </div>
      </div>

      {!selectedDisease ? (
        <div className="grid md:grid-cols-2 gap-4">
          {diseaseTypes.map((disease) => (
            <Card 
              key={disease.id}
              className="cursor-pointer hover:shadow-elevated transition-all border-border/50 hover:border-primary/50"
              onClick={() => setSelectedDisease(disease)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{disease.icon}</span>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{disease.name}</h3>
                    <p className="text-sm text-muted-foreground">{disease.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !result ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedDisease.icon}</span>
                <div>
                  <CardTitle>{selectedDisease.name} Risk Assessment</CardTitle>
                  <CardDescription>Enter your health parameters for AI analysis</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedDisease(null)}>
                Change Disease
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  value={parameters.age}
                  onChange={(e) => setParameters({ ...parameters, age: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bmi">BMI (kg/m²)</Label>
                <Input
                  id="bmi"
                  type="number"
                  step="0.1"
                  value={parameters.bmi}
                  onChange={(e) => setParameters({ ...parameters, bmi: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Blood Pressure (mmHg)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Systolic"
                    value={parameters.bloodPressureSystolic}
                    onChange={(e) => setParameters({ ...parameters, bloodPressureSystolic: Number(e.target.value) })}
                  />
                  <span className="flex items-center text-muted-foreground">/</span>
                  <Input
                    type="number"
                    placeholder="Diastolic"
                    value={parameters.bloodPressureDiastolic}
                    onChange={(e) => setParameters({ ...parameters, bloodPressureDiastolic: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="glucose">Blood Glucose (mg/dL)</Label>
                <Input
                  id="glucose"
                  type="number"
                  value={parameters.bloodGlucose}
                  onChange={(e) => setParameters({ ...parameters, bloodGlucose: Number(e.target.value) })}
                />
              </div>
            </div>

            <Button 
              className="w-full gradient-primary text-white border-0"
              onClick={handlePredict}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Get AI Prediction
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedDisease.icon}</span>
                  {selectedDisease.name} Risk Analysis
                </CardTitle>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getRiskColor(result.riskLevel)}`}>
                  {getRiskIcon(result.riskLevel)}
                  {result.riskLevel} Risk
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Risk score (not calibrated probability)</span>
                  <span className="text-2xl font-bold text-foreground">{result.riskPercentage}%</span>
                </div>
                <Progress value={result.riskPercentage} className="h-3" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">AI-generated confidence estimate (unvalidated)</span>
                <span className="font-semibold text-foreground">{result.confidence}%</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm text-muted-foreground">Model evaluation ROC-AUC</span>
                <span className="font-semibold text-foreground">Not available</span>
              </div>

              {/* Decision-support interpretation guidance */}
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-1 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  How to Interpret This Result
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-500">
                  This is a <strong>decision-support estimate</strong>, not a medical diagnosis. The risk
                  percentage is an AI-generated risk score, not a statistically calibrated probability, for
                  {` ${selectedDisease.name}`}. The confidence estimate is not a validated statistical measure.
                  It should be used as a conversation starter with a
                  qualified healthcare professional, not as a standalone conclusion.
                </p>
              </div>

              {result.factors && result.factors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Risk Factors Analysis</h4>
                  <div className="space-y-2">
                    {result.factors.map((factor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="text-sm text-foreground">{factor.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          factor.impact === 'positive' ? 'bg-green-100 text-green-600' :
                          factor.impact === 'negative' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {factor.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Link to full documentation */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">View Full ML Documentation</p>
                    <p className="text-xs text-muted-foreground">Model comparisons, ethics, training flow, and dataset justification</p>
                  </div>
                </div>
                <Link to="/ml-documentation">
                  <Button variant="outline" size="sm">View Docs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              className="flex-1 gradient-primary text-white border-0"
              onClick={downloadPredictionReport}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF Report
            </Button>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setResult(null)} className="flex-1">
              New Assessment
            </Button>
            <Button variant="outline" onClick={() => { setResult(null); setSelectedDisease(null); }} className="flex-1">
              Different Disease
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
