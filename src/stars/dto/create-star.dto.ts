import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

export class CreateStarDto {
    @IsString()
    @IsNotEmpty()
    studentId: string;

    @ApiProperty({
        example: 'uuid()'
    })
    @IsString()
    @IsNotEmpty()
    testId: string;

    @ApiProperty({
        example: 4.5,
        description: '0.5 qadam bilan, maksimum 5'
    })
    @IsNumber({ maxDecimalPlaces: 1 })
    @Min(0.5)
    @Max(5)
    star: number;
}
