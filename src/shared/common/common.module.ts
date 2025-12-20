import { Global, Module } from '@nestjs/common';
import { DynamicQueryService } from 'src/common/services/query/dynamic.service';

@Global()
@Module({
  providers: [DynamicQueryService],
  exports: [DynamicQueryService],
})
export class CommonModule {}
