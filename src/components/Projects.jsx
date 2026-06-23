const projects = [
  {
    id: 1,
    title: "Rehab Games",
    description: "Turns rehab exercises into fun retro games",
    tags: ["JavaScript", "Django", "MediaPipe", "Gunicorn"],
    link: "https://rehab-games.onrender.com/"
  },
  {
    id: 2,
    title: "Lung Cancer Detection Using CNN",
    description: "CNN for lung cancer detection from CT scans",
    tags: ["Python", "PyTorch"],
    link: "https://github.com/jceltruda/CNN-for-Lung-Cancer-Classification"
  },
  {
    id: 3,
    title: "FinGPT - Transformer Prediction",
    description: "Fine-tuning LLMs for stock market prediction",
    tags: ["Python", "PyTorch", "Transformers"],
    link: "https://github.com/jceltruda/FinGPT-TransformerPrediction"
  }
];

export default function Projects() {
  return (
    <section id="projects" className="animate-fade-in delay-400">
      <h2>Projects</h2>
      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-header">
              {project.link ? (
                <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-title" style={{ color: 'inherit', textDecoration: 'none' }}>{project.title}</a>
              ) : (
                <span className="project-title">{project.title}</span>
              )}
              <span className="project-status"></span>
            </div>
            <p className="project-desc">{project.description}</p>
            <div className="project-tags">
              {project.tags.map((tag, idx) => (
                <span key={idx} className="badge">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
