const Card = ({ title, subtitle, children }) => (
  <section className="card">
    {title ? <h2 className="card-title">{title}</h2> : null}
    {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
    {children}
  </section>
);

export default Card;
