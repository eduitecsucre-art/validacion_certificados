import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Roles('SUPER_ADMIN', 'STAFF')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles('SUPER_ADMIN', 'STAFF')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles('SUPER_ADMIN', 'STAFF')
  @Post()
  create(@Body() body: CreateUserDto, @Request() req: any) {
    // STAFF solo puede crear estudiantes. Ignoramos lo que mande el
    // frontend en "role" si quien hace la petición no es SUPER_ADMIN,
    // para que nadie con rol STAFF pueda crearse a sí mismo (u a otro)
    // como SUPER_ADMIN o STAFF manipulando el request.
    const role = req.user.role === 'SUPER_ADMIN' ? body.role : 'STUDENT';
    return this.usersService.create({ ...body, role });
  }

  @Roles('SUPER_ADMIN')
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}