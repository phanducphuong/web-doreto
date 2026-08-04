import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { IdSerializeInterceptor } from './common/interceptors/id-serialize.interceptor';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { UploadsModule } from './uploads/uploads.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
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
      // .env.local (bí mật local, không lên git) được nạp trước .env
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
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
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: IdSerializeInterceptor },
  ],
  controllers: [AppController],
})
export class AppModule {}
