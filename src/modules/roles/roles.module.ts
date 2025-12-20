import { Module } from '@nestjs/common';
import { RolesService } from 'src/modules/roles/roles.service';
import { RolesController } from 'src/modules/roles/roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/modules/roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [TypeOrmModule, RolesService],
})
export class RolesModule {}
