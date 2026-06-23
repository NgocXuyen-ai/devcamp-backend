import { IsString, Length } from 'class-validator';

export class RedeemCouponDto {
  @IsString()
  @Length(3, 32)
  code!: string;
}

