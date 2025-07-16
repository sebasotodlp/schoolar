import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, BookOpen, Users, ChevronRight, ArrowRight, BarChart3, Shield, Target, Zap, Award, TrendingUp, CheckCircle, Star, Building, Globe, Lightbulb, ArrowLeft, FileText } from 'lucide-react';
import { AdminSection, SurveyData, SurveyResponse, AdminUser, SurveySection } from './types';
import { Header } from './components/Header';
import { AdminLogin } from './components/AdminLogin';
import { AdminRegister } from './components/AdminRegister';
import { AdminDashboard } from './components/AdminDashboard';
import { SurveyComponent } from './components/SurveyComponent';
import { SurveyLanding } from './components/SurveyLanding';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { saveSurveyResponse, getSurveyResponsesBySchoolCode } from './services/firestoreService';
import { SecureDataManager } from './config/secureData';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeAdminSection, setActiveAdminSection] = useState<AdminSection>('profile');
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [surveyCodeInput, setSurveyCodeInput] = useState('');
  const [surveyData, setSurveyData] = useState<SurveyData>({
    schoolCode: '',
    surveyCode: '',
    course: '',
    letter: '',
    currentSection: 'general',
    surveyType: 'student',
    
    // I. Preguntas Generales
    gender: '',
    disability: '',
    disabilityType: '',
    absenceDays: '',
    
    // I. Preguntas Generales (Profesores)
    teacherAge: '',
    teachingLevel: '',
    
    // II. Experiencia en el establecimiento
    happyAtSchool: '',
    feelPartOfSchool: '',
    generalExperience: '',
    participationOpportunity: '',
    extracurricularActivities: '',
    learningMotivation: '',
    teacherCare: '',
    socialSpace: '',
    
    // II. Experiencia en el establecimiento (Profesores)
    schoolResources: '',
    administrativeSupport: '',
    professionalDevelopment: '',
    inclusiveEnvironment: '',
    teachingMotivation: '',
    teacherRecognition: '',
    teacherHappiness: '',
    
    // III. Seguridad y Bullying
    schoolSafety: '',
    respectTeaching: '',
    conflictResolution: '',
    bullyingProblem: '',
    rumorsSpread: '',
    offensiveNames: '',
    physicalAggression: '',
    appearanceMocking: '',
    weaponSeen: '',
    
    // III. Seguridad y Bullying (Profesores)
    teacherHarassed: '',
    witnessedTeacherHarassment: '',
    witnessedStudentHarassment: '',
    witnessedWeapons: '',
    bullyingProblemTeacher: '',
    needMoreSafetyMeasures: '',
    
    // IV. Salud Mental
    stressFrequency: '',
    sadnessFrequency: '',
    lonelinessFrequency: '',
    consideredProfessionalHelp: '',
    receivedProfessionalHelp: '',
    receivedSchoolProfessionalHelp: '',
    professionalHelpWouldHelp: '',
    peersUnderstanding: '',
    knowWhereToAskHelp: '',
    schoolHasNecessaryTools: '',
    
    // IV. Salud Mental (Profesores)
    teacherStressFrequency: '',
    schoolEmotionalSupport: '',
    schoolWellnessPrograms: '',
    mentalHealthPolicies: '',
    mentalHealthStigma: '',
    
    // V. Consumo de Alcohol y Drogas
    dailyCigarettes: '',
    dailyAlcohol: '',
    electronicCigarette: '',
    cigarettesHealthBad: '',
    electronicCigarettesHealthBad: '',
    marijuanaHealthBad: '',
    excessiveAlcoholHealthBad: '',
    alcoholProblemAtSchool: '',
    drugsProblemAtSchool: '',
    peerPressureSubstances: '',
    
    // V. Consumo de Alcohol y Drogas (Profesores)
    alcoholProblemAtSchoolTeacher: '',
    drugsProblemAtSchoolTeacher: '',
    
    // VI. Limpieza del Establecimiento
    cooperateWithCleanliness: '',
    maintainBathroomClean: '',
    peersCareCleanliness: '',
    classroomCleaningFrequency: '',
    bathroomCleaningFrequency: '',
    bathroomHygieneArticles: '',
    improveFacilitiesCleanliness: '',
    
    // VI. Limpieza del Establecimiento (Profesores)
    teacherCooperateWithCleanliness: '',
    cleanEnvironmentProvided: '',
    improveFacilitiesCleanlinessTeacher: '',
    bathroomHygieneArticlesTeacher: '',
    
    timestamp: 0,
    id: ''
  });
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<{ [key: string]: string }>({});
  const [surveyInfo, setSurveyInfo] = useState<{ [key: string]: any }>({});

  const secureDataManager = SecureDataManager.getInstance();

  // Load survey responses when user logs in
  useEffect(() => {
    if (currentUser) {
      loadSurveyResponses();
    }
  }, [currentUser]);

  const loadSurveyResponses = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const responses = await getSurveyResponsesBySchoolCode(currentUser.schoolCode);
      setSurveyResponses(responses);
    } catch (error) {
      console.error('Error loading survey responses:', error);
      alert('Error al cargar las respuestas de la encuesta');
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolCodeSubmit = async (code: string) => {
    setLoading(true);
    try {
      const validation = await secureDataManager.validateSchoolCode(code);
      if (validation.valid && validation.name) {
        setSurveyData(prev => ({ ...prev, schoolCode: code }));
        setSchoolInfo(prev => ({ ...prev, [code]: validation.name }));
        setSurveyCodeInput('');
        navigate('/survey/code');
      } else {
        alert('Código de colegio inválido. Por favor, verifica el código e intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error validating school code:', error);
      alert('Error al validar el código. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSurveyCodeSubmit = async (code: string) => {
    setLoading(true);
    try {
      const validation = await secureDataManager.validateSurveyCode(code, surveyData.schoolCode);
      if (validation.valid && validation.name) {
        setSurveyData(prev => ({ 
          ...prev, 
          surveyCode: code,
          surveyType: validation.type || 'student'
        }));
        setSurveyInfo(prev => ({ 
          ...prev, 
          [code]: { 
            name: validation.name, 
            description: validation.description,
            type: validation.type || 'student',
            schoolCode: surveyData.schoolCode
          } 
        }));
        setSurveyCodeInput('');
        
        // Navigate based on survey type
        if (validation.type === 'teacher') {
          navigate('/survey/questions');
        } else {
          navigate('/survey/course');
        }
      } else {
        alert('Código de encuesta inválido o no corresponde al colegio seleccionado. Por favor, verifica el código.');
      }
    } catch (error) {
      console.error('Error validating survey code:', error);
      alert('Error al validar el código. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseAndLetterSelection = (course: string, letter: string) => {
    setSurveyData(prev => ({ ...prev, course, letter }));
    navigate('/survey/questions');
  };

  const handleSurveyResponse = (field: string, value: string) => {
    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  const handleSectionChange = (section: SurveySection) => {
    setSurveyData(prev => ({ ...prev, currentSection: section }));
  };

  const handleSurveyComplete = async () => {
    setLoading(true);
    try {
      const newResponse: Omit<SurveyResponse, 'id'> = {
        schoolCode: surveyData.schoolCode,
        surveyCode: surveyData.surveyCode,
        course: surveyData.course,
        letter: surveyData.letter,
        surveyType: surveyData.surveyType,
        gender: surveyData.gender,
        disability: surveyData.disability,
        disabilityType: surveyData.disabilityType,
        absenceDays: surveyData.absenceDays,
        teacherAge: surveyData.teacherAge,
        teachingLevel: surveyData.teachingLevel,
        happyAtSchool: surveyData.happyAtSchool,
        feelPartOfSchool: surveyData.feelPartOfSchool,
        generalExperience: surveyData.generalExperience,
        participationOpportunity: surveyData.participationOpportunity,
        extracurricularActivities: surveyData.extracurricularActivities,
        learningMotivation: surveyData.learningMotivation,
        teacherCare: surveyData.teacherCare,
        socialSpace: surveyData.socialSpace,
        schoolResources: surveyData.schoolResources,
        administrativeSupport: surveyData.administrativeSupport,
        professionalDevelopment: surveyData.professionalDevelopment,
        inclusiveEnvironment: surveyData.inclusiveEnvironment,
        teachingMotivation: surveyData.teachingMotivation,
        teacherRecognition: surveyData.teacherRecognition,
        teacherHappiness: surveyData.teacherHappiness,
        schoolSafety: surveyData.schoolSafety,
        respectTeaching: surveyData.respectTeaching,
        conflictResolution: surveyData.conflictResolution,
        bullyingProblem: surveyData.bullyingProblem,
        rumorsSpread: surveyData.rumorsSpread,
        offensiveNames: surveyData.offensiveNames,
        physicalAggression: surveyData.physicalAggression,
        appearanceMocking: surveyData.appearanceMocking,
        weaponSeen: surveyData.weaponSeen,
        teacherHarassed: surveyData.teacherHarassed,
        witnessedTeacherHarassment: surveyData.witnessedTeacherHarassment,
        witnessedStudentHarassment: surveyData.witnessedStudentHarassment,
        witnessedWeapons: surveyData.witnessedWeapons,
        bullyingProblemTeacher: surveyData.bullyingProblemTeacher,
        needMoreSafetyMeasures: surveyData.needMoreSafetyMeasures,
        stressFrequency: surveyData.stressFrequency,
        sadnessFrequency: surveyData.sadnessFrequency,
        lonelinessFrequency: surveyData.lonelinessFrequency,
        consideredProfessionalHelp: surveyData.consideredProfessionalHelp,
        receivedProfessionalHelp: surveyData.receivedProfessionalHelp,
        receivedSchoolProfessionalHelp: surveyData.receivedSchoolProfessionalHelp,
        professionalHelpWouldHelp: surveyData.professionalHelpWouldHelp,
        peersUnderstanding: surveyData.peersUnderstanding,
        knowWhereToAskHelp: surveyData.knowWhereToAskHelp,
        schoolHasNecessaryTools: surveyData.schoolHasNecessaryTools,
        teacherStressFrequency: surveyData.teacherStressFrequency,
        schoolEmotionalSupport: surveyData.schoolEmotionalSupport,
        schoolWellnessPrograms: surveyData.schoolWellnessPrograms,
        mentalHealthPolicies: surveyData.mentalHealthPolicies,
        mentalHealthStigma: surveyData.mentalHealthStigma,
        dailyCigarettes: surveyData.dailyCigarettes,
        dailyAlcohol: surveyData.dailyAlcohol,
        electronicCigarette: surveyData.electronicCigarette,
        cigarettesHealthBad: surveyData.cigarettesHealthBad,
        electronicCigarettesHealthBad: surveyData.electronicCigarettesHealthBad,
        marijuanaHealthBad: surveyData.marijuanaHealthBad,
        excessiveAlcoholHealthBad: surveyData.excessiveAlcoholHealthBad,
        alcoholProblemAtSchool: surveyData.alcoholProblemAtSchool,
        drugsProblemAtSchool: surveyData.drugsProblemAtSchool,
        peerPressureSubstances: surveyData.peerPressureSubstances,
        alcoholProblemAtSchoolTeacher: surveyData.alcoholProblemAtSchoolTeacher,
        drugsProblemAtSchoolTeacher: surveyData.drugsProblemAtSchoolTeacher,
        cooperateWithCleanliness: surveyData.cooperateWithCleanliness,
        maintainBathroomClean: surveyData.maintainBathroomClean,
        peersCareCleanliness: surveyData.peersCareCleanliness,
        classroomCleaningFrequency: surveyData.classroomCleaningFrequency,
        bathroomCleaningFrequency: surveyData.bathroomCleaningFrequency,
        bathroomHygieneArticles: surveyData.bathroomHygieneArticles,
        improveFacilitiesCleanliness: surveyData.improveFacilitiesCleanliness,
        teacherCooperateWithCleanliness: surveyData.teacherCooperateWithCleanliness,
        cleanEnvironmentProvided: surveyData.cleanEnvironmentProvided,
        improveFacilitiesCleanlinessTeacher: surveyData.improveFacilitiesCleanlinessTeacher,
        bathroomHygieneArticlesTeacher: surveyData.bathroomHygieneArticlesTeacher,
        timestamp: Date.now()
      };
      
      console.log('Saving survey response:', newResponse);
      await saveSurveyResponse(newResponse);
      navigate('/survey/complete');
    } catch (error) {
      console.error('Error saving survey response:', error);
      alert('Error al guardar la respuesta. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetSurvey = () => {
    setSurveyData({ 
      schoolCode: '',
      surveyCode: '',
      course: '',
      letter: '',
      currentSection: 'general',
      surveyType: 'student',
      gender: '',
      disability: '',
      disabilityType: '',
      absenceDays: '',
      teacherAge: '',
      teachingLevel: '',
      happyAtSchool: '',
      feelPartOfSchool: '',
      generalExperience: '',
      participationOpportunity: '',
      extracurricularActivities: '',
      learningMotivation: '',
      teacherCare: '',
      socialSpace: '',
      schoolResources: '',
      administrativeSupport: '',
      professionalDevelopment: '',
      inclusiveEnvironment: '',
      teachingMotivation: '',
      teacherRecognition: '',
      teacherHappiness: '',
      schoolSafety: '',
      respectTeaching: '',
      conflictResolution: '',
      bullyingProblem: '',
      rumorsSpread: '',
      offensiveNames: '',
      physicalAggression: '',
      appearanceMocking: '',
      weaponSeen: '',
      teacherHarassed: '',
      witnessedTeacherHarassment: '',
      witnessedStudentHarassment: '',
      witnessedWeapons: '',
      bullyingProblemTeacher: '',
      needMoreSafetyMeasures: '',
      stressFrequency: '',
      sadnessFrequency: '',
      lonelinessFrequency: '',
      consideredProfessionalHelp: '',
      receivedProfessionalHelp: '',
      receivedSchoolProfessionalHelp: '',
      professionalHelpWouldHelp: '',
      peersUnderstanding: '',
      knowWhereToAskHelp: '',
      schoolHasNecessaryTools: '',
      teacherStressFrequency: '',
      schoolEmotionalSupport: '',
      schoolWellnessPrograms: '',
      mentalHealthPolicies: '',
      mentalHealthStigma: '',
      dailyCigarettes: '',
      dailyAlcohol: '',
      electronicCigarette: '',
      cigarettesHealthBad: '',
      electronicCigarettesHealthBad: '',
      marijuanaHealthBad: '',
      excessiveAlcoholHealthBad: '',
      alcoholProblemAtSchool: '',
      drugsProblemAtSchool: '',
      peerPressureSubstances: '',
      alcoholProblemAtSchoolTeacher: '',
      drugsProblemAtSchoolTeacher: '',
      cooperateWithCleanliness: '',
      maintainBathroomClean: '',
      peersCareCleanliness: '',
      classroomCleaningFrequency: '',
      bathroomCleaningFrequency: '',
      bathroomHygieneArticles: '',
      improveFacilitiesCleanliness: '',
      teacherCooperateWithCleanliness: '',
      cleanEnvironmentProvided: '',
      improveFacilitiesCleanlinessTeacher: '',
      bathroomHygieneArticlesTeacher: '',
      timestamp: 0,
      id: ''
    });
    setSurveyCodeInput('');
    setSchoolInfo({});
    setSurveyInfo({});
    navigate('/');
  };

  const handleAdminLogin = (user: AdminUser) => {
    setCurrentUser(user);
    setActiveAdminSection('profile');
    navigate('/admin/dashboard');
  };

  const handleAdminRegister = (user: AdminUser) => {
    setCurrentUser(user);
    setActiveAdminSection('profile');
    navigate('/admin/dashboard');
  };

  const handleAdminLogout = () => {
    setCurrentUser(null);
    setSurveyResponses([]);
    navigate('/');
  };

  // Auto-redirect to landing page after completing survey
  useEffect(() => {
    if (location.pathname === '/survey/complete') {
      const timer = setTimeout(() => {
        resetSurvey();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8">
              Transforma tu
              <span className="block text-emerald-600">Gestión Educativa</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
              Potencia el éxito de tu institución con un análisis profundo del ambiente escolar. 
              Datos precisos, decisiones inteligentes, resultados extraordinarios.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/contact')}
                className="group inline-flex items-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Solicitar Demo
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/survey')}
                className="inline-flex items-center px-8 py-4 bg-white hover:bg-gray-50 text-emerald-600 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl border-2 border-emerald-600 transition-all duration-200"
              >
                Ingresar a tu Encuesta
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir <strong className="text-emerald-600 font-bold">schoolar</strong>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transformamos la gestión educativa con datos precisos del ambiente escolar, generando inteligencia accionable que mejora el bienestar y el rendimiento académico.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 rounded-2xl border border-emerald-200 hover:shadow-lg transition-shadow text-center">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Análisis Profundo</h3>
              <p className="text-gray-700">
                Visualiza la información en dashboards intuitivos. Identifica tendencias, 
                patrones y oportunidades de mejora con análisis avanzado.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border border-blue-200 hover:shadow-lg transition-shadow text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Seguridad Total</h3>
              <p className="text-gray-700">
                Protección de datos de nivel empresarial. Cumplimiento con normativas de privacidad para garantizar la confidencialidad.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl border border-purple-200 hover:shadow-lg transition-shadow text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Resultados Medibles</h3>
              <p className="text-gray-700">
                Métricas claras de impacto para apoyarte
                en mejoras educativas con datos concretos y reportes ejecutivos.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl border border-orange-200 hover:shadow-lg transition-shadow text-center">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Implementación Rápida</h3>
              <p className="text-gray-700">
                Configuración en menos de 24 horas. Nuestro equipo te acompaña en cada paso 
                para garantizar una adopción exitosa y sin interrupciones.
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-2xl border border-teal-200 hover:shadow-lg transition-shadow text-center">
              <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Participación Masiva</h3>
              <p className="text-gray-700">
                Encuestas diseñadas para maximizar la participación estudiantil. 
                Interfaz amigable que garantiza respuestas honestas y representativas.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl border border-red-200 hover:shadow-lg transition-shadow text-center">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Soporte
            </h3>
              <p className="text-gray-700">
                Acompañamiento especializado. Capacitación continua y consultoría 
                estratégica para maximizar el impacto de tus decisiones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Resultados que Hablan por sí Solos
            </h2>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
              Más de X instituciones confían en schoolar para transformar su gestión educativa
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">X</div>
              <div className="text-emerald-100 text-lg">Colegios Conectados</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">X</div>
              <div className="text-emerald-100 text-lg">Encuestas Respondidas</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">X</div>
              <div className="text-emerald-100 text-lg">Satisfacción de Clientes</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">40%</div>
              <div className="text-emerald-100 text-lg">Mejora en Indicadores</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Adaptado para ocupar todo el ancho */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Impulsa el éxito de tu Institución
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-12">
              schoolar te proporciona las herramientas necesarias para tomar decisiones 
              estratégicas basadas en datos reales del ambiente escolar.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Mejora Continua</h3>
                  <p className="text-gray-600">
                    Identifica áreas de oportunidad y mide el impacto de las mejoras implementadas.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión Integral</h3>
                  <p className="text-gray-600">
                    Administra múltiples sedes desde una sola plataforma con datos centralizados.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Universal</h3>
                  <p className="text-gray-600">
                    Plataforma web accesible desde cualquier dispositivo, en cualquier momento.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Datos Confiables</h3>
                  <p className="text-gray-600">
                    Información precisa y actualizada para tomar decisiones informadas.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Análisis Avanzado</h3>
                  <p className="text-gray-600">
                    Herramientas de análisis que revelan patrones y tendencias importantes.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Resultados Medibles</h3>
                  <p className="text-gray-600">
                    Métricas claras que demuestran el impacto de las mejoras implementadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-12 text-white">
            <Lightbulb className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-6">
              ¿Listo para Revolucionar tu Gestión Educativa?
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Únete al grupo de instituciones que ya están transformando su ambiente escolar 
              con datos precisos y análisis inteligente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/contact')}
                className="inline-flex items-center px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Solicitar Demo Gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/survey')}
                className="inline-flex items-center px-8 py-4 bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-800 transition-colors"
              >
                Explorar Encuesta
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-xl font-bold text-emerald-600">schoolar</span>
              </div>
              <p className="text-gray-400">
                Transformando la gestión educativa a través de datos inteligentes y análisis profundo.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate('/survey')} className="hover:text-white transition-colors">Encuestas</button></li>
                <li><button className="hover:text-white transition-colors">Analytics</button></li>
                <li><button className="hover:text-white transition-colors">Reportes</button></li>
                <li><button className="hover:text-white transition-colors">Integraciones</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate('/about')} className="hover:text-white transition-colors">Acerca de</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-white transition-colors">Contacto</button></li>
                <li><button className="hover:text-white transition-colors">Carreras</button></li>
                <li><button className="hover:text-white transition-colors">Blog</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button className="hover:text-white transition-colors">Centro de Ayuda</button></li>
                <li><button className="hover:text-white transition-colors">Documentación</button></li>
                <li><button className="hover:text-white transition-colors">Estado del Sistema</button></li>
                <li><button onClick={() => navigate('/admin/login')} className="hover:text-white transition-colors">Portal Admin</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 schoolar. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );

  // School Code Page Component
  const SchoolCodePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/survey')}
          className="flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </button>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Paso 1 de 4</span>
            <span>25%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* School Code Input */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Código del Colegio</h2>
            <p className="text-gray-600">Ingresa el código proporcionado por tu institución</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const code = formData.get('schoolCode') as string;
            handleSchoolCodeSubmit(code.toUpperCase());
          }} className="space-y-6">
            <div>
              <label htmlFor="schoolCode" className="block text-sm font-medium text-gray-700 mb-2">
                Código del Colegio
              </label>
              <input
                type="text"
                id="schoolCode"
                name="schoolCode"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-center text-lg font-mono uppercase"
                placeholder="Ej: PRB123"
                required
                maxLength={10}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm text-emerald-700 text-center">
              <strong>¿No tienes el código?</strong><br />
              Contacta a tu coordinador académico o administración del colegio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Survey Code Page Component
  const SurveyCodePage = () => {
    const [localSurveyCodeInput, setLocalSurveyCodeInput] = useState('');

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate('/survey/school')}
            className="flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </button>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Paso 2 de 4</span>
              <span>50%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '50%' }}></div>
            </div>
          </div>

          {/* Survey Code Input */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Código de Encuesta</h2>
              <p className="text-gray-600">Ingresa el código específico de la encuesta</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSurveyCodeSubmit(localSurveyCodeInput.toUpperCase());
            }} className="space-y-6">
              <div>
                <label htmlFor="surveyCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Encuesta
                </label>
                <input
                  type="text"
                  id="surveyCode"
                  name="surveyCode"
                  value={localSurveyCodeInput}
                  onChange={(e) => setLocalSurveyCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-center text-lg font-mono uppercase"
                  placeholder="Ej: PAA123"
                  required
                  maxLength={10}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Verificando...' : 'Continuar'}
              </button>
            </form>

            {/* School Info */}
            {schoolInfo[surveyData.schoolCode] && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-700">
                  <span className="font-medium">Colegio:</span> {schoolInfo[surveyData.schoolCode]}
                </p>
              </div>
            )}

            {/* Available Survey Codes for this school */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 text-center">
                <strong>¿No tienes el código de encuesta?</strong><br />
                Contacta a tu coordinador académico para obtener el código específico de la encuesta activa.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Course Selection Page Component
  const CourseSelectionPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/survey/code')}
          className="flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </button>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Paso 3 de 4</span>
            <span>75%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Course and Letter Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Información del Curso</h2>
            <p className="text-gray-600">Selecciona tu curso y letra</p>
          </div>

          <div className="space-y-8">
            {/* Course Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">¿En qué curso estás?</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Cuarto básico', 'Quinto básico', 'Sexto básico', 'Séptimo básico', 'Octavo básico', 'Primero medio', 'Segundo medio', 'Tercero medio', 'Cuarto medio'].map((course) => (
                  <button
                    key={course}
                    onClick={() => setSurveyData(prev => ({ ...prev, course }))}
                    className={`p-3 text-center rounded-lg border-2 transition-all ${
                      surveyData.course === course
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50'
                    }`}
                    disabled={loading}
                  >
                    {course}
                  </button>
                ))}
              </div>
            </div>

            {/* Letter Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">¿En qué letra estás?</h3>
              <div className="grid grid-cols-5 gap-3">
                {['A', 'B', 'C', 'D', 'TP'].map((letter) => (
                  <button
                    key={letter}
                    onClick={() => setSurveyData(prev => ({ ...prev, letter }))}
                    className={`p-3 text-center rounded-lg border-2 transition-all ${
                      surveyData.letter === letter
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50'
                    }`}
                    disabled={loading}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={() => handleCourseAndLetterSelection(surveyData.course, surveyData.letter)}
              disabled={!surveyData.course || !surveyData.letter || loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cargando...' : 'Continuar'}
            </button>
          </div>

          {/* Survey Info */}
          <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="space-y-1">
              {schoolInfo[surveyData.schoolCode] && (
                <p className="text-sm text-emerald-700">
                  <span className="font-medium">Colegio:</span> {schoolInfo[surveyData.schoolCode]}
                </p>
              )}
              {surveyInfo[surveyData.surveyCode] && (
                <p className="text-sm text-emerald-700">
                  <span className="font-medium">Encuesta:</span> {surveyInfo[surveyData.surveyCode].name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Survey Complete Page Component
  const SurveyCompletePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Encuesta Completada!</h2>
          <p className="text-gray-600 mb-8">
            Gracias por tu participación. Tus respuestas nos ayudarán a mejorar el ambiente escolar en todas sus dimensiones.
          </p>

          {/* Summary */}
          <div className="bg-emerald-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">Resumen de tu participación:</h3>
            <div className="space-y-2">
              {schoolInfo[surveyData.schoolCode] && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Colegio:</span> {schoolInfo[surveyData.schoolCode]}
                </p>
              )}
              {surveyInfo[surveyData.surveyCode] && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Encuesta:</span> {surveyInfo[surveyData.surveyCode].name}
                </p>
              )}
              {surveyData.surveyType === 'student' && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Curso:</span> {surveyData.course} {surveyData.letter}
                </p>
              )}
              <p className="text-sm text-gray-700">
                <span className="font-medium">Tipo:</span> {surveyData.surveyType === 'teacher' ? 'Encuesta Docente' : 'Encuesta Estudiante'}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Secciones completadas:</span> 6 de 6
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Fecha:</span> {new Date().toLocaleDateString('es-CL')}
              </p>
            </div>
          </div>

          {/* Auto-redirect message */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              Serás redirigido automáticamente al inicio en unos segundos...
            </p>
          </div>

          <button
            onClick={resetSurvey}
            className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/survey" element={<SurveyLanding />} />
      <Route path="/survey/school" element={<SchoolCodePage />} />
      <Route path="/survey/code" element={<SurveyCodePage />} />
      <Route path="/survey/course" element={<CourseSelectionPage />} />
      <Route path="/survey/questions" element={
        <SurveyComponent
          surveyData={surveyData}
          onSurveyResponse={handleSurveyResponse}
          onSectionChange={handleSectionChange}
          onComplete={handleSurveyComplete}
          loading={loading}
          validSchoolCodes={schoolInfo}
          validSurveyCodes={surveyInfo}
        />
      } />
      <Route path="/survey/complete" element={<SurveyCompletePage />} />
      <Route path="/admin/login" element={<AdminLogin onLogin={handleAdminLogin} />} />
      <Route path="/admin/register" element={<AdminRegister onRegister={handleAdminRegister} />} />
      <Route path="/admin/dashboard" element={
        <AdminDashboard
          activeSection={activeAdminSection}
          onSectionChange={setActiveAdminSection}
          onLogout={handleAdminLogout}
          surveyResponses={surveyResponses}
          currentUser={currentUser}
          loading={loading}
          onRefreshData={loadSurveyResponses}
          validSurveyCodes={surveyInfo}
        />
      } />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
    </Routes>
  );
}

export default App;