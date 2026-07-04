import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BattleMode } from '../../common/enums';
import { CareerField } from '../../common/enums/';

export class CreateBattleDto {
  @IsNotEmpty()
  @IsEnum(BattleMode, {
    message: 'mode must be SPEED or PERFORMANCE',
  })
  mode!: BattleMode;

  @IsNotEmpty()
  @IsEnum(CareerField, {
    message: 'field must be frontend, backend, or fullstack',
  })
  field!: CareerField;

  @IsOptional()
  @IsString()
  opponentId?: string;
}
