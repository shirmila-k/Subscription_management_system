import { Request, Response, NextFunction } from 'express';
import { ProductsService } from './products.service';
import { sendSuccess } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';

export class ProductsController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, brand, category, isActive } = req.query;
      const products = await ProductsService.getAll({
        search: search as string,
        brand: brand as string,
        category: category as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      return sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductsService.getById(req.params.id);
      return sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, sku, description, brand, category, type, salesPrice, costPrice, notes, variants } = req.body;
      if (!name || !sku) {
        throw new BadRequestError('Product name and SKU are required.');
      }
      const product = await ProductsService.create({
        name,
        sku,
        description,
        brand,
        category,
        type,
        salesPrice: salesPrice !== undefined ? Number(salesPrice) : undefined,
        costPrice: costPrice !== undefined ? Number(costPrice) : undefined,
        notes,
        variants,
      });
      return sendSuccess(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductsService.update(req.params.id, req.body);
      return sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductsService.delete(req.params.id);
      return sendSuccess(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async addVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, sku, attributes, extraCost } = req.body;
      if (!name || !sku) {
        throw new BadRequestError('Variant name and SKU are required.');
      }
      const variant = await ProductsService.addVariant(req.params.id, {
        name,
        sku,
        attributes,
        extraCost,
      });
      return sendSuccess(res, variant, 'Variant added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async updateVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await ProductsService.updateVariant(req.params.variantId, req.body);
      return sendSuccess(res, variant, 'Variant updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteVariant(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductsService.deleteVariant(req.params.variantId);
      return sendSuccess(res, null, 'Variant deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
