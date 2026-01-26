import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateResultDto {
    @IsString()
    studentId: string;

    @ApiProperty({ example: "uuid()" })
    @IsString()
    testId: string;

    @ApiProperty({ example: "uuid()" })
    @IsString()
    variantId: string;

    @IsNumber()
    @IsOptional()
    score?: number;
}
