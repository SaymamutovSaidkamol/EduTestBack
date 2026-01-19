import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateTestCategoryDto {
    @ApiProperty({ example: 'Matematika' })
    @IsString()
    categoryName: string;

    @ApiProperty({ example: 'matematika.jpg' })
    @IsString()
    image: string;
}
