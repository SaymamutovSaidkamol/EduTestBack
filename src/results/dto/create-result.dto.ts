import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";


export enum IsCorrect {
    PENDING = 'PENDING',
    CORRECT = 'CORRECT',
    WRONG = 'WRONG'
}

export enum ResultStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED',
    TIMEOUT = 'TIMEOUT'
}

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

    @IsEnum(ResultStatus)
    @IsOptional()
    status?: ResultStatus;
}
export class CreateResultAnswerDto {
    @ApiProperty({ example: 'uuid()' })
    @IsString()
    resultId: string;

    @ApiProperty({ example: 'uuid()' })
    @IsString()
    questionId: string;

    @ApiProperty({ example: 'uuid()' })
    @IsString()
    resultAnswerId: string; // frontend dan ResultAnswer id yuboriladi

    @ApiProperty({ example: 'uuid()' })
    @IsString()
    selectOptionId: string;

    @IsEnum(IsCorrect)
    @IsOptional()
    isCorrect?: IsCorrect;
}

export class FinishTestDto {
    @ApiProperty({ example: 'uuid()' })
    @IsString()
    resultId: string;
}