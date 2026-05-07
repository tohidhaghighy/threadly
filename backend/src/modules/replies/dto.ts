import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, MaxLength, MinLength } from "class-validator";
import { REPLY_REACTION_EMOJIS } from "./reply-interactions.constants";

export class CreateReplyDto {
  @ApiProperty({ example: "اگر تصویر ندارید، اول کابل برق کارت و کابل تصویر را چک کنید و CMOS را ریست کنید." })
  @IsString()
  @MinLength(1)
  content!: string;
}

export class ToggleReactionDto {
  @ApiProperty({ example: "👍", enum: [...REPLY_REACTION_EMOJIS] })
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  @IsIn([...REPLY_REACTION_EMOJIS])
  emoji!: string;
}

