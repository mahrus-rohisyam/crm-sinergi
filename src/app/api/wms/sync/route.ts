import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { startDate, endDate, status } = await req.json();
    
    const apiKey = process.env.WMS_API_KEY;
    const baseUrl = process.env.WMS_API_BASE_URL || "https://wms-api.sinergisuperapp.com";
    
    if (!apiKey) {
      return NextResponse.json({ error: "WMS_API_KEY not configured" }, { status: 500 });
    }

    const url = new URL(`${baseUrl}/v1/open/social-commerce/orders`);
    url.searchParams.set("page", "1");
    url.searchParams.set("length", "100"); // Sync batch size
    if (startDate) url.searchParams.set("start_date", startDate);
    if (status) url.searchParams.set("status", status);

    const response = await fetch(url.toString(), {
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `WMS API error: ${errorText}` }, { status: response.status });
    }

    const json = await response.json();
    const orders = json.data || [];

    let updatedCount = 0;

    for (const order of orders) {
      // Map WMS order to Prisma model
      await prisma.perpackTransaction.upsert({
        where: { orderNumber: order.reference_no },
        update: {
          wmsId: order.id,
          orderId: order.order_id,
          customerId: order.customer_id,
          customerName: order.customer_name,
          phoneNumber: order.customer_phone,
          customerEmail: order.customer_email || null,
          customerType: order.customer_type,
          brand: order.client_name,
          sku: order.product_summary,
          quantity: order.qty || 1,
          totalPrice: order.amount || 0,
          discount: order.discount_amount || 0,
          shippingCost: order.shipping_fee || 0,
          codFee: order.cod_fee || 0,
          discountShipping: order.discount_shipping_fee || 0,
          otherAmount: order.other_amount || 0,
          transactionType: order.payment_method,
          paymentStatus: order.payment_status,
          isCod: !!order.is_cod,
          expedition: order.courier,
          courierLabel: order.courier_label,
          awb: order.awb,
          csName: order.customer_service,
          csId: order.customer_service_id,
          leadSource: order.ads_platform_name,
          leadSourceId: order.ads_platform_id,
          warehouseId: order.warehouse_id,
          note: order.note,
          fullAddress: order.customer_address,
          kelurahan: order.customer_sub_district,
          kecamatan: order.customer_district,
          city: order.customer_city,
          province: order.customer_province,
          status: order.status,
          statusFulfill: order.status_fulfillment,
          statusExternal: order.status_external,
          inputDate: order.created_at ? new Date(order.created_at) : null,
          orderAt: order.order_at ? new Date(order.order_at) : null,
          leadsAt: order.leads_at ? new Date(order.leads_at) : null,
          syncedAt: new Date(),
        },
        create: {
          wmsId: order.id,
          orderNumber: order.reference_no,
          orderId: order.order_id,
          customerId: order.customer_id,
          customerName: order.customer_name,
          phoneNumber: order.customer_phone,
          customerEmail: order.customer_email || null,
          customerType: order.customer_type,
          brand: order.client_name,
          sku: order.product_summary,
          quantity: order.qty || 1,
          totalPrice: order.amount || 0,
          discount: order.discount_amount || 0,
          shippingCost: order.shipping_fee || 0,
          codFee: order.cod_fee || 0,
          discountShipping: order.discount_shipping_fee || 0,
          otherAmount: order.other_amount || 0,
          transactionType: order.payment_method,
          paymentStatus: order.payment_status,
          isCod: !!order.is_cod,
          expedition: order.courier,
          courierLabel: order.courier_label,
          awb: order.awb,
          csName: order.customer_service,
          csId: order.customer_service_id,
          leadSource: order.ads_platform_name,
          leadSourceId: order.ads_platform_id,
          warehouseId: order.warehouse_id,
          note: order.note,
          fullAddress: order.customer_address,
          kelurahan: order.customer_sub_district,
          kecamatan: order.customer_district,
          city: order.customer_city,
          province: order.customer_province,
          status: order.status,
          statusFulfill: order.status_fulfillment,
          statusExternal: order.status_external,
          inputDate: order.created_at ? new Date(order.created_at) : null,
          orderAt: order.order_at ? new Date(order.order_at) : null,
          leadsAt: order.leads_at ? new Date(order.leads_at) : null,
        },
      });
      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      totalCount: json.metadata?.count || orders.length,
    });
  } catch (error) {
    console.error("WMS Sync Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
