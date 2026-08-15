import type { BusinessContext, WordingVariant } from "../types";
import {
  GEOGRAPHIC_REACH,
  INDUSTRY_SECTOR,
  OT_ESTATE_AGE_DIVERSITY,
  PORTFOLIO_RANGE,
  PRODUCTS_OR_SERVICES,
  REGULATORY_ENVIRONMENT,
  SITE_STRUCTURE,
  SIZE_HEADCOUNT_BAND,
  WORDING_VARIANT_OPTIONS,
} from "../data/businessContextOptions";

interface Props {
  value: BusinessContext;
  onChange: (value: BusinessContext) => void;
  wordingVariant: WordingVariant;
  onWordingVariantChange: (v: WordingVariant) => void;
  onNext: () => void;
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: readonly string[];
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      >
        <option value="">Prefer not to say</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function BusinessContextScreen({
  value,
  onChange,
  wordingVariant,
  onWordingVariantChange,
  onNext,
}: Props) {
  const set = <K extends keyof BusinessContext>(key: K, v: BusinessContext[K]) =>
    onChange({ ...value, [key]: v });

  const toggleRegulatory = (option: string) => {
    const has = value.regulatoryEnvironment.includes(option);
    const next = has
      ? value.regulatoryEnvironment.filter((o) => o !== option)
      : [...value.regulatoryEnvironment, option];
    set("regulatoryEnvironment", next);
  };

  return (
    <div className="card">
      <div className="eyebrow">Step 1 of 3</div>
      <h1>Business context</h1>
      <p className="lede">
        A little context helps us interpret and compare results. All fields are
        optional — skip anything you'd rather not answer.
      </p>

      <div className="section-heading">Products or services</div>
      <Select
        label="Does your organisation primarily provide products, services, or both?"
        value={value.productsOrServices}
        options={PRODUCTS_OR_SERVICES}
        onChange={(v) => set("productsOrServices", v)}
      />

      <div className="section-heading">Industry or sector</div>
      <Select
        label="Which industry or sector best describes your organisation?"
        value={value.industrySector}
        options={INDUSTRY_SECTOR}
        onChange={(v) => set("industrySector", v)}
      />
      {value.industrySector === "Other" && (
        <div className="field">
          <label className="field-label">Please specify</label>
          <input
            type="text"
            value={value.industrySectorOther ?? ""}
            onChange={(e) => set("industrySectorOther", e.target.value)}
          />
        </div>
      )}

      <div className="section-heading">Organisational structure</div>
      <div className="field-group">
        <Select
          label="Site structure"
          value={value.siteStructure}
          options={SITE_STRUCTURE}
          onChange={(v) => set("siteStructure", v)}
        />
        <Select
          label="Geographic reach"
          value={value.geographicReach}
          options={GEOGRAPHIC_REACH}
          onChange={(v) => set("geographicReach", v)}
        />
      </div>
      <Select
        label="Portfolio range"
        value={value.portfolioRange}
        options={PORTFOLIO_RANGE}
        onChange={(v) => set("portfolioRange", v)}
      />

      <div className="section-heading">Regulatory environment</div>
      <p className="field-hint" style={{ marginBottom: 8 }}>
        Select all that apply.
      </p>
      {REGULATORY_ENVIRONMENT.map((option) => (
        <label className="checkbox-row" key={option}>
          <input
            type="checkbox"
            checked={value.regulatoryEnvironment.includes(option)}
            onChange={() => toggleRegulatory(option)}
          />
          <span>{option}</span>
        </label>
      ))}
      {value.regulatoryEnvironment.includes("Other") && (
        <div className="field">
          <label className="field-label">Please specify</label>
          <input
            type="text"
            value={value.regulatoryEnvironmentOther ?? ""}
            onChange={(e) => set("regulatoryEnvironmentOther", e.target.value)}
          />
        </div>
      )}

      <div className="section-heading">Organisation profile</div>
      <div className="field-group">
        <Select
          label="OT estate age / diversity"
          value={value.otEstateAgeDiversity}
          options={OT_ESTATE_AGE_DIVERSITY}
          onChange={(v) => set("otEstateAgeDiversity", v)}
        />
        <Select
          label="Size (headcount band)"
          value={value.sizeHeadcountBand}
          options={SIZE_HEADCOUNT_BAND}
          onChange={(v) => set("sizeHeadcountBand", v)}
        />
      </div>

      <div className="section-heading">How would you like the assessment worded?</div>
      <p className="field-hint" style={{ marginBottom: 8 }}>
        This only changes how questions and answer options are worded — it
        doesn't affect scoring.
      </p>
      {WORDING_VARIANT_OPTIONS.map((option) => (
        <label className="radio-row" key={option.value}>
          <input
            type="radio"
            name="wordingVariant"
            checked={wordingVariant === option.value}
            onChange={() => onWordingVariantChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}

      <div className="actions-row">
        <button className="btn btn-primary" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
