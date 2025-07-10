import { GraduationCap, Settings, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => handleNavigation('/')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <GraduationCap className="h-6 w-6 text-emerald-600" />
            <span className="text-xl font-bold text-emerald-600">schoolar</span>
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <nav className="flex space-x-8">
              <button 
                onClick={() => handleNavigation('/')}
                className={`transition-colors ${
                  location.pathname === '/' 
                    ? 'text-emerald-600 font-medium' 
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                Inicio
              </button>
              <button 
                onClick={() => handleNavigation('/about')}
                className={`transition-colors ${
                  location.pathname === '/about' 
                    ? 'text-emerald-600 font-medium' 
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                Acerca de
              </button>
              <button 
                onClick={() => handleNavigation('/survey')}
                className={`transition-colors ${
                  location.pathname === '/survey' 
                    ? 'text-emerald-600 font-medium' 
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                Encuesta
              </button>
              <button 
                onClick={() => handleNavigation('/contact')}
                className={`transition-colors ${
                  location.pathname === '/contact' 
                    ? 'text-emerald-600 font-medium' 
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                Contacto
              </button>
            </nav>
            <button
              onClick={() => handleNavigation('/admin/login')}
              className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              Ingreso Admin
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3 pt-4">
              <button 
                onClick={() => handleNavigation('/')}
                className={`text-left px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/' 
                    ? 'text-emerald-600 font-medium bg-emerald-50' 
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                }`}
              >
                Inicio
              </button>
              <button 
                onClick={() => handleNavigation('/about')}
                className={`text-left px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/about' 
                    ? 'text-emerald-600 font-medium bg-emerald-50' 
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                }`}
              >
                Acerca de
              </button>
              <button 
                onClick={() => handleNavigation('/survey')}
                className={`text-left px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/survey' 
                    ? 'text-emerald-600 font-medium bg-emerald-50' 
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                }`}
              >
                Encuesta
              </button>
              <button 
                onClick={() => handleNavigation('/contact')}
                className={`text-left px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/contact' 
                    ? 'text-emerald-600 font-medium bg-emerald-50' 
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                }`}
              >
                Contacto
              </button>
              <button
                onClick={() => handleNavigation('/admin/login')}
                className="flex items-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors mt-3"
              >
                <Settings className="h-4 w-4 mr-2" />
                Ingreso Admin
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}