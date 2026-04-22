"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiKeys } from "@/hooks/useApiKeys";
import type { BedrockConfig } from "@/lib/types";

interface BedrockConfigFormProps {
  config: BedrockConfig | null;
  onConfigChange: (config: BedrockConfig) => void;
}

export function BedrockConfigForm({
  config,
  onConfigChange,
}: BedrockConfigFormProps) {
  const { setBedrockConfig } = useApiKeys();
  const [values, setValues] = useState<BedrockConfig>(
    config ?? { aws_region: "us-east-1", aws_access_key_id: "", aws_secret_access_key: "" },
  );
  const [showSecret, setShowSecret] = useState(false);

  const handleChange = (field: keyof BedrockConfig, value: string) => {
    const updated = { ...values, [field]: value };
    setValues(updated);
    setBedrockConfig(updated);
    onConfigChange(updated);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground-secondary">
        AWS Bedrock Configuration
      </h3>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground-secondary">
          AWS Region
        </Label>
        <Input
          value={values.aws_region}
          onChange={(e) => handleChange("aws_region", e.target.value)}
          placeholder="e.g., us-east-1"
          className="bg-card-elevated"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground-secondary">
          Access Key ID
        </Label>
        <Input
          value={values.aws_access_key_id}
          onChange={(e) => handleChange("aws_access_key_id", e.target.value)}
          placeholder="AKIA..."
          className="bg-card-elevated"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground-secondary">
          Secret Access Key
        </Label>
        <div className="relative">
          <Input
            type={showSecret ? "text" : "password"}
            value={values.aws_secret_access_key}
            onChange={(e) => handleChange("aws_secret_access_key", e.target.value)}
            placeholder="Your secret access key"
            className="bg-card-elevated pr-10"
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
            aria-label={showSecret ? "Hide secret key" : "Show secret key"}
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
