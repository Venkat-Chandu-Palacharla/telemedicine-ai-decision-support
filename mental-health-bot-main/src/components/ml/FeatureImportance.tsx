import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Feature {
  name: string;
  importance: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface FeatureImportanceProps {
  diseaseType: string;
}

const featuresByDisease: Record<string, Feature[]> = {
  'heart-disease': [
    { name: 'Age', importance: 92, impact: 'negative', description: 'Higher age increases cardiovascular risk significantly' },
    { name: 'Chest Pain Type', importance: 88, impact: 'negative', description: 'Typical angina strongly indicates heart disease' },
    { name: 'Max Heart Rate', importance: 85, impact: 'positive', description: 'Higher exercise heart rate indicates better cardiac function' },
    { name: 'ST Depression', importance: 82, impact: 'negative', description: 'ST segment depression indicates ischemia' },
    { name: 'Cholesterol', importance: 78, impact: 'negative', description: 'High cholesterol contributes to arterial blockage' },
  ],
  'diabetes': [
    { name: 'Glucose Level', importance: 95, impact: 'negative', description: 'Elevated blood glucose is the primary diabetes indicator' },
    { name: 'BMI', importance: 89, impact: 'negative', description: 'Higher BMI strongly correlates with Type 2 diabetes' },
    { name: 'Age', importance: 84, impact: 'negative', description: 'Diabetes risk increases with age' },
    { name: 'Blood Pressure', importance: 76, impact: 'negative', description: 'Hypertension often accompanies diabetes' },
    { name: 'Insulin Level', importance: 72, impact: 'neutral', description: 'Indicates pancreatic function and insulin resistance' },
  ],
  'parkinsons': [
    { name: 'MDVP:Fo(Hz)', importance: 94, impact: 'negative', description: 'Average vocal frequency changes indicate motor impairment' },
    { name: 'MDVP:Jitter(%)', importance: 91, impact: 'negative', description: 'Voice jitter measures vocal fold regularity' },
    { name: 'MDVP:Shimmer', importance: 87, impact: 'negative', description: 'Amplitude variation indicates vocal instability' },
    { name: 'HNR', importance: 83, impact: 'positive', description: 'Harmonics-to-noise ratio reflects voice quality' },
    { name: 'RPDE', importance: 79, impact: 'negative', description: 'Recurrence period density entropy measures complexity' },
  ],
  'hypertension': [
    { name: 'Systolic BP', importance: 96, impact: 'negative', description: 'Primary indicator of hypertension severity' },
    { name: 'Diastolic BP', importance: 91, impact: 'negative', description: 'Elevated diastolic pressure indicates persistent hypertension' },
    { name: 'Age', importance: 86, impact: 'negative', description: 'Blood pressure typically increases with age' },
    { name: 'BMI', importance: 81, impact: 'negative', description: 'Obesity contributes to elevated blood pressure' },
    { name: 'Salt Intake', importance: 74, impact: 'negative', description: 'High sodium intake elevates blood pressure' },
  ],
};

const diseaseNames: Record<string, string> = {
  'heart-disease': 'Heart Disease',
  'diabetes': 'Diabetes',
  'parkinsons': "Parkinson's Disease",
  'hypertension': 'Hypertension',
};

export default function FeatureImportance({ diseaseType }: FeatureImportanceProps) {
  const features = featuresByDisease[diseaseType] || featuresByDisease['heart-disease'];
  const diseaseName = diseaseNames[diseaseType] || 'Disease';

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'bg-green-100 text-green-700';
      case 'negative':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Feature Importance - {diseaseName}
        </CardTitle>
        <CardDescription>
          Illustrative feature examples; no trained-model explanation is connected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            Values and descriptions below are illustrative only. They are not produced by SHAP
            or by the current prediction service.
          </p>
        </div>
        {features.map((feature, index) => (
          <div key={feature.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="font-medium text-foreground">{feature.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getImpactColor(feature.impact)}`}>
                  {getImpactIcon(feature.impact)}
                  {feature.impact}
                </span>
                <span className="font-semibold text-foreground">{feature.importance}%</span>
              </div>
            </div>
            <Progress value={feature.importance} className="h-2" />
            <p className="text-xs text-muted-foreground pl-9">{feature.description}</p>
          </div>
        ))}

<div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 text-sm">Illustrative Demo Note</h4>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            These example values are static UI content. They do not explain this prediction or
            represent a SHAP analysis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
