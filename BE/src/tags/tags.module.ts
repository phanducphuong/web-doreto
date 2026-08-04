import { Module } from '@nestjs/common';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { Tag, TagSchema } from './schemas/tag.schema';
import { CounterModule } from 'src/counter/counter.module';
import { Connection } from 'mongoose';
import { createAutoIncrementPlugin } from 'src/common/plugins/auto-increment.plugin';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Tag.name,
        useFactory: (connection: Connection) => {
          TagSchema.plugin(createAutoIncrementPlugin(connection), {
            modelName: Tag.name,
            field: '_id',
          });
          return TagSchema;
        },
        inject: [getConnectionToken()],
      },
    ]),
    CounterModule,
  ],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
