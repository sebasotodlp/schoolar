import React from 'react';
import { BookOpen, Play, FileText, Video, ExternalLink } from 'lucide-react';

export function TutorialsSection() {
  const tutorials = [
    {
      id: 1,
      title: 'Cómo interpretar los gráficos de pizza',
      description: 'Aprende a leer y analizar los datos de las encuestas representados en gráficos circulares.',
      type: 'video',
      duration: '5 min',
      icon: Video,
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      id: 2,
      title: 'Exportación de datos y reportes',
      description: 'Guía paso a paso para exportar los resultados de las encuestas en diferentes formatos.',
      type: 'article',
      duration: '3 min',
      icon: FileText,
      color: 'bg-teal-100 text-teal-600'
    },
    {
      id: 3,
      title: 'Configuración del panel administrativo',
      description: 'Personaliza tu panel de control y configura las opciones de visualización.',
      type: 'video',
      duration: '8 min',
      icon: Video,
      color: 'bg-lime-100 text-lime-600'
    },
    {
      id: 4,
      title: 'Análisis estadístico básico',
      description: 'Conceptos fundamentales para interpretar los resultados de las encuestas educativas.',
      type: 'article',
      duration: '10 min',
      icon: FileText,
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      id: 5,
      title: 'Gestión de usuarios y permisos',
      description: 'Administra el acceso al sistema y configura diferentes niveles de permisos.',
      type: 'video',
      duration: '6 min',
      icon: Video,
      color: 'bg-teal-100 text-teal-600'
    },
    {
      id: 6,
      title: 'Mejores prácticas en encuestas educativas',
      description: 'Consejos y recomendaciones para diseñar encuestas efectivas en el ámbito educativo.',
      type: 'article',
      duration: '12 min',
      icon: FileText,
      color: 'bg-lime-100 text-lime-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <BookOpen className="h-6 w-6 text-emerald-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Tutoriales</h2>
        </div>
        <p className="text-gray-600 mt-2">
          Aprende a usar todas las funcionalidades del panel administrativo
        </p>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
        <div className="flex items-start space-x-4">
          <div className="bg-emerald-600 p-3 rounded-lg">
            <Play className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Guía de Inicio Rápido</h3>
            <p className="text-gray-600 mb-4">
              ¿Primera vez usando el panel? Comienza con esta guía completa que te llevará paso a paso 
              por todas las funcionalidades principales.
            </p>
            <button className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              <Play className="h-4 w-4 mr-2" />
              Ver Tutorial Completo
            </button>
          </div>
        </div>
      </div>

      {/* Tutorials Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial) => {
          const Icon = tutorial.icon;
          return (
            <div key={tutorial.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${tutorial.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {tutorial.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {tutorial.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {tutorial.duration}
                    </span>
                    <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center">
                      Ver
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preguntas Frecuentes</h3>
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-medium text-gray-900 mb-2">¿Cómo puedo exportar los datos de las encuestas?</h4>
            <p className="text-gray-600 text-sm">
              Ve a la sección de Indicadores y haz clic en el botón "Exportar Datos" en la esquina superior derecha.
            </p>
          </div>
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-medium text-gray-900 mb-2">¿Los datos de las encuestas son anónimos?</h4>
            <p className="text-gray-600 text-sm">
              Sí, todas las respuestas son completamente anónimas y no se almacena información personal identificable.
            </p>
          </div>
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-medium text-gray-900 mb-2">¿Puedo personalizar los gráficos?</h4>
            <p className="text-gray-600 text-sm">
              Los gráficos se generan automáticamente basados en los datos. Puedes filtrar por curso para ver estadísticas específicas.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">¿Cómo cambio mi contraseña?</h4>
            <p className="text-gray-600 text-sm">
              Ve a la sección "Mi Perfil" y haz clic en "Cambiar Contraseña" en la sección de configuración.
            </p>
          </div>
        </div>
      </div>

      {/* Support Contact */}
      <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Necesitas más ayuda?</h3>
          <p className="text-gray-600 mb-4">
            Si no encuentras lo que buscas en los tutoriales, no dudes en contactarnos.
          </p>
          <button className="inline-flex items-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Contactar Soporte
          </button>
        </div>
      </div>
    </div>
  );
}