import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ImbalanceInfo {
  total: number;
  negative: number;
  positive: number;
  ratio: string;
  label: string;
}

const imbalanceData: Record<string, ImbalanceInfo> = {
  'heart-disease': {
    total: 303,
    negative: 164,
    positive: 139,
    ratio: '1.2:1',
    label: 'Mildly Imbalanced',
  },
  'diabetes': {
    total: 768,
    negative: 500,
    positive: 268,
    ratio: '1.9:1',
    label: 'Moderately Imbalanced',
  },
  'parkinsons': {
    total: 195,
    negative: 48,
    positive: 147,
    ratio: '3.1:1',
    label: 'Imbalanced',
  },
  'hypertension': {
    total: 720,
    negative: 440,
    positive: 280,
    ratio: '1.6:1',
    label: 'Moderately Imbalanced',
  },
};

const diseaseNames: Record<string, string> = {
  'heart-disease': 'Heart Disease',
  'diabetes': 'Diabetes',
  'parkinsons': "Parkinson's Disease",
  'hypertension': 'Hypertension',
};

export default function ClassImbalance({ diseaseType }: { diseaseType: string }) {
  const data = imbalanceData[diseaseType] || imbalanceData['heart-disease'];
  const diseaseName = diseaseNames[diseaseType] || 'Disease';

  const negPct = Math.round((data.negative / data.total) * 100);
  const posPct = Math.round((data.positive / data.total) * 100);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          Class Imbalance Handling - {diseaseName}
        </CardTitle>
        <CardDescription>
          How we mitigate skewed class distributions to avoid biased predictions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            The displayed class counts are illustrative examples, not verified counts from the
            datasets configured for this project.
          </p>
        </div>
        {/* Class distribution */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Original Class Distribution</span>
            <Badge variant="outline">{data.label}</Badge>
          </div>

          {/* Distribution bar */}
          <div className="flex h-6 rounded-lg overflow-hidden mb-2">
            <div
              className="bg-green-500/70 text-white text-xs flex items-center justify-center"
              style={{ width: `${negPct}%` }}
            >
              {negPct}% Negative
            </div>
            <div
              className="bg-red-500/70 text-white text-xs flex items-center justify-center"
              style={{ width: `${posPct}%` }}
            >
              {posPct}% Positive
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xl font-bold text-foreground">{data.total}</p>
              <p className="text-xs text-muted-foreground">Total Samples</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
              <p className="text-xl font-bold text-green-600">{data.negative}</p>
              <p className="text-xs text-muted-foreground">Negative (Healthy)</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
              <p className="text-xl font-bold text-red-600">{data.positive}</p>
              <p className="text-xs text-muted-foreground">Positive (At Risk)</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            Imbalance ratio: <span className="font-medium">{data.ratio}</span>
          </p>
        </div>

        {/* Mitigation strategies */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Mitigation Strategies Applied
          </h4>

          <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
            <p className="text-sm font-medium text-foreground mb-1">SMOTE (Synthetic Minority Oversampling)</p>
            <p className="text-xs text-muted-foreground">
              Applied on the <em>training set only</em> to generate synthetic samples of the minority class,
              balancing the distribution before model training.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
            <p className="text-sm font-medium text-foreground mb-1">Class-weighted loss / Balanced accuracy</p>
            <p className="text-xs text-muted-foreground">
              Models are evaluated using precision, recall, and balanced accuracy to ensure performance is not
              inflated by simply predicting the majority class.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
            <p className="text-sm font-medium text-foreground mb-1">Threshold tuning</p>
            <p className="text-xs text-muted-foreground">
              The decision threshold (default 0.5) can be tuned (e.g., using Youden's J) to optimize
              sensitivity vs. specificity depending on clinical priorities.
            </p>
          </div>
        </div>

        {/* Why it matters */}
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
          <h4 className="font-semibold text-amber-800 dark:text-amber-400 mb-2 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Why This Matters
          </h4>
          <p className="text-xs text-amber-700 dark:text-amber-500">
            In medical datasets, the disease cases (positives) are often a minority. Without mitigation,
            a model can achieve high accuracy by predicting "healthy" for everyone, while missing actual
            at-risk patients — a dangerous outcome. SMOTE and threshold tuning help the model learn the
            minority class without overfitting to it.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
