import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTestDto } from './create-test.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateTestDto {

    @ApiProperty({ example: 'Matematika' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ example: '8-sinf matematika: Algebraik ifodalarni soddalashtirish' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
