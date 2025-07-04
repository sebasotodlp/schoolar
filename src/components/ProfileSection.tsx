import React, { useState } from 'react';
import { User, Mail, Calendar, Shield, Building, Database, Lock, Eye, EyeOff, TrendingUp, AlertTriangle, CheckCircle, AlertCircle, Users, Brain, Heart } from 'lucide-react';
import { AdminUser, SurveyResponse } from '../types';
import { updateAdminUserPassword } from '../services/firestoreService';

interface ProfileSectionProps {
  currentUser: AdminUser | null;
  surveyCount: number;
  surveyResponses?: SurveyResponse[];
  onNavigateToUserManagement?: () => void;
}

export function ProfileSection({ currentUser, surveyCount, surveyResponses = [], onNavigateToUserManagement }: ProfileSectionProps) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    email: '',
    currentPassword: '',
    newPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se pudo cargar la información del usuario</p>
        </div>
      </div>
    );
  }

  // Function to determine current semester and year
  const getCurrentSemesterInfo = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
    const currentDay = now.getDate();

    // First semester: March 1 to July 31
    // Second semester: August 1 to February 28/29 (next year)
    
    if ((currentMonth === 3 && currentDay >= 1) || 
        (currentMonth >= 4 && currentMonth <= 7)) {
      // First semester of current year
      return {
        semester: 'Primer Semestre',
        year: currentYear
      };
    } else if (currentMonth >= 8 && currentMonth <= 12) {
      // Second semester of current year
      return {
        semester: 'Segundo Semestre',
        year: currentYear
      };
    } else {
      // January-February: Second semester of previous year
      return {
        semester: 'Segundo Semestre',
        year: currentYear - 1
      };
    }
  };

  // For current surveys, we want to show "Segundo Semestre 2025" as requested
  const getSurveyPeriodInfo = () => {
    return {
      semester: 'Segundo Semestre',
      year: 2025
    };
  };

  const surveyPeriod = getSurveyPeriodInfo();

  // Separate student and teacher responses
  const studentResponses = surveyResponses.filter(r => r.surveyType === 'student' || !r.surveyType);
  const teacherResponses = surveyResponses.filter(r => r.surveyType === 'teacher');

  // Function to analyze field and return status
  const analyzeField = (responses: SurveyResponse[], field: string, isPositiveField: boolean = true): { status: 'good' | 'warning' | 'critical'; percentage: number; total: number } => {
    if (responses.length === 0) return { status: 'warning', percentage: 0, total: 0 };

    const fieldData = responses.reduce((acc, response) => {
      const value = response[field as keyof SurveyResponse] as string;
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(fieldData).reduce((sum, count) => sum + count, 0);
    if (total === 0) return { status: 'warning', percentage: 0, total: 0 };

    let positiveCount = 0;

    if (isPositiveField) {
      // For positive fields, count positive responses
      positiveCount = (fieldData['Muy de Acuerdo'] || 0) + 
                     (fieldData['De Acuerdo'] || 0) + 
                     (fieldData['Muy positiva'] || 0) + 
                     (fieldData['Positiva'] || 0) +
                     (fieldData['Sí'] || 0);
    } else {
      // For negative fields (like bullying, stress), count negative responses as "good"
      positiveCount = (fieldData['No'] || 0) + 
                     (fieldData['Nunca'] || 0) + 
                     (fieldData['No me he sentido estresado'] || 0) +
                     (fieldData['No me he sentido triste'] || 0) +
                     (fieldData['No me he sentido solo'] || 0);
    }

    const percentage = (positiveCount / total) * 100;

    let status: 'good' | 'warning' | 'critical';
    if (percentage >= 70) {
      status = 'good';
    } else if (percentage >= 40) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return { status, percentage, total };
  };

  // Define TOP 6 most important indicators for students (one per section)
  const studentIndicators = [
    {
      title: 'Felicidad en el Colegio',
      field: 'happyAtSchool',
      icon: Heart,
      isPositive: true,
      description: 'Nivel de satisfacción con estar en el colegio',
      section: 'Experiencia Escolar'
    },
    {
      title: 'Seguridad Escolar',
      field: 'schoolSafety',
      icon: Shield,
      isPositive: true,
      description: 'Percepción de seguridad en el establecimiento',
      section: 'Seguridad y Bullying'
    },
    {
      title: 'Problemas de Bullying',
      field: 'bullyingProblem',
      icon: AlertTriangle,
      isPositive: false,
      description: 'Percepción de bullying como problema',
      section: 'Seguridad y Bullying'
    },
    {
      title: 'Frecuencia de Estrés',
      field: 'stressFrequency',
      icon: Brain,
      isPositive: false,
      description: 'Nivel de estrés experimentado',
      section: 'Salud Mental'
    },
    {
      title: 'Consumo de Alcohol',
      field: 'alcoholProblemAtSchool',
      icon: AlertCircle,
      isPositive: false,
      description: 'Percepción de problemas de alcohol de los estudiantes',
      section: 'Consumo de Sustancias'
    },
    {
      title: 'Limpieza de Baños',
      field: 'bathroomCleaningFrequency',
      icon: CheckCircle,
      isPositive: true,
      description: 'Satisfacción con limpieza de baños',
      section: 'Limpieza'
    }
  ];

  // Define TOP 6 most important indicators for teachers (one per section)
  const teacherIndicators = [
    {
      title: 'Felicidad Laboral',
      field: 'teacherHappiness',
      icon: Heart,
      isPositive: true,
      description: 'Satisfacción con la experiencia laboral',
      section: 'Experiencia Laboral'
    },
    {
      title: 'Recursos Escolares',
      field: 'schoolResources',
      icon: Building,
      isPositive: true,
      description: 'Suficiencia de recursos y materiales',
      section: 'Experiencia Laboral'
    },
    {
      title: 'Problemas de Bullying',
      field: 'bullyingProblemTeacher',
      icon: AlertTriangle,
      isPositive: false,
      description: 'Percepción de bullying como problema',
      section: 'Seguridad y Bullying'
    },
    {
      title: 'Estrés Docente',
      field: 'teacherStressFrequency',
      icon: Brain,
      isPositive: false,
      description: 'Frecuencia de estrés, soledad o tristeza',
      section: 'Salud Mental'
    },
    {
      title: 'Consumo de Alcohol',
      field: 'alcoholProblemAtSchoolTeacher',
      icon: AlertCircle,
      isPositive: false,
      description: 'Percepción de problemas de alcohol de los estudiantes',
      section: 'Consumo de Sustancias'
    },
    {
      title: 'Ambiente Limpio',
      field: 'cleanEnvironmentProvided',
      icon: CheckCircle,
      isPositive: true,
      description: 'Entorno limpio y ordenado proporcionado',
      section: 'Limpieza'
    }
  ];

  const getStatusText = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return 'Bueno';
      case 'warning':
        return 'Atención';
      case 'critical':
        return 'Crítico';
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordForm.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (passwordForm.email !== currentUser.email) {
      newErrors.email = 'El correo electrónico no coincide con tu cuenta';
    }

    if (!passwordForm.currentPassword.trim()) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    if (!passwordForm.newPassword.trim()) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;

    setLoading(true);
    try {
      await updateAdminUserPassword(
        passwordForm.email,
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      alert('Contraseña actualizada exitosamente');
      setShowChangePassword(false);
      setPasswordForm({ email: '', currentPassword: '', newPassword: '' });
      setErrors({});
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.message.includes('incorrect')) {
        setErrors({ currentPassword: 'La contraseña actual es incorrecta' });
      } else {
        alert('Error al actualizar la contraseña. Por favor, intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-emerald-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {currentUser.firstName} {currentUser.lastName}
                </h3>
                <p className="text-gray-600">{currentUser.schoolName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">{currentUser.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700"><strong>Código de Colegio: </strong>{currentUser.schoolCode}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700"><strong>Fecha de registro: </strong>
                  {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700"><strong>Tipo de cuenta: </strong> Administrador Escolar</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-emerald-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas de tu Colegio</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Encuestas Realizadas</span>
                <span className="font-semibold text-emerald-600">{surveyCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Respuestas de Estudiantes</span>
                <span className="font-semibold text-emerald-600">{studentResponses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Respuestas de Docentes</span>
                <span className="font-semibold text-emerald-600">{teacherResponses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado del Sistema</span>
                <span className="font-semibold text-emerald-600">Activo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Indicators - 6 Most Important */}
      {studentResponses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-emerald-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">Principales Indicadores - Estudiantes</h3>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-emerald-600">{surveyPeriod.semester} {surveyPeriod.year}</p>
              <p className="text-xs text-gray-500">Período de las encuestas</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentIndicators.map((indicator) => {
              const analysis = analyzeField(studentResponses, indicator.field, indicator.isPositive);
              const Icon = indicator.icon;
              
              return (
                <div
                  key={`student-${indicator.field}`}
                  className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 text-emerald-600" />
                      <h4 className="font-semibold text-sm text-gray-900">
                        {indicator.title}
                      </h4>
                    </div>
                    {getStatusIcon(analysis.status)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-900">
                        {getStatusText(analysis.status)}
                      </span>
                      <span className="text-xs font-bold text-gray-900">
                        {analysis.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          analysis.status === 'good' ? 'bg-green-500' :
                          analysis.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(analysis.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{indicator.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-emerald-700">{analysis.total} estudiantes</span>
                      <span className="text-xs text-emerald-700 px-1 rounded">{indicator.section}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Teacher Indicators - 6 Most Important */}
      {teacherResponses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-emerald-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">Principales Indicadores - Docentes</h3>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-emerald-600">{surveyPeriod.semester} {surveyPeriod.year}</p>
              <p className="text-xs text-gray-500">Período de las encuestas</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherIndicators.map((indicator) => {
              const analysis = analyzeField(teacherResponses, indicator.field, indicator.isPositive);
              const Icon = indicator.icon;
              
              return (
                <div
                  key={`teacher-${indicator.field}`}
                  className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 text-emerald-600" />
                      <h4 className="font-semibold text-sm text-gray-900">
                        {indicator.title}
                      </h4>
                    </div>
                    {getStatusIcon(analysis.status)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-900">
                        {getStatusText(analysis.status)}
                      </span>
                      <span className="text-xs font-bold text-gray-900">
                        {analysis.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          analysis.status === 'good' ? 'bg-green-500' :
                          analysis.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(analysis.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{indicator.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-emerald-700">{analysis.total} docentes</span>
                      <span className="text-xs text-emerald-700 px-1 rounded">{indicator.section}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {studentResponses.length === 0 && teacherResponses.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin Datos de Encuestas</h3>
            <p className="text-gray-600">
              Los indicadores principales aparecerán aquí una vez que se completen las encuestas de tu colegio.
            </p>
          </div>
        </div>
      )}

      {/* School Info Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
        <div className="flex items-center space-x-3 mb-4">
          <Building className="h-6 w-6 text-emerald-600" />
          <h4 className="text-lg font-semibold text-gray-900">Información del Colegio</h4>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Nombre del Colegio</p>
            <p className="font-medium text-gray-900">{currentUser.schoolName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Código de Acceso</p>
            <p className="font-medium text-gray-900 font-mono">{currentUser.schoolCode}</p>
          </div>
        </div>

      </div>

      {/* Data Privacy Notice */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Privacidad y Seguridad de Datos</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Los datos de cada colegio están completamente separados</li>
              <li>• No hay intercambio de información entre instituciones</li>
              <li>• Solo los administradores autorizados pueden acceder a los datos de su colegio</li>
              <li>• Todas las respuestas de estudiantes son anónimas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <button 
            onClick={() => setShowChangePassword(true)}
            className="p-4 text-left border border-gray-200 rounded-lg hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
          >
            <h5 className="font-medium text-gray-900">Cambiar Contraseña</h5>
            <p className="text-sm text-gray-600">Actualiza tu contraseña de acceso</p>
          </button>
          
          {/* Updated button for Access Management */}
          {currentUser.userType === 'admin' ? (
            <button 
              onClick={onNavigateToUserManagement}
              className="p-4 text-left border border-gray-200 rounded-lg hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
            >
              <h5 className="font-medium text-gray-900">Configurar Accesos</h5>
              <p className="text-sm text-gray-600">Gestiona usuarios y permisos del sistema</p>
            </button>
          ) : (
            <div className="p-4 text-left border border-gray-200 rounded-lg bg-gray-50 opacity-60">
              <h5 className="font-medium text-gray-500">Configurar Accesos</h5>
              <p className="text-sm text-gray-500">Solo disponible para administradores</p>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-6">
              <Lock className="h-6 w-6 text-emerald-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">Cambiar Contraseña</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  id="email"
                  value={passwordForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                  }`}
                  placeholder="Confirma tu correo electrónico"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Actual *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      errors.currentPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                    }`}
                    placeholder="Ingresa tu contraseña actual"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      errors.newPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                    }`}
                    placeholder="Ingresa tu nueva contraseña"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Mínimo 6 caracteres. Debe ser diferente a tu contraseña actual.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordForm({ email: '', currentPassword: '', newPassword: '' });
                    setErrors({});
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}