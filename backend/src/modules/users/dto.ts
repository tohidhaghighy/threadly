import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ nullable: true, example: "09123456789" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "IR120170000000100000000001" })
  @IsOptional()
  @IsString()
  @MaxLength(34)
  bankShaba?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "6037991234567890" })
  @IsOptional()
  @IsString()
  @MaxLength(24)
  cardNumber?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "1990-05-15" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  birthDate?: string | null;
}
