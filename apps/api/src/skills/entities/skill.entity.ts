import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Skill extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  estimatedEffortHours: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Skill' }] })
  subSkills: Skill[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Skill' }] })
  relatedSkills: Skill[];

  @Prop([String])
  resources: string[];
}

export const SkillSchema = SchemaFactory.createForClass(Skill);
