import { ProductOptionValueService } from './option-value.service';
import { OptionValue, OptionValueSchema } from './schemas/option-value.schema';
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { CounterModule } from 'src/counter/counter.module';
import { Connection } from 'mongoose';
import { createAutoIncrementPlugin } from 'src/common/plugins/auto-increment.plugin';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Product.name,
        useFactory: (connection: Connection) => {
          ProductSchema.plugin(createAutoIncrementPlugin(connection), {
            modelName: Product.name,
            field: '_id',
          });

          return ProductSchema;
        },
        inject: [getConnectionToken()],
      },
      {
        name: OptionValue.name,
        useFactory: () => {
          return OptionValueSchema;
        },
        inject: [getConnectionToken()],
      },
    ]),
    CounterModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductOptionValueService],
  exports: [MongooseModule],
})
export class ProductsModule {}
