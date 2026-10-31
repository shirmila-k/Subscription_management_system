import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service';
import { sendSuccess, sendError } from '../../utils/response';

export class ProductsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, brand, category, isActive } = req.query;
      const products = await productsService.getAllProducts({
        search: search as string,
        brand: brand as string,
        category: category as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      sendSuccess(res, 'Products retrieved successfully', products);
    } catch (error: any) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.getProductById(req.params.id);
      sendSuccess(res, 'Product retrieved successfully', product);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.createProduct(req.body);
      sendSuccess(res, 'Product created successfully', product, 201);
    } catch (error: any) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await productsService.updateProduct(req.params.id, req.body);
      sendSuccess(res, 'Product updated successfully', updated);
    } catch (error: any) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productsService.deleteProduct(req.params.id);
      sendSuccess(res, 'Product deleted successfully');
    } catch (error: any) {
      next(error);
    }
  }

  async addVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variant = await productsService.addVariant({
        productId: req.params.id,
        ...req.body,
      });
      sendSuccess(res, 'Variant added successfully', variant, 201);
    } catch (error: any) {
      next(error);
    }
  }

  async updateVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variant = await productsService.updateVariant(req.params.variantId, req.body);
      sendSuccess(res, 'Variant updated successfully', variant);
    } catch (error: any) {
      next(error);
    }
  }

  async deleteVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productsService.deleteVariant(req.params.variantId);
      sendSuccess(res, 'Variant deleted successfully');
    } catch (error: any) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
