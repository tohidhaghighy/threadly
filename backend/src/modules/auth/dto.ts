import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "علی رضایی" })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: "ali@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: "ali@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  password!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: "password123" })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: "newpassword123" })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}

