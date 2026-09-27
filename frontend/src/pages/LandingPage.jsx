import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { 
  TrendingUp, AlertTriangle, ShieldCheck, Zap, ArrowRight, 
  CheckCircle2, Sparkles, Package, DollarSign, Bot, Phone, Mail,
  Lock, ArrowDownRight, Layers, HelpCircle, Globe, Users
} from 'lucide-react';

const LandingPage = () => {
  const { login, isAuthenticated } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();

  // État du calculateur de pertes Visiogain adapté
  const [caMensuel, setCaMensuel] = useState(40000);
  const [tauxDemarque, setTauxDemarque] = useState(2.5);

  // État pour la connexion pré-remplie
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Identifiants prêts à l'emploi
  const demoEmail = 'ahmed@epicerie.tn';
  const demoPassword = 'demo123';

  // Calculs dynamiques
  const perteMensuelle = Math.round(caMensuel * (tauxDemarque / 100));
  const gainMensuel = Math.round(perteMensuelle * 0.70); // 70% de récupération avec l'IA
  const gainAnnuel = gainMensuel * 12;

  const handleQuickLogin = async () => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await login(demoEmail, demoPassword);
      navigate('/dashboard');
    } catch (err) {
      setLoginError("Impossible de se connecter au compte démo.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#16201C] font-sans selection:bg-[#0E7A54] selection:text-[#FBF9F5]">
      {/* ── TOP BAR (Style Visiogain) ── */}
      <div className="bg-[#10201A] text-[#CFE3D6] text-xs py-2 px-4 border-b border-green-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <a href="tel:+21658026163" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <span className="w-2 h-2 rounded-full bg-[#14A06B] animate-pulse"></span>
              <span className="font-mono font-semibold">+216 58 026 163</span>
            </a>
            <span className="hidden sm:inline text-green-700">|</span>
            <span className="hidden sm:inline opacity-80">support@neostock.tn</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-300 font-medium hidden md:inline">
              {t('support_tagline')}
            </span>
            <LanguageSwitcher className="bg-white/10 border-white/20 text-white" />
          </div>
        </div>
      </div>

      {/* ── NAVIGATION (Style Visiogain Sticky) ── */}
      <nav className="sticky top-0 z-40 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#EAE4D8] px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-3">
            <img src="/logo.png" alt="neostock logo" className="w-10 h-10 object-contain rounded-xl shadow-xs border border-green-100 p-0.5 bg-white" />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[#16201C] leading-none">neostock</span>
              <span className="text-[10px] font-bold text-[#0E7A54] tracking-wider uppercase mt-0.5">Intelligence Retail IA</span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#3A443E]">
            <a href="#probleme" className="hover:text-[#0E7A54] transition-colors">{t('prob_kicker')}</a>
            <a href="#calc" className="hover:text-[#0E7A54] transition-colors">{t('calc_kicker')}</a>
            <a href="#marche-b2b" className="hover:text-[#0E7A54] transition-colors">{t('market_b2b')}</a>
            <a href="#comment" className="hover:text-[#0E7A54] transition-colors">Process</a>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-[#0E7A54] text-[#FBF9F5] font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:bg-[#0a5a3e] transition-all flex items-center gap-2"
              >
                <span>{t('access_app')}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleQuickLogin}
                disabled={isLoggingIn}
                className="bg-[#0E7A54] text-[#FBF9F5] font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-green-900/10 hover:bg-[#0a5a3e] transition-all flex items-center gap-2"
              >
                <Lock size={15} />
                <span>{isLoggingIn ? '...' : t('quick_login')}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION (Exactement calquée sur Visiogain) ── */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-16 md:pt-20 md:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          {/* Badge alerte rouge */}
          <div className="inline-flex items-center gap-2.5 bg-[#FBEEE9] text-[#C4492D] border border-[#F1D6CC] px-3.5 py-1.5 rounded-full text-xs md:text-sm font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C4492D] animate-ping"></span>
            <span>{t('hero_badge')}</span>
          </div>

          {/* Titre percutant */}
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] text-[#16201C]">
            {t('hero_title_1')} <span className="text-[#0E7A54]">{t('hero_title_2')}</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg md:text-xl text-[#4A544E] leading-relaxed max-w-xl font-medium">
            {t('hero_sub')}
          </p>

          {/* CARTE DE CONNEXION 1 CLIC (READY PUTTED ACCOUNT) */}
          <div className="p-5 bg-white rounded-3xl border-2 border-[#0E7A54]/30 shadow-xl shadow-green-900/5 space-y-4 max-w-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-green-100 text-[#0E7A54] rounded-xl font-bold">👤</span>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('demo_ready')}</div>
                  <div className="text-sm font-black text-gray-900">Ahmed (Épicerie Centrale Tunis)</div>
                </div>
              </div>
              <span className="text-[11px] font-bold bg-green-50 text-[#0E7A54] border border-green-200 px-2.5 py-1 rounded-full">
                Accès Immédiat
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[10px] font-bold">EMAIL DÉMO :</span>
                <span className="font-mono font-bold text-gray-800">{demoEmail}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold">MOT DE PASSE :</span>
                <span className="font-mono font-bold text-gray-800">demo123</span>
              </div>
            </div>

            <button
              onClick={handleQuickLogin}
              disabled={isLoggingIn}
              className="w-full bg-[#0E7A54] hover:bg-[#0a5a3e] text-white font-black text-base py-3.5 px-6 rounded-2xl shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 group"
            >
              <span>{isLoggingIn ? 'Ouverture de votre session...' : 'Se connecter en 1 Clic →'}</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {loginError && (
              <p className="text-xs text-red-600 font-semibold text-center">{loginError}</p>
            )}

            <p className="text-[11.5px] text-gray-500 text-center font-medium">
              Aucune inscription requise. Les données réelles tunisiennes sont déjà chargées.
            </p>
          </div>

          {/* Puces de réassurance */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 bg-[#EBF3EE] text-[#2C6B4E] border border-[#D8E8DF] px-3 py-1.5 rounded-full text-xs font-bold">
              ✓ Compte démo instantané
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[#EBF3EE] text-[#2C6B4E] border border-[#D8E8DF] px-3 py-1.5 rounded-full text-xs font-bold">
              ✓ Marché Tunisien & Dinars (TND)
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[#EBF3EE] text-[#2C6B4E] border border-[#D8E8DF] px-3 py-1.5 rounded-full text-xs font-bold">
              ✓ Google Gemini 2.5 Flash
            </span>
          </div>
        </div>

        {/* MOCKUP INTERACTIF VISIOGAIN (Style Smartphone & Dashboard) */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="relative w-full max-w-[320px] bg-[#16201C] rounded-[40px] p-3 shadow-2xl shadow-green-950/30 border border-gray-800">
            <div className="bg-[#F5F2EB] rounded-[30px] overflow-hidden flex flex-col">
              {/* Header mockup vert */}
              <div className="bg-[#0E7A54] text-[#EAF6EF] p-5">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold opacity-90">
                  <span>Aujourd'hui • Tunis</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full font-bold">Temps Réel</span>
                </div>
                <div className="font-mono font-bold text-3xl mt-2 tracking-tight">+1 240 DT</div>
                <div className="text-xs opacity-90 mt-0.5">Profit estimé du jour</div>
              </div>

              {/* Contenu carte mockup */}
              <div className="p-4 space-y-3">
                {/* Mini graphique */}
                <div className="flex items-end gap-1.5 h-16 px-1 pt-2">
                  <div className="flex-1 h-[40%] bg-[#BFD9C8] rounded-t-sm"></div>
                  <div className="flex-1 h-[65%] bg-[#8FC2A6] rounded-t-sm"></div>
                  <div className="flex-1 h-[50%] bg-[#BFD9C8] rounded-t-sm"></div>
                  <div className="flex-1 h-[85%] bg-[#0E7A54] rounded-t-sm"></div>
                  <div className="flex-1 h-[70%] bg-[#8FC2A6] rounded-t-sm"></div>
                  <div className="flex-1 h-[95%] bg-[#14A06B] rounded-t-sm animate-pulse"></div>
                </div>

                {/* Alerte Rupture */}
                <div className="bg-white border border-[#ECE6DA] rounded-xl p-3 shadow-xs">
                  <div className="text-[11px] font-bold text-red-600 flex items-center justify-between">
                    <span>🔴 RISQUE DE RUPTURE</span>
                    <span className="text-gray-400 font-normal">1.4 jours</span>
                  </div>
                  <div className="font-bold text-sm text-gray-900 mt-1">Couscous Randa 1kg</div>
                  <div className="text-xs text-gray-500 mt-0.5">Stock : 8 unités | Fournisseur : 2j</div>
                </div>

                {/* Alerte Attention */}
                <div className="bg-white border border-[#ECE6DA] rounded-xl p-3 shadow-xs">
                  <div className="text-[11px] font-bold text-amber-600 flex items-center justify-between">
                    <span>🟠 ATTENTION</span>
                    <span className="text-gray-400 font-normal">3.3 jours</span>
                  </div>
                  <div className="font-bold text-sm text-gray-900 mt-1">Harissa Le Phare</div>
                  <div className="text-xs text-gray-500 mt-0.5">Stock : 12 unités | Réappro à préparer</div>
                </div>

                {/* Avis IA */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>Avis IA Gemini 2.5 Flash</span>
                  </div>
                  <p className="text-[11.5px] text-gray-700 mt-1 leading-snug">
                    « Commandez 30 unités de Couscous avant la hausse de fin de semaine. »
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Badge flottant 1 */}
          <div className="hidden sm:block absolute -top-4 -left-6 bg-white border border-[#EDE7DB] rounded-2xl p-3.5 shadow-xl">
            <div className="text-[11px] font-semibold text-gray-500">Économies prévues</div>
            <div className="font-mono font-bold text-lg text-[#0E7A54]">+700 DT / mois</div>
          </div>

          {/* Badge flottant 2 */}
          <div className="hidden sm:block absolute -bottom-4 -right-4 bg-white border border-red-200 rounded-2xl p-3.5 shadow-xl">
            <div className="text-[11px] font-bold text-red-600">Ruptures évitées</div>
            <div className="font-bold text-base text-gray-900">4 références sauvées</div>
          </div>
        </div>
      </section>

      {/* ── BANDEAU DE CONFIANCE (Trust strip) ── */}
      <div className="bg-[#F1ECE1] border-y border-[#EAE4D8] py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-10 text-xs sm:text-sm text-[#5A645E] font-semibold">
          <span>✓ Compte démo prêt sans carte</span>
          <span className="text-[#CDC6B8]">•</span>
          <span>✓ Données réelles Tunisie</span>
          <span className="text-[#CDC6B8]">•</span>
          <span>✓ Modèle Gemini 2.5 Flash</span>
          <span className="text-[#CDC6B8]">•</span>
          <span>✓ Calculateur EOQ intégré</span>
        </div>
      </div>

      {/* ── SECTION LES 3 PROBLÈMES (Style Visiogain) ── */}
      <section id="probleme" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-[#0E7A54] text-xs font-bold tracking-widest uppercase mb-2">Le vrai problème</div>
          <h2 className="text-3xl md:text-4xl font-black text-[#16201C] tracking-tight">
            Les trois façons dont votre magasin perd de l'argent
          </h2>
          <p className="text-base text-gray-600 mt-3">Sans que vous ne vous en rendiez compte. Chaque jour.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Problème 1 */}
          <div className="bg-white border border-[#ECE6DA] rounded-2xl p-7 shadow-xs hover:shadow-md transition-shadow">
            <span className="inline-block bg-[#FBEEE9] text-[#C4492D] text-xs font-bold px-3 py-1 rounded-full mb-4">
              LES RUPTURES
            </span>
            <h3 className="text-xl font-bold text-[#16201C] mb-3">La rupture de stock</h3>
            <p className="text-sm italic text-[#8A5040] border-l-2 border-[#E9C3B7] pl-3 mb-4 leading-relaxed">
              « Chaque produit manquant sur vos étagères, c'est une vente perdue et un client qui file chez le voisin. »
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong>neostock</strong> calcule précisément le délai fournisseur et vous alerte 🔴 quand votre stock ne couvrira plus les ventes avant la livraison.
            </p>
          </div>

          {/* Problème 2 */}
          <div className="bg-white border border-[#ECE6DA] rounded-2xl p-7 shadow-xs hover:shadow-md transition-shadow">
            <span className="inline-block bg-[#FBEEE9] text-[#C4492D] text-xs font-bold px-3 py-1 rounded-full mb-4">
              LE SURSTOCK
            </span>
            <h3 className="text-xl font-bold text-[#16201C] mb-3">Le capital gelé</h3>
            <p className="text-sm italic text-[#8A5040] border-l-2 border-[#E9C3B7] pl-3 mb-4 leading-relaxed">
              « L'argent qui dort dans des cartons qui ne tournent pas, c'est de la trésorerie bloquée inutilement. »
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              La formule mathématique <strong>EOQ (Economic Order Quantity)</strong> optimise chaque commande pour commander la quantité exacte qui maximise vos marges.
            </p>
          </div>

          {/* Problème 3 */}
          <div className="bg-white border border-[#ECE6DA] rounded-2xl p-7 shadow-xs hover:shadow-md transition-shadow">
            <span className="inline-block bg-[#FBEEE9] text-[#C4492D] text-xs font-bold px-3 py-1 rounded-full mb-4">
              LA DÉMARQUE & PRIX
            </span>
            <h3 className="text-xl font-bold text-[#16201C] mb-3">Les écarts imprévus</h3>
            <p className="text-sm italic text-[#8A5040] border-l-2 border-[#E9C3B7] pl-3 mb-4 leading-relaxed">
              « Les pertes et invendus ne sont découverts qu'au comptage de fin d'année, quand il est trop tard. »
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Notre moteur analyse en continu l'historique de consommation sur 12 mois et détecte immédiatement les anomalies de rotation.
            </p>
          </div>
        </div>
      </section>

      {/* ── CALCULATEUR DE PERTES INTERACTIF (Style Visiogain #calc) ── */}
      <section id="calc" className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-[#10201A] rounded-3xl p-8 md:p-12 text-[#EAF3EC] relative overflow-hidden shadow-2xl">
          <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-[#14A06B]/25 to-transparent blur-2xl"></div>

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Colonne curseurs */}
            <div className="space-y-6">
              <div>
                <span className="text-[#39C68B] text-xs font-bold tracking-widest uppercase block mb-1">
                  Calculateur de pertes
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  Combien votre commerce perd-il chaque mois ?
                </h2>
                <p className="text-sm text-[#A9BEB2] mt-2">
                  Faites glisser pour estimer. La rupture de stock et la démarque représentent en moyenne 1.5 % à 4 % du chiffre d'affaires.
                </p>
              </div>

              {/* Slider 1: Chiffre d'affaires */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-sm font-semibold">
                  <span className="text-[#CFE0D6]">Chiffre d'affaires mensuel</span>
                  <span className="font-mono text-white text-lg font-bold">
                    {caMensuel.toLocaleString()} DT
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="1000"
                  value={caMensuel}
                  onChange={(e) => setCaMensuel(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#14A06B]"
                />
              </div>

              {/* Slider 2: Taux estimé */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-sm font-semibold">
                  <span className="text-[#CFE0D6]">Taux de perte / rupture estimé</span>
                  <span className="font-mono text-white text-lg font-bold">
                    {tauxDemarque.toFixed(1)} %
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.1"
                  value={tauxDemarque}
                  onChange={(e) => setTauxDemarque(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#14A06B]"
                />
              </div>
            </div>

            {/* Colonne résultats */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
              <div>
                <span className="text-xs text-[#9FB6A9] font-medium block mb-1">Ce que vous perdez aujourd'hui :</span>
                <div className="font-mono text-2xl md:text-3xl font-bold text-[#F0A28C]">
                  −{perteMensuelle.toLocaleString()} DT <span className="text-xs font-normal text-[#9FB6A9]">/ mois</span>
                </div>
              </div>

              <div className="h-px bg-white/10"></div>

              <div>
                <span className="text-xs text-[#9FB6A9] font-medium block mb-1">Ce que neostock vous fait récupérer :</span>
                <div className="font-mono text-4xl md:text-5xl font-black text-[#39C68B] leading-none">
                  {gainMensuel.toLocaleString()} DT
                </div>
                <div className="text-xs text-[#9FB6A9] mt-2">
                  <span>/ mois</span> • <span className="text-[#CFE0D6] font-bold">{gainAnnuel.toLocaleString()} DT</span> / an
                </div>
              </div>

              <button
                onClick={handleQuickLogin}
                disabled={isLoggingIn}
                className="w-full bg-[#14A06B] hover:bg-[#0e8a5b] text-[#04140D] font-black text-center py-3.5 px-4 rounded-xl shadow-lg shadow-green-900/40 transition-all flex items-center justify-center gap-2"
              >
                <span>{isLoggingIn ? 'Chargement démo...' : 'Récupérer cet argent → Démo en 1 clic'}</span>
              </button>

              <p className="text-[11px] text-[#7E9488] text-center">
                Estimation basée sur la réduction moyenne des ruptures par arbitrage prédictif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION MARCHÉ B2B & STOCKS NATIONAUX (NOUVEAU) ── */}
      <section id="marche-b2b" className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-[#10201A] rounded-3xl p-8 md:p-12 text-white border border-gray-700 shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-700/80 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
                <Globe size={14} />
                <span>Mercuriale Nationale Live • Tunisie 🇹🇳</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
                Marché de Gros & Stocks B2B en Direct
              </h2>
              <p className="text-sm text-gray-300 mt-1 max-w-2xl">
                Suivez les cours de gros en temps réel (Bir El Kassâa, Sfax, Sousse) et mutualisez vos achats pour obtenir jusqu'à -20% de remise d'usine.
              </p>
            </div>

            <button
              onClick={handleQuickLogin}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs md:text-sm px-5 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <span>Accéder au Terminal Marché B2B</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Grille des denrées de référence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-400 font-bold">Café Torréfié Moulu</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full border border-red-500/30">+8.5% 🚨</span>
              </div>
              <div className="font-mono text-2xl font-black text-white">23.500 DT <span className="text-xs font-normal text-gray-400">/kg</span></div>
              <div className="text-[11px] text-amber-300 font-semibold">🔴 Quotas stricts OCT</div>
              <p className="text-[11px] text-gray-400 leading-snug">Flambée Robusta mondiale. Recommandation : stocker immédiatement.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-400 font-bold">Dattes Deglet Nour</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">-8.6% ⭐</span>
              </div>
              <div className="font-mono text-2xl font-black text-white">7.400 DT <span className="text-xs font-normal text-gray-400">/kg</span></div>
              <div className="text-[11px] text-emerald-400 font-semibold">🟢 Nouvelle récolte Djérid</div>
              <p className="text-[11px] text-gray-400 leading-snug">Arrivage massif de saison. Opportunité d'achat groupé volumique.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-400 font-bold">Huile d'Olive Extra</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">+3.6% 📈</span>
              </div>
              <div className="font-mono text-2xl font-black text-white">14.200 DT <span className="text-xs font-normal text-gray-400">/L</span></div>
              <div className="text-[11px] text-gray-300 font-semibold">🟢 Production Sahel/Centre</div>
              <p className="text-[11px] text-gray-400 leading-snug">Demande export soutenue, cours stables sur le marché domestique.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-400 font-bold">Lait UHT Demi-Écrémé</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-500/20 text-gray-300 rounded-full">Réglementé</span>
              </div>
              <div className="font-mono text-2xl font-black text-white">1.350 DT <span className="text-xs font-normal text-gray-400">/L</span></div>
              <div className="text-[11px] text-red-400 font-semibold">🔴 Quota 5 packs max</div>
              <p className="text-[11px] text-gray-400 leading-snug">Basse lactation nationale. Réceptionner vos quotas à chaque tournée.</p>
            </div>
          </div>

          {/* Groupements d'achats live preview */}
          <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
                <Users size={28} />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Groupements d'Achats B2B Actifs</div>
                <div className="text-lg font-black text-white">Mutualisez avec 56 épiceries tunisiennes partenaires</div>
                <p className="text-xs text-gray-300 mt-0.5">
                  Pool en cours : Dattes Tozeur (-20%), Pâtes Warda (-17%), Huile Kairouan (-15.7%).
                </p>
              </div>
            </div>

            <button
              onClick={handleQuickLogin}
              className="bg-white text-gray-900 hover:bg-gray-100 font-black text-xs px-5 py-3 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
            >
              <span>Rejoindre un Pool d'Achat →</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE (3 étapes) ── */}
      <section id="comment" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-[#0E7A54] text-xs font-bold tracking-widest uppercase mb-2">Comment ça marche</div>
          <h2 className="text-3xl md:text-4xl font-black text-[#16201C] tracking-tight">
            Opérationnel immédiatement, compte déjà configuré
          </h2>
          <p className="text-base text-gray-600 mt-3">Prêt à tester pour le Hackathon en un seul clic.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#ECE6DA] rounded-2xl p-7 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#0E7A54] text-white font-mono font-bold flex items-center justify-center text-lg shadow-md">
              1
            </div>
            <h3 className="text-lg font-bold text-gray-900">Catalogue tunisien pré-rempli</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Harissa Le Phare, Couscous Randa, Lait Vitalait, Dattes Deglet Nour, Boga Cidre : tout est déjà saisi avec les prix réels en TND.
            </p>
          </div>

          <div className="bg-white border border-[#ECE6DA] rounded-2xl p-7 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#0E7A54] text-white font-mono font-bold flex items-center justify-center text-lg shadow-md">
              2
            </div>
            <h3 className="text-lg font-bold text-gray-900">IA Gemini 2.5 Flash & Calendrier</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Le moteur croise l'historique des ventes avec les événements culturels (Ramadan x3.0, saison estivale) et vous prévient avant la rupture.
            </p>
          </div>

          <div className="bg-white border border-[#ECE6DA] rounded-2xl p-7 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#0E7A54] text-white font-mono font-bold flex items-center justify-center text-lg shadow-md">
              3
            </div>
            <h3 className="text-lg font-bold text-gray-900">Recommandation EOQ & Bons d'achat</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Quantités économiques exactes à commander, budget prévisionnel calculé et bons de commande B2B générés d'un clic.
            </p>
          </div>
        </div>
      </section>

      {/* ── BANNIÈRE VERTE CE QUI NOUS DISTINGUE ── */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-[#0E7A54] rounded-3xl p-10 md:p-14 text-white text-center relative overflow-hidden shadow-xl">
          <div className="relative max-w-3xl mx-auto space-y-6">
            <span className="text-[#B6E4CB] text-xs font-bold tracking-widest uppercase">
              Ce qui nous distingue
            </span>
            <h2 className="text-3xl md:text-5xl font-black leading-tight">
              Les autres logiciels enregistrent vos ventes. <br />
              <span className="text-emerald-200">neostock protège votre trésorerie.</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-[#DDF1E4] pt-4">
              <span>✓ Alertes de rupture 🔴🟠🟢 en temps réel</span>
              <span>✓ RAG spécialisé marché tunisien</span>
              <span>✓ Accessible sur PC, tablette et mobile</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#EAE4D8] bg-white py-12 px-4 mt-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="neostock" className="w-8 h-8 object-contain rounded-lg" />
            <span className="font-black text-gray-900 text-lg">neostock 🇹🇳</span>
            <span>— Hackathon Come Build with AI (2026)</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span>Compte démo inclus : ahmed@epicerie.tn</span>
            <span>•</span>
            <button onClick={handleQuickLogin} className="text-[#0E7A54] hover:underline font-bold">
              Se connecter
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
