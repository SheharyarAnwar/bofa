import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateSkillDto } from './create-skill.dto';

export class UpdateSkillDto extends PartialType(CreateSkillDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  estimatedEffortHours?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subSkillIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedSkillIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resources?: string[];
}
