"use client";

import type { ReactNode } from "react";

type Base = { label: string; hint?: string };

function Row({ label, hint, children }: Base & { children: ReactNode }) {
  return (
    <label className="dv-row">
      <span className="dv-label">
        {label}
        {hint && <em>{hint}</em>}
      </span>
      {children}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="dv-section" open>
      <summary>{title}</summary>
      {children}
    </details>
  );
}

export function NumberKnob({
  value,
  onChange,
  min,
  max,
  step,
  ...base
}: Base & { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <Row {...base}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => Number.isFinite(e.target.valueAsNumber) && onChange(e.target.valueAsNumber)}
      />
    </Row>
  );
}

export function RangeKnob({
  value,
  onChange,
  min,
  max,
  step,
  ...base
}: Base & { value: number; onChange: (v: number) => void; min: number; max: number; step: number }) {
  return (
    <Row {...base}>
      <span className="dv-range">
        <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(e.target.valueAsNumber)} />
        <output>{value}</output>
      </span>
    </Row>
  );
}

export function TextKnob({ value, onChange, ...base }: Base & { value: string; onChange: (v: string) => void }) {
  return (
    <Row {...base}>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
    </Row>
  );
}

export function BoolKnob({ value, onChange, ...base }: Base & { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row {...base}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </Row>
  );
}

export function SelectKnob<T extends string>({
  value,
  options,
  onChange,
  ...base
}: Base & { value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <Row {...base}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Row>
  );
}

/** Number with an "auto"/"derived" toggle; `undefined` means auto. */
export function AutoNumberKnob({
  value,
  onChange,
  fallback,
  autoLabel = "auto",
  min,
  max,
  step,
  ...base
}: Base & {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  fallback: number;
  autoLabel?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const auto = value === undefined;
  return (
    <Row {...base}>
      <span className="dv-auto">
        <label>
          <input type="checkbox" checked={auto} onChange={(e) => onChange(e.target.checked ? undefined : fallback)} />
          {autoLabel}
        </label>
        <input
          type="number"
          disabled={auto}
          value={auto ? "" : value}
          placeholder={autoLabel}
          min={min}
          max={max}
          step={step}
          onChange={(e) => Number.isFinite(e.target.valueAsNumber) && onChange(e.target.valueAsNumber)}
        />
      </span>
    </Row>
  );
}

export function Locked({ label, value }: { label: string; value: string }) {
  return (
    <div className="dv-row">
      <span className="dv-label">
        {label}
        <em>locked</em>
      </span>
      <code>{value}</code>
    </div>
  );
}
