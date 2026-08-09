import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Heart, Droplets, Brain, FileText, CheckCircle2, ExternalLink, Activity } from 'lucide-react';

interface DatasetInfo {
  id: string;
  name: string;
  source: string;
  records: number;
  features: number;
  icon: React.ReactNode;
  color: string;
  justification: string;
  keyFeatures: string[];
  clinicalRelevance: string;
}

const datasets: DatasetInfo[] = [
  {
    id: 'heart-disease',
    name: 'Cleveland Heart Disease Dataset',
    source: 'UCI Machine Learning Repository',
    records: 303,
    features: 14,
    icon: <Heart className="w-5 h-5" />,
    color: 'text-red-500 bg-red-100',
    justification: 'The Cleveland Heart Disease dataset is a gold standard in medical ML research. It contains real patient data from the Cleveland Clinic Foundation, making it highly relevant for cardiovascular risk prediction.',
    keyFeatures: ['Age', 'Sex', 'Chest Pain Type', 'Resting BP', 'Cholesterol', 'Max Heart Rate', 'ST Depression'],
    clinicalRelevance: 'Heart disease is the leading cause of death globally. Early prediction can save lives through preventive interventions and lifestyle modifications.',
  },
  {
    id: 'diabetes',
    name: 'Pima Indians Diabetes Dataset',
    source: 'National Institute of Diabetes (NIDDK)',
    records: 768,
    features: 9,
    icon: <Droplets className="w-5 h-5" />,
    color: 'text-blue-500 bg-blue-100',
    justification: 'The Pima Indians Diabetes dataset from NIDDK focuses on females of Pima Indian heritage, providing crucial data for Type 2 diabetes prediction. Its widespread use enables benchmark comparisons.',
    keyFeatures: ['Pregnancies', 'Glucose', 'Blood Pressure', 'Skin Thickness', 'Insulin', 'BMI', 'Age'],
    clinicalRelevance: 'Diabetes affects 537 million adults worldwide. Early detection enables lifestyle interventions that can prevent or delay disease progression.',
  },
{
    id: 'parkinsons',
    name: "Oxford Parkinson's Disease Dataset",
    source: 'UCI ML Repository (Oxford)',
    records: 195,
    features: 23,
    icon: <Brain className="w-5 h-5" />,
    color: 'text-purple-500 bg-purple-100',
    justification: "This dataset contains biomedical voice measurements from patients with and without Parkinson's. Voice analysis is non-invasive and can detect early motor symptoms before clinical manifestation.",
    keyFeatures: ['MDVP:Fo(Hz)', 'MDVP:Jitter(%)', 'MDVP:Shimmer', 'HNR', 'RPDE', 'DFA', 'Spread1'],
    clinicalRelevance: "Parkinson's affects 10 million people globally. Early detection through voice analysis enables earlier treatment initiation and better quality of life outcomes.",
  },
  {
    id: 'hypertension',
    name: 'Framingham Heart Study (Cardiovascular Disease)',
    source: 'Kaggle — framingham-heart-study-dataset',
    records: 4240,
    features: 15,
    icon: <Activity className="w-5 h-5" />,
    color: 'text-rose-500 bg-rose-100',
    justification: 'Derived from the Framingham Heart Study, this widely cited public dataset provides longitudinal cardiovascular risk indicators (blood pressure, cholesterol, glucose, BMI, age) for 10-year coronary heart disease risk prediction.',
    keyFeatures: ['Systolic BP (sysBP)', 'Diastolic BP (diaBP)', 'Age', 'Total Cholesterol', 'BMI', 'Glucose', 'Heart Rate'],
    clinicalRelevance: 'Hypertension is a leading modifiable risk factor for cardiovascular disease. Predicting CHD risk supports early preventive interventions and lifestyle modifications.',
  },
];

export default function DatasetJustification() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Dataset Justification & Domain Understanding
        </CardTitle>
        <CardDescription>
          Rationale for selecting each medical dataset for disease prediction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dataset Summary Table */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Dataset Summary
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold text-foreground">Disease</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">Dataset Name</th>
                  <th className="text-center py-2 px-3 font-semibold text-foreground">Samples</th>
                  <th className="text-center py-2 px-3 font-semibold text-foreground">Features</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">Source</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((dataset) => (
                  <tr key={dataset.id} className="border-b border-border/50">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded flex items-center justify-center ${dataset.color}`}>
                          {dataset.icon}
                        </span>
{dataset.id === 'heart-disease' && 'Heart Disease'}
                        {dataset.id === 'diabetes' && 'Diabetes'}
                        {dataset.id === 'parkinsons' && "Parkinson's"}
                        {dataset.id === 'hypertension' && 'Hypertension'}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{dataset.name}</td>
                    <td className="py-2 px-3 text-center font-medium">{dataset.records}</td>
                    <td className="py-2 px-3 text-center font-medium">{dataset.features}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">{dataset.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {datasets.map((dataset) => (
          <div key={dataset.id} className="p-4 rounded-lg border border-border/50 bg-card">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${dataset.color} flex items-center justify-center`}>
                  {dataset.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{dataset.name}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {dataset.source}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{dataset.records} samples</Badge>
                <Badge variant="outline">{dataset.features} features</Badge>
              </div>
            </div>

            {/* Justification */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-foreground mb-2">Why This Dataset?</h5>
              <p className="text-sm text-muted-foreground">{dataset.justification}</p>
            </div>

            {/* Key Features */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-foreground mb-2">Key Features Used</h5>
              <div className="flex flex-wrap gap-2">
                {dataset.keyFeatures.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clinical Relevance */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-primary mb-1">Clinical Relevance</h5>
                  <p className="text-xs text-muted-foreground">{dataset.clinicalRelevance}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Data Preprocessing Pipeline */}
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600" />
            Data Preprocessing Pipeline
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-foreground mb-1">1. Cleaning</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Remove duplicate / invalid records</li>
                <li>• Drop constant or highly-correlated columns</li>
                <li>• Handle outliers with domain-aware bounds</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-1">2. Missing Values</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Median imputation for numeric features</li>
                <li>• Mode imputation for categorical features</li>
                <li>• Documented to avoid data leakage</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-1">3. Encoding & Scaling</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• StandardScaler for numeric normalization</li>
                <li>• One-hot / label encoding for categoricals</li>
                <li>• Fit scaler on training set only</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-1">4. Class Balancing + Splitting</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• SMOTE oversampling on training set</li>
                <li>• 70 / 15 / 15 train-val-test split</li>
                <li>• Stratified to preserve class proportions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dataset Selection Criteria */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Dataset Selection Criteria
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-foreground mb-1">Quality Requirements</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Peer-reviewed and widely cited sources</li>
                <li>• Sufficient sample size for ML training</li>
                <li>• Well-documented feature descriptions</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-1">Clinical Requirements</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• High disease prevalence and mortality</li>
                <li>• Benefit from early detection</li>
                <li>• Actionable intervention opportunities</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
