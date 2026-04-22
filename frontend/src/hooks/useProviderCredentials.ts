"use client";

import { useCallback } from "react";
import { useApiKeys } from "./useApiKeys";
import type { LLMProvider, ProviderCredentials } from "@/lib/types";

export function useProviderCredentials() {
  const { getKey, getAzureConfig, getLangdockConfig, getBedrockConfig } = useApiKeys();

  const getCredentials = useCallback(
    (provider: LLMProvider, model: string): ProviderCredentials => {
      return {
        provider,
        model,
        api_key: provider === "bedrock" ? "" : getKey(provider),
        azure_config: provider === "azure_openai" ? getAzureConfig() : undefined,
        langdock_config: provider === "langdock" ? getLangdockConfig() : undefined,
        bedrock_config: provider === "bedrock" ? getBedrockConfig() ?? undefined : undefined,
      };
    },
    [getKey, getAzureConfig, getLangdockConfig, getBedrockConfig],
  );

  return { getCredentials };
}
