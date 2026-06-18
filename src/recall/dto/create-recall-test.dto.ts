import { IsMongoId } from 'class-validator';

export class CreateRecallTestDto {
  @IsMongoId()
  lockedNodeId!: string;
}
