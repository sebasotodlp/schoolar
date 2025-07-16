export type Page = 'landing' | 'survey-landing' | 'school-code' | 'survey-code' | 'course-selection' | 'survey' | 'complete' | 'admin-login' | 'admin-dashboard' | 'admin-register' | 'about' | 'contact';

export type AdminSection = 'profile' | 'indicators' | 'recommendations' | 'ai-agent' | 'user-management' | 'survey-management';

export type SurveySection = 'general' | 'experience' | 'security' | 'mental-health' | 'alcohol-drugs' | 'cleanliness';

export interface SurveyData {
  schoolCode: string;
  surveyCode: string;
  course: string;
  letter: string;
  currentSection: SurveySection;
  surveyType: 'student' | 'teacher';
  
  // I. Preguntas Generales (Estudiantes)
  gender: string;
  disability: string;
  disabilityType: string;
  absenceDays: string;
  
  // I. Preguntas Generales (Profesores)
  teacherAge: string;
  teachingLevel: string;
  
  // II. Experiencia en el Establecimiento (Estudiantes)
  happyAtSchool: string;
  feelPartOfSchool: string;
  generalExperience: string;
  participationOpportunity: string;
  extracurricularActivities: string;
  learningMotivation: string;
  teacherCare: string;
  socialSpace: string;
  
  // II. Experiencia en el Establecimiento (Profesores)
  schoolResources: string;
  administrativeSupport: string;
  professionalDevelopment: string;
  inclusiveEnvironment: string;
  teachingMotivation: string;
  teacherRecognition: string;
  teacherHappiness: string;
  
  // III. Seguridad y Bullying (Estudiantes)
  schoolSafety: string;
  respectTeaching: string;
  conflictResolution: string;
  bullyingProblem: string;
  rumorsSpread: string;
  offensiveNames: string;
  physicalAggression: string;
  appearanceMocking: string;
  weaponSeen: string;
  
  // III. Seguridad y Bullying (Profesores)
  teacherHarassed: string;
  witnessedTeacherHarassment: string;
  witnessedStudentHarassment: string;
  witnessedWeapons: string;
  bullyingProblemTeacher: string;
  needMoreSafetyMeasures: string;
  
  // IV. Salud Mental (Estudiantes)
  stressFrequency: string;
  sadnessFrequency: string;
  lonelinessFrequency: string;
  consideredProfessionalHelp: string;
  receivedProfessionalHelp: string;
  receivedSchoolProfessionalHelp: string;
  professionalHelpWouldHelp: string;
  peersUnderstanding: string;
  knowWhereToAskHelp: string;
  schoolHasNecessaryTools: string;
  
  // IV. Salud Mental (Profesores)
  teacherStressFrequency: string;
  schoolEmotionalSupport: string;
  schoolWellnessPrograms: string;
  mentalHealthPolicies: string;
  mentalHealthStigma: string;
  
  // V. Consumo de Alcohol y Drogas (Estudiantes)
  dailyCigarettes: string;
  dailyAlcohol: string;
  electronicCigarette: string;
  cigarettesHealthBad: string;
  electronicCigarettesHealthBad: string;
  marijuanaHealthBad: string;
  excessiveAlcoholHealthBad: string;
  alcoholProblemAtSchool: string;
  drugsProblemAtSchool: string;
  peerPressureSubstances: string;
  
  // V. Consumo de Alcohol y Drogas (Profesores)
  alcoholProblemAtSchoolTeacher: string;
  drugsProblemAtSchoolTeacher: string;
  
  // VI. Limpieza del Establecimiento (Estudiantes)
  cooperateWithCleanliness: string;
  maintainBathroomClean: string;
  peersCareCleanliness: string;
  classroomCleaningFrequency: string;
  bathroomCleaningFrequency: string;
  bathroomHygieneArticles: string;
  improveFacilitiesCleanliness: string;
  
  // VI. Limpieza del Establecimiento (Profesores)
  teacherCooperateWithCleanliness: string;
  cleanEnvironmentProvided: string;
  improveFacilitiesCleanlinessTeacher: string;
  bathroomHygieneArticlesTeacher: string;
  
  // Dynamic custom fields for custom surveys
  [key: string]: string | number;
  
  timestamp: number;
  id: string;
}

export interface SurveyResponse {
  id: string;
  schoolCode: string;
  surveyCode: string;
  course: string;
  letter: string;
  surveyType: 'student' | 'teacher';
  
  // I. Preguntas Generales (Estudiantes)
  gender: string;
  disability: string;
  disabilityType: string;
  absenceDays: string;
  
  // I. Preguntas Generales (Profesores)
  teacherAge: string;
  teachingLevel: string;
  
  // II. Experiencia en el Establecimiento (Estudiantes)
  happyAtSchool: string;
  feelPartOfSchool: string;
  generalExperience: string;
  participationOpportunity: string;
  extracurricularActivities: string;
  learningMotivation: string;
  teacherCare: string;
  socialSpace: string;
  
  // II. Experiencia en el Establecimiento (Profesores)
  schoolResources: string;
  administrativeSupport: string;
  professionalDevelopment: string;
  inclusiveEnvironment: string;
  teachingMotivation: string;
  teacherRecognition: string;
  teacherHappiness: string;
  
  // III. Seguridad y Bullying (Estudiantes)
  schoolSafety: string;
  respectTeaching: string;
  conflictResolution: string;
  bullyingProblem: string;
  rumorsSpread: string;
  offensiveNames: string;
  physicalAggression: string;
  appearanceMocking: string;
  weaponSeen: string;
  
  // III. Seguridad y Bullying (Profesores)
  teacherHarassed: string;
  witnessedTeacherHarassment: string;
  witnessedStudentHarassment: string;
  witnessedWeapons: string;
  bullyingProblemTeacher: string;
  needMoreSafetyMeasures: string;
  
  // IV. Salud Mental (Estudiantes)
  stressFrequency: string;
  sadnessFrequency: string;
  lonelinessFrequency: string;
  consideredProfessionalHelp: string;
  receivedProfessionalHelp: string;
  receivedSchoolProfessionalHelp: string;
  professionalHelpWouldHelp: string;
  peersUnderstanding: string;
  knowWhereToAskHelp: string;
  schoolHasNecessaryTools: string;
  
  // IV. Salud Mental (Profesores)
  teacherStressFrequency: string;
  schoolEmotionalSupport: string;
  schoolWellnessPrograms: string;
  mentalHealthPolicies: string;
  mentalHealthStigma: string;
  
  // V. Consumo de Alcohol y Drogas (Estudiantes)
  dailyCigarettes: string;
  dailyAlcohol: string;
  electronicCigarette: string;
  cigarettesHealthBad: string;
  electronicCigarettesHealthBad: string;
  marijuanaHealthBad: string;
  excessiveAlcoholHealthBad: string;
  alcoholProblemAtSchool: string;
  drugsProblemAtSchool: string;
  peerPressureSubstances: string;
  
  // V. Consumo de Alcohol y Drogas (Profesores)
  alcoholProblemAtSchoolTeacher: string;
  drugsProblemAtSchoolTeacher: string;
  
  // VI. Limpieza del Establecimiento (Estudiantes)
  cooperateWithCleanliness: string;
  maintainBathroomClean: string;
  peersCareCleanliness: string;
  classroomCleaningFrequency: string;
  bathroomCleaningFrequency: string;
  bathroomHygieneArticles: string;
  improveFacilitiesCleanliness: string;
  
  // VI. Limpieza del Establecimiento (Profesores)
  teacherCooperateWithCleanliness: string;
  cleanEnvironmentProvided: string;
  improveFacilitiesCleanlinessTeacher: string;
  bathroomHygieneArticlesTeacher: string;
  
  // Dynamic custom fields for custom surveys
  [key: string]: string | number;
  
  timestamp: number;
}

export interface CourseStats {
  course: string;
  total: number;
  genderBreakdown: {
    [key: string]: number;
  };
  disabilityBreakdown: {
    [key: string]: number;
  };
  gradeBreakdown: {
    [key: string]: number;
  };
  experienceStats: {
    [key: string]: number;
  };
  safetyStats: {
    [key: string]: number;
  };
  bullyingStats: {
    [key: string]: number;
  };
  mentalHealthStats: {
    [key: string]: number;
  };
  substanceStats: {
    [key: string]: number;
  };
  cleanlinessStats: {
    [key: string]: number;
  };
}

export interface SchoolCodeData {
  code: string;
  name: string;
  adminAccount: string;
}

export interface UserPermissions {
  indicators: boolean;
  recommendations: boolean;
  aiAgent: boolean;
  surveyManagement?: boolean;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  schoolCode: string;
  schoolName: string;
  createdAt: number;
  userType: 'admin' | 'secondary';
  createdBy?: string; // ID del administrador que creó esta cuenta
  position?: string; // Cargo en el colegio
  permissions?: UserPermissions; // Solo para cuentas secundarias
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  schoolCode: string;
}

export interface SecondaryUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  position: string;
  permissions: UserPermissions;
}

export interface SurveyCodeData {
  code: string;
  name: string;
  schoolCode: string;
  description: string;
  isActive: boolean;
}

export interface QuestionRecommendation {
  questionNumber: string;
  questionText: string;
  field: string;
  analysis: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  loading: boolean;
}

// New interfaces for custom survey management
export interface CustomSurveyQuestion {
  id: string;
  questionNumber: string;
  questionText: string;
  fieldName: string;
  options: string[];
  isConditional: boolean;
  conditionalField?: string;
  conditionalValue?: string;
  section: string;
  required: boolean;
}

export interface CustomSurveySection {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  questions: CustomSurveyQuestion[];
}

export interface CustomSurvey {
  id: string;
  name: string;
  description: string;
  surveyCode: string;
  schoolCode: string;
  surveyType: 'student' | 'teacher';
  sections: CustomSurveySection[];
  isActive: boolean;
  createdAt: number;
  createdBy: string;
  lastModified: number;
}

export interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  surveyType: 'student' | 'teacher';
  sections: CustomSurveySection[];
  isDefault: boolean;
}