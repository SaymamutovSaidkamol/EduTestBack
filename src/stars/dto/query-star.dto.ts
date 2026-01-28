import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTopTestsQueryDto {
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
        example: 'most-rated',
        enum: ['most-rated', 'lowest-scoring'],
        description: 'Saralash turi: eng yuqori baholi yoki eng past baholi testlar',
    })
    @IsIn(['most-rated', 'lowest-scoring'])
    @IsOptional()
    sortBy?: 'most-rated' | 'lowest-scoring' = 'most-rated';

    @ApiPropertyOptional({
        example: 0.5,
        description: 'Minimal baho (filter)',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0.5)
    @Max(5)
    @IsOptional()
    minStar?: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0.5)
    @Max(5)
    @IsOptional()
    maxStar?: number;
}
