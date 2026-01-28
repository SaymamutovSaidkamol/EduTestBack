import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RoleUser } from 'src/enum/enums';

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export enum SortByUser {
    FIRST_NAME = 'firstName',
    LAST_NAME = 'lastName',
    EMAIL = 'email',
    CREATED_AT = 'createdAt',
    ID = 'id',
}

export class QueryUserDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({ enum: RoleUser, required: false })
    @IsOptional()
    @IsEnum(RoleUser)
    role?: RoleUser;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    page?: number = 1;

    @ApiProperty({ example: 10, required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    limit?: number = 10;

    @ApiProperty({ enum: SortByUser, example: SortByUser.CREATED_AT, required: false })
    @IsOptional()
    @IsEnum(SortByUser)
    sortBy?: SortByUser = SortByUser.CREATED_AT;

    @ApiProperty({ enum: SortOrder, example: SortOrder.DESC, required: false })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;
}
