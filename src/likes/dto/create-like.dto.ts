import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateLikeDto {
    @IsString()
    studentId: string;

    @IsString()
    isLike: boolean;

    @ApiProperty({ example: "uuid()" })
    @IsString()
    testId: string;
}
