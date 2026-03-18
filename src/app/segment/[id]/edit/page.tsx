"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Modal } from "@/components/ui/Modal";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useSettings,
  useFilterOptions,
  useSegmentPreview,
  useUsers,
} from "@/hooks";
import type { FilterOptions as FilterOptionsType } from "@/hooks/useFilterOptions";
import { useUpdateSegment, useSegment } from "@/hooks/useSegments";
import type { CustomerPreview } from "@/hooks/useSegmentPreview";
import { useBrandFilterOptions } from "@/hooks/useBrandFilterOptions";

// ─── Types ────────────────────────────────────────────────

type FilterType =
  | "brand"
  | "transaction"
  | "timeframe"
  | "demographics"
  | "engagement_customer"
  | "engagement_management"
  | "engagement_status";

type FilterModule = {
  id: string;
  type: FilterType;
  connector: "AND" | "OR";
  config: Record<string, unknown>;
};

type AudiencePreview = {
  matchingCount: number;
  totalCount: number;
  percentage: number;
  customers: Array<{
    customerName: string;
    phoneNumber: string;
    lastPurchase: string;
    status: string;
    lastContact?: string | null;
    engagementStatus?: "contacted" | "not_contacted" | "unknown";
    blastStatus?: string;
  }>;
  _meta?: {
    method: string;
    accurate: boolean;
    sampleSize: number;
    totalPages?: number;
    estimatedApiCallsForFullSync?: number;
    everproEnriched?: boolean;
  };
};

type AppSettingsData = {
  currency: string;
  currencySymbol: string;
  marketingCostPerCustomer: number;
};

type FilterOptions = {
  brands: string[];
  brandClientIdMap: Record<string, number>;
  skus: string[];
  provinces: string[];
  cities: string[];
  districts: string[];
  csNames: string[];
  leadSources: string[];
  customerTypes: string[];
  expeditions: string[];
  transactionTypes: string[];
};

// ─── Filter Definitions ───────────────────────────────────

const FILTER_DEFS: Record<
  FilterType,
  { label: string; description: string; iconBg: string; iconColor: string }
> = {
  brand: {
    label: "Brand",
    description: "Filter berdasarkan brand",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  transaction: {
    label: "Historical Transaction",
    description: "SKU, qty, jumlah, tipe transaksi, ekspedisi",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  timeframe: {
    label: "Timeframe",
    description: "Tanggal input & tanggal pengiriman",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  demographics: {
    label: "Demographics",
    description: "Nama, No HP, provinsi, kota, kecamatan",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  engagement_customer: {
    label: "Engagement — Customer History",
    description: "Order frequency & jenis customer",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  engagement_management: {
    label: "Engagement — Management",
    description: "Nama CS & sumber leads",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  engagement_status: {
    label: "Engagement Status",
    description: "Status integrasi & aktivitas customer",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
};

// ─── Icons ────────────────────────────────────────────────

function BrandIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}
function TransactionIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  );
}
function TimeframeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function DemographicsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function EngagementCustomerIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function EngagementManagementIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function PlusCircleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
function LightningIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

const FILTER_ICONS: Record<FilterType, () => React.ReactNode> = {
  brand: BrandIcon,
  transaction: TransactionIcon,
  timeframe: TimeframeIcon,
  demographics: DemographicsIcon,
  engagement_customer: EngagementCustomerIcon,
  engagement_management: EngagementManagementIcon,
  engagement_status: LightningIcon,
};

// ─── Helpers ──────────────────────────────────────────────

let _idCounter = 0;
function genId() {
  return `filter_${Date.now()}_${++_idCounter}`;
}

function fmtCurrency(amount: number, symbol: string) {
  return `${symbol} ${amount.toLocaleString("id-ID")}`;
}

// ─── Filter Config Forms ──────────────────────────────────

type FilterFormProps = {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
  options: FilterOptions;
  settings: AppSettingsData;
  selectedClientId?: number | null;
  onBrandChange?: (clientId: number | null) => void;
};

function BrandFilterForm({ config, onChange, options }: FilterFormProps) {
  const brands = (config.brands as string[]) || [];
  return (
    <div>
      <label className="filter-label">Brand</label>
      <MultiSelect
        options={options.brands}
        selected={brands}
        onChange={(v) => onChange({ ...config, brands: v })}
        placeholder="Pilih brand..."
      />
    </div>
  );
}

function TransactionFilterForm({
  config,
  onChange,
  options,
  settings,
  selectedClientId,
}: FilterFormProps) {
  const { options: brandOptions, isLoading } = useBrandFilterOptions(
    selectedClientId || 0,
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="filter-label">SKU (Produk)</label>
        {isLoading ? (
          <span className="text-slate-400">Loading SKU data...</span>
        ) : (
          <>
            <MultiSelect
              options={brandOptions?.skus || []}
              selected={(config.skus as string[]) || []}
              onChange={(v) =>
                onChange({ ...config, skus: v.length > 0 ? v : undefined })
              }
              placeholder="Pilih SKU produk..."
              allowCustom
            />
            <p className="text-xs text-slate-500 mt-1">
              Item summary dihitung berdasarkan jumlah SKU berbeda
            </p>
          </>
        )}
      </div>
      <div>
        <label className="filter-label">Min Qty</label>
        <input
          type="number"
          min={0}
          value={(config.minQty as string) || ""}
          onChange={(e) =>
            onChange({ ...config, minQty: e.target.value || undefined })
          }
          placeholder="0"
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Max Qty</label>
        <input
          type="number"
          min={0}
          value={(config.maxQty as string) || ""}
          onChange={(e) =>
            onChange({ ...config, maxQty: e.target.value || undefined })
          }
          placeholder="∞"
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">
          Min Amount ({settings.currencySymbol})
        </label>
        <input
          type="number"
          min={0}
          value={(config.minAmount as string) || ""}
          onChange={(e) =>
            onChange({ ...config, minAmount: e.target.value || undefined })
          }
          placeholder="0"
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">
          Max Amount ({settings.currencySymbol})
        </label>
        <input
          type="number"
          min={0}
          value={(config.maxAmount as string) || ""}
          onChange={(e) =>
            onChange({ ...config, maxAmount: e.target.value || undefined })
          }
          placeholder="∞"
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Transaction Type</label>
        <select
          value={(config.transactionType as string) || ""}
          onChange={(e) =>
            onChange({
              ...config,
              transactionType: e.target.value || undefined,
            })
          }
          className="filter-input"
        >
          <option value="">All Types</option>
          {options.transactionTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="filter-label">Expedition</label>
        <select
          value={(config.expedition as string) || ""}
          onChange={(e) =>
            onChange({ ...config, expedition: e.target.value || undefined })
          }
          className="filter-input"
        >
          <option value="">All Expeditions</option>
          {options.expeditions.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TimeframeFilterForm({ config, onChange }: FilterFormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="filter-label">Input Date Start</label>
        <input
          type="date"
          value={(config.inputDateStart as string) || ""}
          onChange={(e) =>
            onChange({ ...config, inputDateStart: e.target.value || undefined })
          }
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Input Date End</label>
        <input
          type="date"
          value={(config.inputDateEnd as string) || ""}
          onChange={(e) =>
            onChange({ ...config, inputDateEnd: e.target.value || undefined })
          }
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Shipping Date Start</label>
        <input
          type="date"
          value={(config.shippingDateStart as string) || ""}
          onChange={(e) =>
            onChange({
              ...config,
              shippingDateStart: e.target.value || undefined,
            })
          }
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Shipping Date End</label>
        <input
          type="date"
          value={(config.shippingDateEnd as string) || ""}
          onChange={(e) =>
            onChange({
              ...config,
              shippingDateEnd: e.target.value || undefined,
            })
          }
          className="filter-input"
        />
      </div>
    </div>
  );
}

function DemographicsFilterForm({
  config,
  onChange,
  options,
}: FilterFormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="filter-label">Customer Name (contains)</label>
        <input
          type="text"
          value={(config.customerName as string) || ""}
          onChange={(e) =>
            onChange({ ...config, customerName: e.target.value || undefined })
          }
          placeholder="Search name..."
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Phone Number (contains)</label>
        <input
          type="text"
          value={(config.phoneNumber as string) || ""}
          onChange={(e) =>
            onChange({ ...config, phoneNumber: e.target.value || undefined })
          }
          placeholder="08xxx"
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Province</label>
        <MultiSelect
          options={options.provinces}
          selected={(config.provinces as string[]) || []}
          onChange={(v) => onChange({ ...config, provinces: v })}
          placeholder="Pilih provinsi..."
        />
      </div>
      <div>
        <label className="filter-label">City</label>
        <MultiSelect
          options={options.cities}
          selected={(config.cities as string[]) || []}
          onChange={(v) => onChange({ ...config, cities: v })}
          placeholder="Pilih kota..."
        />
      </div>
      <div className="sm:col-span-2">
        <label className="filter-label">District</label>
        <MultiSelect
          options={options.districts}
          selected={(config.districts as string[]) || []}
          onChange={(v) => onChange({ ...config, districts: v })}
          placeholder="Pilih kecamatan..."
        />
      </div>
    </div>
  );
}

function EngagementCustomerFilterForm({
  config,
  onChange,
  options,
}: FilterFormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="filter-label">Order Frequency</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={(config.minOrders as string) || ""}
            onChange={(e) =>
              onChange({ ...config, minOrders: e.target.value || undefined })
            }
            placeholder="Min"
            className="filter-input flex-1"
          />
          <span className="text-slate-400">—</span>
          <input
            type="number"
            min={0}
            value={(config.maxOrders as string) || ""}
            onChange={(e) =>
              onChange({ ...config, maxOrders: e.target.value || undefined })
            }
            placeholder="Max"
            className="filter-input flex-1"
          />
        </div>
      </div>
      <div>
        <label className="filter-label">Customer Type</label>
        <MultiSelect
          options={options.customerTypes}
          selected={(config.customerTypes as string[]) || []}
          onChange={(v) => onChange({ ...config, customerTypes: v })}
          placeholder="Pilih tipe..."
        />
      </div>
    </div>
  );
}

function EngagementManagementFilterForm({
  config,
  onChange,
  options,
  selectedClientId,
}: FilterFormProps) {
  const { options: brandOptions, isLoading } = useBrandFilterOptions(
    selectedClientId || 0,
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="filter-label">CS Name</label>
        {isLoading ? (
          <span className="text-slate-400">Loading CS data...</span>
        ) : (
          <MultiSelect
            options={brandOptions?.csNames || []}
            selected={(config.csNames as string[]) || []}
            onChange={(v) => onChange({ ...config, csNames: v })}
            placeholder="Pilih CS..."
          />
        )}
      </div>
      <div>
        <label className="filter-label">Lead Source</label>
        {isLoading ? (
          <span className="text-slate-400">Loading lead sources...</span>
        ) : (
          <MultiSelect
            options={brandOptions?.leadSources || []}
            selected={(config.leadSources as string[]) || []}
            onChange={(v) => onChange({ ...config, leadSources: v })}
            placeholder="Pilih sumber..."
          />
        )}
      </div>
    </div>
  );
}

function EngagementStatusFilterForm({ config, onChange }: FilterFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="filter-label">Integration Status</label>
        <div className="flex flex-wrap gap-2">
          {["SYNC", "NOT_SYNC", "UNKNOWN"].map((s) => {
            const selected = ((config.syncStatus as string[]) || []).includes(
              s,
            );
            return (
              <button
                key={s}
                onClick={() => {
                  const curr = (config.syncStatus as string[]) || [];
                  const next = selected
                    ? curr.filter((x) => x !== s)
                    : [...curr, s];
                  onChange({
                    ...config,
                    syncStatus: next.length ? next : undefined,
                  });
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  selected
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "SYNC"
                  ? "Synced"
                  : s === "NOT_SYNC"
                    ? "Not Synced"
                    : "Unknown"}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="filter-label">Last Contact Date Start</label>
          <input
            type="date"
            value={(config.lastContactDateStart as string) || ""}
            onChange={(e) =>
              onChange({
                ...config,
                lastContactDateStart: e.target.value || undefined,
              })
            }
            className="filter-input"
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div>
          <label className="filter-label">Last Contact Date End</label>
          <input
            type="date"
            value={(config.lastContactDateEnd as string) || ""}
            onChange={(e) =>
              onChange({
                ...config,
                lastContactDateEnd: e.target.value || undefined,
              })
            }
            className="filter-input"
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>
    </div>
  );
}

const FILTER_FORMS: Record<FilterType, React.FC<FilterFormProps>> = {
  brand: BrandFilterForm,
  transaction: TransactionFilterForm,
  timeframe: TimeframeFilterForm,
  demographics: DemographicsFilterForm,
  engagement_customer: EngagementCustomerFilterForm,
  engagement_management: EngagementManagementFilterForm,
  engagement_status: EngagementStatusFilterForm,
};

// ─── Main Page ────────────────────────────────────────────

export default function EditSegmentPage() {
  const router = useRouter();
  const params = useParams();
  const segmentId = params?.id as string;
  const { data: session } = useSession();

  // Using custom hooks for data fetching
  const { settings: appSettings } = useSettings();
  const { options: filterOptions } = useFilterOptions();
  const { updateSegment, isUpdating } = useUpdateSegment();
  const { segment, isLoading: segmentLoading } = useSegment(segmentId);
  const { users } = useUsers();
  const {
    preview,
    isLoading: previewLoading,
    fetchPreview,
  } = useSegmentPreview();

  const [segmentName, setSegmentName] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Local filter state
  const [filters, setFilters] = useState<FilterModule[]>([]);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [pageLimit, setPageLimit] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllUsersModal, setShowAllUsersModal] = useState(false);

  // Toast state for error messages
  const [toastError, setToastError] = useState<string | null>(null);

  // Track if segment data has been loaded
  const [segmentLoaded, setSegmentLoaded] = useState(false);

  // App settings with defaults
  const settings = appSettings || {
    currency: "IDR",
    currencySymbol: "Rp",
    marketingCostPerCustomer: 610,
  };

  // Filter options with defaults
  const options: FilterOptionsType = filterOptions || {
    brands: [],
    brandClientIdMap: {},
    skus: [],
    provinces: [],
    cities: [],
    districts: [],
    csNames: [],
    leadSources: [],
    customerTypes: [],
    expeditions: [],
    transactionTypes: [],
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load segment data when available
  useEffect(() => {
    if (segment && !segmentLoaded) {
      setSegmentName(segment.name);
      // Load filters from segment
      if (segment.filters && Array.isArray(segment.filters)) {
        const loadedFilters = (segment.filters as FilterModule[]).map((f) => ({
          ...f,
          id: f.id || genId(), // Ensure each filter has an ID
        }));
        setFilters(loadedFilters);
      }
      setSegmentLoaded(true);
    }
  }, [segment, segmentLoaded]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const commitTitle = () => {
    if (!segmentName.trim()) {
      setSegmentName("Untitled Segment");
    }
    setEditingTitle(false);
  };

  // ─── Preview (debounced) ────────────────────────────────

  const runPreview = useCallback(
    (currentFilters: FilterModule[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (currentFilters.length === 0) {
          return;
        }
        await fetchPreview(currentFilters);
      }, 600);
    },
    [fetchPreview],
  );

  useEffect(() => {
    if (filters.length > 0) {
      runPreview(filters);
    }
  }, [filters, runPreview]);

  // ─── Filter actions ─────────────────────────────────────

  // Check if a brand filter exists with at least one brand selected
  const hasBrandFilter = filters.some(
    (f) =>
      f.type === "brand" &&
      Array.isArray(f.config.brands) &&
      f.config.brands.length > 0,
  );

  // Get the selected client_id from the brand filter
  const selectedClientId = (() => {
    const brandFilter = filters.find(
      (f) =>
        f.type === "brand" &&
        Array.isArray(f.config.brands) &&
        f.config.brands.length > 0,
    );
    if (brandFilter && Array.isArray(brandFilter.config.brands)) {
      const firstBrand = brandFilter.config.brands[0] as string;
      return options.brandClientIdMap[firstBrand] || null;
    }
    return null;
  })();

  // Filters that require a brand to be selected first
  const BRAND_REQUIRED_FILTERS: FilterType[] = [
    "transaction",
    "engagement_management",
  ];

  const addFilter = (type: FilterType) => {
    // Check if this filter type requires a brand
    if (BRAND_REQUIRED_FILTERS.includes(type) && !hasBrandFilter) {
      setToastError(
        "Filter ini membutuhkan Brand. Silakan tambahkan dan pilih Brand terlebih dahulu.",
      );
      setShowFilterPicker(false);
      return;
    }

    setFilters([
      ...filters,
      { id: genId(), type, connector: "AND", config: {} },
    ]);
    setShowFilterPicker(false);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const updateFilterConfig = (id: string, config: Record<string, unknown>) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, config } : f)));
  };

  const toggleConnector = (id: string) => {
    setFilters(
      filters.map((f) =>
        f.id === id
          ? { ...f, connector: f.connector === "AND" ? "OR" : "AND" }
          : f,
      ),
    );
  };

  // ─── Save ───────────────────────────────────────────────

  const handleSave = async () => {
    if (!segmentName.trim()) {
      setEditingTitle(true);
      return;
    }

    const result = await updateSegment(segmentId, {
      name: segmentName,
      description: undefined,
      filters,
      resultCount: preview?.matchingCount || 0,
    });

    if (result) {
      router.push("/");
    } else {
      alert("Failed to update segment.");
    }
  };

  // ─── Computed ───────────────────────────────────────────

  const matchingCount = preview?.matchingCount || 0;
  const campaignCost = matchingCount * settings.marketingCostPerCustomer;

  // Calculate total pages based on current pageLimit
  const totalPages = preview?.totalCount
    ? Math.ceil(preview.totalCount / pageLimit)
    : 1;

  // ─── Render ─────────────────────────────────────────────

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toastError) {
      const timer = setTimeout(() => setToastError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastError]);

  // Loading state
  if (segmentLoading) {
    return (
      <AppShell active="Campaigns">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <span className="text-slate-500">Loading segment...</span>
          </div>
        </div>
      </AppShell>
    );
  }

  // Not found state
  if (!segment && !segmentLoading) {
    return (
      <AppShell active="Campaigns">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-slate-300"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-slate-500">Segment not found</span>
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Campaigns
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <>
      {/* Toast Error Notification */}
      {toastError && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 shadow-lg">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-red-500"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="text-sm font-medium text-red-700">
              {toastError}
            </span>
            <button
              onClick={() => setToastError(null)}
              className="ml-2 text-red-400 hover:text-red-600 transition"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <AppShell
        active="Campaigns"
        header={
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="group">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Campaigns &gt; Edit Segment
              </p>
              {editingTitle ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    onBlur={commitTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitTitle();
                      if (e.key === "Escape") {
                        setEditingTitle(false);
                      }
                    }}
                    className="editable-title-input font-[var(--font-sora)] text-3xl font-semibold outline-none border-b-2 border-blue-500 bg-transparent py-1"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1
                    onClick={() => setEditingTitle(true)}
                    className="editable-title mt-2 cursor-pointer font-[var(--font-sora)] text-3xl font-semibold transition hover:text-blue-600"
                  >
                    {segmentName || "Untitled Segment"}
                  </h1>
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="mt-2 rounded-full p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-500"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-sm text-slate-500">
                Edit filter audiens untuk campaign marketing Anda.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 5h11l3 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
                      <path d="M8 5v6h6V5" />
                    </svg>
                    Update Segment
                  </>
                )}
              </Button>
            </div>
          </div>
        }
        rightAside={
          <>
            {/* ─── Audience Summary ─── */}
            <Card className="px-5 py-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Audience Summary
                </p>
                <button
                  onClick={() => runPreview(filters)}
                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  {previewLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 inline-block" />
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M23 4v6h-6M1 20v-6h6" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="mt-6">
                <p className="text-4xl font-bold tracking-tight">
                  {matchingCount.toLocaleString("id-ID")}
                </p>
                <p className="text-sm font-medium text-slate-500">
                  Matching Users
                </p>

                {preview?._meta && !preview._meta.accurate && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>Estimated count (sampled data)</span>
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-5 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(preview?.percentage || 0, 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-xs font-medium text-slate-400">
                  Top {preview?.percentage || 0}% of your customer base
                </p>
              </div>

              {/* Customer mini-table */}
              {preview && preview.customers.length > 0 && (
                <div className="mt-8 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-3 px-1">
                    <span className="flex-[2]">Name</span>
                    <span className="flex-1 text-center">Last Pur.</span>
                    <span className="w-8 text-right">Status</span>
                  </div>
                  <div className="space-y-4 text-xs font-medium">
                    {preview.customers.slice(0, 7).map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-1 hover:bg-slate-50 py-1 rounded-lg transition-colors cursor-default"
                      >
                        <span className="text-slate-800 truncate flex-[2]">
                          {c.customerName || "—"}
                        </span>
                        <span className="text-slate-500 flex-1 text-center font-normal">
                          {c.lastPurchase
                            ? (() => {
                                const diff =
                                  new Date().getTime() -
                                  new Date(c.lastPurchase).getTime();
                                const days = Math.floor(
                                  diff / (1000 * 60 * 60 * 24),
                                );
                                if (days === 0) return "Today";
                                if (days < 7) return `${days}d ago`;
                                return `${Math.floor(days / 7)}w ago`;
                              })()
                            : "—"}
                        </span>
                        <div className="w-8 flex justify-end">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              c.status === "SYNC"
                                ? "bg-green-500"
                                : c.status === "NOT_SYNC"
                                  ? "bg-red-500"
                                  : "bg-slate-300"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {matchingCount > 7 && (
                    <button
                      onClick={() => setShowAllUsersModal(true)}
                      className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
                    >
                      View all {matchingCount.toLocaleString("id-ID")} users
                    </button>
                  )}
                </div>
              )}

              {/* Empty state */}
              {filters.length > 0 &&
                (!preview || preview.customers.length === 0) &&
                !previewLoading && (
                  <div className="mt-8 border-t border-slate-100 pt-5 text-center">
                    <p className="text-sm text-slate-400">No matching users</p>
                  </div>
                )}
            </Card>

            {/* ─── Campaign Cost ─── */}
            <Card className="mt-4 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Est. Campaign Cost
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-emerald-600">
                  {fmtCurrency(campaignCost, settings.currencySymbol)}
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {fmtCurrency(
                  settings.marketingCostPerCustomer,
                  settings.currencySymbol,
                )}{" "}
                per customer
              </p>
            </Card>
          </>
        }
      >
        {/* ─── Filter Builder ─── */}
        <Card className="mb-6 px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Filters</h2>
            {filters.length > 0 && (
              <Badge tone="neutral">{filters.length} active</Badge>
            )}
          </div>

          {/* Filter list */}
          <div className="space-y-3">
            {filters.map((filter, index) => {
              const def = FILTER_DEFS[filter.type];
              const IconComp = FILTER_ICONS[filter.type];
              const FormComp = FILTER_FORMS[filter.type];

              return (
                <div
                  key={filter.id}
                  className="rounded-xl border border-slate-200 bg-white"
                >
                  {/* Filter header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-3">
                      {index > 0 && (
                        <button
                          onClick={() => toggleConnector(filter.id)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition ${
                            filter.connector === "AND"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {filter.connector}
                        </button>
                      )}
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-lg ${def.iconBg} ${def.iconColor}`}
                      >
                        <IconComp />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {def.label}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <CloseIcon />
                    </button>
                  </div>

                  {/* Filter form */}
                  <div className="p-4">
                    <FormComp
                      config={filter.config}
                      onChange={(c) => updateFilterConfig(filter.id, c)}
                      options={options}
                      settings={settings}
                      selectedClientId={selectedClientId}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add filter button */}
          <div className="relative mt-4">
            <button
              onClick={() => setShowFilterPicker(true)}
              className="flex items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-4 py-3 text-sm font-medium text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
            >
              <PlusCircleIcon />
              Add Filter
            </button>
          </div>

          {/* Empty state */}
          {filters.length === 0 && (
            <div className="mt-6 rounded-lg bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm text-slate-500">
                No filters added yet. Click "Add Filter" to start building your
                segment.
              </p>
            </div>
          )}
        </Card>
      </AppShell>

      {/* Filter picker dropdown */}
      {showFilterPicker && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10"
            onClick={() => setShowFilterPicker(false)}
          />
          <div className="floating-picker">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pilih Tipe Filter
              </p>
              <div className="space-y-1">
                {(Object.keys(FILTER_DEFS) as FilterType[]).map((type) => {
                  const def = FILTER_DEFS[type];
                  const IconComp = FILTER_ICONS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => addFilter(type)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
                    >
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${def.iconBg} ${def.iconColor}`}
                      >
                        <IconComp />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {def.label}
                        </p>
                        <p className="text-xs text-slate-400">
                          {def.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── All Users Modal ─── */}
      <Modal
        isOpen={showAllUsersModal}
        onClose={() => setShowAllUsersModal(false)}
        title={`All ${matchingCount.toLocaleString("id-ID")} Matching Users`}
        size="xl"
      >
        {preview && preview.customers.length > 0 ? (
          <div className="space-y-4">
            {/* Customer Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Customer Name</th>
                    <th className="px-4 py-3 text-left">Phone Number</th>
                    <th className="px-4 py-3 text-center">Last Purchase</th>
                    <th className="px-4 py-3 text-center">Order Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.customers.map((customer, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {customer.customerName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {customer.phoneNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {customer.lastPurchase
                          ? (() => {
                              const diff =
                                new Date().getTime() -
                                new Date(customer.lastPurchase).getTime();
                              const days = Math.floor(
                                diff / (1000 * 60 * 60 * 24),
                              );
                              if (days === 0) return "Today";
                              if (days === 1) return "Yesterday";
                              if (days < 7) return `${days}d ago`;
                              if (days < 30)
                                return `${Math.floor(days / 7)}w ago`;
                              if (days < 365)
                                return `${Math.floor(days / 30)}mo ago`;
                              return `${Math.floor(days / 365)}y ago`;
                            })()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            customer.status === "SYNC"
                              ? "bg-green-100 text-green-700"
                              : customer.status === "NOT_SYNC"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {customer.status === "SYNC"
                            ? "Synced"
                            : customer.status === "NOT_SYNC"
                              ? "Not Synced"
                              : "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination info */}
            {preview.totalCount &&
              preview.totalCount > preview.customers.length && (
                <div className="text-center text-sm text-slate-500">
                  Showing {preview.customers.length} of{" "}
                  {preview.totalCount.toLocaleString("id-ID")} users
                </div>
              )}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500">
            No customers to display
          </div>
        )}
      </Modal>
    </>
  );
}
