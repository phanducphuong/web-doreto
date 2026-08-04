import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles(Role.ADMIN)
  @Post()
  // TODO: Validate parentId phải là id của một category khác hoặc null, không được phép tạo vòng lặp cha con
  // TODO: Validate order phải là ở danh mục ngoài cùng
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get('count')
  getCount() {
    return this.categoriesService.getProductCountByCategory();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    // TODO: Chỉ xóa luôn nếu không có sản phẩm nào thuộc danh mục này, nếu có thì có thể warning chuyển sang một danh mục khác hoặc để null
    // TODO: Xóa cả danh mục con nếu có
    return this.categoriesService.remove(id);
  }
}
