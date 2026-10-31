import prisma from '../../config/db';
import { CreateProductInput, UpdateProductInput, CreateVariantInput, UpdateVariantInput } from './products.types';
import { ProductStatus } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { Prisma } from '@prisma/client';

export class ProductsService {
  /**
   * Helper to format variant with effective calculated price
   * Example: product base price 1000 + variant surcharge 560 = 1560
   */
  private enrichProductWithEffectivePrices(product: any): any {
    if (!product) return product;

    const basePrice = Number(product.salesPrice || 0);

    if (product.variants && Array.isArray(product.variants)) {
      product.variants = product.variants.map((v: any) => {
        const adjustment = Number(v.priceAdjustment || 0);
        return {
          ...v,
          priceAdjustment: adjustment,
          effectivePrice: Number((basePrice + adjustment).toFixed(2)),
        };
      });
    }

    return product;
  }

  /**
   * Retrieve all products with optional filters
   */
  async getAllProducts(params?: {
    search?: string;
    brand?: string;
    category?: string;
    status?: ProductStatus;
    includeArchived?: boolean;
  }) {
    const where: any = {};

    if (!params?.includeArchived) {
      where.status = params?.status || ProductStatus.ACTIVE;
    } else if (params?.status) {
      where.status = params.status;
    }

    if (params?.brand) {
      where.brand = { contains: params.brand };
    }

    if (params?.category) {
      where.category = { contains: params.category };
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search } },
        { code: { contains: params.search } },
        { description: { contains: params.search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: true,
        plans: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => this.enrichProductWithEffectivePrices(p));
  }

  /**
   * Fetch single product by ID with variants and plans
   */
  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        plans: true,
      },
    });

    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }

    return this.enrichProductWithEffectivePrices(product);
  }

  /**
   * Create a new Product (Admin Only)
   * Stores name, type, sales price, cost price, and notes with Decimal precision.
   */
  async createProduct(input: CreateProductInput) {
    const normalizedCode = input.code.toUpperCase().trim();

    const existing = await prisma.product.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      throw new ConflictError(`A product with code '${normalizedCode}' already exists.`);
    }

    const product = await prisma.product.create({
      data: {
        name: input.name.trim(),
        code: normalizedCode,
        type: input.type?.trim() || 'SOFTWARE',
        salesPrice: new Prisma.Decimal(input.salesPrice ?? 0),
        costPrice: input.costPrice !== undefined ? new Prisma.Decimal(input.costPrice) : null,
        notes: input.notes?.trim() || null,
        description: input.description?.trim() || null,
        category: input.category?.trim() || null,
        brand: input.brand?.trim() || 'Brightloop',
        status: input.status || ProductStatus.ACTIVE,
        isActive: input.status !== ProductStatus.ARCHIVED,
        variants: input.variants && input.variants.length > 0
          ? {
              create: input.variants.map((v) => ({
                name: v.name.trim(),
                sku: v.sku.toUpperCase().trim(),
                priceAdjustment: new Prisma.Decimal(v.priceAdjustment ?? 0),
                attributes: v.attributes || {},
                isActive: true,
              })),
            }
          : undefined,
      },
      include: {
        variants: true,
        plans: true,
      },
    });

    return this.enrichProductWithEffectivePrices(product);
  }

  /**
   * Update an existing Product (Admin Only)
   */
  async updateProduct(id: string, input: UpdateProductInput) {
    await this.getProductById(id);

    if (input.code) {
      const normalizedCode = input.code.toUpperCase().trim();
      const existing = await prisma.product.findFirst({
        where: { code: normalizedCode, NOT: { id } },
      });
      if (existing) {
        throw new ConflictError(`Another product with code '${normalizedCode}' already exists.`);
      }
    }

    const data: any = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.code !== undefined) data.code = input.code.toUpperCase().trim();
    if (input.type !== undefined) data.type = input.type.trim();
    if (input.salesPrice !== undefined) data.salesPrice = new Prisma.Decimal(input.salesPrice);
    if (input.costPrice !== undefined) data.costPrice = new Prisma.Decimal(input.costPrice);
    if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.category !== undefined) data.category = input.category?.trim() || null;
    if (input.brand !== undefined) data.brand = input.brand?.trim() || null;
    if (input.status !== undefined) {
      data.status = input.status;
      data.isActive = input.status === ProductStatus.ACTIVE;
    }
    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
      data.status = input.isActive ? ProductStatus.ACTIVE : ProductStatus.ARCHIVED;
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: {
        variants: true,
        plans: true,
      },
    });

    return this.enrichProductWithEffectivePrices(updated);
  }

  /**
   * Archive a Product (Admin Only)
   */
  async archiveProduct(id: string) {
    await this.getProductById(id);

    const archived = await prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.ARCHIVED,
        isActive: false,
      },
      include: {
        variants: true,
        plans: true,
      },
    });

    return this.enrichProductWithEffectivePrices(archived);
  }

  /**
   * Delete a product permanently (Admin Only)
   */
  async deleteProduct(id: string) {
    await this.getProductById(id);

    return prisma.product.delete({
      where: { id },
    });
  }

  /**
   * Add a variant to an existing Product (Admin Only)
   */
  async addVariant(productId: string, input: CreateVariantInput) {
    await this.getProductById(productId);

    const normalizedSku = input.sku.toUpperCase().trim();
    const existing = await prisma.productVariant.findUnique({
      where: { sku: normalizedSku },
    });

    if (existing) {
      throw new ConflictError(`A variant with SKU '${normalizedSku}' already exists.`);
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name: input.name.trim(),
        sku: normalizedSku,
        priceAdjustment: new Prisma.Decimal(input.priceAdjustment ?? 0),
        attributes: input.attributes || {},
        isActive: true,
      },
    });

    return variant;
  }

  /**
   * Update a Product Variant (Admin Only)
   */
  async updateVariant(variantId: string, input: UpdateVariantInput) {
    const existing = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!existing) {
      throw new NotFoundError(`Variant with ID '${variantId}' not found`);
    }

    const data: any = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.sku !== undefined) data.sku = input.sku.toUpperCase().trim();
    if (input.priceAdjustment !== undefined) {
      data.priceAdjustment = new Prisma.Decimal(input.priceAdjustment);
    }
    if (input.attributes !== undefined) data.attributes = input.attributes;

    return prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
  }

  /**
   * Delete a Product Variant (Admin Only)
   */
  async deleteVariant(variantId: string) {
    const existing = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!existing) {
      throw new NotFoundError(`Variant with ID '${variantId}' not found`);
    }

    return prisma.productVariant.delete({
      where: { id: variantId },
    });
  }
}

export const productsService = new ProductsService();
