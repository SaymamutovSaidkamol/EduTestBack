import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTestCategoryDto } from './create-test-category.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTestCategoryDto extends PartialType(CreateTestCategoryDto) {
    @ApiProperty({ example: 'Matematika' })
    @IsOptional()
    @IsString()
    categoryName?: string;

    @ApiProperty({ example: 'matematika.jpg' })
    @IsOptional()
    @IsString()
    image?: string;
}
