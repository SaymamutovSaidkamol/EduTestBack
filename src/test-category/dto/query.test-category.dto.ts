import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export enum SortByTestCategory {
    CATEGORY_NAME = 'categoryName',
    CREATED_AT = 'createdAt',
    ID = 'id',
}

export class QueryTestCategoryDto {
    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsString()
    categoryName?: string;

    @ApiProperty({
        example: 1,
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    page?: number = 1;

    @ApiProperty({
        example: 10,
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    limit?: number = 10;

    @ApiProperty({
        enum: SortByTestCategory,
        example: SortByTestCategory.CREATED_AT,
        required: false,
    })
    @IsOptional()
    @IsEnum(SortByTestCategory)
    sortBy?: SortByTestCategory = SortByTestCategory.CREATED_AT;

    @ApiProperty({
        enum: SortOrder,
        example: SortOrder.DESC,
        required: false,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;
}
