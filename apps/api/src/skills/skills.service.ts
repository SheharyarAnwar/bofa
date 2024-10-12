import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skill } from './entities/skill.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectModel(Skill.name) private skillModel: Model<Skill>,
  ) {}

  async create(createSkillDto: CreateSkillDto): Promise<Skill> {
    const createdSkill = new this.skillModel(createSkillDto);
    return createdSkill.save();
  }

  async findAll(): Promise<Skill[]> {
    return this.skillModel.find().exec();
  }

  async findOne(id: string): Promise<Skill> {
    const skill = await this.skillModel.findById(id).exec();
    if (!skill) {
      throw new NotFoundException(`Skill with ID "${id}" not found`);
    }
    return skill;
  }

  async update(id: string, updateSkillDto: UpdateSkillDto): Promise<Skill> {
    const updatedSkill = await this.skillModel.findByIdAndUpdate(id, updateSkillDto, { new: true }).exec();
    if (!updatedSkill) {
      throw new NotFoundException(`Skill with ID "${id}" not found`);
    }
    return updatedSkill;
  }

  async remove(id: string): Promise<void> {
    const result = await this.skillModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Skill with ID "${id}" not found`);
    }
  }

  async addSubSkill(skillId: string, subSkillId: string): Promise<Skill> {
    const skill = await this.findOne(skillId);
    const subSkill = await this.findOne(subSkillId);
    skill.subSkills.push(subSkill);
    return skill.save();
  }

  async addRelatedSkill(skillId: string, relatedSkillId: string): Promise<Skill> {
    const skill = await this.findOne(skillId);
    const relatedSkill = await this.findOne(relatedSkillId);
    skill.relatedSkills.push(relatedSkill);
    return skill.save();
  }
}
