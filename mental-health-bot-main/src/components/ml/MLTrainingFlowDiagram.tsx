import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Settings, Brain, BarChart2, Activity, ArrowRight } from 'lucide-react';

const flowSteps = [
  {
    icon: Database,
    title: 'Dataset',
    description: 'Raw medical data collection',
    details: ['Heart Disease UCI', 'Pima Indians Diabetes', "Parkinson's Voice"],
    color: 'bg-blue-500',
  },
  {
    icon: Settings,
    title: 'Preprocessing',
    description: 'Data cleaning & transformation',
    details: ['Handle missing values', 'Feature scaling', 'Encoding'],
    color: 'bg-purple-500',
  },
  {
    icon: Brain,
    title: 'Training',
    description: 'Model learning from data',
    details: ['Fit on training split', 'Select by validation ROC-AUC', 'No cross-validation or grid search'],
    color: 'bg-amber-500',
  },
  {
    icon: BarChart2,
    title: 'Evaluation',
    description: 'Performance assessment',
    details: ['Accuracy & F1-Score', 'Confusion matrix', 'ROC-AUC analysis'],
    color: 'bg-green-500',
  },
  {
    icon: Activity,
    title: 'Prediction',
    description: 'Offline research output',
    details: ['Evaluation artifacts', 'No trained model served by the app', 'Not connected to frontend predictions'],
    color: 'bg-red-500',
  },
];

export default function MLTrainingFlowDiagram() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          ML Training Pipeline Flow
        </CardTitle>
        <CardDescription>
          End-to-end machine learning workflow for disease prediction
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop Flow */}
        <div className="hidden md:flex items-center justify-between gap-2 mb-8">
          {flowSteps.map((step, index) => (
            <div key={step.title} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-xl ${step.color} text-white flex items-center justify-center shadow-lg`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <span className="mt-2 font-semibold text-foreground text-sm">{step.title}</span>
              </div>
              {index < flowSteps.length - 1 && (
                <ArrowRight className="w-6 h-6 text-muted-foreground mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Mobile Flow */}
        <div className="md:hidden space-y-4 mb-8">
          {flowSteps.map((step, index) => (
            <div key={step.title} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg ${step.color} text-white flex items-center justify-center shadow-md flex-shrink-0`}>
                <step.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-foreground">{step.title}</span>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < flowSteps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90 md:rotate-0" />
              )}
            </div>
          ))}
        </div>

        {/* Detailed Steps */}
        <div className="grid md:grid-cols-5 gap-4">
          {flowSteps.map((step) => (
            <div key={step.title} className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <h4 className="font-semibold text-foreground text-sm mb-2">{step.title}</h4>
              <p className="text-xs text-muted-foreground mb-3">{step.description}</p>
              <ul className="space-y-1">
                {step.details.map((detail) => (
                  <li key={detail} className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Visual Diagram */}
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-border/50">
          <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{`
┌──────────────┐    ┌───────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   DATASET    │───▶│ PREPROCESSING │───▶│   TRAINING   │───▶│ EVALUATION  │───▶│ PREDICTION  │
│              │    │               │    │              │    │             │    │             │
│ • UCI Heart  │    │ • Cleaning    │    │ • LR/RF/XGB/NN│   │ • Accuracy  │    │ • artifacts │
│ • Pima DM    │    │ • Scaling     │    │ • Train split│    │ • Precision │    │ • Offline   │
│ • Parkinson  │    │ • Encoding    │    │ • Validation │    │ • ROC-AUC   │    │ • No serving│
└──────────────┘    └───────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
