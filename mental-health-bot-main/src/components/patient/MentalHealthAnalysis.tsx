import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Heart, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

// Decision-support disclaimer shown with every result
const DECISION_SUPPORT_DISCLAIMER =
  'This mental-health assessment is a supportive decision-support estimate, not a diagnosis or a substitute for professional care. If you are in distress, please reach out to a qualified professional or a local crisis helpline.';
import { MentalHealthInput, MentalHealthResult } from '@/types/telemedicine';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MentalHealthAnalysisProps {
  onBack: () => void;
}

export default function MentalHealthAnalysis({ onBack }: MentalHealthAnalysisProps) {
  const [input, setInput] = useState<MentalHealthInput>({
    stressLevel: 5,
    anxietyLevel: 5,
    sleepHours: 7,
    moodRating: 5,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MentalHealthResult | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('mental-health-analysis', {
        body: { input }
      });

      if (error) throw error;

      setResult(data);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Unable to complete mental health analysis. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Good': return 'text-green-600 bg-green-100';
      case 'Moderate Concern': return 'text-amber-600 bg-amber-100';
      case 'High Concern': return 'text-red-600 bg-red-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Good': return <CheckCircle2 className="w-6 h-6" />;
      case 'Moderate Concern': return <Info className="w-6 h-6" />;
      case 'High Concern': return <AlertTriangle className="w-6 h-6" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
          <Heart className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mental Health Check</h1>
          <p className="text-muted-foreground">AI-powered mental wellness assessment</p>
        </div>
      </div>

      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle>How are you feeling today?</CardTitle>
            <CardDescription>
              Rate the following aspects of your mental health for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Stress Level</Label>
                <span className="text-sm font-medium text-primary">{input.stressLevel}/10</span>
              </div>
              <Slider
                value={[input.stressLevel]}
                onValueChange={([value]) => setInput({ ...input, stressLevel: value })}
                max={10}
                min={1}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Very Low</span>
                <span>Very High</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Anxiety Level</Label>
                <span className="text-sm font-medium text-primary">{input.anxietyLevel}/10</span>
              </div>
              <Slider
                value={[input.anxietyLevel]}
                onValueChange={([value]) => setInput({ ...input, anxietyLevel: value })}
                max={10}
                min={1}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Very Low</span>
                <span>Very High</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Sleep Hours (last night)</Label>
                <span className="text-sm font-medium text-primary">{input.sleepHours} hours</span>
              </div>
              <Slider
                value={[input.sleepHours]}
                onValueChange={([value]) => setInput({ ...input, sleepHours: value })}
                max={12}
                min={1}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 hour</span>
                <span>12 hours</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Overall Mood Rating</Label>
                <span className="text-sm font-medium text-primary">{input.moodRating}/10</span>
              </div>
              <Slider
                value={[input.moodRating]}
                onValueChange={([value]) => setInput({ ...input, moodRating: value })}
                max={10}
                min={1}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Very Low</span>
                <span>Excellent</span>
              </div>
            </div>

            <Button 
              className="w-full gradient-primary text-white border-0"
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Get AI Analysis
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
                <CardTitle>Mental Health Status</CardTitle>
                <span className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 ${getStatusColor(result.status)}`}>
                  {getStatusIcon(result.status)}
                  {result.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Wellness Score</span>
                <span className="text-3xl font-bold text-foreground">{result.score}/100</span>
              </div>
            </CardContent>
          </Card>

          {result.insights && result.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

<Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
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

          {/* Decision-support disclaimer */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-500">{DECISION_SUPPORT_DISCLAIMER}</p>
            </div>
          </div>

          <Button variant="outline" onClick={() => setResult(null)} className="w-full">
            Take Assessment Again
          </Button>
        </div>
      )}
    </div>
  );
}
