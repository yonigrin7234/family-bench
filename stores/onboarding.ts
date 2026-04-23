import { create } from 'zustand';

interface OnboardingState {
  // Step 1: State
  state: string;
  county: string;
  // Step 2: Court
  courtName: string;
  department: string;
  caseNumber: string;
  judgeName: string;
  // Step 3: Parties
  fullName: string;
  otherParentName: string;
  attorneyName: string;
  opposingAttorneyName: string;
  // Step 4: Children
  children: Array<{ name: string; dateOfBirth: string }>;
  // Step 5: Case assessment
  caseStage: string;
  conflictLevel: string;
  representationStatus: string;
  immediateNeeds: string[];

  setField: (field: string, value: any) => void;
  addChild: () => void;
  updateChild: (index: number, field: string, value: string) => void;
  removeChild: (index: number) => void;
  toggleNeed: (need: string) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  state: '',
  county: '',
  courtName: '',
  department: '',
  caseNumber: '',
  judgeName: '',
  fullName: '',
  otherParentName: '',
  attorneyName: '',
  opposingAttorneyName: '',
  children: [{ name: '', dateOfBirth: '' }],
  caseStage: '',
  conflictLevel: '',
  representationStatus: '',
  immediateNeeds: [],

  setField: (field, value) => set((s) => ({ ...s, [field]: value })),

  addChild: () =>
    set((s) => ({
      children: [...s.children, { name: '', dateOfBirth: '' }],
    })),

  updateChild: (index, field, value) =>
    set((s) => ({
      children: s.children.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    })),

  removeChild: (index) =>
    set((s) => ({
      children: s.children.filter((_, i) => i !== index),
    })),

  toggleNeed: (need) =>
    set((s) => ({
      immediateNeeds: s.immediateNeeds.includes(need)
        ? s.immediateNeeds.filter((n) => n !== need)
        : [...s.immediateNeeds, need],
    })),
}));
