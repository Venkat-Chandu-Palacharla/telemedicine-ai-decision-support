import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Activity, Heart, Thermometer, Wind, Play, Pause } from 'lucide-react';
import { VitalSigns } from '@/types/telemedicine';

interface HealthMonitoringProps {
  onBack: () => void;
}

export default function HealthMonitoring({ onBack }: HealthMonitoringProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [vitals, setVitals] = useState<VitalSigns>({
    heartRate: 72,
    spo2: 98,
    temperature: 36.6,
    bloodPressure: { systolic: 120, diastolic: 80 },
    timestamp: new Date()
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring) {
      interval = setInterval(() => {
        setVitals({
          heartRate: Math.floor(70 + Math.random() * 15),
          spo2: Math.floor(96 + Math.random() * 4),
          temperature: parseFloat((36.3 + Math.random() * 0.8).toFixed(1)),
          bloodPressure: {
            systolic: Math.floor(115 + Math.random() * 15),
            diastolic: Math.floor(75 + Math.random() * 10)
          },
          timestamp: new Date()
        });
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  const vitalCards = [
    {
      title: 'Heart Rate',
      value: vitals.heartRate,
      unit: 'BPM',
      icon: Heart,
      color: 'bg-rose-100 text-rose-600',
      bgGradient: 'from-rose-500/10 to-rose-500/5',
      normal: vitals.heartRate >= 60 && vitals.heartRate <= 100
    },
    {
      title: 'SpO₂',
      value: vitals.spo2,
      unit: '%',
      icon: Wind,
      color: 'bg-blue-100 text-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-500/5',
      normal: vitals.spo2 >= 95
    },
    {
      title: 'Temperature',
      value: vitals.temperature,
      unit: '°C',
      icon: Thermometer,
      color: 'bg-amber-100 text-amber-600',
      bgGradient: 'from-amber-500/10 to-amber-500/5',
      normal: vitals.temperature >= 36.1 && vitals.temperature <= 37.2
    },
    {
      title: 'Blood Pressure',
      value: `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`,
      unit: 'mmHg',
      icon: Activity,
      color: 'bg-purple-100 text-purple-600',
      bgGradient: 'from-purple-500/10 to-purple-500/5',
      normal: vitals.bloodPressure.systolic < 140 && vitals.bloodPressure.diastolic < 90
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Health Monitoring</h1>
            <p className="text-muted-foreground">Real-time vital signs tracking (Simulated)</p>
          </div>
        </div>
        <Button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={isMonitoring ? 'bg-red-500 hover:bg-red-600' : 'gradient-primary'}
        >
          {isMonitoring ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Stop Monitoring
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Monitoring
            </>
          )}
        </Button>
      </div>

      {isMonitoring && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-green-700 dark:text-green-300">
            Live monitoring active • Last update: {vitals.timestamp.toLocaleTimeString()}
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {vitalCards.map((vital) => (
          <Card 
            key={vital.title}
            className={`bg-gradient-to-br ${vital.bgGradient} border-border/50 ${
              isMonitoring ? 'transition-all duration-500' : ''
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${vital.color} flex items-center justify-center`}>
                  <vital.icon className="w-5 h-5" />
                </div>
                {!vital.normal && isMonitoring && (
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-600">
                    Attention
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground">{vital.title}</CardDescription>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-4xl font-bold ${vital.normal ? 'text-foreground' : 'text-amber-600'}`}>
                  {vital.value}
                </span>
                <span className="text-lg text-muted-foreground">{vital.unit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About This Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This health monitoring feature simulates real-time vital sign tracking. In a production 
            environment, this would connect to actual medical devices and IoT sensors to provide 
            accurate health data. The simulated values update every 2 seconds when monitoring is active.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-foreground">Normal Heart Rate</p>
              <p className="text-muted-foreground">60-100 BPM</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-foreground">Normal SpO₂</p>
              <p className="text-muted-foreground">95-100%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-foreground">Normal Temperature</p>
              <p className="text-muted-foreground">36.1-37.2°C</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-foreground">Normal BP</p>
              <p className="text-muted-foreground">&lt;140/90 mmHg</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
