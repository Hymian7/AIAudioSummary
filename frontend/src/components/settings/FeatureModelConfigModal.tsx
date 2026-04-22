"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { LLMFeature, FeatureModelOverride, LLMProvider, ProviderInfo, BedrockModelInfo } from "@/lib/types";
import { LLM_FEATURE_LABELS } from "@/lib/types";
import { ProviderSelector } from "./ProviderSelector";
import { ModelSelector } from "./ModelSelector";
import { AzureConfigForm } from "./AzureConfigForm";
import { LangdockConfigForm } from "./LangdockConfigForm";
import { BedrockConfigForm } from "./BedrockConfigForm";
import { useApiKeys } from "@/hooks/useApiKeys";
import { listBedrockModels } from "@/lib/api";

interface FeatureModelConfigModalProps {
  feature: LLMFeature;
  override: FeatureModelOverride | null;
  defaultProvider: LLMProvider;
  defaultModel: string;
  providers: ProviderInfo[];
  onSave: (override: FeatureModelOverride | null) => void;
  children: ReactNode;
}

export function FeatureModelConfigModal({
  feature,
  override,
  defaultProvider,
  defaultModel,
  providers,
  onSave,
  children,
}: FeatureModelConfigModalProps) {
  const [open, setOpen] = useState(false);
  const { getAzureConfig, setAzureConfig, getLangdockConfig, setLangdockConfig, getBedrockConfig, setBedrockConfig } = useApiKeys();

  const [localProvider, setLocalProvider] = useState<LLMProvider>(
    override?.provider ?? defaultProvider,
  );
  const [localModel, setLocalModel] = useState<string>(override?.model ?? defaultModel);

  const handleOpenChange = (val: boolean) => {
    if (val) {
      const provider = override?.provider ?? defaultProvider;
      setLocalProvider(provider);
      const model = override?.model ?? defaultModel;
      // For Azure, ensure model is never empty — use deployment name as fallback
      if (provider === "azure_openai" && !model) {
        setLocalModel(getAzureConfig()?.deployment_name ?? "azure");
      } else {
        setLocalModel(model);
      }
    }
    setOpen(val);
  };

  const handleProviderChange = (provider: LLMProvider) => {
    setLocalProvider(provider);
    if (provider === "azure_openai") {
      setLocalModel(getAzureConfig()?.deployment_name ?? "azure");
    } else {
      const providerInfo = providers.find((p) => p.id === provider);
      setLocalModel(providerInfo?.models[0] ?? "");
    }
  };

  const handleSave = () => {
    const model = localProvider === "azure_openai"
      ? (getAzureConfig()?.deployment_name || localModel || "azure")
      : localModel;
    onSave({ provider: localProvider, model });
    setOpen(false);
  };

  const handleResetToDefault = () => {
    onSave(null);
    setOpen(false);
  };

  const currentProviderInfo = providers.find((p) => p.id === localProvider);

  // Dynamic Bedrock model discovery
  const [bedrockModels, setBedrockModels] = useState<string[]>([]);
  const bCfg = getBedrockConfig();

  useEffect(() => {
    if (localProvider !== "bedrock" || !bCfg?.aws_region || !bCfg?.aws_access_key_id || !bCfg?.aws_secret_access_key) {
      setBedrockModels([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const resp = await listBedrockModels({
          aws_region: bCfg.aws_region,
          aws_access_key_id: bCfg.aws_access_key_id,
          aws_secret_access_key: bCfg.aws_secret_access_key,
        });
        if (!cancelled && resp.models.length > 0) {
          setBedrockModels(resp.models.map((m: BedrockModelInfo) => m.model_id));
        }
      } catch { /* fallback to hardcoded */ }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [localProvider, bCfg?.aws_region, bCfg?.aws_access_key_id, bCfg?.aws_secret_access_key]);

  const effectiveModels = localProvider === "bedrock" && bedrockModels.length > 0
    ? bedrockModels
    : (currentProviderInfo?.models ?? []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[420px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Configure Model — {LLM_FEATURE_LABELS[feature]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <ProviderSelector
            providers={providers}
            selectedProvider={localProvider}
            onProviderChange={handleProviderChange}
          />

          {localProvider !== "azure_openai" ? (
            <ModelSelector
              models={effectiveModels}
              selectedModel={localModel}
              onModelChange={setLocalModel}
            />
          ) : null}

          {localProvider === "azure_openai" ? (
            <>
              <Separator />
              <AzureConfigForm
                config={getAzureConfig()}
                onConfigChange={setAzureConfig}
              />
            </>
          ) : null}

          {localProvider === "langdock" ? (
            <>
              <Separator />
              <LangdockConfigForm
                config={getLangdockConfig()}
                onConfigChange={setLangdockConfig}
              />
            </>
          ) : null}

          {localProvider === "bedrock" ? (
            <>
              <Separator />
              <BedrockConfigForm
                config={getBedrockConfig()}
                onConfigChange={setBedrockConfig}
              />
            </>
          ) : null}
        </div>

        <DialogFooter className="flex flex-row items-center gap-2">
          {override ? (
            <Button
              variant="ghost"
              size="sm"
              className="mr-auto text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleResetToDefault}
            >
              Reset to default
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
