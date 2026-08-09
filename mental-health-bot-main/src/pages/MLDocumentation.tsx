import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Brain, BarChart3, GitBranch, Shield, Database, Activity, Scale, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModelComparisonTable from '@/components/ml/ModelComparisonTable';
import FeatureImportance from '@/components/ml/FeatureImportance';
import MLTrainingFlowDiagram from '@/components/ml/MLTrainingFlowDiagram';
import EthicsAndLimitations from '@/components/ml/EthicsAndLimitations';
import DatasetJustification from '@/components/ml/DatasetJustification';
import ModelEvaluationCharts from '@/components/ml/ModelEvaluationCharts';
import ClassImbalance from '@/components/ml/ClassImbalance';

const diseases = [
  { id: 'heart-disease', name: 'Heart Disease', icon: '❤️' },
  { id: 'diabetes', name: 'Diabetes', icon: '🩸' },
  { id: 'parkinsons', name: "Parkinson's", icon: '🧠' },
  { id: 'hypertension', name: 'Hypertension', icon: '💓' },
];

export default function MLDocumentation() {
  const navigate = useNavigate();
  const [selectedDisease, setSelectedDisease] = useState('heart-disease');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Project Disclaimer Banner */}
        <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200 text-center font-medium">
            ⚠️ This system is a <strong>decision-support tool</strong> and is <strong>not a substitute for professional medical diagnosis</strong>.
          </p>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">ML System Documentation</h1>
            <p className="text-muted-foreground">Model comparisons, explainability, and ethical considerations</p>
          </div>
        </div>

        {/* Disease Selector */}
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">Select Disease for Analysis</label>
          <div className="flex flex-wrap gap-2">
            {diseases.map((disease) => (
              <Button
                key={disease.id}
                variant={selectedDisease === disease.id ? 'default' : 'outline'}
                onClick={() => setSelectedDisease(disease.id)}
                className="gap-2"
              >
                <span>{disease.icon}</span>
                {disease.name}
              </Button>
            ))}
          </div>
        </div>

{/* Main Content Tabs */}
        <Tabs defaultValue="comparison" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 gap-2 h-auto p-1">
            <TabsTrigger value="comparison" className="gap-2 py-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Model Comparison</span>
              <span className="sm:hidden">Compare</span>
            </TabsTrigger>
            <TabsTrigger value="explainability" className="gap-2 py-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Explainability</span>
              <span className="sm:hidden">XAI</span>
            </TabsTrigger>
            <TabsTrigger value="flow" className="gap-2 py-2">
              <GitBranch className="w-4 h-4" />
              <span className="hidden sm:inline">Training Flow</span>
              <span className="sm:hidden">Flow</span>
            </TabsTrigger>
            <TabsTrigger value="datasets" className="gap-2 py-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Datasets</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="gap-2 py-2">
              <LineChart className="w-4 h-4" />
              <span className="hidden sm:inline">Evaluation</span>
              <span className="sm:hidden">Eval</span>
            </TabsTrigger>
            <TabsTrigger value="imbalance" className="gap-2 py-2">
              <Scale className="w-4 h-4" />
              <span className="hidden sm:inline">Class Balance</span>
              <span className="sm:hidden">Balance</span>
            </TabsTrigger>
            <TabsTrigger value="ethics" className="gap-2 py-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Ethics</span>
              <span className="sm:hidden">Ethics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-6">
            <ModelComparisonTable diseaseType={selectedDisease} />
          </TabsContent>

          <TabsContent value="explainability" className="space-y-6">
            <FeatureImportance diseaseType={selectedDisease} />
          </TabsContent>

          <TabsContent value="flow" className="space-y-6">
            <MLTrainingFlowDiagram />
          </TabsContent>

          <TabsContent value="datasets" className="space-y-6">
            <DatasetJustification />
          </TabsContent>

          <TabsContent value="evaluation" className="space-y-6">
            <ModelEvaluationCharts diseaseType={selectedDisease} />
          </TabsContent>

          <TabsContent value="imbalance" className="space-y-6">
            <ClassImbalance diseaseType={selectedDisease} />
          </TabsContent>

          <TabsContent value="ethics" className="space-y-6">
            <EthicsAndLimitations />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
