import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { readFile } from "fs/promises";
import path from "path";
import { fetchWMSOrders, getBrandClientId, type WMSOrder } from "@/lib/wms-api";
import {
  parseProductSummary,
  getReglowProductColumns,
  getAmuraProductColumns,
  formatDateIndonesian,
} from "@/lib/product-parser";

/**
 * GET /api/wms/orders/export
 * Export WMS orders to Excel using brand-specific templates
 * Query params:
 * - brand: "Amura" | "Reglow" (required)
 * - start_date: YYYY-MM-DD (optional)
 * - status: order status filter (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const brand = searchParams.get("brand");
    const startDate = searchParams.get("start_date");
    const status = searchParams.get("status");

    // Validate brand
    if (!brand) {
      return NextResponse.json(
        { error: "Brand parameter is required" },
        { status: 400 },
      );
    }

    const clientId = getBrandClientId(brand);
    if (!clientId) {
      return NextResponse.json(
        { error: `Invalid brand: ${brand}. Supported brands: Amura, Reglow, Purela` },
        { status: 400 },
      );
    }

    // Determine template file
    const templateFileName = `OrdersExport${brand}.xlsx`;
    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      templateFileName,
    );

    // Check if template exists
    let templateBuffer: Buffer;
    try {
      templateBuffer = await readFile(templatePath);
    } catch {
      return NextResponse.json(
        { error: `Template not found: ${templateFileName}` },
        { status: 404 },
      );
    }

    // Fetch all orders for this brand from WMS API
    const allOrders: WMSOrder[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    console.log(`Fetching orders for brand ${brand} (client_id: ${clientId})`);

    while (hasMorePages) {
      const response = await fetchWMSOrders({
        client_id: clientId,
        start_date: startDate || undefined,
        status: status || undefined,
        page: currentPage,
        length: 100, // Max per page
      });

      allOrders.push(...response.data);

      console.log(
        `Fetched page ${currentPage}/${response.metadata.total_page} (${response.data.length} orders)`,
      );

      hasMorePages = currentPage < response.metadata.total_page;
      currentPage++;
    }

    if (allOrders.length === 0) {
      return NextResponse.json(
        { error: "No orders found for the specified filters" },
        { status: 404 },
      );
    }

    console.log(`Total orders fetched: ${allOrders.length}`);

    // Load template workbook
    const workbook = XLSX.read(templateBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    // Convert orders to rows matching brand-specific template structure
    const rows = allOrders.map((order) => {
      // Parse product summary to get individual product quantities
      const productQuantities = parseProductSummary(order.product_summary);

      // Base row data (common for all brands)
      const baseRow = {
        "Nomor Order": order.reference_no,
        "Tanggal Input": formatDateIndonesian(order.created_at),
        "Tanggal Process": formatDateIndonesian(order.order_at),
        "Nama CS": order.customer_service,
        "Sumber Leads": order.ads_platform_name,
        "Jenis Cust": order.customer_type,
        "Jenis Paket": order.courier_label,
        "Nama Lengkap": order.customer_name,
        "No HP/Wa": order.customer_phone,
        "Alamat Lengkap": order.customer_address,
        "Kelurahan /Desa": order.customer_sub_district,
        "Kecamatan": order.customer_district,
        "Kota/Kab": order.customer_city,
        "Provinsi": order.customer_province,
      };

      // Add brand-specific product columns
      let brandProductColumns = {};
      
      if (brand === "Reglow") {
        const reglowColumns = getReglowProductColumns();
        brandProductColumns = reglowColumns.reduce((acc, col) => {
          acc[col] = productQuantities[col] || 0;
          return acc;
        }, {} as Record<string, number>);
      } else if (brand === "Amura") {
        const amuraColumns = getAmuraProductColumns();
        brandProductColumns = amuraColumns.reduce((acc, col) => {
          acc[col] = productQuantities[col] || 0;
          return acc;
        }, {} as Record<string, number>);
      }

      // Add financial and shipping columns
      const financialColumns = {
        "Jumlah Pcs": order.qty,
        "Harga Barang": order.amount,
        "Note": order.note || "",
        "Eksepedisi": order.courier,
        "Ongkir": order.shipping_fee || 0,
        "Type Transaksi": order.is_cod ? "COD" : "Transfer",
        "Payment Method": order.payment_method,
        "Disc Barang": order.discount_amount || 0,
        "Discount Ongkir": order.discount_shipping_fee || 0,
        "Cod Fee": order.cod_fee || 0,
        "Total Transaksi": 
          (order.amount || 0) + 
          (order.shipping_fee || 0) + 
          (order.cod_fee || 0) - 
          (order.discount_amount || 0) - 
          (order.discount_shipping_fee || 0),
        "Other Amount": order.other_amount || 0,
      };

      return {
        ...baseRow,
        ...brandProductColumns,
        ...financialColumns,
      };
    });

    // Create new worksheet with data
    const newWorksheet = XLSX.utils.json_to_sheet(rows);

    // Replace the sheet in the workbook
    workbook.Sheets[sheetName] = newWorksheet;

    // Write to buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `${brand}_Orders_Export_${timestamp}.xlsx`;

    // Return file as download
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json(
      {
        error: "Export failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
