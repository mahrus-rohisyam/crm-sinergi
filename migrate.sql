-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "appName" TEXT NOT NULL DEFAULT 'CRM Suite',
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "currencySymbol" TEXT NOT NULL DEFAULT 'Rp',
    "marketingCostPerCustomer" DOUBLE PRECISION NOT NULL DEFAULT 610,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EverproContact" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "blastStatus" TEXT NOT NULL DEFAULT 'Belum',
    "lastBlastDate" TIMESTAMP(3),
    "csName" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EverproContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpackTransaction" (
    "id" TEXT NOT NULL,
    "wmsId" INTEGER,
    "orderNumber" TEXT NOT NULL,
    "orderId" INTEGER,
    "customerId" INTEGER,
    "customerName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerType" TEXT,
    "brand" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productName" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "codFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountShipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transactionType" TEXT,
    "paymentStatus" TEXT,
    "packageType" TEXT,
    "destinationBank" TEXT,
    "isCod" BOOLEAN NOT NULL DEFAULT false,
    "expedition" TEXT,
    "courierLabel" TEXT,
    "awb" TEXT,
    "csName" TEXT,
    "csId" INTEGER,
    "leadSource" TEXT,
    "leadSourceId" INTEGER,
    "warehouseId" INTEGER,
    "note" TEXT,
    "fullAddress" TEXT,
    "kelurahan" TEXT,
    "kecamatan" TEXT,
    "city" TEXT,
    "province" TEXT,
    "status" TEXT,
    "statusFulfill" TEXT,
    "statusExternal" TEXT,
    "inputDate" TIMESTAMP(3),
    "shippingDate" TIMESTAMP(3),
    "orderAt" TIMESTAMP(3),
    "leadsAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerpackTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EverproContact_phoneNumber_key" ON "EverproContact"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PerpackTransaction_wmsId_key" ON "PerpackTransaction"("wmsId");

-- CreateIndex
CREATE UNIQUE INDEX "PerpackTransaction_orderNumber_key" ON "PerpackTransaction"("orderNumber");

-- CreateIndex
CREATE INDEX "PerpackTransaction_phoneNumber_idx" ON "PerpackTransaction"("phoneNumber");

-- CreateIndex
CREATE INDEX "PerpackTransaction_brand_idx" ON "PerpackTransaction"("brand");

-- CreateIndex
CREATE INDEX "PerpackTransaction_status_idx" ON "PerpackTransaction"("status");

-- CreateIndex
CREATE INDEX "PerpackTransaction_orderAt_idx" ON "PerpackTransaction"("orderAt");

-- CreateIndex
CREATE INDEX "PerpackTransaction_customerType_idx" ON "PerpackTransaction"("customerType");

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

