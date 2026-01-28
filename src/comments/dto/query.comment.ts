import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCommentsQueryDto {
    @ApiPropertyOptional({ example: 1, description: 'Sahifa raqami' })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ example: 10, description: 'Sahifadagi elementlar soni' })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    limit?: number = 10;

    @ApiPropertyOptional({
        example: 'newest',
        enum: ['newest', 'oldest'],
        description: 'Sort turi',
    })
    @IsOptional()
    @IsIn(['newest', 'oldest'])
    sortBy?: 'newest' | 'oldest' = 'newest';

    @ApiPropertyOptional({ description: 'Student ID bo‘yicha filter' })
    @IsOptional()
    @IsString()
    studentId?: string;

    @ApiPropertyOptional({ description: 'Test ID bo‘yicha filter' })
    @IsOptional()
    @IsString()
    testId?: string;

    @ApiPropertyOptional({ description: 'Text qidirish uchun keyword' })
    @IsOptional()
    @IsString()
    textComment?: string;
}
