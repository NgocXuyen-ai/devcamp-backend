import { IsBooleanString, IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '../../common/enums';

export class GetNotificationsQueryDto {
  @IsOptional()
  @IsBooleanString()
  read?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
