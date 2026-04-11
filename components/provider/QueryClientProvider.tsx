"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientContext,
  QueryClientProvider as TanstackQueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";

type QueryClientProviderProps = {
  client?: QueryClient;
  children?: React.ReactNode;
};

function QueryClientProvider({ client, children }: QueryClientProviderProps) {
  const [internalClient] = React.useState(() => new QueryClient());
  const queryClient = client ?? internalClient;
  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  );
}

export { QueryClientContext, QueryClientProvider, type QueryClientProviderProps, useQueryClient };
