import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { RoleUser } from 'src/enum/enums';

export class UpdateUserDto {
    @ApiProperty({ example: 'Saidkamol', required: false })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({ example: 'saymamutov', required: false })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({ example: 'saymamutovsaidkamol.jpg', required: false })
    @IsOptional()
    @IsString()
    image?: string;
}

export class UpdateUserForAdminDto {
    @ApiProperty({ example: 'Saidkamol', required: false })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({ example: 'saymamutov', required: false })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({ example: 'saymamutovsaidkamol@gmail.com', required: false })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({ example: RoleUser.STUDENT, required: false })
    @IsOptional()
    @IsEnum(RoleUser)
    role?: RoleUser;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean = false;
}


export class resetPasswordDto {
    @ApiProperty({ example: 'Saidkamol_2006', required: false })
    @IsOptional()
    @IsString()
    password?: string;
}
