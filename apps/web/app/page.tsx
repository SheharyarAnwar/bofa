import Skills from './components/Skills/Skills';
import styles from './page.module.css';


const RootPage = ({ params }: { params: { forTest?: boolean } }) => {
  return (
    <main className={styles.main}>
      <Skills />
    </main>
  );
};

export default RootPage;
