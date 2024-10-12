'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ForceGraph2D } from 'react-force-graph';
import { Skill } from '../../types/skill';

const API_URL = 'http://localhost:3000/skills'; // Adjust this to your API URL

interface GraphData {
  nodes: { id: string; name: string }[];
  links: { source: string; target: string }[];
}

const Skills: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });

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

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <h1>Skills Graph</h1>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="name"
        nodeAutoColorBy="id"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.001}
      />
    </div>
  );
};

export default Skills;
