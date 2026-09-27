import React, { useState, useEffect, useContext } from 'react';
import { 
  TrendingUp, TrendingDown, AlertTriangle, ShieldAlert, Sparkles, 
  RefreshCw, Users, ShoppingCart, MessageCircle, DollarSign, 
  CheckCircle2, ArrowUpRight, ArrowDownRight, Layers, Globe, Filter
} from 'lucide-react';
import api from '../api';
import { LanguageContext } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const MarketIntelligence = () => {
  const { t, language } = useContext(LanguageContext);
  const [commodities, setCommodities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [marketStats, setMarketStats] = useState({
    market_index: 'Indice neostock Marché de Gros Tunisien',
    average_monthly_trend_pct: -0.78,
    critical_tensions_count: 2,
    currency: 'TND'
  });
  const [aiBulletin, setAiBulletin] = useState(null);
  const [loadingBulletin, setLoadingBulletin] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [dealJoined, setDealJoined] = useState({});

  const fetchMarketData = async () => {
    setLoadingData(true);
    try {
      const [comRes, dealRes] = await Promise.all([
        api.get('/market/commodities').catch(() => ({ data: { commodities: [], average_monthly_trend_pct: -0.8, critical_tensions_count: 2 } })),
        api.get('/market/deals').catch(() => ({ data: { deals: [], total_collective_savings_tnd: 4200 } }))
      ]);

      if (comRes.data) {
        setCommodities(comRes.data.commodities || []);
        setMarketStats({
          market_index: comRes.data.market_index || 'Indice neostock Marché de Gros',
          average_monthly_trend_pct: comRes.data.average_monthly_trend_pct || 0,
          critical_tensions_count: comRes.data.critical_tensions_count || 0,
          currency: comRes.data.currency || 'TND'
        });
      }

      if (dealRes.data) {
        setDeals(dealRes.data.deals || []);
      }
    } catch (err) {
      console.error("Error fetching market data", err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAiBulletin = async () => {
    setLoadingBulletin(true);
    try {
      const res = await api.post('/market/ai-analysis', {});
      setAiBulletin(res.data);
    } catch (err) {
      console.error("Error fetching AI bulletin", err);
    } finally {
      setLoadingBulletin(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    fetchAiBulletin();
  }, []);

  const handleJoinDeal = (dealId, title, savings) => {
    setDealJoined(prev => ({ ...prev, [dealId]: true }));
    setTimeout(() => {
      alert(`✅ ${t('deal_alert_success')} (${title} -${savings}%)`);
    }, 150);
  };

  const openWhatsAppOrder = (item) => {
    const text = language === 'en' 
      ? `Hello, I want to place a wholesale order for "${item.name}". neostock advice: ${item.action_label}. Best price for ${item.min_bulk_qty} units?`
      : `Aslema, je souhaite commander un volume de gros pour "${item.name}". Recommandation neostock: ${item.action_label}. Quel est votre meilleur tarif pour un lot de ${item.min_bulk_qty} unités ?`;
    window.open(`https://wa.me/21658026163?text=${encodeURIComponent(text)}`, '_blank');
  };

  const categories = [
    { id: 'ALL', label: t('cat_all') },
    { id: 'Céréales & Dérivés', label: t('cat_cereals') },
    { id: 'Boissons Chaudes', label: t('cat_hot_drinks') },
    { id: 'Huiles & Graisses', label: t('cat_oils') },
    { id: 'Produits Laitiers', label: t('cat_dairy') },
    { id: 'Fruits Secs & Frais', label: t('cat_fruits') },
    { id: 'Boissons', label: t('cat_drinks') }
  ];

  const filteredCommodities = activeCategory === 'ALL' 
    ? commodities 
    : commodities.filter(c => c.category === activeCategory);

  // Markdown renderer simple
  const renderMarkdown = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-black text-gray-900 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('*   **') || line.startsWith('• **') || line.startsWith('- **')) {
        const parts = line.split('**');
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-gray-700 leading-relaxed my-1">
            <strong className="text-gray-900">{parts[1]}</strong>
            {parts.slice(2).join('')}
          </li>
        );
      }
      if (line.startsWith('---')) {
        return <hr key={idx} className="my-3 border-gray-200" />;
      }
      return <p key={idx} className="text-xs text-gray-700 leading-relaxed my-1">{line}</p>;
    });
  };

  const getAvailabilityBadge = (item) => {
    if (item.tension_level === 'CRITIQUE' || item.tension_level === 'ÉLEVÉE') {
      return {
        label: language === 'en' ? 'High Tension' : item.availability_label,
        classes: 'bg-red-100 text-red-800'
      };
    }
    if (item.tension_level === 'MOYENNE') {
      return {
        label: language === 'en' ? 'Moderate' : item.availability_label,
        classes: 'bg-amber-100 text-amber-800'
      };
    }
    return {
      label: language === 'en' ? 'Available' : item.availability_label,
      classes: 'bg-green-100 text-green-800'
    };
  };

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      {/* ── EN-TÊTE MARCHÉ DE GROS & STATS DU JOUR (WITH TOP-LEFT LANGUAGE SWITCHER) ── */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-[#10201A] text-white p-6 rounded-3xl shadow-xl border border-gray-800">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            {/* LanguageSwitcher strictly positioned on the top left */}
            <LanguageSwitcher className="shadow-xs border border-white/20 bg-white/10" />
            <div className="h-8 w-px bg-white/20 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full tracking-wider uppercase">
                  {t('market_tag')}
                </span>
                <span className="text-xs text-gray-400">{t('market_origin_label')}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1 text-white">
                {t('market_title')}
              </h1>
              <p className="text-xs text-gray-300 mt-0.5">
                {t('market_subtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { fetchMarketData(); fetchAiBulletin(); }}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl transition-all text-xs font-semibold border border-white/10"
            >
              <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} />
              <span>{t('refresh_quotes')}</span>
            </button>
            <button
              onClick={fetchAiBulletin}
              disabled={loadingBulletin}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl transition-all text-xs font-bold shadow-lg shadow-emerald-950/40"
            >
              <Sparkles size={14} />
              <span>{loadingBulletin ? t('gemini_analyzing') : t('gemini_btn')}</span>
            </button>
          </div>
        </div>

        {/* Mini Ticker Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gray-700/60">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t('price_index')}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-lg font-bold text-white">104.2 pts</span>
              <span className={`text-xs font-bold flex items-center ${marketStats.average_monthly_trend_pct >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {marketStats.average_monthly_trend_pct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {marketStats.average_monthly_trend_pct}%
              </span>
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t('quota_products')}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-lg font-bold text-red-400">{marketStats.critical_tensions_count} {t('quota_commodities')}</span>
              <span className="text-[10px] font-bold text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded">{t('quota_names')}</span>
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t('season_opp')}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-lg font-bold text-emerald-400">{t('season_name')}</span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">{t('season_badge')}</span>
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t('active_pools')}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-lg font-bold text-white">{deals.length} {t('pools_count')}</span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">{t('pools_discount')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BULLETIN D'INTELLIGENCE IA GEMINI 2.5 FLASH ── */}
      {aiBulletin && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-emerald-100 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
                <Sparkles size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-gray-900">{t('bulletin_title')}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    {aiBulletin.model_used}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{t('bulletin_sub')}</p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-emerald-800">
              {t('stance')} {aiBulletin.recommended_stance}
            </div>
          </div>

          <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-2 max-h-[380px] overflow-y-auto">
            {renderMarkdown(aiBulletin.bulletin)}
          </div>
        </div>
      )}

      {/* ── ACHATS GROUPÉS INTER-ÉPICERIES (B2B POOLS) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-[#0E7A54]" size={22} />
            <h2 className="text-lg font-black text-gray-900">{t('deals_title')}</h2>
            <span className="text-xs bg-green-100 text-[#0E7A54] px-2.5 py-0.5 rounded-full font-bold">
              {t('deals_factory_price')}
            </span>
          </div>
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">
            {t('deals_sub')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deals.map((deal) => {
            const pct = Math.min(100, Math.round((deal.current_committed_kg / deal.target_volume_kg) * 100));
            const isJoined = dealJoined[deal.deal_id];

            return (
              <div key={deal.deal_id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-gray-400">{deal.supplier}</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-full text-[10px]">
                      -{deal.savings_pct}% {t('deal_savings')}
                    </span>
                  </div>
                  <h3 className="font-black text-sm text-gray-900 leading-snug">{deal.title}</h3>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-mono font-black text-[#0E7A54]">{deal.pool_price_tnd.toFixed(3)} TND</span>
                    <span className="text-xs text-gray-400 line-through font-mono">{deal.regular_price_tnd.toFixed(3)} TND</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                      <span>{t('deal_fill')} {pct}%</span>
                      <span>{deal.current_committed_kg} / {deal.target_volume_kg} kg</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-[#0E7A54] h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-[11px] text-gray-500 font-medium">
                    ⏳ {t('deal_remaining')} <strong className="text-gray-800">{deal.deadline_hours}h</strong> ({deal.participants_count} {t('deal_stores')})
                  </div>
                  <button
                    onClick={() => handleJoinDeal(deal.deal_id, deal.title, deal.savings_pct)}
                    disabled={isJoined}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                      isJoined 
                        ? 'bg-green-100 text-green-800 cursor-default'
                        : 'bg-[#0E7A54] text-white hover:bg-[#0a5a3e] shadow-sm'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>{t('deal_joined')}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={14} />
                        <span>{t('deal_join_btn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TABLEAU MERCURIALE & PRIX DE GROS EN DIRECT ── */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900">{t('mercuriale_title')}</h2>
            <p className="text-xs text-gray-500">{t('mercuriale_sub')}</p>
          </div>

          {/* Filtres de catégorie */}
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 5).map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-[#0E7A54] text-white shadow-xs' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-3">{t('th_product_spec')}</th>
                <th className="py-3 px-3">{t('th_origin_supplier')}</th>
                <th className="py-3 px-3">{t('th_wholesale_price')}</th>
                <th className="py-3 px-3">{t('th_month_trend')}</th>
                <th className="py-3 px-3">{t('th_availability')}</th>
                <th className="py-3 px-3">{t('th_recommendation')}</th>
                <th className="py-3 px-3 text-right">{t('th_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredCommodities.map((item) => {
                const badge = getAvailabilityBadge(item);

                return (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-gray-900">{item.name}</div>
                      <div className="text-[11px] text-gray-400">{item.category} • Lot min : {item.min_bulk_qty}</div>
                    </td>

                    <td className="py-3.5 px-3 text-xs text-gray-600">
                      {item.origin}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-mono font-bold text-gray-900 text-base">
                        {item.current_wholesale_tnd.toFixed(3)} DT
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">{t('prev_label')} {item.prev_wholesale_tnd.toFixed(3)}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full ${
                        item.change_pct > 0 
                          ? 'bg-red-50 text-red-600 border border-red-200' 
                          : item.change_pct < 0 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.change_pct > 0 ? '+' : ''}{item.change_pct}%
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-xs font-bold text-gray-900">{item.action_label}</div>
                      <p className="text-[11px] text-gray-500 max-w-xs leading-snug">{item.driver}</p>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => openWhatsAppOrder(item)}
                        className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebd5a] text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
                        title="Négocier ou commander sur WhatsApp"
                      >
                        <MessageCircle size={14} />
                        <span>{t('btn_wholesaler')}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligence;
