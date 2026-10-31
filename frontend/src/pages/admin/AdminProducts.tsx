import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Product } from '../../types';
import { Modal } from '../../components/Modal';
import { Package, Plus, Tag, Check, Layers, Clock } from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New product form
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<Product[]>('/products');
      setProducts(data);
    } catch (err) {
      // Mock Fallback
      setProducts([
        {
          id: 'p1',
          name: 'Brightloop Cloud ERP Platform',
          sku: 'PROD-BL-ERP-01',
          brand: 'Brightloop Enterprise',
          category: 'Software / SaaS',
          description: 'Comprehensive business management suite with accounting, inventory, and CRM modules.',
          isActive: true,
          variants: [
            {
              id: 'v1',
              productId: 'p1',
              name: 'Standard Edition (Single Tenant)',
              sku: 'VAR-ERP-STD',
              extraCost: 0,
              isActive: true,
              attributes: { storageGB: 50, userSeats: 10 },
            },
            {
              id: 'v2',
              productId: 'p1',
              name: 'Enterprise Edition (Dedicated Cluster & 24/7 SLA)',
              sku: 'VAR-ERP-ENT',
              extraCost: 150.0,
              isActive: true,
              attributes: { storageGB: 500, userSeats: 100 },
            },
          ],
        },
        {
          id: 'p2',
          name: 'AI Document Processing Service',
          sku: 'PROD-BL-AIDOC',
          brand: 'Brightloop Intelligent Apps',
          category: 'Add-on / API',
          description: 'Automated receipt and invoice OCR data extractor with high-accuracy webhook deliveries.',
          isActive: true,
          variants: [
            {
              id: 'v3',
              productId: 'p2',
              name: 'Standard API (10k docs/mo)',
              sku: 'VAR-DOC-10K',
              extraCost: 0,
              isActive: true,
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.post('/products', {
        name,
        sku,
        brand,
        category,
        description,
      });
      setIsModalOpen(false);
      setName('');
      setSku('');
      setBrand('');
      setCategory('');
      setDescription('');
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Products & Brand Additions</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure catalog services, variants, and brand additions (Odoo-style multi-product attributes)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading products catalog...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="glass-panel rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                    {product.brand || 'Core Software'}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">{product.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {product.sku}</p>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Active
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{product.description}</p>

              {/* Variants Section */}
              <div className="pt-3 border-t border-slate-800/80">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-400" />
                  Product Variants & Additions ({product.variants?.length || 0})
                </p>
                <div className="space-y-1.5">
                  {product.variants?.map((v) => (
                    <div
                      key={v.id}
                      className="glass-card p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{v.name}</span>
                        <span className="text-slate-500 font-mono text-[11px] ml-2">[{v.sku}]</span>
                      </div>
                      <span className="font-bold text-brand-400">
                        {v.extraCost > 0 ? `+$${v.extraCost}` : 'Base'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Product Creation */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Product">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brightloop Analytics Suite"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SKU</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PROD-BL-ANALYTICS"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Addition</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brightloop Enterprise"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="SaaS / Cloud"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enterprise platform capability overview..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md transition"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
