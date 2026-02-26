# Changelog

All notable changes to the CRM Suite project will be documented in this file.

## [1.1.0] - 2026-02-26

### Added
- **Segment Builder 2.0**:
    - Inline editable segment title with auto-focus.
    - **MultiSelect Component**: Custom searchable dropdown with tag chips for Brand, SKUs, Provinces, CS Names, etc.
    - **Floating Action Button**: "Add Filter" button is now fixed at the bottom for better accessibility.
    - **Visual AND/OR Logic**: Improved connector badges with tooltips.
    - **Live Audience Sidebar**: Redesigned summary with progress bars, status indicators, and relative time formatting (e.g., "2d ago").
    - **Campaign Cost Transparency**: Added tooltips explaining that cost calculations come from Global Settings.
- **WMS Integration**:
    - New API route `/api/wms/sync` to pull real-time order data from Perpack.
    - Extended database schema (`PerpackTransaction`) to support 20+ new fields (wmsId, ads, fulfillment status, etc.).
    - Dynamic filter options populated from live database values.
- **Documentation**:
    - `API needs.txt`: Targeted feedback for the Perpack team to improve dynamic querying.

### Fixed
- **Next.js 15 Compatibility**: Wrapped Login page in a Suspense boundary for `useSearchParams`.
- **TypeScript Errors**:
    - Resolved casting issues in `auth.ts` callbacks.
    - Fixed generic record types in `CsvImport.tsx`.
    - Removed duplicate state/ref declarations in the Segment page.
- **Project Structure**: Cleaned up stale directories (`src/app/segment-builder`) to prevent build conflicts.

### Visual Improvements
- Added custom styling for date/number inputs to ensure consistency across browsers.
- Implemented "Glassmorphism" tendencies in the sidebar summary.
- Integrated HSL-based color system for status indicators.
