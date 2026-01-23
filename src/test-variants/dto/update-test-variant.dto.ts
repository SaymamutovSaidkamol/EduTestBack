import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateTestVariantDto {


    @ApiProperty({ example: "uuid()" })
    @IsOptional()
    @IsString()
    testId?: string;

    @ApiProperty({ example: "A, B, C, D" })
    @IsOptional()
    @IsString()
    name?: string;

}
