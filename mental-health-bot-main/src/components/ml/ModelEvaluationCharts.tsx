import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Activity, AlertTriangle, Grid3X3 } from 'lucide-react';

interface ModelEvaluationChartsProps {
  diseaseType: string;
}

// Confusion matrix TN, FP, FN, TP for the selected (best) model per disease
const confusionMatrices: Record<string, { tn: number; fp: number; fn: number; tp: number }> = {
  'heart-disease': { tn: 32, fp: 3, fn: 4, tp: 39 },
  'diabetes': { tn: 58, fp: 4, fn: 5, tp: 61 },
  'parkinsons': { tn: 18, fp: 1, fn: 1, tp: 24 },
  'hypertension': { tn: 45, fp: 5, fn: 6, tp: 52 },
};

// ROC curve points (FPR -> TPR) for the selected model per disease
const rocCurves: Record<string, { fpr: number; tpr: number }[]> = {
  'heart-disease': [
    { fpr: 0, tpr: 0 }, { fpr: 0.05, tpr: 0.55 }, { fpr: 0.1, tpr: 0.72 },
    { fpr: 0.2, tpr: 0.85 }, { fpr: 0.3, tpr: 0.92 }, { fpr: 0.5, tpr: 0.97 },
    { fpr: 0.7, tpr: 0.99 }, { fpr: 1, tpr: 1 },
  ],
  'diabetes': [
    { fpr: 0, tpr: 0 }, { fpr: 0.04, tpr: 0.6 }, { fpr: 0.1, tpr: 0.78 },
    { fpr: 0.2, tpr: 0.9 }, { fpr: 0.35, tpr: 0.96 }, { fpr: 0.6, tpr: 0.99 },
    { fpr: 1, tpr: 1 },
  ],
  'parkinsons': [
    { fpr: 0, tpr: 0 }, { fpr: 0.03, tpr: 0.65 }, { fpr: 0.08, tpr: 0.82 },
    { fpr: 0.15, tpr: 0.92 }, { fpr: 0.3, tpr: 0.97 }, { fpr: 0.5, tpr: 0.99 },
    { fpr: 1, tpr: 1 },
  ],
  'hypertension': [
    { fpr: 0, tpr: 0 }, { fpr: 0.06, tpr: 0.52 }, { fpr: 0.12, tpr: 0.7 },
    { fpr: 0.22, tpr: 0.84 }, { fpr: 0.4, tpr: 0.93 }, { fpr: 0.6, tpr: 0.98 },
    { fpr: 1, tpr: 1 },
  ],
};

const diseaseNames: Record<string, string> = {
  'heart-disease': 'Heart Disease',
  'diabetes': 'Diabetes',
  'parkinsons': "Parkinson's Disease",
  'hypertension': 'Hypertension',
};

const diseaseAuc: Record<string, number> = {
  'heart-disease': 0.96,
  'diabetes': 0.97,
  'parkinsons': 0.98,
  'hypertension': 0.95,
};

export default function ModelEvaluationCharts({ diseaseType }: ModelEvaluationChartsProps) {
  const cm = confusionMatrices[diseaseType] || confusionMatrices['heart-disease'];
  const roc = rocCurves[diseaseType] || rocCurves['heart-disease'];
  const auc = diseaseAuc[diseaseType] || 0.96;
  const diseaseName = diseaseNames[diseaseType] || 'Disease';

  // Build confusion matrix data for heatmap rendering
  const cmData = [
    { label: 'TN', value: cm.tn, color: '#10b981' },
    { label: 'FP', value: cm.fp, color: '#f59e0b' },
    { label: 'FN', value: cm.fn, color: '#f59e0b' },
    { label: 'TP', value: cm.tp, color: '#10b981' },
  ];

  // ROC with random baseline
  const rocData = [
    ...roc.map(p => ({ ...p, random: p.fpr })),
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Model Evaluation Charts - {diseaseName}
        </CardTitle>
        <CardDescription>
          Illustrative confusion matrix and ROC curve; not connected to training results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            The values and curves below are illustrative demo data, not measured model
            evaluation results.
          </p>
        </div>
        {/* Confusion Matrix Heatmap */}
        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-primary" />
            Confusion Matrix
          </h4>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 text-center">
              <p className="text-2xl font-bold text-green-600">{cm.tn}</p>
              <p className="text-xs text-muted-foreground">True Negative</p>
            </div>
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-center">
              <p className="text-2xl font-bold text-amber-600">{cm.fp}</p>
              <p className="text-xs text-muted-foreground">False Positive</p>
            </div>
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-center">
              <p className="text-2xl font-bold text-amber-600">{cm.fn}</p>
              <p className="text-xs text-muted-foreground">False Negative</p>
            </div>
            <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 text-center">
              <p className="text-2xl font-bold text-green-600">{cm.tp}</p>
              <p className="text-xs text-muted-foreground">True Positive</p>
            </div>
          </div>

          {/* Bar chart of the 2x2 matrix */}
          <div className="mt-4 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cmData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="label" width={40} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {cmData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROC Curve */}
        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            ROC Curve (AUC = {auc.toFixed(3)})
          </h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="fpr" type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(2)} />
                <YAxis type="number" domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="random" name="Random" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="tpr" name={`Model (AUC ${auc.toFixed(2)})`} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            The training pipeline does not currently feed evaluation results into this chart.
            Generate and review actual model artifacts before interpreting any performance metric.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
