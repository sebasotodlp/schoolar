import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Users, Shield, Heart, Brain, Sparkles, Wine, Droplets } from 'lucide-react';
import { SurveyData, SurveySection, CustomSurvey } from '../types';
import { getActiveSurveyByCode } from '../services/customSurveyService';

interface SurveyComponentProps {
  surveyData: SurveyData;
  onSurveyResponse: (field: string, value: string) => void;
  onSectionChange: (section: SurveySection) => void;
  onComplete: () => void;
  loading: boolean;
  validSchoolCodes: Record<string, string>;
  validSurveyCodes: Record<string, any>;
}

export function SurveyComponent({
  surveyData,
  onSurveyResponse,
  onSectionChange,
  onComplete,
  loading,
  validSchoolCodes,
  validSurveyCodes
}: SurveyComponentProps) {
  const navigate = useNavigate();
  const [customSurvey, setCustomSurvey] = useState<CustomSurvey | null>(null);
  const [isCustomSurvey, setIsCustomSurvey] = useState(false);
  const [loadingCustomSurvey, setLoadingCustomSurvey] = useState(true);
  
  // PREDEFINED SURVEY CODES - ONLY THESE SHOW STANDARD QUESTIONS
  const PREDEFINED_SURVEYS = ['EAE123', 'EAE1234', 'PRU123'];
  
  const sections = [
    { id: 'general', name: 'I. Preguntas Generales', icon: Users, color: 'emerald' },
    { id: 'experience', name: 'II. Experiencia en el Establecimiento', icon: Shield, color: 'blue' },
    { id: 'security', name: 'III. Seguridad y Bullying', icon: Heart, color: 'red' },
    { id: 'mental-health', name: 'IV. Salud Mental', icon: Brain, color: 'purple' },
    { id: 'alcohol-drugs', name: 'V. Consumo de Alcohol y Drogas', icon: Wine, color: 'orange' },
    { id: 'cleanliness', name: 'VI. Limpieza del Establecimiento', icon: Droplets, color: 'teal' }
  ];

  const currentSectionIndex = sections.findIndex(s => s.id === surveyData.currentSection);
  const currentSection = sections[currentSectionIndex];

  // Check if this is a custom survey on component mount
  useEffect(() => {
    const checkCustomSurvey = async () => {
      setLoadingCustomSurvey(true);
      
      // STEP 1: Check if it's a predefined survey
      if (PREDEFINED_SURVEYS.includes(surveyData.surveyCode)) {
        console.log(`Survey ${surveyData.surveyCode} is PREDEFINED - showing standard questions`);
        setIsCustomSurvey(false);
        setCustomSurvey(null);
        setLoadingCustomSurvey(false);
        return;
      }

      // STEP 2: If not predefined, it's definitely custom
      console.log(`Survey ${surveyData.surveyCode} is CUSTOM - checking for custom questions`);
      setIsCustomSurvey(true);

      try {
        // Try to load custom survey data
        const customSurveyData = await getActiveSurveyByCode(surveyData.surveyCode, surveyData.schoolCode);
        
        if (customSurveyData) {
          console.log('Custom survey data loaded:', customSurveyData);
          setCustomSurvey(customSurveyData);
        } else {
          console.log('No custom survey data found - this is a custom survey without questions defined yet');
          setCustomSurvey(null);
        }
      } catch (error) {
        console.error('Error loading custom survey:', error);
        setCustomSurvey(null);
      }
      
      setLoadingCustomSurvey(false);
    };

    if (surveyData.surveyCode && surveyData.schoolCode) {
      checkCustomSurvey();
    }
  }, [surveyData.surveyCode, surveyData.schoolCode]);

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [surveyData.currentSection]);

  const isSectionComplete = (sectionId: string) => {
    // For custom surveys without defined questions, always return true
    if (isCustomSurvey && !customSurvey) {
      return true;
    }

    // For custom surveys with defined questions, check custom completion logic
    if (isCustomSurvey && customSurvey) {
      // TODO: Implement custom survey completion logic based on customSurvey.sections
      return true;
    }

    // For predefined surveys, use existing logic
    if (surveyData.surveyType === 'teacher') {
      switch (sectionId) {
        case 'general':
          return surveyData.gender && surveyData.disability && surveyData.teacherAge && surveyData.teachingLevel &&
                 (surveyData.disability !== "Sí" || surveyData.disabilityType);
        case 'experience':
          return surveyData.schoolResources && surveyData.administrativeSupport && 
                 surveyData.professionalDevelopment && surveyData.inclusiveEnvironment &&
                 surveyData.teachingMotivation && surveyData.teacherRecognition &&
                 surveyData.teacherHappiness;
        case 'security':
          return surveyData.teacherHarassed && surveyData.witnessedTeacherHarassment && 
                 surveyData.witnessedStudentHarassment && surveyData.witnessedWeapons &&
                 surveyData.bullyingProblemTeacher && surveyData.needMoreSafetyMeasures;
        case 'mental-health':
          return surveyData.teacherStressFrequency && surveyData.schoolEmotionalSupport && 
                 surveyData.schoolWellnessPrograms && surveyData.mentalHealthPolicies &&
                 surveyData.mentalHealthStigma;
        case 'alcohol-drugs':
          return surveyData.alcoholProblemAtSchoolTeacher && surveyData.drugsProblemAtSchoolTeacher;
        case 'cleanliness':
          return surveyData.teacherCooperateWithCleanliness && surveyData.cleanEnvironmentProvided &&
                 surveyData.improveFacilitiesCleanlinessTeacher && surveyData.bathroomHygieneArticlesTeacher;
        default:
          return false;
      }
    } else {
      // Student survey logic (existing)
      switch (sectionId) {
        case 'general':
          return surveyData.gender && surveyData.disability && surveyData.absenceDays &&
                 (surveyData.disability !== "Sí" || surveyData.disabilityType);
        case 'experience':
          return surveyData.happyAtSchool && surveyData.feelPartOfSchool && 
                 surveyData.generalExperience && surveyData.participationOpportunity &&
                 surveyData.extracurricularActivities && surveyData.learningMotivation &&
                 surveyData.teacherCare && surveyData.socialSpace;
        case 'security':
          return surveyData.schoolSafety && surveyData.respectTeaching && 
                 surveyData.conflictResolution && surveyData.bullyingProblem &&
                 surveyData.rumorsSpread && surveyData.offensiveNames &&
                 surveyData.physicalAggression && surveyData.appearanceMocking &&
                 surveyData.weaponSeen;
        case 'mental-health':
          return surveyData.stressFrequency && surveyData.sadnessFrequency && 
                 surveyData.lonelinessFrequency && surveyData.consideredProfessionalHelp &&
                 surveyData.professionalHelpWouldHelp && surveyData.peersUnderstanding &&
                 surveyData.knowWhereToAskHelp && surveyData.schoolHasNecessaryTools &&
                 (surveyData.consideredProfessionalHelp !== "Sí" || surveyData.receivedProfessionalHelp) &&
                 (surveyData.receivedProfessionalHelp !== "Sí" || surveyData.receivedSchoolProfessionalHelp);
        case 'alcohol-drugs':
          return surveyData.cigarettesHealthBad &&
                 surveyData.electronicCigarettesHealthBad && surveyData.marijuanaHealthBad &&
                 surveyData.excessiveAlcoholHealthBad && surveyData.alcoholProblemAtSchool &&
                 surveyData.drugsProblemAtSchool && surveyData.peerPressureSubstances;
        case 'cleanliness':
          return surveyData.cooperateWithCleanliness && surveyData.maintainBathroomClean &&
                 surveyData.peersCareCleanliness && surveyData.classroomCleaningFrequency &&
                 surveyData.bathroomCleaningFrequency && surveyData.bathroomHygieneArticles &&
                 surveyData.improveFacilitiesCleanliness;
        default:
          return false;
      }
    }
  };

  const isCurrentSectionComplete = () => {
    return isSectionComplete(surveyData.currentSection);
  };

  const canNavigateToSection = (targetSectionId: string) => {
    const targetIndex = sections.findIndex(s => s.id === targetSectionId);
    const currentIndex = currentSectionIndex;
    
    // Always allow navigation to current section
    if (targetIndex === currentIndex) return true;
    
    // Allow navigation to previous sections if they are complete
    if (targetIndex < currentIndex) {
      return isSectionComplete(targetSectionId);
    }
    
    // Allow navigation to next section only if current section is complete
    if (targetIndex === currentIndex + 1) {
      return isCurrentSectionComplete();
    }
    
    // For sections further ahead, check if all previous sections are complete
    for (let i = 0; i < targetIndex; i++) {
      if (!isSectionComplete(sections[i].id)) {
        return false;
      }
    }
    
    return true;
  };

  const areAllSectionsComplete = () => {
    return sections.every(section => isSectionComplete(section.id));
  };

  const handleSectionClick = (sectionId: string) => {
    if (canNavigateToSection(sectionId)) {
      onSectionChange(sectionId as SurveySection);
    }
  };

  const handleNext = () => {
    if (currentSectionIndex < sections.length - 1) {
      onSectionChange(sections[currentSectionIndex + 1].id as SurveySection);
    } else {
      if (areAllSectionsComplete()) {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      onSectionChange(sections[currentSectionIndex - 1].id as SurveySection);
    }
  };

  const renderQuestion = (
    questionNumber: string,
    questionText: string,
    field: string,
    options: string[],
    required: boolean = true
  ) => (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
        <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold mr-3">
          {questionNumber}
        </span>
        {questionText}
        {required && <span className="text-red-500 ml-2">*</span>}
      </h3>
      <div className="space-y-4">
        {options.map((option) => (
          <label key={option} className="group flex items-center space-x-4 cursor-pointer p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200">
            <input
              type="radio"
              name={field}
              value={option}
              checked={surveyData[field as keyof SurveyData] === option}
              onChange={(e) => onSurveyResponse(field, e.target.value)}
              className="w-5 h-5 text-emerald-600 border-2 border-gray-300 focus:ring-emerald-500 focus:ring-2"
            />
            <span className="text-gray-800 font-medium group-hover:text-emerald-700 transition-colors">
              {option}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderConditionalQuestion = (
    questionNumber: string,
    questionText: string,
    field: string,
    options: string[],
    condition: boolean
  ) => {
    if (!condition) return null;
    return renderQuestion(questionNumber, questionText, field, options);
  };

  const renderCustomSurveyContent = () => {
    if (loadingCustomSurvey) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando encuesta personalizada...</p>
        </div>
      );
    }

    if (!customSurvey) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Encuesta Personalizada Sin Configurar</h3>
          <p className="text-gray-600 mb-6">
            Esta es una encuesta personalizada que aún no ha sido configurada con preguntas específicas.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Para el administrador:</strong> Esta encuesta necesita ser configurada en la sección 
              "Gestión de Encuestas\" del panel administrativo antes de poder ser utilizada.
            </p>
          </div>
        </div>
      );
    }

    // Render custom survey questions based on customSurvey.sections
    const currentCustomSection = customSurvey.sections.find(s => s.id === surveyData.currentSection);
    
    if (!currentCustomSection) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
          <p className="text-gray-600">No hay preguntas definidas para esta sección.</p>
        </div>
      );
    }

    return (
      <div>
        {currentCustomSection.questions.map((question) => {
          // Check conditional logic
          if (question.isConditional && question.conditionalField && question.conditionalValue) {
            const conditionMet = surveyData[question.conditionalField as keyof SurveyData] === question.conditionalValue;
            if (!conditionMet) return null;
          }

          return renderQuestion(
            question.questionNumber,
            question.questionText,
            question.fieldName,
            question.options,
            question.required
          );
        })}
      </div>
    );
  };

  const renderSectionContent = () => {
    // CRITICAL: If this is a custom survey, NEVER show standard questions
    if (isCustomSurvey) {
      console.log('Rendering CUSTOM survey content for:', surveyData.surveyCode);
      return renderCustomSurveyContent();
    }

    // ONLY show standard questions for predefined surveys
    console.log('Rendering STANDARD survey content for:', surveyData.surveyCode);
    
    if (surveyData.surveyType === 'teacher') {
      switch (surveyData.currentSection) {
        case 'general':
          return (
            <div>
              {renderQuestion(
                "1",
                "¿Con cuál género te identificas?",
                "gender",
                ["Femenino", "Masculino", "Transgénero", "Otro"]
              )}
              
              {renderQuestion(
                "2",
                "¿Presentas algún tipo de discapacidad?",
                "disability",
                ["Sí", "No", "No lo sé"]
              )}
              
              {renderConditionalQuestion(
                "2a",
                "Si tu respuesta anterior fue 'Sí', ¿qué tipo de discapacidad presentas?",
                "disabilityType",
                ["Física", "Intelectual", "Sensorial (visual o auditiva)", "Psíquica", "Múltiple"],
                surveyData.disability === "Sí"
              )}
              
              {renderQuestion(
                "3",
                "¿Cuál es tu edad?",
                "teacherAge",
                ["Menor a 30 años", "Entre 30 y 39 años", "Entre 40 y 49 años", "Mayor a 49 años"]
              )}
              
              {renderQuestion(
                "4",
                "¿En qué nivel enseñas?",
                "teachingLevel",
                ["Básica", "Media", "Ambas"]
              )}
            </div>
          );

        case 'experience':
          return (
            <div>
              {renderQuestion(
                "5",
                "El establecimiento escolar proporciona suficientes recursos y materiales didácticos para apoyar la enseñanza del profesor.",
                "schoolResources",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "6",
                "El personal administrativo constantemente brinda apoyo y colaboración al profesor en su labor docente.",
                "administrativeSupport",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "7",
                "El establecimiento escolar ofrece oportunidades de desarrollo profesional para que el profesor mejore sus habilidades pedagógicas.",
                "professionalDevelopment",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "8",
                "El establecimiento escolar promueve un ambiente inclusivo y diverso que respeta las diferencias culturales de los docentes y estudiantes.",
                "inclusiveEnvironment",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "9",
                "¿Te sientes motivado y entusiasmado en tu labor docente dentro del establecimiento escolar?",
                "teachingMotivation",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "10",
                "¿Te sientes valorado y reconocido por tu trabajo en el establecimiento escolar?",
                "teacherRecognition",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "11",
                "En general, ¿te sientes feliz con tu experiencia laboral en este colegio?",
                "teacherHappiness",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
            </div>
          );

        case 'security':
          return (
            <div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-blue-900 font-semibold">
                    Durante este semestre...
                  </p>
                </div>
                <p className="text-blue-800 mt-2">
                  Las siguientes preguntas se refieren a experiencias que hayas vivido en el colegio durante este período académico.
                </p>
              </div>
              
              {renderQuestion(
                "12",
                "Durante este semestre... ¿Has sido objeto de comportamientos dañinos por parte de estudiantes en el colegio que te hayan hecho sentir incómodo, amenazado o humillado?",
                "teacherHarassed",
                ["Sí", "No", "No estoy seguro/a"]
              )}
              
              {renderQuestion(
                "13",
                "Durante este semestre... ¿Has presenciado alguna situación de acoso, maltrato o humillación en el colegio hacia algún docente?",
                "witnessedTeacherHarassment",
                ["Sí", "No", "No estoy seguro/a"]
              )}
              
              {renderQuestion(
                "14",
                "Durante este semestre... ¿Has presenciado alguna situación de acoso, maltrato o humillación en el colegio hacia algún estudiante?",
                "witnessedStudentHarassment",
                ["Sí", "No", "No estoy seguro/a"]
              )}
              
              {renderQuestion(
                "15",
                "Durante este semestre... ¿Viste a algún estudiante con algún arma de fuego o un arma blanca (cuchillo, navaja o cualquier instrumento que posea empuñadura y hoja metálica con bordes cortantes)?",
                "witnessedWeapons",
                ["Sí", "No", "No estoy seguro/a"]
              )}
              
              {renderQuestion(
                "16",
                "¿Consideras que el Bullying es un problema en tu colegio?",
                "bullyingProblemTeacher",
                ["Sí", "No", "No estoy seguro/a"]
              )}
              
              {renderQuestion(
                "17",
                "¿Consideras que el colegio debiese implementar más medidas para prevenir el acoso y violencia escolar en tu colegio?",
                "needMoreSafetyMeasures",
                ["Sí", "No", "No estoy seguro/a"]
              )}
            </div>
          );

        case 'mental-health':
          return (
            <div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-purple-900 font-semibold">
                    Durante este semestre...
                  </p>
                </div>
                <p className="text-purple-800 mt-2">
                  Las siguientes preguntas se refieren a tu bienestar emocional y mental durante este período académico.
                </p>
              </div>
              
              {renderQuestion(
                "17",
                "Durante este semestre... ¿qué tan seguido te has sentido estresado, solo o triste?",
                "teacherStressFrequency",
                ["Constantemente", "De vez en cuando", "Nunca"]
              )}
              
              {renderQuestion(
                "18",
                "¿Te sientes apoyado/a por el colegio en cuanto a tu bienestar emocional y salud mental?",
                "schoolEmotionalSupport",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "19",
                "¿El colegio ofrece recursos y programas de apoyo para promover el bienestar emocional y el auto-cuidado de los profesores?",
                "schoolWellnessPrograms",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "20",
                "¿Te sientes satisfecho/a con las políticas y programas implementados por el colegio en relación con la salud mental de los profesores?",
                "mentalHealthPolicies",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "21",
                "¿Piensas que el colegio está comprometido en abordar la estigmatización y los prejuicios asociados con problemas de salud mental?",
                "mentalHealthStigma",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
            </div>
          );

        case 'alcohol-drugs':
          return (
            <div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 mb-8 border border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-orange-600" />
                  </div>
                  <p className="text-orange-900 font-semibold">
                    Recordatorio de Confidencialidad
                  </p>
                </div>
                <p className="text-orange-800 mt-2">
                  Como recordatorio, tus respuestas serán totalmente anónimas y en ningún momento pasarán por manos de los directivos. Así que te pedimos por favor ser lo más sincero posible.
                </p>
              </div>
              
              {renderQuestion(
                "22",
                "¿Crees que el consumo de alcohol es un problema entre los estudiantes del colegio?",
                "alcoholProblemAtSchoolTeacher",
                ["Sí", "No", "No estoy seguro"]
              )}
              
              {renderQuestion(
                "23",
                "¿Crees que el consumo de drogas es un problema entre los estudiantes del colegio?",
                "drugsProblemAtSchoolTeacher",
                ["Sí", "No", "No estoy seguro"]
              )}
            </div>
          );

        case 'cleanliness':
          return (
            <div>
              {renderQuestion(
                "24",
                "En general, intento cooperar con la limpieza del colegio botando mi basura donde corresponde y manteniendo los espacios comunes lo más limpio posible.",
                "teacherCooperateWithCleanliness",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "25",
                "Se proporciona un entorno limpio y ordenado en el colegio, incluyendo áreas como baños y zonas de recreo.",
                "cleanEnvironmentProvided",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "26",
                "¿Crees que se podría mejorar la limpieza de las instalaciones del establecimiento?",
                "improveFacilitiesCleanlinessTeacher",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "27",
                "Los baños siempre cuentan con los artículos de higiene necesarios.",
                "bathroomHygieneArticlesTeacher",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
            </div>
          );

        default:
          return null;
      }
    } else {
      // Student survey content (existing logic)
      switch (surveyData.currentSection) {
        case 'general':
          return (
            <div>
              {renderQuestion(
                "1",
                "¿Con cuál género te identificas?",
                "gender",
                ["Femenino", "Masculino", "Transgénero", "Otro"]
              )}
              
              {renderQuestion(
                "2",
                "¿Presentas alguna discapacidad?",
                "disability",
                ["Sí", "No", "No lo sé"]
              )}
              
              {renderConditionalQuestion(
                "2a",
                "Si tu respuesta anterior fue 'Sí', ¿qué tipo de discapacidad presentas?",
                "disabilityType",
                ["Física", "Intelectual", "Sensorial (visual o auditiva)", "Psíquica", "Múltiple", "Otra"],
                surveyData.disability === "Sí"
              )}
              
              {renderQuestion(
                "3",
                "En el último mes... ¿cuántos días completos has faltado al colegio por cualquier razón?",
                "absenceDays",
                ["0 días", "1 día", "2 días", "3 o más días"]
              )}
            </div>
          );

        case 'experience':
          return (
            <div>
              {renderQuestion(
                "4",
                "¿Estás feliz de estar en este colegio?",
                "happyAtSchool",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "5",
                "¿Sientes que eres parte de este colegio?",
                "feelPartOfSchool",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "6",
                "¿Cómo describirías tu experiencia general en el colegio?",
                "generalExperience",
                ["Muy positiva", "Positiva", "Neutral", "Negativa", "Muy negativa"]
              )}
              
              {renderQuestion(
                "7",
                "¿El colegio te ha dado anteriormente la oportunidad de participar y de dar ideas para mejorar la calidad del ambiente educacional?",
                "participationOpportunity",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "8",
                "Las actividades extracurriculares ofrecidas por el colegio son variadas y atractivas",
                "extracurricularActivities",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "9",
                "¿Te sientes motivado/a y comprometido/a con tu proceso de aprendizaje en el colegio?",
                "learningMotivation",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "10",
                "¿Sientes que tus profesores se preocupan por tu bienestar y desarrollo académico?",
                "teacherCare",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "11",
                "¿Tienes espacio suficiente para jugar, correr y hacer vida social en el colegio?",
                "socialSpace",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
            </div>
          );

        case 'security':
          return (
            <div>
              {renderQuestion(
                "12",
                "¿Te sientes seguro en el colegio?",
                "schoolSafety",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "13",
                "¿Tu colegio enseña a los estudiantes a tratarse con respeto?",
                "respectTeaching",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "14",
                "¿Tu colegio ayuda a los estudiantes a resolver sus conflictos?",
                "conflictResolution",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "15",
                "¿Consideras que el Bullying es un problema en tu colegio?",
                "bullyingProblem",
                ["Sí", "No", "No lo sé"]
              )}
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-blue-900 font-semibold">
                    Durante este semestre...
                  </p>
                </div>
                <p className="text-blue-800 mt-2">
                  Las siguientes preguntas se refieren a experiencias que hayas vivido en el colegio durante este período académico.
                </p>
              </div>
              
              {renderQuestion(
                "16",
                "Durante este semestre... ¿Se han difundido rumores malos o mentiras sobre ti?",
                "rumorsSpread",
                ["Sí", "No"]
              )}
              
              {renderQuestion(
                "17",
                "Durante este semestre... ¿Te han llamado por nombres molestos o te hacen bromas ofensivas?",
                "offensiveNames",
                ["Sí", "No"]
              )}
              
              {renderQuestion(
                "18",
                "Durante este semestre... ¿Te han golpeado o te empujado en la escuela sin estar jugando?",
                "physicalAggression",
                ["Sí", "No"]
              )}
              
              {renderQuestion(
                "19",
                "Durante este semestre... ¿Se han burlado de ti por tu apariencia?",
                "appearanceMocking",
                ["Sí", "No"]
              )}
              
              {renderQuestion(
                "20",
                "Durante este semestre... ¿Viste a otro niño con un cuchillo, una navaja o un arma blanca?",
                "weaponSeen",
                ["Sí", "No"]
              )}
            </div>
          );

        case 'mental-health':
          return (
            <div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-purple-900 font-semibold">
                    Durante este semestre...
                  </p>
                </div>
                <p className="text-purple-800 mt-2">
                  Las siguientes preguntas se refieren a tu bienestar emocional y mental durante este período académico.
                </p>
              </div>
              
              {renderQuestion(
                "21",
                "Durante este semestre... ¿Qué tan seguido te has sentido estresado?",
                "stressFrequency",
                ["Constantemente", "De vez en cuando", "No me he sentido estresado"]
              )}
              
              {renderQuestion(
                "22",
                "Durante este semestre... ¿Qué tan seguido te has sentido triste?",
                "sadnessFrequency",
                ["Constantemente", "De vez en cuando", "No me he sentido triste"]
              )}
              
              {renderQuestion(
                "23",
                "Durante este semestre... ¿Qué tan seguido te has sentido solo?",
                "lonelinessFrequency",
                ["Constantemente", "De vez en cuando", "No me he sentido solo"]
              )}
              
              {renderQuestion(
                "24",
                "Durante este semestre... ¿Consideraste hablar con algún profesional sobre tus problemas?",
                "consideredProfessionalHelp",
                ["Sí", "No", "No lo necesité"]
              )}
              
              {renderConditionalQuestion(
                "24a",
                "Si tu respuesta anterior fue 'Sí', ¿recibiste ayuda de algún profesional?",
                "receivedProfessionalHelp",
                ["Sí", "No", "No estoy seguro"],
                surveyData.consideredProfessionalHelp === "Sí"
              )}
              
              {renderConditionalQuestion(
                "24b",
                "Si tu respuesta anterior fue 'Sí', ¿recibiste esa ayuda de algún profesional del colegio?",
                "receivedSchoolProfessionalHelp",
                ["Sí", "No", "No estoy seguro"],
                surveyData.receivedProfessionalHelp === "Sí"
              )}
              
              {renderQuestion(
                "25",
                "¿Crees que hablarlo con un profesional te ayudaría a mejorar?",
                "professionalHelpWouldHelp",
                ["Sí", "No", "No estoy seguro"]
              )}
              
              {renderQuestion(
                "26",
                "¿Crees que tus compañeros entenderían tu situación?",
                "peersUnderstanding",
                ["Sí", "No", "No estoy seguro"]
              )}
              
              {renderQuestion(
                "27",
                "¿Sabrías dónde y a quién pedirle ayuda dentro del establecimiento?",
                "knowWhereToAskHelp",
                ["Sí", "No", "No estoy seguro"]
              )}
              
              {renderQuestion(
                "28",
                "¿Crees que el colegio cuenta con las herramientas necesarias para ayudar a sus estudiantes en momentos de estrés, tristeza o soledad?",
                "schoolHasNecessaryTools",
                ["Sí", "No", "No estoy seguro"]
              )}
            </div>
          );

        case 'alcohol-drugs':
          return (
            <div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 mb-8 border border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-orange-600" />
                  </div>
                  <p className="text-orange-900 font-semibold">
                    Recordatorio de Confidencialidad
                  </p>
                </div>
                <p className="text-orange-800 mt-2">
                  Como recordatorio, tus respuestas serán totalmente anónimas y en ningún momento pasarán por manos de los docentes. Así que te pedimos por favor ser lo más sincero posible.
                </p>
              </div>
              
              {renderQuestion(
                "29",
                "¿Crees que fumar cigarros es malo para la salud de una persona?",
                "cigarettesHealthBad",
                ["Sí", "No", "No estoy seguro"]
              )}
              
              {renderQuestion(
                "30",
                "¿Crees que fumar cigarros electrónicos es malo para la salud de una persona?",
                "electronicCigarettesHealthBad",
                ["Sí", "No", "No estoy seguro"]
              )}
              
              {renderQuestion(
                "31",
                "¿Crees que fumar marihuana es malo para la salud de una persona?",
                "marijuanaHealthBad",
                ["Sí", "No", "No estoy seguro"]
              )}
              
              {renderQuestion(
                "32",
                "¿Crees que tomar alcohol (cerveza, vino, licor) en exceso, es malo para la salud de una persona?",
                "excessiveAlcoholHealthBad",
                ["Sí", "No", "No estoy seguro"]
              )}
              
              {renderQuestion(
                "33",
                "¿Crees que el consumo de alcohol es un problema entre los estudiantes del colegio?",
                "alcoholProblemAtSchool",
                ["Sí", "No", "No estoy seguro"]
              )}
              
              {renderQuestion(
                "34",
                "¿Crees que el consumo de drogas es un problema entre los estudiantes del colegio?",
                "drugsProblemAtSchool",
                ["Sí", "No", "No estoy seguro"]
              )}
              
              {renderQuestion(
                "35",
                "¿Te sientes presionado/a por tus compañeros para consumir alcohol o drogas?",
                "peerPressureSubstances",
                ["Sí", "No", "No estoy seguro"]
              )}
            </div>
          );

        case 'cleanliness':
          return (
            <div>
              {renderQuestion(
                "36",
                "En general, trato de cooperar con la limpieza del colegio botando mi basura donde corresponde",
                "cooperateWithCleanliness",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "37",
                "En general, trato de mantener el baño lo más limpio posible",
                "maintainBathroomClean",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "38",
                "En general, considero que mis compañeros se preocupan de la limpieza del colegio",
                "peersCareCleanliness",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "39",
                "La limpieza de las salas de clases se realizan con la frecuencia necesaria",
                "classroomCleaningFrequency",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "40",
                "La limpieza de los baños se realizan con la frecuencia necesaria",
                "bathroomCleaningFrequency",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "41",
                "Los baños siempre cuentan con los artículos de higiene necesarios",
                "bathroomHygieneArticles",
                ["Muy de Acuerdo", "De Acuerdo", "Ni de Acuerdo ni en Desacuerdo", "En Desacuerdo", "Muy en Desacuerdo"]
              )}
              
              {renderQuestion(
                "42",
                "¿Crees que se podría mejorar la limpieza de las instalaciones del colegio?",
                "improveFacilitiesCleanliness",
                ["Sí", "No", "No estoy seguro"]
              )}
            </div>
          );

        default:
          return null;
      }
    }
  };

  const getProgressPercentage = () => {
    return ((currentSectionIndex + 1) / sections.length) * 100;
  };

  const getBackButtonPath = () => {
    if (surveyData.surveyType === 'teacher') {
      return '/survey/code';
    } else {
      return '/survey/course';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(getBackButtonPath())}
            className="flex items-center text-emerald-600 hover:text-emerald-700 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </button>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">
                {surveyData.surveyType === 'teacher' ? 'Paso 3 de 3 - Encuesta' : 'Paso 4 de 4 - Encuesta'}
              </span>
              <span className="font-bold text-emerald-600">{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500 shadow-sm" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Survey Type Indicator */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${isCustomSurvey ? 'bg-purple-100' : 'bg-emerald-100'}`}>
                <Sparkles className={`h-6 w-6 ${isCustomSurvey ? 'text-purple-600' : 'text-emerald-600'}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isCustomSurvey ? 'Encuesta Personalizada' : 'Encuesta Estándar'}
                </h2>
                <p className="text-gray-600">
                  {isCustomSurvey 
                    ? 'Esta encuesta fue creada específicamente para tu colegio'
                    : 'Encuesta estándar del sistema schoolar'
                  }
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isCustomSurvey 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {isCustomSurvey ? 'Personalizada' : 'Estándar'}
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = section.id === surveyData.currentSection;
              const isCompleted = isSectionComplete(section.id);
              const canNavigate = canNavigateToSection(section.id);
              
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  disabled={!canNavigate}
                  className={`p-4 rounded-xl border-2 transition-all text-left transform ${
                    canNavigate ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-50'
                  } ${
                    isActive
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg'
                      : isCompleted
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-md'
                      : canNavigate
                      ? 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${
                      isActive
                        ? 'bg-emerald-200'
                        : isCompleted
                        ? 'bg-green-200'
                        : canNavigate
                        ? 'bg-gray-100'
                        : 'bg-gray-200'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Icon className={`h-5 w-5 ${
                          isActive ? 'text-emerald-600' : canNavigate ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${
                        isActive ? 'text-emerald-900' : isCompleted ? 'text-green-900' : canNavigate ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {section.name}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Section Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-white bg-opacity-20">
              <currentSection.icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentSection.name}</h2>
              <p className="text-emerald-100">Sección {currentSectionIndex + 1} de {sections.length}</p>
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div className="space-y-6">
          {renderSectionContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <button
            onClick={handlePrevious}
            disabled={currentSectionIndex === 0}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 font-medium">
              {isCurrentSectionComplete() ? (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Sección completada
                </span>
              ) : (
                'Completa todas las preguntas para continuar'
              )}
            </p>
          </div>

          <button
            onClick={handleNext}
            disabled={!isCurrentSectionComplete() || loading || (currentSectionIndex === sections.length - 1 && !areAllSectionsComplete())}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
          >
            {currentSectionIndex === sections.length - 1 ? (
              loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                'Finalizar Encuesta'
              )
            ) : (
              <>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </button>
        </div>

        {/* Survey Info Box - Moved to bottom */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8 border border-gray-100">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Colegio:</span> {validSchoolCodes[surveyData.schoolCode]}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Encuesta:</span> {validSurveyCodes[surveyData.surveyCode]?.name}
            </p>
            {surveyData.surveyType === 'student' && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">Curso:</span> {surveyData.course} {surveyData.letter}
              </p>
            )}
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Tipo:</span> {surveyData.surveyType === 'teacher' ? 'Encuesta Docente' : 'Encuesta Estudiante'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Modalidad:</span> {isCustomSurvey ? 'Personalizada' : 'Estándar'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}