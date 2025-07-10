import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Eye, Settings, CheckCircle, AlertCircle, X, Clock, Search, Filter, ChevronDown, ChevronRight, Users, BookOpen, Shield, Brain, Wine, Droplets } from 'lucide-react';
import { AdminUser, CustomSurvey, CustomSurveySection, CustomSurveyQuestion } from '../types';
import { getCustomSurveysBySchool, saveCustomSurvey, updateCustomSurvey, deleteCustomSurvey, generateSurveyCode } from '../services/customSurveyService';
import { SecureDataManager } from '../config/secureData';

interface SurveyManagementSectionProps {
  currentUser: AdminUser | null;
}

export function SurveyManagementSection({ currentUser }: SurveyManagementSectionProps) {
  const [customSurveys, setCustomSurveys] = useState<CustomSurvey[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'predefined' | 'custom'>('predefined');
  const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'student' | 'teacher'>('all');

  const secureDataManager = SecureDataManager.getInstance();

  // Load custom surveys on component mount
  useEffect(() => {
    if (currentUser && currentUser.schoolCode) {
      loadCustomSurveys();
    }
  }, [currentUser]);

  const loadCustomSurveys = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const surveys = await getCustomSurveysBySchool(currentUser.schoolCode);
      setCustomSurveys(surveys);
    } catch (error) {
      console.error('Error loading custom surveys:', error);
      alert('Error al cargar las encuestas personalizadas');
    } finally {
      setLoading(false);
    }
  };

  // Get predefined surveys for the current school
  const getPredefinedSurveys = () => {
    if (!currentUser) return [];
    
    const allSurveys = secureDataManager.getAvailableSurveys();
    return allSurveys.filter(survey => survey.schoolCode === currentUser.schoolCode);
  };

  const predefinedSurveys = getPredefinedSurveys();

  // Filter surveys based on search and type
  const filteredPredefinedSurveys = predefinedSurveys.filter(survey => {
    const matchesSearch = survey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || survey.type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredCustomSurveys = customSurveys.filter(survey => {
    const matchesSearch = survey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.surveyCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || survey.surveyType === filterType;
    return matchesSearch && matchesType;
  });

  const getSectionIcon = (sectionName: string) => {
    const name = sectionName.toLowerCase();
    if (name.includes('general') || name.includes('demográf')) return Users;
    if (name.includes('experiencia') || name.includes('escolar')) return BookOpen;
    if (name.includes('seguridad') || name.includes('bullying')) return Shield;
    if (name.includes('mental') || name.includes('salud')) return Brain;
    if (name.includes('alcohol') || name.includes('droga') || name.includes('sustancia')) return Wine;
    if (name.includes('limpieza') || name.includes('higiene')) return Droplets;
    return FileText;
  };

  const getTypeColor = (type: string) => {
    return type === 'teacher' 
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getTypeLabel = (type: string) => {
    return type === 'teacher' ? 'Docentes' : 'Estudiantes';
  };

  // Check if current user has permission to manage surveys
  if (!currentUser || (currentUser.userType !== 'admin' && !currentUser.permissions?.surveyManagement)) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-500">No tienes permisos para acceder a la gestión de encuestas.</p>
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
            <FileText className="h-6 w-6 text-emerald-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Encuestas</h2>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Administra las encuestas predeterminadas y personalizadas de tu colegio
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar encuestas por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'student' | 'teacher')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              >
                <option value="all">Todos los tipos</option>
                <option value="student">Estudiantes</option>
                <option value="teacher">Docentes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('predefined')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'predefined'
                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Encuestas Predeterminadas ({filteredPredefinedSurveys.length})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'custom'
                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Encuestas Personalizadas ({filteredCustomSurveys.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Predefined Surveys Tab */}
          {activeTab === 'predefined' && (
            <div className="space-y-4">
              {filteredPredefinedSurveys.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm || filterType !== 'all' ? 'No se encontraron encuestas' : 'No hay encuestas predeterminadas'}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || filterType !== 'all' 
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'No hay encuestas predeterminadas disponibles para tu colegio'
                    }
                  </p>
                </div>
              ) : (
                filteredPredefinedSurveys.map((survey) => (
                  <div key={survey.code} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setExpandedSurvey(expandedSurvey === survey.code ? null : survey.code)}
                            className="text-gray-600 hover:text-emerald-600 transition-colors"
                          >
                            {expandedSurvey === survey.code ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{survey.name}</h3>
                            <p className="text-sm text-gray-600">Código: {survey.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(survey.type)}`}>
                            {getTypeLabel(survey.type)}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            Predeterminada
                          </span>
                          <button
                            onClick={() => setExpandedSurvey(expandedSurvey === survey.code ? null : survey.code)}
                            className="flex items-center px-3 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedSurvey === survey.code && (
                      <div className="p-6 bg-white">
                        <div className="mb-6">
                          <h4 className="text-md font-semibold text-gray-900 mb-2">Información General</h4>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Tipo de encuesta:</span>
                              <p className="text-gray-600">{getTypeLabel(survey.type)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Estado:</span>
                              <p className="text-green-600 font-medium">Activa</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h5 className="font-medium text-blue-900 mb-1">Encuesta Predeterminada</h5>
                              <p className="text-sm text-blue-700">
                                Esta es una encuesta estándar del sistema. Las preguntas y estructura están predefinidas 
                                y no pueden ser modificadas. Está diseñada para evaluar el ambiente escolar de manera 
                                integral y estandarizada.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Custom Surveys Tab */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              {/* Coming Soon Message */}
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200">
                  <Clock className="h-16 w-16 text-emerald-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Encuestas Personalizadas</h3>
                  <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                    Esta funcionalidad estará disponible próximamente. Podrás crear encuestas completamente 
                    personalizadas adaptadas a las necesidades específicas de tu colegio.
                  </p>
                  
                  <div className="bg-white rounded-lg p-6 border border-emerald-200 max-w-md mx-auto">
                    <h4 className="font-semibold text-gray-900 mb-3">¿Qué podrás hacer?</h4>
                    <ul className="text-sm text-gray-600 space-y-2 text-left">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" />
                        Crear preguntas personalizadas
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" />
                        Organizar por secciones temáticas
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" />
                        Configurar opciones de respuesta
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" />
                        Generar códigos únicos
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" />
                        Activar/desactivar encuestas
                      </li>
                    </ul>
                  </div>
                  
                  <div className="mt-6">
                    <span className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                      <Clock className="h-4 w-4 mr-2" />
                      Próximamente disponible
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-emerald-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-emerald-900 mb-1">Sobre la gestión de encuestas:</h4>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>• Las encuestas predeterminadas están diseñadas por expertos en educación</li>
              <li>• Cubren todas las áreas importantes del ambiente escolar</li>
              <li>• Son compatibles con análisis estadísticos y recomendaciones del sistema</li>
              <li>• Las encuestas personalizadas te permitirán adaptar las preguntas a tu contexto específico</li>
              <li>• Todos los datos se mantienen seguros y privados para tu colegio</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}