import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateCommentDto {
    @IsString()
    studentId: string;

    @ApiProperty({ example: 'uuid()' })
    @IsString()
    testId: string;

    @ApiProperty({ example: 'comment' })
    @IsString()
    commentText: string;
}
