import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(['parent', 'player', 'admin', 'super_admin'])
  role: 'parent' | 'player' | 'admin' | 'super_admin' ;
}