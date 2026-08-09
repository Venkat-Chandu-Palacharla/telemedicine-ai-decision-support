import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Users, Database, Stethoscope, Scale, Rocket, Lightbulb, Server } from 'lucide-react';

const ethicsPoints = [
  {
    icon: Stethoscope,
    title: 'Not a Replacement for Doctors',
    description: 'This AI system is designed to assist, not replace, medical professionals. All predictions should be reviewed by qualified healthcare providers before any clinical decisions are made.',
    type: 'warning',
  },
  {
    icon: Database,
    title: 'Dataset Bias Considerations',
    description: 'Training datasets may not fully represent all demographic groups. Model performance may vary across different populations, age groups, and geographic regions.',
    type: 'warning',
  },
  {
    icon: Shield,
    title: 'Clinical Validation Required',
    description: 'These predictions require rigorous clinical trials and validation before deployment in real healthcare settings. Current results are for research and educational purposes.',
    type: 'info',
  },
  {
    icon: Users,
    title: 'Patient Privacy',
    description: 'All patient data is handled in compliance with healthcare privacy regulations. Data is encrypted and anonymized to protect patient confidentiality.',
    type: 'success',
  },
  {
    icon: Scale,
    title: 'Fairness & Equity',
    description: 'We continuously monitor for algorithmic bias and work to ensure equitable predictions across all patient demographics and socioeconomic backgrounds.',
    type: 'info',
  },
  {
    icon: AlertTriangle,
    title: 'Uncertainty Communication',
    description: 'Confidence scores are provided with every prediction to communicate uncertainty. Low confidence predictions should be treated with additional caution.',
    type: 'warning',
  },
];

const limitations = [
  'Model accuracy depends on quality and completeness of input data',
  'Cannot account for all individual health factors and medical history',
  'Performance may degrade with data significantly different from training set',
  'Does not consider genetic factors, lifestyle habits, or environmental conditions',
  'Cannot detect conditions outside the trained disease categories',
  'Requires regular retraining to maintain accuracy with evolving medical knowledge',
];

export default function EthicsAndLimitations() {
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900';
      case 'success':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900';
      default:
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Ethics & Responsible AI
        </CardTitle>
        <CardDescription>
          Commitment to ethical AI practices and transparent limitations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ethics Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {ethicsPoints.map((point) => (
            <div
              key={point.title}
              className={`p-4 rounded-lg border ${getTypeStyles(point.type)}`}
            >
              <div className="flex items-start gap-3">
                <point.icon className={`w-5 h-5 mt-0.5 ${getIconColor(point.type)}`} />
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">{point.title}</h4>
                  <p className="text-xs text-muted-foreground">{point.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Limitations Section */}
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
          <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Known Limitations
          </h4>
          <ul className="space-y-2">
            {limitations.map((limitation, index) => (
              <li key={index} className="text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                {limitation}
              </li>
            ))}
          </ul>
        </div>

        {/* Project Disclaimer - Prominent */}
        <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-primary mb-1">Important Project Disclaimer</h4>
              <p className="text-sm text-foreground">
                This system is a <strong>decision-support tool</strong> and is <strong>not a substitute for professional medical diagnosis</strong>. 
                All predictions should be verified by qualified healthcare professionals before any clinical decisions are made.
              </p>
            </div>
          </div>
        </div>

        {/* API Flow Description */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Server className="w-4 h-4" />
            API Flow Architecture
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">Frontend UI</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium">Backend API</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium">Trained ML Model</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium">Risk Prediction</span>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            User inputs are validated on the frontend, processed through secure backend APIs, analyzed by trained ML models, and returned as actionable risk predictions.
          </p>
        </div>

        {/* Future Enhancements */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-primary" />
            Future Enhancements
          </h4>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-foreground">Larger Clinical Datasets</span>
                <p className="text-xs text-muted-foreground">Integration with hospital EHR systems for diverse, real-world patient data</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-foreground">Deep Learning Models</span>
                <p className="text-xs text-muted-foreground">Neural networks for complex pattern recognition and improved accuracy</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-foreground">Hospital Integration</span>
                <p className="text-xs text-muted-foreground">Direct API connections with healthcare systems for seamless workflow</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-foreground">Advanced XAI</span>
                <p className="text-xs text-muted-foreground">SHAP visualizations and LIME explanations for individual predictions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Standard Disclaimer */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Disclaimer:</strong> This AI-powered health prediction system is intended for 
            informational and educational purposes only. It does not constitute medical advice, 
            diagnosis, or treatment. Always consult with qualified healthcare professionals for 
            medical decisions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
