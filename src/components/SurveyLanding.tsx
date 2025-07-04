import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, ChevronRight, CheckCircle, Shield } from 'lucide-react';
import { Header } from './Header';

export function SurveyLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
              <BookOpen className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Encuesta
              <span className="block text-emerald-600">Ambiente Escolar</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Tu opinión es importante para mejorar el ambiente escolar. 
              Participa en nuestra encuesta integral y ayúdanos a crear un mejor entorno de aprendizaje.
            </p>
          </div>

          {/* CTA Button */}
          <div className="mb-16">
            <button
              onClick={() => navigate('/survey/school')}
              className="group inline-flex items-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Iniciar Encuesta
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Participación Anónima</h3>
              <p className="text-gray-600">Tus respuestas son completamente confidenciales y anónimas.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <CheckCircle className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Encuesta Integral</h3>
              <p className="text-gray-600">Cubre todos los aspectos importantes del ambiente escolar.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Shield className="h-6 w-6 text-lime-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ambiente Seguro</h3>
              <p className="text-gray-600">Contribuye a mejorar la seguridad y bienestar escolar.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}