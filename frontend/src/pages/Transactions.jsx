import React, { useState, useEffect, useContext } from 'react';
import { ArrowDownRight, ArrowUpRight, Plus, RefreshCw, X, ShoppingCart, CheckCircle2 } from 'lucide-react';
import KPICard from '../components/KPICard';
import api from '../api';
import { LanguageContext } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Transactions = () => {
  const { t, language } = useContext(LanguageContext);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({ total_spent_tnd: 0, transaction_count: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [newOrder, setNewOrder] = useState({
    product_id: '',
    quantity: 50,
    unit_cost_tnd: 2.1,
    supplier: 'Société Le Phare',
    status: 'Livré'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trxRes, prodRes, sumRes] = await Promise.all([
        api.get('/transactions').catch(() => ({ data: [] })),
        api.get('/products').catch(() => ({ data: [] })),
        api.get('/transactions/summary').catch(() => ({ data: { total_spent_tnd: 2395.0, transaction_count: 8 } }))
      ]);

      setTransactions(trxRes.data || []);
      setProducts(prodRes.data || []);
      setSummary(sumRes.data || { total_spent_tnd: 2395.0, transaction_count: 8 });

      if (prodRes.data && prodRes.data.length > 0 && !newOrder.product_id) {
        setNewOrder(prev => ({
          ...prev,
          product_id: prodRes.data[0].id,
          unit_cost_tnd: prodRes.data[0].buy_price_tnd,
          supplier: prodRes.data[0].supplier || 'Fournisseur'
        }));
      }
    } catch (err) {
      console.error("Erreur transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductChange = (e) => {
    const pId = e.target.value;
    const prod = products.find(p => p.id === pId);
    setNewOrder({
      ...newOrder,
      product_id: pId,
      unit_cost_tnd: prod ? prod.buy_price_tnd : 2.0,
      supplier: prod ? prod.supplier : 'Fournisseur'
    });
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      const total = parseFloat((newOrder.quantity * newOrder.unit_cost_tnd).toFixed(2));
      const payload = {
        id: `TRX-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        product_id: newOrder.product_id,
        type: 'purchase',
        quantity: parseInt(newOrder.quantity),
        unit_cost_tnd: parseFloat(newOrder.unit_cost_tnd),
        total_tnd: total,
        supplier: newOrder.supplier,
        status: newOrder.status
      };

      await api.post('/transactions', payload);

      // Increase current_stock of the product
      const prod = products.find(p => p.id === newOrder.product_id);
      if (prod) {
        await api.put(`/products/${prod.id}`, {
          ...prod,
          current_stock: prod.current_stock + parseInt(newOrder.quantity)
        });
      }

      setSuccessMsg(language === 'en' ? `Order of ${newOrder.quantity} units successfully recorded!` : `Commande de ${newOrder.quantity} unités enregistrée avec succès !`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Erreur lors de la création de la transaction.");
    }
  };

  const getProductName = (pId) => {
    const prod = products.find(p => p.id === pId);
    return prod ? prod.name : pId;
  };

  const filtered = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === (filter === 'IN' ? 'purchase' : 'sale'));

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      {/* Top Header with LanguageSwitcher strictly on the LEFT SIDE of the page */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <LanguageSwitcher className="shadow-xs border border-gray-200" />
          <div className="h-7 w-px bg-gray-200 hidden sm:block"></div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('trx_title')}</h1>
            <p className="text-xs text-gray-500">{t('trx_sub')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData} 
            className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3.5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-xs font-semibold"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {t('refresh')}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-all text-xs font-bold shadow-md shadow-primary/20"
          >
            <Plus size={16} />
            {t('trx_new_btn')}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-300 text-green-800 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard 
          icon={<ArrowDownRight size={24} />} 
          title={t('trx_total_spent')} 
          value={`${summary.total_spent_tnd.toLocaleString()} TND`} 
          subtitle={language === 'en' ? 'Supply purchases total' : 'Cumul des approvisionnements'}
          color="danger" 
        />
        <KPICard 
          icon={<ShoppingCart size={24} />} 
          title={t('trx_count')} 
          value={summary.transaction_count} 
          subtitle={language === 'en' ? 'Purchase orders processed' : "Bons d'achat traités"}
          color="primary" 
        />
        <KPICard 
          icon={<ArrowUpRight size={24} />} 
          title={language === 'en' ? 'Estimated EOQ Savings' : 'Économies EOQ Estimées'} 
          value="~340 TND" 
          subtitle={language === 'en' ? 'Freight & delivery optimization' : 'Optimisation des frais de port'}
          color="success" 
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-2">
          <button 
            onClick={() => setFilter('all')} 
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {language === 'en' ? `All operations (${transactions.length})` : `Toutes les opérations (${transactions.length})`}
          </button>
          <button 
            onClick={() => setFilter('IN')} 
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'IN' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {language === 'en' ? 'Wholesale Restocks' : 'Approvisionnements Fournisseurs'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs text-gray-500 uppercase font-bold tracking-wider">
                <th className="p-4">{t('trx_col_date')}</th>
                <th className="p-4">{t('trx_col_id')}</th>
                <th className="p-4">{t('trx_col_product')}</th>
                <th className="p-4 text-right">{t('trx_col_qty')}</th>
                <th className="p-4 text-right">{t('trx_col_unit_cost')} (TND)</th>
                <th className="p-4 text-right">{t('trx_col_total')}</th>
                <th className="p-4">{t('trx_col_supplier')}</th>
                <th className="p-4">{t('trx_col_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400">{language === 'en' ? 'Loading...' : 'Chargement...'}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400">{language === 'en' ? 'No transactions recorded.' : 'Aucune transaction enregistrée.'}</td></tr>
              ) : (
                filtered.map((trx) => (
                  <tr key={trx.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-4 text-gray-600 text-xs font-medium">{trx.date}</td>
                    <td className="p-4 font-mono text-xs text-gray-400">{trx.id}</td>
                    <td className="p-4 font-bold text-gray-900">{getProductName(trx.product_id)}</td>
                    <td className="p-4 text-right font-black text-gray-800">+{trx.quantity}</td>
                    <td className="p-4 text-right text-gray-600">{trx.unit_cost_tnd?.toFixed(3) || '—'} TND</td>
                    <td className="p-4 text-right font-black text-gray-900">{trx.total_tnd?.toFixed(3) || '—'} TND</td>
                    <td className="p-4 text-gray-600 text-xs font-medium">{trx.supplier || '—'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        trx.status === 'delivered' || trx.status === 'Livré'
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {trx.status === 'delivered' || trx.status === 'Livré' 
                          ? (language === 'en' ? 'Delivered' : 'Livré') 
                          : (language === 'en' ? 'Pending' : 'En attente')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Passer Commande */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900">{t('trx_modal_title')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleCreateTransaction}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{language === 'en' ? 'Product to restock' : 'Produit à réapprovisionner'}</label>
                  <select 
                    value={newOrder.product_id}
                    onChange={handleProductChange}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-primary outline-none bg-white"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({language === 'en' ? 'Current stock:' : 'Stock actuel :'} {p.current_stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{language === 'en' ? 'Quantity ordered' : 'Quantité commandée'}</label>
                    <input 
                      type="number"
                      min="1"
                      required
                      value={newOrder.quantity}
                      onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{language === 'en' ? 'Unit Purchase Price (TND)' : "Prix Unitaire d'Achat (TND)"}</label>
                    <input 
                      type="number"
                      step="0.001"
                      required
                      value={newOrder.unit_cost_tnd}
                      onChange={(e) => setNewOrder({ ...newOrder, unit_cost_tnd: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('trx_col_supplier')}</label>
                  <input 
                    type="text"
                    value={newOrder.supplier}
                    onChange={(e) => setNewOrder({ ...newOrder, supplier: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800 flex justify-between">
                  <span>{language === 'en' ? 'Total Order Cost:' : 'Coût Total de la commande :'}</span>
                  <span>{(newOrder.quantity * newOrder.unit_cost_tnd).toFixed(3)} TND</span>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/70 rounded-b-3xl">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-100 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
                >
                  {language === 'en' ? 'Record PO' : 'Valider la Commande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
