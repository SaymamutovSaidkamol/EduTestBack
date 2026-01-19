import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { RoleUser } from "src/enum/enums";

export class RegisterUserDto {
    @ApiProperty({ example: 'Saidkamol', required: true })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'saymamutov', required: true })
    @IsString()
    lastName: string;

    @ApiProperty({ example: 'saymamutovsaidkamol@gmail.com', required: true })
    @IsString()
    email: string;

    @ApiProperty({ example: 'Saidkamol_2006', required: true })
    @IsString()
    password: string;

    @ApiProperty({ example: 'saymamutovsaidkamol.jpg', required: false })
    @IsString()
    image: string;

    @ApiProperty({ example: RoleUser.STUDENT })
    @IsOptional()
    @IsEnum(RoleUser)
    role: RoleUser;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean = false;
}

export class LoginUserDto {

    @ApiProperty({ example: 'saymamutovsaidkamol@gmail.com', required: true })
    @IsString()
    email: string;

    @ApiProperty({ example: 'Saidkamol_2006', required: true })
    @IsString()
    password: string;

}


export class SendOTPUserDto {

    @ApiProperty({ example: 'saymamutovsaidkamol@gmail.com', required: true })
    @IsString()
    email: string;
}

export class VerifyOTPUserDto {

    @ApiProperty({ example: 'saymamutovsaidkamol@gmail.com', required: true })
    @IsString()
    email: string;

    @ApiProperty({ example: '123456', required: true })
    @IsNumber()
    otp: number;

}


export class ResetPasswordUserDto {

    @ApiProperty({ example: 'Saidkamol_2006', required: true })
    @IsString()
    password: string;

    @ApiProperty({ example: '123456', required: true })
    @IsNumber()
    otp: number;

}


export function isValidPassword(password: string): boolean {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    return password.length >= minLength && hasUpperCase && hasNumber && hasSymbol;
}

export class AddAdminUserDto {
    @ApiProperty({ example: 'Saidkamol', required: true })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'saymamutov', required: true })
    @IsString()
    lastName: string;

    @ApiProperty({ example: 'saymamutovsaidkamol@gmail.com', required: true })
    @IsString()
    email: string;

    @ApiProperty({ example: 'Saidkamol_2006', required: true })
    @IsString()
    password: string;

    @ApiProperty({ example: 'saymamutovsaidkamol.jpg', required: false })
    @IsString()
    image: string;

    @IsOptional()
    @IsEnum(RoleUser)
    role?: RoleUser;

    @ApiProperty({ example: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean = false;
}