import React, { useState, useEffect, useContext } from 'react';
import { Search, Plus, Trash2, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { LanguageContext } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Products = () => {
  const { t, language } = useContext(LanguageContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'condiments',
    unit: 'pièce',
    buy_price_tnd: 2.5,
    sell_price_tnd: 3.5,
    current_stock: 50,
    min_stock: 20,
    max_stock: 200,
    supplier: 'Grossiste Tunis',
    supplier_lead_days: 3
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data || []);
    } catch (error) {
      console.error("Erreur chargement produits", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getStatus = (current, min) => {
    if (current <= min * 0.3) return { label: t('status_critical'), icon: '🔴', color: 'text-red-700 bg-red-50 border border-red-200' };
    if (current <= min) return { label: t('status_low'), icon: '🟠', color: 'text-amber-700 bg-amber-50 border border-amber-200' };
    return { label: t('status_sufficient'), icon: '🟢', color: 'text-green-700 bg-green-50 border border-green-200' };
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newProduct,
        id: `P${Date.now().toString().slice(-4)}`,
        buy_price_tnd: parseFloat(newProduct.buy_price_tnd),
        sell_price_tnd: parseFloat(newProduct.sell_price_tnd),
        current_stock: parseInt(newProduct.current_stock),
        min_stock: parseInt(newProduct.min_stock),
        max_stock: parseInt(newProduct.max_stock),
        supplier_lead_days: parseInt(newProduct.supplier_lead_days),
        sales_history: [40, 55, 60],
        months: ['Juil', 'Aoû', 'Sep']
      };

      await api.post('/products', payload);
      setSuccessMsg(language === 'en' ? `Product "${newProduct.name}" ${t('prod_created_success')}` : `Produit "${newProduct.name}" ${t('prod_created_success')}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setIsModalOpen(false);
      setNewProduct({
        name: '',
        category: 'condiments',
        unit: 'pièce',
        buy_price_tnd: 2.5,
        sell_price_tnd: 3.5,
        current_stock: 50,
        min_stock: 20,
        max_stock: 200,
        supplier: 'Grossiste Tunis',
        supplier_lead_days: 3
      });
      fetchProducts();
    } catch (err) {
      alert("Erreur lors de la création du produit.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm(t('prod_confirm_delete'))) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.supplier && p.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      {/* Top Header with LanguageSwitcher strictly on the LEFT SIDE of the page */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <LanguageSwitcher className="shadow-xs border border-gray-200" />
          <div className="h-7 w-px bg-gray-200 hidden sm:block"></div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('prod_title')}</h1>
            <p className="text-xs text-gray-500">{t('prod_sub')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchProducts}
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
            {t('new_product')}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-300 text-green-800 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder={t('search_placeholder')} 
          className="flex-1 outline-none text-gray-700 bg-transparent text-sm font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs text-gray-500 uppercase font-bold tracking-wider">
                <th className="p-4">{t('col_product')}</th>
                <th className="p-4">{t('col_category')}</th>
                <th className="p-4">{t('col_stock')}</th>
                <th className="p-4 hidden sm:table-cell">{t('col_buy_price')}</th>
                <th className="p-4 hidden sm:table-cell">{t('col_sell_price')}</th>
                <th className="p-4 hidden md:table-cell">{t('col_supplier')}</th>
                <th className="p-4">{t('col_status')}</th>
                <th className="p-4 text-right">{t('col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400">{t('prod_loading')}</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400">{t('prod_empty')}</td></tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStatus(product.current_stock, product.min_stock);
                  const buyPrice = product.buy_price_tnd !== undefined ? product.buy_price_tnd : (product.buy_price || 0);
                  const sellPrice = product.sell_price_tnd !== undefined ? product.sell_price_tnd : (product.sell_price || 0);

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{product.name}</td>
                      <td className="p-4 text-gray-600 capitalize text-xs">{product.category}</td>
                      <td className="p-4">
                        <span className="font-bold text-gray-900">{product.current_stock}</span>
                        <span className="text-xs text-gray-400 ml-1">/ min {product.min_stock}</span>
                      </td>
                      <td className="p-4 text-gray-600 hidden sm:table-cell font-medium">{buyPrice.toFixed(3)} TND</td>
                      <td className="p-4 text-gray-900 hidden sm:table-cell font-bold">{sellPrice.toFixed(3)} TND</td>
                      <td className="p-4 text-gray-500 hidden md:table-cell text-xs">{product.supplier || '—'} ({product.supplier_lead_days || 3}j)</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer le produit"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Product */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('modal_add_title')}</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('sim_name')}</label>
                <input 
                  type="text" 
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="ex: Couscous Fin Diari"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('col_category')}</label>
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="condiments">Condiments</option>
                    <option value="grains">Grains & Pâtes</option>
                    <option value="dairy">Produits Laitiers</option>
                    <option value="oils">Huiles</option>
                    <option value="beverages">Boissons</option>
                    <option value="hygiene">Hygiène</option>
                    <option value="fruits">Fruits & Légumes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unité</label>
                  <input 
                    type="text" 
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="ex: kg, pack, boîte"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('col_buy_price')} (TND)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    min="0"
                    required
                    value={newProduct.buy_price_tnd}
                    onChange={(e) => setNewProduct({ ...newProduct, buy_price_tnd: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('col_sell_price')} (TND)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    min="0"
                    required
                    value={newProduct.sell_price_tnd}
                    onChange={(e) => setNewProduct({ ...newProduct, sell_price_tnd: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('col_stock')}</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={newProduct.current_stock}
                    onChange={(e) => setNewProduct({ ...newProduct, current_stock: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('sim_min_stock')}</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={newProduct.min_stock}
                    onChange={(e) => setNewProduct({ ...newProduct, min_stock: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Max Stock</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={newProduct.max_stock}
                    onChange={(e) => setNewProduct({ ...newProduct, max_stock: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('col_supplier')}</label>
                  <input 
                    type="text" 
                    value={newProduct.supplier}
                    onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Fournisseur ou grossiste"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('sim_lead')}</label>
                  <input 
                    type="number" 
                    min="1"
                    value={newProduct.supplier_lead_days}
                    onChange={(e) => setNewProduct({ ...newProduct, supplier_lead_days: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-semibold"
                >
                  {t('modal_cancel')}
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm font-bold shadow-md shadow-primary/20"
                >
                  {t('modal_create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
