import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "../src/session";
import { StatusBar } from "expo-status-bar";
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10000 },
    mutations: { retry: false },
  },
});
export default function Layout() {
  return (
    <QueryClientProvider client={client}>
      <SessionProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#101713" },
          }}
        />
      </SessionProvider>
    </QueryClientProvider>
  );
}
