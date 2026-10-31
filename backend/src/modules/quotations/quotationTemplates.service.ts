import prisma from '../../config/db';
import { Prisma } from '@prisma/client';
import {
  CreateQuotationTemplateInput,
  UpdateQuotationTemplateInput,
} from './quotationTemplates.validation';

export class QuotationTemplatesService {
  async getAllTemplates(params?: { isActive?: boolean }) {
    const where: Prisma.QuotationTemplateWhereInput = {};
    if (params?.isActive !== undefined) where.isActive = params.isActive;

    return prisma.quotationTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { quotations: true },
        },
      },
    });
  }

  async getTemplateById(id: string) {
    const template = await prisma.quotationTemplate.findUnique({
      where: { id },
      include: {
        quotations: {
          select: { id: true, quotationNumber: true, status: true, totalAmount: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!template) throw new Error('Quotation template not found');
    return template;
  }

  async createTemplate(input: CreateQuotationTemplateInput) {
    return prisma.quotationTemplate.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim(),
        defaultTerms: input.defaultTerms?.trim(),
        defaultValidityDays: input.defaultValidityDays ?? 30,
        defaultItems: input.defaultItems ? (input.defaultItems as any) : Prisma.JsonNull,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateTemplate(id: string, input: UpdateQuotationTemplateInput) {
    const existing = await prisma.quotationTemplate.findUnique({ where: { id } });
    if (!existing) throw new Error('Quotation template not found');

    const updateData: Prisma.QuotationTemplateUpdateInput = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.description !== undefined) updateData.description = input.description?.trim();
    if (input.defaultTerms !== undefined) updateData.defaultTerms = input.defaultTerms?.trim();
    if (input.defaultValidityDays !== undefined) updateData.defaultValidityDays = input.defaultValidityDays;
    if (input.defaultItems !== undefined) {
      updateData.defaultItems = input.defaultItems ? (input.defaultItems as any) : Prisma.JsonNull;
    }
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    return prisma.quotationTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteTemplate(id: string) {
    const existing = await prisma.quotationTemplate.findUnique({
      where: { id },
      include: { _count: { select: { quotations: true } } },
    });
    if (!existing) throw new Error('Quotation template not found');

    if (existing._count.quotations > 0) {
      // Retain template record for historical integrity, deactivate it
      return prisma.quotationTemplate.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return prisma.quotationTemplate.delete({ where: { id } });
  }

  /**
   * Calculate summary totals for a template's line items
   */
  calculateTotals(items: Array<{
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    discountAmount?: number;
    taxRate?: number;
  }>) {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
      const lineRaw = Math.round(qty * unitPrice * 100) / 100;

      let lineDiscount = 0;
      if (item.discountPercent && item.discountPercent > 0) {
        lineDiscount = Math.round(((lineRaw * item.discountPercent) / 100) * 100) / 100;
      } else if (item.discountAmount && item.discountAmount > 0) {
        lineDiscount = Math.min(lineRaw, Number(item.discountAmount));
      }

      const taxable = Math.max(0, lineRaw - lineDiscount);
      const taxRate = item.taxRate !== undefined ? Number(item.taxRate) : 18;
      const lineTax = Math.round(((taxable * taxRate) / 100) * 100) / 100;

      subtotal += lineRaw;
      totalDiscount += lineDiscount;
      totalTax += lineTax;
    }

    subtotal = Math.round(subtotal * 100) / 100;
    totalDiscount = Math.round(totalDiscount * 100) / 100;
    totalTax = Math.round(totalTax * 100) / 100;
    const grandTotal = Math.round((subtotal - totalDiscount + totalTax) * 100) / 100;

    return {
      subtotal,
      discountAmount: totalDiscount,
      taxAmount: totalTax,
      totalAmount: grandTotal,
    };
  }
}

export const quotationTemplatesService = new QuotationTemplatesService();
