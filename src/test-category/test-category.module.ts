import { Module } from '@nestjs/common';
import { TestCategoryService } from './test-category.service';
import { TestCategoryController } from './test-category.controller';

@Module({
  controllers: [TestCategoryController],
  providers: [TestCategoryService],
})
export class TestCategoryModule {}
