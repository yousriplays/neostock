import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { LayoutDashboard, Package, Bot, BadgeDollarSign, TrendingUp, Globe, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', name: t('dashboard'), icon: <LayoutDashboard size={20} /> },
    { path: '/market', name: t('market_b2b'), icon: <TrendingUp size={20} /> },
    { path: '/products', name: t('products'), icon: <Package size={20} /> },
    { path: '/predictions', name: t('predictions'), icon: <Bot size={20} /> },
    { path: '/transactions', name: t('transactions'), icon: <BadgeDollarSign size={20} /> },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-primary-dark text-white p-3 flex justify-between items-center fixed top-0 w-full z-20 shadow-md">
        <div className="flex items-center gap-2 font-black text-lg tracking-tight">
          <img src="/logo.png" alt="neostock" className="w-7 h-7 rounded-lg object-contain bg-white/10 p-0.5" />
          <span>neostock</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="scale-90" />
          <button onClick={toggleMenu} className="p-1">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-10 w-64 bg-primary-dark text-white flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 pt-16 md:pt-0' : '-translate-x-full md:translate-x-0 pt-0'}
      `}>
        <div className="hidden md:flex p-5 items-center gap-3 border-b border-green-800/60">
          <img src="/logo.png" alt="neostock" className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1 shadow-inner" />
          <div className="flex flex-col">
            <span className="tracking-tight text-white font-extrabold text-xl leading-none">neostock</span>
            <span className="text-[10px] text-green-300 font-semibold tracking-wider uppercase mt-1">Smart Retail AI</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 md:mt-0">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary text-white font-medium shadow-md' : 'text-green-100 hover:bg-green-800'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-green-800">
          <div className="mb-3 px-4 text-xs font-semibold text-green-300 truncate">
            👤 {user?.email || 'ahmed@epicerie.tn'}
          </div>
          <NavLink
            to="/"
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-green-200 hover:bg-green-800 rounded-lg transition-colors text-xs font-semibold mb-2"
          >
            <Globe size={18} />
            <span>{t('view_landing')}</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-300 hover:bg-red-900/30 rounded-lg transition-colors text-xs font-semibold"
          >
            <LogOut size={18} />
            {t('logout')}
          </button>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Navbar;
