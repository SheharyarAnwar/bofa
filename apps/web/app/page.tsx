import Skills from './components/Skills/Skills';
import styles from './page.module.css';
import './globals.css';


const RootPage = ({ params }: { params: { forTest?: boolean } }) => {
  return (
    <main className={styles.main}>
      <h2 className='mx-auto'>Skill Visualizer</h2>
      <Skills />
    </main>
  );
};

export default RootPage;
