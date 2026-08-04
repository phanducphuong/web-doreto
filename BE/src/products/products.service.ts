import { ProductOptionValueService } from './option-value.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { IPaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { BaseService } from 'src/common/base/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { OptionValue } from './schemas/option-value.schema';
import { normalizeText } from 'src/common/utils';
import { ConfigService } from '@nestjs/config';
import { GenerateProductDescriptionDto } from './dto/generate-product-description.dto';

interface GeminiResponsePart {
  text?: string;
}

interface GeminiResponseCandidate {
  content?: {
    parts?: GeminiResponsePart[];
  };
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiResponseCandidate[];
}

interface GeminiRequestResult {
  ok: boolean;
  status: number;
  body: string;
}

@Injectable()
export class ProductsService extends BaseService<ProductDocument> {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly productOptionValueService: ProductOptionValueService,
    private readonly configService: ConfigService,
  ) {
    super(productModel);
  }

  async findOne(id: string | number): Promise<ProductDocument | null> {
    const product = await this.productModel
      .findById(id)
      .populate('optionValues')
      .populate('categories')
      .populate('tags')
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product as ProductDocument;
  }

  async create<ProductDocument>(createProductDto: CreateProductDto) {
    const { optionValues, ...productData } = createProductDto;

    const product = await super.create(productData);

    // Tạo ProductOptions
    const optionValueIds: Types.ObjectId[] = [];
    let minPrice = Infinity,
      maxPrice = 0,
      stock = 0;

    if (optionValues && optionValues.length > 0) {
      // Tạo các ProductOption từ dto
      for (const option of optionValues) {
        const createdOption =
          await this.productOptionValueService.create(option);
        optionValueIds.push(createdOption._id);
        if (createdOption.price > maxPrice) maxPrice = createdOption.price;
        if (createdOption.price < minPrice) minPrice = createdOption.price;
        stock += createdOption.stock ?? 0;
      }
    } else {
      // Tạo ProductOption mặc định nếu không có
      const defaultOption = await this.productOptionValueService.create({
        price: 0,
      });
      optionValueIds.push(defaultOption._id);
    }

    // Cập nhật Product với ProductOptions
    product.optionValueIds = optionValueIds;
    product.minPrice = minPrice;
    product.maxPrice = maxPrice;
    product.stock = stock;

    await product.save();

    return product as ProductDocument;
  }

  async queryProduct(
    filterDto: FilterProductDto,
  ): Promise<IPaginatedResponse<Product>> {
    const {
      keyword,
      minPrice,
      maxPrice,
      categoryId,
      tagId,
      // Tách riêng các options dùng cho BaseService
      sortBy,
      sortOrder,
      page = 1,
      limit = 10,
    } = filterDto;

    // 1. Xây dựng filter query (Chỉ chứa logic đặc thù của Product)
    const filter: QueryFilter<ProductDocument> = {};

    if (keyword) {
      const normalized = normalizeText(keyword);

      const orConditions: QueryFilter<ProductDocument>[] = [
        {
          normalizedName: {
            $regex: normalized,
            $options: 'i',
          },
        },
      ];

      // nếu keyword là số → thêm điều kiện _id
      if (!isNaN(Number(keyword))) {
        orConditions.push({
          _id: Number(keyword),
        });
      }

      filter.$or = orConditions;
    }

    const priceFilters: QueryFilter<ProductDocument>[] = [];
    if (minPrice !== undefined) {
      priceFilters.push({ minPrice: { $gte: minPrice } });
    }
    if (maxPrice !== undefined) {
      priceFilters.push({ maxPrice: { $lte: maxPrice } });
    }
    if (priceFilters.length > 0) {
      filter.$and = priceFilters;
    }

    if (categoryId) {
      filter.categoryIds = { $in: [categoryId] };
    }

    if (tagId) {
      filter.tagIds = { $in: [tagId] };
    }

    // 2. Xây dựng options cho phân trang và sắp xếp
    const options = {
      sortBy,
      sortOrder,
      page,
      limit,
    };

    // 3. Uỷ quyền hoàn toàn cho BaseService xử lý phần còn lại
    // Hàm super.query đã xử lý sẵn countDocuments, .find(), .sort(), .skip(), .limit() và return đúng format.
    return super.query(filter, options, ['optionValues', 'tags']);
  }

  async update<ProductDocument>(
    id: number,
    updateProductDto: UpdateProductDto,
  ) {
    const { optionValues, ...productData } = updateProductDto;

    // Cập nhật Product
    const product = await super.update(id, productData);

    // Nếu có update productOption
    if (optionValues && optionValues.length > 0) {
      // Cập nhật hoặc tạo ProductOptions
      const newOptionValues = optionValues.map((option) => ({
        ...option,
        _id: option._id || new Types.ObjectId(),
      }));
      await this.productOptionValueService.upsertMany(newOptionValues);
      const { minPrice, maxPrice, stock } =
        this.sumaryOptionValue(newOptionValues);

      product.minPrice = minPrice;
      product.maxPrice = maxPrice;
      product.stock = stock;

      // Lấy ID của những thằng ĐÃ CÓ (được sửa)
      const updatedIds = newOptionValues.map((option) => option._id.toString());

      // Xóa ProductOptions không còn trong danh sách mới
      if (product.optionValueIds && product.optionValueIds.length > 0) {
        const oldOptionIdStrings = product.optionValueIds
          .filter(Boolean)
          .map((id) => id.toString());
        const idsToDelete = oldOptionIdStrings.filter(
          (id) => !updatedIds.includes(id),
        );

        await this.productOptionValueService.deleteMany({
          _id: { $in: idsToDelete },
        });
      }

      // Cập nhật Product với ProductOptions mới
      product.optionValueIds = updatedIds as unknown as Types.ObjectId[];
      await product.save();
    }

    return product as ProductDocument;
  }

  async getRelatedProducts(productId: number) {
    const product = await this.findOne(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const categoryIds = product.categoryIds ?? [];
    const nameTokens = this.extractNameTokens(product.normalizedName);

    const queryConditions: QueryFilter<ProductDocument>[] = [];
    if (categoryIds.length > 0) {
      queryConditions.push({ categoryIds: { $in: categoryIds } });
    }
    if (nameTokens.length > 0) {
      queryConditions.push({
        normalizedName: {
          $regex: nameTokens.join('|'),
          $options: 'i',
        },
      });
    }

    if (queryConditions.length === 0) {
      return [];
    }

    const relatedProducts = await this.productModel
      .find({
        _id: { $ne: product._id },
        isActive: true,
        $or: queryConditions,
      })
      .populate('optionValues')
      .populate('categories')
      .populate('tags')
      .lean()
      .exec();

    return relatedProducts
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
          _relatedScore: {
            sameCategoryScore,
            similarNameScore,
          },
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
    productIds: number[] = [],
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
      const excludedIds = new Set<number>(uniqueProductIds);
      baseSuggestions.forEach((product) => {
        excludedIds.add(Number(product._id));
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

    return {
      data,
      total,
      count: safeLimit,
    };
  }

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
        // Try next model on not found model id.
        if (result.status === 404) {
          continue;
        }
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

    return {
      description: generatedText,
      model: usedModel,
    };
  }

  private async getSuggestedByProductIds(productIds: number[]) {
    if (productIds.length === 0) {
      return [];
    }

    const sourceProducts = await this.productModel
      .find({
        _id: { $in: productIds },
        isActive: true,
      })
      .lean()
      .exec();

    if (sourceProducts.length === 0) {
      return [];
    }

    const sourceCategoryIds = [
      ...new Set(
        sourceProducts.flatMap((product) => product.categoryIds ?? []),
      ),
    ];
    const sourceTagIds = [
      ...new Set(sourceProducts.flatMap((product) => product.tagIds ?? [])),
    ];

    const candidates = await this.productModel
      .find({
        _id: { $nin: productIds },
        isActive: true,
        $or: [
          { categoryIds: { $in: sourceCategoryIds } },
          { tagIds: { $in: sourceTagIds } },
        ],
      })
      .populate('optionValues')
      .populate('categories')
      .populate('tags')
      .lean()
      .exec();

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
    excludedIds: Set<number> = new Set<number>(),
  ) {
    const normalizedKeywords = [
      ...new Set(
        keywords
          .map((keyword) => normalizeText(keyword))
          .map((keyword) => keyword.trim())
          .filter((keyword) => keyword.length > 0),
      ),
    ];

    if (normalizedKeywords.length === 0) {
      return [];
    }

    const regexPattern = normalizedKeywords.map((keyword) =>
      keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );

    const candidates = await this.productModel
      .find({
        _id: { $nin: [...excludedIds] },
        isActive: true,
        normalizedName: { $regex: regexPattern.join('|'), $options: 'i' },
      })
      .populate('optionValues')
      .populate('categories')
      .populate('tags')
      .lean()
      .limit(Math.max(limit * 5, limit))
      .exec();

    return candidates
      .map((product) => {
        const name = product.normalizedName ?? '';
        const fullMatchCount = normalizedKeywords.filter(
          (keyword) => keyword.length > 0 && name.includes(keyword),
        ).length;
        const partialMatchCount = normalizedKeywords.reduce((acc, keyword) => {
          const keywordTokens = keyword.split(/\s+/).filter(Boolean);
          if (keywordTokens.length === 0) {
            return acc;
          }
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

  private sumaryOptionValue(optionValues: OptionValue[]) {
    return optionValues.reduce(
      (acc, option) => {
        if (option.price > acc.maxPrice) acc.maxPrice = option.price;
        if (option.price < acc.minPrice) acc.minPrice = option.price;
        acc.stock += option.stock ?? 0;
        return acc;
      },
      { minPrice: Infinity, maxPrice: 0, stock: 0 },
    );
  }

  private extractNameTokens(normalizedName: string | undefined): string[] {
    if (!normalizedName) {
      return [];
    }

    return [...new Set(normalizedName.split(/\s+/).filter((token) => token))];
  }

  private buildDescriptionPrompt(dto: GenerateProductDescriptionDto) {
    const productName = dto.name || 'N/A';
    const categoryNames = dto.categoryNames?.length
      ? dto.categoryNames.join(', ')
      : 'N/A';
    const tagNames = dto.tagNames?.length ? dto.tagNames.join(', ') : 'N/A';

    return [
      'You are an e-commerce copywriter for a fashion store.',
      'Rewrite and improve product description in Vietnamese.',
      'Output is text only with enter lines. can using icons for decoration.',
      `Product name: ${productName}`,
      `Categories: ${categoryNames}`,
      `Tags: ${tagNames}`,
      `Raw input text from user: ${dto.rawText}`,
      'Focus on material, fit, comfort, and outfit styling suggestions.',
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
    if (!model) {
      return undefined;
    }
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
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
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
