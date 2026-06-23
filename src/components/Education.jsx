import Image from 'next/image';

const education = [
  {
    id: 1,
    school: "Rensselaer Polytechnic Institute",
    date: "2026 - (Dec 2026)",
    degree: "M.S. Computer Science",
    gpa: "GPA: 4.0 / 4.0",
    logo: "/logos/rpi.jpg",
    link: "https://www.rpi.edu/"
  },
  {
    id: 2,
    school: "Rensselaer Polytechnic Institute",
    date: "2022 - 2025",
    degree: "B.S. Computer Science",
    gpa: "GPA: 3.62 / 4.0",
    logo: "/logos/rpi.jpg",
    link: "https://www.rpi.edu/"
  }
];

export default function Education() {
  return (
    <section id="education">
      <h2>Education</h2>
      <div className="experience-list">
        {education.map((edu) => (
          <div key={edu.id} className="experience-item">
            <Image src={edu.logo} alt={`${edu.school} logo`} className="experience-logo" width={64} height={64} />
            <div className="experience-content">
              <div className="experience-header">
                {edu.link ? (
                  <a href={edu.link} target="_blank" rel="noopener noreferrer" className="experience-company" style={{ color: 'inherit', textDecoration: 'none' }}>{edu.school}</a>
                ) : (
                  <span className="experience-company">{edu.school}</span>
                )}
                <span className="experience-dates">{edu.date}</span>
              </div>
              <div className="experience-role">{edu.degree}</div>
              <div className="experience-desc text-muted" style={{fontFamily: 'monospace', fontSize: '0.85rem'}}>
                {edu.gpa}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
