import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { LoginCredentials, AdminUser } from '../types';
import { getAdminUserByEmail } from '../services/firestoreService';
import { SecureDataManager } from '../config/secureData';

interface AdminLoginProps {
  onLogin: (user: AdminUser) => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<Partial<LoginCredentials>>({});
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'firebase' | 'local' | 'error'>('checking');

  const secureDataManager = SecureDataManager.getInstance();

  // Test connection on component mount
  useState(() => {
    const testConnection = async () => {
      try {
        await getAdminUserByEmail('test@test.com');
        setConnectionStatus('firebase');
      } catch (error) {
        console.log('Firebase no disponible, usando modo local');
        setConnectionStatus('local');
      }
    };
    testConnection();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Partial<LoginCredentials> = {};

    if (!credentials.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    }

    if (!credentials.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        let userFound = false;

        // PRIORIDAD 1: Intentar con Firebase primero (donde debe estar ssotod@udd.cl)
        if (connectionStatus === 'firebase') {
          try {
            const user = await getAdminUserByEmail(credentials.email);
            
            if (user && user.password === credentials.password) {
              // ASEGURAR QUE ssotod@udd.cl SEA ADMIN
              let userToLogin = { ...user };
              delete userToLogin.password; // Remove password from user object
              
              // Si es ssotod@udd.cl, forzar que sea admin
              if (credentials.email.toLowerCase() === 'ssotod@udd.cl') {
                userToLogin.userType = 'admin';
              }
              
              onLogin(userToLogin);
              userFound = true;
            }
          } catch (firebaseError) {
            console.log('Error con Firebase, intentando con validación segura:', firebaseError);
            setConnectionStatus('local');
          }
        }

        // PRIORIDAD 2: Solo si Firebase falla, usar validación segura como fallback
        if (!userFound && connectionStatus === 'local') {
          const validation = await secureDataManager.validateAdminCredentials(credentials.email, credentials.password);
          if (validation.valid && validation.user) {
            // Asegurar que ssotod@udd.cl sea admin
            if (credentials.email.toLowerCase() === 'ssotod@udd.cl') {
              validation.user.userType = 'admin';
            }
            onLogin(validation.user);
            userFound = true;
          }
        }

        // PRIORIDAD 3: Como último recurso, verificar localStorage (solo para desarrollo)
        if (!userFound) {
          const localUsers = JSON.parse(localStorage.getItem('schooly_users') || '[]');
          const localUser = localUsers.find((u: any) => 
            u.email.toLowerCase() === credentials.email.toLowerCase() && 
            u.password === credentials.password
          );

          if (localUser) {
            // Asegurar que ssotod@udd.cl sea admin
            if (credentials.email.toLowerCase() === 'ssotod@udd.cl') {
              localUser.userType = 'admin';
            }
            
            const { password, ...userWithoutPassword } = localUser;
            onLogin(userWithoutPassword);
            userFound = true;
          }
        }

        if (!userFound) {
          alert('Credenciales incorrectas. Intenta nuevamente.');
        }
      } catch (error) {
        console.error('Error during login:', error);
        alert('Error al iniciar sesión. Por favor, intenta nuevamente.');
        setConnectionStatus('error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'checking':
        return { icon: AlertCircle, text: 'Verificando conexión...', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
      case 'firebase':
        return { icon: CheckCircle, text: 'Conectado', color: 'text-green-600 bg-green-50 border-green-200' };
      case 'local':
        return { icon: AlertCircle, text: 'Modo local activo', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'error':
        return { icon: AlertCircle, text: 'Error de conexión', color: 'text-red-600 bg-red-50 border-red-200' };
      default:
        return { icon: AlertCircle, text: 'Estado desconocido', color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  const statusInfo = getConnectionStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Inicio
        </button>

        {/* Connection Status */}
        <div className={`mb-6 p-3 rounded-lg border ${statusInfo.color}`}>
          <div className="flex items-center space-x-2">
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{statusInfo.text}</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ingreso Admin</h2>
            <p className="text-gray-600">Accede al panel administrativo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={credentials.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                  }`}
                  placeholder="correo@ejemplo.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                  }`}
                  placeholder="Ingresa tu contraseña"
                  disabled={loading}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">
              ¿No tienes una cuenta?
            </p>
            <button
              onClick={() => navigate('/admin/register')}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Registrarse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}