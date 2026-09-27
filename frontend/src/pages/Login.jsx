import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Package, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('ahmed@epicerie.tn');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Identifiants incorrects ou serveur indisponible.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAndLogin = async () => {
    setEmail('ahmed@epicerie.tn');
    setPassword('demo123');
    setIsLoading(true);
    setError('');
    try {
      await login('ahmed@epicerie.tn', 'demo123');
      navigate('/dashboard');
    } catch (err) {
      setError('Erreur lors de la connexion démo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/50 to-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-2 bg-white rounded-3xl shadow-xl shadow-green-950/10 mb-4 border border-green-100">
          <img src="/logo.png" alt="neostock logo" className="w-20 h-20 object-contain rounded-2xl" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-2">
          <span>neostock</span>
          <span className="text-2xl">🇹🇳</span>
        </h2>
        <p className="mt-2 text-sm text-gray-600 max-w-xs mx-auto font-medium">
          Intelligence artificielle d'approvisionnement & gestion de stock pour le commerce tunisien
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-green-950/5 rounded-3xl border border-gray-100 sm:px-10">
          
          {/* Quick Demo Login Banner */}
          <button
            type="button"
            onClick={fillDemoAndLogin}
            disabled={isLoading}
            className="w-full mb-6 p-3.5 bg-primary-light border-2 border-primary/30 hover:border-primary text-primary-dark rounded-2xl flex items-center justify-between text-xs font-bold transition-all hover:bg-green-100/70 group shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary animate-pulse" />
              <span>Accès Rapide Démo (Ahmed - Épicier)</span>
            </div>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold text-center">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary focus:bg-white focus:border-primary outline-none transition-all"
                placeholder="ahmed@epicerie.tn"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary focus:bg-white focus:border-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-500 border border-gray-200/80 space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-gray-700">
                <ShieldCheck size={14} className="text-primary" />
                <span>Identifiants de démonstration :</span>
              </div>
              <p>Email : <code className="text-primary font-mono font-bold">ahmed@epicerie.tn</code></p>
              <p>Mot de passe : <code className="text-primary font-mono font-bold">demo123</code></p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:ring-4 focus:ring-primary/20 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Connexion en cours...' : 'Se connecter au Tableau de bord'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
