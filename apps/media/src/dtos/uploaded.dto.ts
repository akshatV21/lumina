import { IsNotEmpty, IsString } from 'class-validator'

export class UploadedDto {
  @IsNotEmpty()
  @IsString()
  path: string
}
