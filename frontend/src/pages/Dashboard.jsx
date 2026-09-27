import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { 
  Package, AlertTriangle, DollarSign, TrendingUp, Plus, Bot, 
  Sparkles, CheckCircle2, AlertOctagon, ArrowRight, RefreshCw, ShoppingCart 
} from 'lucide-react';
import api from '../api';
import KPICard from '../components/KPICard';
import StockChart from '../components/StockChart';

const Dashboard = () => {
  const { t, language } = useContext(LanguageContext);
  const [stats, setStats] = useState({ total_products: 0, alerts_count: 0, total_value_tnd: 0, suggested_orders: 0 });
  const [products, setProducts] = useState([]);
  const [aiAlerts, setAiAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Formulaire d'analyse et d'ajout de produit en direct
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productForm, setProductForm] = useState({
    name: 'Harissa Le Phare du Cap Bon',
    category: 'condiments',
    unit: 'tube',
    current_stock: 12,
    buy_price_tnd: 2.1,
    sell_price_tnd: 2.8,
    min_stock: 30,
    max_stock: 300,
    supplier: 'Société Le Phare',
    supplier_lead_days: 3,
    avg_daily_sales: 3.5
  });

  // Résultat de recommandation IA en direct
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [statsRes, productsRes, aiAlertsRes] = await Promise.all([
        api.get('/products/stats').catch(() => ({ data: { total_products: 10, alerts_count: 4, total_value_tnd: 2450.0 } })),
        api.get('/products').catch(() => ({ data: [] })),
        api.get('/ai/alerts').catch(() => ({ data: { alerts: [], total: 0 } }))
      ]);

      const alertsData = aiAlertsRes.data?.alerts || aiAlertsRes.data || [];

      setStats({
        total_products: statsRes.data.total_products || 10,
        alerts_count: alertsData.length || statsRes.data.alerts_count || 0,
        total_value_tnd: statsRes.data.total_value_tnd || 2450.0,
        suggested_orders: alertsData.filter(a => a.risk_level === 'CRITICAL' || a.risk_level === 'WARNING').length || statsRes.data.alerts_count || 0
      });

      const prods = productsRes.data || [];
      setProducts(prods);

      // Map backend alerts to UI format
      const mappedAlerts = alertsData.map(a => ({
        id: a.product_id,
        product: a.product_name,
        risk: a.risk,
        riskLevel: a.risk_level,
        days: a.days_until_stockout,
        lead_days: a.lead_days,
        trend: a.trend || '',
        recommendation: a.action,
        supplier: a.supplier || ''
      }));

      setAiAlerts(mappedAlerts);

      // Pré-sélectionner le premier produit
      if (prods.length > 0 && !selectedProductId) {
        selectProductForAnalysis(prods[0]);
      }
    } catch (err) {
      console.error("Erreur chargement dashboard", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectProductForAnalysis = (prod) => {
    setSelectedProductId(prod.id);
    const history = prod.sales_history || [];
    const avgMonthly = history.length >= 3 
      ? history.slice(-3).reduce((a, b) => a + b, 0) / 3 
      : 60;
    const daily = parseFloat((avgMonthly / 30).toFixed(1));

    setProductForm({
      name: prod.name,
      category: prod.category || 'condiments',
      unit: prod.unit || 'unité',
      current_stock: prod.current_stock,
      buy_price_tnd: prod.buy_price_tnd,
      sell_price_tnd: prod.sell_price_tnd,
      min_stock: prod.min_stock || 20,
      max_stock: prod.max_stock || 200,
      supplier: prod.supplier || 'Fournisseur Local',
      supplier_lead_days: prod.supplier_lead_days || 3,
      avg_daily_sales: daily > 0 ? daily : 2.5
    });

    // Déclencher automatiquement une analyse via l'API backend
    analyzeStockViaAPI(prod.id);
  };

  const analyzeStockViaAPI = async (productId) => {
    setIsAnalyzing(true);
    try {
      const [recRes, predRes] = await Promise.all([
        api.post('/ai/recommend', { product_id: productId }),
        api.post('/ai/predict', { product_id: productId })
      ]);
      const rec = recRes.data;
      const pred = predRes.data;

      const type = rec.status === 'danger' ? 'error' : rec.status === 'warning' ? 'warning' : 'success';

      setAiRecommendation({
        type,
        title: rec.status_label,
        message: rec.message,
        jours_avant_rupture: rec.jours_avant_rupture,
        delai_fournisseur: rec.delai_fournisseur,
        suggestedQty: rec.recommended_quantity,
        estimatedCost: rec.estimated_cost_tnd,
        isUrgent: rec.should_order,
        productName: rec.product_name,
        // Données pro supplémentaires
        eoq: rec.eoq,
        reorderPoint: rec.reorder_point,
        safetyStock: rec.safety_stock,
        marginPct: rec.margin_pct,
        stockTurnover: rec.stock_turnover,
        stockValue: rec.stock_value_tnd,
        dailyDemand: rec.daily_demand,
        monthlyDemand: rec.monthly_demand,
        urgency: rec.urgency,
        supplier: rec.supplier,
        aiReview: rec.ai_review,
        modelUsed: rec.model_used,
        // Prédiction
        predictedDemand: pred.predicted_demand,
        predConfidence: pred.confidence_pct,
        predTrend: pred.trend,
        predMethods: pred.methods,
        predSeasonalFactor: pred.seasonal_factor,
        predSeasonalEvents: pred.seasonal_events,
        predVariability: pred.variability_cv,
        predReasoning: pred.reasoning,
        predModelUsed: pred.model_used
      });
    } catch (err) {
      console.error("AI Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };


  const handleProductSelectChange = (e) => {
    const id = e.target.value;
    setSelectedProductId(id);
    if (id === 'NEW') {
      setProductForm({
        name: '',
        category: 'condiments',
        unit: 'pièce',
        current_stock: 10,
        buy_price_tnd: 2.0,
        sell_price_tnd: 2.8,
        min_stock: 25,
        max_stock: 200,
        supplier: 'Grossiste Tunis',
        supplier_lead_days: 3,
        avg_daily_sales: 3.0
      });
      setAiRecommendation(null);
    } else {
      const prod = products.find(p => p.id === id);
      if (prod) selectProductForAnalysis(prod);
    }
  };




  const handleManualAnalyze = async (e) => {
    e.preventDefault();
    if (selectedProductId && selectedProductId !== 'NEW') {
      await analyzeStockViaAPI(selectedProductId);
    }
  };

  const handleSaveProduct = async () => {
    try {
      const payload = {
        id: selectedProductId && selectedProductId !== 'NEW' ? selectedProductId : `P${Date.now().toString().slice(-4)}`,
        name: productForm.name,
        category: productForm.category,
        unit: productForm.unit,
        buy_price_tnd: parseFloat(productForm.buy_price_tnd),
        sell_price_tnd: parseFloat(productForm.sell_price_tnd),
        current_stock: parseInt(productForm.current_stock),
        min_stock: parseInt(productForm.min_stock),
        max_stock: parseInt(productForm.max_stock),
        supplier: productForm.supplier,
        supplier_lead_days: parseInt(productForm.supplier_lead_days),
        sales_history: [
          Math.round(productForm.avg_daily_sales * 28),
          Math.round(productForm.avg_daily_sales * 30),
          Math.round(productForm.avg_daily_sales * 31)
        ],
        months: ['Juil', 'Aoû', 'Sep']
      };

      if (selectedProductId && selectedProductId !== 'NEW') {
        await api.put(`/products/${selectedProductId}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setSaveSuccessMsg(`✅ Produit "${productForm.name}" sauvegardé avec succès !`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      alert("Erreur lors de la sauvegarde du produit.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="animate-spin text-primary" size={36} />
        <p className="text-gray-600 font-medium">{t('dash_loading')}</p>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      {/* Top Header with LanguageSwitcher strictly on the LEFT SIDE of the page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <LanguageSwitcher className="shadow-xs border border-gray-200" />
          <div className="h-7 w-px bg-gray-200 hidden sm:block"></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('dash_header')}</h1>
              <span className="text-lg">🇹🇳</span>
            </div>
            <p className="text-gray-500 capitalize text-xs mt-0.5">{currentDate} • {t('dash_market')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button 
            onClick={() => { setRefreshing(true); loadData(); }} 
            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {t('dash_refresh')}
          </button>
          <Link 
            to="/predictions" 
            className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-all text-sm font-semibold shadow-md shadow-primary/20"
          >
            <Bot size={18} />
            {t('dash_assistant_btn')}
          </Link>
        </div>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Package size={24} />} title={t('kpi_products')} value={stats.total_products} subtitle={t('kpi_products_sub')} color="primary" />
        <KPICard icon={<AlertTriangle size={24} />} title={t('kpi_alerts')} value={stats.alerts_count} subtitle={t('kpi_alerts_sub')} color="danger" />
        <KPICard icon={<DollarSign size={24} />} title={t('kpi_value')} value={`${stats.total_value_tnd.toLocaleString()} TND`} subtitle={t('kpi_value_sub')} color="success" />
        <KPICard icon={<TrendingUp size={24} />} title={t('kpi_suggested')} value={stats.suggested_orders} subtitle={t('kpi_suggested_sub')} color="warning" />
      </div>

      {/* SECTION VEDETTE : SIMULATEUR PRODUIT & RECOMMANDATION IA */}
      <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50/40 p-6 md:p-8 rounded-3xl border-2 border-primary/20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary text-white rounded-2xl shadow-sm">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('sim_title')}</h2>
              <p className="text-sm text-gray-600">{t('sim_sub')}</p>
            </div>
          </div>
          <div className="w-full md:w-72">
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t('sim_select')}</label>
            <select
              value={selectedProductId}
              onChange={handleProductSelectChange}
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm font-medium"
            >
              <option value="NEW">{t('sim_new')}</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.current_stock})
                </option>
              ))}
            </select>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} />
            {saveSuccessMsg}
          </div>
        )}

        <form onSubmit={handleManualAnalyze} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('sim_name')}</label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
              placeholder="ex: Harissa Le Phare"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('sim_stock')}</label>
            <input
              type="number"
              min="0"
              required
              value={productForm.current_stock}
              onChange={(e) => setProductForm({ ...productForm, current_stock: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('sim_buy_price')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={productForm.buy_price_tnd}
              onChange={(e) => setProductForm({ ...productForm, buy_price_tnd: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('sim_daily_sales')}</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={productForm.avg_daily_sales}
              onChange={(e) => setProductForm({ ...productForm, avg_daily_sales: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('sim_lead')}</label>
            <input
              type="number"
              min="1"
              required
              value={productForm.supplier_lead_days}
              onChange={(e) => setProductForm({ ...productForm, supplier_lead_days: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('sim_min_stock')}</label>
            <input
              type="number"
              min="0"
              required
              value={productForm.min_stock}
              onChange={(e) => setProductForm({ ...productForm, min_stock: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('sim_supplier')}</label>
            <input
              type="text"
              value={productForm.supplier}
              onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none font-medium"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="flex-1 bg-primary text-white py-2 px-4 rounded-xl hover:bg-primary-dark transition-all text-sm font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
            >
              <Bot size={16} />
              {isAnalyzing ? 'Calcul...' : t('sim_calc_btn')}
            </button>
            <button
              type="button"
              onClick={handleSaveProduct}
              className="bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-xl hover:bg-gray-100 transition-colors text-sm font-semibold"
              title="Sauvegarder dans l'inventaire"
            >
              💾 {t('sim_save_btn')}
            </button>
          </div>
        </form>

        {/* AFFICHAGE DU RÉSULTAT CONFORME AU FORMAT DEMANDÉ */}
        {aiRecommendation && (
          <div className="mt-6 pt-6 border-t border-primary/20 animate-fade-in">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-3">
              <Sparkles className="text-primary" size={20} />
              {t('rec_title')}
            </h3>

            {/* Bannière d'état selon la règle exacte spécifiée */}
            {aiRecommendation.type === 'error' && (
              <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-400 text-red-900 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-lg font-black text-red-600">
                  <AlertOctagon size={24} />
                  <span>{t('risk_critical')}</span>
                </div>
                <p className="text-base font-semibold leading-relaxed">
                  {t('risk_critical_msg')} <span className="underline font-bold">{aiRecommendation.jours_avant_rupture} {t('days_unit')}</span>.
                </p>
                <p className="text-xs text-red-700">
                  {t('lead_time_label')} {aiRecommendation.delai_fournisseur} {t('days_unit')}. {t('risk_critical_sub')}
                </p>
              </div>
            )}

            {aiRecommendation.type === 'warning' && (
              <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-900 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-lg font-black text-amber-600">
                  <AlertTriangle size={24} />
                  <span>{t('risk_warning')}</span>
                </div>
                <p className="text-base font-semibold leading-relaxed">
                  {t('risk_warning_msg')} <span className="underline font-bold">{aiRecommendation.jours_avant_rupture} {t('days_unit')}</span>).
                </p>
                <p className="text-xs text-amber-700">
                  {t('lead_time_label')} {aiRecommendation.delai_fournisseur} {t('days_unit')}. {t('risk_warning_sub')}
                </p>
              </div>
            )}

            {aiRecommendation.type === 'success' && (
              <div className="p-5 rounded-2xl bg-green-50 border-2 border-green-400 text-green-900 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-lg font-black text-green-700">
                  <CheckCircle2 size={24} />
                  <span>{t('risk_success')}</span>
                </div>
                <p className="text-base font-semibold leading-relaxed">
                  {t('risk_success_msg')} <span className="underline font-bold">{aiRecommendation.jours_avant_rupture} {t('days_unit')}</span>).
                </p>
              </div>
            )}

            {/* Détails EOQ et Action */}
            {aiRecommendation.isUrgent && (
              <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('eoq_title')}</span>
                  <div className="text-gray-800 text-sm">
                    {t('eoq_qty')} <span className="font-bold text-primary text-base">{aiRecommendation.suggestedQty} {t('eoq_units')}</span> 
                    {' '}• {t('eoq_cost')} <span className="font-bold text-gray-900">{aiRecommendation.estimatedCost} TND</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://wa.me/21658026163?text=${encodeURIComponent(
                      `Aslema, commande urgente via neostock: ${aiRecommendation.suggestedQty}x ${aiRecommendation.productName} (Coût estimé: ${aiRecommendation.estimatedCost} TND). Merci de confirmer la livraison.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#25D366] hover:bg-[#1ebd5a] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                    title="Envoyer la commande au grossiste sur WhatsApp"
                  >
                    <span>{t('btn_whatsapp')}</span>
                  </a>
                  <Link
                    to="/transactions"
                    className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <ShoppingCart size={15} />
                    {t('btn_b2b')}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* ── STATISTIQUES PROFESSIONNELLES ── */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('stat_daily_demand')}</span>
                <span className="text-lg font-black text-gray-900">{aiRecommendation.dailyDemand || '—'}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('stat_monthly_demand')}</span>
                <span className="text-lg font-black text-gray-900">{aiRecommendation.monthlyDemand || '—'}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('stat_margin')}</span>
                <span className="text-lg font-black text-primary">{aiRecommendation.marginPct || 0}%</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('stat_turnover')}</span>
                <span className="text-lg font-black text-gray-900">{aiRecommendation.stockTurnover || '—'}x</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('stat_safety_stock')}</span>
                <span className="text-lg font-black text-amber-600">{aiRecommendation.safetyStock || '—'}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('stat_reorder_point')}</span>
                <span className="text-lg font-black text-red-600">{aiRecommendation.reorderPoint || '—'}</span>
              </div>
            </div>

            {/* Prédiction IA */}
            {aiRecommendation.predictedDemand && (
              <div className="mt-4 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{t('ai_forecast_title')}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-emerald-200 rounded-full text-emerald-700">
                    {t('ai_confidence')} {aiRecommendation.predConfidence}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-2xl font-black text-gray-900">{aiRecommendation.predictedDemand}</span>
                  <span className="text-xs text-gray-500">{t('ai_forecast_units')}</span>
                  {aiRecommendation.predTrend && (
                    <span className="text-xs font-bold text-gray-600">{aiRecommendation.predTrend.label} ({aiRecommendation.predTrend.slope > 0 ? '+' : ''}{aiRecommendation.predTrend.slope}%)</span>
                  )}
                </div>
                {aiRecommendation.predMethods && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    <span className="text-[10px] px-2 py-0.5 bg-white border border-emerald-100 rounded-full font-bold text-gray-600">WMA: {aiRecommendation.predMethods.wma}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-white border border-emerald-100 rounded-full font-bold text-gray-600">EMA: {aiRecommendation.predMethods.ema}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-white border border-emerald-100 rounded-full font-bold text-gray-600">SMA: {aiRecommendation.predMethods.sma}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-white border border-emerald-100 rounded-full font-bold text-gray-600">{t('ai_season')} {aiRecommendation.predSeasonalFactor}x</span>
                    <span className="text-[10px] px-2 py-0.5 bg-white border border-emerald-100 rounded-full font-bold text-gray-600">CV: {aiRecommendation.predVariability}%</span>
                  </div>
                )}
                <p className="text-xs text-gray-600 leading-relaxed">{aiRecommendation.predReasoning}</p>
              </div>
            )}

            {/* AI Review (si NIM a répondu) */}
            {aiRecommendation.aiReview && (
              <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-2">{t('ai_review_title')}</span>
                <p className="text-sm text-gray-800 leading-relaxed">{aiRecommendation.aiReview}</p>
              </div>
            )}

            {/* Model badge */}
            <div className="mt-3 flex items-center gap-2 justify-end">
              <span className="text-[10px] font-bold px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-gray-500">
                🤖 {aiRecommendation.modelUsed}
              </span>
              {aiRecommendation.predModelUsed && aiRecommendation.predModelUsed !== aiRecommendation.modelUsed && (
                <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700">
                  📊 {aiRecommendation.predModelUsed}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Stock Chart + AI Live Alerts List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">{t('chart_title')}</h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
              {products.length} {t('chart_items')}
            </span>
          </div>
          <div className="h-80">
            <StockChart data={products} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="text-primary" size={22} />
              <h2 className="text-lg font-bold text-gray-900">{t('alerts_title')}</h2>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
              {aiAlerts.length} {t('alerts_urgent')}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px] pr-1">
            {aiAlerts.map((alert, idx) => (
              <div 
                key={idx} 
                className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-sm text-gray-900">{alert.risk} {alert.product}</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-white rounded-full border border-gray-200 text-gray-700">
                    {alert.days} j
                  </span>
                </div>
                <p className="text-xs text-gray-600">{alert.recommendation}</p>
              </div>
            ))}
            {aiAlerts.length === 0 && (
              <p className="text-gray-400 text-center py-8 text-sm">{t('alerts_empty')}</p>
            )}
          </div>

          <Link 
            to="/predictions" 
            className="mt-4 w-full block text-center text-primary font-bold text-sm hover:text-primary-dark p-2.5 border border-primary/20 rounded-xl bg-primary-light hover:bg-green-100 transition-colors"
          >
            {t('alerts_assistant_link')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
