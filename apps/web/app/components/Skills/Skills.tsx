//@ts-nocheck
'use client';
import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import { ForceGraph2D } from 'react-force-graph';
import { Skill } from '../../types/skill';
import { Select, Button, Form, Col, Row } from 'antd';

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/skills`;
interface GraphData {
  nodes: { id: string; name: string }[];
  links: { source: string; target: string }[];
}

const Skills: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [graphDataOperational, setGraphDataOperational] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [form] = Form.useForm();
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphWidth, setGraphWidth] = useState(0);
  const [graphHeight, setGraphHeight] = useState(0);
  const [learningPath, setLearningPath] = useState<Skill[]>([]);
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [desiredSkills, setDesiredSkills] = useState<string[]>([]);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await axios.get<Skill[]>(API_URL);
      setAllSkills(response.data);
      const skills = response.data;
      const nodes = skills.map((skill) => ({
        id: skill._id,
        name: skill.name,
      }));

      const links = skills.flatMap((skill) =>
        (skill.prerequisites || []).map((prerequisiteId) => ({
          source: prerequisiteId,
          target: skill._id,
        })),
      );

      setGraphData(structuredClone({ nodes, links }));
      setGraphDataOperational(structuredClone({ nodes, links }));
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const findAllPaths = (
    startNodes: string[],
    endNodes: string[],
  ): string[][] => {
    const paths: string[][] = [];

    const dfs = (
      currentNode: string,
      targetNode: string,
      visited: Set<string>,
      path: string[],
    ) => {
      visited.add(currentNode);
      path.push(currentNode);

      if (currentNode === targetNode) {
        paths.push([...path]);
      } else {
        const neighbors = graphDataOperational.links
          .filter((link) => link.source === currentNode)
          .map((link) => link.target as string);

        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            dfs(neighbor, targetNode, new Set(visited), [...path]);
          }
        }
      }
    };

    for (const startNode of startNodes) {
      for (const endNode of endNodes) {
        dfs(startNode, endNode, new Set(), []);
      }
    }

    return paths;
  };

  const findShortestPath = (paths: string[][]) => {
    // Now each path is an array of skill ids
    // we need to find the shortest path based on the difference between the estimatedEffortHours of current node to the next
    // we can get the estimatedEffortHours from the allSkills array

    // first calculate the length of each path
    let shortestPath = { length: Infinity, path: [] };

    const findPathLength = (path: string[]) => {
      let length = 0;
      for (let i = 1; i < path.length; i++) {
        const currentSkill = allSkills.find((s) => s._id === path[i]);
        if (currentSkill) {
          length += currentSkill.estimatedEffortHours;
        }
      }
      return length;
    };

    paths.forEach((path) => {
      const length = findPathLength(path);
      if (length < shortestPath.length) {
        shortestPath = { length, path: path as any };
      }
    });

    return shortestPath.path;
  };

  const getPrerequisites = (skillId: string, allSkills: Skill[]): string[] => {
    const skill = allSkills.find((s) => s._id === skillId);
    if (!skill) return [];

    const prerequisites: string[] = [];
    const queue = [...skill.prerequisites];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (!prerequisites.includes(currentId)) {
        prerequisites.push(currentId);
        const currentSkill = allSkills.find((s) => s._id === currentId);
        if (currentSkill) {
          queue.push(...currentSkill.prerequisites);
        }
      }
    }

    return prerequisites;
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const currentSkills = values.currentSkills;
      const desiredSkills = values.desiredSkills;
      setCurrentSkills(currentSkills);
      setDesiredSkills(desiredSkills);
      const path = findShortestPath(
        findAllPaths(currentSkills, desiredSkills),
      ) as string[];
      if (path.length === 0) {
        const allRequiredSkillIds = desiredSkills.flatMap((skillId) => {
          return [skillId, ...getPrerequisites(skillId, allSkills)];
        });
        console.log({allRequiredSkillIds})
        const uniqueSkillIds = [...new Set(allRequiredSkillIds)];

        const learningPathSkills = uniqueSkillIds
          .map((id) => allSkills.find((skill) => skill._id === id))
          .filter((skill): skill is Skill => skill !== undefined);

        const sortedLearningPath = learningPathSkills;

        setLearningPath(sortedLearningPath);
      } else {
        const skills = path.map((p) =>
          allSkills.find((s) => p.includes(s._id)),
        );
        setLearningPath(skills as any);
      }

      // setLearningPath(learningPath);
    });
  };

  const effectiveLearningPath = useMemo(() => {
    return learningPath.filter((skill) => !currentSkills.includes(skill?._id));
  }, [learningPath, currentSkills]);

  const totalDuration = effectiveLearningPath.reduce(
    (acc, skill) => acc + skill.estimatedEffortHours,
    0,
  );

  useLayoutEffect(() => {
    if (graphContainerRef.current) {
      setGraphWidth(graphContainerRef.current.clientWidth - 24);
      setGraphHeight(graphContainerRef.current.clientHeight - 24);
    }
  }, []);

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Form form={form} className="flex flex-col gap-4 mt-4 ">
            <Form.Item label={<p>Current Skills</p>} name="currentSkills">
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
            <Form.Item
              label={<p>Select Desired Skills</p>}
              name="desiredSkills"
            >
              <Select
                mode="multiple"
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                maxCount={1}
                placeholder="Select Desired Skills"
                options={allSkills.map((skill) => ({
                  label: skill.name,
                  value: skill._id,
                }))}
              />
            </Form.Item>

            <Button type="primary" onClick={handleSubmit}>
              Generate Learning Path
            </Button>
          </Form>
        </Col>
        {effectiveLearningPath.length > 0 && (
          <Col span={12} className="flex flex-col gap-4 mt-4 ">
            <div className="flex-1 min-h-0 overflow-auto">
              z
              <h2 className="text-lg text-gray-950 font-bold">
                Your Learning Path
              </h2>
              <h3 className="text-gray-800">
                Total Duration: {totalDuration} hours
              </h3>
              {effectiveLearningPath.map((skill) => (
                <>
                  <div className="p-4 bg-gray-200 rounded-lg mb-4">
                    <p className="text-gray-800" key={skill?._id}>
                      <strong>Skill Name:</strong> {skill?.name}
                    </p>
                    <p className="text-gray-800">
                      <strong>Estimated Effort Hours:</strong> {skill?.estimatedEffortHours} hrs
                    </p>
                  </div>
                </>
              ))}
            </div>
          </Col>
        )}
      </Row>

      <div ref={graphContainerRef} className="p-6 flex-1">
        <ForceGraph2D
          graphData={graphData}
          width={graphWidth}
          height={graphHeight}
          nodeAutoColorBy="group"
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(
              (n) => n + fontSize * 0.2,
            );

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            //@ts-ignore
            ctx.fillRect(
              node.x - bckgDimensions[0] / 2,
              node.y - bckgDimensions[1] / 2,
              ...bckgDimensions,
            );

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.color;
            //@ts-ignore
            ctx.fillText(label, node.x, node.y);

            node.__bckgDimensions = bckgDimensions;
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            const bckgDimensions = node.__bckgDimensions;
            //@ts-ignore
            bckgDimensions &&
              ctx.fillRect(
                node.x - bckgDimensions[0] / 2,
                node.y - bckgDimensions[1] / 2,
                ...bckgDimensions,
              );
          }}
        />
      </div>
    </>
  );
};

export default Skills;
