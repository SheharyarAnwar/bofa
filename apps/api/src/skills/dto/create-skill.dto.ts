import { IsNotEmpty, IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreateSkillDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  estimatedEffortHours: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisiteIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resources?: string[];
}
