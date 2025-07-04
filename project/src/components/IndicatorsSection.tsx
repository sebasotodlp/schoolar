import React, { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Download, Shield, AlertTriangle, Database, Filter, BookOpen, Heart, Brain, Sparkles, Wine, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { SurveyResponse, CourseStats } from '../types';
import { exportSurveyDataToExcel } from '../utils/excelExport';
import { SecureDataManager } from '../config/secureData';

interface IndicatorsSectionProps {
  surveyResponses: SurveyResponse[];
  loading?: boolean;
  currentUser?: any;
  validSurveyCodes?: any;
}

export function IndicatorsSection({ surveyResponses, loading = false, currentUser, validSurveyCodes = {} }: IndicatorsSectionProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('general');
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [availableSurveys, setAvailableSurveys] = useState<any[]>([]);
  const [selectedSurveyType, setSelectedSurveyType] = useState<'student' | 'teacher' | 'all'>('all');

  const secureDataManager = SecureDataManager.getInstance();

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

  const totalResponses = filteredResponses.length;

  // Handle Excel export
  const handleExportData = () => {
    if (filteredResponses.length === 0) {
      alert('No hay datos para exportar con los filtros seleccionados');
      return;
    }

    const schoolName = currentUser?.schoolName || 'Datos_Encuesta';
    const surveyName = selectedSurvey !== 'all' ? 
      (availableSurveys.find(s => s.code === selectedSurvey)?.name || 'Encuesta_Seleccionada') : 
      'Todas_las_Encuestas';
    const fileName = `${schoolName}_${surveyName}`;
    
    exportSurveyDataToExcel(filteredResponses, fileName);
  };

  // Colors for charts
  const COLORS = {
    // General colors
    'Femenino': '#EC4899',
    'Masculino': '#3B82F6', 
    'Transgénero': '#8B5CF6',
    'Otro': '#6B7280',
    
    // Disability colors
    'Sí': '#EF4444',
    'Si': '#EF4444',
    'No': '#10B981',
    'No lo sé': '#F59E0B',
    
    // Disability types
    'Física': '#EF4444',
    'Intelectual': '#F97316',
    'Sensorial (visual o auditiva)': '#F59E0B',
    'Psíquica': '#8B5CF6',
    'Múltiple': '#6B7280',
    'Otra': '#9CA3AF',
    
    // Agreement scale colors
    'Muy en Desacuerdo': '#EF4444',
    'En Desacuerdo': '#F97316',
    'Ni de Acuerdo ni en Desacuerdo': '#F59E0B',
    'De Acuerdo': '#34D399',
    'Muy de Acuerdo': '#10B981',
    
    // Experience colors
    'Muy positiva': '#10B981',
    'Positiva': '#34D399',
    'Neutral': '#F59E0B',
    'Negativa': '#F97316',
    'Muy negativa': '#EF4444',
    
    // Frequency colors
    'Constantemente': '#EF4444',
    'De vez en cuando': '#F59E0B',
    'Nunca': '#10B981',
    'No me he sentido estresado': '#10B981',
    'No me he sentido triste': '#10B981',
    'No me he sentido solo': '#10B981',
    
    // Help colors
    'No lo necesité': '#10B981',
    'No la necesité': '#10B981',
    'No estoy seguro': '#F59E0B',
    'No estoy seguro/a': '#F59E0B',
    
    // Substance colors
    'Uno a dos': '#F97316',
    'Entre tres y cinco': '#EF4444',
    'Entre cinco y siete': '#7F1D1D',
    'Ninguno': '#10B981',
    
    // Absence days
    '0 días': '#10B981',
    '1 día': '#34D399',
    '2 días': '#F59E0B',
    '3 o más días': '#EF4444',
    
    // Age ranges (for teachers)
    'Menor a 30 años': '#34D399',
    'Entre 30 y 39 años': '#10B981',
    'Entre 40 y 49 años': '#F59E0B',
    'Mayor a 49 años': '#F97316',
    
    // Teaching levels
    'Básica': '#3B82F6',
    'Media': '#8B5CF6',
    'Ambas': '#10B981'
  };

  const createChartData = (field: string) => {
    const data = Object.entries(
      filteredResponses.reduce((acc, response) => {
        const value = response[field as keyof SurveyResponse] as string;
        if (value) {
          acc[value] = (acc[value] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({
      name,
      value,
      percentage: totalResponses > 0 ? ((value / totalResponses) * 100) : 0
    }));
    
    return data;
  };

  const renderPieChart = (data: any[], title: string, height = 350) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay datos disponibles</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentage }) => `${percentage.toFixed(1)}%`}
              outerRadius={height === 350 ? 120 : 80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#6B7280'} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} respuestas (${data.find(d => d.name === name)?.percentage.toFixed(1)}%)`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderBarChart = (data: any[], title: string, height = 350) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay datos disponibles</p>
          </div>
        </div>
      );
    }

    // Calculate the maximum percentage for Y-axis domain
    const maxPercentage = Math.max(...data.map(d => d.percentage));
    const yAxisMax = Math.ceil(maxPercentage / 10) * 10; // Round up to nearest 10

    return (
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              fontSize={12}
            />
            <YAxis 
              domain={[0, Math.max(yAxisMax, 100)]}
              tickFormatter={(value) => `${value}%`}
              label={{ value: 'Porcentaje', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle'}, dy: 0}}
            />
            <Tooltip 
              formatter={(value, name, props) => [
                `${props.payload.value} respuestas (${props.payload.percentage.toFixed(1)}%)`, 
                'Cantidad'
              ]} 
            />
            <Bar 
              dataKey="percentage" 
              fill="#8884d8" 
              radius={[4, 4, 0, 0]}
              label={{
                position: 'top',
                formatter: (value: number) => `${value.toFixed(1)}%`,
                fontSize: 12,
                fill: '#374151'
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#6B7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderSectionData = () => {
    if (selectedSurveyType === 'teacher') {
      // Teacher survey questions
      switch (selectedSection) {
        case 'general':
          const genderData = createChartData('gender');
          const disabilityData = createChartData('disability');
          const disabilityTypeData = createChartData('disabilityType');
          const ageData = createChartData('teacherAge');
          const teachingLevelData = createChartData('teachingLevel');

          return (
            <div className="space-y-8">
              {/* Género */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">1. ¿Con cuál género te identificas?</h3>
                {renderPieChart(genderData, 'Género')}
              </div>

              {/* Discapacidad */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">2. ¿Presentas algún tipo de discapacidad?</h3>
                {renderBarChart(disabilityData, 'Discapacidad')}
              </div>

              {/* Tipo de discapacidad - Pregunta condicional 2a */}
              {disabilityTypeData.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">2a. Si tu respuesta anterior fue 'Sí', ¿qué tipo de discapacidad presentas?</h3>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Pregunta condicional:</strong> Solo respondida por docentes que indicaron tener alguna discapacidad.
                      Total de respuestas: {disabilityTypeData.reduce((sum, item) => sum + item.value, 0)}
                    </p>
                  </div>
                  {renderBarChart(disabilityTypeData, 'Tipo de discapacidad')}
                </div>
              )}

              {/* Edad */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">3. ¿Cuál es tu edad?</h3>
                {renderBarChart(ageData, 'Edad')}
              </div>

              {/* Nivel de enseñanza */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">4. ¿En qué nivel enseñas?</h3>
                {renderBarChart(teachingLevelData, 'Nivel de enseñanza')}
              </div>
            </div>
          );

        case 'experience':
          const schoolResourcesData = createChartData('schoolResources');
          const administrativeSupportData = createChartData('administrativeSupport');
          const professionalDevelopmentData = createChartData('professionalDevelopment');
          const inclusiveEnvironmentData = createChartData('inclusiveEnvironment');
          const teachingMotivationData = createChartData('teachingMotivation');
          const teacherRecognitionData = createChartData('teacherRecognition');
          const teacherHappinessData = createChartData('teacherHappiness');

          return (
            <div className="space-y-8">
              {/* Recursos escolares */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">5. El establecimiento escolar proporciona suficientes recursos y materiales didácticos para apoyar la enseñanza del profesor.</h3>
                {renderBarChart(schoolResourcesData, 'Recursos escolares')}
              </div>

              {/* Apoyo administrativo */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">6. El personal administrativo constantemente brinda apoyo y colaboración al profesor en su labor docente.</h3>
                {renderBarChart(administrativeSupportData, 'Apoyo administrativo')}
              </div>

              {/* Desarrollo profesional */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">7. El establecimiento escolar ofrece oportunidades de desarrollo profesional para que el profesor mejore sus habilidades pedagógicas.</h3>
                {renderBarChart(professionalDevelopmentData, 'Desarrollo profesional')}
              </div>

              {/* Ambiente inclusivo */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">8. El establecimiento escolar promueve un ambiente inclusivo y diverso que respeta las diferencias culturales de los docentes y estudiantes.</h3>
                {renderBarChart(inclusiveEnvironmentData, 'Ambiente inclusivo')}
              </div>

              {/* Motivación docente */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">9. ¿Te sientes motivado y entusiasmado en tu labor docente dentro del establecimiento escolar?</h3>
                {renderBarChart(teachingMotivationData, 'Motivación docente')}
              </div>

              {/* Reconocimiento docente */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">10. ¿Te sientes valorado y reconocido por tu trabajo en el establecimiento escolar?</h3>
                {renderBarChart(teacherRecognitionData, 'Reconocimiento docente')}
              </div>

              {/* Felicidad laboral */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">11. En general, ¿te sientes feliz con tu experiencia laboral en este colegio?</h3>
                {renderBarChart(teacherHappinessData, 'Felicidad laboral')}
              </div>
            </div>
          );

        case 'security':
          const teacherHarassedData = createChartData('teacherHarassed');
          const witnessedTeacherHarassmentData = createChartData('witnessedTeacherHarassment');
          const witnessedStudentHarassmentData = createChartData('witnessedStudentHarassment');
          const witnessedWeaponsData = createChartData('witnessedWeapons');
          const bullyingProblemTeacherData = createChartData('bullyingProblemTeacher');
          const needMoreSafetyMeasuresData = createChartData('needMoreSafetyMeasures');

          return (
            <div className="space-y-8">
              {/* Acoso hacia docente */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">12. Durante este semestre... ¿Has sido objeto de comportamientos dañinos por parte de estudiantes en el colegio que te hayan hecho sentir incómodo, amenazado o humillado?</h3>
                {renderPieChart(teacherHarassedData, 'Acoso hacia docente', 300)}
              </div>

              {/* Presenciar acoso a docente */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">13. Durante este semestre... ¿Has presenciado alguna situación de acoso, maltrato o humillación en el colegio hacia algún docente?</h3>
                {renderPieChart(witnessedTeacherHarassmentData, 'Presenciar acoso a docente', 300)}
              </div>

              {/* Presenciar acoso a estudiante */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">14. Durante este semestre... ¿Has presenciado alguna situación de acoso, maltrato o humillación en el colegio hacia algún estudiante?</h3>
                {renderPieChart(witnessedStudentHarassmentData, 'Presenciar acoso a estudiante', 300)}
              </div>

              {/* Armas presenciadas */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">15. Durante este semestre... ¿Viste a algún estudiante con algún arma de fuego o un arma blanca?</h3>
                {renderPieChart(witnessedWeaponsData, 'Armas presenciadas', 300)}
              </div>

              {/* Bullying como problema */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">16. ¿Consideras que el Bullying es un problema en tu colegio?</h3>
                {renderPieChart(bullyingProblemTeacherData, 'Bullying como problema', 300)}
              </div>

              {/* Necesidad de más medidas de seguridad */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">17. ¿Consideras que el colegio debiese implementar más medidas para prevenir el acoso y violencia escolar?</h3>
                {renderPieChart(needMoreSafetyMeasuresData, 'Necesidad de más medidas de seguridad', 300)}
              </div>
            </div>
          );

        case 'mental-health':
          const teacherStressFrequencyData = createChartData('teacherStressFrequency');
          const schoolEmotionalSupportData = createChartData('schoolEmotionalSupport');
          const schoolWellnessProgramsData = createChartData('schoolWellnessPrograms');
          const mentalHealthPoliciesData = createChartData('mentalHealthPolicies');
          const mentalHealthStigmaData = createChartData('mentalHealthStigma');

          return (
            <div className="space-y-8">
              {/* Frecuencia de estrés */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">17. Durante este semestre... ¿qué tan seguido te has sentido estresado, solo o triste?</h3>
                {renderBarChart(teacherStressFrequencyData, 'Frecuencia de estrés')}
              </div>

              {/* Apoyo emocional del colegio */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">18. ¿Te sientes apoyado/a por el colegio en cuanto a tu bienestar emocional y salud mental?</h3>
                {renderBarChart(schoolEmotionalSupportData, 'Apoyo emocional del colegio')}
              </div>

              {/* Programas de bienestar */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">19. ¿El colegio ofrece recursos y programas de apoyo para promover el bienestar emocional y el auto-cuidado de los profesores?</h3>
                {renderBarChart(schoolWellnessProgramsData, 'Programas de bienestar')}
              </div>

              {/* Políticas de salud mental */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">20. ¿Te sientes satisfecho/a con las políticas y programas implementados por el colegio en relación con la salud mental de los profesores?</h3>
                {renderBarChart(mentalHealthPoliciesData, 'Políticas de salud mental')}
              </div>

              {/* Estigmatización */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">21. ¿Piensas que el colegio está comprometido en abordar la estigmatización y los prejuicios asociados con problemas de salud mental?</h3>
                {renderBarChart(mentalHealthStigmaData, 'Estigmatización')}
              </div>
            </div>
          );

        case 'alcohol-drugs':
          const alcoholProblemAtSchoolTeacherData = createChartData('alcoholProblemAtSchoolTeacher');
          const drugsProblemAtSchoolTeacherData = createChartData('drugsProblemAtSchoolTeacher');

          return (
            <div className="space-y-8">
              {/* Problema de alcohol */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">22. ¿Crees que el consumo de alcohol es un problema entre los estudiantes del colegio?</h3>
                {renderPieChart(alcoholProblemAtSchoolTeacherData, 'Problema de alcohol', 300)}
              </div>

              {/* Problema de drogas */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">23. ¿Crees que el consumo de drogas es un problema entre los estudiantes del colegio?</h3>
                {renderPieChart(drugsProblemAtSchoolTeacherData, 'Problema de drogas', 300)}
              </div>
            </div>
          );

        case 'cleanliness':
          const teacherCooperateWithCleanlinessData = createChartData('teacherCooperateWithCleanliness');
          const cleanEnvironmentProvidedData = createChartData('cleanEnvironmentProvided');
          const improveFacilitiesCleanlinessTeacherData = createChartData('improveFacilitiesCleanlinessTeacher');
          const bathroomHygieneArticlesTeacherData = createChartData('bathroomHygieneArticlesTeacher');

          return (
            <div className="space-y-8">
              {/* Cooperación con limpieza */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">24. En general, intento cooperar con la limpieza del colegio botando mi basura donde corresponde y manteniendo los espacios comunes lo más limpio posible.</h3>
                {renderBarChart(teacherCooperateWithCleanlinessData, 'Cooperación con limpieza')}
              </div>

              {/* Ambiente limpio proporcionado */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">25. Se proporciona un entorno limpio y ordenado en el colegio, incluyendo áreas como baños y zonas de recreo.</h3>
                {renderBarChart(cleanEnvironmentProvidedData, 'Ambiente limpio proporcionado')}
              </div>

              {/* Mejorar limpieza instalaciones */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">26. ¿Crees que se podría mejorar la limpieza de las instalaciones del establecimiento?</h3>
                {renderBarChart(improveFacilitiesCleanlinessTeacherData, 'Mejorar limpieza instalaciones')}
              </div>

              {/* Artículos de higiene */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">27. Los baños siempre cuentan con los artículos de higiene necesarios.</h3>
                {renderBarChart(bathroomHygieneArticlesTeacherData, 'Artículos de higiene')}
              </div>
            </div>
          );

        default:
          return null;
      }
    } else {
      // Student survey questions (existing logic)
      switch (selectedSection) {
        case 'general':
          const genderData = createChartData('gender');
          const disabilityData = createChartData('disability');
          const disabilityTypeData = createChartData('disabilityType');
          const absenceData = createChartData('absenceDays');

          return (
            <div className="space-y-8">
              {/* Género */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">1. ¿Con cuál género te identificas?</h3>
                {renderPieChart(genderData, 'Género')}
              </div>

              {/* Discapacidad */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">2. ¿Presentas alguna discapacidad?</h3>
                {renderBarChart(disabilityData, 'Discapacidad')}
              </div>

              {/* Tipo de discapacidad - Pregunta condicional 2a */}
              {disabilityTypeData.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">2a. Si tu respuesta anterior fue 'Sí', ¿qué tipo de discapacidad presentas?</h3>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Pregunta condicional:</strong> Solo respondida por estudiantes que indicaron tener alguna discapacidad.
                      Total de respuestas: {disabilityTypeData.reduce((sum, item) => sum + item.value, 0)}
                    </p>
                  </div>
                  {renderBarChart(disabilityTypeData, 'Tipo de discapacidad')}
                </div>
              )}

              {/* Días de ausencia */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">3. En el último mes... ¿cuántos días completos has faltado al colegio por cualquier razón?</h3>
                {renderBarChart(absenceData, 'Días de ausencia')}
              </div>
            </div>
          );

        case 'experience':
          const happyData = createChartData('happyAtSchool');
          const partOfSchoolData = createChartData('feelPartOfSchool');
          const generalExpData = createChartData('generalExperience');
          const participationData = createChartData('participationOpportunity');
          const extracurricularData = createChartData('extracurricularActivities');
          const motivationData = createChartData('learningMotivation');
          const teacherCareData = createChartData('teacherCare');
          const socialSpaceData = createChartData('socialSpace');

          return (
            <div className="space-y-8">
              {/* Felicidad en el colegio */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">4. ¿Estás feliz de estar en este colegio?</h3>
                {renderBarChart(happyData, 'Felicidad en el colegio')}
              </div>

              {/* Sentirse parte del colegio */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">5. ¿Sientes que eres parte de este colegio?</h3>
                {renderBarChart(partOfSchoolData, 'Sentirse parte del colegio')}
              </div>

              {/* Experiencia general */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">6. ¿Cómo describirías tu experiencia general en el colegio?</h3>
                {renderBarChart(generalExpData, 'Experiencia general')}
              </div>

              {/* Oportunidad de participación */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">7. ¿El colegio te ha dado anteriormente la oportunidad de participar y de dar ideas para mejorar la calidad del ambiente educacional?</h3>
                {renderBarChart(participationData, 'Oportunidad de participación')}
              </div>

              {/* Actividades extracurriculares */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">8. Las actividades extracurriculares ofrecidas por el colegio son variadas y atractivas</h3>
                {renderBarChart(extracurricularData, 'Actividades extracurriculares')}
              </div>

              {/* Motivación de aprendizaje */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">9. ¿Te sientes motivado/a y comprometido/a con tu proceso de aprendizaje en el colegio?</h3>
                {renderBarChart(motivationData, 'Motivación de aprendizaje')}
              </div>

              {/* Cuidado de profesores */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">10. ¿Sientes que tus profesores se preocupan por tu bienestar y desarrollo académico?</h3>
                {renderBarChart(teacherCareData, 'Cuidado de profesores')}
              </div>

              {/* Espacio social */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">11. ¿Tienes espacio suficiente para jugar, correr y hacer vida social en el colegio?</h3>
                {renderBarChart(socialSpaceData, 'Espacio social')}
              </div>
            </div>
          );

        case 'security':
          const safetyData = createChartData('schoolSafety');
          const respectTeachingData = createChartData('respectTeaching');
          const conflictResolutionData = createChartData('conflictResolution');
          const bullyingProblemData = createChartData('bullyingProblem');
          const rumorsData = createChartData('rumorsSpread');
          const offensiveNamesData = createChartData('offensiveNames');
          const physicalAggressionData = createChartData('physicalAggression');
          const appearanceMockingData = createChartData('appearanceMocking');
          const weaponData = createChartData('weaponSeen');

          return (
            <div className="space-y-8">
              {/* Seguridad */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">12. ¿Te sientes seguro en el colegio?</h3>
                {renderBarChart(safetyData, 'Seguridad en el colegio')}
              </div>

              {/* Enseñanza de respeto */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">13. ¿Tu colegio enseña a los estudiantes a tratarse con respeto?</h3>
                {renderBarChart(respectTeachingData, 'Enseñanza de respeto')}
              </div>

              {/* Resolución de conflictos */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">14. ¿Tu colegio ayuda a los estudiantes a resolver sus conflictos?</h3>
                {renderBarChart(conflictResolutionData, 'Resolución de conflictos')}
              </div>

              {/* Bullying como problema */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">15. ¿Consideras que el Bullying es un problema en tu colegio?</h3>
                {renderPieChart(bullyingProblemData, 'Bullying como problema', 300)}
              </div>

              {/* Rumores */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">16. Durante este semestre... ¿Se han difundido rumores malos o mentiras sobre ti?</h3>
                {renderPieChart(rumorsData, 'Rumores difundidos', 300)}
              </div>

              {/* Nombres ofensivos */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">17. Durante este semestre... ¿Te han llamado por nombres molestos o te hacen bromas ofensivas?</h3>
                {renderPieChart(offensiveNamesData, 'Nombres ofensivos', 300)}
              </div>

              {/* Agresión física */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">18. Durante este semestre... ¿Te han golpeado o te empujado en la escuela sin estar jugando?</h3>
                {renderPieChart(physicalAggressionData, 'Agresión física', 300)}
              </div>

              {/* Burlas por apariencia */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">19. Durante este semestre... ¿Se han burlado de ti por tu apariencia?</h3>
                {renderPieChart(appearanceMockingData, 'Burlas por apariencia', 300)}
              </div>

              {/* Armas */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">20. Durante este semestre... ¿Viste a otro niño con un cuchillo, una navaja o un arma blanca?</h3>
                {renderPieChart(weaponData, 'Armas vistas', 300)}
              </div>
            </div>
          );

        case 'mental-health':
          const stressData = createChartData('stressFrequency');
          const sadnessData = createChartData('sadnessFrequency');
          const lonelinessData = createChartData('lonelinessFrequency');
          const consideredHelpData = createChartData('consideredProfessionalHelp');
          const receivedHelpData = createChartData('receivedProfessionalHelp');
          const schoolHelpData = createChartData('receivedSchoolProfessionalHelp');
          const helpWouldHelpData = createChartData('professionalHelpWouldHelp');
          const peersUnderstandingData = createChartData('peersUnderstanding');
          const knowWhereHelpData = createChartData('knowWhereToAskHelp');
          const schoolToolsData = createChartData('schoolHasNecessaryTools');

          return (
            <div className="space-y-8">
              {/* Estrés */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">21. Durante este semestre... ¿Qué tan seguido te has sentido estresado?</h3>
                {renderBarChart(stressData, 'Frecuencia de estrés')}
              </div>

              {/* Tristeza */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">22. Durante este semestre... ¿Qué tan seguido te has sentido triste?</h3>
                {renderBarChart(sadnessData, 'Frecuencia de tristeza')}
              </div>

              {/* Soledad */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">23. Durante este semestre... ¿Qué tan seguido te has sentido solo?</h3>
                {renderBarChart(lonelinessData, 'Frecuencia de soledad')}
              </div>

              {/* Consideró ayuda profesional */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">24. Durante este semestre... ¿Consideraste hablar con algún profesional sobre tus problemas?</h3>
                {renderPieChart(consideredHelpData, 'Consideró ayuda profesional', 300)}
              </div>

              {/* Recibió ayuda profesional - Pregunta condicional 24a */}
              {receivedHelpData.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">24a. Si tu respuesta anterior fue "Sí", ¿recibiste ayuda de algún profesional?</h3>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Pregunta condicional:</strong> Solo respondida por estudiantes que consideraron hablar con un profesional.
                      Total de respuestas: {receivedHelpData.reduce((sum, item) => sum + item.value, 0)}
                    </p>
                  </div>
                  {renderPieChart(receivedHelpData, 'Recibió ayuda profesional', 300)}
                </div>
              )}

              {/* Ayuda del colegio - Pregunta condicional 24b */}
              {schoolHelpData.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">24b. Si tu respuesta anterior fue "Sí", ¿recibiste esa ayuda de algún profesional del colegio?</h3>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Pregunta condicional:</strong> Solo respondida por estudiantes que recibieron ayuda profesional.
                      Total de respuestas: {schoolHelpData.reduce((sum, item) => sum + item.value, 0)}
                    </p>
                  </div>
                  {renderPieChart(schoolHelpData, 'Ayuda del colegio', 300)}
                </div>
              )}

              {/* Ayuda profesional ayudaría */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">25. ¿Crees que hablarlo con un profesional te ayudaría a mejorar?</h3>
                {renderPieChart(helpWouldHelpData, 'Ayuda profesional ayudaría', 300)}
              </div>

              {/* Comprensión de compañeros */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">26. ¿Crees que tus compañeros entenderían tu situación?</h3>
                {renderPieChart(peersUnderstandingData, 'Comprensión de compañeros', 300)}
              </div>

              {/* Saber dónde pedir ayuda */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">27. ¿Sabrías dónde y a quién pedirle ayuda dentro del establecimiento?</h3>
                {renderPieChart(knowWhereHelpData, 'Saber dónde pedir ayuda', 300)}
              </div>

              {/* Herramientas del colegio */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">28. ¿Crees que el colegio cuenta con las herramientas necesarias para ayudar a sus estudiantes en momentos de estrés, tristeza o soledad?</h3>
                {renderPieChart(schoolToolsData, 'Herramientas del colegio', 300)}
              </div>
            </div>
          );

        case 'alcohol-drugs':
          const cigarettesHealthData = createChartData('cigarettesHealthBad');
          const electronicHealthData = createChartData('electronicCigarettesHealthBad');
          const marijuanaHealthData = createChartData('marijuanaHealthBad');
          const alcoholHealthData = createChartData('excessiveAlcoholHealthBad');
          const alcoholProblemData = createChartData('alcoholProblemAtSchool');
          const drugsProblemData = createChartData('drugsProblemAtSchool');
          const peerPressureData = createChartData('peerPressureSubstances');

          return (
            <div className="space-y-8">
              {/* Cigarros malo para salud */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">29. ¿Crees que fumar cigarros es malo para la salud de una persona?</h3>
                {renderPieChart(cigarettesHealthData, 'Cigarros malo para salud', 300)}
              </div>

              {/* Cigarros electrónicos malo para salud */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">30. ¿Crees que fumar cigarros electrónicos es malo para la salud de una persona?</h3>
                {renderPieChart(electronicHealthData, 'Cigarros electrónicos malo para salud', 300)}
              </div>

              {/* Marihuana malo para salud */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">31. ¿Crees que fumar marihuana es malo para la salud de una persona?</h3>
                {renderPieChart(marijuanaHealthData, 'Marihuana malo para salud', 300)}
              </div>

              {/* Alcohol excesivo malo para salud */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">32. ¿Crees que tomar alcohol (cerveza, vino, licor) en exceso, es malo para la salud de una persona?</h3>
                {renderPieChart(alcoholHealthData, 'Alcohol excesivo malo para salud', 300)}
              </div>

              {/* Alcohol problema en colegio */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">33. ¿Crees que el consumo de alcohol es un problema entre los estudiantes del colegio?</h3>
                {renderPieChart(alcoholProblemData, 'Alcohol problema en colegio', 300)}
              </div>

              {/* Drogas problema en colegio */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">34. ¿Crees que el consumo de drogas es un problema entre los estudiantes del colegio?</h3>
                {renderPieChart(drugsProblemData, 'Drogas problema en colegio', 300)}
              </div>

              {/* Presión de compañeros */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">35. ¿Te sientes presionado/a por tus compañeros para consumir alcohol o drogas?</h3>
                {renderPieChart(peerPressureData, 'Presión de compañeros', 300)}
              </div>
            </div>
          );

        case 'cleanliness':
          const cooperateData = createChartData('cooperateWithCleanliness');
          const maintainBathroomData = createChartData('maintainBathroomClean');
          const peersCareData = createChartData('peersCareCleanliness');
          const classroomFreqData = createChartData('classroomCleaningFrequency');
          const bathroomFreqData = createChartData('bathroomCleaningFrequency');
          const hygieneArticlesData = createChartData('bathroomHygieneArticles');
          const improveFacilitiesData = createChartData('improveFacilitiesCleanliness');

          return (
            <div className="space-y-8">
              {/* Cooperar con limpieza */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">36. En general, trato de cooperar con la limpieza del colegio botando mi basura donde corresponde</h3>
                {renderBarChart(cooperateData, 'Cooperar con limpieza')}
              </div>

              {/* Mantener baño limpio */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">37. En general, trato de mantener el baño lo más limpio posible</h3>
                {renderBarChart(maintainBathroomData, 'Mantener baño limpio')}
              </div>

              {/* Compañeros se preocupan de limpieza */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">38. En general, considero que mis compañeros se preocupan de la limpieza del colegio</h3>
                {renderBarChart(peersCareData, 'Compañeros se preocupan de limpieza')}
              </div>

              {/* Limpieza de salas frecuencia */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">39. La limpieza de las salas de clases se realizan con la frecuencia necesaria</h3>
                {renderBarChart(classroomFreqData, 'Limpieza de salas frecuencia')}
              </div>

              {/* Limpieza de baños frecuencia */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">40. La limpieza de los baños se realizan con la frecuencia necesaria</h3>
                {renderBarChart(bathroomFreqData, 'Limpieza de baños frecuencia')}
              </div>

              {/* Artículos de higiene */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">41. Los baños siempre cuentan con los artículos de higiene necesarios</h3>
                {renderBarChart(hygieneArticlesData, 'Artículos de higiene')}
              </div>

              {/* Mejorar limpieza instalaciones */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">42. ¿Crees que se podría mejorar la limpieza de las instalaciones del colegio?</h3>
                {renderBarChart(improveFacilitiesData, 'Mejorar limpieza instalaciones')}
              </div>
            </div>
          );

        default:
          return null;
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando indicadores...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-emerald-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Indicadores</h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-sm text-gray-600">
              <Database className="h-4 w-4 mr-1" />
              Datos en tiempo real
            </div>
            <button 
              onClick={handleExportData}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              disabled={filteredResponses.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Datos
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Survey, Course and Letter Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-emerald-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          </div>
          
          <div className="space-y-4">
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
                  // Reset course and letter filters when survey changes
                  setSelectedCourse('all');
                  setSelectedLetter('all');
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
                onChange={(e) => setSelectedCourse(e.target.value)}
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
                onChange={(e) => setSelectedLetter(e.target.value)}
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

            <div>
              <label htmlFor="sectionFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Sección a analizar:
              </label>
              <select
                id="sectionFilter"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="general">I. Preguntas Generales</option>
                <option value="experience">II. Experiencia en el Establecimiento</option>
                <option value="security">III. Seguridad y Bullying</option>
                <option value="mental-health">IV. Salud Mental</option>
                <option value="alcohol-drugs">V. Consumo de Alcohol y Drogas</option>
                <option value="cleanliness">VI. Limpieza del Establecimiento</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-emerald-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Resumen</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
              <span className="text-gray-700">Total de respuestas:</span>
              <span className="font-bold text-emerald-600">{totalResponses}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Encuestas disponibles:</span>
              <span className="font-bold text-blue-600">{availableSurveys.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-gray-700">Tipo de encuesta:</span>
              <span className="font-bold text-purple-600">
                {selectedSurveyType === 'teacher' ? 'Docente' : selectedSurveyType === 'student' ? 'Estudiante' : 'Mixta'}
              </span>
            </div>
            {selectedSurveyType !== 'teacher' && (
              <>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-gray-700">Cursos activos:</span>
                  <span className="font-bold text-orange-600">{availableCourses.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                  <span className="text-gray-700">Letras activas:</span>
                  <span className="font-bold text-teal-600">{availableLetters.length}</span>
                </div>
              </>
            )}
            
            {/* Active Filters Display */}
            {(selectedSurvey !== 'all' || (selectedCourse !== 'all' && selectedSurveyType !== 'teacher') || (selectedLetter !== 'all' && selectedSurveyType !== 'teacher')) && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
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
                  Mostrando {totalResponses} de {surveyResponses.length} respuestas totales
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Data */}
      {renderSectionData()}
    </div>
  );
}