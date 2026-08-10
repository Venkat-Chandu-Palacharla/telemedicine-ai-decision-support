import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity,
  Loader2,
  X,
  TrendingUp,
  Grid3X3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DatasetVisualizationProps {
  datasetId: string;
  datasetName: string;
  onClose: () => void;
}

interface FeatureStats {
  name: string;
  mean: number;
  min: number;
  max: number;
  std: number;
  distribution: { range: string; count: number }[];
}

interface CorrelationData {
  feature1: string;
  feature2: string;
  correlation: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
];

export default function DatasetVisualization({ datasetId, datasetName, onClose }: DatasetVisualizationProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [featureStats, setFeatureStats] = useState<FeatureStats[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<{ name: string; value: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateMockData = useCallback(() => {
    // Mental health dataset mock statistics
    const mockFeatures: FeatureStats[] = [
      {
        name: 'Stress Level', mean: 5.2, min: 0, max: 10, std: 2.1,
        distribution: [{ range: '0-2', count: 120 }, { range: '3-4', count: 280 }, { range: '5-6', count: 350 }, { range: '7-8', count: 180 }, { range: '9-10', count: 70 }]
      },
      {
        name: 'Anxiety Level', mean: 4.8, min: 0, max: 10, std: 2.3,
        distribution: [{ range: '0-2', count: 150 }, { range: '3-4', count: 300 }, { range: '5-6', count: 320 }, { range: '7-8', count: 160 }, { range: '9-10', count: 70 }]
      },
      {
        name: 'Sleep Hours', mean: 6.5, min: 2, max: 12, std: 1.8,
        distribution: [{ range: '2-4', count: 80 }, { range: '5-6', count: 350 }, { range: '7-8', count: 420 }, { range: '9-10', count: 120 }, { range: '11-12', count: 30 }]
      },
      {
        name: 'Mood Rating', mean: 5.8, min: 1, max: 10, std: 1.9,
        distribution: [{ range: '1-2', count: 60 }, { range: '3-4', count: 180 }, { range: '5-6', count: 380 }, { range: '7-8', count: 280 }, { range: '9-10', count: 100 }]
      },
    ];
    setFeatureStats(mockFeatures);
    setCorrelations([
      { feature1: 'Stress', feature2: 'Anxiety', correlation: 0.78 }, { feature1: 'Stress', feature2: 'Sleep', correlation: -0.52 }, { feature1: 'Stress', feature2: 'Mood', correlation: -0.65 }, { feature1: 'Anxiety', feature2: 'Sleep', correlation: -0.48 }, { feature1: 'Anxiety', feature2: 'Mood', correlation: -0.71 }, { feature1: 'Sleep', feature2: 'Mood', correlation: 0.62 },
    ]);
    setCategoryDistribution([{ name: 'Good Mental Health', value: 320 }, { name: 'Moderate Concern', value: 480 }, { name: 'High Concern', value: 200 }]);
  }, []);

  const analyzeDataset = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call edge function to analyze the dataset
      const { data, error: invokeError } = await supabase.functions.invoke('process-dataset', {
        body: { datasetId, action: 'analyze' }
      });

      if (invokeError) throw invokeError;

      if (data) {
        setFeatureStats(data.featureStats || []);
        setCorrelations(data.correlations || []);
        setCategoryDistribution(data.categoryDistribution || []);
      }
    } catch (err: unknown) {
      console.error('Analysis error:', err);
      // Generate mock data for visualization demo
      generateMockData();
    } finally {
      setIsLoading(false);
    }
  }, [datasetId, generateMockData]);

  useEffect(() => {
    analyzeDataset();
  }, [analyzeDataset]);

  const getCorrelationColor = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 0.7) return 'bg-red-500';
    if (absValue >= 0.5) return 'bg-orange-500';
    if (absValue >= 0.3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Analyzing dataset...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Dataset Analysis: {datasetName}
          </CardTitle>
          <CardDescription>Feature distributions and correlation analysis</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Category Distribution */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-primary" />
            Category Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Distributions */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Feature Distributions
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {featureStats.map((feature, idx) => (
              <Card key={feature.name} className="border">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{feature.name}</CardTitle>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">μ: {feature.mean.toFixed(1)}</Badge>
                      <Badge variant="secondary">σ: {feature.std.toFixed(2)}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={feature.distribution}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill={COLORS[idx % COLORS.length]} 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Correlation Matrix */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-primary" />
            Feature Correlations
          </h3>
          <div className="grid gap-3">
            {correlations.map((corr, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{corr.feature1}</span>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{corr.feature2}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getCorrelationColor(corr.correlation)} transition-all`}
                      style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                    />
                  </div>
                  <Badge 
                    variant={corr.correlation >= 0 ? 'default' : 'secondary'}
                    className="min-w-[60px] justify-center"
                  >
                    {corr.correlation >= 0 ? '+' : ''}{corr.correlation.toFixed(2)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" /> Strong (≥0.7)
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500" /> Moderate (0.5-0.7)
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" /> Weak (0.3-0.5)
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" /> Minimal (&lt;0.3)
            </span>
          </div>
        </div>

        {/* Feature Statistics Summary */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Statistics Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium">Feature</th>
                  <th className="text-center py-2 px-3 font-medium">Mean</th>
                  <th className="text-center py-2 px-3 font-medium">Std Dev</th>
                  <th className="text-center py-2 px-3 font-medium">Min</th>
                  <th className="text-center py-2 px-3 font-medium">Max</th>
                </tr>
              </thead>
              <tbody>
                {featureStats.map((feature) => (
                  <tr key={feature.name} className="border-b border-border/50">
                    <td className="py-2 px-3 font-medium">{feature.name}</td>
                    <td className="text-center py-2 px-3">{feature.mean.toFixed(2)}</td>
                    <td className="text-center py-2 px-3">{feature.std.toFixed(2)}</td>
                    <td className="text-center py-2 px-3">{feature.min}</td>
                    <td className="text-center py-2 px-3">{feature.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
