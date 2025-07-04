import { User, BarChart3, LogOut, RefreshCw, Bot, Lightbulb, Menu, X, Users, FileText } from 'lucide-react';
import { useState } from 'react';
import { AdminSection, SurveyResponse, AdminUser } from '../types';
import { ProfileSection } from './ProfileSection';
import { IndicatorsSection } from './IndicatorsSection';
import { AIAgentSection } from './AIAgentSection';
import { RecommendationsSection } from './RecommendationsSection';
import { UserManagementSection } from './UserManagementSection';
import { SurveyManagementSection } from './SurveyManagementSection';

interface AdminDashboardProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onLogout: () => void;
  surveyResponses: SurveyResponse[];
  currentUser: AdminUser | null;
  loading?: boolean;
  onRefreshData?: () => void;
  validSurveyCodes?: any;
}

export function AdminDashboard({ 
  activeSection, 
  onSectionChange, 
  onLogout, 
  surveyResponses,
  currentUser,
  loading = false,
  onRefreshData,
  validSurveyCodes = {}
}: AdminDashboardProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Define menu items based on user type and permissions - REORDERED WITH SURVEY MANAGEMENT SECOND
  const getMenuItems = () => {
    const baseItems = [
      { id: 'profile' as AdminSection, label: 'Mi Perfil', icon: User },
    ];

    // Survey Management - MOVED TO SECOND POSITION (after profile)
    if (currentUser?.userType === 'admin' || currentUser?.permissions?.surveyManagement) {
      baseItems.push({ id: 'survey-management' as AdminSection, label: 'Gestión de Encuestas', icon: FileText });
    }

    // Add other sections based on permissions
    if (currentUser?.userType === 'admin' || currentUser?.permissions?.indicators) {
      baseItems.push({ id: 'indicators' as AdminSection, label: 'Indicadores', icon: BarChart3 });
    }

    if (currentUser?.userType === 'admin' || currentUser?.permissions?.recommendations) {
      baseItems.push({ id: 'recommendations' as AdminSection, label: 'Recomendaciones', icon: Lightbulb });
    }

    if (currentUser?.userType === 'admin' || currentUser?.permissions?.aiAgent) {
      baseItems.push({ id: 'ai-agent' as AdminSection, label: 'Agente Online', icon: Bot });
    }

    // Only admins can access user management
    if (currentUser?.userType === 'admin') {
      baseItems.push({ id: 'user-management' as AdminSection, label: 'Gestión de Usuarios', icon: Users });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleSectionChange = (section: AdminSection) => {
    // Check if user has permission to access this section
    if (section === 'indicators' && currentUser?.userType !== 'admin' && !currentUser?.permissions?.indicators) {
      alert('No tienes permisos para acceder a esta sección');
      return;
    }
    if (section === 'recommendations' && currentUser?.userType !== 'admin' && !currentUser?.permissions?.recommendations) {
      alert('No tienes permisos para acceder a esta sección');
      return;
    }
    if (section === 'ai-agent' && currentUser?.userType !== 'admin' && !currentUser?.permissions?.aiAgent) {
      alert('No tienes permisos para acceder a esta sección');
      return;
    }
    if (section === 'survey-management' && currentUser?.userType !== 'admin' && !currentUser?.permissions?.surveyManagement) {
      alert('No tienes permisos para acceder a esta sección');
      return;
    }
    if (section === 'user-management' && currentUser?.userType !== 'admin') {
      alert('Solo los administradores pueden acceder a la gestión de usuarios');
      return;
    }

    onSectionChange(section);
    setIsMobileSidebarOpen(false); // Close mobile sidebar after selection
  };

  // Function to handle navigation to user management from profile section
  const handleNavigateToUserManagement = () => {
    if (currentUser?.userType === 'admin') {
      onSectionChange('user-management');
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <ProfileSection 
            currentUser={currentUser} 
            surveyCount={surveyResponses.length} 
            surveyResponses={surveyResponses}
            onNavigateToUserManagement={handleNavigateToUserManagement}
          />
        );
      case 'survey-management':
        if (currentUser?.userType === 'admin' || currentUser?.permissions?.surveyManagement) {
          return <SurveyManagementSection currentUser={currentUser} />;
        }
        return <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">No tienes permisos para acceder a esta sección</p>
        </div>;
      case 'indicators':
        if (currentUser?.userType === 'admin' || currentUser?.permissions?.indicators) {
          return <IndicatorsSection surveyResponses={surveyResponses} loading={loading} currentUser={currentUser} validSurveyCodes={validSurveyCodes} />;
        }
        return <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">No tienes permisos para acceder a esta sección</p>
        </div>;
      case 'recommendations':
        if (currentUser?.userType === 'admin' || currentUser?.permissions?.recommendations) {
          return <RecommendationsSection surveyResponses={surveyResponses} currentUser={currentUser} validSurveyCodes={validSurveyCodes} />;
        }
        return <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">No tienes permisos para acceder a esta sección</p>
        </div>;
      case 'ai-agent':
        if (currentUser?.userType === 'admin' || currentUser?.permissions?.aiAgent) {
          return <AIAgentSection surveyResponses={surveyResponses} currentUser={currentUser} />;
        }
        return <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">No tienes permisos para acceder a esta sección</p>
        </div>;
      case 'user-management':
        return <UserManagementSection currentUser={currentUser} />;
      default:
        return (
          <ProfileSection 
            currentUser={currentUser} 
            surveyCount={surveyResponses.length} 
            surveyResponses={surveyResponses}
            onNavigateToUserManagement={handleNavigateToUserManagement}
          />
        );
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'Administrador';
      case 'secondary':
        return 'Usuario Secundario';
      default:
        return 'Usuario';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 relative">
            
            {/* Left - Logo and Mobile Menu Button */}
            <div className="flex items-center space-x-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-gray-100 transition-colors"
              >
                {isMobileSidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
              
              <div className="bg-emerald-600 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Panel Administrativo</span>
                {currentUser && (
                  <p className="text-sm text-gray-600 hidden sm:block">{currentUser.schoolName}</p>
                )}
              </div>
            </div>

            {/* Center - User Info (Hidden on mobile) */}
            {currentUser && (
              <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex flex-col items-center text-center">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-xs text-gray-600">{currentUser.email}</p>
                <p className="text-xs text-emerald-600 font-medium">
                  {getUserTypeLabel(currentUser.userType)}
                  {currentUser.position && ` • ${currentUser.position}`}
                </p>
              </div>
            )}

            {/* Right - Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {onRefreshData && (
                <button
                  onClick={onRefreshData}
                  className="flex items-center px-2 sm:px-3 py-2 text-gray-600 hover:text-emerald-600 transition-colors"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center px-2 sm:px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile User Info (Visible only on mobile when sidebar is closed) */}
      {currentUser && !isMobileSidebarOpen && (
        <div className="md:hidden bg-emerald-50 border-b border-emerald-200 px-4 py-3">
          <div className="text-center">
            <p className="text-sm font-medium text-emerald-900">
              {currentUser.firstName} {currentUser.lastName}
            </p>
            <p className="text-xs text-emerald-700">{currentUser.schoolName}</p>
            <p className="text-xs text-emerald-600 font-medium">
              {getUserTypeLabel(currentUser.userType)}
              {currentUser.position && ` • ${currentUser.position}`}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex gap-4 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4 sticky top-8">
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSectionChange(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                          activeSection === item.id
                            ? 'bg-emerald-100 text-emerald-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                        {item.id === 'ai-agent' && (
                          <span className="ml-auto bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                            IA
                          </span>
                        )} 
                        {item.id === 'user-management' && currentUser?.userType === 'admin' && (
                          <span className="ml-auto bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                            Admin
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Mobile Sidebar Overlay */}
          {isMobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              
              {/* Sidebar */}
              <div className="relative bg-white w-80 max-w-sm h-full shadow-xl">
                <div className="p-4">
                  {/* Mobile Sidebar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-600 p-2 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-lg font-bold text-gray-900">Panel Admin</span>
                    </div>
                    <button
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="p-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* User Info in Mobile Sidebar */}
                  {currentUser && (
                    <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-sm font-medium text-emerald-900">
                        {currentUser.firstName} {currentUser.lastName}
                      </p>
                      <p className="text-xs text-emerald-700 mb-2">{currentUser.email}</p>
                      <p className="text-xs font-medium text-emerald-700 mb-1">Tu Colegio</p>
                      <p className="text-sm text-emerald-600 font-medium">{currentUser.schoolName}</p>
                      <p className="text-xs text-emerald-600 mt-1">
                        {surveyResponses.length} encuestas realizadas
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        {getUserTypeLabel(currentUser.userType)}
                        {currentUser.position && ` • ${currentUser.position}`}
                      </p>
                    </div>
                  )}

                  {/* Mobile Navigation */}
                  <nav>
                    <ul className="space-y-2">
                      {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => handleSectionChange(item.id)}
                              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                                activeSection === item.id
                                  ? 'bg-emerald-100 text-emerald-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <Icon className="h-5 w-5 mr-3" />
                              {item.label}
                              {item.id === 'ai-agent' && (
                                <span className="ml-auto bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                                  IA
                                </span>
                              )}
                              {item.id === 'user-management' && currentUser?.userType === 'admin' && (
                                <span className="ml-auto bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                                  Admin
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {loading && activeSection === 'indicators' && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mr-3"></div>
                  <span className="text-gray-600">Cargando datos de {currentUser?.schoolName}...</span>
                </div>
              </div>
            )}
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}