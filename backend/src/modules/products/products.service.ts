import prisma from '../../config/db';

export interface CreateProductInput {
  name: string;
  code: string;
  description?: string;
  category?: string;
  brand?: string;
  isActive?: boolean;
  variants?: {
    name: string;
    sku: string;
    priceAdjustment?: number;
    attributes?: any;
  }[];
}

export interface UpdateProductInput {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  brand?: string;
  isActive?: boolean;
}

export interface CreateVariantInput {
  productId: string;
  name: string;
  sku: string;
  priceAdjustment?: number;
  attributes?: any;
}

export class ProductsService {
  async getAllProducts(params?: { search?: string; brand?: string; category?: string; isActive?: boolean }) {
    const where: any = {};

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
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

    return prisma.product.findMany({
      where,
      include: {
        variants: true,
        plans: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        plans: true,
      },
    });

    if (!product) {
      throw new Error(`Product with ID '${id}' not found`);
    }

    return product;
  }

  async createProduct(input: CreateProductInput) {
    return prisma.product.create({
      data: {
        name: input.name,
        code: input.code.toUpperCase(),
        description: input.description,
        category: input.category,
        brand: input.brand || 'Brightloop',
        isActive: input.isActive ?? true,
        variants: input.variants && input.variants.length > 0 ? {
          create: input.variants.map((v) => ({
            name: v.name,
            sku: v.sku.toUpperCase(),
            priceAdjustment: v.priceAdjustment || 0,
            attributes: v.attributes || {},
          })),
        } : undefined,
      },
      include: {
        variants: true,
      },
    });
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    return prisma.product.update({
      where: { id },
      data: {
        ...input,
        ...(input.code && { code: input.code.toUpperCase() }),
      },
      include: {
        variants: true,
        plans: true,
      },
    });
  }

  async deleteProduct(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  }

  // Variant operations
  async addVariant(input: CreateVariantInput) {
    return prisma.productVariant.create({
      data: {
        productId: input.productId,
        name: input.name,
        sku: input.sku.toUpperCase(),
        priceAdjustment: input.priceAdjustment || 0,
        attributes: input.attributes || {},
      },
    });
  }

  async updateVariant(variantId: string, data: Partial<CreateVariantInput>) {
    return prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.sku && { sku: data.sku.toUpperCase() }),
        ...(data.priceAdjustment !== undefined && { priceAdjustment: data.priceAdjustment }),
        ...(data.attributes && { attributes: data.attributes }),
      },
    });
  }

  async deleteVariant(variantId: string) {
    return prisma.productVariant.delete({
      where: { id: variantId },
    });
  }
}

export const productsService = new ProductsService();
