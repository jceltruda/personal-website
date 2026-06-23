import NavBar from '../components/NavBar';
import Reveal from '../components/Reveal';
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
        <Reveal><Header /></Reveal>
        <Reveal><Experience /></Reveal>
        <Reveal><Education /></Reveal>
        <Reveal><Projects /></Reveal>
        <Reveal><Skills /></Reveal>
      </main>
    </>
  );
}
