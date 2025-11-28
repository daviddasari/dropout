import { RiskLevel } from "@/types";
import { Badge } from "@/components/ui/badge";

interface RiskBadgeProps {
  level: RiskLevel;
}

export const RiskBadge = ({ level }: RiskBadgeProps) => {
  const variant =
    level === "Low" ? "success" : level === "Medium" ? "warning" : "danger";

  return (
    <Badge variant={variant} className="font-medium">
      {level} Risk
    </Badge>
  );
};
