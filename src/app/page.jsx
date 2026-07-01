import Reveal from '../components/Reveal';
import Header from '../components/Header';
import Experience from '../components/Experience';
import Education from '../components/Education';
import Projects from '../components/Projects';
import Skills from '../components/Skills';

export default function Page() {
  return (
    <>
      <main className="app-container">
        <Reveal offset={30}><Header /></Reveal>
        <Reveal offset={50} delay={0.15}><Experience /></Reveal>
        <Reveal offset={50} delay={0.15}><Education /></Reveal>
        <Reveal offset={50} delay={0.15}><Projects /></Reveal>
        <Reveal offset={50} delay={0.15}><Skills /></Reveal>
      </main>
    </>
  );
}
