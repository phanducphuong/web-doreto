import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { UploadsModule } from './uploads/uploads.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { CounterModule } from './counter/counter.module';
import { FeedbackProductsModule } from './feedback-products/feedback-products.module';
import { ContactRequestsModule } from './contact-requests/contact-requests.module';
import { TagsModule } from './tags/tags.module';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        console.log('MONGO_URI =', uri ? `${uri.substring(0, 20)}...` : 'UNDEFINED');
        return {
          uri,
          serverSelectionTimeoutMS: 10000,
        };
      },
    }),
    CounterModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    UploadsModule,
    PurchaseOrdersModule,
    FeedbackProductsModule,
    ContactRequestsModule,
    TagsModule,
    ReportingModule,
  ],
  providers: [AppService],
  controllers: [AppController],
})
export class AppModule {}
