import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
const en = {
  translation: {
    // Common
    appName: 'TeleMed AI',
    welcome: 'Welcome',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    // Navigation
    dashboard: 'Dashboard',
    appointments: 'Appointments',
    predictions: 'Predictions',
    mentalHealth: 'Mental Health',
    chatbot: 'Chatbot',
    reports: 'Reports',
    profile: 'Profile',
    settings: 'Settings',
    
    // Landing
    heroTitle: 'AI-Powered Healthcare at Your Fingertips',
    heroSubtitle: 'Get instant health predictions, mental health support, and connect with doctors - all in your preferred language.',
    getStarted: 'Get Started',
    signIn: 'Sign In',
    
    // Auth
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    signUp: 'Sign Up',
    signIn_title: 'Sign In',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    
    // Patient Dashboard
    healthOverview: 'Health Overview',
    riskAssessment: 'Risk Assessment',
    bookAppointment: 'Book Appointment',
    viewMedicalRecords: 'View Medical Records',
    upcomingAppointments: 'Upcoming Appointments',
    
    // Disease Prediction
    aiPrediction: 'AI Disease Prediction',
    enterParameters: 'Enter your health parameters',
    predict: 'Get Prediction',
    riskLevel: 'Risk Level',
    riskPercentage: 'Risk Percentage',
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    recommendations: 'AI Recommendations',
    downloadReport: 'Download PDF Report',
    
    // Chatbot
    mentalHealthCompanion: 'Mental Health Companion',
    typeMessage: 'Type your message...',
    send: 'Send',
    aiSupportDisclaimer: 'This AI companion provides emotional support but is not a substitute for professional mental health care.',
    
    // Appointments
    selectDoctor: 'Select Doctor',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    book: 'Book Appointment',
    scheduledAt: 'Scheduled at',
    status: 'Status',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    
    // Video Consultation
    videoConsultation: 'Video Consultation',
    joinCall: 'Join Call',
    endCall: 'End Call',
    mute: 'Mute',
    unmute: 'Unmute',
    cameraOn: 'Camera On',
    cameraOff: 'Camera Off',
    shareScreen: 'Share Screen',
    
    // Emergency
    emergencyAlert: 'Emergency Alert',
    emergencyContact: 'Emergency Contact',
    addContact: 'Add Emergency Contact',
    highRiskWarning: 'High Risk Detected! Please consult a doctor immediately.',
    disclaimer: 'Consult doctor before usage',
    
    // Language
    selectLanguage: 'Select Language',
    english: 'English',
    hindi: 'Hindi',
    telugu: 'Telugu',
  }
};

// Hindi translations
const hi = {
  translation: {
    // Common
    appName: 'टेलीमेड AI',
    welcome: 'स्वागत है',
    back: 'वापस',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    submit: 'जमा करें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफल',
    
    // Navigation
    dashboard: 'डैशब��र्ड',
    appointments: 'अपॉइंटमेंट',
    predictions: 'पूर्वानुमान',
    mentalHealth: 'मानसिक स्वास्थ्य',
    chatbot: 'चैटबॉट',
    reports: 'रिपोर्ट',
    profile: 'प्रोफाइल',
    settings: 'सेटिंग्स',
    
    // Landing
    heroTitle: 'आपकी उंगलियों पर AI-संचालित स्वास्थ्य सेवा',
    heroSubtitle: 'अपनी पसंदीदा भाषा में तुरंत स्वास्थ्य पूर्वानुमान, मानसिक स्वास्थ्य सहायता प्राप्त करें और डॉक्टरों से जुड़ें।',
    getStarted: 'शुरू करें',
    signIn: 'साइन इन करें',
    
    // Auth
    email: 'ईमेल',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    fullName: 'पूरा नाम',
    signUp: 'साइन अप करें',
    signIn_title: 'साइन इन करें',
    forgotPassword: 'पासवर्ड भूल गए?',
    noAccount: 'खाता नहीं है?',
    hasAccount: 'पहले से खाता है?',
    
    // Patient Dashboard
    healthOverview: 'स्वास्थ्य अवलोकन',
    riskAssessment: 'जोखिम मूल्यांकन',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    viewMedicalRecords: 'चिकित्सा रिकॉर्ड देखें',
    upcomingAppointments: 'आगामी अपॉइंटमेंट',
    
    // Disease Prediction
    aiPrediction: 'AI रोग पूर्वानुमान',
    enterParameters: 'अपने स्वास्थ्य मापदंड दर्ज करें',
    predict: 'पूर्वानुमान प्राप्त करें',
    riskLevel: 'जोखिम स्तर',
    riskPercentage: 'जोखिम प्रतिशत',
    low: 'कम',
    moderate: 'मध्यम',
    high: 'उच्च',
    recommendations: 'AI सुझाव',
    downloadReport: 'PDF रिपोर्ट डाउनलोड करें',
    
    // Chatbot
    mentalHealthCompanion: 'मानसिक स्वास्थ्य साथी',
    typeMessage: 'अपना संदेश लिखें...',
    send: 'भेजें',
    aiSupportDisclaimer: 'यह AI साथी भावनात्मक सहायता प्रदान करता है लेकिन पेशेवर मानसिक स्वास्थ्य देखभाल का विकल्प नहीं है।',
    
    // Appointments
    selectDoctor: 'डॉक्टर चुनें',
    selectDate: 'तारीख चुनें',
    selectTime: 'समय चुनें',
    book: 'अपॉइंटमेंट बुक करें',
    scheduledAt: 'निर्धारित समय',
    status: 'स्थिति',
    pending: 'लंबित',
    confirmed: 'पुष्टि',
    completed: 'पूर्ण',
    cancelled: 'रद्द',
    
    // Video Consultation
    videoConsultation: 'वीडियो परामर्श',
    joinCall: 'कॉल में शामिल हों',
    endCall: 'कॉल समाप्त करें',
    mute: 'म्यूट',
    unmute: 'अनम्यूट',
    cameraOn: 'कैमरा चालू',
    cameraOff: 'कैमरा बंद',
    shareScreen: 'स्क्रीन साझा करें',
    
    // Emergency
    emergencyAlert: 'आपातकालीन अलर्ट',
    emergencyContact: 'आपातका���ीन संपर्क',
    addContact: 'आपातकालीन संपर्क जोड़ें',
    highRiskWarning: 'उच्च जोखिम का पता चला! कृपया तुरंत डॉक्टर से परामर्श करें।',
    disclaimer: 'उपयोग से पहले डॉक्टर से परामर्श करें',
    
    // Language
    selectLanguage: 'भाषा चुनें',
    english: 'अंग्रेज़ी',
    hindi: 'हिंदी',
    telugu: 'तेलुगु',
  }
};

// Telugu translations
const te = {
  translation: {
    // Common
    appName: 'టెలీమెడ్ AI',
    welcome: 'స్వాగతం',
    back: 'వెనక్కి',
    save: 'సేవ్ చేయండి',
    cancel: 'రద్ చేయండి',
    submit: 'సమర్పించండి',
    loading: 'లోడ్ అవుతోంది...',
    error: 'పొరపాటు',
    success: 'విజయం',
    
    // Navigation
    dashboard: 'డాష్‌బోర్డ్',
    appointments: 'అపాయింట్‌మెంట్లు',
    predictions: 'ఊహాగానాలు',
    mentalHealth: 'మానసిక ఆరోగ్యం',
    chatbot: 'చాట్‌బాట్',
    reports: 'నివేదికలు',
    profile: 'ప్రొఫైల్',
    settings: 'సెట్టింగ్స్',
    
    // Landing
    heroTitle: 'మీ వేలు చివరలో AI-ఆధారిత ఆరోగ్య సంరక్షణ',
    heroSubtitle: 'మీకు ఇష్టమైన భాషలో తక్షణ ఆరోగ్య ఊహాగానాలు, మానసిక ఆరోగ్య సహాయం పొందండి మరియు వైద్యులతో కనెక్ట్ అవ్వండి.',
    getStarted: 'ఆరంభించండి',
    signIn: 'సైన్ ఇన్',
    
    // Auth
    email: 'ఈమెయిల్',
    password: 'పాస్‌వర్డ్',
    confirmPassword: 'పాస్‌వర్డ్ నిర్ధారించండి',
    fullName: 'పూర్తి పేరు',
    signUp: 'సైన్ అప్',
    signIn_title: 'సైన్ ఇన్',
    forgotPassword: 'పాస్‌వర్డ్ మర్చిపోయారా?',
    noAccount: 'ఖాతా లేదా?',
    hasAccount: 'ఖాతా ఉందా?',
    
    // Patient Dashboard
    healthOverview: 'ఆరోగ్య అవలోకనం',
    riskAssessment: 'రిస్క్ అసెస్‌మెంట్',
    bookAppointment: 'అపాయింట్‌మెంట్ బుక్ చేయండి',
    viewMedicalRecords: 'మెడికల్ రికార్డులు చూడండి',
    upcomingAppointments: 'రాబోయే అపాయింట్‌మెంట్లు',
    
    // Disease Prediction
    aiPrediction: 'AI వ్యాధి ఊహాగానం',
    enterParameters: 'మీ ఆరోగ్య పరామితులు ఎంటర్ చేయండి',
    predict: 'ఊహాగానం పొందండి',
    riskLevel: 'రిస్క్ స్థాయి',
    riskPercentage: 'రిస్క్ శాతం',
    low: 'తక్కువ',
    moderate: 'మధ్యస్థం',
    high: 'అధికం',
    recommendations: 'AI సిఫార్సులు',
    downloadReport: 'PDF నివేదిక డౌన్‌లోడ్',
    
    // Chatbot
    mentalHealthCompanion: 'మానసిక ఆరోగ్య సహచరుడు',
    typeMessage: 'మీ సందేశాన్ని టైప్ చేయండి...',
    send: 'పంపండి',
    aiSupportDisclaimer: 'ఈ AI సహచరుడు భావోద్వేగ సహాయం అందిస్తుంది కానీ ప్రొఫెషనల్ మానసిక ఆరోగ్య సంరక్షణకు బదులు కాదు.',
    
    // Appointments
    selectDoctor: 'డాక్టర్ ఎంచుకోండి',
    selectDate: 'తేదీ ఎంచుకోండి',
    selectTime: 'సమయం ఎంచుకోండి',
    book: 'అపాయింట్‌మెంట్ బుక్',
    scheduledAt: 'నిర్ణయించబడిన సమయం',
    status: 'స్థితి',
    pending: 'పెండింగ్',
    confirmed: 'నిర్ధారించబడింది',
    completed: 'పూర్తి',
    cancelled: 'రద్దు',
    
    // Video Consultation
    videoConsultation: 'వీడియో కన్సల్టేషన్',
    joinCall: 'కాల్‌లో చేరండి',
    endCall: 'కాల్ ముగించండి',
    mute: 'మ్యూట్',
    unmute: 'అన్‌మ్యూట్',
    cameraOn: 'కెమెరా ఆన్',
    cameraOff: 'కెమెరా ఆఫ్',
    shareScreen: 'స్క్రీన్ షేర్',
    
    // Emergency
    emergencyAlert: 'ఎమర్జెన్సీ అలర్ట్',
    emergencyContact: 'ఎమర్జెన్సీ కాంటాక్ట్',
    addContact: 'ఎమర్జెన్సీ కాంటాక్ట్ జోడించండి',
    highRiskWarning: 'అధిక రిస్క్ గుర్తించబడింది! దయచేసి వెంటనే డాక్టర్‌ని సంప్రదించండి.',
    disclaimer: 'వాడుక ముందు డాక్టర్ సంప్రదించండి',
    
    // Language
    selectLanguage: 'భాష ఎంచుకోండి',
    english: 'ఇంగ్లీష్',
    hindi: 'హిందీ',
    telugu: 'తెలుగు',
  }
};


i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en,
      hi,
      te
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
