import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema';
import { AuthModule } from 'src/auth/auth.module';
import { CounterModule } from 'src/counter/counter.module';
import { Connection } from 'mongoose';
import { createAutoIncrementPlugin } from 'src/common/plugins/auto-increment.plugin';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Category.name,
        useFactory: (connection: Connection) => {
          CategorySchema.plugin(createAutoIncrementPlugin(connection), {
            modelName: Category.name,
            field: '_id',
          });

          return CategorySchema;
        },
        inject: [getConnectionToken()],
      },
    ]),
    AuthModule,
    CounterModule,
    ProductsModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
