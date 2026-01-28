import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export enum SortByTest {
    TITLE = 'title',
    CREATED_AT = 'createdAt',
    ID = 'id',
}

export class QueryTestDto {
    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiProperty({
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    isActive?: boolean;

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
        enum: SortByTest,
        example: SortByTest.CREATED_AT,
        required: false,
    })
    @IsOptional()
    @IsEnum(SortByTest)
    sortBy?: SortByTest = SortByTest.CREATED_AT;

    @ApiProperty({
        enum: SortOrder,
        example: SortOrder.DESC,
        required: false,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;
}
