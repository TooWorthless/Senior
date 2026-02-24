import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import "./styles/base.css";
import App from "./App.tsx";

// TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30 сек — данные "свежие"
      gcTime: 5 * 60_000,      // 5 мин — держать в памяти после unmount
      retry: 1,                // 1 retry при ошибке
      refetchOnWindowFocus: false,
    },
  },
});

// Apollo Client для GraphQL (Rick & Morty public API)
const apolloClient = new ApolloClient({
  uri: "https://rickandmortyapi.com/graphql",
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          characters: {
            // Merge policy для pagination
            keyArgs: ["filter"],
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-first" },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ApolloProvider>
  </StrictMode>
);
