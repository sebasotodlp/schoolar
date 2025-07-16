import { useState, useEffect } from 'react';
import { Lightbulb, Download, Filter, AlertTriangle, AlertCircle, CheckCircle, TrendingUp, Brain, Shield, Users, Wine, Droplets, XCircle } from 'lucide-react';
import { SurveyResponse, AdminUser } from '../types';
import { exportRecommendationsToPDF } from '../utils/pdfExport';
import { OpenAIService } from '../services/openaiService';
import { SecureDataManager } from '../config/secureData';

interface QuestionRecommendation {
  questionNumber: string;
  questionText: string;
  field: string;
  analysis: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  loading: boolean;
}

interface RecommendationsSectionProps {
  surveyResponses: SurveyResponse[];
  currentUser: AdminUser | null;
  validSurveyCodes?: any;
}

export function RecommendationsSection({ surveyResponses, currentUser, validSurveyCodes = {} }: RecommendationsSectionProps) {
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('all');
  const [recommendations, setRecommendations] = useState<QuestionRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableSurveys, setAvailableSurveys] = useState<any[]>([]);
  const [openaiService, setOpenaiService] = useState<OpenAIService | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [runtimeApiError, setRuntimeApiError] = useState<string | null>(null);
  const [selectedSurveyType, setSelectedSurveyType] = useState<'student' | 'teacher' | 'all'>('all');

  const secureDataManager = SecureDataManager.getInstance();

  // Initialize OpenAI service
  useEffect(() => {
    try {
      const service = new OpenAIService();
      setOpenaiService(service);
      setApiError(null);
    } catch (error) {
      console.error('Error initializing OpenAI service:', error);
      setApiError('No se pudo inicializar el servicio de IA. Verifica la configuración de la API key.');
    }
  }, []);

  // Load available surveys for the current user's school
  useEffect(() => {
    const loadAvailableSurveys = async () => {
      if (!currentUser?.schoolCode) return;

      // Get unique survey codes from responses
      const uniqueSurveyCodes = Array.from(new Set(surveyResponses.map(r => r.surveyCode)));
      
      const surveys = [];
      for (const code of uniqueSurveyCodes) {
        try {
          const validation = await secureDataManager.validateSurveyCode(code, currentUser.schoolCode);
          if (validation.valid) {
            surveys.push({
              code,
              name: validation.name,
              description: validation.description,
              type: validation.type || 'student',
              schoolCode: currentUser.schoolCode
            });
          }
        } catch (error) {
          console.error('Error validating survey code:', code, error);
        }
      }
      
      // Sort surveys by most recent (assuming newer codes are higher)
      surveys.sort((a, b) => b.code.localeCompare(a.code));
      
      setAvailableSurveys(surveys);
      
      // Set the most recent survey as default
      if (surveys.length > 0) {
        setSelectedSurvey(surveys[0].code);
        setSelectedSurveyType(surveys[0].type);
      }
    };

    loadAvailableSurveys();
  }, [surveyResponses, currentUser?.schoolCode]);

  // Update survey type when survey changes
  useEffect(() => {
    const selectedSurveyData = availableSurveys.find(s => s.code === selectedSurvey);
    if (selectedSurveyData) {
      setSelectedSurveyType(selectedSurveyData.type);
      // Reset course and letter when changing survey type
      if (selectedSurveyData.type === 'teacher') {
        setSelectedCourse('all');
        setSelectedLetter('all');
      }
      // Clear recommendations when survey changes
      setRecommendations([]);
    }
  }, [selectedSurvey, availableSurveys]);

  // Filter responses based on selected survey, course and letter
  const filteredResponses = surveyResponses.filter(response => {
    const surveyMatch = selectedSurvey === 'all' || response.surveyCode === selectedSurvey;
    const courseMatch = selectedCourse === 'all' || response.course === selectedCourse;
    const letterMatch = selectedLetter === 'all' || response.letter === selectedLetter;
    return surveyMatch && courseMatch && letterMatch;
  });

  // Get available courses and letters from filtered survey responses
  const availableCourses = Array.from(new Set(
    (selectedSurvey === 'all' ? surveyResponses : surveyResponses.filter(r => r.surveyCode === selectedSurvey))
    .map(response => response.course)
  )).sort();
  
  const availableLetters = Array.from(new Set(
    (selectedSurvey === 'all' ? surveyResponses : surveyResponses.filter(r => r.surveyCode === selectedSurvey))
    .map(response => response.letter)
  )).sort();

  // Define all questions with their details - Updated for both student and teacher surveys
  const getQuestionsForSurveyType = (surveyType: 'student' | 'teacher' | 'all') => {
    if (surveyType === 'teacher') {
      return [
        // I. Preguntas Generales (Profesores)
        { number: '1', text: '¿Con cuál género te identificas?', field: 'gender', section: 'general' },
        { number: '2', text: '¿Presentas algún tipo de discapacidad?', field: 'disability', section: 'general' },
        { number: '2a', text: 'Si tu respuesta anterior fue "Sí", ¿qué tipo de discapacidad presentas?', field: 'disabilityType', section: 'general' },
        { number: '3', text: '¿Cuál es tu edad?', field: 'teacherAge', section: 'general' },
        { number: '4', text: '¿En qué nivel enseñas?', field: 'teachingLevel', section: 'general' },
        
        // II. Experiencia en el Establecimiento (Profesores)
        { number: '5', text: 'El establecimiento escolar proporciona suficientes recursos y materiales didácticos para apoyar la enseñanza del profesor.', field: 'schoolResources', section: 'experience' },
        { number: '6', text: 'El personal administrativo constantemente brinda apoyo y colaboración al profesor en su labor docente.', field: 'administrativeSupport', section: 'experience' },
        { number: '7', text: 'El establecimiento escolar ofrece oportunidades de desarrollo profesional para que el profesor mejore sus habilidades pedagógicas.', field: 'professionalDevelopment', section: 'experience' },
        { number: '8', text: 'El establecimiento escolar promueve un ambiente inclusivo y diverso que respeta las diferencias culturales de los docentes y estudiantes.', field: 'inclusiveEnvironment', section: 'experience' },
        { number: '9', text: '¿Te sientes motivado y entusiasmado en tu labor docente dentro del establecimiento escolar?', field: 'teachingMotivation', section: 'experience' },
        { number: '10', text: '¿Te sientes valorado y reconocido por tu trabajo en el establecimiento escolar?', field: 'teacherRecognition', section: 'experience' },
        { number: '11', text: 'En general, ¿te sientes feliz con tu experiencia laboral en este colegio?', field: 'teacherHappiness', section: 'experience' },
        
        // III. Seguridad y Bullying (Profesores)
        { number: '12', text: 'Durante este semestre... ¿Has sido objeto de comportamientos dañinos por parte de estudiantes en el colegio que te hayan hecho sentir incómodo, amenazado o humillado?', field: 'teacherHarassed', section: 'security' },
        { number: '13', text: 'Durante este semestre... ¿Has presenciado alguna situación de acoso, maltrato o humillación en el colegio hacia algún docente?', field: 'witnessedTeacherHarassment', section: 'security' },
        { number: '14', text: 'Durante este semestre... ¿Has presenciado alguna situación de acoso, maltrato o humillación en el colegio hacia algún estudiante?', field: 'witnessedStudentHarassment', section: 'security' },
        { number: '15', text: 'Durante este semestre... ¿Viste a algún estudiante con algún arma de fuego o un arma blanca?', field: 'witnessedWeapons', section: 'security' },
        { number: '16', text: '¿Consideras que el Bullying es un problema en tu colegio?', field: 'bullyingProblemTeacher', section: 'security' },
        { number: '17', text: '¿Consideras que el colegio debiese implementar más medidas para prevenir el acoso y violencia escolar?', field: 'needMoreSafetyMeasures', section: 'security' },
        
        // IV. Salud Mental (Profesores)
        { number: '17', text: 'Durante este semestre... ¿qué tan seguido te has sentido estresado, solo o triste?', field: 'teacherStressFrequency', section: 'mental-health' },
        { number: '18', text: '¿Te sientes apoyado/a por el colegio en cuanto a tu bienestar emocional y salud mental?', field: 'schoolEmotionalSupport', section: 'mental-health' },
        { number: '19', text: '¿El colegio ofrece recursos y programas de apoyo para promover el bienestar emocional y el auto-cuidado de los profesores?', field: 'schoolWellnessPrograms', section: 'mental-health' },
        { number: '20', text: '¿Te sientes satisfecho/a con las políticas y programas implementados por el colegio en relación con la salud mental de los profesores?', field: 'mentalHealthPolicies', section: 'mental-health' },
        { number: '21', text: '¿Piensas que el colegio está comprometido en abordar la estigmatización y los prejuicios asociados con problemas de salud mental?', field: 'mentalHealthStigma', section: 'mental-health' },
        
        // V. Consumo de Alcohol y Drogas (Profesores)
        { number: '22', text: '¿Crees que el consumo de alcohol es un problema entre los estudiantes del colegio?', field: 'alcoholProblemAtSchoolTeacher', section: 'alcohol-drugs' },
        { number: '23', text: '¿Crees que el consumo de drogas es un problema entre los estudiantes del colegio?', field: 'drugsProblemAtSchoolTeacher', section: 'alcohol-drugs' },
        
        // VI. Limpieza del Establecimiento (Profesores)
        { number: '24', text: 'En general, intento cooperar con la limpieza del colegio botando mi basura donde corresponde y manteniendo los espacios comunes lo más limpio posible.', field: 'teacherCooperateWithCleanliness', section: 'cleanliness' },
        { number: '25', text: 'Se proporciona un entorno limpio y ordenado en el colegio, incluyendo áreas como baños y zonas de recreo.', field: 'cleanEnvironmentProvided', section: 'cleanliness' },
        { number: '26', text: '¿Crees que se podría mejorar la limpieza de las instalaciones del establecimiento?', field: 'improveFacilitiesCleanlinessTeacher', section: 'cleanliness' },
        { number: '27', text: 'Los baños siempre cuentan con los artículos de higiene necesarios.', field: 'bathroomHygieneArticlesTeacher', section: 'cleanliness' }
      ];
    } else {
      // Student survey questions (existing)
      return [
        // I. Preguntas Generales
        { number: '1', text: '¿Con cuál género te identificas?', field: 'gender', section: 'general' },
        { number: '2', text: '¿Presentas alguna discapacidad?', field: 'disability', section: 'general' },
        { number: '2a', text: 'Si tu respuesta anterior fue "Sí", ¿qué tipo de discapacidad presentas?', field: 'disabilityType', section: 'general' },
        { number: '3', text: 'En el último mes... ¿cuántos días completos has faltado al colegio por cualquier razón?', field: 'absenceDays', section: 'general' },
        
        // II. Experiencia en el Establecimiento
        { number: '4', text: '¿Estás feliz de estar en este colegio?', field: 'happyAtSchool', section: 'experience' },
        { number: '5', text: '¿Sientes que eres parte de este colegio?', field: 'feelPartOfSchool', section: 'experience' },
        { number: '6', text: '¿Cómo describirías tu experiencia general en el colegio?', field: 'generalExperience', section: 'experience' },
        { number: '7', text: '¿El colegio te ha dado anteriormente la oportunidad de participar y de dar ideas para mejorar la calidad del ambiente educacional?', field: 'participationOpportunity', section: 'experience' },
        { number: '8', text: 'Las actividades extracurriculares ofrecidas por el colegio son variadas y atractivas', field: 'extracurricularActivities', section: 'experience' },
        { number: '9', text: '¿Te sientes motivado/a y comprometido/a con tu proceso de aprendizaje en el colegio?', field: 'learningMotivation', section: 'experience' },
        { number: '10', text: '¿Sientes que tus profesores se preocupan por tu bienestar y desarrollo académico?', field: 'teacherCare', section: 'experience' },
        { number: '11', text: '¿Tienes espacio suficiente para jugar, correr y hacer vida social en el colegio?', field: 'socialSpace', section: 'experience' },
        
        // III. Seguridad y Bullying
        { number: '12', text: '¿Te sientes seguro en el colegio?', field: 'schoolSafety', section: 'security' },
        { number: '13', text: '¿Tu colegio enseña a los estudiantes a tratarse con respeto?', field: 'respectTeaching', section: 'security' },
        { number: '14', text: '¿Tu colegio ayuda a los estudiantes a resolver sus conflictos?', field: 'conflictResolution', section: 'security' },
        { number: '15', text: '¿Consideras que el Bullying es un problema en tu colegio?', field: 'bullyingProblem', section: 'security' },
        { number: '16', text: 'Durante este semestre... ¿Se han difundido rumores malos o mentiras sobre ti?', field: 'rumorsSpread', section: 'security' },
        { number: '17', text: 'Durante este semestre... ¿Te han llamado por nombres molestos o te hacen bromas ofensivas?', field: 'offensiveNames', section: 'security' },
        { number: '18', text: 'Durante este semestre... ¿Te han golpeado o te empujado en la escuela sin estar jugando?', field: 'physicalAggression', section: 'security' },
        { number: '19', text: 'Durante este semestre... ¿Se han burlado de ti por tu apariencia?', field: 'appearanceMocking', section: 'security' },
        { number: '20', text: 'Durante este semestre... ¿Viste a otro niño con un cuchillo, una navaja o un arma blanca?', field: 'weaponSeen', section: 'security' },
        
        // IV. Salud Mental
        { number: '21', text: 'Durante este semestre... ¿Qué tan seguido te has sentido estresado?', field: 'stressFrequency', section: 'mental-health' },
        { number: '22', text: 'Durante este semestre... ¿Qué tan seguido te has sentido triste?', field: 'sadnessFrequency', section: 'mental-health' },
        { number: '23', text: 'Durante este semestre... ¿Qué tan seguido te has sentido solo?', field: 'lonelinessFrequency', section: 'mental-health' },
        { number: '24', text: 'Durante este semestre... ¿Consideraste hablar con algún profesional sobre tus problemas?', field: 'consideredProfessionalHelp', section: 'mental-health' },
        { number: '24a', text: 'Si tu respuesta anterior fue "Sí", ¿recibiste ayuda de algún profesional?', field: 'receivedProfessionalHelp', section: 'mental-health' },
        { number: '24b', text: 'Si tu respuesta anterior fue "Sí", ¿recibiste esa ayuda de algún profesional del colegio?', field: 'receivedSchoolProfessionalHelp', section: 'mental-health' },
        { number: '25', text: '¿Crees que hablarlo con un profesional te ayudaría a mejorar?', field: 'professionalHelpWouldHelp', section: 'mental-health' },
        { number: '26', text: '¿Crees que tus compañeros entenderían tu situación?', field: 'peersUnderstanding', section: 'mental-health' },
        { number: '27', text: '¿Sabrías dónde y a quién pedirle ayuda dentro del establecimiento?', field: 'knowWhereToAskHelp', section: 'mental-health' },
        { number: '28', text: '¿Crees que el colegio cuenta con las herramientas necesarias para ayudar a sus estudiantes en momentos de estrés, tristeza o soledad?', field: 'schoolHasNecessaryTools', section: 'mental-health' },
        
        // V. Consumo de Alcohol y Drogas
        { number: '29', text: '¿Crees que fumar cigarros es malo para la salud de una persona?', field: 'cigarettesHealthBad', section: 'alcohol-drugs' },
        { number: '30', text: '¿Crees que fumar cigarros electrónicos es malo para la salud de una persona?', field: 'electronicCigarettesHealthBad', section: 'alcohol-drugs' },
        { number: '31', text: '¿Crees que fumar marihuana es malo para la salud de una persona?', field: 'marijuanaHealthBad', section: 'alcohol-drugs' },
        { number: '32', text: '¿Crees que tomar alcohol (cerveza, vino, licor) en exceso, es malo para la salud de una persona?', field: 'excessiveAlcoholHealthBad', section: 'alcohol-drugs' },
        { number: '33', text: '¿Crees que el consumo de alcohol es un problema entre los estudiantes del colegio?', field: 'alcoholProblemAtSchool', section: 'alcohol-drugs' },
        { number: '34', text: '¿Crees que el consumo de drogas es un problema entre los estudiantes del colegio?', field: 'drugsProblemAtSchool', section: 'alcohol-drugs' },
        { number: '35', text: '¿Te sientes presionado/a por tus compañeros para consumir alcohol o drogas?', field: 'peerPressureSubstances', section: 'alcohol-drugs' },
        
        // VI. Limpieza del Establecimiento
        { number: '36', text: 'En general, trato de cooperar con la limpieza del colegio botando mi basura donde corresponde', field: 'cooperateWithCleanliness', section: 'cleanliness' },
        { number: '37', text: 'En general, trato de mantener el baño lo más limpio posible', field: 'maintainBathroomClean', section: 'cleanliness' },
        { number: '38', text: 'En general, considero que mis compañeros se preocupan de la limpieza del colegio', field: 'peersCareCleanliness', section: 'cleanliness' },
        { number: '39', text: 'La limpieza de las salas de clases se realizan con la frecuencia necesaria', field: 'classroomCleaningFrequency', section: 'cleanliness' },
        { number: '40', text: 'La limpieza de los baños se realizan con la frecuencia necesaria', field: 'bathroomCleaningFrequency', section: 'cleanliness' },
        { number: '41', text: 'Los baños siempre cuentan con los artículos de higiene necesarios', field: 'bathroomHygieneArticles', section: 'cleanliness' },
        { number: '42', text: '¿Crees que se podría mejorar la limpieza de las instalaciones del colegio?', field: 'improveFacilitiesCleanliness', section: 'cleanliness' }
      ];
    }
  };

  const analyzeQuestionData = (field: string) => {
    const data = filteredResponses.reduce((acc, response) => {
      const value = response[field as keyof SurveyResponse] as string;
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(data).reduce((sum, count) => sum + count, 0);
    const percentages = Object.entries(data).reduce((acc, [key, count]) => {
      acc[key] = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%';
      return acc;
    }, {} as Record<string, string>);

    const topResponse = Object.entries(data).reduce((max, current) => 
      current[1] > max[1] ? current : max, ['Sin datos', 0]
    );

    return { data, total, percentages, topResponse };
  };

  const determinePriority = (field: string, analysis: any): 'high' | 'medium' | 'low' => {
    const { data, total } = analysis;
    
    // High priority conditions for both student and teacher surveys
    if (field === 'bullyingProblem' && data['Sí'] > 0) return 'high';
    if (field === 'bullyingProblemTeacher' && data['Sí'] > 0) return 'high';
    if (field === 'weaponSeen' && data['Sí'] > 0) return 'high';
    if (field === 'witnessedWeapons' && data['Sí'] > 0) return 'high';
    if (field === 'physicalAggression' && data['Sí'] > 0) return 'high';
    if (field === 'teacherHarassed' && data['Sí'] > 0) return 'high';
    if (field === 'stressFrequency' && (data['Constantemente'] || 0) / total > 0.3) return 'high';
    if (field === 'teacherStressFrequency' && (data['Constantemente'] || 0) / total > 0.3) return 'high';
    if (field === 'schoolSafety' && (data['En Desacuerdo'] || 0) + (data['Muy en Desacuerdo'] || 0) > total * 0.3) return 'high';
    
    // Medium priority conditions
    if (field === 'generalExperience' && (data['Negativa'] || 0) + (data['Muy negativa'] || 0) > total * 0.2) return 'medium';
    if (field === 'teacherHappiness' && (data['En Desacuerdo'] || 0) + (data['Muy en Desacuerdo'] || 0) > total * 0.2) return 'medium';
    if (field === 'happyAtSchool' && (data['En Desacuerdo'] || 0) + (data['Muy en Desacuerdo'] || 0) > total * 0.2) return 'medium';
    if (field === 'offensiveNames' && data['Sí'] > 0) return 'medium';
    if (field === 'rumorsSpread' && data['Sí'] > 0) return 'medium';
    if (field === 'witnessedTeacherHarassment' && data['Sí'] > 0) return 'medium';
    if (field === 'witnessedStudentHarassment' && data['Sí'] > 0) return 'medium';
    if (field === 'sadnessFrequency' && (data['Constantemente'] || 0) / total > 0.2) return 'medium';
    if (field === 'lonelinessFrequency' && (data['Constantemente'] || 0) / total > 0.2) return 'medium';
    
    return 'low';
  };

  const generateRecommendationWithAI = async (question: any, analysis: any): Promise<string> => {
    if (!openaiService) {
      return generateBasicRecommendation(question, analysis);
    }

    try {
      const prompt = `Basándote en los siguientes datos de la pregunta "${question.text}" del campo ${question.field}:

Datos: ${JSON.stringify(analysis.data)}
Total de respuestas: ${analysis.total}
Porcentajes: ${JSON.stringify(analysis.percentages)}
Respuesta más común: ${analysis.topResponse[0]} (${analysis.topResponse[1]} respuestas)

Genera una recomendación específica y práctica para mejorar este aspecto en el colegio. La recomendación debe ser:
- Específica y accionable
- Dirigida a directivos escolares
- Máximo 2-3 oraciones
- Enfocada en soluciones concretas
- NO mencionar dinero, presupuestos o costos

Responde solo con la recomendación, sin explicaciones adicionales.`;

      const response = await openaiService.generateResponse(
        prompt,
        filteredResponses,
        currentUser?.schoolName || 'el colegio',
        []
      );

      return response.trim();
    } catch (error) {
      console.error('Error generating AI recommendation:', error);
      // Instead of throwing, return basic recommendation
      return generateBasicRecommendation(question, analysis);
    }
  };

  const generateBasicRecommendation = (question: any, analysis: any): string => {
    const { field } = question;
    const { data, total, topResponse } = analysis;

    // Basic recommendations based on field and data - WITHOUT MONEY REFERENCES
    if (field === 'bullyingProblem' && data['Sí'] > 0) {
      return 'Establecer un Comité de Convivencia Escolar liderado por Orientación con reuniones quincenales. Implementar protocolo de detección temprana mediante observadores de patio capacitados, intervención en 24 horas y seguimiento semanal por 4 semanas. Meta: reducir incidentes reportados en 40% en 6 meses.';
    }
    
    if (field === 'bullyingProblemTeacher' && data['Sí'] > 0) {
      return 'Crear un protocolo específico de convivencia docente-estudiantil coordinado por Dirección. Capacitar al equipo directivo en manejo de conflictos y establecer canales de denuncia confidencial. Realizar talleres de comunicación asertiva para docentes cada trimestre.';
    }
    
    if (field === 'schoolSafety' && (data['En Desacuerdo'] || 0) + (data['Muy en Desacuerdo'] || 0) > total * 0.2) {
      return 'Reforzar la supervisión en recreos asignando 2 inspectores adicionales por turno. Implementar rondas de seguridad cada 30 minutos en zonas críticas y establecer puntos de encuentro seguros claramente señalizados. Revisar protocolos de emergencia trimestralmente.';
    }
    
    if (field === 'generalExperience' && (data['Negativa'] || 0) + (data['Muy negativa'] || 0) > 0) {
      return 'Desarrollar un plan de mejora del clima escolar liderado por UTP. Crear espacios de diálogo estudiantil mensuales, implementar actividades de integración inter-cursos y establecer un sistema de reconocimiento a logros académicos y de convivencia.';
    }
    
    if (field === 'teacherHappiness' && (data['En Desacuerdo'] || 0) + (data['Muy en Desacuerdo'] || 0) > 0) {
      return 'Implementar un programa de reconocimiento docente coordinado por Dirección. Establecer reuniones de retroalimentación positiva mensuales, crear espacios de descanso mejorados y desarrollar un plan de desarrollo profesional personalizado para cada docente.';
    }
    
    if (field === 'stressFrequency' && (data['Constantemente'] || 0) > 0) {
      return 'Activar el programa de bienestar estudiantil con Orientación. Implementar talleres de manejo del estrés semanales, crear espacios de relajación en el colegio y establecer un sistema de derivación rápida a profesionales de salud mental cuando sea necesario.';
    }

    if (field === 'teacherStressFrequency' && (data['Constantemente'] || 0) > 0) {
      return 'Desarrollar un programa de bienestar docente coordinado por Recursos Humanos. Implementar pausas activas durante la jornada, crear espacios de descompresión y establecer un sistema de apoyo entre pares con reuniones quincenales de contención.';
    }

    // Default recommendation
    return `Revisar y mejorar las políticas relacionadas con ${question.text.toLowerCase()}. Asignar responsabilidad específica a UTP o Orientación para desarrollar un plan de acción con metas medibles y seguimiento mensual durante el próximo semestre.`;
  };

  const generateAnalysisWithAI = async (question: any, analysis: any): Promise<string> => {
    if (!openaiService) {
      return generateBasicAnalysis(question, analysis);
    }

    try {
      const prompt = `Analiza los siguientes resultados de la pregunta "${question.text}":

Datos: ${JSON.stringify(analysis.data)}
Total de respuestas: ${analysis.total}
Porcentajes: ${JSON.stringify(analysis.percentages)}

Proporciona un análisis breve (máximo 2 oraciones) que explique qué significan estos resultados para el ambiente escolar. Sé específico con los números y porcentajes.

Responde solo con el análisis, sin recomendaciones.`;

      const response = await openaiService.generateResponse(
        prompt,
        filteredResponses,
        currentUser?.schoolName || 'el colegio',
        []
      );

      return response.trim();
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      // Instead of throwing, return basic analysis
      return generateBasicAnalysis(question, analysis);
    }
  };

  const generateBasicAnalysis = (question: any, analysis: any): string => {
    const { data, total, percentages, topResponse } = analysis;
    
    if (total === 0) {
      return 'No hay datos suficientes para analizar esta pregunta.';
    }

    const topPercentage = total > 0 ? ((topResponse[1] / total) * 100).toFixed(1) : '0';
    
    return `El ${topPercentage}% de los ${selectedSurveyType === 'teacher' ? 'docentes' : 'estudiantes'} respondió "${topResponse[0]}" (${topResponse[1]} de ${total} respuestas). ${
      Object.keys(data).length > 1 
        ? `Las respuestas se distribuyen entre ${Object.keys(data).length} opciones diferentes.`
        : 'Hay consenso en las respuestas.'
    }`;
  };

  const generateRecommendations = async () => {
    if (filteredResponses.length === 0) {
      alert('No hay datos suficientes para generar recomendaciones con los filtros seleccionados.');
      return;
    }

    setLoading(true);
    setRuntimeApiError(null); // Clear any previous runtime errors
    const newRecommendations: QuestionRecommendation[] = [];

    // Get questions for the current survey type
    const allQuestions = getQuestionsForSurveyType(selectedSurveyType);

    // Initialize all recommendations as loading
    for (const question of allQuestions) {
      const analysis = analyzeQuestionData(question.field);
      if (analysis.total > 0) {
        newRecommendations.push({
          questionNumber: question.number,
          questionText: question.text,
          field: question.field,
          analysis: '',
          recommendation: '',
          priority: determinePriority(question.field, analysis),
          loading: true
        });
      }
    }

    setRecommendations(newRecommendations);

    // Generate recommendations one by one
    for (let i = 0; i < newRecommendations.length; i++) {
      const question = allQuestions.find(q => q.number === newRecommendations[i].questionNumber);
      if (!question) continue;

      const analysis = analyzeQuestionData(question.field);
      
      try {
        const [analysisText, recommendationText] = await Promise.all([
          generateAnalysisWithAI(question, analysis),
          generateRecommendationWithAI(question, analysis)
        ]);

        setRecommendations(prev => prev.map((rec, index) => 
          index === i 
            ? { ...rec, analysis: analysisText, recommendation: recommendationText, loading: false }
            : rec
        ));
      } catch (error) {
        console.error('Error generating recommendation:', error);
        
        // Set runtime API error for user feedback
        if (error instanceof Error) {
          setRuntimeApiError(error.message);
        }
        
        // Fallback to basic recommendations
        setRecommendations(prev => prev.map((rec, index) => 
          index === i 
            ? { 
                ...rec, 
                analysis: generateBasicAnalysis(question, analysis),
                recommendation: generateBasicRecommendation(question, analysis),
                loading: false 
              }
            : rec
        ));
      }
    }

    setLoading(false);
  };

  const handleExportPDF = () => {
    if (recommendations.length === 0) {
      alert('No hay recomendaciones para exportar. Genera las recomendaciones primero.');
      return;
    }

    const completedRecommendations = recommendations.filter(rec => !rec.loading);
    if (completedRecommendations.length === 0) {
      alert('Las recomendaciones aún se están generando. Espera a que terminen.');
      return;
    }

    const surveyName = selectedSurvey !== 'all' 
      ? availableSurveys.find(s => s.code === selectedSurvey)?.name || 'Encuesta Seleccionada'
      : 'Todas las Encuestas';

    const exportData = {
      schoolName: currentUser?.schoolName || 'Colegio',
      surveyName,
      course: selectedCourse !== 'all' ? selectedCourse : (selectedSurveyType === 'teacher' ? 'No aplica' : 'Todos los cursos'),
      letter: selectedLetter !== 'all' ? selectedLetter : (selectedSurveyType === 'teacher' ? 'No aplica' : 'Todas las letras'),
      totalResponses: filteredResponses.length,
      recommendations: completedRecommendations,
      generatedDate: new Date().toLocaleDateString('es-CL')
    };

    try {
      exportRecommendationsToPDF(exportData);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar el PDF. Por favor, intenta nuevamente.');
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'general': return Users;
      case 'experience': return Shield;
      case 'security': return AlertTriangle;
      case 'mental-health': return Brain;
      case 'alcohol-drugs': return Wine;
      case 'cleanliness': return Droplets;
      default: return CheckCircle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-amber-500 bg-amber-50';
      case 'low': return 'border-emerald-500 bg-emerald-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-amber-600 text-white';
      case 'low': return 'bg-emerald-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta Prioridad';
      case 'medium': return 'Prioridad Media';
      case 'low': return 'Prioridad Baja';
      default: return 'Sin Prioridad';
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se pudo cargar la información del usuario</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Error Warning */}
      {apiError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">Configuración de IA requerida</h4>
              <p className="text-sm text-amber-700 mb-2">
                {apiError}
              </p>
              <p className="text-xs text-amber-600">
                Para habilitar las recomendaciones con IA, agrega tu API key de OpenAI en el archivo .env como VITE_OPENAI_API_KEY.
                Mientras tanto, se generarán recomendaciones básicas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Runtime API Error Warning */}
      {runtimeApiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 mb-1">Error del servicio de IA</h4>
              <p className="text-sm text-red-700 mb-2">
                {runtimeApiError}
              </p>
              <p className="text-xs text-red-600">
                Se han generado recomendaciones básicas como alternativa. Verifica tu configuración de OpenAI para obtener recomendaciones mejoradas con IA.
              </p>
            </div>
            <button
              onClick={() => setRuntimeApiError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Lightbulb className="h-6 w-6 text-emerald-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Recomendaciones</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleExportPDF}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={recommendations.length === 0 || recommendations.some(r => r.loading)}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </button>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Recomendaciones profesionales para sostenedores y directivos educacionales
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-emerald-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Survey Filter */}
          <div>
            <label htmlFor="surveyFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por encuesta:
            </label>
            <select
              id="surveyFilter"
              value={selectedSurvey}
              onChange={(e) => {
                setSelectedSurvey(e.target.value);
                setSelectedCourse('all');
                setSelectedLetter('all');
                setRecommendations([]);
                setRuntimeApiError(null); // Clear runtime error when changing filters
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Todas las encuestas</option>
              {availableSurveys.map((survey) => (
                <option key={survey.code} value={survey.code}>
                  {survey.name} ({survey.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="courseFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por curso:
            </label>
            <select
              id="courseFilter"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setRecommendations([]);
                setRuntimeApiError(null); // Clear runtime error when changing filters
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={selectedSurveyType === 'teacher'}
            >
              <option value="all">
                {selectedSurveyType === 'teacher' ? 'No aplica' : 'Todos los cursos'}
              </option>
              {selectedSurveyType !== 'teacher' && availableCourses.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="letterFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por letra:
            </label>
            <select
              id="letterFilter"
              value={selectedLetter}
              onChange={(e) => {
                setSelectedLetter(e.target.value);
                setRecommendations([]);
                setRuntimeApiError(null); // Clear runtime error when changing filters
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={selectedSurveyType === 'teacher'}
            >
              <option value="all">
                {selectedSurveyType === 'teacher' ? 'No aplica' : 'Todas las letras'}
              </option>
              {selectedSurveyType !== 'teacher' && availableLetters.map((letter) => (
                <option key={letter} value={letter}>{letter}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedSurvey !== 'all' || (selectedCourse !== 'all' && selectedSurveyType !== 'teacher') || (selectedLetter !== 'all' && selectedSurveyType !== 'teacher')) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Filtros activos:</strong>
              {selectedSurvey !== 'all' && (
                <span className="block">📋 Encuesta: {availableSurveys.find(s => s.code === selectedSurvey)?.name}</span>
              )}
              {selectedCourse !== 'all' && selectedSurveyType !== 'teacher' && ` 📚 Curso: ${selectedCourse}`}
              {selectedCourse !== 'all' && selectedLetter !== 'all' && selectedSurveyType !== 'teacher' && ' • '}
              {selectedLetter !== 'all' && selectedSurveyType !== 'teacher' && ` 📝 Letra: ${selectedLetter}`}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Mostrando {filteredResponses.length} respuestas
            </p>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <button
            onClick={generateRecommendations}
            disabled={loading || filteredResponses.length === 0}
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generando recomendaciones...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Generar Recomendaciones
              </>
            )}
          </button>
          
          {filteredResponses.length === 0 && (
            <p className="text-red-600 text-sm mt-2">
              No hay datos suficientes con los filtros seleccionados
            </p>
          )}
          
          {apiError && (
            <p className="text-amber-600 text-sm mt-2">
              ⚠️ IA no disponible - Se generarán recomendaciones profesionales básicas
            </p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recomendaciones Generadas ({recommendations.length})
            </h3>
            <div className="grid gap-6">
              {recommendations
                .sort((a, b) => {
                  // CAMBIADO: Ordenar por número de pregunta en lugar de prioridad
                  const getNumericValue = (questionNumber: string) => {
                    // Extraer el número base (ej: "24a" -> 24, "2a" -> 2)
                    const match = questionNumber.match(/^(\d+)/);
                    const baseNumber = match ? parseInt(match[1]) : 0;
                    
                    // Si tiene letra (como "24a"), agregar decimal para mantener orden
                    if (questionNumber.includes('a')) return baseNumber + 0.1;
                    if (questionNumber.includes('b')) return baseNumber + 0.2;
                    
                    return baseNumber;
                  };
                  
                  return getNumericValue(a.questionNumber) - getNumericValue(b.questionNumber);
                })
                .map((recommendation, index) => {
                  const allQuestions = getQuestionsForSurveyType(selectedSurveyType);
                  const question = allQuestions.find(q => q.number === recommendation.questionNumber);
                  const SectionIcon = question ? getSectionIcon(question.section) : CheckCircle;
                  
                  return (
                    <div
                      key={index}
                      className={`border-2 rounded-xl p-6 ${getPriorityColor(recommendation.priority)} transition-all hover:shadow-lg`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <SectionIcon className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Pregunta {recommendation.questionNumber}: {recommendation.questionText}
                            </h4>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(recommendation.priority)}`}>
                          {getPriorityText(recommendation.priority)}
                        </span>
                      </div>

                      {recommendation.loading ? (
                        <div className="flex items-center space-x-3 py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                          <span className="text-gray-600">Generando análisis y recomendación...</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Análisis de resultado:</h5>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {recommendation.analysis}
                            </p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Recomendación:</h5>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {recommendation.recommendation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
        <div className="flex items-start space-x-3">
          <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-emerald-900 mb-1">Sobre las recomendaciones:</h4>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>• Diseñadas específicamente para sostenedores y directivos educacionales</li>
              <li>• Incluyen responsables específicos, plazos definidos y métricas de seguimiento</li>
              <li>• Se enfocan en acciones concretas y recursos organizacionales</li>
              <li>• Se muestran en orden numérico de las preguntas para facilitar la revisión</li>
              <li>• Puedes exportar el informe completo en formato PDF para compartir con tu equipo</li>
              {apiError && (
                <li>• Sin configuración de IA, se generan recomendaciones profesionales básicas pero efectivas</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Priority Criteria Explanation - MOVED TO BOTTOM */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Criterios para Determinar Prioridades:</h4>
            
            <div className="space-y-4">
              {/* High Priority */}
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                  <h5 className="font-semibold text-red-800">Alta Prioridad - Requiere acción inmediata:</h5>
                </div>
                <ul className="text-sm text-blue-700 ml-5 space-y-1">
                  <li>• Cualquier reporte de bullying, acoso o violencia física</li>
                  <li>• Presencia de armas en el establecimiento</li>
                  <li>• Más del 30% de estudiantes/docentes con estrés constante</li>
                  <li>• Más del 30% se siente inseguro en el colegio</li>
                  <li>• Acoso hacia docentes por parte de estudiantes</li>
                </ul>
              </div>

              {/* Medium Priority */}
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-amber-600 rounded-full mr-2"></div>
                  <h5 className="font-semibold text-amber-800">Prioridad Media - Requiere atención en el corto plazo:</h5>
                </div>
                <ul className="text-sm text-blue-700 ml-5 space-y-1">
                  <li>• Más del 20% reporta experiencia escolar negativa</li>
                  <li>• Más del 20% de docentes infelices en su trabajo</li>
                  <li>• Más del 20% de estudiantes infelices en el colegio</li>
                  <li>• Presencia de rumores, burlas o nombres ofensivos</li>
                  <li>• Más del 20% con tristeza o soledad frecuente</li>
                  <li>• Testigos de acoso hacia otros (estudiantes o docentes)</li>
                </ul>
              </div>

              {/* Low Priority */}
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-emerald-600 rounded-full mr-2"></div>
                  <h5 className="font-semibold text-emerald-800">Prioridad Baja - Mejoras graduales y preventivas:</h5>
                </div>
                <ul className="text-sm text-blue-700 ml-5 space-y-1">
                  <li>• Aspectos con resultados mayormente positivos</li>
                  <li>• Oportunidades de mejora continua</li>
                  <li>• Fortalecimiento de buenas prácticas existentes</li>
                  <li>• Prevención de problemas futuros</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600">
                <strong>Nota:</strong> Las prioridades se determinan automáticamente según la gravedad y porcentaje de respuestas problemáticas detectadas en cada pregunta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}