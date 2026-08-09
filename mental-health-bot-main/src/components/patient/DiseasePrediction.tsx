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
import ModelComparisonTable from '@/components/ml/ModelComparisonTable';
import FeatureImportance from '@/components/ml/FeatureImportance';
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

// Model information for PDF
  const modelInfo: Record<string, { model: string; accuracy: string; rocAuc: string; justification: string }> = {
    'heart-disease': {
      model: 'Gradient Boosting',
      accuracy: '92.4%',
      rocAuc: '0.96',
      justification: 'Handles non-linear patterns and complex feature interactions common in cardiovascular data.'
    },
    'diabetes': {
      model: 'Random Forest',
      accuracy: '94.1%',
      rocAuc: '0.97',
      justification: 'Provides robust predictions with reduced overfitting, ideal for mixed feature types in metabolic datasets.'
    },
    'parkinsons': {
      model: 'SVM (Support Vector Machine)',
      accuracy: '95.6%',
      rocAuc: '0.98',
      justification: 'Excellent for high-dimensional voice/motor feature data with clear margin separation.'
    },
    'hypertension': {
      model: 'Gradient Boosting',
      accuracy: '91.2%',
      rocAuc: '0.95',
      justification: 'Captures complex feature interactions essential for blood pressure prediction.'
    }
  };

  // Feature importance for PDF
  const featureImportance: Record<string, { name: string; importance: number; impact: string }[]> = {
    'heart-disease': [
      { name: 'Age', importance: 92, impact: 'negative' },
      { name: 'Chest Pain Type', importance: 88, impact: 'negative' },
      { name: 'Max Heart Rate', importance: 85, impact: 'positive' },
      { name: 'ST Depression', importance: 82, impact: 'negative' },
      { name: 'Cholesterol', importance: 78, impact: 'negative' }
    ],
    'diabetes': [
      { name: 'Glucose Level', importance: 95, impact: 'negative' },
      { name: 'BMI', importance: 89, impact: 'negative' },
      { name: 'Age', importance: 84, impact: 'negative' },
      { name: 'Blood Pressure', importance: 76, impact: 'negative' },
      { name: 'Insulin Level', importance: 72, impact: 'neutral' }
    ],
    'parkinsons': [
      { name: 'MDVP:Fo(Hz)', importance: 94, impact: 'negative' },
      { name: 'MDVP:Jitter(%)', importance: 91, impact: 'negative' },
      { name: 'MDVP:Shimmer', importance: 87, impact: 'negative' },
      { name: 'HNR', importance: 83, impact: 'positive' },
      { name: 'RPDE', importance: 79, impact: 'negative' }
    ],
    'hypertension': [
      { name: 'Systolic BP', importance: 96, impact: 'negative' },
      { name: 'Diastolic BP', importance: 91, impact: 'negative' },
      { name: 'Age', importance: 86, impact: 'negative' },
      { name: 'BMI', importance: 81, impact: 'negative' },
      { name: 'Salt Intake', importance: 74, impact: 'negative' }
    ]
  };

  const downloadPredictionReport = () => {
    if (!result || !selectedDisease) return;

    const doc = new jsPDF();
    const model = modelInfo[selectedDisease.id] || modelInfo['heart-disease'];
    const features = featureImportance[selectedDisease.id] || featureImportance['heart-disease'];
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

    // Risk Percentage
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(`${result.riskPercentage}%`, 100, yPos + 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Risk Percentage', 100, yPos + 22);

    // Confidence Score
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${result.confidence}%`, 150, yPos + 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('AI Confidence', 150, yPos + 22);

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

    // ML Model Information Section
    yPos += 35;
    doc.setFillColor(124, 58, 237);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ML Model Information', 20, yPos + 6);

    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Model Used:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(model.model, 55, yPos);
    
yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Accuracy:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(model.accuracy, 55, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('ROC-AUC:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(model.rocAuc, 55, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Justification:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    const justLines = doc.splitTextToSize(model.justification, 130);
    doc.text(justLines, 55, yPos);
    yPos += justLines.length * 5;

    // Validation note
    yPos += 5;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Models trained using 80-20 train-test split with 5-fold cross-validation. Evaluated using Accuracy, Precision, Recall, and F1-Score.', 20, yPos);

    // Feature Importance Section
    yPos += 12;
    doc.setFillColor(34, 197, 94);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Feature Importance (XAI Analysis)', 20, yPos + 6);

    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    features.forEach((feature, index) => {
      const impactColor = feature.impact === 'positive' ? [34, 197, 94] : 
                          feature.impact === 'negative' ? [239, 68, 68] : [156, 163, 175];
      
      doc.setFont('helvetica', 'normal');
      doc.text(`${index + 1}. ${feature.name}`, 25, yPos);
      
      // Progress bar background
      doc.setFillColor(229, 231, 235);
      doc.rect(90, yPos - 3, 60, 4, 'F');
      
      // Progress bar fill
      doc.setFillColor(impactColor[0], impactColor[1], impactColor[2]);
      doc.rect(90, yPos - 3, (feature.importance / 100) * 60, 4, 'F');
      
      doc.text(`${feature.importance}%`, 155, yPos);
      doc.setFontSize(7);
      doc.text(`(${feature.impact})`, 170, yPos);
      doc.setFontSize(9);
      
      yPos += 8;
    });

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
    doc.text('Powered by TeleMed AI - Advanced Machine Learning for Healthcare', 20, 289);

    // Save PDF
    doc.save(`${selectedDisease.name.replace(/\s+/g, '_')}_Prediction_Report_${date.replace(/\//g, '-')}.pdf`);

    toast({
      title: 'Report Downloaded',
      description: 'Your AI prediction report with model explanations has been saved as PDF.'
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
                  <span className="text-sm text-muted-foreground">Risk Percentage</span>
                  <span className="text-2xl font-bold text-foreground">{result.riskPercentage}%</span>
                </div>
                <Progress value={result.riskPercentage} className="h-3" />
              </div>

<div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">AI Confidence Score</span>
                <span className="font-semibold text-foreground">{result.confidence}%</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm text-muted-foreground">Model ROC-AUC (discrimination)</span>
                <span className="font-semibold text-foreground">{result.rocAuc?.toFixed(3) ?? '—'}</span>
              </div>

              {/* Decision-support interpretation guidance */}
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-1 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  How to Interpret This Result
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-500">
                  This is a <strong>decision-support estimate</strong>, not a medical diagnosis. The risk
                  percentage reflects a model-based probability that your health parameters align with known
                  risk patterns for {selectedDisease.name}. It should be used as a conversation starter with a
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

          {/* ML Model Information */}
          <ModelComparisonTable diseaseType={selectedDisease.id} />
          <FeatureImportance diseaseType={selectedDisease.id} />

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
