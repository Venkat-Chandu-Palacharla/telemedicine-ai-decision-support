import { Doctor, Appointment, DiseaseType } from '@/types/telemedicine';

export const diseaseTypes: DiseaseType[] = [
  {
    id: 'diabetes',
    name: 'Diabetes',
    icon: '🩸',
    description: 'Assess your risk for Type 2 Diabetes based on health indicators'
  },
  {
    id: 'heart-disease',
    name: 'Heart Disease',
    icon: '❤️',
    description: 'Evaluate cardiovascular health and heart disease risk'
  },
  {
    id: 'parkinsons',
    name: "Parkinson's",
    icon: '🧠',
    description: "Screen for early indicators of Parkinson's disease"
  },
  {
    id: 'hypertension',
    name: 'Hypertension',
    icon: '💓',
    description: 'Check your blood pressure risk and hypertension indicators'
  }
];

export const mockDoctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Wilson',
    specialty: 'General Medicine',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    rating: 4.9,
    experience: 12,
    available: true
  },
  {
    id: 'doc-2',
    name: 'Dr. Michael Chen',
    specialty: 'Cardiology',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    rating: 4.8,
    experience: 15,
    available: true
  },
  {
    id: 'doc-3',
    name: 'Dr. Emily Rodriguez',
    specialty: 'Neurology',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    rating: 4.7,
    experience: 10,
    available: false
  },
  {
    id: 'doc-4',
    name: 'Dr. James Thompson',
    specialty: 'Endocrinology',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    rating: 4.9,
    experience: 18,
    available: true
  },
  {
    id: 'doc-5',
    name: 'Dr. Lisa Park',
    specialty: 'Psychiatry',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    rating: 4.8,
    experience: 8,
    available: true
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: 'apt-1',
    patientId: 'patient-1',
    patientName: 'John Smith',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Wilson',
    specialty: 'General Medicine',
    date: '2024-01-20',
    time: '10:00 AM',
    type: 'video',
    status: 'scheduled'
  },
  {
    id: 'apt-2',
    patientId: 'patient-1',
    patientName: 'John Smith',
    doctorId: 'doc-2',
    doctorName: 'Dr. Michael Chen',
    specialty: 'Cardiology',
    date: '2024-01-22',
    time: '2:30 PM',
    type: 'in-person',
    status: 'scheduled'
  }
];

export const specialties = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Endocrinology',
  'Psychiatry',
  'Dermatology',
  'Orthopedics',
  'Pediatrics'
];
