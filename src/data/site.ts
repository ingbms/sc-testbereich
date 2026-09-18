export const site = {
  name: 'Smiling Relations',
  email: 'dialog@smiling-relations.de',
  phone: '+49 163 970 33 14',
  owner: 'Birgit Groddeck',
};
export const url = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
export const emailLink = (subject = 'Anfrage an Smiling Relations', body = '') =>
  `mailto:${site.email}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
export const offers = [
  { slug: 'fuehrung', title: 'Führung', summary: 'Authentisch führen. Menschen stärken. Wirkung entfalten.', image: 'HU/1000196355.jpg', position: '46% center', eyebrow: 'Klarheit. Vertrauen. Wirkung.', intro: 'Führung beginnt mit der eigenen Haltung. In der Begegnung mit Pferden wird erlebbar, wie du Orientierung gibst, Vertrauen aufbaust und mit Klarheit handelst.',
    sections: [
      { title: 'Die eigene Wirkung erkennen', text: 'Wie kommen deine Signale an? Praktische Übungen machen Körpersprache, Präsenz und Kommunikation sichtbar. Du erhältst Raum, Gewohntes zu hinterfragen und neue Handlungsweisen auszuprobieren.' },
      { title: 'Klar führen, in Verbindung bleiben', text: 'Bestimmtheit und Einfühlungsvermögen gehören zusammen. Wir arbeiten daran, Ziele verständlich zu vermitteln, Grenzen zu setzen und zugleich aufmerksam für das Gegenüber zu bleiben.' },
      { title: 'Erkenntnisse in den Alltag mitnehmen', text: 'Gemeinsam reflektieren wir die Erfahrungen und übersetzen sie in konkrete Schritte für deine Führungsaufgaben. Das Training richtet sich an erfahrene und angehende Führungskräfte.' },
    ], outcomes: ['Die eigene Körpersprache bewusster einsetzen', 'Vertrauen und Orientierung geben', 'Auch in unsicheren Situationen handlungsfähig bleiben'] },
  { slug: 'teams', title: 'Teams', summary: 'Zusammen wachsen. Vertrauen leben. Gemeinsam mehr erreichen.', image: 'HU/1000196357.jpg', position: '50% center', eyebrow: 'Miteinander wird mehr möglich.', intro: 'Gute Zusammenarbeit braucht klare Verständigung, gegenseitiges Vertrauen und Raum für unterschiedliche Stärken. Gemeinsame Aufgaben mit Pferden machen das Zusammenspiel im Team erlebbar.',
    sections: [
      { title: 'Muster gemeinsam entdecken', text: 'Wer übernimmt Führung? Wer beobachtet, wer bringt neue Ideen ein? In gemeinsamen Aufgaben werden Rollen und Abstimmungsprozesse sichtbar, ohne den üblichen Arbeitsalltag nachzustellen.' },
      { title: 'Kooperation praktisch erleben', text: 'Beim Planen und Bewältigen gemeinsamer Aufgaben kommt es auf Zuhören, klare Signale und gegenseitige Unterstützung an. Die Übungen eröffnen einen anderen Blick auf die Zusammenarbeit.' },
      { title: 'Vereinbarungen für den Alltag', text: 'In der gemeinsamen Reflexion verbinden wir die Erlebnisse mit euren Fragen. Daraus entstehen konkrete Impulse für Feedback, Verantwortungsübernahme und ein wertschätzendes Miteinander.' },
    ], outcomes: ['Rollen und Stärken im Team verstehen', 'Absprachen bewusster gestalten', 'Vertrauen durch gemeinsame Erfahrung entwickeln'] },
  { slug: 'persoenlichkeit-beziehungen', title: 'Beziehungen & Persönlichkeit', summary: 'Sich selbst besser verstehen. Echte Verbindungen leben. Mit Klarheit handeln.', image: 'HU/1000196339.jpg', position: 'center', eyebrow: 'Bei dir ankommen. Anderen begegnen.', intro: 'Wie zeigst du dich? Was brauchst du, um in Verbindung zu bleiben? Die Arbeit mit Pferden bietet einen unmittelbaren Erfahrungsraum für Selbstwahrnehmung, Grenzen und persönliche Entwicklung.',
    sections: [
      { title: 'Sich selbst bewusster wahrnehmen', text: 'Im Kontakt mit dem Pferd kannst du deine Haltung, Körpersprache und Reaktionen erkunden. Beobachten und Ausprobieren helfen, die eigene Wirkung besser zu verstehen.' },
      { title: 'Nähe und Grenzen gestalten', text: 'Aufmerksam für andere zu sein und die eigenen Bedürfnisse ernst zu nehmen, lässt sich miteinander verbinden. Wir arbeiten an klarer Kommunikation und einem respektvollen Umgang.' },
      { title: 'Neue Möglichkeiten erproben', text: 'Du bestimmst dein Anliegen. Gemeinsam reflektieren wir die Erfahrungen und entwickeln daraus Schritte, die zu dir und deinen Beziehungen im privaten oder beruflichen Alltag passen.' },
    ], outcomes: ['Eigene Bedürfnisse und Grenzen klarer erkennen', 'Körpersprache und Ausdruck wahrnehmen', 'Beziehungen aufmerksam und wertschätzend gestalten'] },
];
