'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ForceGraph2D } from 'react-force-graph';
import { Skill } from '../../types/skill';
import { Select, Button } from 'antd';

const { Option } = Select;

const API_URL = 'http://localhost:3000/skills';

interface GraphData {
  nodes: { id: string; name: string }[];
  links: { source: string; target: string }[];
}

const Skills: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [desiredSkills, setDesiredSkills] = useState<string[]>([]);
  const [learningPath, setLearningPath] = useState<string[]>([]);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await axios.get<Skill[]>(API_URL);
      const skills = response.data;
      const nodes = skills.map(skill => ({ id: skill.id, name: skill.name }));
      const links = skills.flatMap(skill => 
        (skill.subSkills || []).map(subSkillId => ({ source: skill.id, target: subSkillId }))
          .concat((skill.relatedSkills || []).map(relatedSkillId => ({ source: skill.id, target: relatedSkillId })))
      );
      setGraphData({ nodes, links });
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const calculateLearningPath = () => {
    const graph = buildGraph(graphData);
    const paths = dijkstra(graph, currentSkills, desiredSkills);
    setLearningPath(paths);
  };

  const buildGraph = (data: GraphData) => {
    const graph: { [key: string]: { [key: string]: number } } = {};
    data.links.forEach(link => {
      if (!graph[link.source]) graph[link.source] = {};
      //@ts-ignore
      graph[link.source][link.target] = 1; // Assuming each edge has a weight of 1
    });
    return graph;
  };

  const dijkstra = (graph: { [key: string]: { [key: string]: number } }, startSkills: string[], endSkills: string[]) => {
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const queue: string[] = [];

    // Initialize distances and queue
    for (const node in graph) {
      distances[node] = Infinity;
      previous[node] = null;
      queue.push(node);
    }

    // Set the distance for current skills to 0
    startSkills.forEach(skill => {
      distances[skill] = 0;
    });

    while (queue.length > 0) {
      // Get the node with the smallest distance
      const currentNode = queue.reduce((minNode, node) => 
      //@ts-ignore

        distances[node] < distances[minNode] ? node : minNode
      );

      // Remove the current node from the queue
      queue.splice(queue.indexOf(currentNode), 1);

      // If the current node is one of the desired skills, reconstruct the path
      if (endSkills.includes(currentNode)) {
        return reconstructPath(previous, currentNode);
      }

      // Explore neighbors
      for (const neighbor in graph[currentNode]) {
      //@ts-ignore

        const alt = distances[currentNode] + graph[currentNode][neighbor];
      //@ts-ignore

        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = currentNode;
        }
      }
    }

    return []; // Return an empty path if no path is found
  };

  const reconstructPath = (previous: { [key: string]: string | null }, endNode: string) => {
    const path: string[] = [];
    let currentNode: string | null = endNode;

    while (currentNode) {
      path.unshift(currentNode);
      //@ts-ignore

      currentNode = previous[currentNode];
    }

    return path;
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <h1>Skills Graph</h1>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel={(node) => node.name} // Change to display node name as text
        nodeAutoColorBy="id"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.001}
      />
      <div>
        <h2>Select Current Skills</h2>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select your current skills"
          onChange={setCurrentSkills}
        >
          {graphData.nodes.map(skill => (
            <Option key={skill.id} value={skill.id}>
              {skill.name}
            </Option>
          ))}
        </Select>
      </div>
      <div>
        <h2>Select Desired Skills</h2>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select your desired skills"
          onChange={setDesiredSkills}
        >
          {graphData.nodes.map(skill => (
            <Option key={skill.id} value={skill.id}>
              {skill.name}
            </Option>
          ))}
        </Select>
      </div>
      <Button type="primary" onClick={calculateLearningPath} style={{ marginTop: '16px' }}>
        Calculate Learning Path
      </Button>
      {learningPath.length > 0 && (
        <div>
          <h2>Learning Path</h2>
          <ul>
            {learningPath.map(skill => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Skills;