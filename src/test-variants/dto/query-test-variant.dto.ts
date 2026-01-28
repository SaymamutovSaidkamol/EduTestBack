import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export enum SortByTestVariant {
    NAME = 'name',
    TEST_ID = 'testId',
    CREATED_AT = 'createdAt',
    ID = 'id',
}

export class QueryTestVariantDto {
    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsString()
    testId?: string;

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
        enum: SortByTestVariant,
        example: SortByTestVariant.CREATED_AT,
        required: false,
    })
    @IsOptional()
    @IsEnum(SortByTestVariant)
    sortBy?: SortByTestVariant = SortByTestVariant.CREATED_AT;

    @ApiProperty({
        enum: SortOrder,
        example: SortOrder.DESC,
        required: false,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;
}
