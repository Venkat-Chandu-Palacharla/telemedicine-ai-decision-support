import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Heart, 
  Brain, 
  Activity, 
  Video, 
  FileText, 
  Shield, 
  Stethoscope,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Disease Prediction',
    description: 'Advanced AI analyzes your health data to predict disease risks with high accuracy',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    icon: Heart,
    title: 'Mental Health Support',
    description: '24/7 AI chatbot and mental health assessments for emotional wellbeing',
    color: 'bg-rose-100 text-rose-600'
  },
  {
    icon: Activity,
    title: 'Health Monitoring',
    description: 'Real-time tracking of vital signs and health metrics',
    color: 'bg-teal-100 text-teal-600'
  },
  {
    icon: Video,
    title: 'Video Consultations',
    description: 'Connect with certified doctors from the comfort of your home',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    icon: FileText,
    title: 'Digital Reports',
    description: 'Generate comprehensive health reports and prescriptions instantly',
    color: 'bg-amber-100 text-amber-600'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your health data is protected with enterprise-grade security',
    color: 'bg-green-100 text-green-600'
  }
];

const benefits = [
  'Instant AI-powered health predictions',
  'Access to qualified healthcare professionals',
  '24/7 mental health support chatbot',
  'Comprehensive health reports',
  'Secure video consultations',
  'Easy appointment scheduling'
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">TeleMed AI</span>
          </div>
          <Link to="/login">
            <Button className="gradient-primary text-white border-0 shadow-soft">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              AI-Powered Healthcare Platform
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Your Health, Powered by{' '}
              <span className="text-gradient">Artificial Intelligence</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the future of healthcare with AI-driven disease predictions, 
              mental health support, and seamless doctor consultations—all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="gradient-primary text-white border-0 shadow-soft text-lg px-8">
                  Start Free Demo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comprehensive Healthcare Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for modern healthcare management, powered by cutting-edge AI technology
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-elevated transition-all duration-300 border-border/50 bg-card"
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Choose TeleMed AI?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform combines the latest advances in artificial intelligence with 
                healthcare expertise to provide you with accurate, accessible, and personalized 
                health insights.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl gradient-primary opacity-10 absolute inset-0" />
              <div className="relative bg-card rounded-2xl shadow-elevated p-8 border border-border">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/50">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">AI Analysis Complete</p>
                      <p className="text-sm text-muted-foreground">Risk Level: Low (12%)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/30">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Mental Health Status</p>
                      <p className="text-sm text-muted-foreground">Overall: Good</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Consultation Scheduled</p>
                      <p className="text-sm text-muted-foreground">Dr. Wilson - Tomorrow, 10 AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to Take Control of Your Health?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of users who trust TeleMed AI for their healthcare needs. 
              Start your free demo today and experience the future of telemedicine.
            </p>
            <Link to="/login">
              <Button size="lg" className="gradient-primary text-white border-0 shadow-soft text-lg px-8">
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">TeleMed AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 TeleMed AI. All rights reserved. Demo Version.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
