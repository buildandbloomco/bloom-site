"use client";

import type { ComponentType } from "react";
import type { ToolProps } from "./bits";
import { BloomCheck, CapacityCheck } from "./Checks";
import { Caseload, Pricing } from "./Numbers";
import { CeoReview, NinetyDay, RightYes } from "./Strategy";
import { Agreements, Conversation, Onboarding, Roles, SopBuilder } from "./Ops";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOOL_VIEWS: Record<string, ComponentType<ToolProps<any>>> = {
  "bloom-check": BloomCheck,
  "capacity-check": CapacityCheck,
  "ninety-day": NinetyDay,
  "right-yes": RightYes,
  "ceo-review": CeoReview,
  pricing: Pricing,
  sop: SopBuilder,
  onboarding: Onboarding,
  roles: Roles,
  agreements: Agreements,
  conversation: Conversation,
  caseload: Caseload,
};
