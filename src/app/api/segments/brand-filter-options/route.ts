import { NextResponse } from "next/server";
import {
  fetchWMSProducts,
  fetchWMSCustomerServices,
  fetchWMSAdsPlatforms,
} from "@/lib/wms-api";

/**
 * GET /api/segments/brand-filter-options?client_id={CLIENT_ID}
 * Returns filter options specific to a brand (by client_id)
 * - SKUs: /v1/open/products/list?client_id={CLIENT_ID}&bundle=false&status=published
 * - CS Names: /v1/open/admin/customer-services?client_id={CLIENT_ID}
 * - Lead Sources: /v1/open/social-commerce/ads-platform?client_id={CLIENT_ID}
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get("client_id");

    if (!clientIdParam) {
      return NextResponse.json(
        { error: "client_id is required" },
        { status: 400 },
      );
    }

    const clientId = parseInt(clientIdParam, 10);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client_id" }, { status: 400 });
    }

    // Fetch brand-specific data in parallel
    const [products, customerServices, adsPlatforms] = await Promise.allSettled(
      [
        fetchWMSProducts({
          clientId,
          bundle: false,
          status: "published",
        }),
        fetchWMSCustomerServices(clientId),
        fetchWMSAdsPlatforms(clientId),
      ],
    );

    // Extract SKUs from products
    let skus: string[] = [];
    if (products.status === "fulfilled") {
      skus = Array.from(new Set(products.value.map((p) => p.sku)))
        .filter((sku) => sku && sku.trim() !== "")
        .sort((a, b) => a.localeCompare(b));
    } else {
      console.error("Failed to fetch products:", products.reason);
    }

    // Extract CS names from customer services
    let csNames: string[] = [];
    if (customerServices.status === "fulfilled") {
      csNames = customerServices.value
        .map((cs) => cs.name)
        .filter((name, index, arr) => arr.indexOf(name) === index) // Deduplicate
        .sort((a, b) => a.localeCompare(b, "id"));
    } else {
      console.error(
        "Failed to fetch customer services:",
        customerServices.reason,
      );
    }

    // Extract lead sources from ads platforms
    let leadSources: string[] = [];
    if (adsPlatforms.status === "fulfilled") {
      leadSources = adsPlatforms.value
        .map((ap) => ap.name)
        .filter((name, index, arr) => arr.indexOf(name) === index) // Deduplicate
        .sort((a, b) => a.localeCompare(b, "id"));
    } else {
      console.error("Failed to fetch ads platforms:", adsPlatforms.reason);
    }

    return NextResponse.json({
      skus,
      csNames,
      leadSources,
    });
  } catch (error) {
    console.error("Failed to fetch brand filter options:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand filter options" },
      { status: 500 },
    );
  }
}
