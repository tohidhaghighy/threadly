import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class CreateReplyDto {
  @ApiProperty({ example: "اگر تصویر ندارید، اول کابل برق کارت و کابل تصویر را چک کنید و CMOS را ریست کنید." })
  @IsString()
  @MinLength(1)
  content!: string;
}

