import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';


@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  findAll() {
    return this.skillsService.findAll();
  }
  
  @Post()
  create(@Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.create(createSkillDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillsService.update(id, updateSkillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skillsService.remove(id);
  }

  @Post(':id/sub-skills')
  addSubSkill(@Param('id') id: string, @Body('subSkillId') subSkillId: string) {
    return this.skillsService.addSubSkill(id, subSkillId);
  }

  @Post(':id/related-skills')
  addRelatedSkill(@Param('id') id: string, @Body('relatedSkillId') relatedSkillId: string) {
    return this.skillsService.addRelatedSkill(id, relatedSkillId);
  }
}
