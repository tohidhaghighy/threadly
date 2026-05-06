import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class CreateThreadDto {
  @ApiProperty({ example: "سیستم بعد از نصب کارت گرافیک بوت نمی‌شود" })
  @IsString()
  @MinLength(10)
  title!: string;

  @ApiProperty({ example: "بعد از نصب RTX 4080 سیستم روشن می‌شود ولی تصویر نمی‌آید. پاور ۷۵۰ وات است..." })
  @IsString()
  @MinLength(10)
  content!: string;

  @ApiProperty({ example: "Hardware" })
  @IsString()
  category!: string;

  @ApiProperty({ example: ["gpu", "psu", "troubleshooting"] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @ApiPropertyOptional({ example: "fa", enum: ["fa", "en"] })
  @IsOptional()
  @IsIn(["fa", "en"])
  language?: "fa" | "en";
}

