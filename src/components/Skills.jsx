const skills = [
  "Python", "Java", "C++", "C", "JavaScript", "HTML/CSS", "R", "SQL", 
  "REST APIs", "PostgreSQL", "Docker", "AWS", "Git", "Linux", "NodeJS", 
  "Bootstrap", "Django", "PyTorch", "LangChain", "Transformers", "NumPy", 
  "Pandas", "OpenCV", "Matplotlib", "Dart", "Flutter", "LaTex", "Power BI"
];

export default function Skills() {
  return (
    <section id="skills">
      <h2>Skills</h2>
      <div className="skills-container">
        {skills.map((skill, index) => (
          <span key={index} className="skill-tag">
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
}
