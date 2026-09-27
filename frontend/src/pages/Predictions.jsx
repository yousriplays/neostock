import React, { useState, useEffect, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Bot, BarChart2, Zap, AlertTriangle, CheckCircle2, AlertOctagon, Sparkles, TrendingUp, TrendingDown, Target, Activity, Package, DollarSign, Layers } from 'lucide-react';
import AIChat from '../components/AIChat';
import api from '../api';
import { LanguageContext } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Predictions = () => {
  const { t, language } = useContext(LanguageContext);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data || []);
        if (res.data && res.data.length > 0) {
          handleSelectProduct(res.data[0].id, res.data);
        }
      } catch (err) {
        console.error("Erreur chargement produits pour prédictions", err);
      }
    };
    fetchProducts();
  }, []);

  const handleSelectProduct = (id, list = products) => {
    setSelectedProductId(id);
    const prod = list.find(p => p.id === id);
    if (!prod) return;

    setSelectedProduct(prod);
    setPredictionResult(null);

    const months = prod.months || ['Oct','Nov','Déc','Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep'];
    const sales = prod.sales_history || [];

    const data = months.map((m, idx) => ({
      month: m,
      ventes: sales[idx] !== undefined ? sales[idx] : null,
      prediction: null
    }));

    setChartData(data);
  };

  const handleAnalyze = async () => {
    if (!selectedProductId || !selectedProduct) return;
    setAnalyzing(true);

    try {
      const [predictRes, recRes] = await Promise.all([
        api.post('/ai/predict', { product_id: selectedProductId }),
        api.post('/ai/recommend', { product_id: selectedProductId })
      ]);

      const pData = predictRes.data;
      const rData = recRes.data;

      setPredictionResult({
        ...pData,
        ...rData
      });

      const months = selectedProduct.months || ['Oct','Nov','Déc','Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep'];
      const sales = selectedProduct.sales_history || [];

      const updatedChart = months.map((m, idx) => ({
        month: m,
        ventes: sales[idx] !== undefined ? sales[idx] : null,
        prediction: idx === months.length - 1 ? sales[idx] : null
      }));

      updatedChart.push({
        month: t('pred_next_month'),
        ventes: null,
        prediction: pData.predicted_demand || 0
      });

      setChartData(updatedChart);
    } catch (err) {
      console.error("Erreur prédiction IA", err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 pt-12 md:pt-0 h-full flex flex-col">
      {/* Top Header with LanguageSwitcher strictly on the LEFT SIDE of the page */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <LanguageSwitcher className="shadow-xs border border-gray-200" />
          <div className="h-7 w-px bg-gray-200 hidden sm:block"></div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('pred_title')}</h1>
            <p className="text-xs text-gray-500">{t('pred_sub')}</p>
          </div>
        </div>

        {predictionResult && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-800 self-start sm:self-auto">
            <Sparkles size={14} className="text-emerald-600" />
            <span>{language === 'en' ? 'Model:' : 'Modèle :'} {predictionResult.model_used || "Google Gemini 2.5 Flash"}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col space-y-6 overflow-y-auto pr-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart2 className="text-primary" size={20} />
              {t('pred_select_label')}
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none font-medium bg-white"
                value={selectedProductId}
                onChange={(e) => handleSelectProduct(Number(e.target.value) || e.target.value)}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Stock: {p.current_stock}
                  </option>
                ))}
              </select>

              <button 
                onClick={handleAnalyze}
                disabled={!selectedProductId || analyzing}
                className="bg-primary text-white px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-bold text-sm shadow-md shadow-primary/20"
              >
                {analyzing ? (
                  <>
                    <Zap size={16} className="animate-spin" />
                    {t('pred_analyzing')}
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    {t('pred_btn_analyze')}
                  </>
                )}
              </button>
            </div>
            
            {predictionResult && (
              <div className="mt-6 space-y-6 animate-fade-in">
                
                {/* Stock Status Banner */}
                {predictionResult.status === 'danger' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 shadow-sm">
                    <AlertOctagon className="text-red-600 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-bold text-red-800 text-sm">🔴 {language === 'en' ? 'STOCKOUT RISK' : (predictionResult.status_label || "RISQUE DE RUPTURE")} ({language === 'en' ? 'Urgency:' : 'Urgence :'} {predictionResult.urgency})</h4>
                      <p className="text-xs text-red-700 mt-1">{predictionResult.message}</p>
                    </div>
                  </div>
                )}
                {predictionResult.status === 'warning' && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="text-orange-600 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-bold text-orange-800 text-sm">🟠 {language === 'en' ? 'WARNING: LOW' : (predictionResult.status_label || "ATTENTION")} ({language === 'en' ? 'Urgency:' : 'Urgence :'} {predictionResult.urgency})</h4>
                      <p className="text-xs text-orange-700 mt-1">{predictionResult.message}</p>
                    </div>
                  </div>
                )}
                {predictionResult.status === 'success' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 shadow-sm">
                    <CheckCircle2 className="text-green-600 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-bold text-green-800 text-sm">🟢 {language === 'en' ? 'SUFFICIENT STOCK' : (predictionResult.status_label || "STOCK SUFFISANT")} ({language === 'en' ? 'Urgency:' : 'Urgence :'} {predictionResult.urgency})</h4>
                      <p className="text-xs text-green-700 mt-1">{predictionResult.message}</p>
                    </div>
                  </div>
                )}

                {/* AI Review */}
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-900 shadow-sm">
                  <div className="flex items-center gap-2 font-bold mb-2 text-indigo-800">
                    <Bot size={16} /> {language === 'en' ? 'AI Review' : 'Synthèse IA'}
                  </div>
                  <p>{predictionResult.ai_review || predictionResult.reasoning || predictionResult.message}</p>
                </div>

                {/* Main Prediction & Recommendation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Prediction Card */}
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5"><Activity size={14}/> {language === 'en' ? 'Forecast' : 'Prévision'}</h4>
                    
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-3xl font-black text-gray-900">{predictionResult.predicted_demand}</span>
                      <span className="text-sm text-gray-500 font-medium mb-1">{language === 'en' ? 'forecasted units' : 'unités prévues'}</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">{language === 'en' ? 'AI Confidence' : 'Confiance IA'}</span>
                          <span className="font-bold text-primary">{predictionResult.confidence_pct}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${(predictionResult.confidence || 0) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <span className="text-gray-500 block mb-0.5">{language === 'en' ? 'Trend' : 'Tendance'}</span>
                          <span className="font-bold text-gray-800 flex items-center gap-1">
                            {predictionResult.trend?.direction === 'up' ? <TrendingUp size={12} className="text-green-500"/> : <TrendingDown size={12} className="text-red-500"/>}
                            {predictionResult.trend?.label || "Stable"}
                          </span>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <span className="text-gray-500 block mb-0.5">{language === 'en' ? 'Seasonality' : 'Saisonnalité'}</span>
                          <span className="font-bold text-gray-800">{predictionResult.seasonal_factor}x</span>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg col-span-2">
                          <span className="text-gray-500 block mb-0.5">{language === 'en' ? 'Variability (CV)' : 'Variabilité (CV)'}</span>
                          <span className="font-bold text-gray-800">{predictionResult.variability_cv}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Card */}
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5"><Package size={14}/> {language === 'en' ? 'Recommendation' : 'Recommandation'}</h4>
                    
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-3xl font-black text-primary">{predictionResult.recommended_quantity}</span>
                      <span className="text-sm text-gray-500 font-medium mb-1">{language === 'en' ? 'to order (EOQ)' : 'à commander (EOQ)'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-500 block mb-0.5">{language === 'en' ? 'Reorder point' : 'Point de commande'}</span>
                        <span className="font-bold text-gray-800">{predictionResult.reorder_point}</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-500 block mb-0.5">{language === 'en' ? 'Safety stock' : 'Stock de sécurité'}</span>
                        <span className="font-bold text-gray-800">{predictionResult.safety_stock}</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-500 block mb-0.5">{language === 'en' ? 'Estimated cost' : 'Coût estimé'}</span>
                        <span className="font-bold text-gray-800">{predictionResult.estimated_cost_tnd} TND</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-500 block mb-0.5">{language === 'en' ? 'Stock turnover' : 'Rotation Stock'}</span>
                        <span className="font-bold text-gray-800">{predictionResult.stock_turnover}x</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Methods Breakdown */}
                {predictionResult.methods && (
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5"><Layers size={14}/> {language === 'en' ? 'Model Breakdown (Ensemble)' : 'Détail des modèles (Ensemble)'}</h4>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="px-3 py-1.5 bg-gray-50 rounded-md border border-gray-100"><span className="text-gray-500 mr-1">WMA:</span><span className="font-bold">{predictionResult.methods.wma}</span></div>
                      <div className="px-3 py-1.5 bg-gray-50 rounded-md border border-gray-100"><span className="text-gray-500 mr-1">EMA:</span><span className="font-bold">{predictionResult.methods.ema}</span></div>
                      <div className="px-3 py-1.5 bg-gray-50 rounded-md border border-gray-100"><span className="text-gray-500 mr-1">SMA:</span><span className="font-bold">{predictionResult.methods.sma}</span></div>
                      <div className="px-3 py-1.5 bg-gray-50 rounded-md border border-gray-100"><span className="text-gray-500 mr-1">{language === 'en' ? 'Raw:' : 'Brut:'}</span><span className="font-bold">{predictionResult.methods.ensemble_raw}</span></div>
                      <div className="px-3 py-1.5 bg-emerald-50 rounded-md border border-emerald-100"><span className="text-emerald-700 mr-1">{language === 'en' ? 'Final (Seasonal):' : 'Final (Saison):'}</span><span className="font-bold text-emerald-800">{predictionResult.methods.after_season}</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 min-h-[340px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-900">{t('pred_chart_title')}</h2>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ventes" 
                    stroke="#16a34a" 
                    strokeWidth={2.5} 
                    name={t('pred_sales_legend')} 
                    dot={{ r: 4, fill: '#16a34a' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="prediction" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    strokeDasharray="4 4" 
                    name={t('pred_forecast_legend')} 
                    dot={{ r: 6, fill: '#f59e0b' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[650px] lg:h-auto overflow-hidden">
          <AIChat />
        </div>
      </div>
    </div>
  );
};

export default Predictions;
