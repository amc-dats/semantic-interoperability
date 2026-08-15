import type { DimensionId, Level } from "../types";

// Sourced from dimension_maturity_descriptors.md (Semantic Interoperability
// Roadmap figure: 5 dimensions x 5 maturity levels). Used to populate the
// short-/long-term target dropdowns so each option reads as level + label +
// descriptor, not just a bare number.
export interface DimensionLevelDescriptor {
  label: string;
  descriptor: string;
}

export const DIMENSION_MATURITY_DESCRIPTORS: Record<
  DimensionId,
  Record<Level, DimensionLevelDescriptor>
> = {
  technical: {
    1: { label: "Initial / Ad hoc", descriptor: "Ad hoc, point-to-point links; no baseline" },
    2: { label: "Emerging", descriptor: "Systems, protocols, identifiers, quality audited" },
    3: { label: "Defined", descriptor: "Quality validated at capture; query interface piloted" },
    4: { label: "Managed", descriptor: "Vertical federation live; legacy assets wrapped" },
    5: { label: "Optimised", descriptor: "Horizontal federation; self-adapting infrastructure" },
  },
  semantic: {
    1: { label: "Initial / Ad hoc", descriptor: "No shared ontology; local glossaries only" },
    2: { label: "Emerging", descriptor: "Domains scoped; top-level ontology selected" },
    3: { label: "Defined", descriptor: "Priority ontologies published; mappings validated" },
    4: { label: "Managed", descriptor: "Full OBDA across internal systems; query time reasoning live" },
    5: { label: "Optimised", descriptor: "Federated reasoning live across partners" },
  },
  organisational: {
    1: { label: "Initial / Ad hoc", descriptor: "Tacit knowledge only; no defined ownership" },
    2: { label: "Emerging", descriptor: "Ownership emerging; informal stewardship" },
    3: {
      label: "Defined",
      descriptor: "Owners and stewards designated for key domains; tacit knowledge externalised for priority domains",
    },
    4: { label: "Managed", descriptor: "Stewardship actively governed and reviewed" },
    5: { label: "Optimised", descriptor: "Ownership a living asset; succession planned" },
  },
  cultural: {
    1: { label: "Initial / Ad hoc", descriptor: "Data dialects persist; manual reconciliation" },
    2: { label: "Emerging", descriptor: "Pain points logged; foundational training begun" },
    3: { label: "Defined", descriptor: "Shared glossary published; pilot adoption evidenced" },
    4: { label: "Managed", descriptor: "Semantic layer routine; embedded in onboarding" },
    5: { label: "Optimised", descriptor: "Ontology-first culture embedded with partners" },
  },
  strategic_governance: {
    1: { label: "Initial / Ad hoc", descriptor: "No governance or data-sharing policy" },
    2: { label: "Emerging", descriptor: "Governance and risk awareness emerging" },
    3: {
      label: "Defined",
      descriptor: "Access policies enforced intra-organisationally; ontology-first strategy adopted",
    },
    4: { label: "Managed", descriptor: "Sovereignty in place; vertical federation active; procurement gate active" },
    5: { label: "Optimised", descriptor: "Federate with partners; governance assured and reviewed" },
  },
};
