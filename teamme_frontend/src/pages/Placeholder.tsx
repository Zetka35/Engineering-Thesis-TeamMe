import React from "react";

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="page">
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">{title}</h2>
          <p className="card-subtitle">Widok w przygotowaniu.</p>
        </div>
        <div className="card-body">
          <p>Dodaj tutaj treść / komponenty dla tego modułu.</p>
        </div>
      </section>
    </div>
  );
}