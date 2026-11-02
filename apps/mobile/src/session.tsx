import { storyInput, type StoryInput } from "@wreckday/contracts";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";
import { Paths, Directory } from "expo-file-system";
const SessionContext = createContext<{
  token: string | null;
  ready: boolean;
  draft: StoryInput;
  setDraft: (draft: StoryInput) => void;
  save: (token: string | null) => Promise<void>;
}>({
  token: null,
  ready: false,
  draft: storyInput.parse({ template_slug: "seven-foot-fiancee" }),
  setDraft: () => {},
  save: async () => {},
});
// Web preview keeps tokens only in memory. Native persists via OS secure storage.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<StoryInput>(
    storyInput.parse({ template_slug: "seven-foot-fiancee" }),
  );
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const client = useQueryClient();
  useEffect(() => {
    if (Platform.OS === "web") {
      setReady(true);
      return;
    }
    SecureStore.getItemAsync("wreckday-dev-session")
      .then(setToken)
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);
  async function save(next: string | null) {
    if (Platform.OS !== "web") {
      if (next) await SecureStore.setItemAsync("wreckday-dev-session", next);
      else {
        await SecureStore.deleteItemAsync("wreckday-dev-session");
        const cache = new Directory(Paths.cache, "wreckday");
        if (cache.exists) cache.delete();
      }
    }
    client.clear();
    setToken(next);
  }
  return (
    <SessionContext.Provider value={{ token, ready, save, draft, setDraft }}>
      {children}
    </SessionContext.Provider>
  );
}
export const useSession = () => useContext(SessionContext);
