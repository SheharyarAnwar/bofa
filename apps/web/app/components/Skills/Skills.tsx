'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import { ForceGraph2D } from 'react-force-graph';
import { Skill } from '../../types/skill';
import { Select, Button, Form, Col } from 'antd';

const API_URL = 'http://localhost:3000/skills';

interface GraphData {
  nodes: { id: string; name: string }[];
  links: { source: string; target: string }[];
}

const Skills: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [form] = Form.useForm();
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphWidth, setGraphWidth] = useState(0);
  const [graphHeight, setGraphHeight] = useState(0);
  const [learningPath, setLearningPath] = useState<string[]>([]);

  useEffect(() => {
    fetchSkills();
  }, []);

  const findOptimalLearningPath = (graphData: GraphData, currentSkills: string[], desiredSkills: string[]): string[] => {
    const queue: { skill: string; path: string[] }[] = [];
    const visited = new Set<string>();
  
    // Initialize the queue with current skills
    currentSkills.forEach(skill => {
      queue.push({ skill, path: [skill] });
      visited.add(skill);
    });
  
    while (queue.length > 0) {
      const { skill, path } = queue.shift()!;
  
      // Check if the current skill is in the desired skills
      if (desiredSkills.includes(skill)) {
        return path; // Return the path if a desired skill is found
      }
  
      // Find related skills
      const relatedLinks = graphData.links.filter(link => link.source === skill);
      relatedLinks.forEach(link => {
        const nextSkill = link.target;
        if (!visited.has(nextSkill)) {
          visited.add(nextSkill);
          queue.push({ skill: nextSkill, path: [...path, nextSkill] });
        }
      });
    }
  
    return []; // Return an empty array if no path is found
  };

  const fetchSkills = async () => {
    try {
      const response = await axios.get<Skill[]>(API_URL);
      setAllSkills(response.data);
      const skills = response.data;
      const nodes = skills.map((skill) => ({ id: skill._id, name: skill.name }));
  
      const links = skills.flatMap((skill) =>
        (skill.subSkills || []).map((subSkillId) => ({
          source: skill._id,
          target: subSkillId,
          type: 'subSkill', // Indicate this is a subSkill relationship
        }))
        .concat(
          (skill.relatedSkills || []).map((relatedSkillId) => ({
            source: skill._id,
            target: relatedSkillId,
            type: 'relatedSkill', // Indicate this is a relatedSkill relationship
          })),
        ),
      );
  
      setGraphData({ nodes, links });
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const currentSkills = values.currentSkills; // Get current skills from form
      const desiredSkills = values.desiredSkills; // Get desired skills from form
  
      // Calculate the optimal learning path
      // const learningPath = findOptimalLearningPath(graphData, currentSkills, desiredSkills);
  
      // // Display the learning path
      console.log({graphData})
      console.log('Optimal Learning Path:', learningPath);
      setLearningPath(learningPath);
    });
  };

  useLayoutEffect(() => {
    if (graphContainerRef.current) {
      // get exact height and width of the container considering padding
      setGraphWidth(graphContainerRef.current.clientWidth - 24);
      setGraphHeight(graphContainerRef.current.clientHeight - 24);
    }
  }, []);


  return (
    <>
      <Form form={form} className="flex flex-col gap-4 mt-4 ">
        <Col span={12}>
          <Form.Item
            label={<p >Current Skills</p>}
            name="currentSkills"
          >
            <Select
              mode="multiple"
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              placeholder="Select Current Skills"
              options={allSkills.map((skill) => ({
                label: skill.name,
                value: skill._id,
              }))}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<p >Select Desired Skills</p>}
            name="desiredSkills"
          >
            <Select
              mode="multiple"
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              placeholder="Select Desired Skills"
              options={allSkills.map((skill) => ({
                label: skill.name,
                value: skill._id,
              }))}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Button type="primary" onClick={handleSubmit}>
            Generate Learning Path
          </Button>
        </Col>
      </Form>
      <div ref={graphContainerRef} className='p-6 flex-1'>
        <ForceGraph2D
          graphData={graphData}
          width={graphWidth}
          height={graphHeight}
          nodeAutoColorBy="group"
          linkCanvasObject={(link, ctx) => {
            ctx.beginPath();
            //@ts-ignore
            ctx.moveTo(link.source.x, link.source.y);
            //@ts-ignore
            ctx.lineTo(link.target.x, link.target.y);
        
            // Set the stroke style based on the type of link
            if (link.type === 'subSkill') {
              ctx.strokeStyle = 'grey'; // Solid line for subSkills
              ctx.lineWidth = 1; // Solid line width
              ctx.stroke();
            } else if (link.type === 'relatedSkill') {
              ctx.strokeStyle = 'grey'; // Dashed line for relatedSkills
              ctx.lineWidth = 1; // Dashed line width
              ctx.setLineDash([5, 5]); // Set dash pattern
              ctx.stroke();
              ctx.setLineDash([]); // Reset dash pattern for future lines
            }
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12/globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            //@ts-ignore
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.color;
            //@ts-ignore
            ctx.fillText(label, node.x, node.y);
            
            node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            const bckgDimensions = node.__bckgDimensions;
            //@ts-ignore
            bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
          }}
        />
      
      
      </div>
      
    </>
  );
};

export default Skills;
