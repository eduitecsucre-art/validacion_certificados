import { IsString, IsEmail, IsOptional, MinLength, IsIn, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombres!: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido paterno es requerido' })
  apellidoPaterno!: string;

  @IsOptional()
  @IsString()
  apellidoMaterno?: string;

  @IsOptional()
  @IsString()
  ci?: string;

  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsIn(['SUPER_ADMIN', 'STAFF', 'STUDENT'], { message: 'Rol inválido' })
  role!: string;
}