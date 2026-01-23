import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateTestVariantDto {

    @ApiProperty({ example: "uuid()" })
    @IsString()
    testId: string;

    @ApiProperty({ example: "A, B, C, D" })
    @IsString()
    name: string;

}
