import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { OptionValueDto } from './dto/option-value.dto';
import { IPaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { normalizeText } from 'src/common/utils';
import { ConfigService } from '@nestjs/config';
import { GenerateProductDescriptionDto } from './dto/generate-product-description.dto';

interface GeminiResponsePart {
  text?: string;
}
interface GeminiResponseCandidate {
  content?: { parts?: GeminiResponsePart[] };
}
interface GeminiGenerateContentResponse {
  candidates?: GeminiResponseCandidate[];
}
interface GeminiRequestResult {
  ok: boolean;
  status: number;
  body: string;
}

const PRODUCT_INCLUDE = {
  optionValues: { orderBy: { createdAt: 'asc' as const } },
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /** Nhào nặn product từ Prisma (bảng nối) về đúng shape FE mong đợi. */
  private shape(product: any) {
    if (!product) return product;
    const categories = (product.categories ?? []).map((pc: any) => pc.category);
    const tags = (product.tags ?? []).map((pt: any) => pt.tag);
    const optionValues = product.optionValues ?? [];
    const { categories: _c, tags: _t, ...rest } = product;
    return {
      ...rest,
      categories,
      tags,
      optionValues,
      categoryIds: categories.map((c: any) => c.id),
      tagIds: tags.map((t: any) => t.id),
      optionValueIds: optionValues.map((o: any) => o.id),
    };
  }

  private summaryOptionValue(
    options: { price: number; stock?: number }[],
  ): { minPrice: number; maxPrice: number; stock: number } {
    if (!options.length) return { minPrice: 0, maxPrice: 0, stock: 0 };
    const res = options.reduce(
      (acc, option) => {
        if (option.price > acc.maxPrice) acc.maxPrice = option.price;
        if (option.price < acc.minPrice) acc.minPrice = option.price;
        acc.stock += option.stock ?? 0;
        return acc;
      },
      { minPrice: Infinity, maxPrice: 0, stock: 0 },
    );
    if (!Number.isFinite(res.minPrice)) res.minPrice = 0;
    return res;
  }

  private optionValueData(o: OptionValueDto) {
    return {
      imageUrl: o.imageUrl,
      price: o.price,
      originalPrice: o.originalPrice,
      purchaseCount: o.purchaseCount ?? 0,
      stock: o.stock ?? 0,
      productOptionNames: o.productOptionNames ?? [],
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.shape(product);
  }

  async create(createProductDto: CreateProductDto) {
    const { optionValues, categoryIds, tagIds, ...productData } =
      createProductDto;

    const options: OptionValueDto[] =
      optionValues && optionValues.length > 0
        ? optionValues
        : [{ price: 0, productOptionNames: [] }];

    const { minPrice, maxPrice, stock } = this.summaryOptionValue(options);

    const created = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: productData.description,
        productOptions: productData.productOptions ?? [],
        imageUrls: productData.imageUrls ?? [],
        thumbnailUrls: productData.thumbnailUrls ?? [],
        normalizedName: normalizeText(createProductDto.name),
        minPrice,
        maxPrice,
        stock,
        categories: categoryIds?.length
          ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
        optionValues: {
          create: options.map((o) => this.optionValueData(o)),
        },
      },
      include: PRODUCT_INCLUDE,
    });

    return this.shape(created);
  }

  async queryProduct(
    filterDto: FilterProductDto,
  ): Promise<IPaginatedResponse<any>> {
    const {
      keyword,
      minPrice,
      maxPrice,
      categoryId,
      tagId,
      sortBy,
      sortOrder,
      page = 1,
      limit = 10,
    } = filterDto;

    const AND: Prisma.ProductWhereInput[] = [];

    if (keyword) {
      const normalized = normalizeText(keyword);
      const or: Prisma.ProductWhereInput[] = [
        { normalizedName: { contains: normalized, mode: 'insensitive' } },
      ];
      if (isUUID(keyword)) {
        or.push({ id: keyword });
      }
      AND.push({ OR: or });
    }

    if (minPrice !== undefined) AND.push({ minPrice: { gte: minPrice } });
    if (maxPrice !== undefined) AND.push({ maxPrice: { lte: maxPrice } });
    if (categoryId) AND.push({ categories: { some: { categoryId } } });
    if (tagId) AND.push({ tags: { some: { tagId } } });

    const where: Prisma.ProductWhereInput = AND.length ? { AND } : {};
    const orderBy = this.buildOrderBy(sortBy, sortOrder);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: PRODUCT_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data.map((p) => this.shape(p)),
      total,
      page,
      count: limit,
    };
  }

  private buildOrderBy(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Prisma.ProductOrderByWithRelationInput {
    const dir: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
    if (!sortBy) return { createdAt: 'desc' };
    const field = sortBy === 'price' ? 'minPrice' : sortBy;
    return { [field]: dir };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { optionValues, categoryIds, tagIds, ...productData } =
      updateProductDto;

    const scalarData: Prisma.ProductUpdateInput = { ...productData };
    if (productData.name !== undefined) {
      scalarData.normalizedName = normalizeText(productData.name);
    }

    await this.prisma.$transaction(async (tx) => {
      // Bảo đảm product tồn tại + cập nhật field vô hướng
      await tx.product.update({ where: { id }, data: scalarData });

      // Đồng bộ danh mục (bảng nối)
      if (categoryIds !== undefined) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        if (categoryIds.length) {
          await tx.productCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              productId: id,
              categoryId,
            })),
          });
        }
      }

      // Đồng bộ nhãn (bảng nối)
      if (tagIds !== undefined) {
        await tx.productTag.deleteMany({ where: { productId: id } });
        if (tagIds.length) {
          await tx.productTag.createMany({
            data: tagIds.map((tagId) => ({ productId: id, tagId })),
          });
        }
      }

      // Đồng bộ biến thể
      if (optionValues && optionValues.length > 0) {
        const keepIds = optionValues
          .filter((o) => o._id)
          .map((o) => o._id as string);

        await tx.optionValue.deleteMany({
          where: {
            productId: id,
            ...(keepIds.length ? { id: { notIn: keepIds } } : {}),
          },
        });

        for (const o of optionValues) {
          const payload = this.optionValueData(o);
          if (o._id) {
            await tx.optionValue.update({ where: { id: o._id }, data: payload });
          } else {
            await tx.optionValue.create({
              data: { productId: id, ...payload },
            });
          }
        }

        const { minPrice, maxPrice, stock } =
          this.summaryOptionValue(optionValues);
        await tx.product.update({
          where: { id },
          data: { minPrice, maxPrice, stock },
        });
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    try {
      return await this.prisma.product.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') throw new NotFoundException('Product not found');
        if (err.code === 'P2003') {
          throw new ConflictException(
            'Không thể xóa sản phẩm đã phát sinh trong đơn hàng',
          );
        }
      }
      throw err;
    }
  }

  async getRelatedProducts(productId: string) {
    const product = await this.findOne(productId);

    const categoryIds: string[] = product.categoryIds ?? [];
    const nameTokens = this.extractNameTokens(product.normalizedName);

    const or: Prisma.ProductWhereInput[] = [];
    if (categoryIds.length > 0) {
      or.push({ categories: { some: { categoryId: { in: categoryIds } } } });
    }
    if (nameTokens.length > 0) {
      or.push({
        OR: nameTokens.map((token) => ({
          normalizedName: { contains: token, mode: 'insensitive' as const },
        })),
      });
    }

    if (or.length === 0) return [];

    const candidates = await this.prisma.product.findMany({
      where: { id: { not: product.id }, isActive: true, OR: or },
      include: PRODUCT_INCLUDE,
    });

    return candidates
      .map((raw) => this.shape(raw))
      .map((relatedProduct) => {
        const relatedCategoryIds = relatedProduct.categoryIds ?? [];
        const sameCategoryScore = categoryIds.filter((id) =>
          relatedCategoryIds.includes(id),
        ).length;
        const relatedNameTokens = this.extractNameTokens(
          relatedProduct.normalizedName,
        );
        const similarNameScore = nameTokens.filter((token) =>
          relatedNameTokens.includes(token),
        ).length;

        return {
          ...relatedProduct,
          _relatedScore: { sameCategoryScore, similarNameScore },
        };
      })
      .sort((a, b) => {
        const categoryDiff =
          b._relatedScore.sameCategoryScore - a._relatedScore.sameCategoryScore;
        if (categoryDiff !== 0) return categoryDiff;
        const nameDiff =
          b._relatedScore.similarNameScore - a._relatedScore.similarNameScore;
        if (nameDiff !== 0) return nameDiff;
        return (b.purchaseCount ?? 0) - (a.purchaseCount ?? 0);
      })
      .slice(0, 8)
      .map(({ _relatedScore, ...relatedProduct }) => relatedProduct);
  }

  async getSuggestedProducts(
    productIds: string[] = [],
    keywords: string[] = [],
    limit = 8,
  ) {
    const uniqueProductIds = [...new Set(productIds)];
    const safeLimit = Math.max(limit, 1);

    const productIdSuggestions =
      await this.getSuggestedByProductIds(uniqueProductIds);

    const baseSuggestions = productIdSuggestions.slice(0, safeLimit);
    const remainingCount = safeLimit - baseSuggestions.length;

    let mergedSuggestions = baseSuggestions;
    if (remainingCount > 0) {
      const excludedIds = new Set<string>(uniqueProductIds);
      baseSuggestions.forEach((product) => {
        excludedIds.add(product.id);
      });
      const keywordSuggestions = await this.getSuggestedByKeywords(
        keywords,
        remainingCount,
        excludedIds,
      );
      mergedSuggestions = [...baseSuggestions, ...keywordSuggestions];
    }

    const total = mergedSuggestions.length;
    const data = mergedSuggestions.slice(0, safeLimit);

    return { data, total, count: safeLimit };
  }

  private async getSuggestedByProductIds(productIds: string[]) {
    if (productIds.length === 0) return [];

    const sourceProducts = (
      await this.prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        include: PRODUCT_INCLUDE,
      })
    ).map((p) => this.shape(p));

    if (sourceProducts.length === 0) return [];

    const sourceCategoryIds = [
      ...new Set(sourceProducts.flatMap((product) => product.categoryIds ?? [])),
    ];
    const sourceTagIds = [
      ...new Set(sourceProducts.flatMap((product) => product.tagIds ?? [])),
    ];

    const candidates = (
      await this.prisma.product.findMany({
        where: {
          id: { notIn: productIds },
          isActive: true,
          OR: [
            { categories: { some: { categoryId: { in: sourceCategoryIds } } } },
            { tags: { some: { tagId: { in: sourceTagIds } } } },
          ],
        },
        include: PRODUCT_INCLUDE,
      })
    ).map((p) => this.shape(p));

    return candidates
      .map((product) => {
        const categoryIds = product.categoryIds ?? [];
        const tagIds = product.tagIds ?? [];
        const categoryMatchedIds = sourceCategoryIds.filter((id) =>
          categoryIds.includes(id),
        );
        const tagMatchedIds = sourceTagIds.filter((id) => tagIds.includes(id));

        const isCategoryFullMatch =
          sourceCategoryIds.length > 0 &&
          sourceCategoryIds.every((id) => categoryIds.includes(id));
        const isTagFullMatch =
          sourceTagIds.length > 0 &&
          sourceTagIds.every((id) => tagIds.includes(id));

        return {
          ...product,
          _suggestScore: {
            categoryPriority: categoryMatchedIds.length > 0 ? 1 : 0,
            categoryMatchLevel: isCategoryFullMatch ? 1 : 0,
            categoryMatchCount: categoryMatchedIds.length,
            tagMatchLevel: isTagFullMatch ? 1 : 0,
            tagMatchCount: tagMatchedIds.length,
            purchaseCount: product.purchaseCount ?? 0,
          },
        };
      })
      .filter(
        (product) =>
          product._suggestScore.categoryMatchCount > 0 ||
          product._suggestScore.tagMatchCount > 0,
      )
      .sort((a, b) => {
        const categoryPriorityDiff =
          b._suggestScore.categoryPriority - a._suggestScore.categoryPriority;
        if (categoryPriorityDiff !== 0) return categoryPriorityDiff;
        const categoryLevelDiff =
          b._suggestScore.categoryMatchLevel -
          a._suggestScore.categoryMatchLevel;
        if (categoryLevelDiff !== 0) return categoryLevelDiff;
        const categoryCountDiff =
          b._suggestScore.categoryMatchCount -
          a._suggestScore.categoryMatchCount;
        if (categoryCountDiff !== 0) return categoryCountDiff;
        const tagLevelDiff =
          b._suggestScore.tagMatchLevel - a._suggestScore.tagMatchLevel;
        if (tagLevelDiff !== 0) return tagLevelDiff;
        const tagCountDiff =
          b._suggestScore.tagMatchCount - a._suggestScore.tagMatchCount;
        if (tagCountDiff !== 0) return tagCountDiff;
        return b._suggestScore.purchaseCount - a._suggestScore.purchaseCount;
      })
      .map(({ _suggestScore, ...product }) => product);
  }

  private async getSuggestedByKeywords(
    keywords: string[],
    limit: number,
    excludedIds: Set<string> = new Set<string>(),
  ) {
    const normalizedKeywords = [
      ...new Set(
        keywords
          .map((keyword) => normalizeText(keyword))
          .map((keyword) => keyword.trim())
          .filter((keyword) => keyword.length > 0),
      ),
    ];

    if (normalizedKeywords.length === 0) return [];

    const candidates = (
      await this.prisma.product.findMany({
        where: {
          id: { notIn: [...excludedIds] },
          isActive: true,
          OR: normalizedKeywords.map((keyword) => ({
            normalizedName: { contains: keyword, mode: 'insensitive' as const },
          })),
        },
        include: PRODUCT_INCLUDE,
        take: Math.max(limit * 5, limit),
      })
    ).map((p) => this.shape(p));

    return candidates
      .map((product) => {
        const name = product.normalizedName ?? '';
        const fullMatchCount = normalizedKeywords.filter(
          (keyword) => keyword.length > 0 && name.includes(keyword),
        ).length;
        const partialMatchCount = normalizedKeywords.reduce((acc, keyword) => {
          const keywordTokens = keyword.split(/\s+/).filter(Boolean);
          if (keywordTokens.length === 0) return acc;
          const matchedTokens = keywordTokens.filter((token) =>
            name.includes(token),
          ).length;
          return acc + matchedTokens;
        }, 0);

        return {
          ...product,
          _keywordScore: {
            fullMatchCount,
            partialMatchCount,
            purchaseCount: product.purchaseCount ?? 0,
          },
        };
      })
      .filter(
        (product) =>
          product._keywordScore.fullMatchCount > 0 ||
          product._keywordScore.partialMatchCount > 0,
      )
      .sort((a, b) => {
        const fullMatchDiff =
          b._keywordScore.fullMatchCount - a._keywordScore.fullMatchCount;
        if (fullMatchDiff !== 0) return fullMatchDiff;
        const partialMatchDiff =
          b._keywordScore.partialMatchCount - a._keywordScore.partialMatchCount;
        if (partialMatchDiff !== 0) return partialMatchDiff;
        return b._keywordScore.purchaseCount - a._keywordScore.purchaseCount;
      })
      .map(({ _keywordScore, ...product }) => product);
  }

  private extractNameTokens(normalizedName: string | undefined): string[] {
    if (!normalizedName) return [];
    return [...new Set(normalizedName.split(/\s+/).filter((token) => token))];
  }

  // ==== AI viết mô tả sản phẩm (Gemini) — không đụng DB ====

  async generateDescriptionWithAI(dto: GenerateProductDescriptionDto) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('Missing GEMINI_API_KEY in environment');
    }

    const requestedModel = this.configService.get<string>('GEMINI_MODEL');
    const modelCandidates = this.getModelCandidates(requestedModel);
    const prompt = this.buildDescriptionPrompt(dto);
    let payload: GeminiGenerateContentResponse | null = null;
    let usedModel: string | null = null;
    let lastFailure: GeminiRequestResult | null = null;

    for (const model of modelCandidates) {
      const result = await this.requestGemini(apiKey, model, prompt);
      if (!result.ok) {
        lastFailure = result;
        if (result.status === 404) continue;
        break;
      }
      payload = JSON.parse(result.body) as GeminiGenerateContentResponse;
      usedModel = model;
      break;
    }

    if (!payload || !usedModel) {
      const status = lastFailure?.status ?? 500;
      const reason = lastFailure?.body?.slice(0, 300) || 'Unknown error';
      throw new InternalServerErrorException(
        `Gemini request failed (${status}): ${reason}`,
      );
    }

    const generatedText =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text?.trim() ?? '')
        .filter(Boolean)
        .join('\n') ?? '';

    if (!generatedText) {
      throw new InternalServerErrorException(
        'Gemini did not return generated description',
      );
    }

    return { description: generatedText, model: usedModel };
  }

  private buildDescriptionPrompt(dto: GenerateProductDescriptionDto) {
    const productName = dto.name || 'N/A';
    const categoryNames = dto.categoryNames?.length
      ? dto.categoryNames.join(', ')
      : 'N/A';
    const tagNames = dto.tagNames?.length ? dto.tagNames.join(', ') : 'N/A';

    return [
      'You are an e-commerce copywriter.',
      'Rewrite and improve product description in Vietnamese.',
      'Output is text only with enter lines. can using icons for decoration.',
      `Product name: ${productName}`,
      `Categories: ${categoryNames}`,
      `Tags: ${tagNames}`,
      `Raw input text from user: ${dto.rawText}`,
      'Focus on practical benefits, style, and easy visualization in real space.',
    ].join('\n');
  }

  private getModelCandidates(requestedModel?: string) {
    const normalizedRequested = this.normalizeModelName(requestedModel);
    const defaults = ['gemini-flash-latest', 'gemini-1.5-flash'];
    const candidates = [normalizedRequested, ...defaults].filter(
      (value): value is string => Boolean(value),
    );
    return [...new Set(candidates)];
  }

  private normalizeModelName(model?: string) {
    if (!model) return undefined;
    return model.replace(/^models\//, '').trim();
  }

  private async requestGemini(apiKey: string, model: string, prompt: string) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      },
    );

    return {
      ok: response.ok,
      status: response.status,
      body: await response.text(),
    };
  }
}
