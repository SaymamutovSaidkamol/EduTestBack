import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
    @ApiProperty({ example: 'comment' })
    @IsOptional()
    @IsString()
    commentText?: string;
}
