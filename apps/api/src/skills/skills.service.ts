import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skill } from './entities/skill.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { ObjectId } from 'mongodb';

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



  async addPrerequisite(skillId: string, prerequisiteId: string): Promise<Skill> {
    const skill = await this.findOne(skillId);
    const prerequisite = await this.findOne(prerequisiteId);
    skill.prerequisites.push(prerequisite);
    return skill.save();
  }

  async populateSkills(): Promise<any> {
    const skills = [
      {
        name: "HTML",
        description: "The standard markup language for documents designed to be displayed in a web browser.",
        estimatedEffortHours: 20,
        prerequisites: [],
        resources: []
      },
      {
        name: "CSS",
        description: "A style sheet language used for describing the presentation of a document written in HTML.",
        estimatedEffortHours: 25,
        prerequisites: [],
        resources: []
      },
      {
        name: "JavaScript",
        description: "A versatile programming language primarily used for web development.",
        estimatedEffortHours: 40,
        prerequisites: [],
        resources: []
      },
      {
        name: "Frontend Development",
        description: "The practice of creating the visual and interactive aspects of a website.",
        estimatedEffortHours: 50,
        prerequisites: [],
        resources: []
      },
      {
        name: "Node.js",
        description: "A JavaScript runtime built on Chrome's V8 JavaScript engine.",
        estimatedEffortHours: 50,
        prerequisites: [],
        resources: []
      },
      {
        name: "Express",
        description: "A minimal and flexible Node.js web application framework.",
        estimatedEffortHours: 30,
        prerequisites: [],
        resources: []
      },
      {
        name: "Backend Development",
        description: "The server-side development that focuses on databases, server logic, and application architecture.",
        estimatedEffortHours: 70,
        prerequisites: [],
        resources: []
      }
    ];

    // Insert all skills into the collection
    const insertedSkills = await this.skillModel.insertMany(skills);

    // Update skills to establish prerequisites
    await this.skillModel.updateOne(
      { name: "Frontend Development" },
      { 
        $set: { 
          prerequisites: [
            new ObjectId(insertedSkills.find(s => s.name === "HTML")._id as string),
            new ObjectId(insertedSkills.find(s => s.name === "CSS")._id as string),
            new ObjectId(insertedSkills.find(s => s.name === "JavaScript")._id as string)
          ]
        } 
      }
    );

    await this.skillModel.updateOne(
      { name: "Node.js" },
      { 
        $set: { 
          prerequisites: [new ObjectId(insertedSkills.find(s => s.name === "JavaScript")._id as string)]
        } 
      }
    );

    await this.skillModel.updateOne(
      { name: "Backend Development" },
      { 
        $set: { 
          prerequisites: [new ObjectId(insertedSkills.find(s => s.name === "Node.js")._id as string)]
        } 
      }
    );

    await this.skillModel.updateOne(
      { name: "Express" },
      { 
        $set: { 
          prerequisites: [new ObjectId(insertedSkills.find(s => s.name === "Node.js")._id as string)]
        } 
      }
    );

    return this.findAll();
  }
}
