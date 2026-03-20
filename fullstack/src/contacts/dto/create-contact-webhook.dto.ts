import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { normalizeString } from '../../common/utils/normalize-string.util';

class ContactWebhookPayloadDto {
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  public fullName: string;

  @Transform(({ value }: { value: unknown }) => normalizeString(value, true))
  @IsEmail()
  @MaxLength(180)
  public email: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  public phone?: string;

  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  public message: string;
}

export class CreateContactWebhookDto {
  @Transform(({ value }: { value: unknown }) => normalizeString(value, true))
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  public source: string;

  @Transform(({ value }: { value: unknown }) => normalizeString(value, true))
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  public eventType: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => ContactWebhookPayloadDto)
  public payload: ContactWebhookPayloadDto;
}
