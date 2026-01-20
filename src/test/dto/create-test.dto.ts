import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsString, ValidateNested } from "class-validator";

export class CreateOptionDto {
    @ApiProperty({ example: 'x² - 25' })
    @IsString()
    optionText: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    isCorrect: boolean;
}

export class CreateQuestionDto {
    @ApiProperty({ example: '(x + 5)(x - 5) ifodani soddalashtiring' })
    @IsString()
    questionText: string;

    @ApiProperty({ type: [CreateOptionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOptionDto)
    options: CreateOptionDto[];
}

export class CreateTestDto {

    @ApiProperty({ example: 'Matematika' })
    @IsString()
    title: string;

    @ApiProperty({ example: '8-sinf matematika: Algebraik ifodalarni soddalashtirish' })
    @IsString()
    description: string;

    @ApiProperty({ example: 'uuid()' })
    @IsString()
    categoryId: string;

    @IsString()
    teacherId: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    isActive: boolean;

    @ApiProperty({ type: [CreateQuestionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    questions: CreateQuestionDto[];
}
