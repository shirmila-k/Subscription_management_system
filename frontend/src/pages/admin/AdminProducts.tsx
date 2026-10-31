import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Product } from '../../types';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { SearchInput } from '../../components/SearchInput';
import { StatusBadge } from '../../components/StatusBadge';
import { formatINR } from '../../utils/format';
import { Plus, Layers, Clock, TrendingUp, Tag, Trash2, Package } from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // New product form
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('Brightloop Enterprise');
  const [category, setCategory] = useState('Software / SaaS');
  const [type, setType] = useState('Software / SaaS');
  const [salesPrice, setSalesPrice] = useState('1000');
  const [costPrice, setCostPrice] = useState('450');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');

  // New variant form
  const [variantName, setVariantName] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [variantExtraCost, setVariantExtraCost] = useState('560');
  const [variantBrandAttr, setVariantBrandAttr] = useState('Odoo');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<Product[]>('/products');
      setProducts(data);
    } catch (err) {
      // Mock Fallback matching Stitch Design
      setProducts([
        {
          id: 'p1',
          name: 'Brightloop Cloud ERP Platform',
          sku: 'PROD-BL-ERP-01',
          brand: 'Brightloop Enterprise',
          category: 'Software / SaaS',
          type: 'Software / SaaS',
          salesPrice: 1000.0,
          costPrice: 450.0,
          notes: 'Standard recurring ERP with accounting and sales modules.',
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
              name: 'Enterprise Dedicated Cluster (24/7 SLA)',
              sku: 'VAR-ERP-ENT',
              extraCost: 1500.0,
              isActive: true,
              attributes: { storageGB: 500, userSeats: 100 },
            },
            {
              id: 'v3',
              productId: 'p1',
              name: 'Odoo Brand Edition (Integrated Connector)',
              sku: 'VAR-ERP-ODOO',
              extraCost: 560.0,
              isActive: true,
              attributes: { brand: 'Odoo', connector: 'Odoo ERP Sync' },
            },
          ],
        },
        {
          id: 'p2',
          name: 'AI Document Processing Service',
          sku: 'PROD-BL-AIDOC',
          brand: 'Brightloop Intelligent Apps',
          category: 'Add-on / API',
          type: 'Service',
          salesPrice: 499.0,
          costPrice: 150.0,
          notes: 'High throughput receipt and invoice OCR worker.',
          description: 'Automated receipt and invoice OCR data extractor with high-accuracy webhook deliveries.',
          isActive: true,
          variants: [
            {
              id: 'v4',
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
        type,
        salesPrice: Number(salesPrice),
        costPrice: Number(costPrice),
        notes,
        description,
      });
      setIsModalOpen(false);
      setName('');
      setSku('');
      setDescription('');
      setNotes('');
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    try {
      await ApiClient.post(`/products/${selectedProductId}/variants`, {
        name: variantName,
        sku: variantSku,
        extraCost: Number(variantExtraCost),
        attributes: variantBrandAttr ? { brand: variantBrandAttr } : undefined,
      });
      setIsVariantModalOpen(false);
      setVariantName('');
      setVariantSku('');
      setVariantExtraCost('560');
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to add variant');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;
    try {
      await ApiClient.delete(`/products/variants/${variantId}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete variant');
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#27212B] tracking-tight">
            Products & Variants
          </h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Configure software products, track cost/sales margins, and manage brand add-ons (e.g. Odoo brand adds ₹560)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search products by title, SKU, or brand..."
          className="w-full max-w-md"
        />
        <span className="text-xs text-[#817986] font-medium hidden sm:block">
          Showing {filtered.length} product(s)
        </span>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-16 text-center text-[#817986] bg-white rounded-2xl border border-[#EAE5EC]">
          <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D286F]" />
          Loading products catalog...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[#817986] bg-white rounded-2xl border border-[#EAE5EC]">
          <Package className="w-12 h-12 text-[#D1ACD7] mx-auto mb-2" />
          <p className="text-base font-bold text-[#27212B]">No products match your search</p>
          <p className="text-xs text-[#817986] mt-1">Try another keyword or add a new product</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((product) => {
            const sales = Number(product.salesPrice || 0);
            const cost = Number(product.costPrice || 0);
            const profit = sales - cost;
            const marginPct = sales > 0 ? ((profit / sales) * 100).toFixed(0) : '0';

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-6 border border-[#EAE5EC] shadow-card hover:shadow-cardHover transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D286F] bg-[#F3EAF5] px-2.5 py-0.5 rounded-full border border-[#E5D1E8]">
                          {product.brand || 'Core Software'}
                        </span>
                        <span className="text-[10px] font-medium text-[#817986] bg-[#FAF9FB] border border-[#EAE5EC] px-2 py-0.5 rounded-full">
                          {product.type || 'Software / SaaS'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#27212B] mt-1.5">{product.name}</h3>
                      <p className="text-xs text-[#817986] font-mono mt-0.5">SKU: {product.sku}</p>
                    </div>
                    <StatusBadge status={product.isActive ? 'ACTIVE' : 'DRAFT'} size="sm" />
                  </div>

                  <p className="text-xs text-[#817986] leading-relaxed">{product.description}</p>

                  {/* Financial Breakdown (Cost Price vs Sales Price) */}
                  <div className="grid grid-cols-3 gap-2 bg-[#FAF9FB] p-3 rounded-xl border border-[#EAE5EC] text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#817986]">Base Sales Price</p>
                      <p className="text-sm font-extrabold text-[#16845B]">{formatINR(sales)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#817986]">Cost Price</p>
                      <p className="text-sm font-bold text-[#27212B]">{formatINR(cost)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#817986] flex items-center gap-1">
                        Margin
                        <TrendingUp className="w-3 h-3 text-[#6D286F]" />
                      </p>
                      <p className="text-sm font-extrabold text-[#6D286F]">
                        +{formatINR(profit)} ({marginPct}%)
                      </p>
                    </div>
                  </div>

                  {product.notes && (
                    <p className="text-[11px] text-[#817986] italic bg-[#FAF9FB] p-2 rounded-lg border border-[#EAE5EC]">
                      Note: {product.notes}
                    </p>
                  )}

                  {/* Variants Section */}
                  <div className="pt-3 border-t border-[#EAE5EC]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-[#817986] uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#6D286F]" />
                        Brand Variants & Add-ons ({product.variants?.length || 0})
                      </p>
                      <button
                        onClick={() => {
                          setSelectedProductId(product.id);
                          setIsVariantModalOpen(true);
                        }}
                        className="text-xs font-bold text-[#6D286F] hover:text-[#421747] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Variant
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {product.variants?.map((v) => {
                        const extra = Number(v.extraCost || 0);
                        const finalPrice = sales + extra;

                        return (
                          <div
                            key={v.id}
                            className="bg-white p-2.5 rounded-xl border border-[#EAE5EC] flex items-center justify-between text-xs hover:border-[#D1ACD7] transition"
                          >
                            <div>
                              <span className="font-semibold text-[#27212B]">{v.name}</span>
                              <span className="text-[#817986] font-mono text-[11px] ml-1.5">[{v.sku}]</span>
                              {v.attributes?.brand && (
                                <span className="ml-2 text-[10px] bg-[#F3EAF5] text-[#6D286F] px-1.5 py-0.5 rounded font-bold border border-[#E5D1E8]">
                                  Brand: {v.attributes.brand}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="font-extrabold text-[#6D286F] block">
                                  {extra > 0 ? `+${formatINR(extra)}` : 'Base'}
                                </span>
                                {extra > 0 && (
                                  <span className="text-[10px] text-[#817986] block">
                                    Total: {formatINR(finalPrice)}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteVariant(v.id)}
                                className="text-[#817986] hover:text-[#C53B4B] transition p-1"
                                title="Delete Variant"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Product Creation */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Product" maxWidth="xl">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brightloop Cloud ERP Platform"
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">SKU</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PROD-BL-ERP-01"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Product Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              >
                <option value="Software / SaaS">Software / SaaS</option>
                <option value="Service">Service</option>
                <option value="Add-on">Add-on</option>
                <option value="Hardware">Hardware</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Base Sales Price (₹)</label>
              <input
                type="number"
                step="1"
                required
                value={salesPrice}
                onChange={(e) => setSalesPrice(e.target.value)}
                placeholder="1000"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Cost Price (₹)</label>
              <input
                type="number"
                step="1"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="450"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brightloop Enterprise"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Software / SaaS"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enterprise platform capability overview..."
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Internal Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Minimum contract size or renewal rules..."
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE5EC]">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal for Adding Variant */}
      <Modal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        title="Add Product Variant / Brand Surcharge"
        subtitle="e.g. Base price ₹1,000 + Odoo surcharge ₹560 = Final price ₹1,560"
        maxWidth="md"
      >
        <form onSubmit={handleAddVariant} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Variant Name</label>
            <input
              type="text"
              required
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              placeholder="e.g. Odoo Brand Edition"
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Variant SKU</label>
              <input
                type="text"
                required
                value={variantSku}
                onChange={(e) => setVariantSku(e.target.value)}
                placeholder="VAR-ERP-ODOO"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Extra Surcharge (₹)</label>
              <input
                type="number"
                step="1"
                required
                value={variantExtraCost}
                onChange={(e) => setVariantExtraCost(e.target.value)}
                placeholder="560"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#6D286F] font-bold focus:outline-none focus:border-[#6D286F] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Brand Attribute</label>
            <input
              type="text"
              value={variantBrandAttr}
              onChange={(e) => setVariantBrandAttr(e.target.value)}
              placeholder="e.g. Odoo"
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE5EC]">
            <Button type="button" variant="outline" onClick={() => setIsVariantModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Variant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProducts;
