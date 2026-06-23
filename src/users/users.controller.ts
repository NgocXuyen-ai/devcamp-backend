import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create({
      username: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
    });
  }
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
