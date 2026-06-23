import NavBar from '../components/NavBar';
import Header from '../components/Header';
import Experience from '../components/Experience';
import Education from '../components/Education';
import Projects from '../components/Projects';
import Skills from '../components/Skills';

export default function Page() {
  return (
    <>
      <NavBar />
      <main className="app-container">
        <Header />
        <Experience />
        <Education />
        <Projects />
        <Skills />
      </main>
    </>
  );
}
