import prisma from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { PaymentTerms } from '@prisma/client';

export class QuotationTemplatesService {
  public static async getAll(filter?: { isActive?: boolean }) {
    const where: any = {};
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    return prisma.quotationTemplate.findMany({
      where,
      include: {
        plan: {
          include: {
            product: true,
            variant: true,
          },
        },
        lines: {
          include: {
            variant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getById(id: string) {
    const template = await prisma.quotationTemplate.findUnique({
      where: { id },
      include: {
        plan: {
          include: {
            product: true,
            variant: true,
          },
        },
        lines: {
          include: {
            variant: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError(`Quotation template with ID ${id} not found.`);
    }

    return template;
  }

  public static async create(data: {
    name: string;
    description?: string;
    planId: string;
    validityDays?: number;
    defaultPaymentTerms?: PaymentTerms;
    defaultNotes?: string;
    lines?: Array<{
      variantId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    const plan = await prisma.plan.findUnique({
      where: { id: data.planId },
    });

    if (!plan) {
      throw new BadRequestError(`Target plan with ID ${data.planId} does not exist.`);
    }

    const existing = await prisma.quotationTemplate.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new BadRequestError('A quotation template with this name already exists.');
    }

    return prisma.quotationTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        planId: data.planId,
        validityDays: data.validityDays ?? 15,
        defaultPaymentTerms: data.defaultPaymentTerms ?? PaymentTerms.IMMEDIATE,
        defaultNotes: data.defaultNotes,
        lines: data.lines
          ? {
              create: data.lines.map((line) => ({
                variantId: line.variantId || null,
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
              })),
            }
          : undefined,
      },
      include: {
        plan: {
          include: {
            product: true,
            variant: true,
          },
        },
        lines: {
          include: {
            variant: true,
          },
        },
      },
    });
  }

  public static async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      planId?: string;
      validityDays?: number;
      defaultPaymentTerms?: PaymentTerms;
      defaultNotes?: string;
      isActive?: boolean;
    }
  ) {
    await this.getById(id);

    return prisma.quotationTemplate.update({
      where: { id },
      data,
      include: {
        plan: {
          include: {
            product: true,
            variant: true,
          },
        },
        lines: true,
      },
    });
  }

  public static async delete(id: string) {
    await this.getById(id);

    return prisma.quotationTemplate.delete({
      where: { id },
    });
  }
}
