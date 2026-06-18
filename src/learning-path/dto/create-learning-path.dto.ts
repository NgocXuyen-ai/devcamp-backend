import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CareerField, LessonLevel } from '../../common/enums';

export class CreateLearningPathDto {
  @IsNotEmpty() @IsString() title!: string;

  @IsOptional() @IsString() description?: string;

  @IsNotEmpty() @IsEnum(CareerField) field!: CareerField;

  @IsNotEmpty() @IsEnum(LessonLevel) level!: LessonLevel;
}
