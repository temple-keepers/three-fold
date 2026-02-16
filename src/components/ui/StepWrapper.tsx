'use client';

import { useState, useEffect } from 'react';

interface StepWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function StepWrapper({ title, subtitle, children }: StepWrapperProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  return (
    <div
      className="py-2 px-1 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
      }}
    >
      <h2
        className="text-3xl font-medium mb-1.5"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)', lineHeight: 1.2 }}
      >
        {title}
      </h2>
      <p
        className="text-base mb-7"
        style={{ fontFamily: 'Source Sans 3, sans-serif', color: 'var(--text-muted)', lineHeight: 1.5 }}
      >
        {subtitle}
      </p>
      {children}
    </div>
  );
}
