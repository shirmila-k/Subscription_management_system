import prisma from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';

export class ProductsService {
  public static async getAll(filter?: {
    search?: string;
    brand?: string;
    category?: string;
    isActive?: boolean;
  }) {
    const where: any = {};

    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter?.brand) {
      where.brand = { contains: filter.brand };
    }

    if (filter?.category) {
      where.category = { contains: filter.category };
    }

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search } },
        { sku: { contains: filter.search } },
        { description: { contains: filter.search } },
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

  public static async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        plans: true,
      },
    });

    if (!product) {
      throw new NotFoundError(`Product with ID ${id} not found.`);
    }

    return product;
  }

  public static async create(data: {
    name: string;
    description?: string;
    sku: string;
    brand?: string;
    category?: string;
    variants?: Array<{
      name: string;
      sku: string;
      attributes?: any;
      extraCost?: number;
    }>;
  }) {
    return prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        sku: data.sku,
        brand: data.brand,
        category: data.category,
        variants: data.variants
          ? {
              create: data.variants.map((v) => ({
                name: v.name,
                sku: v.sku,
                attributes: v.attributes,
                extraCost: v.extraCost || 0,
              })),
            }
          : undefined,
      },
      include: {
        variants: true,
      },
    });
  }

  public static async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      sku?: string;
      brand?: string;
      category?: string;
      isActive?: boolean;
    }
  ) {
    await this.getById(id);

    return prisma.product.update({
      where: { id },
      data,
      include: {
        variants: true,
      },
    });
  }

  public static async delete(id: string) {
    await this.getById(id);

    return prisma.product.delete({
      where: { id },
    });
  }

  public static async addVariant(
    productId: string,
    data: {
      name: string;
      sku: string;
      attributes?: any;
      extraCost?: number;
    }
  ) {
    await this.getById(productId);

    return prisma.productVariant.create({
      data: {
        productId,
        name: data.name,
        sku: data.sku,
        attributes: data.attributes,
        extraCost: data.extraCost || 0,
      },
    });
  }

  public static async updateVariant(
    variantId: string,
    data: {
      name?: string;
      sku?: string;
      attributes?: any;
      extraCost?: number;
      isActive?: boolean;
    }
  ) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundError('Product variant not found');
    }

    return prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
  }

  public static async deleteVariant(variantId: string) {
    return prisma.productVariant.delete({
      where: { id: variantId },
    });
  }
}
