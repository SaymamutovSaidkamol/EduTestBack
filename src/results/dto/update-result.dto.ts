import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateResultDto {
    @IsOptional()
    @IsString()
    studentId?: string;

    @ApiProperty({ example: "uuid()" })
    @IsOptional()
    @IsString()
    testId?: string;

    @ApiProperty({ example: "uuid()" })
    @IsOptional()
    @IsString()
    variantId?: string;

    @IsNumber()
    @IsOptional()
    score?: number;
}
