"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Modal } from "@/components/ui/Modal";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useSettings,
  useFilterOptions,
  useSegmentPreview,
  useEverproStats,
} from "@/hooks";
import type { FilterOptions as FilterOptionsType } from "@/hooks/useFilterOptions";
import { useUpdateSegment } from "@/hooks/useSegments";
import type { CustomerPreview } from "@/hooks/useSegmentPreview";


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

type AppSettingsData = {
  currency: string;
  currencySymbol: string;
  marketingCostPerCustomer: number;
};

type FilterOptions = {
  brands: string[];
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}
function TransactionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  );
}
function TimeframeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function DemographicsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function EngagementCustomerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function EngagementManagementIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function PlusCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
function LightningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
  filters?: FilterModule[]; // Optional filters array to check for brand existence
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

function TransactionFilterForm({ config, onChange, options, settings, filters }: FilterFormProps) {
  // Check if brand filter exists
  const brandFilter = filters?.find(f => f.type === "brand");
  const hasBrandFilter = brandFilter && (brandFilter.config.brands as string[])?.length > 0;
  
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {!hasBrandFilter && (
        <div className="sm:col-span-2 rounded-lg bg-amber-50 border border-amber-200 p-3 mb-2">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-amber-800">
              <strong>Brand filter diperlukan.</strong> Tambahkan filter Brand terlebih dahulu untuk memfilter produk berdasarkan brand.
            </div>
          </div>
        </div>
      )}
      <div className="sm:col-span-2">
        <label className="filter-label">SKU (Produk)</label>
        <MultiSelect
          options={options.skus}
          selected={(config.skus as string[]) || []}
          onChange={(v) => onChange({ ...config, skus: v.length > 0 ? v : undefined })}
          placeholder="Pilih SKU produk..."
          allowCustom
        />
        <p className="text-xs text-slate-500 mt-1">
          Item summary dihitung berdasarkan jumlah SKU berbeda
        </p>
      </div>
      <div>
        <label className="filter-label">Min Qty</label>
        <input
          type="number"
          min={0}
          value={(config.minQty as string) || ""}
          onChange={(e) => onChange({ ...config, minQty: e.target.value || undefined })}
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
          onChange={(e) => onChange({ ...config, maxQty: e.target.value || undefined })}
          placeholder="∞"
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Min Amount ({settings.currencySymbol})</label>
        <input
          type="number"
          min={0}
          value={(config.minAmount as string) || ""}
          onChange={(e) => onChange({ ...config, minAmount: e.target.value || undefined })}
          placeholder={`${settings.currencySymbol} 0`}
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Max Amount ({settings.currencySymbol})</label>
        <input
          type="number"
          min={0}
          value={(config.maxAmount as string) || ""}
          onChange={(e) => onChange({ ...config, maxAmount: e.target.value || undefined })}
          placeholder="∞"
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Jenis Transaksi</label>
        <select
          value={(config.transactionType as string) || ""}
          onChange={(e) => onChange({ ...config, transactionType: e.target.value || undefined })}
          className="filter-input"
        >
          <option value="">Semua</option>
          {options.transactionTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="filter-label">Ekspedisi</label>
        <MultiSelect
          options={options.expeditions}
          selected={(config.expeditions as string[]) || []}
          onChange={(v) => onChange({ ...config, expeditions: v.length > 0 ? v : undefined })}
          placeholder="Pilih ekspedisi..."
          allowCustom
        />
      </div>
    </div>
  );
}

function TimeframeFilterForm({ config, onChange }: FilterFormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="filter-label">Tanggal Input (dari)</label>
        <input
          type="date"
          value={(config.inputDateStart as string) || ""}
          onChange={(e) => onChange({ ...config, inputDateStart: e.target.value || undefined })}
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Tanggal Input (sampai)</label>
        <input
          type="date"
          value={(config.inputDateEnd as string) || ""}
          onChange={(e) => onChange({ ...config, inputDateEnd: e.target.value || undefined })}
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Tanggal Pengiriman (dari)</label>
        <input
          type="date"
          value={(config.shippingDateStart as string) || ""}
          onChange={(e) => onChange({ ...config, shippingDateStart: e.target.value || undefined })}
          className="filter-input"
        />
      </div>
      <div>
        <label className="filter-label">Tanggal Pengiriman (sampai)</label>
        <input
          type="date"
          value={(config.shippingDateEnd as string) || ""}
          onChange={(e) => onChange({ ...config, shippingDateEnd: e.target.value || undefined })}
          className="filter-input"
        />
      </div>
    </div>
  );
}

function DemographicsFilterForm({ config, onChange, options }: FilterFormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="filter-label">Provinsi</label>
        <MultiSelect
          options={options.provinces}
          selected={(config.provinces as string[]) || []}
          onChange={(v) => onChange({ ...config, provinces: v.length > 0 ? v : undefined })}
          placeholder="Pilih provinsi..."
        />
      </div>
      <div className="sm:col-span-2">
        <label className="filter-label">Kota / Kabupaten</label>
        <MultiSelect
          options={options.cities}
          selected={(config.cities as string[]) || []}
          onChange={(v) => onChange({ ...config, cities: v.length > 0 ? v : undefined })}
          placeholder="Pilih kota..."
          allowCustom
        />
      </div>
      <div className="sm:col-span-2">
        <label className="filter-label">Kecamatan</label>
        <MultiSelect
          options={options.districts}
          selected={(config.districts as string[]) || []}
          onChange={(v) => onChange({ ...config, districts: v.length > 0 ? v : undefined })}
          placeholder="Pilih kecamatan..."
          allowCustom
        />
      </div>
    </div>
  );
}

function EngagementCustomerFilterForm({ config, onChange, options }: FilterFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="filter-label">Jenis Customer</label>
        <MultiSelect
          options={options.customerTypes}
          selected={(config.customerTypes as string[]) || []}
          onChange={(v) => onChange({ ...config, customerTypes: v.length > 0 ? v : undefined })}
          placeholder="Pilih jenis customer..."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="filter-label">Min Order Frequency</label>
          <input
            type="number"
            min={0}
            value={(config.minOrderFrequency as string) || ""}
            onChange={(e) => onChange({ ...config, minOrderFrequency: e.target.value || undefined })}
            placeholder="0"
            className="filter-input"
          />
        </div>
        <div>
          <label className="filter-label">Max Order Frequency</label>
          <input
            type="number"
            min={0}
            value={(config.maxOrderFrequency as string) || ""}
            onChange={(e) => onChange({ ...config, maxOrderFrequency: e.target.value || undefined })}
            placeholder="∞"
            className="filter-input"
          />
        </div>
      </div>
    </div>
  );
}

function EngagementManagementFilterForm({ config, onChange, options, filters }: FilterFormProps) {
  // Check if brand filter exists
  const brandFilter = filters?.find(f => f.type === "brand");
  const hasBrandFilter = brandFilter && (brandFilter.config.brands as string[])?.length > 0;
  
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {!hasBrandFilter && (
        <div className="sm:col-span-2 rounded-lg bg-amber-50 border border-amber-200 p-3 mb-2">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-amber-800">
              <strong>Brand filter diperlukan.</strong> Tambahkan filter Brand terlebih dahulu untuk menampilkan CS dan Sumber Leads berdasarkan brand.
            </div>
          </div>
        </div>
      )}
      <div className="sm:col-span-2">
        <label className="filter-label">Nama CS</label>
        <MultiSelect
          options={options.csNames}
          selected={(config.csNames as string[]) || []}
          onChange={(v) => onChange({ ...config, csNames: v.length > 0 ? v : undefined })}
          placeholder="Pilih nama CS..."
          allowCustom
        />
      </div>
      <div className="sm:col-span-2">
        <label className="filter-label">Sumber Leads</label>
        <MultiSelect
          options={options.leadSources}
          selected={(config.leadSources as string[]) || []}
          onChange={(v) => onChange({ ...config, leadSources: v.length > 0 ? v : undefined })}
          placeholder="Pilih sumber leads..."
          allowCustom
        />
      </div>
    </div>
  );
}

function EngagementStatusFilterForm({ config, onChange }: FilterFormProps) {
  const { stats, isLoading: loading } = useEverproStats();

  // Transform stats to match component state (for backwards compatibility)
  const syncStats = stats
    ? {
        hasData: stats.hasData,
        lastSyncDisplay: stats.lastSyncDisplay,
        totalContacts: stats.totalContacts,
        contactedCount: stats.contactedCount,
        notContactedCount: stats.notContactedCount,
      }
    : null;

  return (
    <div className="space-y-4">
      <div>
        <label className="filter-label">Integration Status</label>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">Everpro Active</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? "Loading..." : `Last sync: ${syncStats?.lastSyncDisplay || "Never"}`}
            </p>
            {!loading && syncStats && syncStats.hasData && (
              <p className="text-xs text-slate-500 mt-1">
                {syncStats.totalContacts.toLocaleString()} contacts ({syncStats.notContactedCount.toLocaleString()} not contacted)
              </p>
            )}
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            !loading && syncStats?.hasData
              ? "bg-green-50 text-green-700"
              : "bg-gray-50 text-gray-500"
          }`}>
            {loading ? "..." : syncStats?.hasData ? "Connected" : "No Data"}
          </span>
        </div>
        {!loading && syncStats && !syncStats.hasData && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>No Everpro data uploaded yet. Upload data from Everpro Sync page.</span>
          </div>
        )}

        {/* Customer Activity Stats */}
        {!loading && syncStats && syncStats.hasData && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-green-50 px-3 py-2">
              <p className="text-xs font-medium text-green-600">Contacted</p>
              <p className="text-lg font-bold text-green-700 mt-0.5">
                {syncStats.contactedCount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 px-3 py-2">
              <p className="text-xs font-medium text-amber-600">Not Contacted</p>
              <p className="text-lg font-bold text-amber-700 mt-0.5">
                {syncStats.notContactedCount.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="filter-label flex items-center gap-2">
          <input
            type="checkbox"
            checked={(config.showOnlyNotContacted as boolean) || false}
            onChange={(e) => onChange({ ...config, showOnlyNotContacted: e.target.checked || undefined })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span>Show Only Not Contacted Customers</span>
        </label>
        <p className="text-xs text-slate-500 mt-1 ml-6">
          Filter to show only customers who haven&apos;t been contacted via Everpro
        </p>
      </div>

      <div>
        <label className="filter-label">Last Contact Date Range</label>
        <p className="text-xs text-slate-500 mb-2">
          Filter customers based on when they were last contacted
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">From Date</label>
            <input
              type="date"
              value={(config.lastContactDateStart as string) || ""}
              onChange={(e) => onChange({ ...config, lastContactDateStart: e.target.value || undefined })}
              className="filter-input"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">To Date</label>
            <input
              type="date"
              value={(config.lastContactDateEnd as string) || ""}
              onChange={(e) => onChange({ ...config, lastContactDateEnd: e.target.value || undefined })}
              className="filter-input"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
        {(config.lastContactDateStart && config.lastContactDateEnd) ? (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>
              Filtering contacts from{" "}
              {new Date(String(config.lastContactDateStart)).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              to{" "}
              {new Date(String(config.lastContactDateEnd)).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        ) : null}
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

  // Using custom hooks for data fetching
  const { settings: appSettings } = useSettings();
  
  // Local filter state (must be before useFilterOptions to get selected brands)
  const [filters, setFilters] = useState<FilterModule[]>([]);
  
  // Extract selected brands from filters to filter options
  const selectedBrands = useMemo(() => {
    const brandFilter = filters.find(f => f.type === "brand");
    return (brandFilter?.config.brands as string[]) || [];
  }, [filters]);
  
  const { options: filterOptions } = useFilterOptions(selectedBrands);
  const { updateSegment, isUpdating } = useUpdateSegment();
  const { preview, isLoading: previewLoading, fetchPreview } = useSegmentPreview();

  const [segmentName, setSegmentName] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingSegment, setIsLoadingSegment] = useState(true);

  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [showAllUsersModal, setShowAllUsersModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // App settings with defaults
  const settings = appSettings || {
    currency: "IDR",
    currencySymbol: "Rp",
    marketingCostPerCustomer: 610,
  };

  // Filter options with defaults
  const options: FilterOptionsType = filterOptions || {
    brands: [],
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

  // Load existing segment data
  useEffect(() => {
    const loadSegment = async () => {
      if (!segmentId) return;
      
      try {
        const res = await fetch(`/api/segments/${segmentId}`);
        if (!res.ok) throw new Error("Failed to load segment");
        const segment = await res.json();
        
        setSegmentName(segment.name || "");
        setFilters(segment.filters || []);
        setIsLoadingSegment(false);
      } catch (error) {
        console.error("Error loading segment:", error);
        alert("Failed to load segment");
        router.push("/");
      }
    };

    loadSegment();
  }, [segmentId, router]);

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
    [fetchPreview]
  );

  useEffect(() => {
    if (!isLoadingSegment && filters.length > 0) {
      runPreview(filters);
    }
  }, [filters, isLoadingSegment, runPreview]);

  // ─── Filter actions ─────────────────────────────────────

  const addFilter = (type: FilterType) => {
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

  // ─── Export Preview CSV (Full Export) ─────────────────────────────────

  const handleExportPreview = async () => {
    if (filters.length === 0) {
      alert("No filters applied. Please add filters first.");
      return;
    }

    if (!segmentName.trim()) {
      alert("Please enter a segment name before exporting.");
      return;
    }

    setIsExporting(true);
    
    try {
      console.log(`Starting full export for segment: ${segmentName}`);
      
      // Call API to export ALL matching data (not just preview)
      const response = await fetch("/api/segments/export-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters,
          segmentName,
          settings: {
            currencySymbol: settings.currencySymbol,
            marketingCostPerCustomer: settings.marketingCostPerCustomer,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      // Get the CSV content
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${segmentName.replace(/[^a-z0-9]/gi, '_')}_full_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`Export completed successfully`);
    } catch (error) {
      console.error("Export error:", error);
      alert(`Failed to export CSV: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Save ───────────────────────────────────────────────

  const handleSave = async () => {
    if (!segmentName.trim()) {
      setEditingTitle(true);
      return;
    }

    const result = await updateSegment(segmentId, {
      name: segmentName,
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

  if (isLoadingSegment) {
    return (
      <AppShell active="Campaigns" header={<div>Loading segment...</div>}>
        <div className="flex items-center justify-center py-24">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
      </AppShell>
    );
  }

  // ─── Render ─────────────────────────────────────────────

  return (
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
                      setSegmentName("New Segment");
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
                  {segmentName}
                </h1>
                <button
                  onClick={() => setEditingTitle(true)}
                  className="mt-2 rounded-full p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-500"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  Updating...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <p className="text-sm font-medium text-slate-500">Matching Users</p>
              
              {preview?._meta && !preview._meta.accurate && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  style={{ width: `${Math.min(preview?.percentage || 0, 100)}%` }}
                />
              </div>
              <p className="mt-3 text-xs font-medium text-slate-400">
                Top {preview?.percentage || 0}% of your customer base
              </p>
            </div>

            {/* Customer mini-table */}
            {preview && preview.customers.length > 0 && (
              <div className="mt-8 border-t border-slate-100 pt-5">
                {/* Engagement Summary */}
                {preview._meta?.everproEnriched && (
                  <div className="mb-4 space-y-1">
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span>
                          Preview: Showing <strong>{preview.customers.length}</strong> of <strong>{matchingCount.toLocaleString("id-ID")}</strong> total users
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 text-amber-700">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span className="font-medium">
                          {preview.customers.filter((c: CustomerPreview) => c.engagementStatus === "not_contacted").length} out of {preview.customers.length} shown need follow-up
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-3 px-1">
                  <span className="flex-[2]">Name</span>
                  <span className="flex-1 text-center">Last Pur.</span>
                  <span className="flex-1 text-center">Last Contact</span>
                </div>
                <div className="space-y-4 text-xs font-medium">
                  {preview.customers.slice(0, 7).map((c: CustomerPreview, i: number) => {
                    // Calculate engagement status indicator color (using stable date)
                    const now = new Date();
                    let engagementColor = "bg-gray-300"; // default: never contacted
                    if (c.lastContact) {
                      const weeksSince = (now.getTime() - new Date(c.lastContact).getTime()) / (1000 * 60 * 60 * 24 * 7);
                      if (weeksSince < 4) engagementColor = "bg-green-500"; // recent
                      else if (weeksSince < 8) engagementColor = "bg-yellow-500"; // stale
                      else engagementColor = "bg-red-500"; // needs attention
                    }

                    return (
                      <div key={i} className="flex items-center justify-between px-1 hover:bg-slate-50 py-1 rounded-lg transition-colors cursor-default">
                        <span className="text-slate-800 truncate flex-[2]">
                          {c.customerName || "—"}
                        </span>
                        <span className="text-slate-500 flex-1 text-center font-normal">
                          {c.lastPurchase ? (() => {
                            const diff = new Date().getTime() - new Date(c.lastPurchase).getTime();
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            if (days === 0) return "Today";
                            if (days < 7) return `${days}d ago`;
                            return `${Math.floor(days / 7)}w ago`;
                          })() : "—"}
                        </span>
                        <span className="text-slate-500 flex-1 text-center font-normal">
                          {c.lastContact ? (() => {
                            const diff = new Date().getTime() - new Date(c.lastContact).getTime();
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            if (days === 0) return "Today";
                            if (days < 7) return `${days}d ago`;
                            return `${Math.floor(days / 7)}w ago`;
                          })() : (
                            <span className="text-slate-400">Never</span>
                          )}
                        </span>
                        {preview._meta?.everproEnriched && (
                          <span className="w-8 flex justify-end items-center gap-1">
                            <div
                              className={`h-2 w-2 rounded-full ${engagementColor}`}
                              title={c.engagementStatus === "contacted" ? "Contacted" : "Not Contacted"}
                            />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-bold uppercase tracking-widest text-slate-600 py-3 rounded-xl border-slate-200"
                    onClick={() => setShowAllUsersModal(true)}
                  >
                    View All {matchingCount.toLocaleString("id-ID")} Users
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full text-xs font-bold uppercase tracking-widest text-blue-600 py-3 rounded-xl border-blue-200 hover:bg-blue-50"
                    onClick={handleExportPreview}
                    disabled={isExporting || filters.length === 0}
                  >
                    {isExporting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2" />
                        Exporting All Data...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export All to Excel
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* ─── Campaign Cost ─── */}
          <Card className="px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Est. Campaign Cost
              </p>
              <Badge>via WhatsApp</Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold">
              {fmtCurrency(campaignCost, settings.currencySymbol)}
            </p>

            {/* Cost calculation with tooltip */}
            <span className="info-tooltip mt-1 inline-flex items-center gap-1.5 text-xs text-slate-400">
              <span>
                {matchingCount.toLocaleString("id-ID")} customers × {settings.currencySymbol}{" "}
                {settings.marketingCostPerCustomer.toLocaleString("id-ID")} / customer
              </span>
              <InfoIcon />
              <span className="info-tooltip-content">
                Angka pengkalian dan kurs didapat dari menu Settings
              </span>
            </span>
          </Card>
        </>
      }
    >
      {/* ─── Filter Canvas ─── */}
      <div className="space-y-4 pb-24">
        {/* Starting capsule */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            Filter Builder
          </div>
        </div>

        {/* Filter modules */}
        {filters.map((filter, index) => {
          const def = FILTER_DEFS[filter.type];
          const IconComp = FILTER_ICONS[filter.type];
          const FormComp = FILTER_FORMS[filter.type];

          return (
            <div key={filter.id}>
              {/* AND/OR connector */}
              {index > 0 && (
                <div className="flex justify-center mb-4">
                  <span className="tooltip-wrapper">
                    <button
                      onClick={() => toggleConnector(filter.id)}
                      className={`connector-badge ${filter.connector === "AND"
                          ? "connector-badge--and"
                          : "connector-badge--or"
                        }`}
                    >
                      {filter.connector}
                    </button>
                    <span className="tooltip-label">Klik untuk toggle AND/OR</span>
                  </span>
                </div>
              )}

              {/* Filter card */}
              <Card className="px-6 py-5 transition-shadow hover:shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-10 w-10 place-items-center rounded-2xl ${def.iconBg} ${def.iconColor}`}>
                      <IconComp />
                    </div>
                    <div>
                      <p className="text-base font-semibold">{def.label}</p>
                      <p className="text-xs text-slate-400">{def.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Hapus filter"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                  <FormComp
                    config={filter.config}
                    onChange={(c) => updateFilterConfig(filter.id, c)}
                    options={options}
                    settings={settings}
                    filters={filters}
                  />
                </div>
              </Card>
            </div>
          );
        })}

        {/* Pagination Controls */}
        {/* {filters.length > 0 && preview && (
          <Card className="px-6 py-5 bg-slate-50/50">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Records per page
                  </label>
                  <select
                    value={pageLimit}
                    onChange={(e) => {
                      setPageLimit(Number(e.target.value));
                      setCurrentPage(1); // reset to page 1
                    }}
                    className="filter-input w-32"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={250}>250</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Page
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      ‹
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                        setCurrentPage(page);
                      }}
                      className="filter-input w-20 text-center"
                    />
                    <span className="text-sm text-slate-400">/ {totalPages.toLocaleString("id-ID")}</span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1 text-right">
                <p className="text-xs font-medium text-slate-500">
                  Total: <span className="font-semibold text-slate-700">
                    {preview.totalCount.toLocaleString("id-ID")} records
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  Matching: {preview.matchingCount.toLocaleString("id-ID")} ({preview.percentage}%)
                </p>
                <p className="text-xs text-slate-400">
                  Total pages: {totalPages.toLocaleString("id-ID")} @ {pageLimit} per page
                </p>
                {preview._meta && (
                  <p className="text-xs text-slate-400">
                    Method: <span className={`font-semibold ${preview._meta.accurate ? 'text-green-600' : 'text-amber-600'}`}>
                      {preview._meta.method === 'direct_metadata' ? 'FAST' : 'SAMPLING'}
                    </span>
                    {preview._meta.accurate ? ' ✓' : ' ≈'}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )} */}

        {/* Empty state */}
        {filters.length === 0 && (
          <Card className="border-dashed px-6 py-16">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-500">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-700">
                  Mulai buat Segment baru
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Tambahkan filter untuk mendefinisikan audiens target Anda.
                </p>
              </div>
              <button
                onClick={() => setShowFilterPicker(true)}
                className="floating-add-btn"
              >
                <PlusCircleIcon />
                Add Filter
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* ─── Floating Add Filter Button ─── */}
      {filters.length > 0 && (
        <div className="floating-add-filter">
          <button
            onClick={() => setShowFilterPicker(!showFilterPicker)}
            className="floating-add-btn"
          >
            <PlusCircleIcon />
            Add Filter
          </button>
        </div>
      )}

      {/* ─── Floating Filter Picker ─── */}
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
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${def.iconBg} ${def.iconColor}`}>
                        <IconComp />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{def.label}</p>
                        <p className="text-xs text-slate-400">{def.description}</p>
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
            {/* Stats Summary */}
            {preview._meta?.everproEnriched && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-green-50 px-4 py-3">
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wider">Contacted</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {preview.customers.filter((c: CustomerPreview) => c.engagementStatus === "contacted").length}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 px-4 py-3">
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Need Follow-up</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">
                    {preview.customers.filter((c: CustomerPreview) => c.engagementStatus === "not_contacted").length}
                  </p>
                </div>
              </div>
            )}

            {/* Note about sample */}
            {preview.customers.length < matchingCount && (
              <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <div className="flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>
                    <strong>Preview Mode:</strong> Showing sample of <strong>{preview.customers.length}</strong> out of <strong>{matchingCount.toLocaleString("id-ID")}</strong> matching customers. 
                    <br/>
                    Click <strong>&quot;Export All Excel&quot;</strong> below to download all {matchingCount.toLocaleString("id-ID")} customers.
                  </span>
                </div>
              </div>
            )}

            {/* Customer Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Customer Name</th>
                    <th className="px-4 py-3 text-left">Phone Number</th>
                    <th className="px-4 py-3 text-center">Last Purchase</th>
                    <th className="px-4 py-3 text-center">Last Contact</th>
                    <th className="px-4 py-3 text-center">Order Status</th>
                    {preview._meta?.everproEnriched && (
                      <th className="px-4 py-3 text-center">Engagement</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.customers.map((customer: CustomerPreview, index: number) => {
                    // Calculate engagement status indicator color
                    const now = new Date();
                    let engagementColor = "bg-gray-300";
                    let engagementLabel = "Never Contacted";
                    if (customer.lastContact) {
                      const weeksSince = (now.getTime() - new Date(customer.lastContact).getTime()) / (1000 * 60 * 60 * 24 * 7);
                      if (weeksSince < 4) {
                        engagementColor = "bg-green-500";
                        engagementLabel = "Recent";
                      } else if (weeksSince < 8) {
                        engagementColor = "bg-yellow-500";
                        engagementLabel = "Stale";
                      } else {
                        engagementColor = "bg-red-500";
                        engagementLabel = "Needs Attention";
                      }
                    }

                    const formatTimeAgo = (dateStr: string) => {
                      const diff = new Date().getTime() - new Date(dateStr).getTime();
                      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                      if (days === 0) return "Today";
                      if (days === 1) return "Yesterday";
                      if (days < 7) return `${days}d ago`;
                      if (days < 30) return `${Math.floor(days / 7)}w ago`;
                      if (days < 365) return `${Math.floor(days / 30)}mo ago`;
                      return `${Math.floor(days / 365)}y ago`;
                    };

                    const formatFullDate = (dateStr: string) => {
                      return new Date(dateStr).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                    };

                    return (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 font-medium">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {customer.customerName || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                          {customer.phoneNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600" title={customer.lastPurchase ? formatFullDate(customer.lastPurchase) : undefined}>
                          {customer.lastPurchase ? formatTimeAgo(customer.lastPurchase) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600" title={customer.lastContact ? formatFullDate(customer.lastContact) : undefined}>
                          {customer.lastContact ? formatTimeAgo(customer.lastContact) : (
                            <span className="text-slate-400">Never</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            customer.status === "process" 
                              ? "bg-blue-50 text-blue-700"
                              : customer.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {customer.status || "unknown"}
                          </span>
                        </td>
                        {preview._meta?.everproEnriched && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div
                                className={`h-2.5 w-2.5 rounded-full ${engagementColor}`}
                                title={engagementLabel}
                              />
                              <span className="text-xs text-slate-500">{engagementLabel}</span>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Export actions */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">
                Export all {matchingCount.toLocaleString("id-ID")} matching customers to Excel
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPreview}
                disabled={isExporting || filters.length === 0}
                className="text-xs"
              >
                {isExporting ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-600 border-t-transparent mr-1.5" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export All Excel
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            <p>No customers found matching the current filters.</p>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
