import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
} from "react";
import {
  createDraft,
  reducer,
  type Action,
  type Draft,
} from "./composer-model";
import { clearAssets } from "./local-images";
import { generateStory } from "./generation-client";
const Context = createContext<{
  draft: Draft;
  dispatch: Dispatch<Action>;
  clear: () => Promise<void>;
  clearing: boolean;
  generating: boolean;
  generationError: unknown;
  generate: () => Promise<void>;
} | null>(null);
export function ComposerProvider({ children }: { children: ReactNode }) {
  const [draft, rawDispatch] = useReducer(reducer, undefined, () =>
    createDraft(),
  );
  const [clearing, setClearing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<unknown>(null);
  const controller = useRef<AbortController | null>(null);
  function cancel() {
    controller.current?.abort();
    controller.current = null;
    setGenerating(false);
    setGenerationError(null);
  }
  function dispatch(action: Action) {
    if (["package", "brief", "photo", "clear"].includes(action.type)) cancel();
    rawDispatch(action);
  }
  async function clear() {
    cancel();
    setClearing(true);
    try {
      await clearAssets();
      rawDispatch({ type: "clear" });
    } finally {
      setClearing(false);
    }
  }
  async function generate() {
    if (controller.current) return;
    const active = new AbortController();
    controller.current = active;
    setGenerating(true);
    setGenerationError(null);
    const timeout = setTimeout(() => active.abort(), 20 * 60 * 1000);
    try {
      const result = await generateStory(draft, active.signal);
      if (controller.current === active)
        rawDispatch({ type: "result", scenes: result.scenes });
    } catch (error) {
      if (controller.current === active)
        setGenerationError(
          active.signal.aborted
            ? new Error(
                "Generation timed out. Provider work may still complete and incur a charge. No automatic retry was made.",
              )
            : error,
        );
    } finally {
      clearTimeout(timeout);
      if (controller.current === active) {
        controller.current = null;
        setGenerating(false);
      }
    }
  }
  return (
    <Context.Provider
      value={{
        draft,
        dispatch,
        clear,
        clearing,
        generating,
        generationError,
        generate,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useComposer() {
  const context = useContext(Context);
  if (!context) throw new Error("ComposerProvider is required");
  return context;
}
