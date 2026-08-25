import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { emptyState, loadState, saveState, sampleProjects } from "./storage";
import type { LineItem, Project, Quote, StudioState } from "./types";

type StudioContextValue = {
  state: StudioState;
  setCapital: (value: number) => void;
  setItems: (items: LineItem[]) => void;
  patchItem: (id: string, patch: Partial<LineItem>) => void;
  addProject: (project: Project) => void;
  moveProject: (id: string, status: Project["status"]) => void;
  addQuote: (quote: Quote) => void;
  addMessage: (role: "user" | "agent", text: string) => void;
  clearMessages: () => void;
  toggleCheck: (id: string) => void;
  loadSample: () => void;
  reset: () => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudioState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const value = useMemo<StudioContextValue>(
    () => ({
      state,
      setCapital: (capital) => setState((prev) => ({ ...prev, capital })),
      setItems: (items) => setState((prev) => ({ ...prev, items })),
      patchItem: (id, patch) =>
        setState((prev) => ({
          ...prev,
          items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addProject: (project) =>
        setState((prev) => ({ ...prev, projects: [project, ...prev.projects] })),
      moveProject: (id, status) =>
        setState((prev) => ({
          ...prev,
          projects: prev.projects.map((project) =>
            project.id === id ? { ...project, status } : project,
          ),
        })),
      addQuote: (quote) =>
        setState((prev) => ({ ...prev, quotes: [quote, ...prev.quotes] })),
      addMessage: (role, text) =>
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: `${role}-${Date.now()}-${prev.messages.length}`,
              role,
              text,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      clearMessages: () => setState((prev) => ({ ...prev, messages: [] })),
      toggleCheck: (id) =>
        setState((prev) => ({
          ...prev,
          checklist: { ...prev.checklist, [id]: !prev.checklist[id] },
        })),
      loadSample: () =>
        setState((prev) => ({
          ...prev,
          sampleLoaded: true,
          projects: sampleProjects(),
        })),
      reset: () => {
        window.localStorage.removeItem("lanyang-cloud-v1");
        setState(emptyState());
      },
    }),
    [state],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const value = useContext(StudioContext);
  if (!value) throw new Error("StudioProvider missing");
  return value;
}
