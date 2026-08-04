import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { RelatedProductsDto } from './dto/related-products.dto';
import { GenerateProductDescriptionDto } from './dto/generate-product-description.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Roles(Role.ADMIN)
  @Post('generate-description')
  generateDescription(
    @Body() generateProductDescriptionDto: GenerateProductDescriptionDto,
  ) {
    return this.productsService.generateDescriptionWithAI(
      generateProductDescriptionDto,
    );
  }

  @Public()
  @Get()
  query(@Query() filterDto: FilterProductDto) {
    return this.productsService.queryProduct(filterDto);
  }

  @Public()
  @Get('best-selling')
  getBestSellingProducts() {
    return this.productsService.queryProduct({
      page: 1,
      limit: 4,
      sortBy: 'purchaseCount',
      sortOrder: 'desc',
    });
  }

  @Public()
  @Get('related')
  getRelatedProducts(@Query('productId') productId: string) {
    return this.productsService.getRelatedProducts(productId);
  }

  @Public()
  @Get('suggested')
  getSuggestedProducts(@Query() suggestedProductDto: RelatedProductsDto) {
    const rawProductIds: unknown = suggestedProductDto.productIds;
    const rawKeywords: unknown = suggestedProductDto.keywords;
    const rawLimit: unknown = suggestedProductDto.limit;

    const productIds = Array.isArray(rawProductIds)
      ? rawProductIds.filter(
          (productId): productId is string => typeof productId === 'string',
        )
      : [];
    const keywords = Array.isArray(rawKeywords)
      ? rawKeywords.filter(
          (keyword): keyword is string => typeof keyword === 'string',
        )
      : [];
    const limit = typeof rawLimit === 'number' ? rawLimit : undefined;

    return this.productsService.getSuggestedProducts(
      productIds,
      keywords,
      limit,
    );
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
