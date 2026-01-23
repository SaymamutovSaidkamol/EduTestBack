import { Module } from '@nestjs/common';
import { TestVariantsService } from './test-variants.service';
import { TestVariantsController } from './test-variants.controller';

@Module({
  controllers: [TestVariantsController],
  providers: [TestVariantsService],
})
export class TestVariantsModule {}
