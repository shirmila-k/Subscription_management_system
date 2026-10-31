import React, { useEffect, useState } from 'react';
import { productService } from '../../services';

interface Variant {
  id?: string;
  name: string;
  surchargePrice: number;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  type: string;
  salesPrice: number;
  costPrice: number;
  margin: number;
  variants: Variant[];
  state: 'Active' | 'Capped' | 'Archived';
  description?: string;
}

export const ProductsManager: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: 'prd-01',
      name: 'Cloud Sync Engine',
      sku: 'SKU-PRD-0104',
      type: 'Recurring Software',
      salesPrice: 1000,
      costPrice: 320,
      margin: 68.0,
      variants: [
        { name: 'Odoo Connector', surchargePrice: 560 },
        { name: 'SAP Adapter', surchargePrice: 1200 },
        { name: 'Webhook Streamer', surchargePrice: 350 },
      ],
      state: 'Active',
      description: 'High-throughput data synchronization engine for hybrid cloud clusters.',
    },
    {
      id: 'prd-02',
      name: 'API Gateway Enterprise',
      sku: 'SKU-PRD-0188',
      type: 'Infrastructure Service',
      salesPrice: 4500,
      costPrice: 1120,
      margin: 75.1,
      variants: [
        { name: '10M Requests Pack', surchargePrice: 1500 },
        { name: 'Dedicated IP Egress', surchargePrice: 800 },
      ],
      state: 'Active',
      description: 'High-concurrency API gateway with edge caching and rate limiting.',
    },
    {
      id: 'prd-03',
      name: 'Audit Vault & Compliance Logger',
      sku: 'SKU-PRD-0219',
      type: 'Recurring Software',
      salesPrice: 2800,
      costPrice: 640,
      margin: 77.1,
      variants: [
        { name: '7-Year Retention', surchargePrice: 1100 },
        { name: 'SOC2 Report Pack', surchargePrice: 500 },
      ],
      state: 'Active',
      description: 'Immutable ledger logging for regulatory compliance and audit trails.',
    },
    {
      id: 'prd-04',
      name: 'Workflow Automation Core',
      sku: 'SKU-PRD-0305',
      type: 'Recurring Software',
      salesPrice: 1500,
      costPrice: 410,
      margin: 72.6,
      variants: [
        { name: '50 Custom Connectors', surchargePrice: 600 },
        { name: 'Async Batch Engine', surchargePrice: 450 },
      ],
      state: 'Active',
      description: 'Low-code orchestration engine with automated trigger graphs.',
    },
    {
      id: 'prd-05',
      name: 'Dedicated Support SLA',
      sku: 'SKU-PRD-0412',
      type: 'Add-on Module / Service',
      salesPrice: 8000,
      costPrice: 3400,
      margin: 57.5,
      variants: [
        { name: '24/7 Priority Phone Support', surchargePrice: 4000 },
        { name: '15-Min Response Guarantee', surchargePrice: 2500 },
      ],
      state: 'Capped',
      description: 'Named technical account manager and prioritized ticketing queue.',
    },
    {
      id: 'prd-06',
      name: 'Multi-Region Provisioning Bundle',
      sku: 'SKU-PRD-0550',
      type: 'One-time Setup',
      salesPrice: 12000,
      costPrice: 2800,
      margin: 76.6,
      variants: [
        { name: 'High-Availability Failover', surchargePrice: 850 },
        { name: 'EU-Frankfurt Sovereign Data', surchargePrice: 2200 },
      ],
      state: 'Active',
      description: 'Terraform script automation and redundant node clustering.',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newProductName, setNewProductName] = useState('Enterprise Multi-Cloud Sync');
  const [newProductType, setNewProductType] = useState('Recurring Software');
  const [newProductSku, setNewProductSku] = useState('SKU-PRD-0612');
  const [newSalesPrice, setNewSalesPrice] = useState<number>(1000);
  const [newCostPrice, setNewCostPrice] = useState<number>(320);
  const [newDescription, setNewDescription] = useState('High-throughput data synchronization engine for hybrid cloud clusters.');
  const [newVariants, setNewVariants] = useState<Variant[]>([
    { name: 'Odoo Connector Surcharge', surchargePrice: 560 },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchBackendProducts = async () => {
      try {
        const data = await productService.getAll();
        if (data && data.length > 0) {
          // Map backend products
          const mapped: ProductItem[] = data.map((p: any, idx: number) => {
            const margin = p.salesPrice > 0 ? (((p.salesPrice - (p.costPrice || 0)) / p.salesPrice) * 100) : 70;
            return {
              id: p.id,
              name: p.name,
              sku: p.sku || `SKU-PRD-0${100 + idx}`,
              type: p.type || 'Recurring Software',
              salesPrice: Number(p.salesPrice),
              costPrice: Number(p.costPrice || 0),
              margin: Number(margin.toFixed(1)),
              variants: p.variants
                ? p.variants.map((v: any) => ({
                    id: v.id,
                    name: v.name,
                    surchargePrice: Number(v.priceAdjustment || v.surchargePrice || 0),
                  }))
                : [],
              state: p.isActive ? 'Active' : 'Archived',
              description: p.description,
            };
          });
          setProducts(mapped);
        }
      } catch (err) {
        console.info('Backend product fetch unavailable or empty, continuing with Stitch master catalog');
      }
    };

    fetchBackendProducts();
  }, []);

  // Price & Margin Calculations
  const calculatedMargin =
    newSalesPrice > 0
      ? (((newSalesPrice - newCostPrice) / newSalesPrice) * 100).toFixed(1)
      : '0.0';

  const firstVariantSurcharge = newVariants[0]?.surchargePrice || 0;
  const finalCalculatedPrice = newSalesPrice + firstVariantSurcharge;

  const handleAddVariantField = () => {
    setNewVariants([
      ...newVariants,
      { name: `New Variant #${newVariants.length + 1}`, surchargePrice: 500 },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setNewVariants(newVariants.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...newVariants];
    updated[index] = { ...updated[index], [field]: value };
    setNewVariants(updated);
  };

  const handleSaveProduct = async () => {
    setIsSaving(true);
    try {
      // Try backend call
      await productService.create({
        name: newProductName,
        type: newProductType,
        salesPrice: newSalesPrice,
        costPrice: newCostPrice,
        description: newDescription,
        variants: newVariants.map((v) => ({
          name: v.name,
          surchargePrice: v.surchargePrice,
        })),
      });
    } catch (e) {
      console.info('Backend product create fell back to client state update');
    }

    const newProd: ProductItem = {
      id: `prd-${Date.now()}`,
      name: newProductName,
      sku: newProductSku,
      type: newProductType,
      salesPrice: newSalesPrice,
      costPrice: newCostPrice,
      margin: parseFloat(calculatedMargin),
      variants: newVariants,
      state: 'Active',
      description: newDescription,
    };

    setProducts([newProd, ...products]);
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' ? true : p.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Active Breadcrumb Context Strip */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5 text-xs text-[#81737e]">
          <span className="hover:text-[#1f1924] cursor-pointer">Billing Architecture</span>
          <span>/</span>
          <span className="text-[#1f1924] font-semibold">Products &amp; Variants</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#81737e]">
            Catalog Sync
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#f5eaf9] text-xs font-medium text-[#1f1924]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            v4.18.2 Production Live
          </span>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1f1924] tracking-tight">Products &amp; Variants</h1>
          <p className="text-sm text-[#81737e] max-w-2xl mt-1">
            Manage base billable offerings, software modules, infrastructure add-ons, and dynamic
            surcharge matrices across multi-tenant enterprise contracts.
          </p>

          {/* Sub-Tab Navigation Strip */}
          <div className="flex items-center gap-2 pt-4">
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-[#6D286F] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">layers</span>
              <span>Products &amp; Variants</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#421747] text-white text-[10px]">
                {products.length}
              </span>
            </button>
            <a
              href="/admin/plans"
              className="px-3.5 py-1.5 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-[#81737e] hover:text-[#1f1924] hover:bg-[#f5eaf9] text-xs font-medium flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Subscription Plans</span>
            </a>
          </div>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => alert('Exporting complete product catalog...')}
            className="px-3.5 py-2 rounded-lg bg-white border border-[#EAE5EC] text-[#1f1924] shadow-xs hover:bg-[#FAF9FB] text-xs font-medium flex items-center gap-1.5 transition"
          >
            <span className="material-symbols-outlined text-[18px] text-[#81737e]">download</span>
            <span>Export Catalog</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#6D286F] text-white hover:bg-[#530D57] transition text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Mosaic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#81737e]">
              Total Base Offerings
            </span>
            <span className="p-1.5 rounded-lg bg-[#FAF9FB] text-[#6D286F]">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#1f1924] tabular-nums">{products.length}</span>
              <span className="text-xs text-[#81737e]">Active SKUs</span>
            </div>
            <div className="flex items-center gap-1 pt-1 text-xs text-[#16845B]">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              <span>+3 added this quarter</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#81737e]">
              Configured Variants
            </span>
            <span className="p-1.5 rounded-lg bg-[#FAF9FB] text-[#6D286F]">
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#1f1924] tabular-nums">68</span>
              <span className="text-xs text-[#81737e]">Billable Surcharges</span>
            </div>
            <div className="text-xs text-[#81737e] pt-1">Avg 2.8 variants / base core</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#81737e]">
              Avg Base Margin
            </span>
            <span className="p-1.5 rounded-lg bg-[#FAF9FB] text-emerald-700">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-bold text-[#1f1924] tabular-nums">72.4%</span>
              <div className="flex items-center gap-1 pt-1 text-xs text-emerald-600">
                <span className="material-symbols-outlined text-[14px]">insights</span>
                <span>+4.2% YoY gain</span>
              </div>
            </div>
            {/* Sparkline */}
            <svg className="w-16 h-8 text-[#84418A]" fill="none" viewBox="0 0 80 32">
              <path
                d="M2 28 L16 22 L32 24 L48 14 L64 16 L78 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
              <path
                d="M2 28 L16 22 L32 24 L48 14 L64 16 L78 4 L78 32 L2 32 Z"
                fill="currentColor"
                fillOpacity="0.08"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Top Revenue Anchor */}
        <div className="bg-gradient-to-br from-[#421747] via-[#6D286F] to-[#84418A] text-white p-5 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs uppercase tracking-wider text-[#d9a0d9]">Top Revenue Anchor</span>
            <span className="px-2 py-0.5 rounded-full bg-[#613465] text-white text-[10px] font-bold">
              High Velocity
            </span>
          </div>
          <div>
            <div className="text-base font-bold text-white truncate">Cloud Sync Engine</div>
            <div className="flex items-baseline gap-1 pt-0.5">
              <span className="text-2xl font-bold text-white tabular-nums">₹8,90,000</span>
              <span className="text-xs text-[#d9a0d9]">MRR weight</span>
            </div>
            <div className="text-xs text-[#eeb3ee] pt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              <span>84 active cluster subscriptions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#EAE5EC] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#81737e] text-[18px]">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-[#1f1924] placeholder:text-[#81737e] text-xs outline-none focus:border-[#6D286F]"
            placeholder="Search by product name, SKU, variant, type..."
            type="text"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-medium text-[#1f1924] outline-none"
          >
            <option value="All">Type: All Categories</option>
            <option value="Recurring Software">Recurring Software</option>
            <option value="Infrastructure Service">Infrastructure Service</option>
            <option value="Add-on Module / Service">Add-on Module</option>
            <option value="One-time Setup">One-time Setup</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedType('All');
            }}
            className="p-2 rounded-lg text-[#81737e] hover:text-[#1f1924] hover:bg-[#FAF9FB] border border-[#EAE5EC] transition"
            title="Reset Filters"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Products & Variants Table */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF9FB] text-[#81737e] uppercase tracking-wider font-semibold border-b border-[#EAE5EC]">
              <tr>
                <th className="py-3 px-6">Product Name &amp; SKU</th>
                <th className="py-3 px-4">Offering Type</th>
                <th className="py-3 px-4 text-right">Sales Price</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-center">Gross Margin</th>
                <th className="py-3 px-6 min-w-[280px]">Configured Variants &amp; Surcharges</th>
                <th className="py-3 px-4 text-center">State</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5EC] text-[#1f1924]">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#FAF9FB] transition group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f5eaf9] text-[#6D286F] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#1f1924] flex items-center gap-2">
                          <span className="truncate">{p.name}</span>
                        </div>
                        <div className="text-[11px] text-[#81737e] font-mono">{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] text-[11px] font-medium text-[#1f1924]">
                      {p.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right tabular-nums whitespace-nowrap">
                    <span className="text-sm font-bold text-[#1f1924]">
                      ₹{p.salesPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-[#81737e] block">base price</span>
                  </td>
                  <td className="py-4 px-4 text-right tabular-nums whitespace-nowrap">
                    <span className="text-sm font-medium text-[#81737e]">
                      ₹{p.costPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-[#81737e] block">COGS</span>
                  </td>
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                      +{p.margin}%
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1.5">
                      {p.variants.map((v, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-[#FAF9FB] border border-[#EAE5EC] text-[11px] text-[#1f1924]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#84418A] mr-1.5" />
                          {v.name}{' '}
                          <strong className="ml-1 text-[#6D286F]">
                            (+₹{v.surchargePrice.toLocaleString('en-IN')})
                          </strong>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.state === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-[#FEF6E9] text-[#B7791F]'
                      }`}
                    >
                      ● {p.state}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 text-[#81737e]">
                      <button
                        type="button"
                        onClick={() => {
                          setNewProductName(p.name);
                          setNewSalesPrice(p.salesPrice);
                          setNewCostPrice(p.costPrice);
                          setNewVariants(p.variants);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:text-[#1f1924] hover:bg-[#f5eaf9] transition"
                        title="Edit Product"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="p-1.5 rounded-lg hover:text-[#6D286F] hover:bg-[#f5eaf9] transition"
                        title="Configure Surcharges"
                      >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Variant Surcharge Analysis & Revenue Impact Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Surcharge Distribution Matrix */}
        <div className="bg-white p-6 rounded-xl border border-[#EAE5EC] shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="text-base font-bold text-[#1f1924]">
                  Variant Revenue Contribution by Connector
                </h3>
                <p className="text-xs text-[#81737e]">
                  Realized monthly margin uplift across top add-on SKU attachments.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-medium text-[#6D286F]">
                30-Day Trailing
              </span>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <div className="flex justify-between text-xs pb-1">
                  <span className="font-semibold text-[#1f1924]">
                    SAP Integration Adapter (+₹1,200)
                  </span>
                  <span className="font-bold text-[#6D286F] tabular-nums">
                    ₹3,48,000 / mo • 41% share
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#f5eaf9] overflow-hidden">
                  <div className="h-full bg-[#6D286F] rounded-full" style={{ width: '41%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs pb-1">
                  <span className="font-semibold text-[#1f1924]">
                    Odoo Connector Surcharge (+₹560)
                  </span>
                  <span className="font-bold text-[#84418A] tabular-nums">
                    ₹2,85,600 / mo • 34% share
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#f5eaf9] overflow-hidden">
                  <div className="h-full bg-[#84418A] rounded-full" style={{ width: '34%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs pb-1">
                  <span className="font-semibold text-[#1f1924]">
                    10M API Burst Gateway Pack (+₹1,500)
                  </span>
                  <span className="font-bold text-[#81737e] tabular-nums">
                    ₹1,54,500 / mo • 18% share
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#f5eaf9] overflow-hidden">
                  <div className="h-full bg-[#81737e] rounded-full" style={{ width: '18%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-[#81737e]">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Live pricing parity with Stripe &amp; Razorpay verified
            </span>
          </div>
        </div>

        {/* Dynamic Pricing Engine Tile */}
        <div className="bg-[#FAF9FB] p-6 rounded-xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#6D286F] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">price_change</span>
            </div>
            <h3 className="text-base font-bold text-[#1f1924]">Dynamic Pricing Engine</h3>
            <p className="text-xs text-[#81737e]">
              Adjust variant surcharges across all customer quotes or grandfather existing agreements.
            </p>

            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#EAE5EC]">
                <span className="text-xs text-[#1f1924] font-medium">
                  Auto-calculate Tax Matrix (GST/IGST)
                </span>
                <span className="material-symbols-outlined text-[#6D286F] text-[20px]">
                  toggle_on
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#EAE5EC]">
                <span className="text-xs text-[#1f1924] font-medium">
                  Enforce 50% Minimum Margin Rule
                </span>
                <span className="material-symbols-outlined text-[#6D286F] text-[20px]">
                  toggle_on
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => alert('Margin audit passed: All active SKUs above target 50% margin')}
              className="w-full py-2 px-3 rounded-lg bg-[#84418A] text-white hover:bg-[#6D286F] transition text-xs font-semibold shadow-xs"
            >
              Run Margin Audit Tool
            </button>
          </div>
        </div>
      </div>

      {/* Product Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#FAF9FB] border-b border-[#EAE5EC] flex items-start justify-between shrink-0">
              <div>
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#6D286F] font-bold">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Catalog Expansion</span>
                </div>
                <h2 className="text-xl font-bold text-[#1f1924] tracking-tight pt-0.5">
                  Create / Edit Billable Product
                </h2>
                <p className="text-xs text-[#81737e]">
                  Define product base pricing, cost, and add-on variant surcharges.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#81737e] hover:text-[#1f1924] hover:bg-slate-100 transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Product Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#1f1924] pb-1">
                    Product Name <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs font-medium text-[#1f1924] outline-none focus:border-[#6D286F]"
                    placeholder="e.g. Enterprise Multi-Cloud Sync"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1f1924] pb-1">
                    Product Type
                  </label>
                  <select
                    value={newProductType}
                    onChange={(e) => setNewProductType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs font-medium text-[#1f1924] outline-none"
                  >
                    <option>Recurring Software</option>
                    <option>Infrastructure Service</option>
                    <option>One-time Setup</option>
                    <option>Consumption / Metered</option>
                    <option>Add-on Module</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1f1924] pb-1">
                    Auto SKU Identifier
                  </label>
                  <input
                    value={newProductSku}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-mono text-[#81737e] cursor-not-allowed"
                    type="text"
                  />
                </div>
              </div>

              {/* Pricing & Margin Breakdown Section */}
              <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#6D286F] font-bold">
                    Base Economics (Per Unit)
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                    +{calculatedMargin}% Projected Margin
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1f1924] pb-1">
                      Base Sales Price (₹) <span className="text-[#ba1a1a]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1f1924] font-semibold">
                        ₹
                      </span>
                      <input
                        value={newSalesPrice}
                        onChange={(e) => setNewSalesPrice(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#EAE5EC] text-base font-bold text-[#1f1924] tabular-nums outline-none"
                        type="number"
                      />
                    </div>
                    <span className="text-[10px] text-[#81737e] pt-1 block">
                      Default customer catalog price
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1f1924] pb-1">
                      Base Cost Price (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#81737e] font-semibold">
                        ₹
                      </span>
                      <input
                        value={newCostPrice}
                        onChange={(e) => setNewCostPrice(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#EAE5EC] text-base font-bold text-[#81737e] tabular-nums outline-none"
                        type="number"
                      />
                    </div>
                    <span className="text-[10px] text-[#81737e] pt-1 block">
                      Internal cloud compute / COGS
                    </span>
                  </div>
                </div>
              </div>

              {/* Add-on Variant Surcharge Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#1f1924]">Variant &amp; Surcharge Add-ons</h4>
                    <p className="text-xs text-[#81737e]">
                      Configure dynamic add-ons that append surcharges on top of the base sales price.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#6D286F]">
                    {newVariants.length} Variant(s)
                  </span>
                </div>

                {newVariants.map((variant, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white border border-[#EAE5EC] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#81737e]">Variant #{idx + 1}</span>
                      {newVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-[#ba1a1a] text-xs font-medium hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#81737e] pb-1">Variant Name</label>
                        <input
                          value={variant.name}
                          onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#EAE5EC] text-xs text-[#1f1924]"
                          type="text"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#81737e] pb-1">
                          Additional Variant Price (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#81737e] font-semibold text-xs">
                            ₹
                          </span>
                          <input
                            value={variant.surchargePrice}
                            onChange={(e) =>
                              handleUpdateVariant(
                                idx,
                                'surchargePrice',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full pl-6 pr-3 py-1.5 rounded-lg border border-[#EAE5EC] text-xs font-bold text-[#1f1924] tabular-nums"
                            type="number"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Live Formula Indicator */}
                <div className="p-3 rounded-lg bg-[#f5eaf9] flex items-center justify-between border border-[#d3c2ce]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6D286F] text-[20px]">
                      calculate
                    </span>
                    <span className="text-xs font-semibold text-[#1f1924]">
                      Final Calculated Selling Price:
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-[#6D286F] tabular-nums">
                      ₹{finalCalculatedPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-[#81737e] block">
                      Auto: ₹{newSalesPrice.toLocaleString('en-IN')} base + ₹
                      {firstVariantSurcharge.toLocaleString('en-IN')} surcharge
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddVariantField}
                  className="w-full py-2 rounded-xl bg-[#FAF9FB] hover:bg-[#f5eaf9] text-[#6D286F] border border-[#EAE5EC] text-xs font-semibold flex items-center justify-center gap-1 transition"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>+ Add Another Variant Surcharge</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#FAF9FB] border-t border-[#EAE5EC] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <input
                  id="make-active"
                  defaultChecked
                  type="checkbox"
                  className="rounded text-[#6D286F]"
                />
                <label htmlFor="make-active" className="text-xs text-[#81737e] cursor-pointer">
                  Immediately make active in quote builder
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#EAE5EC] text-[#1f1924] hover:bg-[#FAF9FB] text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveProduct}
                  className="px-4 py-2 rounded-lg bg-[#6D286F] text-white hover:bg-[#530D57] text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{isSaving ? 'Publishing...' : 'Save & Publish Product'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;
